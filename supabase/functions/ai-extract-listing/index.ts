// AI Listing Kickstart — extracts wizard-shaped property fields from
// uploaded photos/screenshots + free text. Admin-only. Returns a partial
// PropertyWizardData object plus per-field source notes.
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a bilingual (Hebrew/English) Israeli real estate analyst.
You will be shown screenshots (Yad2, Madlan, agency websites, WhatsApp messages, floor plans, listing flyers) and/or a free-text description of a single Israeli property. Extract every field you can with high precision.

Hard rules:
- NEVER invent a price. If no price is visible in any image or text, leave it 0.
- NEVER invent an address or city. Use only what you see. Match cities to common English spellings (Tel Aviv, Jerusalem, Herzliya, Ramat Gan, Netanya, Raanana, Modiin, Beit Shemesh, Rehovot, Petah Tikva, etc.).
- "Rooms" in Hebrew listings (חדרים) follows the Israeli room count = bedrooms + living + mamad + office. Convert to bedrooms by subtracting the obvious living room (usually rooms - 1 = bedrooms when no other info is given). If you can see a floor plan, count actual bedrooms.
- Listing intent: "להשכרה / לשכירות / ₪/month / per month" => for_rent; "למכירה / for sale / asking price" => for_sale.
- Price is in NIS. If you see "$" convert at ~3.7 NIS/USD. If you see "מיליון" multiply by 1,000,000.
- For description, write 2-4 short paragraphs in warm, plain English ("Trusted Friend" voice). Use only facts visible in the source. Never claim things you cannot verify.
- For features[], pick from this controlled vocabulary only: balcony, elevator, storage, parking, mamad, sukkah_balcony, air_conditioning, central_ac, renovated, accessible, pool, garden, furnished, pet_friendly, view, near_park, near_schools, kosher_kitchen, smart_home.
- For each non-trivial field you populate, add a one-sentence note in source_notes explaining where it came from ("price from Yad2 header screenshot", "5 rooms from listing text → 4 bedrooms").
- For anything you had to guess or are <70% sure about, list the field name in low_confidence_fields.`;

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Compelling English title, 30-80 chars, no ALL CAPS" },
    property_type: {
      type: "string",
      enum: ["apartment", "garden_apartment", "penthouse", "mini_penthouse", "duplex", "house", "cottage", "land", "commercial"],
    },
    listing_status: { type: "string", enum: ["for_sale", "for_rent"] },
    price: { type: "number", description: "Price in NIS. 0 if unknown." },
    city: { type: "string", description: "City in English, blank if unknown" },
    neighborhood: { type: "string", description: "Neighborhood in English, blank if unknown" },
    address: { type: "string", description: "Street + number if visible, else blank" },
    bedrooms: { type: "number" },
    additional_rooms: { type: "number", description: "Non-bedroom rooms (living, mamad, office)" },
    bathrooms: { type: "number" },
    size_sqm: { type: "number" },
    floor: { type: "number" },
    total_floors: { type: "number" },
    year_built: { type: "number" },
    parking: { type: "number", description: "Number of parking spots" },
    condition: { type: "string", enum: ["new", "renovated", "good", "needs_renovation"] },
    ac_type: { type: "string", enum: ["none", "split", "central", "mini_central"] },
    vaad_bayit_monthly: { type: "number", description: "Monthly building maintenance in NIS" },
    has_balcony: { type: "boolean" },
    has_elevator: { type: "boolean" },
    has_storage: { type: "boolean" },
    features: { type: "array", items: { type: "string" } },
    // Rental-only
    furnished_status: { type: "string", enum: ["fully", "semi", "unfurnished"] },
    pets_policy: { type: "string", enum: ["allowed", "case_by_case", "not_allowed"] },
    lease_term: { type: "string", enum: ["6_months", "12_months", "24_months", "flexible", "other"] },
    agent_fee_required: { type: "boolean" },
    // Narrative
    description: { type: "string", description: "2-4 paragraphs, English, Trusted Friend tone" },
    highlights: { type: "array", items: { type: "string" }, description: "3-6 short buyer-facing bullets" },
    featured_highlight: { type: "string", description: "One standout sentence" },
    // Meta
    source_notes: { type: "array", items: { type: "string" } },
    low_confidence_fields: { type: "array", items: { type: "string" } },
  },
  required: ["listing_status", "source_notes"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin gate
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const imageUrls: string[] = Array.isArray(body.image_urls) ? body.image_urls.slice(0, 12) : [];
    const description: string = (body.description || "").toString().slice(0, 8000);
    const hint: { listing_status?: string; city?: string } = body.hint || {};

    if (imageUrls.length === 0 && description.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Provide at least one image or a description (10+ chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userContent: any[] = [];
    if (description.trim()) {
      userContent.push({ type: "text", text: `Description / notes:\n${description}` });
    }
    if (hint.listing_status) {
      userContent.push({ type: "text", text: `Hint — listing intent is ${hint.listing_status}` });
    }
    if (hint.city) {
      userContent.push({ type: "text", text: `Hint — likely city is ${hint.city}` });
    }
    for (const url of imageUrls) {
      userContent.push({ type: "image_url", image_url: { url } });
    }
    if (userContent.length === 0) {
      userContent.push({ type: "text", text: "Extract whatever you can." });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_listing",
            description: "Return structured wizard-ready property data extracted from the inputs.",
            parameters: SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_listing" } },
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI gateway error", aiResp.status, text);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again in a moment" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted — add credits in Workspace settings" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI extraction failed", detail: text }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI returned no structured output", raw: aiJson }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let extracted: any = {};
    try {
      extracted = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ extracted }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("ai-extract-listing error", e);
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
