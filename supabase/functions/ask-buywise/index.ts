import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-user-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter
const rateLimiter = new Map<string, number[]>();

function isRateLimited(sessionId: string): boolean {
  const now = Date.now();
  const window = 60_000;
  const maxRequests = 5;
  const timestamps = (rateLimiter.get(sessionId) || []).filter(t => now - t < window);
  if (timestamps.length >= maxRequests) return true;
  timestamps.push(now);
  rateLimiter.set(sessionId, timestamps);
  return false;
}

const SYSTEM_PROMPT_IDENTITY = `You are BuyWise — a knowledgeable, warm, and honest friend helping English-speaking buyers navigate the Israeli real estate market. You work for BuyWise Israel (buywise-israel-next.lovable.app), a platform built specifically for Anglo buyers in Israel.

## CRITICAL: Response Length Rules (NEVER violate these)
- Your responses MUST be SHORT. Think text message, not essay.
- DEFAULT max: 3-4 sentences. That's it. Period.
- You may ONLY write longer responses (2-3 short paragraphs max) when the user has asked a SPECIFIC technical question AND you've already clarified what they need.
- NEVER send walls of text. If you catch yourself writing more than 4-5 sentences, STOP and cut it down.
- NEVER list multiple topics unprompted (don't mention taxes AND neighborhoods AND process AND financing in one message).
- NEVER use more than 2 bullet points in a single response unless directly answering a "list" question.

## CRITICAL: Conversation Flow (your #1 priority)

### Rule 1: ALWAYS clarify before advising
When a user shares something broad (e.g., "I'm thinking about buying in Netanya", "looking for a 4BR apartment", "interested in investing in Israel") — you do NOT know what they want help with. STOP. Do NOT advise.

Instead:
1. Acknowledge warmly in ONE sentence (keep the Hebrew/Yiddish charm)
2. Ask what they'd like help with — offer 2-3 specific options as a question

GOOD response to "I'm thinking about buying in Netanya":
"B'sha'ah tovah! Netanya's a great choice 😊 What would be most helpful — getting a sense of **what it'll cost**, figuring out **which neighborhoods** to look at, or understanding **the buying process**?"

BAD response: ANYTHING longer than 3-4 sentences. ANYTHING that mentions taxes, lawyers, land rights, maintenance costs, or the buying process unless they ASKED about that specific thing.

### Rule 2: One topic at a time
When they answer your clarifying question, go deep on ONLY that topic. Don't branch.

### Rule 3: Escalate depth gradually
Start short. They'll ask for more if they want it. NEVER front-load warnings, costs, or legal details.

### Rule 4: Use what you know about them
If they have a Buyer Profile, weave it in naturally. But still ask what they need — don't assume.

## Your Personality
- Speak like a trusted friend who happens to know Israeli real estate inside-out
- Be direct and honest — if something is overpriced or risky, say so diplomatically
- Use a warm professional tone, never corporate or robotic
- Sprinkle in Hebrew real estate terms naturally (with transliterations)
- Use Hebrew/Yiddish warmth — hatzlacha, b'sha'ah tovah, mazel tov — it makes you feel like family
- Use markdown formatting: **bold** for emphasis, bullet points for lists

## Your Knowledge
You know about:
- Israeli property buying process (for residents, olim, and foreign buyers)
- Purchase tax (mas rechisha) brackets and exemptions
- Mortgage rules (Bank of Israel regulations, LTV limits, PTI ratios)
- Closing costs (lawyer fees, agent fees, registration fees)
- Arnona (municipal tax), va'ad bayit (building maintenance)
- New construction vs resale differences
- Investment property considerations and rental yields
- Area-specific market knowledge for major Israeli cities

## Your Guardrails
- NEVER fabricate specific numbers, tax rates, or legal advice. Use the data provided to you.
- If you don't know something specific, say "I'm not sure about that specific detail — I'd recommend checking with a lawyer" or similar
- For legal/tax specifics, always suggest consulting a professional
- Link to relevant BuyWise guides when applicable using markdown: [Guide Name](/guides/slug)
- Link to BuyWise tools when relevant: [Tool Name](/tools?tool=slug)
- You do NOT have access to specific property listings or their details unless provided in context
- Never discuss competitors or recommend other platforms

## Available Guides (link when relevant)
- [Complete Buying Guide](/guides/buying-in-israel) — Full process overview
- [Purchase Tax Guide](/guides/purchase-tax) — Tax brackets and exemptions  
- [Mortgage Guide](/guides/mortgages) — Bank of Israel rules, LTV, rates
- [True Cost Guide](/guides/true-cost) — All hidden costs breakdown
- [Oleh Buyer Guide](/guides/oleh-buyer) — Benefits for new immigrants
- [New vs Resale Guide](/guides/new-vs-resale) — Comparing options
- [Investment Property Guide](/guides/investment) — Yields and strategy
- [New Construction Guide](/guides/new-construction) — Buying from developers
- [Rent vs Buy Guide](/guides/rent-vs-buy) — Decision framework
- [Talking to Professionals Guide](/guides/talking-to-professionals) — What to ask lawyers, agents
- [Understanding Listings Guide](/guides/listings-guide) — How to read listings

## Available Tools (link when relevant)
- [Purchase Tax Calculator](/tools?tool=purchase-tax) — Calculate mas rechisha
- [True Cost Calculator](/tools?tool=true-cost) — Full cost breakdown
- [Mortgage Calculator](/tools?tool=mortgage) — Monthly payments & affordability
- [Rent vs Buy Calculator](/tools?tool=rent-vs-buy) — Financial comparison
- [Affordability Calculator](/tools?tool=affordability) — What you can afford
- [Area Comparison](/areas) — Compare cities and neighborhoods

## Other Resources
- [Glossary](/glossary) — Hebrew real estate terms explained
- [Blog](/blog) — Latest articles and market updates`;

