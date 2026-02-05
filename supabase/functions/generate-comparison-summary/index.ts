import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PropertyData {
  title: string;
  price: number;
  size_sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  city: string;
  neighborhood: string | null;
  condition: string | null;
  year_built: number | null;
  floor: number | null;
  parking: number | null;
  property_type: string;
}

interface RequestPayload {
  properties: PropertyData[];
  isRental: boolean;
  winnerData: Array<{ title: string; wins: number }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { properties, isRental, winnerData } = await req.json() as RequestPayload;

    if (!properties || properties.length < 2) {
      return new Response(
        JSON.stringify({ error: "At least 2 properties required for comparison" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build property descriptions for the prompt
    const propertyDescriptions = properties.map((p, i) => {
      const pricePerSqm = p.size_sqm ? Math.round(p.price / p.size_sqm) : null;
      return `Property ${i + 1}: "${p.title}"
- Price: ${p.price.toLocaleString()} ILS${isRental ? '/month' : ''}
- Size: ${p.size_sqm ? `${p.size_sqm} sqm` : 'Not specified'}
- Price per sqm: ${pricePerSqm ? `${pricePerSqm.toLocaleString()} ILS` : 'N/A'}
- Bedrooms: ${p.bedrooms || 'N/A'}, Bathrooms: ${p.bathrooms || 'N/A'}
- Location: ${p.city}${p.neighborhood ? `, ${p.neighborhood}` : ''}
- Type: ${p.property_type}
- Condition: ${p.condition || 'Not specified'}
- Year Built: ${p.year_built || 'Not specified'}
- Floor: ${p.floor || 'N/A'}
- Parking: ${p.parking ? `${p.parking} spots` : 'None'}`;
    }).join('\n\n');

    const winnerInfo = winnerData.length > 0 
      ? `\nMetric winners:\n${winnerData.map(w => `- "${w.title}": ${w.wins} winning metrics`).join('\n')}`
      : '';

    const systemPrompt = `You are a real estate comparison analyst for the Israeli market. Your job is to provide comprehensive, actionable summaries comparing properties.

Guidelines:
- Write exactly 3-4 sentences that are comprehensive and specific
- Use actual numbers and property names from the data
- Highlight the most significant trade-offs between properties
- Provide recommendations for different buyer/renter profiles (families, investors, professionals)
- Be objective but helpful in guiding the decision
- ${isRental ? 'Focus on monthly costs, value, and rental considerations' : 'Focus on value, investment potential, and long-term considerations'}
- Use natural, conversational language
- Avoid generic statements - be specific to the actual data provided`;

    const userPrompt = `Compare these ${isRental ? 'rental' : 'sale'} properties and provide a comprehensive summary:

${propertyDescriptions}
${winnerInfo}

Provide a 3-4 sentence analysis covering: which property offers best value and why, key trade-offs between them, and specific recommendations for different buyer profiles (families vs professionals vs investors).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_comparison_summary",
              description: "Provide a comprehensive comparison summary of the properties",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "A 3-4 sentence comprehensive comparison summary"
                  }
                },
                required: ["summary"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_comparison_summary" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate summary" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extract the summary from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify({ summary: args.summary }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback to content if no tool call
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      return new Response(
        JSON.stringify({ summary: content }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("No summary generated");

  } catch (error) {
    console.error("Error generating comparison summary:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
