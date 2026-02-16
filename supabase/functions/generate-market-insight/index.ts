import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MarketInsightRequest {
  property_id: string;
  input_hash: string;
  // Market data
  price: number;
  size_sqm: number | null;
  price_per_sqm: number | null;
  city: string;
  neighborhood: string | null;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  total_floors: number | null;
  year_built: number | null;
  condition: string | null;
  has_elevator: boolean | null;
  parking: number | null;
  has_balcony: boolean | null;
  has_storage: boolean | null;
  is_accessible: boolean | null;
  entry_date: string | null;
  days_on_market: number;
  original_price: number | null;
  description_snippet: string | null;
  features: string[] | null;
  listing_status: string;
  // City-level data
  city_avg_price_sqm: number | null;
  city_yoy_change: number | null;
  // Comp data
  comp_count: number;
  avg_comp_deviation_percent: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: MarketInsightRequest = await req.json();
    const { property_id, input_hash } = body;

    if (!property_id) {
      return new Response(JSON.stringify({ error: "property_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check cache first
    const { data: cached } = await supabase
      .from("market_insight_cache")
      .select("insight_text, input_hash, created_at")
      .eq("property_id", property_id)
      .single();

    if (cached) {
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (cached.input_hash === input_hash && cacheAge < sevenDays) {
        return new Response(JSON.stringify({ insight: cached.insight_text }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Build the AI prompt
    const pricePerSqm = body.price_per_sqm;
    const cityAvg = body.city_avg_price_sqm;
    const deviation = body.avg_comp_deviation_percent;

    const propertyDetails = [
      `Type: ${body.property_type}`,
      body.bedrooms ? `${body.bedrooms} bedrooms` : null,
      body.bathrooms ? `${body.bathrooms} bathrooms` : null,
      body.size_sqm ? `${body.size_sqm} sqm` : null,
      body.floor !== null && body.floor !== undefined ? `Floor ${body.floor}${body.total_floors ? ` of ${body.total_floors}` : ""}` : null,
      body.year_built ? `Built ${body.year_built}` : null,
      body.condition ? `Condition: ${body.condition}` : null,
      body.has_elevator ? "Has elevator" : body.has_elevator === false ? "No elevator" : null,
      body.parking ? `${body.parking} parking spots` : null,
      body.has_balcony ? "Has balcony" : null,
      body.has_storage ? "Has storage" : null,
      body.is_accessible ? "Accessible" : null,
      body.entry_date ? `Entry date: ${body.entry_date}` : null,
      body.original_price ? `Price reduced from ₪${body.original_price.toLocaleString()} to ₪${body.price.toLocaleString()}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const marketContext = [
      `Listing price: ₪${body.price.toLocaleString()}`,
      pricePerSqm ? `Price/sqm: ₪${Math.round(pricePerSqm).toLocaleString()}` : null,
      `City: ${body.city}`,
      body.neighborhood ? `Neighborhood: ${body.neighborhood}` : null,
      cityAvg ? `City avg price/sqm: ₪${Math.round(cityAvg).toLocaleString()}` : null,
      body.city_yoy_change !== null && body.city_yoy_change !== undefined ? `City 12-month price trend: ${body.city_yoy_change > 0 ? "+" : ""}${body.city_yoy_change.toFixed(1)}%` : null,
      `Nearby comparable sales: ${body.comp_count}`,
      deviation !== null && deviation !== undefined ? `Listing is ${deviation > 0 ? "+" : ""}${deviation.toFixed(0)}% vs avg of nearby comps` : null,
      `Days on market: ${body.days_on_market}`,
    ]
      .filter(Boolean)
      .join(". ");

    const descSnippet = body.description_snippet
      ? `Listing description excerpt: "${body.description_snippet}"`
      : "";

    const featuresStr = body.features?.length
      ? `Listed features: ${body.features.join(", ")}`
      : "";

    const systemPrompt = `You are a knowledgeable Israeli real estate analyst writing for Buywise, a platform that helps English-speaking buyers navigate the Israeli property market. Your tone is warm, professional, and factual — like a trusted advisor explaining things clearly over coffee.

Your job: Write exactly 2-3 sentences that explain WHY this property's asking price makes sense or doesn't relative to the market data provided. Consider ALL the data — property features, condition, floor, location signals from the description, city trends, and comparable sales.

Think like an experienced Israeli real estate agent who notices things buyers miss:
- Ground floor apartments are typically cheaper. Penthouses and high floors command premiums.
- "Needs renovation" justifies below-market pricing. "Renovated" or "new" justifies above-market.
- Sea views, quiet streets, proximity to parks/schools add value.
- TAMA 38 potential can explain price anomalies.
- Limited comp data (1-2 sales) means less certainty.
- Price reductions signal motivated sellers.
- Long days on market may mean overpricing.
- Rising city trends can justify higher prices.

Rules:
- Output ONLY the insight text, nothing else.
- Never start with "This property" — vary your sentence starters.
- Never use phrases like "In conclusion" or "Overall."
- Be specific — reference actual numbers when helpful (e.g., "18% above," "₪38,000/sqm").
- If data is limited or conflicting, say so honestly.
- Maximum 3 sentences. Be concise.`;

    const userPrompt = `${marketContext}

Property details: ${propertyDetails}

${descSnippet}
${featuresStr}

Based on all this data, explain in 2-3 sentences why this property is priced where it is relative to the market.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_market_insight",
                description: "Return the market insight text for this property.",
                parameters: {
                  type: "object",
                  properties: {
                    insight: {
                      type: "string",
                      description:
                        "2-3 sentence market insight explaining the property's pricing relative to market data.",
                    },
                  },
                  required: ["insight"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_market_insight" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway returned ${status}`);
    }

    const aiData = await aiResponse.json();
    let insightText = "";

    // Extract from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      insightText = parsed.insight || "";
    }

    // Fallback to content if tool call didn't work
    if (!insightText) {
      insightText = aiData.choices?.[0]?.message?.content || "";
    }

    if (!insightText) {
      return new Response(
        JSON.stringify({ error: "Failed to generate insight" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert cache
    await supabase.from("market_insight_cache").upsert(
      {
        property_id,
        insight_text: insightText,
        input_hash: input_hash,
        created_at: new Date().toISOString(),
      },
      { onConflict: "property_id" }
    );

    return new Response(JSON.stringify({ insight: insightText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-market-insight error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
