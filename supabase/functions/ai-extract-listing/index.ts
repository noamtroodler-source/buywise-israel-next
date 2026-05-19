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

function jsonResponse(payload: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function safeReadJson(r: { text: () => Promise<string> }): Promise<any | null> {
  const text = await r.text().catch(() => "");
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI gateway JSON", e, text.slice(0, 500));
    return null;
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAiJsonWithRetry(
  url: string,
  init: RequestInit,
  attempts = 4,
): Promise<{ response: Response; json: any | null; text: string }> {
  let lastResponse: Response | null = null;
  let lastText = "";

  for (let attempt = 1; attempt <= attempts; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (e) {
      console.error(`AI gateway fetch threw (attempt ${attempt}/${attempts})`, e);
      if (attempt < attempts) { await wait(800 * attempt); continue; }
      throw e;
    }
    const text = await response.text().catch(() => "");
    lastResponse = response;
    lastText = text;

    // Retry on 429 (rate limit) and 5xx (transient gateway/model errors)
    if (response.status === 429 || response.status >= 500) {
      console.warn(`AI gateway ${response.status} (attempt ${attempt}/${attempts})`, text.slice(0, 300));
      if (attempt < attempts) { await wait(900 * attempt); continue; }
      return { response, json: null, text };
    }

    if (!response.ok) return { response, json: null, text };
    if (text.trim()) {
      try {
        return { response, json: JSON.parse(text), text };
      } catch (e) {
        console.error("Failed to parse AI gateway JSON", e, text.slice(0, 500));
      }
    }

    if (attempt < attempts) await wait(700 * attempt);
  }

  return { response: lastResponse!, json: null, text: lastText };
}

function parseToolArguments(raw: string): any {
  let cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const start = cleaned.search(/[\{\[]/);
  if (start > 0) cleaned = cleaned.slice(start);

  try {
    return JSON.parse(cleaned);
  } catch {
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    return JSON.parse(cleaned);
  }
}

// ─── Stage A: OCR / facts transcript ─────────────────────────────────
const OCR_PROMPT = `You are an OCR + listing-fact transcriber for Israeli real estate screenshots (Yad2, Madlan, agency sites, WhatsApp, flyers, floor plans).

For EACH image, write a short block in this exact form, in order:

IMAGE <n>:
- raw_text: every visible price, number, label, and Hebrew/English word that looks like a listing fact, joined by " | ". Include things like "3,250,000 ₪", "Mr 45" (square meters), "Rooms 1", "floor ground", "5 Floors in the building", "Garden area 40 square meters", "Nahalat Binyamin", "Tel Aviv-Yafo", "Garden apartment for sale", "Mediator", "new", "renovated", "flexible Entry date", "without Furniture", "9 sq m porch", "elevator", "porch", "dimension"/"ממ״ד", "parking ✓/✗", "Air conditioning ✓/✗", "warehouse ✓/✗", "Garden ✓/✗", phone numbers, agent names, agency names.
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
    const j = await safeReadJson(r);
    if (!j) return "";
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
- ADDRESS: Always output in Latin characters (English/transliteration). Transliterate Hebrew street names ("קהילת ברודצקי" → "Kehilat Brodetsky", "אבן גבירול" → "Ibn Gabirol"). Format: "Street Name Number" only — no city, no neighborhood, no Hebrew. If you cannot confidently transliterate, leave address empty rather than emitting Hebrew.
- neighborhood and city: same rule — Latin characters only. If unsure, leave empty.
- Listing intent: "להשכרה / ₪/month" → for_rent; "למכירה / for sale / asking price" → for_sale. Confidence "low" if no clear cue.
- features[] vocabulary only: balcony, elevator, storage, parking, mamad, sukkah_balcony, air_conditioning, central_ac, renovated, accessible, pool, garden, furnished, pet_friendly, view, near_park, near_schools, kosher_kitchen, smart_home.
- A visible "porch" / "מרפסת" / "balcony" tick → has_balcony true + "balcony" in features.
- A visible "elevator" / "מעלית" tick → has_elevator true + "elevator".
- A visible "warehouse" / "storage" / "מחסן" tick → has_storage true + "storage".
- "dimension" in translated Israeli listings usually means ממ״ד / safe room → add "mamad".
- "Garden area 40 square meters" / "גינה 40 מ״ר" → lot_size_sqm: 40 and add "garden".
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
    lot_size_sqm: { type: "number", description: "Garden/yard/lot area in sqm when explicitly shown" },
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

  // Garden area — "Garden area 40 square meters" / "גינה 40 מ״ר"
  if (!e.lot_size_sqm) {
    const m = text.match(/(?:garden\s*area|garden|yard|גינה|חצר)[^\d]{0,18}(\d{1,4})\s*(?:square\s*meters?|sq\.?\s?m|sqm|מ["']?ר)?/i) ||
              text.match(/(\d{1,4})\s*(?:square\s*meters?|sq\.?\s?m|sqm|מ["']?ר)\s*(?:garden|yard|גינה|חצר)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > 0 && n < 2000) { e.lot_size_sqm = n; addFeature("garden"); addNote(`Recovered garden/yard area ${n} sqm from transcript`); }
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
  if (/\bdimension\b|ממ["״']?ד|safe\s*room/i.test(text)) { addFeature("mamad"); addNote("Recovered safe room / mamad from transcript"); }
  if (tick(/garden|yard|גינה|חצר/)) { addFeature("garden"); addNote("Recovered garden feature from transcript"); }
  if (tick(/parking|חניה/)) { addFeature("parking"); addNote("Recovered parking feature from transcript"); }
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

  // Hebrew guard — strip any address/neighborhood/city that still contains Hebrew.
  // Better to leave blank than display Hebrew text in an English-language product.
  const HEBREW_RE = /[\u0590-\u05FF]/;
  for (const field of ["address", "neighborhood", "city"] as const) {
    const v = e[field];
    if (typeof v === "string" && HEBREW_RE.test(v)) {
      addNote(`Dropped ${field} "${v}" — contained Hebrew characters (not transliterated)`);
      e[field] = "";
      if (Array.isArray(e.low_confidence_fields) && !e.low_confidence_fields.includes(field)) {
        e.low_confidence_fields.push(field);
      }
    }
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

type ImageKind = "property_photo" | "floor_plan" | "spec_sheet" | "screenshot_other";
type IncomingImage = { url: string; bucket: "info" | "photo"; originalIndex: number };

function normalizeBucket(value: unknown): "info" | "photo" {
  return value === "info" ? "info" : "photo";
}

async function classifyImages(imageUrls: string[], apiKey: string): Promise<ImageKind[]> {
  if (imageUrls.length === 0) return [];
  try {
    const content: any[] = [
      { type: "text", text:
`Classify each image (in order) into ONE bucket:
- property_photo: a real photo of the home — exterior, interior room, kitchen, bathroom, balcony view, building facade
- floor_plan: a line-drawing or schematic plan of the apartment layout
- spec_sheet: a screenshot of a listing site, table of specs, price card, Yad2/Madlan UI, WhatsApp message, PDF page, or anything dominated by text/labels
- screenshot_other: anything else that is NOT a usable property photo (maps, blank pages, logos, ID cards)

Reply with ONLY a JSON array of strings in order, e.g.:
["property_photo","spec_sheet","property_photo","floor_plan"]
No prose, no markdown.` },
      ...imageUrls.map((url, i) => ([
        { type: "text", text: `Image ${i}:` },
        { type: "image_url", image_url: { url } },
      ])).flat(),
    ];
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", temperature: 0, messages: [{ role: "user", content }] }),
    });
    if (!r.ok) { console.error("classify failed", r.status); return imageUrls.map(() => "property_photo"); }
    const j = await safeReadJson(r);
    if (!j) return imageUrls.map(() => "property_photo");
    const raw = (j?.choices?.[0]?.message?.content || "").toString();
    const m = raw.match(/\[[\s\S]*\]/);
    if (!m) return imageUrls.map(() => "property_photo");
    const arr = parseToolArguments(m[0]);
    if (!Array.isArray(arr)) return imageUrls.map(() => "property_photo");
    const valid: ImageKind[] = ["property_photo","floor_plan","spec_sheet","screenshot_other"];
    return imageUrls.map((_, i) => {
      const v = (arr[i] || "").toString();
      return (valid as string[]).includes(v) ? v as ImageKind : "property_photo";
    });
  } catch (e) {
    console.error("classify error", e);
    return imageUrls.map(() => "property_photo");
  }
}

async function pickCoverPhotoIndex(imageUrls: string[], apiKey: string, kinds: ImageKind[]): Promise<number | null> {
  // Only consider real property photos as cover candidates.
  const eligibleIdx = imageUrls.map((_, i) => i).filter((i) => kinds[i] === "property_photo");
  if (eligibleIdx.length === 0) return null;
  if (eligibleIdx.length === 1) return eligibleIdx[0];
  try {
    const content: any[] = [
      { type: "text", text: `Pick the best cover photo. Eligible image indices: ${eligibleIdx.join(",")}. Prefer exterior / wide bright interior / standout view. Avoid bathrooms and dark/blurry shots. Reply with ONLY one of those integers.` },
      ...eligibleIdx.map((i) => ([
        { type: "text", text: `Image ${i}:` },
        { type: "image_url", image_url: { url: imageUrls[i] } },
      ])).flat(),
    ];
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content }], temperature: 0 }),
    });
    if (!r.ok) return eligibleIdx[0];
    const j = await safeReadJson(r);
    if (!j) return eligibleIdx[0];
    const m = (j?.choices?.[0]?.message?.content?.toString() || "").match(/\d+/);
    if (!m) return eligibleIdx[0];
    const idx = parseInt(m[0], 10);
    return eligibleIdx.includes(idx) ? idx : eligibleIdx[0];
  } catch (e) { console.error("cover pick failed", e); return eligibleIdx[0]; }
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return jsonResponse({ error: "Admin only" }, 403);

    const body = await safeReadJson(req);
    if (!body) return jsonResponse({ error: "Invalid request body" }, 400);
    const rawImageUrls: string[] = Array.isArray(body.image_urls) ? body.image_urls.slice(0, 20) : [];
    const rawImageItems: IncomingImage[] = Array.isArray(body.image_items)
      ? body.image_items.slice(0, 20).map((item: any, index: number) => ({
          url: String(item?.url || ""),
          bucket: normalizeBucket(item?.bucket),
          originalIndex: index,
        })).filter((item: IncomingImage) => /^https?:\/\//i.test(item.url))
      : rawImageUrls.map((url, index) => ({ url, bucket: "photo" as const, originalIndex: index }));

    // The actual listing photos can be numerous/large. The detail screenshots are
    // the critical extraction source, so always spend the image budget on them first.
    const prioritizedImages = [...rawImageItems].sort((a, b) => {
      if (a.bucket !== b.bucket) return a.bucket === "info" ? -1 : 1;
      return a.originalIndex - b.originalIndex;
    });
    // Filter images to stay under AI gateway 30MB per-request limit.
    // Per-image cap 15MB; assume 1.5MB when content-length is unknown (Supabase Storage
    // often omits it). Total budget 28MB.
    const MAX_BYTES = 15 * 1024 * 1024;
    const TOTAL_BUDGET = 28 * 1024 * 1024;
    const ASSUMED_UNKNOWN = 1.5 * 1024 * 1024;
    const sized = await Promise.all(prioritizedImages.map(async (item) => {
      try {
        const h = await fetch(item.url, { method: "HEAD" });
        const len = parseInt(h.headers.get("content-length") || "0", 10);
        return { ...item, len: Number.isFinite(len) ? len : 0 };
      } catch { return { ...item, len: 0 }; }
    }));
    let runningTotal = 0;
    const keptImages: IncomingImage[] = [];
    const skipped: string[] = [];
    for (const item of sized) {
      const { url, len } = item;
      if (len > MAX_BYTES) { skipped.push(`${item.bucket}:oversized:${len}`); console.warn(`Skipping oversized image (${len} bytes):`, url); continue; }
      const assumed = len || ASSUMED_UNKNOWN;
      if (runningTotal + assumed > TOTAL_BUDGET) { skipped.push(`${item.bucket}:budget`); console.warn("Image budget reached, skipping rest"); continue; }
      runningTotal += assumed;
      keptImages.push(item);
    }
    const imageUrls = keptImages.map((item) => item.url);
    console.log(`Images: ${rawImageItems.length} provided (${rawImageItems.filter((i) => i.bucket === "info").length} info, ${rawImageItems.filter((i) => i.bucket === "photo").length} photos), ${imageUrls.length} kept, ${skipped.length} skipped (${skipped.join(",")})`);
    if (rawImageItems.length > 0 && imageUrls.length === 0) {
      console.warn("All images were filtered as oversized");
    }
    const description: string = (body.description || "").toString().slice(0, 8000);
    const hint: { listing_status?: string; city?: string } = body.hint || {};
    const agencyId: string | null = body.agency_id || null;

    if (imageUrls.length === 0 && description.trim().length < 10) {
      return jsonResponse({ error: "Provide at least one image or a description (10+ chars)" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonResponse({ error: "AI service not configured" }, 500);

    const rosterPromise: Promise<RosterAgent[]> = agencyId
      ? Promise.resolve(admin.from("agents").select("id, name, phone, license_number").eq("agency_id", agencyId).then(({ data }) => (data || []) as RosterAgent[]))
      : Promise.resolve([] as RosterAgent[]);

    // ── Stage A: OCR transcript + image classification (parallel) ──
    const [transcript, imageKinds] = await Promise.all([
      ocrTranscript(imageUrls, LOVABLE_API_KEY),
      classifyImages(imageUrls, LOVABLE_API_KEY),
    ]);
    const coverKinds = imageKinds.map((kind, i) => keptImages[i]?.bucket === "photo" ? kind : "spec_sheet");
    const coverIdxInKept = await pickCoverPhotoIndex(imageUrls, LOVABLE_API_KEY, coverKinds);
    const coverIdx = coverIdxInKept == null ? null : keptImages[coverIdxInKept]?.originalIndex ?? null;
    const imageKindsByOriginal = rawImageItems.map(() => "screenshot_other" as ImageKind);
    imageKinds.forEach((kind, i) => {
      const kept = keptImages[i];
      if (kept) imageKindsByOriginal[kept.originalIndex] = kind;
    });
    console.log("OCR transcript length:", transcript.length, "kinds:", imageKinds);

    // ── Stage B: structured extraction ──
    const userContent: any[] = [];
    if (transcript) userContent.push({ type: "text", text: `OCR / facts transcript from the screenshots:\n${transcript}` });
    if (description.trim()) userContent.push({ type: "text", text: `Additional notes from user:\n${description}` });
    if (hint.listing_status) userContent.push({ type: "text", text: `Hint — listing intent is ${hint.listing_status}` });
    if (hint.city) userContent.push({ type: "text", text: `Hint — likely city is ${hint.city}` });
    for (const url of imageUrls) userContent.push({ type: "image_url", image_url: { url } });
    if (userContent.length === 0) userContent.push({ type: "text", text: "Extract whatever you can." });

    const { response: aiResp, json: aiJson, text: aiText } = await fetchAiJsonWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      console.error("AI gateway error", aiResp.status, aiText);
      if (aiResp.status === 429) return jsonResponse({ error: "Rate limited, try again in a moment" }, 429);
      if (aiResp.status === 402) return jsonResponse({ error: "AI credits exhausted — add credits in Workspace settings" }, 402);
      return jsonResponse({ error: "AI extraction failed", detail: aiText }, 502);
    }

    if (!aiJson) return jsonResponse({ error: "AI extraction returned an empty or invalid response. Please try again." }, 502);
    const message = aiJson?.choices?.[0]?.message;
    const toolCall = message?.tool_calls?.[0];
    let extracted: any = {};
    let extractionSource = "tool_call";
    if (toolCall?.function?.arguments) {
      try { extracted = parseToolArguments(toolCall.function.arguments); } catch (e) {
        console.error("AI returned invalid tool JSON", e, String(toolCall.function.arguments).slice(0, 500));
      }
    }
    // Fallback: model returned JSON in message.content instead of calling the tool
    if (!extracted || Object.keys(extracted).length === 0) {
      const raw = (message?.content || "").toString();
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try { extracted = parseToolArguments(m[0]); extractionSource = "content_json"; }
        catch (e) { console.error("Fallback content JSON parse failed", e, raw.slice(0, 500)); }
      }
    }
    if (!extracted || Object.keys(extracted).length === 0) {
      console.error("No structured output from AI", JSON.stringify(message || {}).slice(0, 800));
      return jsonResponse({ error: "AI did not return structured listing data. Please try again or add a couple more screenshots." }, 502);
    }
    console.log(`Extraction source: ${extractionSource}, fields: ${Object.keys(extracted).length}`);

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

    return jsonResponse({ extracted, agent_match: agentMatch, cover_photo_index: coverIdx, ocr_transcript: transcript, image_kinds: imageKindsByOriginal });
  } catch (e: any) {
    console.error("ai-extract-listing error", e);
    return jsonResponse({ error: e?.message || "Unexpected error" }, 500);
  }
});
