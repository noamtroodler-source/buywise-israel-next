// AI Listing Kickstart — two-stage extraction.
// Stage A: OCR/facts transcript from every screenshot.
// Stage B: structured wizard fields from transcript + notes + images.
// Plus deterministic post-processing to rescue facts the model dropped.
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Stage A: OCR / facts transcript ─────────────────────────────────
const OCR_PROMPT = `You are an OCR + listing-fact transcriber for Israeli real estate screenshots (Yad2, Madlan, agency sites, WhatsApp, flyers, floor plans).

For EACH image, write a short block in this exact form, in order:

IMAGE <n>:
- raw_text: every visible price, number, label, and Hebrew/English word that looks like a listing fact, joined by " | ". Include things like "3,250,000 ₪", "Mr 45" (square meters), "Rooms 1", "floor ground", "5 Floors in the building", "Nahalat Binyamin", "Tel Aviv-Yafo", "Apartment for sale", "Mediator", "new", "renovated", "flexible Entry date", "without Furniture", "9 sq m porch", "elevator", "porch", "dimension", "parking ✗", "Air conditioning ✗", "warehouse ✗", "Pool ✗", "Garden ✗", phone numbers, agent names, agency names.
- listing_text: any free-form property description / blurb visible (Hebrew or English), verbatim.
- agent_block: any visible agent name, phone, license number, or agency.

Hard rules:
- Transcribe ONLY what is actually visible. Never invent.
- Keep Hebrew in Hebrew; do not translate in this pass.
- It's fine if a section is empty — write "(none)".
- No commentary, no JSON, just the blocks above.`;

async function ocrTranscript(imageUrls: string[], apiKey: string): Promise<string> {
  if (imageUrls.length === 0) return "";
  try {
    const content: any[] = [{ type: "text", text: OCR_PROMPT }];
    imageUrls.forEach((url, i) => {
      content.push({ type: "text", text: `IMAGE ${i + 1}:` });
      content.push({ type: "image_url", image_url: { url } });
    });
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        temperature: 0,
        messages: [{ role: "user", content }],
      }),
    });
    if (!r.ok) {
      console.error("OCR pass failed", r.status, await r.text().catch(() => ""));
      return "";
    }
    const j = await r.json();
    return (j?.choices?.[0]?.message?.content || "").toString();
  } catch (e) {
    console.error("OCR pass error", e);
    return "";
  }
}

