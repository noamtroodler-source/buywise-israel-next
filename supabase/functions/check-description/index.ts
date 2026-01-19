import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckDescriptionRequest {
  description: string;
}

interface CheckDescriptionResponse {
  hasIssues: boolean;
  suggestions: string[];
  improvedVersion?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description } = await req.json() as CheckDescriptionRequest;

    if (!description || description.trim().length < 50) {
      return new Response(
        JSON.stringify({ 
          hasIssues: true, 
          suggestions: ["Description is too short. Please add more details about the property."] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log("Checking description quality, length:", description.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional real estate listing editor. Analyze property descriptions for:
1. Grammar and spelling errors
2. Clarity and readability
3. Professional tone (avoid all caps, excessive punctuation)
4. Compelling content that would attract buyers

Return a JSON object with:
- hasIssues: boolean (true if there are problems worth fixing)
- suggestions: array of specific, actionable suggestions (max 5)
- improvedVersion: if there are issues, provide an improved version of the description

Be constructive and helpful. Only flag genuine issues, not minor stylistic preferences.
Focus on English grammar but be understanding of property-specific terminology.`
          },
          {
            role: "user",
            content: `Please review this property listing description:\n\n"${description}"`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_feedback",
              description: "Provide structured feedback on the property description",
              parameters: {
                type: "object",
                properties: {
                  hasIssues: {
                    type: "boolean",
                    description: "True if there are meaningful issues to address"
                  },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of specific, actionable suggestions"
                  },
                  improvedVersion: {
                    type: "string",
                    description: "An improved version of the description if issues exist"
                  }
                },
                required: ["hasIssues", "suggestions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_feedback" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service is busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("Failed to analyze description");
    }

    const aiResponse = await response.json();
    console.log("AI response received");

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("Invalid AI response format");
    }

    const feedback: CheckDescriptionResponse = JSON.parse(toolCall.function.arguments);
    console.log("Feedback:", feedback.hasIssues ? "Issues found" : "No issues");

    return new Response(
      JSON.stringify(feedback),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("check-description error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to check description" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
