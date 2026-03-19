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

// ─── Tool Definitions ───────────────────────────────────────────────────────

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_listings",
      description: "Search for properties currently listed for sale or rent on BuyWise. Use this whenever a user asks about available apartments, houses, listings, or wants to see what's on the market.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "City name, e.g. 'Ra\\'anana', 'Netanya', 'Jerusalem'" },
          neighborhood: { type: "string", description: "Neighborhood name within the city" },
          listing_status: { type: "string", enum: ["for_sale", "for_rent"], description: "Whether to search sale or rental listings. Defaults to for_sale." },
          property_type: { type: "string", enum: ["apartment", "garden_apartment", "penthouse", "mini_penthouse", "duplex", "house", "cottage", "land", "commercial"], description: "Type of property" },
          min_bedrooms: { type: "number", description: "Minimum number of bedrooms" },
          max_bedrooms: { type: "number", description: "Maximum number of bedrooms" },
          min_price: { type: "number", description: "Minimum price in ILS" },
          max_price: { type: "number", description: "Maximum price in ILS" },
          min_size: { type: "number", description: "Minimum size in sqm" },
          max_size: { type: "number", description: "Maximum size in sqm" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_projects",
      description: "Search for new construction / off-plan projects (from developers). Use when users ask about new builds, new construction, projects, or developer projects.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "City name" },
          min_price: { type: "number", description: "Minimum starting price in ILS" },
          max_price: { type: "number", description: "Maximum starting price in ILS" },
          status: { type: "string", enum: ["planning", "pre_sale", "under_construction", "partially_delivered", "completed"], description: "Project status" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_city_stats",
      description: "Get market statistics and price data for a specific city. Use when users ask about prices, trends, or market conditions in a city.",
      parameters: {
        type: "object",
        properties: {
          city_name: { type: "string", description: "City name, e.g. 'Netanya', 'Ra\\'anana'" },
        },
        required: ["city_name"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_nearby_comps",
      description: "Get recently sold comparable properties near a specific location. Use when users ask about recent sales, fair price, or want comps for negotiation.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "City name" },
          latitude: { type: "number", description: "Latitude of the property" },
          longitude: { type: "number", description: "Longitude of the property" },
          min_rooms: { type: "number", description: "Minimum rooms to filter comps" },
          max_rooms: { type: "number", description: "Maximum rooms to filter comps" },
        },
        required: ["city"],
        additionalProperties: false,
      },
    },
  },
];

// ─── Tool Executors ─────────────────────────────────────────────────────────

async function executeSearchListings(supabase: any, args: any): Promise<string> {
  let query = supabase
    .from("properties")
    .select("id, title, city, neighborhood, price, bedrooms, bathrooms, size_sqm, property_type, listing_status, currency, floor, total_floors, features, condition, entry_date, parking")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (args.city) query = query.ilike("city", `%${args.city}%`);
  if (args.neighborhood) query = query.ilike("neighborhood", `%${args.neighborhood}%`);
  if (args.listing_status) query = query.eq("listing_status", args.listing_status);
  else query = query.eq("listing_status", "for_sale");
  if (args.property_type) query = query.eq("property_type", args.property_type);
  if (args.min_bedrooms) query = query.gte("bedrooms", args.min_bedrooms);
  if (args.max_bedrooms) query = query.lte("bedrooms", args.max_bedrooms);
  if (args.min_price) query = query.gte("price", args.min_price);
  if (args.max_price) query = query.lte("price", args.max_price);
  if (args.min_size) query = query.gte("size_sqm", args.min_size);
  if (args.max_size) query = query.lte("size_sqm", args.max_size);

  const { data, error } = await query;
  if (error) return `Error searching listings: ${error.message}`;
  if (!data?.length) return "No listings found matching those criteria. Try broadening your search.";

  const results = data.map((p: any) => ({
    id: p.id,
    title: p.title || `${p.bedrooms}BR ${p.property_type} in ${p.neighborhood || p.city}`,
    city: p.city,
    neighborhood: p.neighborhood,
    price: p.price,
    currency: p.currency || "ILS",
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    size_sqm: p.size_sqm,
    property_type: p.property_type,
    listing_status: p.listing_status,
    floor: p.floor,
    total_floors: p.total_floors,
    condition: p.condition,
    entry_date: p.entry_date,
    parking: p.parking,
    features: p.features?.slice(0, 5),
    link: `/property/${p.id}`,
  }));

  return JSON.stringify({ count: results.length, listings: results });
}

