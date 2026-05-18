// AI Listing Kickstart — extracts wizard-shaped property fields from
// uploaded photos/screenshots + free text. Admin-only. Returns a partial
// PropertyWizardData object plus per-field source notes, plus optional
// detected_agent matched against the agency roster and an AI-picked
// cover photo index when enough photos are provided.
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a bilingual (Hebrew/English) Israeli real estate analyst.
You will be shown screenshots (Yad2, Madlan, agency websites, WhatsApp messages, floor plans, listing flyers) and/or a free-text description of a single Israeli property. Extract every field you can with high precision.

CRITICAL OCR: Read ALL Hebrew and English text visible in every screenshot, including small print, price overlays, badges, sidebar metadata, breadcrumbs, headers, and any prominent numerals (₪, מיליון, חדרים, מ"ר, קומה, שנת בנייה). Do not skip a field if the value is clearly present in the image — extract it.

Hard rules:
- NEVER invent a price. If no price is visible in any image or text, leave it 0. But DO extract prices that ARE visible, including those shown as "₪3,800,000" or "3.8 מיליון ₪".
- NEVER invent an address or city. Use only what you see. Match cities to common English spellings (Tel Aviv, Jerusalem, Herzliya, Ramat Gan, Netanya, Raanana, Modiin, Beit Shemesh, Rehovot, Petah Tikva, etc.). Hebrew neighborhood names like "נחלת בנימין" should be transliterated ("Nahalat Binyamin").
- Israeli ROOM COUNT: Hebrew "X חדרים" is the total room count (Israeli convention). Store it as: bedrooms = floor(X) - 1, additional_rooms = 1 (the living room). For "3 חדרים" → bedrooms: 2, additional_rooms: 1. For "4 חדרים" → bedrooms: 3, additional_rooms: 1. For half-rooms like "3.5 חדרים" → bedrooms: 2, additional_rooms: 1 (the .5 is typically a small office/balcony, ignore). Only deviate if a floor plan clearly shows different counts.
- Listing intent: "להשכרה / לשכירות / ₪/month / per month" => for_rent; "למכירה / for sale / asking price" => for_sale. Set listing_status_confidence to "low" if there is no clear cue in source (price alone is NOT enough).
- Price is in NIS. If you see "$" convert at ~3.7 NIS/USD. If you see "מיליון" multiply by 1,000,000.
- For description, write 2-4 short paragraphs in warm, plain English ("Trusted Friend" voice). Use only facts visible in the source. Never claim things you cannot verify.
- For features[], pick from this controlled vocabulary only: balcony, elevator, storage, parking, mamad, sukkah_balcony, air_conditioning, central_ac, renovated, accessible, pool, garden, furnished, pet_friendly, view, near_park, near_schools, kosher_kitchen, smart_home.
- For each non-trivial field you populate, add a one-sentence note in source_notes explaining where it came from ("price ₪3,800,000 from Yad2 header", "3 חדרים → 2 bedrooms + 1 additional room").
- For anything you had to guess or are <70% sure about, list the field name in low_confidence_fields.
- detected_agent: ONLY populate if a listing agent's name, phone, or license number is visibly stated in the source. Never invent. Leave blank otherwise.`;

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Compelling English title, 30-80 chars, no ALL CAPS" },
    property_type: {
      type: "string",
      enum: ["apartment", "garden_apartment", "penthouse", "mini_penthouse", "duplex", "house", "cottage", "land", "commercial"],
    },
    listing_status: { type: "string", enum: ["for_sale", "for_rent"] },
    listing_status_confidence: { type: "string", enum: ["high", "low"], description: "'low' when sale-vs-rent is a guess" },
    price: { type: "number", description: "Price in NIS. 0 if unknown." },
    city: { type: "string" },
    neighborhood: { type: "string" },
    address: { type: "string" },
    bedrooms: { type: "number" },
    additional_rooms: { type: "number" },
    bathrooms: { type: "number" },
    size_sqm: { type: "number" },
    floor: { type: "number" },
    total_floors: { type: "number" },
    year_built: { type: "number" },
    parking: { type: "number" },
    condition: { type: "string", enum: ["new", "renovated", "good", "needs_renovation"] },
    ac_type: { type: "string", enum: ["none", "split", "central", "mini_central"] },
    vaad_bayit_monthly: { type: "number" },
    has_balcony: { type: "boolean" },
    has_elevator: { type: "boolean" },
    has_storage: { type: "boolean" },
    features: { type: "array", items: { type: "string" } },
    furnished_status: { type: "string", enum: ["fully", "semi", "unfurnished"] },
    pets_policy: { type: "string", enum: ["allowed", "case_by_case", "not_allowed"] },
    lease_term: { type: "string", enum: ["6_months", "12_months", "24_months", "flexible", "other"] },
    agent_fee_required: { type: "boolean" },
    description: { type: "string" },
    highlights: { type: "array", items: { type: "string" } },
    featured_highlight: { type: "string" },
    detected_agent: {
      type: "object",
      description: "Listing agent identifiers visible in the source. Blank fields if not present.",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        license_number: { type: "string" },
      },
    },
    source_notes: { type: "array", items: { type: "string" } },
    low_confidence_fields: { type: "array", items: { type: "string" } },
  },
  required: ["listing_status", "listing_status_confidence", "source_notes"],
};

