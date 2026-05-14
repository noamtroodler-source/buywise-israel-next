// Admin-only one-shot: enrich CityZen listings for demo/preview, then publish.
// All filled rows are tagged is_demo_fabricated=true so they're invisible to
// real analytics/comp math and easy to wipe later.
//
// POST { agency_id?: string (default CityZen), dry_run?: boolean }

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_AGENCY_ID = "93133b05-62d3-4311-ac95-eda087aaf447"; // CityZen
const MIN_PHOTOS_TO_PUBLISH = 4;

const ALLOWED_FEATURES = [
  "elevator", "balcony", "sun_balcony", "sukkah_balcony", "mamad",
  "parking", "storage", "garden", "air_conditioning", "central_ac",
  "renovated_kitchen", "renovated_bathrooms", "shutters", "security_doors",
  "accessible", "furnished", "sea_view", "city_view", "quiet_street",
];

const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function hasHebrew(v: unknown): boolean {
  return typeof v === "string" && /[\u0590-\u05FF]/.test(v);
}

function hasStreetNumber(addr: string | null | undefined): boolean {
  if (!addr) return false;
  return /\d{1,4}/.test(addr);
}

async function callAI(systemPrompt: string, userPayload: object, toolName: string, toolParams: object): Promise<any> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
      tools: [{ type: "function", function: { name: toolName, parameters: toolParams } }],
      tool_choice: { type: "function", function: { name: toolName } },
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  return args ? JSON.parse(args) : {};
}

// One enrichment call per listing — translate + fabricate everything missing.
async function enrichListing(p: any): Promise<any> {
  const result = await callAI(
    "You enrich Israeli real-estate listings for an admin demo preview. " +
    "Tasks: (1) Translate any Hebrew address/neighborhood to concise transliterated English (preserve street numbers exactly). " +
    "(2) If the address has a real street name but NO street number (1-4 digits), invent a plausible house number 1-180 and append it. " +
    "(3) If bedrooms is null/0, infer from rooms count (Israeli rooms = bedrooms + 1, so rooms=4 → bedrooms=3) or estimate from price/size (luxury Netanya ~₪3M = 3BR, ~₪6M = 4-5BR). " +
    "(4) If size_sqm is null/0, estimate ~25-35 sqm per bedroom plus living. " +
    "(5) Pick 4-7 plausible features from the allowed list based on price tier and city — luxury includes elevator+parking+balcony+AC+renovated; mid-tier includes balcony+AC+parking+mamad. " +
    "(6) Write a polished 55-90 word English description in BuyWise 'trusted friend' tone — concrete, calm, buyer-oriented. No promotional clichés.",
    {
      address: p.address || null,
      city: p.city,
      neighborhood: p.neighborhood || null,
      bedrooms: p.bedrooms,
      size_sqm: p.size_sqm,
      source_rooms: p.source_rooms,
      price_nis: p.price,
      existing_features: p.features || [],
      existing_description: (p.description || "").slice(0, 500),
      allowed_features: ALLOWED_FEATURES,
    },
    "enrich_listing",
    {
      type: "object",
      properties: {
        address: { type: "string", description: "English address with street number" },
        neighborhood: { type: "string" },
        bedrooms: { type: "integer", minimum: 1, maximum: 8 },
        size_sqm: { type: "integer", minimum: 30, maximum: 600 },
        features: { type: "array", items: { type: "string", enum: ALLOWED_FEATURES }, minItems: 4, maxItems: 7 },
        description: { type: "string" },
      },
      required: ["address", "bedrooms", "size_sqm", "features", "description"],
      additionalProperties: false,
    },
  );
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));
    const agencyId = body.agency_id || DEFAULT_AGENCY_ID;
    const dryRun = body.dry_run === true;

    const { data: rows, error } = await sb
      .from("properties")
      .select("id, address, city, neighborhood, bedrooms, size_sqm, source_rooms, price, features, description, images, is_published")
      .eq("primary_agency_id", agencyId);
    if (error) throw error;
    if (!rows?.length) {
      return new Response(JSON.stringify({ message: "No listings found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stats = { total: rows.length, enriched: 0, published: 0, draft_low_photos: 0, errors: 0 };
    const errors: any[] = [];

    // Process in parallel batches of 6 to keep total runtime reasonable
    const BATCH = 6;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      await Promise.all(batch.map(async (p: any) => {
        try {
          const photoCount = Array.isArray(p.images) ? p.images.length : 0;
          const willPublish = photoCount >= MIN_PHOTOS_TO_PUBLISH && p.price > 0 && p.city;
          if (!willPublish) stats.draft_low_photos++;

          const needsEnrichment =
            hasHebrew(p.address) || hasHebrew(p.neighborhood) ||
            !hasStreetNumber(p.address) || !p.address ||
            !p.bedrooms || !p.size_sqm ||
            !Array.isArray(p.features) || p.features.length < 3 ||
            !p.description || p.description.length < 120;

          let patch: any = {
            is_demo_fabricated: true,
            data_quality_score: 0,
            import_source: "demo_preview_cityzen",
          };

          if (needsEnrichment) {
            const enriched = await enrichListing(p);
            if (enriched.address) patch.address = enriched.address;
            if (enriched.neighborhood) patch.neighborhood = enriched.neighborhood;
            if (enriched.bedrooms) patch.bedrooms = enriched.bedrooms;
            if (enriched.size_sqm) patch.size_sqm = enriched.size_sqm;
            if (Array.isArray(enriched.features)) patch.features = enriched.features;
            if (enriched.description) {
              patch.description = enriched.description;
              patch.ai_english_description = enriched.description;
            }
            stats.enriched++;
          }

          if (willPublish) {
            patch.is_published = true;
            patch.verification_status = "approved";
            stats.published++;
          }

          if (!dryRun) {
            const { error: upErr } = await sb.from("properties").update(patch).eq("id", p.id);
            if (upErr) throw upErr;
          }
        } catch (e) {
          stats.errors++;
          errors.push({ id: p.id, error: e instanceof Error ? e.message : String(e) });
        }
      }));
    }

    return new Response(
      JSON.stringify({ stats, errors: errors.slice(0, 20), dry_run: dryRun }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("demo-fill-cityzen error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
