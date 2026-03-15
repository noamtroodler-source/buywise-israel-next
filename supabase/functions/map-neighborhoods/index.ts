import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Step 1: Get all distinct CBS neighborhoods from neighborhood_price_history
    const { data: cbsRows, error: cbsErr } = await supabase
      .from("neighborhood_price_history")
      .select("city_en, neighborhood_he, neighborhood_id")
      .order("city_en");

    if (cbsErr) throw new Error(`CBS query failed: ${cbsErr.message}`);

    // Deduplicate CBS entries
    const cbsMap = new Map<string, { city_en: string; neighborhood_he: string; neighborhood_id: string }>();
    for (const row of cbsRows || []) {
      const key = `${row.city_en}|${row.neighborhood_he}|${row.neighborhood_id}`;
      if (!cbsMap.has(key)) cbsMap.set(key, row);
    }
    const cbsNeighborhoods = Array.from(cbsMap.values());

    // Step 2: Get all cities with their neighborhoods JSON
    const { data: cities, error: citiesErr } = await supabase
      .from("cities")
      .select("name, slug, neighborhoods")
      .order("name");

    if (citiesErr) throw new Error(`Cities query failed: ${citiesErr.message}`);

    // Build Anglo roster grouped by city
    const angloRoster: Record<string, { name: string; name_he?: string }[]> = {};
    for (const city of cities || []) {
      const raw = city.neighborhoods as any[];
      if (!Array.isArray(raw) || raw.length === 0) continue;
      angloRoster[city.name] = raw
        .filter((n: any) => n.name)
        .map((n: any) => ({ name: n.name, name_he: n.name_he || n.hebrew_name || undefined }));
    }

    // Build CBS roster grouped by city
    const cbsRoster: Record<string, { neighborhood_he: string; neighborhood_id: string }[]> = {};
    for (const n of cbsNeighborhoods) {
      if (!cbsRoster[n.city_en]) cbsRoster[n.city_en] = [];
      cbsRoster[n.city_en].push({ neighborhood_he: n.neighborhood_he, neighborhood_id: n.neighborhood_id });
    }

    // Build prompt
    const allCities = new Set([...Object.keys(angloRoster), ...Object.keys(cbsRoster)]);
    let promptParts: string[] = [];

    for (const city of Array.from(allCities).sort()) {
      const anglo = angloRoster[city] || [];
      const cbs = cbsRoster[city] || [];
      if (anglo.length === 0 && cbs.length === 0) continue;

      promptParts.push(`\n### ${city}`);

      if (anglo.length > 0) {
        promptParts.push("**Our Anglo roster:**");
        for (const a of anglo) {
          promptParts.push(`- ${a.name}${a.name_he ? ` (${a.name_he})` : ""}`);
        }
      } else {
        promptParts.push("**Our Anglo roster:** (none)");
      }

      if (cbs.length > 0) {
        promptParts.push("**CBS neighborhoods:**");
        for (const c of cbs) {
          promptParts.push(`- ${c.neighborhood_he} [ID: ${c.neighborhood_id}]`);
        }
      } else {
        promptParts.push("**CBS neighborhoods:** (none)");
      }
    }

    const systemPrompt = `You are an expert in Israeli geography and Hebrew-English transliteration. 
Your task is to match Anglo neighborhood names from a real estate platform to their corresponding CBS (Central Bureau of Statistics) Hebrew neighborhood names from government transaction data.

Rules:
1. Match by Hebrew name similarity. CBS names often combine two neighborhoods with a hyphen (e.g., "גאולים-בקעה" should match both "Geulim" and "Baka").
2. CBS names may use different transliterations or spellings than our Hebrew names.
3. Some CBS entries represent combined statistical areas — note these in the "notes" field.
4. For confidence levels:
   - "exact": Hebrew names match exactly or differ only by niqqud/punctuation
   - "high": Clear transliteration match with minor spelling differences
   - "likely": Reasonable match but some ambiguity
   - "none": No match found
5. A single CBS entry can map to multiple Anglo names (combined areas). Create one mapping entry per Anglo name.
6. Some Anglo neighborhoods may have no CBS equivalent (new developments, small areas). List these as unmapped_anglo.
7. Some CBS neighborhoods may have no Anglo equivalent. List these as unmapped_cbs with a suggested Anglo name.`;

    const userPrompt = `Match the following neighborhood lists city by city. For each city, match our Anglo roster entries to CBS entries.\n${promptParts.join("\n")}`;

    console.log(`Sending ${cbsNeighborhoods.length} CBS + ${Object.values(angloRoster).flat().length} Anglo entries to Gemini`);

    // Step 3: Call Gemini with tool calling
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_neighborhood_mapping",
              description: "Submit the complete neighborhood mapping results",
              parameters: {
                type: "object",
                properties: {
                  mappings: {
                    type: "array",
                    description: "Matched neighborhood pairs",
                    items: {
                      type: "object",
                      properties: {
                        city: { type: "string", description: "City name in English" },
                        anglo_name: { type: "string", description: "Our Anglo neighborhood name" },
                        our_hebrew: { type: "string", description: "Our Hebrew name if available" },
                        cbs_hebrew: { type: "string", description: "CBS Hebrew neighborhood name" },
                        cbs_id: { type: "string", description: "CBS neighborhood_id" },
                        confidence: { type: "string", enum: ["exact", "high", "likely", "none"] },
                        notes: { type: "string", description: "Any notes about the match (combined areas, spelling diffs, etc.)" },
                      },
                      required: ["city", "anglo_name", "cbs_hebrew", "cbs_id", "confidence"],
                      additionalProperties: false,
                    },
                  },
                  unmapped_cbs: {
                    type: "array",
                    description: "CBS neighborhoods with no platform match",
                    items: {
                      type: "object",
                      properties: {
                        city: { type: "string" },
                        cbs_hebrew: { type: "string" },
                        cbs_id: { type: "string" },
                        suggested_anglo: { type: "string", description: "Suggested English name" },
                      },
                      required: ["city", "cbs_hebrew", "cbs_id"],
                      additionalProperties: false,
                    },
                  },
                  unmapped_anglo: {
                    type: "array",
                    description: "Anglo neighborhoods with no CBS match",
                    items: {
                      type: "object",
                      properties: {
                        city: { type: "string" },
                        anglo_name: { type: "string" },
                        our_hebrew: { type: "string" },
                        reason: { type: "string", description: "Why no match was found" },
                      },
                      required: ["city", "anglo_name"],
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
        tool_choice: { type: "function", function: { name: "submit_neighborhood_mapping" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required — add credits to workspace" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error ${response.status}: ${errText}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in AI response");
    }

    const mapping = JSON.parse(toolCall.function.arguments);

    // Add summary stats
    const summary = {
      total_mappings: mapping.mappings?.length || 0,
      total_unmapped_cbs: mapping.unmapped_cbs?.length || 0,
      total_unmapped_anglo: mapping.unmapped_anglo?.length || 0,
      confidence_breakdown: {
        exact: mapping.mappings?.filter((m: any) => m.confidence === "exact").length || 0,
        high: mapping.mappings?.filter((m: any) => m.confidence === "high").length || 0,
        likely: mapping.mappings?.filter((m: any) => m.confidence === "likely").length || 0,
        none: mapping.mappings?.filter((m: any) => m.confidence === "none").length || 0,
      },
      cities_covered: [...new Set(mapping.mappings?.map((m: any) => m.city) || [])].length,
      input_counts: {
        cbs_neighborhoods: cbsNeighborhoods.length,
        anglo_neighborhoods: Object.values(angloRoster).flat().length,
      },
    };

    return new Response(JSON.stringify({ ...mapping, summary }), {
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
