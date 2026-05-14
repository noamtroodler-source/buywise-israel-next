// Re-extract features from the description + title for already-imported listings.
// Strict: returns ONLY features explicitly mentioned in the text.
// No inference from neighborhood, price, floor, property type, etc.
//
// POST body: { agency_id?: string, property_ids?: string[], dry_run?: boolean }
// Defaults to JRE agency if no filter provided.

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

const JRE_AGENCY_ID = "0058c3aa-2331-4a34-9c0e-c11aa984deff";

async function extractFeaturesFromText(
  apiKey: string,
  title: string | null,
  description: string | null,
): Promise<string[]> {
  const text = [title, description].filter(Boolean).join("\n\n").trim();
  if (!text) return [];

  const systemPrompt =
    `You extract real-estate features from listing text. Return ONLY features that are EXPLICITLY mentioned in the text. ` +
    `Do NOT infer from neighborhood, price, property type, floor, or any other context. ` +
    `Map mentions to these standardized keys ONLY (ignore anything that doesn't fit): ${ALLOWED_FEATURE_KEYS.join(", ")}. ` +
    `If a feature is not clearly stated in the text, omit it. Better to return fewer accurate features than to guess.`;

  const userPrompt =
    `Listing text:\n"""\n${text.slice(0, 6000)}\n"""\n\n` +
    `Return JSON: { "features": string[] } using only keys from the allowed list.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || "{}";
  let parsed: { features?: unknown };
  try { parsed = JSON.parse(raw); } catch { return []; }
  const arr = Array.isArray(parsed.features) ? parsed.features : [];
  const allowed = new Set(ALLOWED_FEATURE_KEYS);
  return Array.from(
    new Set(
      arr
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim().toLowerCase())
        .filter((x) => allowed.has(x)),
    ),
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const agencyId = body.agency_id ?? JRE_AGENCY_ID;
    const propertyIds: string[] | undefined = Array.isArray(body.property_ids)
      ? body.property_ids
      : undefined;
    const dryRun = !!body.dry_run;

    let q = sb.from("properties").select("id, title, description, features");
    if (propertyIds?.length) q = q.in("id", propertyIds);
    else q = q.eq("primary_agency_id", agencyId);

    const { data: properties, error } = await q;
    if (error) throw error;
    if (!properties?.length) {
      return new Response(JSON.stringify({ error: "No properties found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{
      id: string;
      before: string[];
      after: string[];
      updated: boolean;
      error?: string;
    }> = [];

    for (const p of properties) {
      const before = Array.isArray(p.features) ? (p.features as string[]) : [];
      try {
        const after = await extractFeaturesFromText(apiKey, p.title, p.description);
        if (!dryRun) {
          const { error: upErr } = await sb
            .from("properties")
            .update({ features: after })
            .eq("id", p.id);
          if (upErr) {
            results.push({ id: p.id, before, after, updated: false, error: upErr.message });
            continue;
          }
        }
        results.push({ id: p.id, before, after, updated: !dryRun });
      } catch (e) {
        results.push({
          id: p.id,
          before,
          after: [],
          updated: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
      // small delay to be gentle on the gateway
      await new Promise((r) => setTimeout(r, 250));
    }

    return new Response(
      JSON.stringify({
        total: properties.length,
        updated: results.filter((r) => r.updated).length,
        dry_run: dryRun,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("refresh-listing-features error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
