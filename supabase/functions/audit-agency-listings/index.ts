// One-shot QA audit for a sample of agency listings.
// Re-fetches each listing's live source_url and compares to what's stored.
// Returns a structured report — no writes, no auto-fixes.
//
// POST { agency_id: string, sample_size?: number (default 5) }

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_FEATURE_KEYS = [
  "elevator", "balcony", "sun_balcony", "sukkah_balcony", "mamad",
  "parking", "storage", "garden", "pool", "gym", "doorman", "security",
  "air_conditioning", "central_ac", "solar_heater", "furnished",
  "accessible", "shutters", "window_bars", "security_doors", "roof_access",
  "sea_view", "city_view", "quiet_street", "renovated_kitchen",
  "renovated_bathrooms", "smart_home", "underfloor_heating", "jacuzzi",
  "sauna", "wine_cellar", "private_entrance",
];

const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");

async function firecrawlScrape(url: string) {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "html"],
      onlyMainContent: false,
    }),
  });
  if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return {
    markdown: j.markdown ?? j.data?.markdown ?? "",
    html: j.html ?? j.data?.html ?? "",
  };
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<any> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`AI gateway ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  try { return JSON.parse(data?.choices?.[0]?.message?.content || "{}"); }
  catch { return {}; }
}

function slugFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch { return null; }
}

function extractImageUrlsFromHtml(html: string): string[] {
  if (!html) return [];
  const urls = new Set<string>();
  const imgRe = /<img[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = imgRe.exec(html))) {
    const u = m[1];
    if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(u) && !u.includes("logo") && !u.includes("avatar")) {
      urls.add(u);
    }
  }
  return Array.from(urls);
}

function classifyType(title: string, desc: string, url: string) {
  return callGemini(
    `Classify a real-estate listing into exactly one of: resale, long_term_rental, short_term_rental, new_project, other. ` +
    `Resale = existing home for sale. Long-term rental = monthly lease, typically unfurnished or annual. ` +
    `Short-term rental = vacation/Airbnb/nightly/weekly. New project = pre-construction or developer-sold new build. ` +
    `Return JSON {"type": string, "confidence": number, "reasoning": string}.`,
    `URL: ${url}\nTitle: ${title}\n\nDescription:\n${(desc || "").slice(0, 4000)}`,
  );
}

function extractFeaturesStrict(title: string, desc: string) {
  return callGemini(
    `Extract real-estate features explicitly mentioned in the text. Allowed keys ONLY: ${ALLOWED_FEATURE_KEYS.join(", ")}. ` +
    `Do NOT infer from neighborhood/price/type. Return JSON {"features": string[]}.`,
    `${title}\n\n${(desc || "").slice(0, 6000)}`,
  );
}

function extractFields(title: string, desc: string, html: string) {
  const text = `${title}\n\n${desc}\n\n${html.slice(0, 8000).replace(/<[^>]+>/g, " ")}`;
  return callGemini(
    `Extract these fields if explicitly stated. Return JSON {"price_nis": number|null, "bedrooms": number|null, "size_sqm": number|null, "neighborhood": string|null, "address": string|null}. Use null if not clearly stated. Convert any USD prices to NIS at 3.7 ILS/USD.`,
    text.slice(0, 10000),
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!FIRECRAWL_KEY) throw new Error("FIRECRAWL_API_KEY not configured");
    if (!LOVABLE_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const agencyId = body.agency_id;
    const sampleSize = Math.min(Math.max(Number(body.sample_size ?? 5), 1), 10);
    if (!agencyId) throw new Error("agency_id required");

    // Random sample of listings with a source_url
    const { data: pool, error: poolErr } = await sb
      .from("properties")
      .select("id, title, description, price, bedrooms, size_sqm, neighborhood, address, features, images, source_url")
      .eq("primary_agency_id", agencyId)
      .not("source_url", "is", null);
    if (poolErr) throw poolErr;
    if (!pool?.length) {
      return new Response(JSON.stringify({ error: "No listings with source_url for this agency" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, sampleSize);

    // For cross-contamination check
    const titlesAndAddresses = pool
      .filter(p => !shuffled.some(s => s.id === p.id))
      .map(p => ({ id: p.id, title: p.title, address: p.address }));

    const reports: any[] = [];

    for (const p of shuffled) {
      const issues: Array<{ severity: "warning" | "critical"; kind: string; detail: string }> = [];
      const r: any = {
        id: p.id, title: p.title, source_url: p.source_url,
        stored: {
          photo_count: Array.isArray(p.images) ? p.images.length : 0,
          features: p.features ?? [],
          price: p.price, bedrooms: p.bedrooms, size_sqm: p.size_sqm,
          neighborhood: p.neighborhood, address: p.address,
        },
        live: {} as any,
        issues,
      };

      try {
        const live = await firecrawlScrape(p.source_url!);
        const liveImages = extractImageUrlsFromHtml(live.html);
        const listingSlug = slugFromUrl(p.source_url);

        // Photo check
        const storedImgs: string[] = Array.isArray(p.images) ? p.images : [];
        const foreign = storedImgs.filter(img => {
          // Try to match listing slug somewhere in URL or in nearby anchors
          if (!listingSlug) return false;
          const inLive = liveImages.some(li => li === img);
          return !inLive;
        });
        r.live.photo_count = liveImages.length;
        r.live.foreign_photos = foreign.slice(0, 8);
        if (storedImgs.length > liveImages.length * 1.5 && liveImages.length > 0) {
          issues.push({
            severity: "critical",
            kind: "photos_excess",
            detail: `Stored ${storedImgs.length} photos but only ${liveImages.length} found on live page (${foreign.length} not on live page).`,
          });
        } else if (foreign.length > 2) {
          issues.push({
            severity: "warning",
            kind: "photos_foreign",
            detail: `${foreign.length} stored photos not found on live page.`,
          });
        }

        // Listing type
        const cls = await classifyType(p.title || "", p.description || "", p.source_url || "");
        r.live.type = cls.type;
        r.live.type_reasoning = cls.reasoning;
        if (cls.type && !["resale", "long_term_rental"].includes(cls.type)) {
          issues.push({
            severity: "critical",
            kind: "wrong_type",
            detail: `Classified as ${cls.type}: ${cls.reasoning ?? ""}`,
          });
        }

        // Features
        const feat = await extractFeaturesStrict(p.title || "", p.description || "");
        const liveFeatures: string[] = Array.isArray(feat.features) ? feat.features : [];
        const stored: string[] = Array.isArray(p.features) ? p.features : [];
        const extra = stored.filter(f => !liveFeatures.includes(f));
        const missing = liveFeatures.filter(f => !stored.includes(f));
        r.live.features = liveFeatures;
        r.live.extra_features = extra;
        r.live.missing_features = missing;
        if (extra.length > 0) {
          issues.push({
            severity: "critical",
            kind: "fabricated_features",
            detail: `Stored features not in description: ${extra.join(", ")}`,
          });
        }
        if (missing.length > 2) {
          issues.push({
            severity: "warning",
            kind: "missing_features",
            detail: `Description mentions features not stored: ${missing.join(", ")}`,
          });
        }

        // Field accuracy
        const fields = await extractFields(p.title || "", p.description || "", live.html);
        r.live.fields = fields;
        if (fields.price_nis && p.price) {
          const diff = Math.abs(Number(fields.price_nis) - Number(p.price)) / Number(p.price);
          if (diff > 0.02) issues.push({
            severity: diff > 0.10 ? "critical" : "warning",
            kind: "price_mismatch",
            detail: `Stored ₪${p.price?.toLocaleString()} vs live ₪${Number(fields.price_nis).toLocaleString()} (${(diff * 100).toFixed(1)}% diff)`,
          });
        }
        if (fields.bedrooms != null && p.bedrooms != null && Number(fields.bedrooms) !== Number(p.bedrooms)) {
          issues.push({
            severity: "warning",
            kind: "bedrooms_mismatch",
            detail: `Stored ${p.bedrooms} bedrooms vs live ${fields.bedrooms}`,
          });
        }
        if (fields.size_sqm && p.size_sqm) {
          const diff = Math.abs(Number(fields.size_sqm) - Number(p.size_sqm)) / Number(p.size_sqm);
          if (diff > 0.05) issues.push({
            severity: "warning",
            kind: "size_mismatch",
            detail: `Stored ${p.size_sqm}sqm vs live ${fields.size_sqm}sqm`,
          });
        }

        // Cross-contamination: does this listing's title/address appear in another's content?
        const liveText = (live.markdown || "").toLowerCase();
        const cross: string[] = [];
        for (const other of titlesAndAddresses) {
          if (!other.title) continue;
          const t = other.title.toLowerCase();
          if (t.length > 15 && liveText.includes(t)) cross.push(other.title);
        }
        if (cross.length > 0) {
          r.live.cross_contamination = cross.slice(0, 3);
          issues.push({
            severity: "warning",
            kind: "cross_contamination",
            detail: `Live page references other listings: ${cross.slice(0, 3).join("; ")}`,
          });
        }
      } catch (e) {
        issues.push({
          severity: "critical",
          kind: "fetch_error",
          detail: e instanceof Error ? e.message : String(e),
        });
      }

      // Severity
      const hasCritical = issues.some(i => i.severity === "critical");
      r.severity = hasCritical ? "critical" : issues.length > 0 ? "warning" : "ok";
      reports.push(r);

      await new Promise(rr => setTimeout(rr, 300));
    }

    const summary = {
      total: reports.length,
      ok: reports.filter(r => r.severity === "ok").length,
      warning: reports.filter(r => r.severity === "warning").length,
      critical: reports.filter(r => r.severity === "critical").length,
    };

    return new Response(
      JSON.stringify({ summary, reports, run_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("audit-agency-listings error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