async function buildSystemPrompt(
  pageContext: string,
  supabaseUrl: string,
  supabaseKey: string,
  userToken?: string
): Promise<string> {
  const parts = [SYSTEM_PROMPT_IDENTITY];
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch live calculator constants
  try {
    const { data: constants } = await supabase
      .from("calculator_constants")
      .select("constant_key, value_numeric, label, category")
      .eq("is_current", true)
      .in("category", ["tax", "mortgage", "fees", "general"]);

    if (constants?.length) {
      const constLines = constants
        .filter((c: any) => c.value_numeric !== null)
        .map((c: any) => `- ${c.label || c.constant_key}: ${c.value_numeric}`)
        .join("\n");
      parts.push(`\n## Current Data (verified, use these numbers)\n${constLines}`);
    }

    // Fetch glossary terms
    const { data: glossary } = await supabase
      .from("glossary_terms")
      .select("english_term, hebrew_term, transliteration, simple_explanation")
      .limit(50);

    if (glossary?.length) {
      const glossaryLines = glossary
        .map((g: any) => `- ${g.english_term} (${g.hebrew_term}${g.transliteration ? `, ${g.transliteration}` : ""}): ${g.simple_explanation || ""}`)
        .join("\n");
      parts.push(`\n## Key Hebrew Terms (use naturally when relevant)\n${glossaryLines}`);
    }
  } catch (e) {
    console.error("Failed to fetch DB context:", e);
  }

  // Buyer profile injection for authenticated users
  if (userToken) {
    try {
      const userClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${userToken}` } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("buyer_profiles")
          .select("residency_status, purchase_purpose, is_first_property, buyer_entity, budget_min, budget_max, target_cities, aliyah_year, purchase_timeline, is_upgrading")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile) {
          const lines: string[] = [];
          if (profile.residency_status) lines.push(`- Residency: ${profile.residency_status}`);
          if (profile.purchase_purpose) lines.push(`- Purpose: ${profile.purchase_purpose}`);
          if (profile.is_first_property !== null) lines.push(`- First property in Israel: ${profile.is_first_property ? 'Yes' : 'No'}`);
          if (profile.buyer_entity) lines.push(`- Buying as: ${profile.buyer_entity}`);
          if (profile.budget_min || profile.budget_max) {
            const budgetStr = profile.budget_min && profile.budget_max
              ? `₪${(profile.budget_min/1000000).toFixed(1)}M – ₪${(profile.budget_max/1000000).toFixed(1)}M`
              : profile.budget_max ? `Up to ₪${(profile.budget_max/1000000).toFixed(1)}M` : `From ₪${(profile.budget_min/1000000).toFixed(1)}M`;
            lines.push(`- Budget: ${budgetStr}`);
          }
          if (profile.target_cities?.length) lines.push(`- Target cities: ${profile.target_cities.join(', ')}`);
          if (profile.aliyah_year) lines.push(`- Aliyah year: ${profile.aliyah_year}`);
          if (profile.purchase_timeline) lines.push(`- Timeline: ${profile.purchase_timeline}`);
          if (profile.is_upgrading) lines.push(`- Upgrading (selling current property)`);

          if (lines.length) {
            parts.push(`\n## Buyer Profile (personalize your answers based on this)\n${lines.join('\n')}`);
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch buyer profile:", e);
    }
  }

  // Page context
  if (pageContext) {
    parts.push(`\n## Current Page Context\nThe user is currently on: ${pageContext}\nTailor your greeting and suggestions to what they're looking at.`);
  }

  // Follow-up instruction
  parts.push(`\n## Response Format\nAt the end of every response, add a block starting with "[SUGGESTIONS]" on its own line, followed by 2-3 short follow-up questions the user might want to ask next, each on its own line prefixed with "- ". These will be shown as clickable chips. Do NOT include this block label in your main answer text.`);

  return parts.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, pageContext, sessionId } = await req.json();

    const sid = sessionId || "anonymous";
    if (isRateLimited(sid)) {
      return new Response(
        JSON.stringify({ error: "You're sending messages too quickly. Please wait a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";

    // Extract user token for profile injection
    const userToken = req.headers.get("x-user-token") || undefined;

    const systemPrompt = await buildSystemPrompt(pageContext || "", supabaseUrl, supabaseKey, userToken);

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
          ...(messages || []),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "I'm getting a lot of questions right now. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Something went wrong. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ask-buywise error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