async function executeSearchProjects(supabase: any, args: any): Promise<string> {
  let query = supabase
    .from("projects")
    .select("id, name, slug, city, neighborhood, price_from, price_to, status, min_bedrooms, max_bedrooms, estimated_completion, developer_id")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (args.city) query = query.ilike("city", `%${args.city}%`);
  if (args.min_price) query = query.gte("price_from", args.min_price);
  if (args.max_price) query = query.lte("price_from", args.max_price);
  if (args.status) query = query.eq("status", args.status);

  const { data, error } = await query;
  if (error) return `Error searching projects: ${error.message}`;
  if (!data?.length) return "No new construction projects found matching those criteria.";

  const results = data.map((p: any) => ({
    name: p.name,
    slug: p.slug,
    city: p.city,
    neighborhood: p.neighborhood,
    price_from: p.price_from,
    price_to: p.price_to,
    status: p.status,
    bedrooms: p.min_bedrooms && p.max_bedrooms ? `${p.min_bedrooms}-${p.max_bedrooms}` : null,
    estimated_completion: p.estimated_completion,
    link: `/projects/${p.slug}`,
  }));

  return JSON.stringify({ count: results.length, projects: results });
}

async function executeGetCityStats(supabase: any, args: any): Promise<string> {
  // Get city data
  const { data: city } = await supabase
    .from("cities")
    .select("name, average_price, average_price_sqm, yoy_price_change, median_apartment_price, gross_yield_percent, rental_3_room_min, rental_3_room_max, rental_4_room_min, rental_4_room_max, population, socioeconomic_rank, commute_time_tel_aviv, commute_time_jerusalem, arnona_rate_sqm, average_vaad_bayit, identity_sentence, highlights")
    .ilike("name", `%${args.city_name}%`)
    .limit(1)
    .maybeSingle();

  if (!city) return `No city data found for "${args.city_name}". Try a different city name.`;

  // Get recent price history
  const { data: priceHistory } = await supabase
    .from("city_price_history")
    .select("year, quarter, rooms, avg_price_nis")
    .ilike("city_en", `%${args.city_name}%`)
    .order("year", { ascending: false })
    .order("quarter", { ascending: false })
    .limit(8);

  // Count active listings
  const { count: listingCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true)
    .ilike("city", `%${args.city_name}%`);

  return JSON.stringify({
    city: city.name,
    average_price: city.average_price,
    price_per_sqm: city.average_price_sqm,
    yoy_change: city.yoy_price_change,
    median_apartment_price: city.median_apartment_price,
    gross_yield: city.gross_yield_percent,
    rental_3br: city.rental_3_room_min && city.rental_3_room_max ? `₪${city.rental_3_room_min}-${city.rental_3_room_max}/mo` : null,
    rental_4br: city.rental_4_room_min && city.rental_4_room_max ? `₪${city.rental_4_room_min}-${city.rental_4_room_max}/mo` : null,
    population: city.population,
    socioeconomic_rank: city.socioeconomic_rank,
    commute_tel_aviv: city.commute_time_tel_aviv,
    commute_jerusalem: city.commute_time_jerusalem,
    arnona_per_sqm: city.arnona_rate_sqm,
    avg_vaad_bayit: city.average_vaad_bayit,
    description: city.identity_sentence,
    highlights: city.highlights,
    active_listings: listingCount || 0,
    recent_prices: priceHistory || [],
  });
}

async function executeGetNearbyComps(supabase: any, args: any): Promise<string> {
  // If we have lat/lng, use the DB function
  if (args.latitude && args.longitude) {
    const { data, error } = await supabase.rpc("get_nearby_sold_comps", {
      p_lat: args.latitude,
      p_lng: args.longitude,
      p_city: args.city,
      p_radius_km: 0.5,
      p_months_back: 24,
      p_limit: 5,
      p_min_rooms: args.min_rooms || null,
      p_max_rooms: args.max_rooms || null,
    });

    if (error) return `Error fetching comps: ${error.message}`;
    if (!data?.length) return `No recent sold comparables found near that location in ${args.city}.`;

    return JSON.stringify({
      count: data.length,
      comps: data.map((c: any) => ({
        sold_price: c.sold_price,
        sold_date: c.sold_date,
        rooms: c.rooms,
        size_sqm: c.size_sqm,
        property_type: c.property_type,
        price_per_sqm: c.price_per_sqm,
        distance_meters: c.distance_meters,
        is_same_building: c.is_same_building,
      })),
    });
  }

  // Fallback: just query sold_transactions by city
  const { data, error } = await supabase
    .from("sold_transactions")
    .select("sold_price, sold_date, rooms, size_sqm, property_type, price_per_sqm, neighborhood")
    .eq("city", args.city)
    .order("sold_date", { ascending: false })
    .limit(5);

  if (error) return `Error fetching comps: ${error.message}`;
  if (!data?.length) return `No recent sold data found for ${args.city}.`;

  return JSON.stringify({ count: data.length, comps: data });
}

async function executeTool(supabase: any, toolName: string, args: any): Promise<string> {
  switch (toolName) {
    case "search_listings": return executeSearchListings(supabase, args);
    case "search_projects": return executeSearchProjects(supabase, args);
    case "get_city_stats": return executeGetCityStats(supabase, args);
    case "get_nearby_comps": return executeGetNearbyComps(supabase, args);
    default: return `Unknown tool: ${toolName}`;
  }
}