// ─── Stage B: structured extraction ──────────────────────────────────
const SYSTEM_PROMPT = `You are a bilingual (Hebrew/English) Israeli real estate analyst.
You receive: (1) an OCR/facts transcript already extracted from listing screenshots, (2) optional pasted notes, (3) the original images. Produce a single structured property record.

Hard rules:
- The OCR transcript is your PRIMARY source. If a fact appears there (price, sqm, rooms, floor, neighborhood, condition, balcony size, furnished status, etc.), it MUST be in your output. Do not drop it.
- NEVER invent a price, address, or agent. If absent everywhere, leave it empty / 0.
- Israeli ROOM COUNT: Hebrew "X חדרים" or "Rooms X" is the total room count. bedrooms = floor(X) - 1, additional_rooms = 1. "Rooms 1" → bedrooms: 0, additional_rooms: 1 (studio). "3 חדרים" → bedrooms: 2, additional_rooms: 1.
- Price in NIS. "מיליון" × 1,000,000. "$" × 3.7.
- Floor: "ground" / "ground floor" / "קרקע" / "קומת קרקע" → 0 (NEVER -1). Only use negative numbers if the source literally says "מינוס", "minus", "basement", or "מרתף".
- "Mr 45" / "מ״ר 45" / "45 sqm" / "45 sq m" all mean size_sqm = 45 (or porch size if it says "porch 9 sq m").
- Cities: use English ("Tel Aviv", "Jerusalem", "Herzliya"…). Hebrew neighborhoods → transliteration ("Nahalat Binyamin").
- Listing intent: "להשכרה / ₪/month" → for_rent; "למכירה / for sale / asking price" → for_sale. Confidence "low" if no clear cue.
- features[] vocabulary only: balcony, elevator, storage, parking, mamad, sukkah_balcony, air_conditioning, central_ac, renovated, accessible, pool, garden, furnished, pet_friendly, view, near_park, near_schools, kosher_kitchen, smart_home.
- A visible "porch" / "מרפסת" / "balcony" tick → has_balcony true + "balcony" in features.
- A visible "elevator" / "מעלית" tick → has_elevator true + "elevator".
- A visible "warehouse" / "storage" / "מחסן" tick → has_storage true + "storage".
- "without Furniture" / "ללא ריהוט" → furnished_status: "unfurnished".
- "new" → condition: "new"; "renovated" / "משופץ" → "renovated".
- description: 2-4 short warm "Trusted Friend" English paragraphs, facts only, no hype.
- For every non-trivial field you populate, add a one-line source_notes entry ("price 3,250,000 ₪ from IMAGE 2 header").
- low_confidence_fields: anything you guessed or are <70% sure about.
- detected_agent: only if a person's name/phone/license is visibly stated.`;

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Compelling English title, 30-80 chars, no ALL CAPS" },
    property_type: {
      type: "string",
      enum: ["apartment", "garden_apartment", "penthouse", "mini_penthouse", "duplex", "house", "cottage", "land", "commercial"],
    },
    listing_status: { type: "string", enum: ["for_sale", "for_rent"] },
    listing_status_confidence: { type: "string", enum: ["high", "low"] },
    price: { type: "number" },
    city: { type: "string" },
    neighborhood: { type: "string" },
    address: { type: "string" },
    bedrooms: { type: "number" },
    additional_rooms: { type: "number" },
    source_rooms: { type: "number", description: "Original Israeli room count shown on the source" },
    bathrooms: { type: "number" },
    size_sqm: { type: "number" },
    balcony_sqm: { type: "number" },
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
    is_accessible: { type: "boolean" },
    features: { type: "array", items: { type: "string" } },
    furnished_status: { type: "string", enum: ["fully", "semi", "unfurnished"] },
    entry_date: { type: "string", description: "ISO date or 'flexible' / 'immediate'" },
    pets_policy: { type: "string", enum: ["allowed", "case_by_case", "not_allowed"] },
    lease_term: { type: "string", enum: ["6_months", "12_months", "24_months", "flexible", "other"] },
    agent_fee_required: { type: "boolean" },
    description: { type: "string" },
    highlights: { type: "array", items: { type: "string" } },
    featured_highlight: { type: "string" },
    detected_agent: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        license_number: { type: "string" },
        agency: { type: "string" },
      },
    },
    source_notes: { type: "array", items: { type: "string" } },
    low_confidence_fields: { type: "array", items: { type: "string" } },
  },
  required: ["listing_status", "listing_status_confidence", "source_notes"],
};

