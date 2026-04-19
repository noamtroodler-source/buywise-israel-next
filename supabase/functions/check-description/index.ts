

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ContentType = "property" | "agency" | "agent_bio";

interface CheckDescriptionRequest {
  description: string;
  contentType?: ContentType;
}

interface CheckDescriptionResponse {
  hasIssues: boolean;
  suggestions: string[];
  improvedVersion?: string;
}

const SYSTEM_PROMPTS: Record<ContentType, string> = {
  property: `You are a professional real estate listing editor. Analyze property descriptions for:
1. Grammar and spelling errors
2. Clarity and readability
3. Professional tone (avoid all caps, excessive punctuation)
4. Compelling content that would attract buyers

Be constructive and helpful. Only flag genuine issues, not minor stylistic preferences.
Focus on English grammar but be understanding of property-specific terminology.`,
  agency: `You are a professional editor for real estate agency profiles. Analyze the agency description for:
1. Grammar and spelling errors
2. Clarity and professional tone (avoid all caps, excessive punctuation, hype words)
3. Trust signals: founding story, expertise, team culture, what sets them apart
4. Concise, credible language that international (Anglo) buyers will trust

Be constructive. Only flag genuine issues. Keep suggestions actionable and specific.`,
  agent_bio: `You are a professional editor for real estate agent bios. Analyze the agent's short bio for:
1. Grammar and spelling errors
2. Clarity, warmth, and professional tone (avoid all caps and hype)
3. Trust signals: experience, specialization, languages, what clients can expect
4. First-person, concise voice suitable for international (Anglo) clients

Be constructive. Only flag genuine issues. Keep suggestions short and actionable.`,
};

const USER_PROMPTS: Record<ContentType, (text: string) => string> = {
  property: (t) => `Please review this property listing description:\n\n"${t}"`,
  agency: (t) => `Please review this real estate agency description:\n\n"${t}"`,
  agent_bio: (t) => `Please review this real estate agent's short bio:\n\n"${t}"`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, contentType = "property" } = await req.json() as CheckDescriptionRequest;
    const type: ContentType = (["property", "agency", "agent_bio"].includes(contentType)
      ? contentType
      : "property") as ContentType;

    const minLength = type === "agent_bio" ? 30 : 50;
    if (!description || description.trim().length < minLength) {
      return new Response(
        JSON.stringify({
          hasIssues: true,
          suggestions: [`Text is too short. Please add more details (at least ${minLength} characters).`],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log(`Checking ${type} quality, length:`, description.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[type] },
          { role: "user", content: USER_PROMPTS[type](description) },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_feedback",
              description: "Provide structured feedback on the text",
              parameters: {
                type: "object",
                properties: {
                  hasIssues: {
                    type: "boolean",
                    description: "True if there are meaningful issues to address",
                  },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of specific, actionable suggestions (max 5)",
                  },
                  improvedVersion: {
                    type: "string",
                    description: "An improved version of the text if issues exist",
                  },
                },
                required: ["hasIssues", "suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_feedback" } },
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

      throw new Error("Failed to analyze text");
    }

    const aiResponse = await response.json();
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
        error: error instanceof Error ? error.message : "Failed to check text",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
