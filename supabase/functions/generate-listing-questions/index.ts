import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ListingData {
  type: 'buy' | 'rent' | 'project';
  entity_id?: string;   // property_id or project_id for caching
  entity_type?: 'property' | 'project';  // for caching
  price?: number;
  size_sqm?: number;
  price_per_sqm?: number;
  year_built?: number;
  days_on_market?: number;
  price_reduced?: boolean;
  price_drop_percent?: number;
  condition?: string;
  city?: string;
  neighborhood?: string;
  property_type?: string;
  bedrooms?: number;
  has_parking?: boolean;
  has_elevator?: boolean;
  floor?: number;
  total_floors?: number;
  missing_fields?: string[];
  // Project-specific
  delivery_year?: number;
  has_payment_schedule?: boolean;
  has_bank_guarantee?: boolean;
  developer_name?: string;
}

interface QuestionFromDB {
  id: string;
  question_text: string;
  why_it_matters: string;
  category: string;
  priority: number;
  applies_to: {
    listing_status?: string[];
    is_new_construction?: boolean;
    is_resale?: boolean;
  } | null;
}

interface GeneratedQuestion {
  question_text: string;
  why_it_matters: string;
  category: string;
  is_ai_generated: boolean;
}

// Generate a stable cache key from listing data
function generateCacheKey(listing: ListingData): string {
  const keyParts = [
    listing.type,
    listing.price?.toString() || '',
    listing.size_sqm?.toString() || '',
    listing.year_built?.toString() || '',
    listing.city || '',
    listing.neighborhood || '',
    listing.property_type || '',
    listing.bedrooms?.toString() || '',
  ];
  return keyParts.join('|');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listing } = await req.json() as { listing: ListingData };
    
    if (!listing || !listing.type) {
      return new Response(
        JSON.stringify({ error: "Missing listing data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first if we have entity identifiers
    if (listing.entity_id && listing.entity_type) {
      const cacheKey = generateCacheKey(listing);
      
      const { data: cached } = await supabase
        .from("listing_question_cache")
        .select("questions, source")
        .eq("entity_type", listing.entity_type)
        .eq("entity_id", listing.entity_id)
        .eq("cache_key", cacheKey)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      
      if (cached) {
        console.log("Cache hit for", listing.entity_type, listing.entity_id);
        return new Response(
          JSON.stringify({ 
            questions: cached.questions,
            source: "cached"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return await getFallbackQuestions(listing);
    }

    const { data: allQuestions, error: dbError } = await supabase
      .from("property_questions")
      .select("id, question_text, why_it_matters, category, priority, applies_to")
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (dbError) {
      console.error("Error fetching questions:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch questions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pre-filter questions based on listing type
    const filteredQuestions = filterQuestionsForListing(allQuestions || [], listing);
    const top20Questions = filteredQuestions.slice(0, 20);

    if (top20Questions.length === 0) {
      return new Response(
        JSON.stringify({ questions: [], source: "empty" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the AI prompt
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(listing, top20Questions);

    // Call Gemini Flash via Lovable AI Gateway
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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_questions",
              description: "Return 5-6 curated due diligence questions for this listing",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question_text: { type: "string", description: "The question to ask" },
                        why_it_matters: { type: "string", description: "Brief explanation customized to this listing" },
                        category: { type: "string", enum: ["pricing", "legal", "building", "construction", "neighborhood", "rental"] },
                        is_ai_generated: { type: "boolean", description: "True if this is a new question, false if from library" }
                      },
                      required: ["question_text", "why_it_matters", "category", "is_ai_generated"],
                      additionalProperties: false
                    },
                    minItems: 5,
                    maxItems: 6
                  }
                },
                required: ["questions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_questions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limited by AI gateway");
        return await getFallbackQuestions(listing, top20Questions);
      }
      if (response.status === 402) {
        console.error("Payment required for AI gateway");
        return await getFallbackQuestions(listing, top20Questions);
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return await getFallbackQuestions(listing, top20Questions);
    }

    const aiResponse = await response.json();
    
    // Extract questions from tool call response
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "provide_questions") {
      console.error("Unexpected AI response format");
      return await getFallbackQuestions(listing, top20Questions);
    }

    let questions: GeneratedQuestion[];
    try {
      const args = JSON.parse(toolCall.function.arguments);
      questions = args.questions;
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return await getFallbackQuestions(listing, top20Questions);
    }

    // Validate and return
    if (!Array.isArray(questions) || questions.length < 5) {
      console.error("Invalid questions array from AI");
      return await getFallbackQuestions(listing, top20Questions);
    }

    const finalQuestions = questions.slice(0, 6);

    // Cache the AI-generated questions if we have entity identifiers
    if (listing.entity_id && listing.entity_type) {
      const cacheKey = generateCacheKey(listing);
      
      // Upsert to handle race conditions
      await supabase
        .from("listing_question_cache")
        .upsert({
          entity_type: listing.entity_type,
          entity_id: listing.entity_id,
          cache_key: cacheKey,
          questions: finalQuestions,
          source: "ai",
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, {
          onConflict: "entity_type,entity_id,cache_key"
        });
      
      console.log("Cached questions for", listing.entity_type, listing.entity_id);
    }

    return new Response(
      JSON.stringify({ 
        questions: finalQuestions,
        source: "ai"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-listing-questions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSystemPrompt(): string {
  return `You are a real estate due diligence expert specializing in the Israeli property market.
Your job is to select and customize the most valuable questions a buyer or renter should ask about a specific listing.

Guidelines:
- Select exactly 5-6 questions total
- Prioritize questions that relate to THIS SPECIFIC listing's characteristics
- If you see anomalies (old building, price drop, long time on market, missing info), address them with relevant questions
- Customize the "why it matters" explanation to reference actual listing data when relevant
- You may create 1-2 original questions if the listing has unique issues not covered by the library
- Keep questions actionable, non-obvious, and valuable
- For rentals, focus on lease terms, landlord responsibilities, and hidden costs
- For new construction projects, focus on developer reliability, payment terms, and delivery guarantees
- For resale properties, focus on building condition, pricing justification, and legal status

Categories to use:
- pricing: Cost-related questions (price, fees, negotiations)
- legal: Legal and documentation questions
- building: Building-related questions (condition, management, neighbors)
- construction: Construction and renovation questions
- neighborhood: Location and area questions
- rental: Rental-specific questions (lease, landlord, deposits)`;
}

function buildUserPrompt(listing: ListingData, questions: QuestionFromDB[]): string {
  const listingType = listing.type === 'project' ? 'New Construction Project' : 
                      listing.type === 'rent' ? 'Rental' : 'Purchase (Resale)';
  
  const missingInfo = listing.missing_fields?.length ? listing.missing_fields.join(', ') : 'None identified';
  
  let propertyDetails = `Listing Type: ${listingType}`;
  
  if (listing.price) {
    propertyDetails += `\n- Price: ₪${listing.price.toLocaleString()}`;
  }
  if (listing.size_sqm) {
    propertyDetails += `\n- Size: ${listing.size_sqm} sqm`;
  }
  if (listing.price_per_sqm) {
    propertyDetails += `\n- Price per sqm: ₪${listing.price_per_sqm.toLocaleString()}`;
  }
  if (listing.year_built) {
    const age = new Date().getFullYear() - listing.year_built;
    propertyDetails += `\n- Year Built: ${listing.year_built} (${age} years old)`;
  }
  if (listing.days_on_market !== undefined) {
    propertyDetails += `\n- Days on Market: ${listing.days_on_market}`;
  }
  if (listing.price_reduced) {
    propertyDetails += `\n- Price Reduced: Yes${listing.price_drop_percent ? `, by ${listing.price_drop_percent}%` : ''}`;
  }
  if (listing.condition) {
    propertyDetails += `\n- Condition: ${listing.condition}`;
  }
  if (listing.city) {
    propertyDetails += `\n- Location: ${listing.city}${listing.neighborhood ? `, ${listing.neighborhood}` : ''}`;
  }
  if (listing.property_type) {
    propertyDetails += `\n- Property Type: ${listing.property_type}`;
  }
  if (listing.bedrooms) {
    propertyDetails += `\n- Bedrooms: ${listing.bedrooms}`;
  }
  if (listing.floor !== undefined) {
    propertyDetails += `\n- Floor: ${listing.floor}${listing.total_floors ? ` of ${listing.total_floors}` : ''}`;
  }
  if (listing.has_elevator !== undefined) {
    propertyDetails += `\n- Elevator: ${listing.has_elevator ? 'Yes' : 'No'}`;
  }
  if (listing.has_parking !== undefined) {
    propertyDetails += `\n- Parking: ${listing.has_parking ? 'Yes' : 'No'}`;
  }
  
  // Project-specific
  if (listing.type === 'project') {
    if (listing.delivery_year) {
      propertyDetails += `\n- Expected Delivery: ${listing.delivery_year}`;
    }
    if (listing.has_payment_schedule !== undefined) {
      propertyDetails += `\n- Payment Schedule Available: ${listing.has_payment_schedule ? 'Yes' : 'No'}`;
    }
    if (listing.has_bank_guarantee !== undefined) {
      propertyDetails += `\n- Bank Guarantee: ${listing.has_bank_guarantee ? 'Yes' : 'Not specified'}`;
    }
    if (listing.developer_name) {
      propertyDetails += `\n- Developer: ${listing.developer_name}`;
    }
  }
  
  propertyDetails += `\n- Missing Information: ${missingInfo}`;

  const questionLibrary = questions
    .map((q, i) => `${i + 1}. [${q.category}] "${q.question_text}" — Why: ${q.why_it_matters}`)
    .join('\n');

  return `${propertyDetails}

Pre-filtered Question Library (select 4-5 from these, customize the "why" if needed):
${questionLibrary}

Select 5-6 total questions that are most relevant to THIS specific listing. You may create 1-2 custom questions if the listing data reveals issues not covered by the library.`;
}

function filterQuestionsForListing(questions: QuestionFromDB[], listing: ListingData): QuestionFromDB[] {
  return questions.filter(q => {
    const appliesTo = q.applies_to;
    
    // No filter = universal
    if (!appliesTo) return true;
    
    // Project listings
    if (listing.type === 'project') {
      if (appliesTo.is_resale === true) return false;
      if (appliesTo.is_new_construction === true) return true;
      // Include universal construction/legal/pricing questions
      if (!appliesTo.is_resale && ['construction', 'pricing', 'legal'].includes(q.category)) {
        return true;
      }
      return false;
    }
    
    // Rental listings
    if (listing.type === 'rent') {
      if (appliesTo.is_new_construction === true) return false;
      if (appliesTo.listing_status?.includes('for_rent')) return true;
      // Include universal questions
      if (!appliesTo.listing_status || appliesTo.listing_status.length === 0) return true;
      return false;
    }
    
    // Purchase (resale) listings
    if (listing.type === 'buy') {
      if (appliesTo.is_new_construction === true) return false;
      if (appliesTo.listing_status?.includes('for_sale')) return true;
      if (!appliesTo.listing_status || appliesTo.listing_status.length === 0) return true;
      return false;
    }
    
    return true;
  });
}

async function getFallbackQuestions(listing: ListingData, preFiltered?: QuestionFromDB[]): Promise<Response> {
  let questions: GeneratedQuestion[];
  
  if (preFiltered && preFiltered.length >= 5) {
    // Use top 5 from pre-filtered library
    questions = preFiltered.slice(0, 5).map(q => ({
      question_text: q.question_text,
      why_it_matters: q.why_it_matters,
      category: q.category,
      is_ai_generated: false
    }));
  } else {
    // Fetch from DB if not provided
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from("property_questions")
      .select("question_text, why_it_matters, category")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .limit(5);
    
    if (error || !data) {
      questions = [];
    } else {
      questions = data.map(q => ({
        question_text: q.question_text,
        why_it_matters: q.why_it_matters,
        category: q.category,
        is_ai_generated: false
      }));
    }
  }
  
  return new Response(
    JSON.stringify({ questions, source: "fallback" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
