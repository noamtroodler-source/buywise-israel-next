// BuyWise Intel — RSS ingestion edge function
// Runs hourly via pg_cron. Fetches enabled sources, dedupes by URL,
// enriches (translates Hebrew + AI categorizes + scores) via Lovable AI,
// runs cross-source dedup against the last 48h, and stores hero image URLs.
// Zero-storage policy: image URLs are hot-linked, never downloaded.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { parseFeed } from "https://deno.land/x/rss@1.0.0/mod.ts";
import {
  enrichArticle, jaccardSimilarity, draftBreakdown, classifyDeepRead, draftDeepRead, deepReadToBody,
  type IntelCategory,
} from "../_shared/intel-ai.ts";

// Per-cycle Deep Read cap. Live shelf cap also enforced at write time.
const DEEP_READ_PER_CYCLE_MAX = 2;
const DEEP_READ_LIVE_CAP = 5;
const DEEP_READ_LIVE_WINDOW_DAYS = 14;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------
// Keyword fallback categorization (used when AI fails)
// ---------------------------------------------------------------

const CATEGORY_KEYWORDS: Record<IntelCategory, { en: string[]; he: string[] }> = {
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

function keywordCategorize(text: string, language: string): IntelCategory {
  const lower = text.toLowerCase();
  let best: IntelCategory = "general";
  let bestScore = 0;
  for (const [cat, kw] of Object.entries(CATEGORY_KEYWORDS) as [IntelCategory, { en: string[]; he: string[] }][]) {
    if (cat === "general") continue;
    const list = language === "he" ? kw.he : kw.en;
    let score = 0;
    for (const k of list) if (lower.includes(k.toLowerCase())) score++;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

function stripHtml(s: string): string {
  return s
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/<[a-z!\/][^<]*$/i, "")
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
  if (/[<>]/.test(clean)) return "";
  const parts = clean.match(/[^.!?]+[.!?]+/g);
  if (!parts || parts.length === 0) return clean.slice(0, 240);
  return parts.slice(0, 2).join(" ").trim().slice(0, 280);
}

function extractImageUrl(item: any, rawDescription: string): string | null {
  const enclosures = item.attachments ?? item.enclosures ?? [];
  for (const a of enclosures) {
    const url = a?.url ?? a?.href;
    const type = a?.mimeType ?? a?.type ?? "";
    if (url && (type.startsWith("image/") || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url))) return url;
  }
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
  const html = rawDescription || "";
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m?.[1]) return m[1];
  return null;
}

function buildRawImageMap(xml: string): Map<string, string> {
  const map = new Map<string, string>();
  const itemRe = /<(item|entry)\b[\s\S]*?<\/\1>/gi;
  const matches = xml.match(itemRe) ?? [];
  for (const block of matches) {
    let link: string | null = null;
    const linkText = block.match(/<link[^>]*>\s*<!\[CDATA\[([^\]]+)\]\]>\s*<\/link>/i)
      ?? block.match(/<link[^>]*>([^<\s]+)<\/link>/i);
    if (linkText?.[1]) link = linkText[1].trim();
    if (!link) {
      const atom = block.match(/<link[^>]+href=["']([^"']+)["']/i);
      if (atom?.[1]) link = atom[1].trim();
    }
    if (!link) continue;
    let img: string | null = null;
    const enclosure = block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image\//i)
      ?? block.match(/<enclosure[^>]+type=["']image\/[^"']+["'][^>]*url=["']([^"']+)["']/i)
      ?? block.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpe?g|png|webp|gif)(?:\?[^"']*)?)["']/i);
    if (enclosure?.[1]) img = enclosure[1];
    if (!img) {
      const mc = block.match(/<media:content[^>]+url=["']([^"']+)["']/i)
        ?? block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
      if (mc?.[1]) img = mc[1];
    }
    if (!img) {
      const inline = block.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (inline?.[1]) img = inline[1];
    }
    if (img) map.set(link, img);
  }
  return map;
}

// ---------------------------------------------------------------
// Cross-source dedup (Jaccard ≥ 0.6 inside a 48h, same-category window)
// ---------------------------------------------------------------

interface DedupCandidate {
  id: string;
  headline_en: string | null;
  headline: string;
  source_tier: number;
  dedup_group_id: string | null;
}

async function findDuplicateGroup(
  supabase: any,
  newHeadlineEn: string,
  category: IntelCategory,
  publishedAt: Date,
): Promise<{ groupId: string | null; isLowerTierThanExisting: boolean }> {
  const since = new Date(publishedAt.getTime() - 48 * 3600 * 1000).toISOString();
  const until = new Date(publishedAt.getTime() + 48 * 3600 * 1000).toISOString();

  const { data: candidates } = await supabase
    .from("intel_articles")
    .select("id, headline, headline_en, source_tier, dedup_group_id")
    .eq("category", category)
    .gte("published_at", since)
    .lte("published_at", until)
    .limit(60);

  if (!candidates || candidates.length === 0) return { groupId: null, isLowerTierThanExisting: false };

  let best: { row: DedupCandidate; score: number } | null = null;
  for (const c of candidates as DedupCandidate[]) {
    const other = c.headline_en || c.headline;
    const score = jaccardSimilarity(newHeadlineEn, other);
    if (score >= 0.6 && (!best || score > best.score)) best = { row: c, score };
  }
  if (!best) return { groupId: null, isLowerTierThanExisting: false };
  return {
    groupId: best.row.dedup_group_id ?? best.row.id, // reuse existing group or seed with first article's id
    isLowerTierThanExisting: false, // refined by caller
  };
}

