import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (content.trim().split(/\s+/).length < 50) {
      return new Response(
        JSON.stringify({ error: 'Content must have at least 50 words' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a professional blog editor specializing in real estate content. Take the raw article text and format it into clean, professional Markdown.

Your task:
1. Add section headers (## for main sections, ### for subsections) to organize the content logically
2. Convert run-on lists into bullet points (- ) or numbered lists (1. 2. 3.) where appropriate
3. Break up long paragraphs into digestible chunks (aim for 2-4 sentences per paragraph)
4. Fix grammar, spelling, and punctuation errors
5. Improve sentence clarity and flow without changing the author's meaning
6. Maintain the author's voice, expertise, and professional tone
7. Add a compelling introduction paragraph if the content jumps straight into tips

Do NOT:
- Add content, facts, or statistics that weren't in the original
- Change factual claims or specific numbers/data
- Over-format with too many headers (use 2-4 main sections typically)
- Remove important information or details
- Add a conclusion if the author didn't have one (you may polish an existing one)

Return ONLY the formatted Markdown content, no explanations or meta-commentary.`;

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
          { role: "user", content: `Please format and polish the following blog article:\n\n${content}` }
        ],
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
          JSON.stringify({ error: "AI service quota exceeded." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const formattedContent = result.choices?.[0]?.message?.content;

    if (!formattedContent) {
      throw new Error("No content returned from AI");
    }

    return new Response(
      JSON.stringify({ 
        formattedContent: formattedContent.trim(),
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in format-blog-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to format content' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
