import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// CBS city names → platform city names (for querying the cities table)
const CBS_TO_PLATFORM: Record<string, string> = {
  "Maale Adumim": "Ma'ale Adumim",
  "Modiin": "Modi'in",
  "Raanana": "Ra'anana",
};

async function matchCity(
  city: string,
  anglo: { name: string; name_he?: string }[],
  cbs: { neighborhood_he: string; neighborhood_id: string }[],
  apiKey: string
) {
  const angloList = anglo.map(a => `- ${a.name}${a.name_he ? ` (${a.name_he})` : ""}`).join("\n");
  const cbsList = cbs.map(c => `- ${c.neighborhood_he} [ID: ${c.neighborhood_id}]`).join("\n");

  const prompt = `Match these neighborhoods for **${city}**:

**Our Anglo roster (${anglo.length}):**
${angloList}

**CBS neighborhoods (${cbs.length}):**
${cbsList}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You match Israeli neighborhood names. Anglo roster has English names (sometimes with Hebrew). CBS has Hebrew names + IDs.

Rules:
- Match by Hebrew name similarity. CBS names often combine neighborhoods with hyphens.
- A single CBS entry can map to multiple Anglo names. Create one mapping per Anglo name.
- Confidence: "exact" (Hebrew matches exactly), "high" (clear match, minor spelling diff), "likely" (reasonable but ambiguous), "none" (no match).
- List unmatched entries in unmapped arrays.`,
        },
        { role: "user", content: prompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit_mapping",
            description: "Submit neighborhood mapping for this city",
            parameters: {
              type: "object",
              properties: {
                mappings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      anglo_name: { type: "string" },
                      our_hebrew: { type: "string" },
                      cbs_hebrew: { type: "string" },
                      cbs_id: { type: "string" },
                      confidence: { type: "string", enum: ["exact", "high", "likely", "none"] },
                      notes: { type: "string" },
                    },
                    required: ["anglo_name", "cbs_hebrew", "cbs_id", "confidence"],
                    additionalProperties: false,
                  },
                },
                unmapped_cbs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      cbs_hebrew: { type: "string" },
                      cbs_id: { type: "string" },
                      suggested_anglo: { type: "string" },
                    },
                    required: ["cbs_hebrew", "cbs_id"],
                    additionalProperties: false,
                  },
                },
                unmapped_anglo: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      anglo_name: { type: "string" },
                      our_hebrew: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["anglo_name"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["mappings", "unmapped_cbs", "unmapped_anglo"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "submit_mapping" } },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI error ${resp.status} for ${city}: ${errText}`);
  }

  const result = await resp.json();
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error(`No tool call for ${city}`);
  }

  return JSON.parse(toolCall.function.arguments);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Optional: process a single city via query param
    const url = new URL(req.url);
    const onlyCity = url.searchParams.get("city");

    // Get CBS neighborhoods (paginated)
    const cbsMap = new Map<string, { city_en: string; neighborhood_he: string; neighborhood_id: string }>();
    let page = 0;
    while (true) {
      let query = supabase
        .from("neighborhood_price_history")
        .select("city_en, neighborhood_he, neighborhood_id")
        .order("city_en")
        .range(page * 1000, (page + 1) * 1000 - 1);
      if (onlyCity) query = query.eq("city_en", onlyCity);
      const { data: batch, error } = await query;
      if (error) throw new Error(`CBS query: ${error.message}`);
      if (!batch || batch.length === 0) break;
      for (const row of batch) {
        const key = `${row.city_en}|${row.neighborhood_he}|${row.neighborhood_id}`;
        if (!cbsMap.has(key)) cbsMap.set(key, row);
      }
      if (batch.length < 1000) break;
      page++;
    }

    // Get Anglo roster
    // Get all cities from platform (we need to check normalized names)
    const platformCityName = onlyCity ? (CBS_TO_PLATFORM[onlyCity] || onlyCity) : null;
    let citiesQuery = supabase.from("cities").select("name, slug, neighborhoods").order("name");
    if (platformCityName) citiesQuery = citiesQuery.eq("name", platformCityName);
    const { data: cities, error: citiesErr } = await citiesQuery;
    if (citiesErr) throw new Error(`Cities query: ${citiesErr.message}`);

    // Build reverse map: platform name → CBS name
    const platformToCbs: Record<string, string> = {};
    for (const [cbs, platform] of Object.entries(CBS_TO_PLATFORM)) {
      platformToCbs[platform] = cbs;
    }

    // Group by city
    const angloByCity: Record<string, { name: string; name_he?: string }[]> = {};
    for (const city of cities || []) {
      const raw = city.neighborhoods as any[];
      if (!Array.isArray(raw) || raw.length === 0) continue;
      // Use CBS name as key (reverse lookup), fallback to platform name
      const cbsName = platformToCbs[city.name] || city.name;
      angloByCity[cbsName] = raw
        .filter((n: any) => n.name)
        .map((n: any) => ({ name: n.name, name_he: n.name_he || n.hebrew_name || undefined }));
    }

    const cbsByCity: Record<string, { neighborhood_he: string; neighborhood_id: string }[]> = {};
    for (const n of cbsMap.values()) {
      if (!cbsByCity[n.city_en]) cbsByCity[n.city_en] = [];
      cbsByCity[n.city_en].push({ neighborhood_he: n.neighborhood_he, neighborhood_id: n.neighborhood_id });
    }

    const allCities = [...new Set([...Object.keys(angloByCity), ...Object.keys(cbsByCity)])].sort();
    
    const allMappings: any[] = [];
    const allUnmappedCbs: any[] = [];
    const allUnmappedAnglo: any[] = [];
    const cityResults: Record<string, string> = {};

    // Process cities sequentially to avoid rate limits
    for (const city of allCities) {
      const anglo = angloByCity[city] || [];
      const cbs = cbsByCity[city] || [];
      
      if (anglo.length === 0 && cbs.length === 0) continue;

      // If one side is empty, skip AI call
      if (anglo.length === 0) {
        for (const c of cbs) {
          allUnmappedCbs.push({ city, cbs_hebrew: c.neighborhood_he, cbs_id: c.neighborhood_id });
        }
        cityResults[city] = `0 mappings (no Anglo roster)`;
        continue;
      }
      if (cbs.length === 0) {
        for (const a of anglo) {
          allUnmappedAnglo.push({ city, anglo_name: a.name, our_hebrew: a.name_he, reason: "No CBS data for this city" });
        }
        cityResults[city] = `0 mappings (no CBS data)`;
        continue;
      }

      try {
        console.log(`Processing ${city}: ${anglo.length} Anglo, ${cbs.length} CBS`);
        const result = await matchCity(city, anglo, cbs, LOVABLE_API_KEY);
        
        const mappings = (result.mappings || []).map((m: any) => ({ ...m, city }));
        const unmappedCbs = (result.unmapped_cbs || []).map((m: any) => ({ ...m, city }));
        const unmappedAnglo = (result.unmapped_anglo || []).map((m: any) => ({ ...m, city }));
        
        allMappings.push(...mappings);
        allUnmappedCbs.push(...unmappedCbs);
        allUnmappedAnglo.push(...unmappedAnglo);
        
        cityResults[city] = `${mappings.length} mapped, ${unmappedCbs.length} unmapped CBS, ${unmappedAnglo.length} unmapped Anglo`;
        
        // Small delay between cities to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.error(`Error for ${city}:`, e);
        cityResults[city] = `ERROR: ${e instanceof Error ? e.message : "Unknown"}`;
      }
    }

    const summary = {
      total_mappings: allMappings.length,
      total_unmapped_cbs: allUnmappedCbs.length,
      total_unmapped_anglo: allUnmappedAnglo.length,
      confidence_breakdown: {
        exact: allMappings.filter((m: any) => m.confidence === "exact").length,
        high: allMappings.filter((m: any) => m.confidence === "high").length,
        likely: allMappings.filter((m: any) => m.confidence === "likely").length,
        none: allMappings.filter((m: any) => m.confidence === "none").length,
      },
      cities_processed: Object.keys(cityResults).length,
      city_results: cityResults,
    };

    console.log("Summary:", JSON.stringify(summary, null, 2));

    return new Response(JSON.stringify({
      mappings: allMappings,
      unmapped_cbs: allUnmappedCbs,
      unmapped_anglo: allUnmappedAnglo,
      summary,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("map-neighborhoods error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