// ─── System Prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT_IDENTITY = `You are BuyWise — a knowledgeable, warm, and honest friend helping English-speaking buyers navigate the Israeli real estate market. You work for BuyWise Israel (buywise-israel-next.lovable.app), a platform built specifically for Anglo buyers in Israel.

## CRITICAL: You Have Tools — USE THEM
You have access to tools that query BuyWise's live database of properties, projects, and market data. 
- When a user asks about listings, apartments, prices, or wants to see what's available — ALWAYS call search_listings or search_projects first.
- When a user asks about a city's market, prices, or trends — call get_city_stats.
- When a user wants comparable sales for negotiation — call get_nearby_comps.
- NEVER say "I don't have access to listings" — you DO. Use your tools.
- When you get listing results, ALWAYS format them with markdown links: [Title](/property/id) or [Project Name](/projects/slug)
- Include key details: price, bedrooms, neighborhood, size when available.

## CRITICAL: Response Length Rules (NEVER violate these)
- Your responses MUST be SHORT. Think text message, not essay.
- DEFAULT max: 3-4 sentences + listing results. That's it. Period.
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

### Rule 5: When showing listings
If the user gives enough detail (city, budget, rooms), call search_listings immediately — don't ask for clarification you don't need. Show what's available and let them refine.

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
- NEVER fabricate specific numbers, tax rates, or legal advice. Use the data provided to you or from tools.
- If you don't know something specific, say "I'm not sure about that specific detail — I'd recommend checking with a lawyer" or similar
- For legal/tax specifics, always suggest consulting a professional
- Link to relevant BuyWise guides when applicable using markdown: [Guide Name](/guides/slug)
- Link to BuyWise tools when relevant: [Tool Name](/tools?tool=slug)
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
- When you have listing/project data from tools, ALWAYS include markdown links.
- Format for properties: [Brief description](/property/{id})
- Format for projects: [Project Name](/projects/{slug})
- When discussing a neighborhood in general, link to filtered listings: [See apartments in Ir Yamim](/listings?status=for_sale&city=Netanya&neighborhood=Ir+Yamim)
- If you know the bedroom count, add it: [See 4BR in Ir Yamim](/listings?status=for_sale&city=Netanya&neighborhood=Ir+Yamim&bedrooms=4)
- ALWAYS prefer linking to real listings/projects you have data for over generic advice.`;

async function buildSystemPrompt(
  pageContext: string,
  supabaseUrl: string,
  supabaseKey: string,
  userToken?: string,
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

// ─── Main Handler ───────────────────────────────────────────────────────────

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";

    // Extract user token for profile injection
    const userToken = req.headers.get("x-user-token") || undefined;

    const systemPrompt = await buildSystemPrompt(pageContext || "", supabaseUrl, supabaseAnonKey, userToken);

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
    ];

    // ── Step 1: Non-streaming call WITH tools to let AI decide if it needs data ──
    const toolResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        tools: TOOLS,
        stream: false,
      }),
    });

    if (!toolResponse.ok) {
      const status = toolResponse.status;
      const t = await toolResponse.text();
      console.error("AI gateway error (tool call):", status, t);
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "I'm getting a lot of questions right now. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Something went wrong. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toolResult = await toolResponse.json();
    const choice = toolResult.choices?.[0];

    // ── Step 2: If no tool calls, stream the response directly ──
    if (!choice?.message?.tool_calls?.length) {
      // The AI responded with content directly — re-request with streaming
      const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          stream: true,
        }),
      });

      if (!streamResponse.ok) {
        const t = await streamResponse.text();
        console.error("AI gateway stream error:", streamResponse.status, t);
        return new Response(
          JSON.stringify({ error: "Something went wrong. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(streamResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // ── Step 3: Execute tool calls ──
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const toolCalls = choice.message.tool_calls;

    // Add the assistant's tool_call message to history
    aiMessages.push(choice.message);

    // Execute all tool calls in parallel
    const toolResults = await Promise.all(
      toolCalls.map(async (tc: any) => {
        const args = typeof tc.function.arguments === "string"
          ? JSON.parse(tc.function.arguments)
          : tc.function.arguments;

        console.log(`Executing tool: ${tc.function.name}`, args);
        const result = await executeTool(serviceClient, tc.function.name, args);
        return {
          role: "tool" as const,
          tool_call_id: tc.id,
          content: result,
        };
      })
    );

    // Add tool results to messages
    aiMessages.push(...toolResults);

    // ── Step 4: Stream the final response with tool results ──
    const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!finalResponse.ok) {
      const t = await finalResponse.text();
      console.error("AI gateway final stream error:", finalResponse.status, t);
      return new Response(
        JSON.stringify({ error: "Something went wrong. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(finalResponse.body, {
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
