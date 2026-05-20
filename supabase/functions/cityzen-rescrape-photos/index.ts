// Admin-only: re-scrape CityZen listing source pages with Firecrawl to recover
// full image arrays for properties currently below the 4-photo publish gate.
// Stores photo URLs as references only (no download) — zero-storage policy intact.
//
// POST { agency_id?: string, only_under?: number (default 4), limit?: number }

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_AGENCY_ID = "93133b05-62d3-4311-ac95-eda087aaf447";
const FC_KEY = Deno.env.get("FIRECRAWL_API_KEY")!;

// Pull image URLs from Firecrawl scrape result (markdown + html + links).
function extractImages(scrape: any, sourceHost = "cityzen.co.il"): string[] {
  const urls = new Set<string>();
  const push = (u: string) => {
    if (!u) return;
    try {
      const abs = new URL(u, `https://${sourceHost}`).toString();
      if (!/\.(jpe?g|png|webp|avif)(\?|$)/i.test(abs)) return;
      const lower = abs.toLowerCase();
      // Skip tiny icons / placeholders / theme & plugin chrome / agent headshots.
      if (/(icon|logo|favicon|placeholder|sprite|avatar|agent|team|badge|flag)/i.test(lower)) return;
      if (lower.includes("/wp-content/themes/") || lower.includes("/wp-content/plugins/")) return;
      if (/\/themes\/[^/]+\/(?:assets|images|img)\//.test(lower)) return;
      urls.add(abs);
    } catch { /* ignore */ }
  };

  const html: string = scrape?.html || scrape?.rawHtml || "";
  if (html) {
    // src="..." and srcset
    for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) push(m[1]);
    for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) {
      for (const part of m[1].split(",")) {
        const u = part.trim().split(/\s+/)[0];
        if (u) push(u);
      }
    }
    // og:image / twitter:image
    for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/gi)) push(m[1]);
    // Background-image style attrs
    for (const m of html.matchAll(/url\((['"]?)(https?:[^)'"]+)\1\)/gi)) push(m[2]);
  }

  const md: string = scrape?.markdown || "";
  for (const m of md.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) push(m[1]);

  const links: string[] = scrape?.links || [];
  for (const l of links) push(l);

  return [...urls];
}

async function firecrawlScrape(url: string): Promise<any> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${FC_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      formats: ["markdown", "html", "links"],
      onlyMainContent: false,
      waitFor: 1500,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${(data?.error || "").toString().slice(0,200)}`);
  // v2 returns { success, data: { markdown, html, links, metadata } }
  return data?.data ?? data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!FC_KEY) throw new Error("FIRECRAWL_API_KEY not configured");
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json().catch(() => ({}));
    const agencyId = body.agency_id || DEFAULT_AGENCY_ID;
    const onlyUnder = Number(body.only_under ?? 4);
    const limit = Number(body.limit ?? 50);

    const { data: rows, error } = await sb
      .from("properties")
      .select("id, source_url, images")
      .eq("primary_agency_id", agencyId);
    if (error) throw error;

    const targets = (rows || [])
      .filter((r: any) => r.source_url && (r.images?.length ?? 0) < onlyUnder)
      .slice(0, limit);

    const stats = { scanned: targets.length, updated: 0, now_4plus: 0, errors: 0, skipped_no_new: 0 };
    const errors: any[] = [];

    // Sequential to be polite to Firecrawl quota
    for (const p of targets) {
      try {
        const scrape = await firecrawlScrape(p.source_url);
        const found = extractImages(scrape);
        const existing: string[] = Array.isArray(p.images) ? p.images : [];
        const merged = [...new Set([...existing, ...found])].slice(0, 30);
        if (merged.length === existing.length) { stats.skipped_no_new++; continue; }

        const patch: any = { images: merged };
        if (merged.length >= 4) {
          patch.is_published = true;
          patch.verification_status = "approved";
          stats.now_4plus++;
        }
        const { error: upErr } = await sb.from("properties").update(patch).eq("id", p.id);
        if (upErr) throw upErr;
        stats.updated++;
      } catch (e) {
        stats.errors++;
        errors.push({ id: p.id, url: p.source_url, error: e instanceof Error ? e.message : String(e) });
      }
    }

    return new Response(JSON.stringify({ stats, errors: errors.slice(0, 20) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cityzen-rescrape-photos error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
