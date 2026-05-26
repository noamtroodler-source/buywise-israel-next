// BuyWise Intel — RSS ingestion edge function
// Runs hourly via pg_cron. Fetches enabled sources, dedupes by URL,
// categorizes + scores, extracts hero image URLs (we never download the
// image — only store the source's hot-link URL per zero-storage policy).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { parseFeed } from "https://deno.land/x/rss@1.0.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------
// Categorization + relevance scoring
// ---------------------------------------------------------------

type Category =
  | "property-market"
  | "mortgage-rates"
  | "tax-legal"
  | "city-spotlight"
  | "new-developments"
  | "macro-economy"
  | "aliyah-immigration"
  | "policy-regulation"
  | "general";

const CATEGORY_KEYWORDS: Record<Category, { en: string[]; he: string[] }> = {
  "property-market": {
    en: ["home prices", "apartment", "real estate", "housing market", "property prices", "price index", "rental", "tenant", "landlord", "yield"],
    he: ["מחירי דירות", "שוק הדיור", "נדל\"ן", "שכירות", "דירה", "תשואה"],
  },
  "mortgage-rates": {
    en: ["mortgage", "interest rate", "bank of israel", "boi", "prime rate", "ltv", "loan-to-value"],
    he: ["משכנתא", "ריבית", "בנק ישראל", "הפריים"],
  },
  "tax-legal": {
    en: ["tax", "purchase tax", "capital gains", "betterment", "stamp duty", "tax authority", "vat"],
    he: ["מס רכישה", "מס שבח", "רשות המסים", "מע\"מ", "מיסוי"],
  },
  "city-spotlight": {
    en: ["tel aviv", "jerusalem", "haifa", "netanya", "herzliya", "ra'anana", "raanana", "modi'in", "modiin", "beit shemesh", "ashdod", "ashkelon", "beer sheva", "efrat", "givat shmuel", "petah tikva", "hadera", "caesarea", "ramat gan", "kfar saba", "hod hasharon"],
    he: ["תל אביב", "ירושלים", "חיפה", "נתניה", "הרצליה", "רעננה", "מודיעין", "בית שמש", "אשדוד", "אשקלון", "באר שבע", "אפרת", "גבעת שמואל", "פתח תקווה", "חדרה", "קיסריה", "רמת גן", "כפר סבא", "הוד השרון"],
  },
  "new-developments": {
    en: ["new project", "tama 38", "urban renewal", "construction", "developer", "pre-sale", "high-rise"],
    he: ["תמ\"א 38", "פינוי בינוי", "התחדשות עירונית", "בנייה חדשה", "יזם", "פרויקט חדש"],
  },
  "macro-economy": {
    en: ["inflation", "shekel", "gdp", "unemployment", "central bank", "exchange rate", "cpi"],
    he: ["אינפלציה", "שקל", "מדד המחירים", "תוצר", "אבטלה"],
  },
  "aliyah-immigration": {
    en: ["aliyah", "olim", "new immigrant", "oleh", "nefesh b'nefesh", "diaspora", "jewish agency"],
    he: ["עלייה", "עולים", "עולה חדש", "נפש בנפש", "הסוכנות היהודית"],
  },
  "policy-regulation": {
    en: ["regulation", "zoning", "knesset", "ministry of housing", "rmi", "land authority", "policy"],
    he: ["רגולציה", "תב\"ע", "כנסת", "משרד השיכון", "רמ\"י", "מדיניות"],
  },
  general: { en: [], he: [] },
};

const HIGH_VALUE_KEYWORDS = [
  "price drop", "interest rate cut", "rate hike", "tax change", "new tax",
  "ירידת מחירים", "העלאת ריבית", "הורדת ריבית", "שינוי מס",
];

