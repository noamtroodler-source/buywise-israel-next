import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, session_id, user_id } = await req.json();

    if (!url || !session_id) {
      return new Response(
        JSON.stringify({ error: "URL and session_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // --- Rate limit check ---
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const dailyLimit = user_id ? 10 : 3;

    let usageQuery = supabase
      .from("listing_decoder_usage")
      .select("id", { count: "exact", head: true })
      .gte("used_at", todayStart.toISOString());

    if (user_id) {
      usageQuery = usageQuery.eq("user_id", user_id);
    } else {
      usageQuery = usageQuery.eq("session_id", session_id);
    }

    const { count: usageCount } = await usageQuery;
    const currentUsage = usageCount ?? 0;

    if (currentUsage >= dailyLimit) {
      return new Response(
        JSON.stringify({
          error: "Daily limit reached",
          usage: { used: currentUsage, limit: dailyLimit },
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Scrape URL with Firecrawl ---
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ error: "Scraping service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Scraping URL:", url);
    const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url.trim(),
        formats: ["markdown", "screenshot", "links"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResp.json();
    if (!scrapeResp.ok || !scrapeData.success) {
      console.error("Firecrawl error:", scrapeData);
      return new Response(
        JSON.stringify({ error: "Could not scrape that URL. Make sure it's a valid listing page." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const listingContent = scrapeData.data?.markdown || scrapeData.markdown || "";
    const screenshotUrl = scrapeData.data?.screenshot || scrapeData.screenshot || null;
    const scrapedLinks = scrapeData.data?.links || scrapeData.links || [];
    
    // Extract image URLs from links
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
    const extractedImages: string[] = scrapedLinks.filter((link: string) => {
      const lower = link.toLowerCase();
      return imageExtensions.some(ext => lower.includes(ext)) && 
             !lower.includes('logo') && !lower.includes('icon') && !lower.includes('favicon');
    }).slice(0, 20);

    if (!listingContent || listingContent.length < 50) {
      return new Response(
        JSON.stringify({ error: "Could not extract enough content from that URL. Try a different listing." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- AI Analysis via Lovable AI Gateway ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a bilingual (Hebrew/English) Israeli real estate expert helping international buyers understand Hebrew property listings.

Your job:
1. Extract structured property data from the listing
2. Translate the full listing into clear, natural English
3. Identify and explain Israeli-specific real estate terms
4. Critically analyze what information is MISSING from the listing
5. Flag red flags or concerns
6. Suggest questions the buyer should ask

MISSING DATA CHECKLIST — check if each is present. If missing, explain WHY it matters:
- Size in sqm (registered size)
- Number of rooms / bedrooms
- Floor number and total floors in building
- Year built
- Tofes 4 (occupancy permit) status
- Tabu (land registry) status — vs. Minhal/Taboo Rashut
- Parking details (how many spots, covered/uncovered)
- Elevator
- Storage room (machsan)
- Balcony (mirpeset)
- Arnona (municipal tax) monthly amount
- Vaad Bayit (building maintenance) monthly amount
- Property condition / renovation status
- Entry date (when available)
- Photos count (note if suspiciously few)
- Agent fee disclosure

For each missing item, assign a risk_level: "high" (could significantly impact price/legal), "medium" (should know before deciding), or "low" (nice to have).

Be direct, practical, and buyer-focused. Don't sugarcoat.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Analyze this Israeli property listing:\n\n${listingContent.substring(0, 8000)}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "decode_listing",
                description:
                  "Return the structured analysis of an Israeli property listing",
                parameters: {
                  type: "object",
                  properties: {
                    property_summary: {
                      type: "object",
                      properties: {
                        price: { type: "string", description: "Price as displayed (e.g. '₪2,500,000' or '$680,000')" },
                        rooms: { type: "string", description: "Number of rooms (Israeli count)" },
                        bedrooms: { type: "string", description: "Number of bedrooms (Western count)" },
                        sqm: { type: "string", description: "Size in sqm if listed" },
                        floor: { type: "string", description: "Floor number" },
                        total_floors: { type: "string", description: "Total floors in building" },
                        property_type: { type: "string", description: "Type (apartment, penthouse, garden apt, etc.)" },
                        city: { type: "string", description: "City name in English" },
                        neighborhood: { type: "string", description: "Neighborhood name" },
                        year_built: { type: "string", description: "Year built if listed" },
                        condition: { type: "string", description: "Condition/renovation status" },
                        parking: { type: "string", description: "Parking details" },
                        entry_date: { type: "string", description: "When available for move-in" },
                      },
                      required: ["price", "city", "property_type"],
                    },
                    missing_fields: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          field_name: { type: "string" },
                          why_it_matters: { type: "string", description: "Buyer-focused explanation of why this missing info matters" },
                          risk_level: { type: "string", enum: ["high", "medium", "low"] },
                        },
                        required: ["field_name", "why_it_matters", "risk_level"],
                      },
                    },
                    translation: {
                      type: "string",
                      description: "Full natural English translation of the listing",
                    },
                    hebrew_terms: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          term: { type: "string", description: "Hebrew term (in Hebrew characters)" },
                          transliteration: { type: "string", description: "How to pronounce it" },
                          meaning: { type: "string", description: "What it means" },
                          buyer_context: { type: "string", description: "Why a buyer should care about this term" },
                        },
                        required: ["term", "transliteration", "meaning", "buyer_context"],
                      },
                    },
                    red_flags: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          flag: { type: "string", description: "The concern" },
                          explanation: { type: "string", description: "Why this is a red flag and what to do" },
                          severity: { type: "string", enum: ["high", "medium", "low"] },
                        },
                        required: ["flag", "explanation", "severity"],
                      },
                    },
                    questions_to_ask: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          question: { type: "string" },
                          why_ask: { type: "string", description: "Why this question matters" },
                        },
                        required: ["question", "why_ask"],
                      },
                    },
                    detected_city: {
                      type: "string",
                      description: "City name in English (lowercase, for database matching). E.g. 'tel-aviv', 'jerusalem', 'haifa', 'netanya'",
                    },
                  },
                  required: [
                    "property_summary",
                    "missing_fields",
                    "translation",
                    "hebrew_terms",
                    "red_flags",
                    "questions_to_ask",
                    "detected_city",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "decode_listing" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service is busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service quota exceeded." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI analysis failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: "AI analysis returned unexpected format. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let decodedResult;
    try {
      decodedResult = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error("Failed to parse AI response:", toolCall.function.arguments);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI analysis. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- City market context lookup ---
    let marketContext = null;
    const detectedCity = decodedResult.detected_city;
    if (detectedCity) {
      const { data: cityData } = await supabase
        .from("cities")
        .select("name, average_price, average_price_sqm, yoy_price_change, median_apartment_price, gross_yield_percent")
        .eq("slug", detectedCity)
        .maybeSingle();

      if (cityData) {
        marketContext = {
          city_name: cityData.name,
          average_price: cityData.average_price,
          average_price_sqm: cityData.average_price_sqm,
          yoy_price_change: cityData.yoy_price_change,
          median_apartment_price: cityData.median_apartment_price,
          gross_yield_percent: cityData.gross_yield_percent,
        };
      }
    }

    // --- Record usage ---
    await supabase.from("listing_decoder_usage").insert({
      session_id,
      user_id: user_id || null,
    });

    const newUsage = currentUsage + 1;

    return new Response(
      JSON.stringify({
        success: true,
        result: decodedResult,
        market_context: marketContext,
        usage: { used: newUsage, limit: dailyLimit },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("decode-listing error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