// ─── Deterministic post-processing ───────────────────────────────────
function recoverFromTranscript(extracted: any, transcript: string, notes: string): any {
  const text = `${transcript}\n${notes}`;
  const e = { ...extracted };
  e.source_notes = Array.isArray(e.source_notes) ? [...e.source_notes] : [];
  e.features = Array.isArray(e.features) ? [...e.features] : [];

  const addNote = (s: string) => { if (!e.source_notes.includes(s)) e.source_notes.push(s); };
  const addFeature = (f: string) => { if (!e.features.includes(f)) e.features.push(f); };

  // Price — "3,250,000 ₪" / "₪ 3,250,000" / "3.8 מיליון"
  if (!e.price || e.price === 0) {
    const m = text.match(/([\d,]{5,})\s*(?:₪|NIS|ש"?ח|שקל)/i) || text.match(/(?:₪|NIS)\s*([\d,]{5,})/i);
    if (m) {
      const n = parseInt(m[1].replace(/,/g, ""), 10);
      if (n >= 100_000) { e.price = n; addNote(`Recovered price ${n.toLocaleString()} ₪ from transcript`); }
    }
    if ((!e.price || e.price === 0)) {
      const mm = text.match(/(\d+(?:\.\d+)?)\s*מיליון/);
      if (mm) {
        const n = Math.round(parseFloat(mm[1]) * 1_000_000);
        e.price = n; addNote(`Recovered price ${n.toLocaleString()} ₪ ("מיליון") from transcript`);
      }
    }
  }

  // Size — "Mr 45" / "45 מ"ר" / "45 sqm" / "45 sq m" (but not the porch line)
  if (!e.size_sqm) {
    const lines = text.split(/\n/);
    for (const line of lines) {
      if (/porch|מרפסת|balcony/i.test(line)) continue;
      const m = line.match(/(?:Mr|מ["']?ר|sq\.?\s?m|sqm)\s*(\d{2,4})/i) ||
                line.match(/(\d{2,4})\s*(?:sq\.?\s?m|sqm|מ["']?ר)/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n >= 15 && n <= 2000) { e.size_sqm = n; addNote(`Recovered size ${n} sqm from transcript`); break; }
      }
    }
  }

  // Balcony / porch sqm — "porch 9 sq m" / "9 sq m porch" / "מרפסת 9"
  if (!e.balcony_sqm) {
    const m = text.match(/(?:porch|balcony|מרפסת)[^\d]{0,12}(\d{1,3})\s*(?:sq\.?\s?m|sqm|מ["']?ר)?/i) ||
              text.match(/(\d{1,3})\s*(?:sq\.?\s?m|sqm|מ["']?ר)\s*(?:porch|balcony|מרפסת)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > 0 && n < 200) { e.balcony_sqm = n; addNote(`Recovered balcony ${n} sqm from transcript`); }
    }
  }

  // Rooms — "Rooms 1" / "X חדרים"
  if (e.bedrooms == null && e.additional_rooms == null) {
    const m = text.match(/Rooms?\s*(\d+(?:\.\d)?)/i) || text.match(/(\d+(?:\.\d)?)\s*חדרים/);
    if (m) {
      const r = parseFloat(m[1]);
      const sleeping = Math.max(0, Math.floor(r) - 1);
      e.bedrooms = sleeping;
      e.additional_rooms = 1;
      e.source_rooms = r;
      addNote(`Recovered rooms = ${r} → ${sleeping} bedrooms + 1 living from transcript`);
    }
  }

  // Floor — "floor ground" / "קומת קרקע" / "קרקע" / "ground floor" → 0
  //         "floor 3" / "Floor minus 1" → number
  // Also OVERRIDE a model-returned -1 if the transcript clearly says ground.
  const groundFloor = /(?:floor\s*ground|ground\s*floor|קומת\s*קרקע|קומה\s*קרקע|\bקרקע\b)/i.test(text);
  if (e.floor == null) {
    if (groundFloor) {
      e.floor = 0; addNote("Recovered floor = ground from transcript");
    } else {
      const m = text.match(/floor\s*(?:minus\s*)?(-?\d+)/i) || text.match(/קומה\s*(-?\d+)/);
      if (m) { e.floor = parseInt(m[1], 10); addNote(`Recovered floor = ${e.floor} from transcript`); }
    }
  } else if (e.floor < 0 && groundFloor) {
    addNote(`Corrected floor from ${e.floor} to 0 (transcript says ground/קרקע, not basement)`);
    e.floor = 0;
  }


  // Total floors — "5 Floors in the building"
  if (!e.total_floors) {
    const m = text.match(/(\d{1,2})\s*Floors?\s*in\s*the\s*building/i) || text.match(/בניין\s*בן\s*(\d{1,2})\s*קומות/);
    if (m) { e.total_floors = parseInt(m[1], 10); addNote(`Recovered total floors = ${e.total_floors} from transcript`); }
  }

  // City / neighborhood — "In the Nahalat Binyamin neighborhood, Tel Aviv-Yafo"
  if (!e.city) {
    if (/Tel\s*Aviv/i.test(text)) { e.city = "Tel Aviv"; addNote("Recovered city = Tel Aviv from transcript"); }
    else if (/Jerusalem|ירושלים/i.test(text)) { e.city = "Jerusalem"; addNote("Recovered city = Jerusalem from transcript"); }
    else if (/Herzliya|הרצליה/i.test(text)) { e.city = "Herzliya"; addNote("Recovered city = Herzliya from transcript"); }
    else if (/Netanya|נתניה/i.test(text)) { e.city = "Netanya"; addNote("Recovered city = Netanya from transcript"); }
    else if (/Raanana|רעננה/i.test(text)) { e.city = "Raanana"; addNote("Recovered city = Raanana from transcript"); }
  }
  if (!e.neighborhood) {
    const m = text.match(/(?:In the|in the|בשכונת|שכונת)\s+([A-Z][A-Za-z' \-]{2,40}?)\s+neighborhood/);
    if (m) { e.neighborhood = m[1].trim(); addNote(`Recovered neighborhood = ${e.neighborhood} from transcript`); }
  }

  // Listing status / type
  if (!e.listing_status || e.listing_status_confidence === "low") {
    if (/for\s*sale|למכירה|asking\s*price/i.test(text)) { e.listing_status = "for_sale"; e.listing_status_confidence = "high"; addNote("Listing intent = sale from transcript"); }
    else if (/for\s*rent|להשכרה|לשכירות|per\s*month|\/month/i.test(text)) { e.listing_status = "for_rent"; e.listing_status_confidence = "high"; addNote("Listing intent = rent from transcript"); }
  }
  if (!e.property_type) {
    if (/penthouse|פנטהאוז/i.test(text)) e.property_type = "penthouse";
    else if (/apartment|דירה/i.test(text)) e.property_type = "apartment";
    else if (/house|cottage|בית פרטי|קוטג'/i.test(text)) e.property_type = "house";
  }

  // Condition
  if (!e.condition) {
    if (/\bnew\b|חדש/i.test(text)) e.condition = "new";
    else if (/renovated|משופץ/i.test(text)) e.condition = "renovated";
  }

  // Furnished
  if (!e.furnished_status) {
    if (/without\s*Furniture|ללא\s*ריהוט|unfurnished/i.test(text)) e.furnished_status = "unfurnished";
    else if (/fully\s*furnished|מרוהט\s*במלואו/i.test(text)) e.furnished_status = "fully";
    else if (/furnished|מרוהט/i.test(text)) e.furnished_status = "semi";
  }

  // Entry date
  if (!e.entry_date && /flexible\s*Entry\s*date|כניסה\s*גמישה/i.test(text)) {
    e.entry_date = "flexible"; addNote("Entry date = flexible from transcript");
  }

  // Booleans / features from ticked rows
  const tick = (label: RegExp) => {
    // matches "<label> ✓" / "<label> v" / "<label>: yes" / "<label>" present without explicit ✗
    const re = new RegExp(`${label.source}[^\\n]{0,30}(?:✓|✔|yes|כן|true|present)`, "i");
    if (re.test(text)) return true;
    // Also accept bare presence on its own line ("porch" alone in advantages list)
    const present = new RegExp(`(^|[|\\n\\s])${label.source}([|\\n\\s]|$)`, "i");
    const negated = new RegExp(`${label.source}[^\\n]{0,15}(?:✗|✘|no|לא|false)`, "i");
    return present.test(text) && !negated.test(text);
  };
  if (e.has_balcony !== true && tick(/porch|balcony|מרפסת/)) { e.has_balcony = true; addFeature("balcony"); addNote("Recovered has_balcony from transcript"); }
  if (e.has_elevator !== true && tick(/elevator|מעלית/)) { e.has_elevator = true; addFeature("elevator"); addNote("Recovered has_elevator from transcript"); }
  if (e.has_storage !== true && tick(/warehouse|storage|מחסן/)) { e.has_storage = true; addFeature("storage"); addNote("Recovered has_storage from transcript"); }
  if (!e.ac_type && /(central\s*ac|מיזוג\s*מרכזי)/i.test(text)) { e.ac_type = "central"; addFeature("central_ac"); }
  else if (!e.ac_type && /(air\s*conditioning|מיזוג\s*אוויר|מזגן)/i.test(text) && !/Air\s*conditioning[^\n]{0,15}(?:✗|✘|no)/i.test(text)) { e.ac_type = "split"; addFeature("air_conditioning"); }
  if (e.is_accessible !== true && /Accessible[^\n]{0,20}(?:✓|yes)/i.test(text)) { e.is_accessible = true; addFeature("accessible"); }

  // Parking
  if (e.parking == null) {
    const m = text.match(/(\d)\s*parking/i) || text.match(/parking[^\d✗]{0,10}(\d)/i);
    if (m) { e.parking = parseInt(m[1], 10); addNote(`Recovered parking = ${e.parking} from transcript`); }
  }

  // Agent
  if (!e.detected_agent) e.detected_agent = {};
  if (!e.detected_agent.phone) {
    const m = text.match(/(\+?972[-\s]?\d[\d\-\s]{7,12}|0\d[-\s]?\d{3}[-\s]?\d{4})/);
    if (m) e.detected_agent.phone = m[1];
  }

  return e;
}

// ─── Agent matching helpers ──────────────────────────────────────────
function normPhone(p?: string): string { if (!p) return ""; return p.replace(/\D/g, "").slice(-9); }
function normName(n?: string): string { if (!n) return ""; return n.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, "").trim(); }
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
  if (dLicense) { const hit = roster.find((a) => (a.license_number || "").trim().toLowerCase() === dLicense); if (hit) return { agent: hit, basis: "license_number" as const, confidence: "high" as const }; }
  if (dPhone) { const hit = roster.find((a) => normPhone(a.phone || "") === dPhone); if (hit) return { agent: hit, basis: "phone" as const, confidence: "high" as const }; }
  if (dName) {
    let best: { agent: RosterAgent; score: number } | null = null;
    for (const a of roster) { const s = nameTokenJaccard(dName, a.name); if (!best || s > best.score) best = { agent: a, score: s }; }
    if (best && best.score >= 0.7) return { agent: best.agent, basis: "name" as const, confidence: "high" as const };
    if (best && best.score >= 0.4) return { agent: best.agent, basis: "name_weak" as const, confidence: "low" as const };
  }
  return null;
}

async function pickCoverPhotoIndex(imageUrls: string[], apiKey: string): Promise<number | null> {
  if (imageUrls.length < 4) return null;
  try {
    const content: any[] = [
      { type: "text", text: `Pick the best cover photo from ${imageUrls.length} images (indexed 0..${imageUrls.length - 1}). Prefer exterior / wide bright interior / standout view. Avoid floor plans, dark/blurry, bathrooms, screenshots with overlaid text. Reply with ONLY a single integer.` },
      ...imageUrls.map((url) => ({ type: "image_url", image_url: { url } })),
    ];
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content }], temperature: 0 }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const m = (j?.choices?.[0]?.message?.content?.toString() || "").match(/\d+/);
    if (!m) return null;
    const idx = parseInt(m[0], 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= imageUrls.length) return null;
    return idx;
  } catch (e) { console.error("cover pick failed", e); return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const imageUrls: string[] = Array.isArray(body.image_urls) ? body.image_urls.slice(0, 20) : [];
    const description: string = (body.description || "").toString().slice(0, 8000);
    const hint: { listing_status?: string; city?: string } = body.hint || {};
    const agencyId: string | null = body.agency_id || null;

    if (imageUrls.length === 0 && description.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Provide at least one image or a description (10+ chars)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "AI service not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const rosterPromise: Promise<RosterAgent[]> = agencyId
      ? admin.from("agents").select("id, name, phone, license_number").eq("agency_id", agencyId).then(({ data }) => (data || []) as RosterAgent[])
      : Promise.resolve([] as RosterAgent[]);

    // ── Stage A: OCR transcript (parallel with cover pick) ──
    const [transcript, coverIdx] = await Promise.all([
      ocrTranscript(imageUrls, LOVABLE_API_KEY),
      pickCoverPhotoIndex(imageUrls, LOVABLE_API_KEY),
    ]);
    console.log("OCR transcript length:", transcript.length);

    // ── Stage B: structured extraction ──
    const userContent: any[] = [];
    if (transcript) userContent.push({ type: "text", text: `OCR / facts transcript from the screenshots:\n${transcript}` });
    if (description.trim()) userContent.push({ type: "text", text: `Additional notes from user:\n${description}` });
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
        tools: [{ type: "function", function: { name: "extract_listing", description: "Structured wizard-ready property data.", parameters: SCHEMA } }],
        tool_choice: { type: "function", function: { name: "extract_listing" } },
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI gateway error", aiResp.status, text);
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again in a moment" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted — add credits in Workspace settings" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI extraction failed", detail: text }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI returned no structured output" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    let extracted: any = {};
    try { extracted = JSON.parse(toolCall.function.arguments); } catch {
      return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Deterministic rescue pass ──
    extracted = recoverFromTranscript(extracted, transcript, description);

    // ── Agent match ──
    const roster = await rosterPromise;
    const match = matchAgent(extracted.detected_agent, roster);
    const agentMatch = match ? { agent_id: match.agent.id, agent_name: match.agent.name, basis: match.basis, confidence: match.confidence } : null;
    if (extracted.detected_agent && (!match || match.confidence === "low")) {
      const lc: string[] = Array.isArray(extracted.low_confidence_fields) ? extracted.low_confidence_fields : [];
      if (!lc.includes("assigned_agent")) lc.push("assigned_agent");
      extracted.low_confidence_fields = lc;
    }

    return new Response(
      JSON.stringify({ extracted, agent_match: agentMatch, cover_photo_index: coverIdx, ocr_transcript: transcript }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("ai-extract-listing error", e);
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