// ---------------------------------------------------------------
// Fetch + parse a single source
// ---------------------------------------------------------------

async function fetchSource(supabase: any, source: {
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
    const rawImageMap = buildRawImageMap(xml);

    const items = feed.entries ?? [];
    for (const item of items) {
      const url = item.links?.[0]?.href ?? item.id;
      if (!url) continue;
      const headline = stripHtml(item.title?.value ?? "");
      if (!headline) continue;

      // Quick skip: if URL already exists, only top up missing image and move on.
      const { data: existing } = await supabase
        .from("intel_articles")
        .select("id, image_url")
        .eq("url", url)
        .maybeSingle();

      const rawExcerpt =
        item.description?.value ??
        // @ts-ignore content varies by feed
        item.content?.value ?? "";
      const excerpt = firstTwoSentences(rawExcerpt);
      const publishedAt = item.published ?? item.updated ?? new Date();

      // --- Age gate: only ingest articles from the last 48 hours (matches cron cadence) ---
      const ageMs = Date.now() - new Date(publishedAt).getTime();
      if (ageMs > 48 * 60 * 60 * 1000) continue;

      const imageUrl =
        extractImageUrl(item as any, rawExcerpt) ??
        rawImageMap.get(url) ??
        null;

      if (existing) {
        if (imageUrl && !existing.image_url) {
          await supabase.from("intel_articles").update({ image_url: imageUrl }).eq("id", existing.id);
        }
        continue;
      }

      // --- AI enrichment (translate + categorize + score) ---
      const enriched = await enrichArticle({
        headline,
        excerpt: excerpt || null,
        language: source.language as "en" | "he",
      });

      const category: IntelCategory = enriched?.category ?? keywordCategorize(`${headline} ${excerpt}`, source.language);
      const categoryConfidence = enriched?.category_confidence ?? null;
      const headlineEn = enriched?.headline_en ?? (source.language === "en" ? headline : null);
      const excerptEn = enriched?.excerpt_en ?? (source.language === "en" ? (excerpt || null) : null);
      const translatedAt = enriched ? new Date().toISOString() : null;
      const baseRelevance = enriched?.relevance_score ?? 3;
      // tier 2 sources get a small relevance penalty
      const relevance = Math.max(1, Math.min(5, source.tier === 2 ? baseRelevance - 1 : baseRelevance));

      // --- Relevance gate: skip off-topic stories (war, sports, foreign markets, etc.) ---
      if (enriched && enriched.relevance_score <= 1) {
        console.log(`[${source.name}] skipped off-topic: ${headline.slice(0, 80)}`);
        continue;
      }

      // --- Cross-source dedup ---
      const headlineForDedup = headlineEn || headline;
      const dedup = await findDuplicateGroup(supabase, headlineForDedup, category, new Date(publishedAt));

      let dedupGroupId: string | null = null;
      let isDuplicate = false;
      if (dedup.groupId) {
        dedupGroupId = dedup.groupId;
        // Check tier of existing group members. If existing has lower tier number (more authoritative),
        // mark new one as duplicate. Otherwise mark new as primary and promote.
        const { data: groupMembers } = await supabase
          .from("intel_articles")
          .select("id, source_tier")
          .eq("dedup_group_id", dedupGroupId);
        const minExistingTier = Math.min(...(groupMembers ?? [{ source_tier: 99 }]).map((m: any) => m.source_tier));
        if (source.tier > minExistingTier) {
          isDuplicate = true;
        } else if (source.tier < minExistingTier) {
          // New article is more authoritative — demote existing
          await supabase
            .from("intel_articles")
            .update({ is_duplicate: true })
            .eq("dedup_group_id", dedupGroupId);
        }
      }

      const { error: insertErr } = await supabase
        .from("intel_articles")
        .insert({
          source_id: source.id,
          source_name: source.name,
          source_language: source.language,
          source_tier: source.tier,
          headline,
          headline_en: headlineEn,
          excerpt: excerpt || null,
          excerpt_en: excerptEn,
          translated_at: translatedAt,
          url,
          image_url: imageUrl,
          published_at: publishedAt,
          category,
          category_confidence: categoryConfidence,
          auto_categorized: true,
          relevance_score: relevance,
          dedup_group_id: dedupGroupId,
          is_duplicate: isDuplicate,
        });

      if (!insertErr) added++;
      else console.error(`[${source.name}] insert error:`, insertErr.message);
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
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