function categorize(text: string, language: string): Category {
  const lower = text.toLowerCase();
  let best: Category = "general";
  let bestScore = 0;
  for (const [cat, kw] of Object.entries(CATEGORY_KEYWORDS) as [Category, { en: string[]; he: string[] }][]) {
    if (cat === "general") continue;
    const list = language === "he" ? kw.he : kw.en;
    let score = 0;
    for (const k of list) {
      if (lower.includes(k.toLowerCase())) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  return best;
}

function scoreRelevance(headline: string, excerpt: string, category: Category, tier: number, publishedAt: Date): number {
  const text = `${headline} ${excerpt}`.toLowerCase();
  let score = 3;
  if (category !== "general") score = 4;
  for (const k of HIGH_VALUE_KEYWORDS) {
    if (text.includes(k.toLowerCase())) {
      score = 5;
      break;
    }
  }
  if (tier === 2) score = Math.max(1, score - 1);
  const ageHours = (Date.now() - publishedAt.getTime()) / 36e5;
  if (ageHours > 72) score = Math.max(1, score - 1);
  return Math.max(1, Math.min(5, score));
}

function stripHtml(s: string): string {
  return s
    // Drop script/style blocks entirely
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    // Strip well-formed tags
    .replace(/<[^>]*>/g, "")
    // Strip dangling/unclosed tag fragments like "<img align='right' src='https://..."
    .replace(/<[a-z!\/][^<]*$/i, "")
    // Strip stray attribute leftovers e.g. "align='right' src='..."
    .replace(/\b(?:align|src|href|width|height|style|class)\s*=\s*(['"])[^'"]*\1/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function firstTwoSentences(s: string): string {
  const clean = stripHtml(s);
  if (!clean) return "";
  // Guard: if anything still looks like markup, drop it
  if (/[<>]/.test(clean)) return "";
  const parts = clean.match(/[^.!?]+[.!?]+/g);
  if (!parts || parts.length === 0) return clean.slice(0, 240);
  return parts.slice(0, 2).join(" ").trim().slice(0, 280);
}

/** Extract a hero image URL from an RSS item. Tries (in order):
 *  enclosure, media:content, media:thumbnail, first <img> in description/content. */
function extractImageUrl(item: any, rawDescription: string): string | null {
  // 1. enclosure (standard RSS 2.0)
  const enclosures = item.attachments ?? item.enclosures ?? [];
  for (const a of enclosures) {
    const url = a?.url ?? a?.href;
    const type = a?.mimeType ?? a?.type ?? "";
    if (url && (type.startsWith("image/") || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url))) {
      return url;
    }
  }
  // 2. media:content / media:thumbnail (Yedioth, Calcalist, Globes typically)
  const mediaContent = item["media:content"] ?? item.mediaContent;
  if (mediaContent) {
    const arr = Array.isArray(mediaContent) ? mediaContent : [mediaContent];
    for (const m of arr) {
      const u = m?.url ?? m?.["@_url"] ?? m?.attributes?.url;
      if (u) return u;
    }
  }
  const mediaThumb = item["media:thumbnail"] ?? item.mediaThumbnails;
  if (mediaThumb) {
    const arr = Array.isArray(mediaThumb) ? mediaThumb : [mediaThumb];
    for (const m of arr) {
      const u = m?.url ?? m?.["@_url"] ?? m?.attributes?.url;
      if (u) return u;
    }
  }
  // 3. First <img> in description / content HTML
  const html = rawDescription || "";
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m?.[1]) return m[1];
  return null;
}

// ---------------------------------------------------------------
// Fetch + parse a single source
// ---------------------------------------------------------------

async function fetchSource(supabase: ReturnType<typeof createClient>, source: {
  id: string;
  name: string;
  url: string;
  language: string;
  tier: number;
}) {
  let added = 0;
  let error: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: { "User-Agent": "BuyWiseIsrael/1.0 (+https://buywiseisrael.com)" },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const feed = await parseFeed(xml);

    const items = feed.entries ?? [];
    for (const item of items) {
      const url = item.links?.[0]?.href ?? item.id;
      if (!url) continue;
      const headline = stripHtml(item.title?.value ?? "");
      if (!headline) continue;
      const rawExcerpt =
        item.description?.value ??
        // @ts-ignore — content varies by feed
        item.content?.value ?? "";
      const excerpt = firstTwoSentences(rawExcerpt);
      const publishedAt = item.published ?? item.updated ?? new Date();
      const category = categorize(`${headline} ${excerpt}`, source.language);
      const relevance = scoreRelevance(headline, excerpt, category, source.tier, new Date(publishedAt));
      const imageUrl = extractImageUrl(item as any, rawExcerpt);

      const { error: insertErr } = await supabase
        .from("intel_articles")
        .insert({
          source_id: source.id,
          source_name: source.name,
          source_language: source.language,
          source_tier: source.tier,
          headline,
          excerpt: excerpt || null,
          url,
          image_url: imageUrl,
          published_at: publishedAt,
          category,
          relevance_score: relevance,
        });

      if (!insertErr) {
        added++;
      } else if (insertErr.message?.includes("duplicate") || insertErr.message?.includes("unique")) {
        // Backfill: if we already had this article without an image, add it now.
        if (imageUrl) {
          await supabase
            .from("intel_articles")
            .update({ image_url: imageUrl })
            .eq("url", url)
            .is("image_url", null);
        }
      } else {
        console.error(`[${source.name}] insert error:`, insertErr.message);
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error(`[${source.name}] fetch error:`, error);
  }

  await supabase
    .from("intel_sources")
    .update({ last_fetched_at: new Date().toISOString(), last_error: error })
    .eq("id", source.id);

  await supabase.from("intel_fetch_log").insert({
    source_id: source.id,
    source_name: source.name,
    articles_added: added,
    error,
  });

  return { source: source.name, added, error };
}

// ---------------------------------------------------------------
// Handler
// ---------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    // Optional: ?source_id=xxx to fetch a single source
    const url = new URL(req.url);
    const singleId = url.searchParams.get("source_id");

    let query = supabase.from("intel_sources").select("id,name,url,language,tier").eq("enabled", true);
    if (singleId) query = query.eq("id", singleId);

    const { data: sources, error } = await query;
    if (error) throw error;

    const results = [];
    for (const s of (sources ?? []) as any[]) {
      const r = await fetchSource(supabase, s);
      results.push(r);
    }

    const totalAdded = results.reduce((sum, r) => sum + r.added, 0);

    return new Response(
      JSON.stringify({ ok: true, sources_processed: results.length, articles_added: totalAdded, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
