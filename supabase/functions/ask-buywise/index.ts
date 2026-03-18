import { createClient } from "npm:@supabase/supabase-js@2";

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
- [Blog](/blog) — Latest articles and market updates

## Linking to Listings & Projects
- When you mention specific properties or projects from the "Available Listings" data below, ALWAYS include a markdown link.
- Format for properties: [Brief description](/property/{id})
- Format for projects: [Project Name](/projects/{slug})
- When discussing a neighborhood in general, link to filtered listings: [See apartments in Ir Yamim](/listings?status=for_sale&city=Netanya&neighborhood=Ir+Yamim)
- If you know the bedroom count, add it: [See 4BR in Ir Yamim](/listings?status=for_sale&city=Netanya&neighborhood=Ir+Yamim&bedrooms=4)
- ALWAYS prefer linking to real listings/projects you have data for over generic advice.`;

const KNOWN_CITIES = [
  "Ashdod", "Ashkelon", "Beer Sheva", "Beit Shemesh", "Caesarea",
  "Efrat", "Eilat", "Givat Shmuel", "Gush Etzion",
  "Hadera", "Haifa", "Herzliya", "Hod HaSharon", "Jerusalem",
  "Kfar Saba", "Ma'ale Adumim", "Mevaseret Zion", "Modi'in",
  "Netanya", "Pardes Hanna", "Petah Tikva", "Ra'anana", "Ramat Gan",
  "Tel Aviv", "Zichron Yaakov"
];

function extractCities(text: string): string[] {
  const lower = text.toLowerCase();
  return KNOWN_CITIES.filter(c => lower.includes(c.toLowerCase()));
}

function extractBedrooms(text: string): number | null {
  // Match patterns like "4 bedroom", "4-bedroom", "4BR", "4 bed"
  const match = text.match(/(\d)\s*[-]?\s*(?:bedroom|bed\b|br\b)/i);
  return match ? parseInt(match[1]) : null;
}

async function fetchListingsContext(
  supabase: any,
  cities: string[],
  bedrooms: number | null
): Promise<string> {
  const parts: string[] = [];

  // Query properties
  let propQuery = supabase
    .from("properties")
    .select("id, title, address, city, neighborhood, price, bedrooms, property_type, currency")
    .eq("is_published", true)
    .eq("listing_status", "for_sale")
    .order("created_at", { ascending: false })
    .limit(10);

  if (cities.length) propQuery = propQuery.in("city", cities);
  if (bedrooms) propQuery = propQuery.eq("bedrooms", bedrooms);

  const { data: properties } = await propQuery;

  if (properties?.length) {
    const lines = properties.map((p: any) =>
      `- [${p.title || `${p.bedrooms}BR in ${p.neighborhood || p.city}`}](/property/${p.id}) — ${p.neighborhood || ''}, ${p.city} | ₪${(p.price / 1000000).toFixed(1)}M | ${p.bedrooms}BR | ${p.property_type}`
    );
    parts.push(`### Properties for Sale\n${lines.join("\n")}`);
  }

  // Query rental properties
  let rentalQuery = supabase
    .from("properties")
    .select("id, title, address, city, neighborhood, price, bedrooms, property_type, currency")
    .eq("is_published", true)
    .eq("listing_status", "for_rent")
    .order("created_at", { ascending: false })
    .limit(5);

  if (cities.length) rentalQuery = rentalQuery.in("city", cities);
  if (bedrooms) rentalQuery = rentalQuery.eq("bedrooms", bedrooms);

  const { data: rentals } = await rentalQuery;

  if (rentals?.length) {
    const lines = rentals.map((p: any) =>
      `- [${p.title || `${p.bedrooms}BR rental in ${p.neighborhood || p.city}`}](/property/${p.id}) — ${p.neighborhood || ''}, ${p.city} | ₪${p.price.toLocaleString()}/mo | ${p.bedrooms}BR`
    );
    parts.push(`### Rentals\n${lines.join("\n")}`);
  }

  // Query projects
  let projQuery = supabase
    .from("projects")
    .select("id, name, slug, city, neighborhood, price_from, price_to, status, min_bedrooms, max_bedrooms")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(5);

  if (cities.length) projQuery = projQuery.in("city", cities);

  const { data: projects } = await projQuery;

  if (projects?.length) {
    const lines = projects.map((p: any) => {
      const priceStr = p.price_from ? `from ₪${(p.price_from / 1000000).toFixed(1)}M` : "price TBD";
      const bedStr = p.min_bedrooms && p.max_bedrooms ? `${p.min_bedrooms}-${p.max_bedrooms}BR` : "";
      return `- [${p.name}](/projects/${p.slug}) — ${p.neighborhood || ''}, ${p.city} | ${priceStr} | ${bedStr} | ${p.status}`;
    });
    parts.push(`### New Construction Projects\n${lines.join("\n")}`);
  }

  if (!parts.length) return "";
  return `\n## Available Listings (reference these with links when relevant)\n${parts.join("\n\n")}`;
}

async function buildSystemPrompt(
  pageContext: string,
  supabaseUrl: string,
  supabaseKey: string,
  userToken?: string,
  userQuery?: string
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

  // Fetch relevant listings based on conversation context
  try {
    const searchText = [pageContext, userQuery || ""].join(" ");
    const cities = extractCities(searchText);
    const bedrooms = extractBedrooms(searchText);
    
    if (cities.length || bedrooms) {
      const listingsContext = await fetchListingsContext(supabase, cities, bedrooms);
      if (listingsContext) {
        parts.push(listingsContext);
      }
    }
  } catch (e) {
    console.error("Failed to fetch listings context:", e);
  }

  // Page context
  if (pageContext) {
    parts.push(`\n## Current Page Context\nThe user is currently on: ${pageContext}\nTailor your greeting and suggestions to what they're looking at.`);
  }

  // Follow-up instruction
  parts.push(`\n## Response Format\nAt the end of every response, add a block starting with "[SUGGESTIONS]" on its own line, followed by 2-3 short follow-up questions the user might want to ask next, each on its own line prefixed with "- ". These will be shown as clickable chips. Do NOT include this block label in your main answer text.`);

  return parts.join("\n");
}

Deno.serve(async (req) => {
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

    // Extract latest user message for search intent
    const userMessages = (messages || []).filter((m: any) => m.role === "user");
    const userQuery = userMessages.length ? userMessages[userMessages.length - 1].content : "";

    const systemPrompt = await buildSystemPrompt(pageContext || "", supabaseUrl, supabaseKey, userToken, userQuery);

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