// ─── Helpers ─────────────────────────────────────────────────────────
function normPhone(p?: string): string {
  if (!p) return "";
  const digits = p.replace(/\D/g, "");
  // 972XXXXXXXXX or 0XXXXXXXXX → last 9 digits
  return digits.slice(-9);
}

function normName(n?: string): string {
  if (!n) return "";
  return n.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, "").trim();
}

function nameTokenJaccard(a: string, b: string): number {
  const ta = new Set(normName(a).split(/\s+/).filter(Boolean));
  const tb = new Set(normName(b).split(/\s+/).filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}

type RosterAgent = { id: string; name: string; phone: string | null; license_number: string | null };

function matchAgent(detected: { name?: string; phone?: string; license_number?: string } | null | undefined, roster: RosterAgent[]) {
  if (!detected) return null;
  const dName = (detected.name || "").trim();
  const dPhone = normPhone(detected.phone);
  const dLicense = (detected.license_number || "").trim().toLowerCase();
  if (!dName && !dPhone && !dLicense) return null;

  // Tier 1: license
  if (dLicense) {
    const hit = roster.find((a) => (a.license_number || "").trim().toLowerCase() === dLicense);
    if (hit) return { agent: hit, basis: "license_number" as const, confidence: "high" as const };
  }
  // Tier 2: phone
  if (dPhone) {
    const hit = roster.find((a) => normPhone(a.phone || "") === dPhone);
    if (hit) return { agent: hit, basis: "phone" as const, confidence: "high" as const };
  }
  // Tier 3: name jaccard
  if (dName) {
    let best: { agent: RosterAgent; score: number } | null = null;
    for (const a of roster) {
      const s = nameTokenJaccard(dName, a.name);
      if (!best || s > best.score) best = { agent: a, score: s };
    }
    if (best && best.score >= 0.7) {
      return { agent: best.agent, basis: "name" as const, confidence: "high" as const };
    }
    if (best && best.score >= 0.4) {
      return { agent: best.agent, basis: "name_weak" as const, confidence: "low" as const };
    }
  }
  return null;
}

async function pickCoverPhotoIndex(imageUrls: string[], apiKey: string): Promise<number | null> {
  if (imageUrls.length < 8) return null;
  try {
    const content: any[] = [
      {
        type: "text",
        text: `You are choosing the single best cover photo for a real-estate listing from ${imageUrls.length} photos (indexed 0..${imageUrls.length - 1} in the order shown).

Ranking priority:
1. Clear exterior / curb appeal (building facade, garden, street view)
2. Bright, wide interior shot (living room, kitchen)
3. Standout amenity (pool, panoramic view, rooftop)

Avoid as cover: floor plans, dark/blurry shots, bathroom-only shots, close-ups, screenshots of listing pages with overlaid text.

Reply with ONLY a single integer: the zero-based index of the chosen cover photo.`,
      },
      ...imageUrls.map((url) => ({ type: "image_url", image_url: { url } })),
    ];
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content }],
        temperature: 0,
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const txt = j?.choices?.[0]?.message?.content?.toString() || "";
    const m = txt.match(/\d+/);
    if (!m) return null;
    const idx = parseInt(m[0], 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= imageUrls.length) return null;
    return idx;
  } catch (e) {
    console.error("cover pick failed", e);
    return null;
  }
}

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

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const imageUrls: string[] = Array.isArray(body.image_urls) ? body.image_urls.slice(0, 20) : [];
    const description: string = (body.description || "").toString().slice(0, 8000);
    const hint: { listing_status?: string; city?: string } = body.hint || {};
    const agencyId: string | null = body.agency_id || null;

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

    // Fetch agency roster in parallel — used post-extraction
    const rosterPromise: Promise<RosterAgent[]> = agencyId
      ? admin
          .from("agents")
          .select("id, name, phone, license_number")
          .eq("agency_id", agencyId)
          .then(({ data }) => (data || []) as RosterAgent[])
      : Promise.resolve([] as RosterAgent[]);

    const userContent: any[] = [];
    if (description.trim()) userContent.push({ type: "text", text: `Description / notes:\n${description}` });
    if (hint.listing_status) userContent.push({ type: "text", text: `Hint — listing intent is ${hint.listing_status}` });
    if (hint.city) userContent.push({ type: "text", text: `Hint — likely city is ${hint.city}` });
    for (const url of imageUrls) userContent.push({ type: "image_url", image_url: { url } });
    if (userContent.length === 0) userContent.push({ type: "text", text: "Extract whatever you can." });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0,
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
    } catch {
      return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Agent fuzzy match + cover pick in parallel ────────────────
    const [roster, coverIdx] = await Promise.all([
      rosterPromise,
      pickCoverPhotoIndex(imageUrls, LOVABLE_API_KEY),
    ]);

    const match = matchAgent(extracted.detected_agent, roster);
    const agentMatch = match
      ? {
          agent_id: match.agent.id,
          agent_name: match.agent.name,
          basis: match.basis,
          confidence: match.confidence,
        }
      : null;

    // If agent wasn't confidently matched but was detected, surface in low_confidence
    if (extracted.detected_agent && (!match || match.confidence === "low")) {
      const lc: string[] = Array.isArray(extracted.low_confidence_fields) ? extracted.low_confidence_fields : [];
      if (!lc.includes("assigned_agent")) lc.push("assigned_agent");
      extracted.low_confidence_fields = lc;
    }

    return new Response(
      JSON.stringify({
        extracted,
        agent_match: agentMatch,
        cover_photo_index: coverIdx,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("ai-extract-listing error", e);
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
