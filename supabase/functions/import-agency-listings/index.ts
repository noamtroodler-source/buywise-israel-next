// deno-lint-ignore-file no-explicit-any
declare const EdgeRuntime: { waitUntil(promise: Promise<any>): void };
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// Verbose logging gate. Set DEBUG_IMPORT=1 in env to enable.
const DEBUG = Deno.env.get("DEBUG_IMPORT") === "1";
const dlog = (...args: unknown[]) => { if (DEBUG) console.log(...args); };

// ─── AUTH ────────────────────────────────────────────────────────────────────
//
// Calls come from two trust boundaries:
//   1. Browser via supabase.functions.invoke — carries the user's JWT.
//   2. Other edge functions (sync-agency-listings, yad2-retry-runner,
//      nightly-scrape-scheduler, self-chained batches) — carry the service-role key.
//
// Service-role calls bypass per-agency checks. User calls must own the agency
// (admin_user_id === user.id) or have the global "admin" role.

function getBearerToken(req: Request): string | null {
  const h = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice("Bearer ".length).trim();
}

function isServiceRoleToken(token: string): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return !!serviceKey && token === serviceKey;
}

async function getUserIdFromToken(token: string, authHeader: string): Promise<string> {
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) throw new Error("Unauthorized: invalid token");
  // Reject service_role JWTs sneaking in via this path — they should match the env key
  if ((data.claims as any).role === "service_role") throw new Error("Unauthorized");
  return data.claims.sub as string;
}

async function userCanManageAgency(
  sb: ReturnType<typeof supabaseAdmin>,
  userId: string,
  agencyId: string
): Promise<boolean> {
  const { data: agency } = await sb
    .from("agencies")
    .select("admin_user_id")
    .eq("id", agencyId)
    .maybeSingle();
  if (agency?.admin_user_id === userId) return true;
  const { data: hasAdmin } = await sb.rpc("has_role", { _user_id: userId, _role: "admin" });
  return !!hasAdmin;
}

// Resolve which agency a request acts on. Returns null for actions that don't
// scope to a single agency (callers should require admin role in that case).
async function resolveAgencyId(
  sb: ReturnType<typeof supabaseAdmin>,
  body: any
): Promise<string | null> {
  if (body.agency_id) return body.agency_id as string;
  if (body.job_id) {
    const { data } = await sb.from("import_jobs").select("agency_id").eq("id", body.job_id).maybeSingle();
    return (data?.agency_id as string | undefined) ?? null;
  }
  if (body.item_id) {
    const { data } = await sb
      .from("import_job_items")
      .select("import_jobs!inner(agency_id)")
      .eq("id", body.item_id)
      .maybeSingle();
    return ((data as any)?.import_jobs?.agency_id as string | undefined) ?? null;
  }
  return null;
}

// Throws on failure. Returns when the caller is authorized.
async function authorize(req: Request, sb: ReturnType<typeof supabaseAdmin>, body: any, action: string): Promise<void> {
  const token = getBearerToken(req);
  if (!token) throw new Error("Unauthorized: missing token");
  if (isServiceRoleToken(token)) return;

  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization")!;
  const userId = await getUserIdFromToken(token, authHeader);

  // Maintenance/global actions: require global admin role
  if (action === "backfill_street_view") {
    const { data: hasAdmin } = await sb.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!hasAdmin) throw new Error("Forbidden: admin role required");
    return;
  }

  const agencyId = await resolveAgencyId(sb, body);
  if (!agencyId) throw new Error("Forbidden: no agency context");
  if (!(await userCanManageAgency(sb, userId, agencyId))) {
    throw new Error("Forbidden: not authorized for this agency");
  }
}

// ─── TITLE GENERATION HELPERS ───────────────────────────────────────────────

function toTitleCase(str: string): string {
  const minor = new Set(["in", "at", "on", "the", "a", "an", "and", "or", "of", "for", "with"]);
  return str.split(" ").filter(Boolean).map((w, i) =>
    i === 0 || !minor.has(w.toLowerCase())
      ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      : w.toLowerCase()
  ).join(" ");
}

function formatPropertyType(type: string | undefined): string {
  const map: Record<string, string> = {
    apartment: "Apartment", garden_apartment: "Garden Apartment",
    penthouse: "Penthouse", mini_penthouse: "Mini Penthouse",
    duplex: "Duplex", house: "House", cottage: "Cottage",
    land: "Land", commercial: "Commercial",
  };
  return map[type || "apartment"] || "Apartment";
}

function isGoodEnglishTitle(title: string | undefined): boolean {
  if (!title) return false;
  // Must have Latin chars, be 20-60 chars, and not be just an address/number pattern
  if (!/[a-zA-Z]{3,}/.test(title)) return false;
  if (title.length < 20 || title.length > 60) return false;
  // Reject if mostly Hebrew
  const hebrewChars = (title.match(/[\u0590-\u05FF]/g) || []).length;
  if (hebrewChars > title.length * 0.3) return false;
  // Reject if it's just a street address pattern like "123 Some Street"
  if (/^\d+\s+\w+\s+(street|st|road|rd|ave|blvd)/i.test(title)) return false;
  return true;
}

function generateListingTitle(listing: any, fallbackDomain?: string): string {
  // If existing title is already good English, just title-case it
  if (isGoodEnglishTitle(listing.title)) {
    return toTitleCase(listing.title);
  }

  const type = formatPropertyType(listing.property_type);
  const location = listing.neighborhood && listing.city
    ? `${listing.neighborhood}, ${listing.city}`
    : listing.city || listing.neighborhood || fallbackDomain || "Israel";

  if (listing.bedrooms && listing.bedrooms > 0) {
    // Show both bedroom count AND original Israeli room count for international buyers
    const roomSuffix = listing.source_rooms ? ` (${listing.source_rooms}-Room)` : "";
    return toTitleCase(`${listing.bedrooms}-Bedroom${roomSuffix} ${type} in ${location}`);
  }
  // Fall back to source_rooms if bedrooms not available
  if (listing.source_rooms && listing.source_rooms > 0) {
    const beds = Math.max(0, Math.floor(listing.source_rooms) - 1);
    return toTitleCase(`${beds > 0 ? `${beds}-Bedroom ` : ""}${listing.source_rooms}-Room ${type} in ${location}`);
  }
  if (listing.size_sqm && listing.size_sqm > 0) {
    return toTitleCase(`${listing.size_sqm}sqm ${type} in ${location}`);
  }
  return toTitleCase(`${type} for ${listing.listing_status === "for_rent" ? "Rent" : "Sale"} in ${location}`);
}

// ─── DESCRIPTION GENERATION HELPERS ─────────────────────────────────────────

function isGoodEnglishDescription(desc: string | undefined): boolean {
  if (!desc || desc.length < 50) return false;
  // Check first 100 chars are mostly Latin (not Hebrew)
  const sample = desc.substring(0, 100);
  const hebrewChars = (sample.match(/[\u0590-\u05FF]/g) || []).length;
  return hebrewChars < sample.length * 0.2;
}

function generateListingDescription(listing: any): string | null {
  // Build a basic English description from extracted fields
  const type = formatPropertyType(listing.property_type).toLowerCase();
  const parts: string[] = [];

  if (listing.bedrooms && listing.bedrooms > 0) {
    parts.push(`${listing.bedrooms}-bedroom ${type}`);
  } else {
    parts.push(type.charAt(0).toUpperCase() + type.slice(1));
  }

  if (listing.size_sqm && listing.size_sqm > 0) {
    parts.push(`${listing.size_sqm} sqm`);
  }

  const location = listing.neighborhood && listing.city
    ? `in ${listing.neighborhood}, ${listing.city}`
    : listing.city ? `in ${listing.city}` : "";
  if (location) parts.push(location);

  if (listing.floor != null && listing.floor >= 0) {
    parts.push(`on floor ${listing.floor}`);
  }

  if (listing.condition) {
    const condMap: Record<string, string> = {
      new: "new condition", renovated: "recently renovated",
      good: "good condition", needs_renovation: "needs renovation",
    };
    if (condMap[listing.condition]) parts.push(condMap[listing.condition]);
  }

  const featureNames: string[] = [];
  if (listing.features && Array.isArray(listing.features)) {
    const featureMap: Record<string, string> = {
      elevator: "elevator", balcony: "balcony", parking: "parking",
      storage: "storage room", mamad: "safe room (mamad)",
      air_conditioning: "air conditioning", garden: "private garden",
      sun_balcony: "sun balcony", sukkah_balcony: "sukkah balcony",
      accessible: "wheelchair accessible",
    };
    for (const f of listing.features) {
      if (featureMap[f]) featureNames.push(featureMap[f]);
    }
  }
  if (featureNames.length > 0) {
    parts.push(`featuring ${featureNames.slice(0, 4).join(", ")}`);
  }

  if (listing.listing_status === "for_rent" && listing.price) {
    parts.push(`available for ₪${listing.price.toLocaleString("en-US")}/month`);
  } else if (listing.price) {
    parts.push(`listed at ₪${listing.price.toLocaleString("en-US")}`);
  }

  return parts.length > 1 ? (parts.join(", ") + ".").replace(/^./, c => c.toUpperCase()) : null;
}

async function generateBuyWiseTitleAndDescription(listing: any, sourceText: string, lovableKey: string, jobId?: string, sb?: any): Promise<{ title: string; description: string; aiGenerated: boolean }> {
  const fallbackTitle = generateListingTitle(listing);
  const fallbackDescription = generateListingDescription(listing) || `${formatPropertyType(listing.property_type)} in ${listing.neighborhood || listing.city || "Israel"}.`;
  if (!lovableKey) return { title: fallbackTitle, description: fallbackDescription, aiGenerated: false };

  const facts = {
    property_type: listing.property_type,
    listing_status: listing.listing_status,
    city: listing.city,
    neighborhood: listing.neighborhood,
    address: listing.address,
    price: listing.price,
    currency: listing.currency || "ILS",
    bedrooms: listing.bedrooms,
    source_rooms: listing.source_rooms,
    bathrooms: listing.bathrooms,
    size_sqm: listing.size_sqm,
    floor: listing.floor,
    total_floors: listing.total_floors,
    condition: listing.condition,
    features: Array.isArray(listing.features) ? listing.features.slice(0, 12) : [],
    parking: listing.parking,
    lease_term: listing.lease_term,
    furnished_status: listing.furnished_status,
    pets_policy: listing.pets_policy,
    entry_date: listing.entry_date,
  };

  try {
    const res = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You write BuyWise-quality English listing titles and descriptions for international buyers in Israel. Use only supplied facts/source text. Do not invent amenities, views, renovations, exact locations, agent names, phone numbers, or urgency. No Hebrew. Description should be concise, factual, polished, 45-110 words.",
          },
          {
            role: "user",
            content: JSON.stringify({ facts, source_text: (sourceText || "").slice(0, 4000), fallback_title: fallbackTitle, fallback_description: fallbackDescription }),
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "write_listing_copy",
            description: "Return a fresh English title and BuyWise-quality description grounded only in the provided listing facts.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Clear English title, 35-80 characters." },
                description: { type: "string", description: "Polished English listing description, 45-110 words, no unsupported claims." },
              },
              required: ["title", "description"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "write_listing_copy" } },
      }),
    }, 20_000);

    if (!res.ok) {
      console.warn(`BuyWise copy generation failed (${res.status})`);
      return { title: fallbackTitle, description: fallbackDescription, aiGenerated: false };
    }

    const data = await res.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return { title: fallbackTitle, description: fallbackDescription, aiGenerated: false };
    if (sb && jobId) await trackCost(sb, jobId, "ai_tokens", Math.ceil((JSON.stringify(facts).length + sourceText.length + args.length) / 4), "tokens");
    const parsed = JSON.parse(args);
    const title = isGoodEnglishTitle(parsed.title) ? toTitleCase(parsed.title) : fallbackTitle;
    const description = isGoodEnglishDescription(parsed.description) ? parsed.description.trim() : fallbackDescription;
    return { title, description, aiGenerated: true };
  } catch (err) {
    console.warn("BuyWise copy generation error:", err);
    return { title: fallbackTitle, description: fallbackDescription, aiGenerated: false };
  }
}


// ─── COST TRACKING ──────────────────────────────────────────────────────────
async function trackCost(sb: any, jobId: string, resourceType: string, quantity: number, unit: string) {
  try {
    await sb.from("import_job_costs").insert({ job_id: jobId, resource_type: resourceType, quantity, unit });
  } catch (e) {
    console.error(`[trackCost] Failed to track ${resourceType}:`, e);
  }
}

// ─── SUPPORTED CITIES WHITELIST ─────────────────────────────────────────────

const SUPPORTED_CITIES = [
  "Ashdod", "Ashkelon", "Beer Sheva", "Beit Shemesh", "Caesarea",
  "Efrat", "Eilat", "Givat Shmuel", "Gush Etzion", "Hadera",
  "Haifa", "Herzliya", "Hod HaSharon", "Jerusalem", "Kfar Saba",
  "Ma'ale Adumim", "Mevaseret Zion", "Modi'in", "Netanya",
  "Pardes Hanna", "Petah Tikva", "Ra'anana", "Ramat Gan",
  "Rehovot", "Rishon LeZion", "Tel Aviv", "Zichron Yaakov",
];

// Common aliases/transliterations for supported cities
const CITY_ALIASES: Record<string, string[]> = {
  "Ashdod": ["asdod", "ashod", "אשדוד"],
  "Ashkelon": ["ashqelon", "ashkalon", "askelon", "אשקלון"],
  "Beer Sheva": ["beersheva", "beersheba", "beer sheba", "bersheva", "bersheba", "be'er sheva", "באר שבע", "באר-שבע"],
  "Beit Shemesh": ["beit shemesh", "bet shemesh", "beth shemesh", "beitschemesh", "בית שמש"],
  "Caesarea": ["kesaria", "cesaria", "qesaria", "kaisaria", "cesarea", "kesarya", "qesarya", "קיסריה"],
  "Efrat": ["ephrat", "efrata", "אפרת"],
  "Eilat": ["elat", "eliat", "אילת"],
  "Givat Shmuel": ["givat shmuel", "givat shemuel", "givat shmu'el", "גבעת שמואל"],
  "Gush Etzion": ["gush etzion", "gush ezion", "גוש עציון"],
  "Hadera": ["hadeira", "hedera", "חדרה"],
  "Haifa": ["haipha", "hafia", "hefa", "heifa", "חיפה"],
  "Herzliya": ["herzeliya", "herzelia", "herzlia", "hertzeliya", "hertzlia", "hertzliya", "הרצליה"],
  "Hod HaSharon": ["hod hasharon", "hod sharon", "הוד השרון"],
  "Jerusalem": ["yerushalayim", "jeruslaem", "jerusalm", "yerushalaim", "ירושלים"],
  "Kfar Saba": ["kfar saba", "kfar sabba", "kfar sava", "כפר סבא"],
  "Ma'ale Adumim": ["maale adumim", "maaleh adumim", "male adumim", "ma'aleh adummim", "מעלה אדומים"],
  "Mevaseret Zion": ["mevaseret zion", "mevasseret zion", "mevasseret", "mevaseret tzion", "מבשרת ציון"],
  "Modi'in": ["modiin", "modin", "modein", "modiin maccabim reut", "מודיעין", "מודיעין מכבים רעות"],
  "Netanya": ["natanya", "netaniya", "netanyah", "netania", "nathanya", "נתניה"],
  "Pardes Hanna": ["pardes hanna", "pardes hana", "pardes hanna karkur", "pardes hanna-karkur", "pardes chana", "פרדס חנה", "פרדס חנה כרכור"],
  "Petah Tikva": ["petach tikva", "petah tikwa", "petachtikva", "petach tikvah", "פתח תקווה", "פתח תקוה"],
  "Ra'anana": ["raanana", "ranana", "rannana", "raananah", "רעננה"],
  "Ramat Gan": ["ramat gan", "ramatgan", "ramat-gan", "רמת גן", "רמת-גן"],
  "Rehovot": ["rechovot", "rehovoth", "רחובות"],
  "Rishon LeZion": ["rishon lezion", "rishon le zion", "rishon le-zion", "rishon", "ראשון לציון"],
  "Tel Aviv": ["telaviv", "tel aviv", "tlv", "tel avive", "tel-aviv", "tel aviv-yafo", "tel aviv yafo", "תל אביב", "תל אביב יפו", "תל-אביב"],
  "Zichron Yaakov": ["zichron yaakov", "zichron yakov", "zichron jacob", "zichron ya'akov", "zikhron", "זכרון יעקב"],
};

// Domain keywords → city mapping for inferring city from URL
const DOMAIN_CITY_HINTS: Record<string, string> = {
  "jerusalem": "Jerusalem",
  "telaviv": "Tel Aviv",
  "tlv": "Tel Aviv",
  "haifa": "Haifa",
  "herzliya": "Herzliya",
  "netanya": "Netanya",
  "raanana": "Ra'anana",
  "modiin": "Modi'in",
  "beersheva": "Beer Sheva",
  "ashdod": "Ashdod",
  "ashkelon": "Ashkelon",
  "eilat": "Eilat",
  "kfarsaba": "Kfar Saba",
  "hadera": "Hadera",
  "caesarea": "Caesarea",
  "efrat": "Efrat",
  "beitshemesh": "Beit Shemesh",
  "mevaseret": "Mevaseret Zion",
  "petachtikva": "Petah Tikva",
  "ramatgan": "Ramat Gan",
  "hodsharon": "Hod HaSharon",
  "hodhasharon": "Hod HaSharon",
  "zichron": "Zichron Yaakov",
  "pardeshanna": "Pardes Hanna",
  "givatshmuel": "Givat Shmuel",
  "maaleadumim": "Ma'ale Adumim",
  "gushetzion": "Gush Etzion",
  "rehovot": "Rehovot",
  "rechovot": "Rehovot",
  "rishon": "Rishon LeZion",
  "rishonlezion": "Rishon LeZion",
};

function normalizeCityStr(str: string): string {
  return str.toLowerCase().replace(/['-]/g, "").replace(/\s+/g, "").trim();
}

function matchSupportedCity(city: string | undefined | null): string | null {
  if (!city || typeof city !== "string" || city.trim() === "") return null;
  const normalized = normalizeCityStr(city);
  for (const supported of SUPPORTED_CITIES) {
    if (normalizeCityStr(supported) === normalized) return supported;
  }
  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    for (const alias of aliases) {
      if (normalizeCityStr(alias) === normalized) return canonical;
    }
  }
  for (const supported of SUPPORTED_CITIES) {
    const normSupported = normalizeCityStr(supported);
    if (normalized.includes(normSupported) || normSupported.includes(normalized)) {
      return supported;
    }
  }
  return null;
}

function inferCityFromDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/\./g, "");
    for (const [keyword, city] of Object.entries(DOMAIN_CITY_HINTS)) {
      if (hostname.includes(keyword)) return city;
    }
  } catch { /* ignore */ }
  return null;
}

function getDomainFromUrl(url: string): string {
  try { return new URL(url).hostname; } catch { return ""; }
}

// ─── CITY PRICE RANGES (NIS, Resale Apartments) ────────────────────────────

const CITY_PRICE_RANGES: Record<string, { min: number; max: number; sqm_min: number; sqm_max: number }> = {
  "Tel Aviv":       { min: 2_000_000, max: 15_000_000, sqm_min: 52_000, sqm_max: 95_000 },
  "Jerusalem":      { min: 1_200_000, max: 10_000_000, sqm_min: 35_000, sqm_max: 80_000 },
  "Haifa":          { min: 600_000,   max: 3_500_000,  sqm_min: 18_000, sqm_max: 35_000 },
  "Ra'anana":       { min: 1_800_000, max: 7_000_000,  sqm_min: 30_000, sqm_max: 45_000 },
  "Herzliya":       { min: 2_000_000, max: 12_000_000, sqm_min: 35_000, sqm_max: 60_000 },
  "Netanya":        { min: 1_000_000, max: 5_000_000,  sqm_min: 20_000, sqm_max: 35_000 },
  "Beer Sheva":     { min: 500_000,   max: 2_200_000,  sqm_min: 10_000, sqm_max: 18_000 },
  "Ashkelon":       { min: 500_000,   max: 2_500_000,  sqm_min: 12_000, sqm_max: 20_000 },
  "Ashdod":         { min: 800_000,   max: 3_500_000,  sqm_min: 15_000, sqm_max: 25_000 },
  "Ramat Gan":      { min: 1_500_000, max: 7_000_000,  sqm_min: 30_000, sqm_max: 45_000 },
  "Petah Tikva":    { min: 1_200_000, max: 5_000_000,  sqm_min: 20_000, sqm_max: 35_000 },
  "Kfar Saba":      { min: 1_500_000, max: 6_000_000,  sqm_min: 25_000, sqm_max: 40_000 },
  "Modi'in":        { min: 1_200_000, max: 5_000_000,  sqm_min: 22_000, sqm_max: 35_000 },
  "Beit Shemesh":   { min: 1_000_000, max: 4_000_000,  sqm_min: 18_000, sqm_max: 30_000 },
  "Eilat":          { min: 600_000,   max: 2_800_000,  sqm_min: 12_000, sqm_max: 22_000 },
  "Hod HaSharon":   { min: 1_500_000, max: 6_000_000,  sqm_min: 25_000, sqm_max: 40_000 },
  "Givat Shmuel":   { min: 1_800_000, max: 6_500_000,  sqm_min: 30_000, sqm_max: 45_000 },
  "Hadera":         { min: 800_000,   max: 3_000_000,  sqm_min: 15_000, sqm_max: 28_000 },
  "Caesarea":       { min: 2_000_000, max: 15_000_000, sqm_min: 25_000, sqm_max: 50_000 },
  "Efrat":          { min: 1_500_000, max: 5_000_000,  sqm_min: 20_000, sqm_max: 35_000 },
  "Gush Etzion":    { min: 1_000_000, max: 4_000_000,  sqm_min: 15_000, sqm_max: 30_000 },
  "Ma'ale Adumim":  { min: 1_000_000, max: 3_500_000,  sqm_min: 15_000, sqm_max: 28_000 },
  "Mevaseret Zion": { min: 1_500_000, max: 5_000_000,  sqm_min: 25_000, sqm_max: 40_000 },
  "Pardes Hanna":   { min: 800_000,   max: 3_500_000,  sqm_min: 15_000, sqm_max: 28_000 },
  "Rehovot":        { min: 1_000_000, max: 4_000_000,  sqm_min: 18_000, sqm_max: 30_000 },
  "Rishon LeZion":  { min: 1_200_000, max: 5_000_000,  sqm_min: 20_000, sqm_max: 35_000 },
  "Zichron Yaakov": { min: 1_200_000, max: 5_000_000,  sqm_min: 20_000, sqm_max: 35_000 },
};

// ─── CITY RENTAL PRICE RANGES (NIS per month) ──────────────────────────────

const CITY_RENTAL_RANGES: Record<string, { min: number; max: number }> = {
  "Tel Aviv":       { min: 4_000, max: 25_000 },
  "Jerusalem":      { min: 3_000, max: 18_000 },
  "Haifa":          { min: 2_500, max: 10_000 },
  "Ra'anana":       { min: 4_000, max: 15_000 },
  "Herzliya":       { min: 4_500, max: 20_000 },
  "Netanya":        { min: 3_000, max: 12_000 },
  "Beer Sheva":     { min: 2_000, max: 7_000 },
  "Ashkelon":       { min: 2_000, max: 8_000 },
  "Ashdod":         { min: 2_500, max: 9_000 },
  "Ramat Gan":      { min: 3_500, max: 14_000 },
  "Petah Tikva":    { min: 3_000, max: 11_000 },
  "Kfar Saba":      { min: 3_500, max: 13_000 },
  "Modi'in":        { min: 3_500, max: 12_000 },
  "Beit Shemesh":   { min: 3_000, max: 10_000 },
  "Eilat":          { min: 2_500, max: 8_000 },
  "Hod HaSharon":   { min: 3_500, max: 13_000 },
  "Givat Shmuel":   { min: 4_000, max: 14_000 },
  "Hadera":         { min: 2_500, max: 8_000 },
  "Caesarea":       { min: 5_000, max: 25_000 },
  "Efrat":          { min: 3_500, max: 12_000 },
  "Gush Etzion":    { min: 3_000, max: 10_000 },
  "Ma'ale Adumim":  { min: 3_000, max: 9_000 },
  "Mevaseret Zion": { min: 4_000, max: 14_000 },
  "Pardes Hanna":   { min: 2_500, max: 8_000 },
  "Rehovot":        { min: 2_500, max: 9_000 },
  "Rishon LeZion":  { min: 3_000, max: 11_000 },
  "Zichron Yaakov": { min: 3_000, max: 10_000 },
};

// Room-to-size ratio validation (Israeli apartments)
const ROOM_SIZE_RANGES: Record<number, { flag_min: number; flag_max: number }> = {
  1: { flag_min: 15, flag_max: 50 },    // Studio
  2: { flag_min: 25, flag_max: 70 },    // 2 rooms = 1 bed
  3: { flag_min: 45, flag_max: 110 },   // 3 rooms = 2 bed
  4: { flag_min: 65, flag_max: 150 },   // 4 rooms = 3 bed
  5: { flag_min: 85, flag_max: 200 },   // 5 rooms = 4 bed
  6: { flag_min: 100, flag_max: 350 },  // 6+ rooms
};

// ─── INDEX PAGE SOLD-URL PRE-FILTER ─────────────────────────────────────────

const INDEX_PAGE_PATTERNS = [
  /\/(properties|listings|for-sale|for-rent|our-listings|all-listings|catalog|portfolio|real-estate|homes)/i,
  /\/(נכסים|דירות|למכירה|להשכרה|נדלן|דירות-למכירה|דירות-להשכרה)/,
  /\/(page|p)\/\d+/i,
];

const SOLD_BADGE_PATTERNS = [
  /\bsold\b/i, /\brented\b/i, /\bleased\b/i, /\bunder\s+contract\b/i,
  /\boff[\s-]?market\b/i, /\bno\s+longer\s+available\b/i,
  /\bsale\s+agreed\b/i, /\blet\s+agreed\b/i, /\bunavailable\b/i,
  /נמכר[הו]?/, /הושכר[הו]?/, /בהסכם/, /לא\s*זמינ[הו]?/, /לא\s*פנוי[הו]?/,
];

const SOLD_CSS_CLASS_PATTERN = /class\s*=\s*"[^"]*\b(sold|rented|unavailable|off-market|leased|inactive|expired)\b[^"]*"/gi;

function identifyIndexPages(allUrls: string[], websiteUrl: string): string[] {
  const candidates = new Set<string>();
  try {
    const homeUrl = new URL(websiteUrl);
    homeUrl.pathname = "/";
    homeUrl.search = "";
    candidates.add(homeUrl.toString().replace(/\/$/, ""));
  } catch { /* ignore */ }

  for (const url of allUrls) {
    try {
      const parsed = new URL(url);
      const path = decodeURIComponent(parsed.pathname);
      for (const pattern of INDEX_PAGE_PATTERNS) {
        if (pattern.test(path)) { candidates.add(url); break; }
      }
    } catch { /* ignore */ }
  }
  return Array.from(candidates).slice(0, 8);
}

function extractSoldUrlsFromHtml(html: string, pageUrl: string, knownUrls: Set<string>): Set<string> {
  const soldUrls = new Set<string>();
  let baseUrl: URL;
  try { baseUrl = new URL(pageUrl); } catch { return soldUrls; }

  const linkRegex = /<a\s[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const linkOuterStart = Math.max(0, match.index - 300);
    const linkOuterEnd = Math.min(html.length, match.index + match[0].length + 300);
    const surroundingContext = html.substring(linkOuterStart, linkOuterEnd);

    let hasSoldSignal = false;
    for (const pattern of SOLD_BADGE_PATTERNS) {
      if (pattern.test(surroundingContext)) { hasSoldSignal = true; break; }
    }
    if (!hasSoldSignal && SOLD_CSS_CLASS_PATTERN.test(surroundingContext)) {
      hasSoldSignal = true;
    }
    SOLD_CSS_CLASS_PATTERN.lastIndex = 0;

    if (hasSoldSignal) {
      let absoluteUrl: string;
      try { absoluteUrl = new URL(href, baseUrl).toString(); } catch { continue; }
      const normalized = normalizeUrl(absoluteUrl);
      if (knownUrls.has(normalized)) soldUrls.add(normalized);
    }
  }

  const soldContainerRegex = /<(?:div|article|li|section)\s[^>]*class\s*=\s*"[^"]*\b(sold|rented|unavailable|off-market|leased)\b[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article|li|section)>/gi;
  while ((match = soldContainerRegex.exec(html)) !== null) {
    const containerHtml = match[2];
    const innerLinkRegex = /href\s*=\s*["']([^"'#]+)["']/gi;
    let innerMatch: RegExpExecArray | null;
    while ((innerMatch = innerLinkRegex.exec(containerHtml)) !== null) {
      try {
        const absoluteUrl = new URL(innerMatch[1], baseUrl).toString();
        const normalized = normalizeUrl(absoluteUrl);
        if (knownUrls.has(normalized)) soldUrls.add(normalized);
      } catch { /* ignore */ }
    }
  }

  return soldUrls;
}

async function findSoldUrlsFromIndexPages(
  allUrls: string[], websiteUrl: string, firecrawlKey: string
): Promise<Set<string>> {
  const soldUrls = new Set<string>();
  const indexPages = identifyIndexPages(allUrls, websiteUrl);
  if (indexPages.length === 0) return soldUrls;

  dlog(`Index page pre-filter: scraping ${indexPages.length} pages`);
  const knownUrlSet = new Set(allUrls.map(u => normalizeUrl(u)));
  const batchSize = 4;

  for (let i = 0; i < indexPages.length; i += batchSize) {
    const batch = indexPages.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (pageUrl) => {
        try {
          const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ url: pageUrl, formats: ["html"], onlyMainContent: false, waitFor: 2000 }),
          });
          if (!res.ok) { console.warn(`Index scrape failed for ${pageUrl}: ${res.status}`); return null; }
          const data = await res.json();
          const html = data.data?.html || data.html || "";
          if (!html || html.length < 100) return null;
          return extractSoldUrlsFromHtml(html, pageUrl, knownUrlSet);
        } catch (err) { console.warn(`Index scrape error: ${err}`); return null; }
      })
    );
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        for (const url of result.value) soldUrls.add(url);
      }
    }
  }
  return soldUrls;
}

// ─── PRE-LLM SOLD/RENTED/RENTAL/NEW-DEV DETECTION ──────────────────────────

function isNonResalePage(markdown: string, importType: string = "resale"): { skip: boolean; reason: string } {
  const snippet = markdown.substring(0, 3000);

  // Sold/rented patterns — always skip
  const soldPatterns = [
    /נמכר[הו]?/, /הושכר[הו]?/, /בהסכם/, /לא\s*זמינ[הו]?/, /לא\s*פנוי[הו]?/, /אין\s*בנמצא/,
    /\bsold\b/i, /\brented\b/i, /\bleased\b/i, /\bunder\s+contract\b/i, /\bunder\s+offer\b/i,
    /\bsale\s+agreed\b/i, /\blet\s+agreed\b/i, /\boff\s*market\b/i,
    /\bno\s+longer\s+available\b/i, /\bunavailable\b/i,
  ];
  for (const p of soldPatterns) {
    if (p.test(snippet)) return { skip: true, reason: "Pre-filter: listing appears sold/rented" };
  }

  const shortTerm = detectShortTermRental(snippet);
  if (shortTerm.isShortTerm) {
    return { skip: true, reason: `Pre-filter: short-term rental not supported (${shortTerm.reason})` };
  }

  // Rental indicators — only skip in resale-only mode
  if (importType === "resale") {
    const rentalPatterns = [
      /להשכרה/, /שכירות\s+חודשית/, /דמי\s*שכירות/, /שכ[\"״]ח/,
      /\bfor\s+rent\b/i, /\bmonthly\s+rent\b/i, /\brental\b/i,
    ];
    for (const p of rentalPatterns) {
      if (p.test(snippet)) return { skip: true, reason: "Pre-filter: rental listing (resale only)" };
    }
  }

  // Sale indicators — skip in rental-only mode
  if (importType === "rental") {
    const salePatterns = [
      /למכירה/, /מכירה/, /\bfor\s+sale\b/i, /\bbuy\b/i, /\bpurchase\b/i,
    ];
    let hasSaleSignal = false;
    for (const p of salePatterns) {
      if (p.test(snippet)) { hasSaleSignal = true; break; }
    }
    // Only skip if sale signals are present AND no rental signals
    const rentalSignals = [/להשכרה/, /שכירות/, /\bfor\s+rent\b/i, /\brental\b/i, /\brent\b/i];
    const hasRentalSignal = rentalSignals.some(p => p.test(snippet));
    if (hasSaleSignal && !hasRentalSignal) {
      return { skip: true, reason: "Pre-filter: sale listing (rental import only)" };
    }
  }

  // New construction / developer indicators
  const newDevPatterns = [
    /מקבלן/, /על\s+הנייר/, /חדש\s+מקבלן/, /פרויקט\s+חדש/,
    /דירות\s+חדשות\s+מקבלן/, /בנייה\s+חדשה/,
    /\bnew\s+construction\b/i, /\boff[\s-]?plan\b/i,
    /\bfrom\s+developer\b/i, /\bpre[\s-]?sale\b/i,
  ];
  for (const p of newDevPatterns) {
    if (p.test(snippet)) return { skip: true, reason: "Pre-filter: new construction/developer listing" };
  }

  return { skip: false, reason: "" };
}

// ─── DATA VALIDATION (Enhanced with outlier detection) ──────────────────────

const VALID_PROPERTY_TYPES = [
  "apartment", "garden_apartment", "penthouse", "mini_penthouse",
  "duplex", "house", "cottage", "land", "commercial",
  "parking", "storage", "building", "agricultural_estate", "assisted_living",
];
const VALID_LISTING_STATUSES = ["for_sale", "for_rent"];

// Property types to always skip during import (non-residential)
const SKIP_PROPERTY_TYPES = new Set([
  "land", "commercial", "parking", "storage",
  "building", "agricultural_estate", "assisted_living",
]);

function detectShortTermRental(text: string): { isShortTerm: boolean; reason: string } {
  const snippet = text.slice(0, 80_000);
  const shortTermPatterns: Array<[RegExp, string]> = [
    [/\bshort[\s-]?term\b/i, "short-term wording"],
    [/\bvacation\s+rental\b|\bholiday\s+rental\b|\bairbnb\b/i, "vacation/Airbnb wording"],
    [/\bper\s+night\b|\bnightly\b|\bby\s+the\s+night\b/i, "nightly pricing"],
    [/\bper\s+week\b|\bweekly\b|\bby\s+the\s+week\b/i, "weekly pricing"],
    [/\bminimum\s+(?:stay|rental)\b|\bmin(?:imum)?\s+\d+\s+nights?\b/i, "minimum-stay wording"],
    [/השכרה\s+לטווח\s+קצר|לטווח\s+קצר|קצר\s+טווח/, "Hebrew short-term wording"],
    [/לילה|לילות|יומי|יומית|ליום|לשבוע|שבועי|שבועית|נופש|חופשה|איירבנב|אירוח/, "Hebrew nightly/weekly/vacation wording"],
  ];

  for (const [pattern, reason] of shortTermPatterns) {
    if (pattern.test(snippet)) return { isShortTerm: true, reason };
  }

  return { isShortTerm: false, reason: "" };
}

function normalizeCompactAgencyPrice(
  listing: Record<string, any>,
  visibleText: string,
  importType: string = "resale",
): string[] {
  const warnings: string[] = [];
  const price = typeof listing.price === "number" ? listing.price : Number(listing.price);
  if (!Number.isFinite(price) || price <= 0) return warnings;

  const effectiveImportType = normalizeImportType(importType);
  const status = listing.listing_status === "for_rent" ? "for_rent" : "for_sale";
  const validateAsSale = effectiveImportType === "resale" || (effectiveImportType === "both" && status === "for_sale");

  const text = visibleText.slice(0, 80_000);
  const hasRentSignal = /לחודש|חודשי|השכרה|שכירות|per\s+month|monthly|\/\s*month|for\s+rent/i.test(text);
  const hasSaleSignal = /למכירה|מכירה|for\s+sale|buy|purchase|₪\s*\d{1,2}(?:\.\d+)?\s*(?:m|million|מיליון)|\d{1,2}(?:\.\d+)?\s*(?:m|million|מיליון)/i.test(text);

  if (status === "for_rent" && price > 0 && price < 100 && hasRentSignal) {
    listing.price = Math.round(price * 1_000);
    listing._price_normalized_from_compact_thousands = price;
    warnings.push(`normalized compact agency rental price ${price}K to ${listing.price} NIS/month`);
  } else if (validateAsSale && price < 100 && hasSaleSignal && !hasRentSignal) {
    listing.price = Math.round(price * 1_000_000);
    listing._price_normalized_from_compact_millions = price;
    warnings.push(`normalized compact agency sale price ${price}M to ${listing.price} NIS`);
  }

  return warnings;
}

function validatePropertyData(listing: Record<string, any>, importType: string = "resale"): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const currentYear = new Date().getFullYear();
  const effectiveImportType = normalizeImportType(importType);
  const listingStatus = listing.listing_status === "for_rent" ? "for_rent" : "for_sale";
  const validateAsRental = effectiveImportType === "rental" || (effectiveImportType === "both" && listingStatus === "for_rent");
  const validateAsResale = effectiveImportType === "resale" || (effectiveImportType === "both" && listingStatus === "for_sale");

  // Price validation
  if (listing.price != null && listing.price < 0) {
    errors.push("price cannot be negative");
  } else if (listing.price === 1) {
    errors.push("price=1 is a sold placeholder — skip");
  } else if (listing.price != null && listing.price > 0 && listing.price < 20_000) {
    if (validateAsResale) {
      errors.push(`price ${listing.price} NIS appears to be rent, not sale price`);
    } else {
      warnings.push(`price ${listing.price} NIS — verify this is correct for a rental listing`);
    }
  } else if (listing.price != null && listing.price > 0 && listing.price < 100_000) {
    if (validateAsResale) {
      warnings.push(`price ${listing.price} seems unusually low for a property`);
    }
  }

  if (listing.listing_status === "for_rent" && effectiveImportType === "resale") {
    errors.push("rental listing — resale import only");
  }
  if (listing.listing_status === "for_sale" && effectiveImportType === "rental") {
    errors.push("sale listing — rental import only");
  }

  // Skip non-resale property types
  if (listing.property_type && SKIP_PROPERTY_TYPES.has(listing.property_type)) {
    errors.push(`property type '${listing.property_type}' not imported in resale mode`);
  }

  // Enum validation
  if (listing.property_type && !VALID_PROPERTY_TYPES.includes(listing.property_type)) {
    errors.push(`invalid property_type '${listing.property_type}'`);
  }
  if (listing.listing_status && !VALID_LISTING_STATUSES.includes(listing.listing_status)) {
    errors.push(`invalid listing_status '${listing.listing_status}'`);
  }

  // Numeric sanity
  if (listing.bedrooms != null && (typeof listing.bedrooms !== "number" || listing.bedrooms < 0)) {
    errors.push("bedrooms must be a non-negative number");
  }
  if (listing.bathrooms != null && (typeof listing.bathrooms !== "number" || listing.bathrooms < 0)) {
    errors.push("bathrooms must be a non-negative number");
  }
  if (listing.size_sqm != null && (typeof listing.size_sqm !== "number" || listing.size_sqm <= 0)) {
    errors.push("size_sqm must be a positive number");
  }
  if (listing.floor != null && (typeof listing.floor !== "number" || listing.floor < -2 || listing.floor > 200)) {
    errors.push(`floor ${listing.floor} is out of range (-2 to 200)`);
  }
  if (listing.floor != null && listing.total_floors != null && typeof listing.floor === "number" && typeof listing.total_floors === "number" && listing.floor > listing.total_floors) {
    warnings.push(`floor ${listing.floor} exceeds total_floors ${listing.total_floors}`);
  }
  if (listing.year_built != null && (typeof listing.year_built !== "number" || listing.year_built < 1800 || listing.year_built > currentYear + 5)) {
    errors.push(`year_built ${listing.year_built} is out of range`);
  }

  // ── City-specific price range validation ──
  if (listing.city && listing.price && listing.price > 0) {
    if (validateAsResale) {
      const cityRange = CITY_PRICE_RANGES[listing.city];
      if (cityRange) {
        if (listing.price < cityRange.min * 0.5) {
          warnings.push(`price ${listing.price} is well below ${listing.city} range (${cityRange.min}–${cityRange.max})`);
        } else if (listing.price > cityRange.max * 1.5) {
          warnings.push(`price ${listing.price} is well above ${listing.city} range (${cityRange.min}–${cityRange.max})`);
        }

        // Price per sqm check
        if (listing.size_sqm && listing.size_sqm > 0) {
          const priceSqm = listing.price / listing.size_sqm;
          if (priceSqm < cityRange.sqm_min * 0.5 || priceSqm > cityRange.sqm_max * 1.5) {
            warnings.push(`price/sqm ${Math.round(priceSqm)} outside ${listing.city} range (${cityRange.sqm_min}–${cityRange.sqm_max})`);
          }
        }
      }
    } else if (validateAsRental) {
      // Rental price validation
      if (listing.price > 30_000) {
        errors.push(`rental price ${listing.price} NIS/mo is suspiciously high — likely a sale price`);
      }
      const rentalRange = CITY_RENTAL_RANGES[listing.city];
      if (rentalRange) {
        if (listing.price < rentalRange.min * 0.5) {
          warnings.push(`rental price ${listing.price} is well below ${listing.city} range (${rentalRange.min}–${rentalRange.max}/mo)`);
        } else if (listing.price > rentalRange.max * 1.5) {
          warnings.push(`rental price ${listing.price} is well above ${listing.city} range (${rentalRange.min}–${rentalRange.max}/mo)`);
        }
      }
    }
  }

  // ── Rental-specific field warnings ──
  if (validateAsRental || listing.listing_status === "for_rent") {
    if (!listing.furnished_status) {
      warnings.push("rental listing missing furnished_status");
    }
    if (!listing.pets_policy) {
      warnings.push("rental listing missing pets_policy");
    }
  }

  // ── Room-to-size ratio validation ──
  if (listing.bedrooms != null && listing.size_sqm && listing.size_sqm > 0) {
    const rooms = listing.bedrooms + 1;
    const rangeKey = Math.min(rooms, 6);
    const sizeRange = ROOM_SIZE_RANGES[rangeKey];
    if (sizeRange) {
      if (listing.size_sqm < sizeRange.flag_min) {
        warnings.push(`size ${listing.size_sqm}sqm seems small for ${rooms} rooms (expected >${sizeRange.flag_min})`);
      } else if (listing.size_sqm > sizeRange.flag_max) {
        warnings.push(`size ${listing.size_sqm}sqm seems large for ${rooms} rooms (expected <${sizeRange.flag_max})`);
      }
    }
  }

  return { errors, warnings };
}

// ─── CONFIDENCE SCORING ─────────────────────────────────────────────────────

function computeConfidenceScore(
  listing: Record<string, any>,
  cityMatchType: "exact" | "fuzzy" | "domain" | "none",
  validationWarnings: string[],
  hasStructuredData: boolean = false,
  cmsExtracted: string | null = null
): number {
  // Each field scores 1-3, weighted
  const weights = {
    price: 0.20,
    rooms: 0.15,
    size: 0.15,
    city: 0.15,
    address: 0.10,
    propertyType: 0.10,
    photos: 0.10,
    description: 0.05,
  };

  const scores: Record<string, number> = {};

  // Price
  if (!listing.price || listing.price === 0) {
    scores.price = 1;
  } else {
    const cityRange = listing.city ? CITY_PRICE_RANGES[listing.city] : null;
    if (cityRange && listing.price >= cityRange.min * 0.5 && listing.price <= cityRange.max * 1.5) {
      scores.price = 3;
    } else if (cityRange) {
      scores.price = 2;
    } else {
      scores.price = listing.price > 100_000 ? 3 : 2;
    }
  }

  // Rooms
  if (listing.bedrooms == null) {
    scores.rooms = 1;
  } else if (listing.bedrooms >= 0 && listing.bedrooms <= 9) {
    scores.rooms = 3;
  } else {
    scores.rooms = 2;
  }

  // Size
  if (!listing.size_sqm || listing.size_sqm <= 0) {
    scores.size = 1;
  } else if (listing.bedrooms != null) {
    const rooms = listing.bedrooms + 1;
    const rangeKey = Math.min(rooms, 6);
    const sizeRange = ROOM_SIZE_RANGES[rangeKey];
    if (sizeRange && listing.size_sqm >= sizeRange.flag_min && listing.size_sqm <= sizeRange.flag_max) {
      scores.size = 3;
    } else {
      scores.size = 2;
    }
  } else {
    scores.size = 2;
  }

  // City
  if (cityMatchType === "exact") scores.city = 3;
  else if (cityMatchType === "fuzzy") scores.city = 2;
  else if (cityMatchType === "domain") scores.city = 1;
  else scores.city = 1;

  // Address
  if (listing.address && listing.address.trim().length > 0) {
    const hasNumber = /\d/.test(listing.address);
    scores.address = hasNumber ? 3 : 2;
  } else {
    scores.address = 1;
  }

  // Property type
  if (listing.property_type && VALID_PROPERTY_TYPES.includes(listing.property_type)) {
    scores.propertyType = 3;
  } else if (listing.property_type) {
    scores.propertyType = 2;
  } else {
    scores.propertyType = 1;
  }

  // Photos (count only — we do NOT store external photo URLs)
  const photoCount = listing._photo_count || 0;
  if (photoCount >= 3) scores.photos = 3;
  else if (photoCount >= 1) scores.photos = 2;
  else scores.photos = 1;

  // Description
  const descLen = (listing.description || "").length;
  if (descLen >= 50) scores.description = 3;
  else if (descLen >= 10) scores.description = 2;
  else scores.description = 1;

  // Compute weighted score (0-100)
  let total = 0;
  for (const [key, weight] of Object.entries(weights)) {
    total += (scores[key] || 1) * weight;
  }

  // Scale: 1→0, 3→100
  let score = Math.round(((total - 1) / 2) * 100);

  // Penalize for validation warnings
  const warningPenalty = Math.min(validationWarnings.length * 5, 20);
  score = Math.max(0, score - warningPenalty);

  // Boost for structured data confirmation
  if (hasStructuredData) {
    score = Math.min(100, score + 10);
  }

  // Boost for CMS adapter extraction
  if (cmsExtracted) {
    score = Math.min(100, score + 15);
  }

  // Boost for rental field completeness when listing is a rental
  if (listing.listing_status === "for_rent") {
    let rentalFieldBoost = 0;
    if (listing.furnished_status) rentalFieldBoost += 3;
    if (listing.pets_policy) rentalFieldBoost += 3;
    if (listing.lease_term) rentalFieldBoost += 2;
    if (listing.subletting_allowed) rentalFieldBoost += 1;
    if (listing.agent_fee_required != null) rentalFieldBoost += 1;
    score = Math.min(100, score + rentalFieldBoost);
  }

  return Math.min(100, Math.max(0, score));
}

// ─── ADDRESS NORMALIZATION FOR DEDUP ────────────────────────────────────────

function normalizeAddressForDedup(address: string): string {
  let norm = address.trim().toLowerCase();

  // 1. Strip apartment/floor/unit suffixes (Hebrew + English)
  // e.g. "דירה 5", "קומה 3", "apt 4", "floor 2", "unit 12", "#3"
  norm = norm.replace(/(,?\s*)(דירה|דירת|קומה|כניסה|apt\.?|apartment|floor|unit|suite|ste\.?|#)\s*\d*\s*/gi, " ");

  // 2. Strip Hebrew street prefixes
  norm = norm.replace(/^(רחוב|רח[׳']|שדרות|שד[׳']|סמטת|סמ[׳']|ככר)\s+/u, "");
  // Strip English street type words
  norm = norm.replace(/\b(street|st\.?|avenue|ave\.?|boulevard|blvd\.?|road|rd\.?|drive|dr\.?|lane|ln\.?)\b/gi, "");
  // Strip transliterated Hebrew prefix
  norm = norm.replace(/^rechov\s+/i, "");
  norm = norm.replace(/^sderot\s+/i, "");

  // 3. Strip leading Hebrew definite article "ה" when standalone prefix before a name
  norm = norm.replace(/^ה(?=[א-ת])/, "");

  // 4. Normalize Hebrew final-form characters → base form
  norm = norm.replace(/ך/g, "כ").replace(/ם/g, "מ").replace(/ן/g, "נ").replace(/ף/g, "פ").replace(/ץ/g, "צ");

  // 5. Normalize punctuation: remove quotes, periods, commas
  norm = norm.replace(/['"״׳,.]/g, "");

  // 6. Normalize common transliteration variants
  norm = norm.replace(/ch/g, "kh").replace(/tz/g, "ts");
  // Collapse double letters
  norm = norm.replace(/(.)\1+/g, "$1");

  // 7. Remove extra spaces and hyphens
  norm = norm.replace(/\s+/g, " ").replace(/-/g, "").trim();

  return norm;
}

function normalizeTextKey(value: string | null | undefined): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[\u0590-\u05FF]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(apartment|apt|property|listing|for|rent|sale|new|renovated|luxury|spacious)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isStrictSameUnitDuplicate(existing: Record<string, any>, listing: Record<string, any>): boolean {
  if ((existing.listing_status || "for_sale") !== (listing.listing_status || "for_sale")) return false;
  if (existing.city && listing.city && normalizeCityStr(existing.city) !== normalizeCityStr(listing.city)) return false;

  const existingAddress = normalizeAddressForDedup(existing.address || "");
  const incomingAddress = normalizeAddressForDedup(listing.address || "");
  const hasSameAddress = existingAddress.length > 4 && incomingAddress.length > 4 && existingAddress === incomingAddress;

  const sameBeds = existing.bedrooms == null || listing.bedrooms == null || Math.floor(existing.bedrooms) === Math.floor(listing.bedrooms);
  const sameBaths = existing.bathrooms == null || listing.bathrooms == null || Math.floor(existing.bathrooms) === Math.floor(listing.bathrooms);
  const sameFloor = existing.floor == null || listing.floor == null || Math.floor(existing.floor) === Math.floor(listing.floor);
  const sizeClose = existing.size_sqm && listing.size_sqm ? Math.abs(existing.size_sqm - listing.size_sqm) <= 3 : false;
  const priceClose = existing.price && listing.price ? Math.abs(existing.price - listing.price) / Math.max(existing.price, listing.price) <= 0.03 : false;
  const titleOverlap = normalizeTextKey(existing.title) && normalizeTextKey(existing.title) === normalizeTextKey(listing.title);

  if (hasSameAddress && sameBeds && sameBaths && sameFloor && (sizeClose || priceClose)) return true;
  if (!hasSameAddress && sameBeds && sameBaths && sameFloor && sizeClose && priceClose && titleOverlap) return true;
  return false;
}

/** Clean address for storage — strips apartment/floor info and street prefixes for consistency */
function normalizeAddressForStorage(address: string): string {
  let norm = address.trim();
  // Strip apartment/floor suffixes (preserve casing for display)
  norm = norm.replace(/(,?\s*)(דירה|דירת|קומה|כניסה|apt\.?|apartment|floor|unit|suite|ste\.?|#)\s*\d*\s*/gi, " ");
  // Strip Hebrew street prefixes
  norm = norm.replace(/^(רחוב|רח[׳']|שדרות|שד[׳']|סמטת|סמ[׳']|ככר)\s+/u, "");
  // Strip English street prefixes
  norm = norm.replace(/^(street|st\.?|avenue|ave\.?|boulevard|blvd\.?)\s+/i, "");
  // Clean up spacing
  norm = norm.replace(/\s+/g, " ").trim();
  return norm;
}

/** Build a looser ilike pattern to match against raw DB addresses */
function buildAddressQueryPattern(normalizedAddr: string): string {
  // Extract the core: street name + house number (first number found)
  const numberMatch = normalizedAddr.match(/\d+/);
  const streetPart = normalizedAddr.replace(/\d+.*$/, "").trim();
  if (!streetPart) return `%${normalizedAddr}%`;
  if (numberMatch) {
    // Match: anything...street...number...anything
    return `%${streetPart}%${numberMatch[0]}%`;
  }
  return `%${streetPart}%`;
}

// ─── AI URL CLASSIFICATION (BATCHED) ────────────────────────────────────────

async function classifyUrlChunk(urls: string[], lovableKey: string): Promise<string[]> {
  try {
    const filterPrompt = `You are analyzing URLs from a real estate agency website. 
Given this list of URLs, identify which ones are individual property/listing detail pages ONLY (not category pages, contact pages, about pages, blog posts, etc.).

IMPORTANT: Do NOT include project or development pages. Exclude URLs that point to new construction projects, developments, or מתחם/פרויקט pages. These have paths like /project/, /פרויקט/, /development/, /בנייה-חדשה/, /new-construction/, /new-building/, /דירות-חדשות/, /מתחם/.

Look for URL patterns that suggest individual resale or rental listings, such as:
- URLs containing property IDs, slugs, or numeric identifiers
- URLs with paths like /property/, /listing/, /נכס/, /דירה/, etc.
- URLs that look like they point to a single property page for sale or for rent

IMPORTANT: Only return URLs for ACTIVE, LIVE listings that are currently for sale or for rent. 
Exclude any URLs that appear to be sold, rented, leased, archived, off-market, or completed listings.
Look for signals like "sold", "rented", "נמכר", "הושכר", "under-contract", "past-sales", "archive" in the URL path or slug.

Return ONLY active individual listing URLs as a JSON array of strings. If unsure about a URL, exclude it.

URLs to analyze:
${urls.join("\n")}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: filterPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "return_listing_urls",
            description: "Return the filtered listing URLs",
            parameters: {
              type: "object",
              properties: {
                listing_urls: { type: "array", items: { type: "string" }, description: "Array of individual listing page URLs" },
              },
              required: ["listing_urls"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_listing_urls" } },
      }),
    });

    if (!aiRes.ok) { console.warn(`AI classification failed (${aiRes.status})`); return []; }
    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return parsed.listing_urls || [];
    }
    return [];
  } catch (err) {
    console.warn(`classifyUrlChunk failed: ${err}`);
    return [];
  }
}

async function classifyUrlsInBatches(allUrls: string[], lovableKey: string, chunkSize = 80, concurrency = 3): Promise<string[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < allUrls.length; i += chunkSize) chunks.push(allUrls.slice(i, i + chunkSize));

  dlog(`Classifying ${allUrls.length} URLs in ${chunks.length} chunk(s)`);
  const allResults = new Set<string>();
  let totalFailed = 0;

  for (let i = 0; i < chunks.length; i += concurrency) {
    const group = chunks.slice(i, i + concurrency);
    const results = await Promise.allSettled(group.map(chunk => classifyUrlChunk(chunk, lovableKey)));
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.length > 0) {
        for (const url of r.value) allResults.add(url);
      } else { totalFailed++; }
    }
  }

  const listingUrls = Array.from(allResults);
  if (listingUrls.length === 0) {
    console.warn("AI classification found 0 listing URLs — returning empty (no fallback)");
    return [];
  }
  dlog(`Batch classification complete: ${listingUrls.length} listing URLs (${totalFailed} empty chunks)`);
  return listingUrls;
}

// ─── DISCOVER ───────────────────────────────────────────────────────────────

// Tracking / marketing params to strip for dedup
const STRIP_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
  'ref', 'referer', 'referrer', 'source', 'src',
  'fbclid', 'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid',
  'msclkid', 'twclid', 'ttclid', 'li_fat_id',
  'mc_cid', 'mc_eid', '_ga', '_gl', '_hsenc', '_hsmi',
  'hsa_cam', 'hsa_grp', 'hsa_mt', 'hsa_src', 'hsa_ad', 'hsa_acc', 'hsa_net', 'hsa_ver', 'hsa_la', 'hsa_ol', 'hsa_kw',
  'yclid', 'spm', 'scm', 'aff_id', 'campaign_id', 'ad_id',
  'pk_campaign', 'pk_kwd', 'pk_source', 'pk_medium', 'pk_content',
  'mtm_campaign', 'mtm_kwd', 'mtm_source', 'mtm_medium', 'mtm_content',
  'redirect', 'callback', 'returnUrl', 'return_url',
  '_', 'nocache', 'timestamp', 'cachebuster',
]);

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!url.startsWith("http")) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    parsed.hostname = parsed.hostname.toLowerCase();
    // Remove www. prefix for consistent matching
    if (parsed.hostname.startsWith("www.")) {
      parsed.hostname = parsed.hostname.slice(4);
    }
    // Strip trailing slash
    if (parsed.pathname.endsWith("/") && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    // Strip tracking/marketing query params
    const keysToDelete: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      if (STRIP_PARAMS.has(key.toLowerCase())) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(k => parsed.searchParams.delete(k));
    // Remove fragment
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url.toLowerCase().replace(/\/+$/, "");
  }
}

function sanitizeDiscoveredUrl(raw: string, baseUrl?: string): { url: string | null; reason?: string } {
  if (!raw || typeof raw !== "string") return { url: null, reason: "empty_url" };
  let candidate = raw.trim().replace(/&amp;/g, "&");
  try {
    candidate = new URL(candidate, baseUrl || undefined).toString();
    const parsed = new URL(candidate);
    const originalPath = parsed.pathname;
    parsed.pathname = parsed.pathname
      .replace(/\/(estate_property|property|properties)\/NaN\d*/i, "/$1/")
      .replace(/\/(estate_property|property|properties)\/NaN(?=%[dD]7|[\u0590-\u05FF])/i, "/$1/");
    const normalized = normalizeUrl(parsed.toString());
    return { url: normalized, reason: originalPath !== parsed.pathname ? "repaired_malformed_nan_path" : undefined };
  } catch {
    return { url: null, reason: "malformed_url" };
  }
}

function canonicalizeDiscoveredUrls(urls: string[], baseUrl: string): { urls: string[]; rejected: number; repaired: number; diagnostics: Record<string, number> } {
  const seen = new Set<string>();
  let rejected = 0;
  let repaired = 0;
  const diagnostics: Record<string, number> = {};
  for (const raw of urls) {
    const sanitized = sanitizeDiscoveredUrl(raw, baseUrl);
    if (sanitized.reason) diagnostics[sanitized.reason] = (diagnostics[sanitized.reason] || 0) + 1;
    if (!sanitized.url) { rejected++; continue; }
    if (sanitized.reason?.startsWith("repaired")) repaired++;
    seen.add(sanitized.url);
  }
  return { urls: Array.from(seen), rejected, repaired, diagnostics };
}

async function discoverSitemapListingUrls(siteRoot: string): Promise<string[]> {
  const sitemapPaths = [
    "/sitemap.xml",
    "/property-sitemap.xml",
    "/estate_property-sitemap.xml",
    "/wp-sitemap-posts-estate_property-1.xml",
  ];
  const links = new Set<string>();
  for (const path of sitemapPaths) {
    try {
      const sitemapUrl = new URL(path, siteRoot).toString();
      const res = await fetchWithTimeout(sitemapUrl, { headers: { Accept: "application/xml,text/xml,*/*" } }, 12_000);
      if (!res.ok) continue;
      const xml = await res.text();
      const locRegex = /<loc>\s*([^<]+)\s*<\/loc>/gi;
      let match: RegExpExecArray | null;
      while ((match = locRegex.exec(xml)) !== null) {
        const cleaned = decodeHtmlEntities(match[1]);
        if (isStrongAgencyListingUrl(cleaned, siteRoot)) links.add(normalizeUrl(cleaned));
      }
    } catch (err) {
      console.warn(`Sitemap discovery failed for ${path}: ${err}`);
    }
  }
  return Array.from(links);
}

function isSameSiteUrl(candidate: string, sourceUrl: string): boolean {
  try {
    const candidateHost = new URL(candidate).hostname.toLowerCase().replace(/^www\./, "");
    const sourceHost = new URL(sourceUrl).hostname.toLowerCase().replace(/^www\./, "");
    return candidateHost === sourceHost;
  } catch {
    return false;
  }
}

function isAgencyOwnWebsiteSource(sourceType?: string | null): boolean {
  const normalized = String(sourceType || "website").toLowerCase();
  return !normalized.includes("yad2") && !normalized.includes("madlan");
}

function isStrongAgencyListingUrl(candidate: string, sourceUrl: string): boolean {
  try {
    if (!isSameSiteUrl(candidate, sourceUrl)) return false;
    const path = decodeURIComponent(new URL(candidate).pathname).toLowerCase();
    return /\/(estate_property|property|properties)\//i.test(path) && !/(sold|rented|archive|archived|נמכר|הושכר|בהסכם)/i.test(path);
  } catch {
    return false;
  }
}

function extractLinksFromHtml(html: string, pageUrl: string): string[] {
  const links = new Set<string>();
  const linkRegex = /<a\s[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const absoluteUrl = new URL(match[1], pageUrl).toString();
      if (isSameSiteUrl(absoluteUrl, pageUrl)) links.add(normalizeUrl(absoluteUrl));
    } catch { /* ignore malformed hrefs */ }
  }

  return Array.from(links);
}

async function discoverDirectPageLinks(pageUrl: string, firecrawlKey: string): Promise<string[]> {
  try {
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url: pageUrl, formats: ["links", "html"], onlyMainContent: false, waitFor: 3000 }),
    });
    if (!scrapeRes.ok) {
      console.warn(`Direct link scrape failed (${scrapeRes.status}) for ${pageUrl}`);
      return [];
    }

    const scrapeData = await scrapeRes.json();
    const data = scrapeData.data || scrapeData;
    const scrapedLinks = Array.isArray(data.links) ? data.links : [];
    const htmlLinks = typeof data.html === "string" ? extractLinksFromHtml(data.html, pageUrl) : [];

    const links = new Set<string>();
    for (const link of [...scrapedLinks, ...htmlLinks]) {
      try {
        const absoluteUrl = new URL(link, pageUrl).toString();
        if (isSameSiteUrl(absoluteUrl, pageUrl)) links.add(normalizeUrl(absoluteUrl));
      } catch { /* ignore malformed links */ }
    }
    return Array.from(links);
  } catch (err) {
    console.warn(`Direct link discovery failed for ${pageUrl}: ${err}`);
    return [];
  }
}

// ─── Pagination discovery ────────────────────────────────────────────────────
// Given initial links from a page, detect pagination patterns and scrape
// subsequent pages to collect all listing links across paginated views.
const PAGINATION_PATTERNS = [
  /\/page\/(\d+)/i,
  /[?&]paged=(\d+)/i,
  /[?&]page=(\d+)/i,
  /[?&]pg=(\d+)/i,
];

function detectPaginationUrls(links: string[], baseUrl: string): string[] {
  const pageNums = new Map<string, number>(); // template → max page seen
  const templates = new Map<string, string>(); // template → example URL

  for (const link of links) {
    if (!isSameSiteUrl(link, baseUrl)) continue;
    for (const pattern of PAGINATION_PATTERNS) {
      const match = link.match(pattern);
      if (match) {
        const pageNum = parseInt(match[1], 10);
        // Create a template by replacing the page number with a placeholder
        const template = link.replace(match[0], match[0].replace(match[1], "__PAGE__"));
        const current = pageNums.get(template) || 0;
        if (pageNum > current) {
          pageNums.set(template, pageNum);
          templates.set(template, link);
        }
      }
    }
  }

  // Generate URLs for all pages up to the max detected
  const paginationUrls: string[] = [];
  for (const [template, maxPage] of pageNums) {
    for (let i = 2; i <= Math.min(maxPage + 2, 30); i++) {
      const url = template.replace("__PAGE__", String(i));
      paginationUrls.push(url);
    }
  }
  return [...new Set(paginationUrls)];
}

async function discoverPaginatedLinks(
  initialLinks: string[],
  entryUrl: string,
  firecrawlKey: string
): Promise<string[]> {
  const paginationUrls = detectPaginationUrls(initialLinks, entryUrl);
  if (paginationUrls.length === 0) return [];

  console.log(`Pagination: found ${paginationUrls.length} paginated URLs to scrape`);
  const allLinks: string[] = [];

  // Scrape pagination pages in batches of 3
  for (let i = 0; i < paginationUrls.length; i += 3) {
    const batch = paginationUrls.slice(i, i + 3);
    const results = await Promise.allSettled(
      batch.map(url => discoverDirectPageLinks(url, firecrawlKey))
    );
    for (const r of results) {
      if (r.status === "fulfilled") allLinks.push(...r.value);
    }
  }

  console.log(`Pagination: discovered ${allLinks.length} additional links from ${paginationUrls.length} pages`);
  return allLinks;
}

async function getKnownSourceUrlsForAgency(sb: any, agencyId: string): Promise<Set<string>> {
  const knownUrlSet = new Set<string>();

  const addRows = (rows: Array<{ source_url?: string | null }> | null | undefined) => {
    for (const row of rows || []) {
      if (row.source_url) knownUrlSet.add(normalizeUrl(row.source_url));
    }
  };

  const { data: directRows, error: directErr } = await sb
    .from("properties")
    .select("source_url")
    .or(`primary_agency_id.eq.${agencyId},claimed_by_agency_id.eq.${agencyId}`)
    .not("source_url", "is", null);
  if (directErr) console.warn(`[Known URLs] direct agency lookup failed: ${directErr.message}`);
  addRows(directRows);

  const { data: agentRows, error: agentErr } = await sb
    .from("agents")
    .select("id")
    .eq("agency_id", agencyId);
  if (agentErr) console.warn(`[Known URLs] agent lookup failed: ${agentErr.message}`);

  const agentIds = (agentRows || []).map((row: any) => row.id).filter(Boolean);
  if (agentIds.length > 0) {
    const { data: agentPropertyRows, error: propErr } = await sb
      .from("properties")
      .select("source_url")
      .in("agent_id", agentIds)
      .not("source_url", "is", null);
    if (propErr) console.warn(`[Known URLs] agent property lookup failed: ${propErr.message}`);
    addRows(agentPropertyRows);
  }

  return knownUrlSet;
}

function selectModeIndexUrls(urls: string[], importType: string): string[] {
  const normalizedType = normalizeImportType(importType);
  if (normalizedType !== "both") return [];

  const salePatterns = [/למכירה/i, /מכירה/i, /for[-_]?sale/i, /forsale/i, /sale/i];
  const rentPatterns = [/להשכרה/i, /השכרה/i, /לטווח/i, /for[-_]?rent/i, /forrent/i, /rent/i];
  const selected: string[] = [];

  for (const url of urls) {
    let decoded = url.toLowerCase();
    try { decoded = decodeURIComponent(url).toLowerCase(); } catch { /* keep raw */ }
    const isModeIndex = salePatterns.some((p) => p.test(decoded)) || rentPatterns.some((p) => p.test(decoded));
    if (!isModeIndex) continue;
    if (!/(property_action_category|property_category|properties|listings|for-|forsale|rent|למכירה|להשכרה|השכרה|מכירה)/i.test(decoded)) continue;
    selected.push(url);
  }

  return Array.from(new Set(selected.map((url) => normalizeUrl(url)))).slice(0, 10);
}


// ─── Extract site root from any URL ──────────────────────────────────────────
function getSiteRoot(url: string): string {
  try {
    const parsed = new URL(normalizeUrl(url));
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return url;
  }
}

async function handleDiscover(body: any) {
  const { agency_id, website_url, import_type = "resale", job_id: existingJobId } = body;
  if (!agency_id || !website_url) throw new Error("agency_id and website_url required");

  const sb = supabaseAdmin();
  const normalizedUrl = normalizeUrl(website_url);

  const { data: agency, error: agencyErr } = await sb
    .from("agencies").select("id, admin_user_id").eq("id", agency_id).single();
  if (agencyErr || !agency) throw new Error("Agency not found");

  // Only actual imported properties should suppress rediscovery. Previous job
  // history can include aborted/skipped runs, and using it here prevents admins
  // from restarting a corrected import.
  const knownUrlSet = await getKnownSourceUrlsForAgency(sb, agency_id);

  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

  const formattedUrl = normalizedUrl;
  const siteRoot = getSiteRoot(formattedUrl);
  const enteredUrlIsDifferentFromRoot = normalizeUrl(siteRoot) !== normalizeUrl(formattedUrl);

  // STRATEGY: Always map from site root for maximum coverage, then also
  // scrape the specific entered URL for direct links + pagination.
  console.log(`Discover: mapping from site root: ${siteRoot} (entered: ${formattedUrl})`);

  const sitemapUrls = await discoverSitemapListingUrls(siteRoot);
  if (sitemapUrls.length > 0) console.log(`Sitemap discovery found ${sitemapUrls.length} canonical listing URLs`);

  const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
    method: "POST",
    headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url: siteRoot, limit: 2000, includeSubdomains: false }),
  });
  if (!mapRes.ok) {
    const errText = await mapRes.text();
    throw new Error(`Firecrawl MAP failed (${mapRes.status}): ${errText.slice(0, 300)}`);
  }
  const mapData = await mapRes.json();

  const rawUrls: string[] = [...sitemapUrls, ...(mapData.links || mapData.data || [])];
  console.log(`Root map discovered ${rawUrls.length} URLs`);

  // Always scrape the entered URL for direct links (catches listings the map misses)
  const directLinks = await discoverDirectPageLinks(formattedUrl, FIRECRAWL_API_KEY);
  if (directLinks.length > 0) {
    const merged = new Set(rawUrls.map(url => normalizeUrl(url)));
    for (const link of directLinks) merged.add(link);
    rawUrls.length = 0;
    rawUrls.push(...Array.from(merged));
    console.log(`Direct scrape of entered URL: +${directLinks.length} links, ${rawUrls.length} total after merge`);
  }

  // If entered URL differs from root, also scrape the root for links
  if (enteredUrlIsDifferentFromRoot) {
    const rootLinks = await discoverDirectPageLinks(siteRoot, FIRECRAWL_API_KEY);
    if (rootLinks.length > 0) {
      const merged = new Set(rawUrls.map(url => normalizeUrl(url)));
      for (const link of rootLinks) merged.add(link);
      rawUrls.length = 0;
      rawUrls.push(...Array.from(merged));
      dlog(`Root page scrape: +${rootLinks.length} links, ${rawUrls.length} total`);
    }
  }

  // In both-mode, explicitly scrape sale/rent index/category pages discovered by the map.
  // Some agency sites keep rental listings behind Hebrew taxonomy pages that the root page does not link directly.
  const modeIndexUrls = selectModeIndexUrls(rawUrls, import_type);
  if (modeIndexUrls.length > 0) {
    console.log(`Both-mode category discovery: scraping ${modeIndexUrls.length} sale/rent index pages`);
    const categoryResults = await Promise.allSettled(
      modeIndexUrls.map((url) => discoverDirectPageLinks(url, FIRECRAWL_API_KEY))
    );
    const merged = new Set(rawUrls.map(url => normalizeUrl(url)));
    let addedFromCategories = 0;
    for (const result of categoryResults) {
      if (result.status !== "fulfilled") continue;
      for (const link of result.value) {
        const normalizedLink = normalizeUrl(link);
        if (!merged.has(normalizedLink)) {
          merged.add(normalizedLink);
          addedFromCategories++;
        }
      }
    }
    rawUrls.length = 0;
    rawUrls.push(...Array.from(merged));
    console.log(`Both-mode category discovery: +${addedFromCategories} links, ${rawUrls.length} total after merge`);
  }

  // Pagination: detect paginated listing pages and follow them
  try {
    const paginatedLinks = await discoverPaginatedLinks(rawUrls, formattedUrl, FIRECRAWL_API_KEY);
    if (paginatedLinks.length > 0) {
      const merged = new Set(rawUrls.map(url => normalizeUrl(url)));
      for (const link of paginatedLinks) merged.add(link);
      rawUrls.length = 0;
      rawUrls.push(...Array.from(merged));
      console.log(`Pagination expansion: +${paginatedLinks.length} links, ${rawUrls.length} total`);
    }
  } catch (err) {
    console.warn(`Pagination discovery failed: ${err}`);
  }

  if (rawUrls.length === 0) throw new Error("No URLs discovered on this website");

  // Track Firecrawl map cost (job_id not yet created, will track in batch)

  // Pre-filter: remove sold/rented keyword URLs
  const SOLD_URL_KEYWORDS = [
    'sold', 'rented', 'leased', 'archived', 'completed',
    'past-sale', 'under-contract', 'off-market',
    'נמכר', 'הושכר', 'בהסכם',
    '%D7%A0%D7%9E%D7%9B%D7%A8', '%D7%94%D7%95%D7%A9%D7%9B%D7%A8',
  ];

  const canonical = canonicalizeDiscoveredUrls(rawUrls, formattedUrl);
  if (canonical.rejected > 0 || canonical.repaired > 0) {
    console.log(`URL sanitation: ${canonical.repaired} repaired, ${canonical.rejected} rejected, ${canonical.urls.length} canonical`, canonical.diagnostics);
  }

  const allUrls = canonical.urls.filter(url => {
    try {
      const decoded = decodeURIComponent(url).toLowerCase();
      return !SOLD_URL_KEYWORDS.some(kw => decoded.includes(kw));
    } catch { return true; }
  });

  const urlFilteredOut = rawUrls.length - allUrls.length;
  if (urlFilteredOut > 0) dlog(`URL keyword filter: removed ${urlFilteredOut} sold/rented URLs`);

  // Index page sold-URL pre-filter
  try {
    const soldUrlsFromIndex = await findSoldUrlsFromIndexPages(allUrls, normalizedUrl, FIRECRAWL_API_KEY);
    if (soldUrlsFromIndex.size > 0) {
      const beforeCount = allUrls.length;
      const filteredUrls = allUrls.filter(url => !soldUrlsFromIndex.has(normalizeUrl(url)));
      allUrls.length = 0;
      allUrls.push(...filteredUrls);
      dlog(`Index page filter: removed ${beforeCount - allUrls.length} sold URLs`);
    }
  } catch (err) { console.warn(`Index page pre-filter failed: ${err}`); }

  // Non-listing URL pattern filter
  const { listingCandidates, removed: nonListingRemoved } = filterNonListingUrls(allUrls);
  if (nonListingRemoved > 0 && listingCandidates.length > 0) {
    allUrls.length = 0;
    allUrls.push(...listingCandidates);
    dlog(`Non-listing filter: removed ${nonListingRemoved}, ${allUrls.length} remaining`);
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  // Subtract already-known URLs BEFORE AI classification
  const newUrls = knownUrlSet.size > 0
    ? allUrls.filter(url => !knownUrlSet.has(normalizeUrl(url)))
    : allUrls;
  const skippedExisting = allUrls.length - newUrls.length;

  if (skippedExisting > 0) dlog(`Incremental dedup: ${skippedExisting} known, ${newUrls.length} new`);

  if (newUrls.length === 0) {
    if (existingJobId) {
      await sb.from("import_jobs").update({
        status: "completed",
        total_urls: 0,
        discovered_urls: allUrls,
        failure_reason: JSON.stringify({ url_sanitation: canonical.diagnostics, skipped_existing: skippedExisting }),
        processed_count: 0,
        failed_count: 0,
      }).eq("id", existingJobId);
    }
    return { job_id: null, total_listings: 0, total_discovered: allUrls.length, new_urls: 0, skipped_existing: skippedExisting };
  }

  const deterministicListingUrls = newUrls.filter((url) => isStrongAgencyListingUrl(url, formattedUrl));
  const needsAiClassification = newUrls.filter((url) => !isStrongAgencyListingUrl(url, formattedUrl));
  const aiListingUrls = needsAiClassification.length > 0
    ? await classifyUrlsInBatches(needsAiClassification, LOVABLE_API_KEY)
    : [];
  const listingUrls = Array.from(new Set([...deterministicListingUrls, ...aiListingUrls].map((url) => normalizeUrl(url))));
  console.log(`Listing classification: ${deterministicListingUrls.length} deterministic + ${aiListingUrls.length} AI = ${listingUrls.length}`);

  if (listingUrls.length === 0) {
    if (existingJobId) {
      await sb.from("import_jobs").update({
        status: "completed",
        total_urls: 0,
        discovered_urls: allUrls,
        processed_count: 0,
        failed_count: 0,
      }).eq("id", existingJobId);
    }
    return { job_id: null, total_listings: 0, total_discovered: allUrls.length, new_urls: 0, skipped_existing: skippedExisting };
  }

  let job = existingJobId ? { id: existingJobId } : null;
  if (existingJobId) {
    const { error: updateJobErr } = await sb
      .from("import_jobs")
      .update({ status: "ready", total_urls: listingUrls.length, discovered_urls: allUrls, import_type, failure_reason: JSON.stringify({ url_sanitation: canonical.diagnostics, discovered_raw: rawUrls.length, canonical: canonical.urls.length, queued: listingUrls.length }) })
      .eq("id", existingJobId);
    if (updateJobErr) throw new Error(`Failed to update import job: ${updateJobErr.message}`);
  } else {
    const { data: insertedJob, error: jobErr } = await sb
      .from("import_jobs")
      .insert({ agency_id, website_url: formattedUrl, status: "ready", total_urls: listingUrls.length, discovered_urls: allUrls, import_type, source_type: "website", failure_reason: JSON.stringify({ url_sanitation: canonical.diagnostics, discovered_raw: rawUrls.length, canonical: canonical.urls.length, queued: listingUrls.length }) })
      .select("id").single();
    if (jobErr) throw new Error(`Failed to create import job: ${jobErr.message}`);
    job = insertedJob;
  }
  if (!job) throw new Error("Failed to initialize import job");

  // Track Firecrawl map cost
  await trackCost(sb, job.id, "firecrawl", 1, "credits");

  const items = listingUrls.map((url) => ({ job_id: job.id, url, status: "pending" }));
  const { error: itemsErr } = await sb.from("import_job_items").insert(items);
  if (itemsErr) throw new Error(`Failed to create job items: ${itemsErr.message}`);

  return { job_id: job.id, total_listings: listingUrls.length, total_discovered: allUrls.length, new_urls: listingUrls.length, skipped_existing: skippedExisting };
}

async function handleWebsiteDiscoverAsync(body: any) {
  const { agency_id, website_url, import_type = "resale" } = body;
  if (!agency_id || !website_url) throw new Error("agency_id and website_url required");

  const sb = supabaseAdmin();
  const formattedUrl = normalizeUrl(website_url);
  const { data: agency, error: agencyErr } = await sb
    .from("agencies")
    .select("id")
    .eq("id", agency_id)
    .single();
  if (agencyErr || !agency) throw new Error("Agency not found");

  const { data: job, error: jobErr } = await sb
    .from("import_jobs")
    .insert({
      agency_id,
      website_url: formattedUrl,
      status: "discovering",
      total_urls: 0,
      discovered_urls: [],
      processed_count: 0,
      failed_count: 0,
      import_type,
      source_type: "website",
    })
    .select("id")
    .single();
  if (jobErr || !job) throw new Error(`Failed to create import job: ${jobErr?.message || "Unknown error"}`);

  EdgeRuntime.waitUntil(
    handleDiscover({ ...body, website_url: formattedUrl, job_id: job.id }).catch(async (err) => {
      console.error(`[Website] background discovery failed for job ${job.id}:`, err);
      await sb.from("import_jobs").update({ status: "failed" }).eq("id", job.id);
    })
  );

  return {
    job_id: job.id,
    total_listings: 0,
    total_discovered: 0,
    new_urls: 0,
    skipped_existing: 0,
    started_async: true,
  };
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithTimeout(input: string | URL | Request, init: RequestInit = {}, timeoutMs = 30_000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// ─── NON-LISTING URL PATTERN FILTER ─────────────────────────────────────────

const NON_LISTING_SEGMENTS = new Set([
  "about", "contact", "team", "our-team", "careers", "jobs", "privacy", "terms", "legal",
  "disclaimer", "login", "signin", "signup", "register", "auth", "account",
  "dashboard", "admin", "panel", "blog", "news", "press", "media", "faq",
  "help", "support", "sitemap", "accessibility", "cookie", "cookies", "cart",
  "checkout", "payment", "subscribe", "unsubscribe", "partners", "affiliates",
  "investors", "testimonials", "reviews", "awards", "archive", "category",
  "tag", "tags", "author", "feed", "wp-admin", "wp-login", "wp-content",
  "project", "projects", "development", "developments", "new-construction",
  "new-building", "new-homes", "new-development",
  "neighborhoods", "neighborhood", "neighborhoods-in-jerusalem", "jerusalem-neighborhoods",
  "agents", "agent", "webinar", "webinars", "events", "event",
  "sell-jerusalem-real-estate", "sell", "calculator", "purchase-tax-calculator",
  "investment-opportunities", "advanced-search", "luxury-homes",
  "real-estate-in-jerusalem", "listings", "listings-in-jerusalem",
  "exclusive-projects",
  "פרויקט", "פרויקטים", "בנייה-חדשה", "דירות-חדשות", "מתחם", "מתחמים",
  "שכונות", "סוכנים",
]);

const NON_LISTING_EXTENSIONS = new Set([
  ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".mp4", ".mp3",
  ".zip", ".doc", ".docx", ".xls", ".xlsx", ".css", ".js", ".xml", ".json",
  ".rss", ".atom", ".ico", ".woff", ".woff2", ".ttf", ".eot",
]);

function filterNonListingUrls(urls: string[]): { listingCandidates: string[]; removed: number } {
  const listingCandidates: string[] = [];
  let removed = 0;

  for (const url of urls) {
    let pathname: string;
    try { pathname = new URL(url).pathname; } catch { listingCandidates.push(url); continue; }

    let decodedPath: string;
    try { decodedPath = decodeURIComponent(pathname).toLowerCase(); } catch { decodedPath = pathname.toLowerCase(); }

    const lastDot = decodedPath.lastIndexOf(".");
    if (lastDot > decodedPath.lastIndexOf("/")) {
      const ext = decodedPath.slice(lastDot);
      if (NON_LISTING_EXTENSIONS.has(ext)) { removed++; continue; }
    }

    const segments = decodedPath.split("/").filter(Boolean);
    if (segments.some(seg => NON_LISTING_SEGMENTS.has(seg))) { removed++; continue; }

    listingCandidates.push(url);
  }
  return { listingCandidates, removed };
}

// ─── GEOCODING ──────────────────────────────────────────────────────────────

async function geocodeWithRateLimit(address: string, city: string, neighborhood?: string | null): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetchWithTimeout(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/geocode-address`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType: "property",
          entityId: crypto.randomUUID(),
          address,
          city,
          neighborhood: neighborhood || undefined,
          skipDbSave: true,
        }),
      },
      12_000
    );
    const data = await res.json();
    if (data.success) {
      return { lat: data.latitude, lng: data.longitude };
    }
    console.warn(`Geocoding failed for "${address}, ${city}":`, data.error);
    return null;
  } catch (err) {
    console.error("Geocode fetch error:", err);
    return null;
  }
}

// ─── IMAGE HANDLING (with placeholder detection) ────────────────────────────

async function enhanceImage(imagePublicUrl: string, sb: any, bucketName: string, jobId: string): Promise<string> {
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return imagePublicUrl;
    const enhancePath = `imports/${jobId}/${crypto.randomUUID()}-enhanced.png`;
    const res = await fetchWithTimeout(`${Deno.env.get("SUPABASE_URL")}/functions/v1/enhance-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imagePublicUrl, bucket: bucketName, path: enhancePath }),
    }, 20_000);
    if (!res.ok) return imagePublicUrl;
    const data = await res.json();
    return (data.success && data.enhanced && data.image_url) ? data.image_url : imagePublicUrl;
  } catch { return imagePublicUrl; }
}

/**
 * Derive a deterministic heading (0-359) from floor/unit data so that
 * same-building listings get slightly different camera angles.
 * Used as fallback when metadata API doesn't return camera location.
 */
function deriveHeadingFallback(floor?: number | null, unitNumber?: string | null): number {
  let heading = 0;
  if (floor != null && floor > 0) {
    heading = (floor * 45) % 360;
  }
  if (unitNumber) {
    const digits = unitNumber.replace(/\D/g, '');
    if (digits.length > 0) {
      const num = parseInt(digits.slice(-3), 10) || 0;
      heading = (heading + (num * 37) % 360) % 360;
    }
  }
  return heading;
}

/**
 * Calculate bearing from camera position to property coordinates.
 * Returns degrees 0-360 (north = 0, east = 90).
 */
function calculateBearing(
  camLat: number, camLng: number,
  propLat: number, propLng: number,
): number {
  const toRad = (d: number) => d * Math.PI / 180;
  const toDeg = (r: number) => r * 180 / Math.PI;
  const dLng = toRad(propLng - camLng);
  const lat1 = toRad(camLat);
  const lat2 = toRad(propLat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Check Street View metadata and return camera info, or null if no coverage.
 */
async function getStreetViewMetadata(
  lat: number, lng: number, apiKey: string,
): Promise<{ status: string; camLat?: number; camLng?: number } | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${apiKey}`;
    const res = await fetchWithTimeout(url, {}, 8_000);
    if (!res.ok) { await res.text(); return null; }
    const data = await res.json();
    return {
      status: data.status,
      camLat: data.location?.lat,
      camLng: data.location?.lng,
    };
  } catch {
    return null;
  }
}

async function generateAndStoreStreetView(
  sb: any,
  propertyId: string,
  latitude: number | null,
  longitude: number | null,
  address?: string | null,
  city?: string | null,
  floor?: number | null,
  unitNumber?: string | null,
  skipEnhance?: boolean,
): Promise<{ updated: boolean; type?: string }> {
  try {
    // GUARD: require real coordinates — city-only lookups produce "no imagery" placeholders
    if (!propertyId || latitude == null || longitude == null) {
      return { updated: false };
    }

    // Use unrestricted key for server-side image fetches (GOOGLE_MAPS_API_KEY has HTTP referrer restrictions)
    const GOOGLE_MAPS_KEY = Deno.env.get("GOOGLE_GEOCODING_API_KEY") || Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_KEY) return { updated: false };

    const location = `${latitude},${longitude}`;

    // ── Step 1: Check Street View coverage via Metadata API ──
    let heading = deriveHeadingFallback(floor, unitNumber);
    let imageType: "street_view" | "satellite" = "street_view";
    let sourceUrl: string;

    const meta = await getStreetViewMetadata(latitude, longitude, GOOGLE_MAPS_KEY);

    if (meta?.status === "OK" && meta.camLat != null && meta.camLng != null) {
      // Calculate bearing from camera to property for smart heading
      heading = Math.round(calculateBearing(meta.camLat, meta.camLng, latitude, longitude));
      dlog(`Smart heading for ${propertyId}: ${heading}° (camera @ ${meta.camLat.toFixed(5)},${meta.camLng.toFixed(5)})`);
    } else if (meta?.status === "ZERO_RESULTS") {
      // No street view coverage — use satellite fallback
      imageType = "satellite";
      dlog(`No street view coverage for ${propertyId}, using satellite fallback`);
    }
    // If metadata call failed entirely, proceed with street view + fallback heading

    if (imageType === "satellite") {
      // Satellite aerial fallback
      sourceUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${location}&zoom=19&size=1200x600&maptype=satellite&key=${GOOGLE_MAPS_KEY}`;
    } else {
      // Street view with improved params: 1200x600, fov=70, pitch=5
      sourceUrl = `https://maps.googleapis.com/maps/api/streetview?size=1200x600&location=${location}&fov=70&heading=${heading}&pitch=5&key=${GOOGLE_MAPS_KEY}`;
    }

    // ── Step 1b: Fetch the image and upload to storage (never store raw Google URLs) ──
    const imgRes = await fetchWithTimeout(sourceUrl, {}, 10_000);
    if (!imgRes.ok) {
      console.warn(`Failed to fetch street view image for ${propertyId}: ${imgRes.status}`);
      return { updated: false };
    }
    const imgBuffer = await imgRes.arrayBuffer();
    const storagePath = `street-view/${propertyId}.png`;
    const { error: uploadErr } = await sb.storage
      .from("property-images")
      .upload(storagePath, imgBuffer, { contentType: "image/png", upsert: true });
    if (uploadErr) {
      console.warn(`Failed to upload street view for ${propertyId}:`, uploadErr.message);
      return { updated: false };
    }
    const { data: publicUrlData } = sb.storage.from("property-images").getPublicUrl(storagePath);
    const storedUrl = publicUrlData?.publicUrl;
    if (!storedUrl) return { updated: false };

    await sb.from("properties").update({
      street_view_url: storedUrl,
      street_view_type: imageType,
    }).eq("id", propertyId);

    // ── Step 2: AI enhancement ──
    if (!skipEnhance) try {
      const ENHANCE_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/enhance-image`;
      const enhancePath = `street-view/${propertyId}.png`;
      const enhanceRes = await fetchWithTimeout(ENHANCE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: storedUrl,
          bucket: "property-images",
          path: enhancePath,
          style: imageType === "street_view" ? "architectural" : "photo_correct",
        }),
      }, 20_000);

      if (enhanceRes.ok) {
        const enhanceData = await enhanceRes.json();
        if (enhanceData.enhanced && enhanceData.image_url) {
          await sb.from("properties").update({ street_view_url: enhanceData.image_url }).eq("id", propertyId);
          dlog(`Street view enhanced (${imageType}) for ${propertyId}`);
        }
      }
    } catch (enhanceErr) {
      console.warn(`Street view enhancement skipped for ${propertyId}:`, enhanceErr);
    }

    return { updated: true, type: imageType };
  } catch (svErr) {
    console.warn(`Street view generation failed for ${propertyId}:`, svErr);
    return { updated: false };
  }
}

async function handleBackfillStreetView(body: any) {
  const sb = supabaseAdmin();
  const { property_id, limit, skip_enhance, force_refresh } = body || {};
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const shouldSkipEnhance = skip_enhance === true;

  let query: any = sb
    .from("properties")
    .select("id, latitude, longitude, address, city, street_view_url, import_source, floor")
    .not("import_source", "is", null)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (property_id) {
    query = query.eq("id", property_id);
  } else if (force_refresh) {
    // Re-generate any non-stored images (raw Google URLs) or missing ones
    query = query.or("street_view_url.is.null,street_view_url.like.%googleapis.com%");
  } else {
    query = query.is("street_view_url", null);
  }

  const { data: properties, error } = await query;
  if (error) throw new Error(`Failed to load properties for street view backfill: ${error.message}`);

  let updated = 0;
  let skipped = 0;
  let satellites = 0;
  for (const property of properties || []) {
    const result = await generateAndStoreStreetView(
      sb,
      property.id,
      property.latitude,
      property.longitude,
      property.address,
      property.city,
      property.floor,
      null,
      shouldSkipEnhance,
    );
    if (result.updated) {
      updated++;
      if (result.type === "satellite") satellites++;
    } else {
      skipped++;
    }
  }

  return {
    processed: (properties || []).length,
    updated,
    skipped,
    satellites,
    force_refresh: !!force_refresh,
  };
}

// Geocoding rate-limit state
let _lastGeoTime = 0;
let _geoQueue: Promise<any> = Promise.resolve();

// Track image URLs across a batch to detect repeated placeholder images
const _batchImageUrlCounts = new Map<string, number>();

function isPlaceholderImage(url: string): boolean {
  // Count how many times this URL has been seen across the batch
  const count = (_batchImageUrlCounts.get(url) || 0) + 1;
  _batchImageUrlCounts.set(url, count);
  // If same URL used in 3+ listings, it's likely a default/placeholder
  if (count >= 3) return true;
  // Skip tiny images (common placeholder patterns)
  const lcUrl = url.toLowerCase();
  if (lcUrl.includes("placeholder") || lcUrl.includes("no-image") || lcUrl.includes("default")) return true;
  return false;
}

async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function optimizeImage(
  sourceUrl: string, bucket: string, basePath: string
): Promise<{ thumb?: string; medium?: string; full?: string } | null> {
  try {
    const res = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/optimize-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ source_url: sourceUrl, bucket, base_path: basePath }),
      }
    );
    if (!res.ok) { await res.text(); return null; }
    const data = await res.json();
    return data.optimized ? data.urls : null;
  } catch (e) {
    console.error("optimizeImage call failed:", e);
    return null;
  }
}

// ─── PHASH COMPUTATION (call compute-image-hash edge function) ──────────────

async function computeImagePhash(imageUrl: string, propertyId: string | null, sb: any): Promise<{ sha256: string; phash: string; similar: any[] } | null> {
  try {
    const res = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/compute-image-hash`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image_url: imageUrl, property_id: propertyId, store: !!propertyId }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success) return null;
    return { sha256: data.sha256, phash: data.phash, similar: data.similar || [] };
  } catch (e) {
    console.error("computeImagePhash failed:", e);
    return null;
  }
}

async function registerImageHashes(propertyId: string, imageUrls: string[], sb: any): Promise<string[]> {
  // DISABLED: compute-image-hash crashes with magick.wasm URL error in edge runtime.
  // Skip pHash registration until the WASM issue is resolved.
  return [];
}

async function parallelImageDownload(
  sourceImages: string[], sb: any, bucketName: string, jobId: string, maxImages: number | null = null
): Promise<{ urls: string[]; hashes: string[] }> {
  const imageUrls: string[] = [];
  const imageHashes: string[] = [];
  const seenHashes = new Set<string>();
  const seenCanonicalUrls = new Set<string>();
  // Filter out placeholder images first
  const validImages = sourceImages.filter(url => {
    if (!url || isPlaceholderImage(url)) return false;
    const canonical = canonicalImageKey(url);
    if (seenCanonicalUrls.has(canonical)) return false;
    seenCanonicalUrls.add(canonical);
    return true;
  });
  const BATCH_SIZE = 5;

  for (let i = 0; i < validImages.length; i += BATCH_SIZE) {
    if (maxImages != null && imageUrls.length >= maxImages) break;
    const batch = validImages.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (imgUrl, batchIdx) => {
        const globalIdx = i + batchIdx;
        const imgRes = await fetch(imgUrl);
        if (!imgRes.ok) return null;

        // Skip tiny images (< 5KB — likely placeholders)
        const contentLength = imgRes.headers.get("content-length");
        if (contentLength && parseInt(contentLength) < 5000) {
          dlog(`Skipping tiny image (${contentLength} bytes): ${imgUrl.slice(0, 80)}`);
          return null;
        }

        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        if (!contentType.toLowerCase().startsWith("image/")) return null;
        const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
        const imgBuffer = await imgRes.arrayBuffer();

        // Double-check size after download
        if (imgBuffer.byteLength < 5000) return null;

        // SHA-256 dedup: skip exact byte-match duplicates
        const hash = await computeSha256(imgBuffer);
        if (seenHashes.has(hash)) {
          dlog(`Skipping duplicate image (SHA-256 match): ${imgUrl.slice(0, 80)}`);
          return null;
        }
        seenHashes.add(hash);

        const imageId = crypto.randomUUID();
        const fileName = `imports/${jobId}/${imageId}.${ext}`;
        const { error: uploadErr } = await sb.storage
          .from(bucketName).upload(fileName, imgBuffer, { contentType, upsert: false });

        if (!uploadErr) {
          const { data: urlData } = sb.storage.from(bucketName).getPublicUrl(fileName);
          const publicUrl = urlData?.publicUrl || null;
          if (!publicUrl) return null;

          // DISABLED: enhanceImage and optimizeImage crash with magick.wasm URL error.
          // Use the uploaded public URL directly until WASM issue is resolved.
          const finalUrl = publicUrl;

          return { url: finalUrl, hash };
        }
        return null;
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        imageUrls.push(r.value.url);
        imageHashes.push(r.value.hash);
      }
    }
  }
  return {
    urls: maxImages == null ? imageUrls : imageUrls.slice(0, maxImages),
    hashes: maxImages == null ? imageHashes : imageHashes.slice(0, maxImages),
  };
}

// ─── PRE-CHECK ──────────────────────────────────────────────────────────────

async function preCheckUrl(url: string): Promise<{ ok: boolean; skipReason: string | null; finalUrl: string | null }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let response = await fetch(url, {
      method: "HEAD", redirect: "follow", signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PropertyImporter/1.0)" },
    });

    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: "GET", redirect: "follow", signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PropertyImporter/1.0)" },
      });
    }
    clearTimeout(timeout);

    const status = response.status;
    const finalUrl = response.url;

    if (status === 404 || status === 410 || status === 451) {
      return { ok: false, skipReason: `HTTP ${status} — page not found`, finalUrl };
    }
    if (status >= 500) {
      return { ok: false, skipReason: `HTTP ${status} — server error`, finalUrl };
    }
    if (finalUrl !== url) {
      try {
        const originalPath = new URL(url).pathname;
        const finalPath = new URL(finalUrl).pathname;
        if (finalPath === "/" && originalPath !== "/") {
          return { ok: false, skipReason: "Redirected to homepage (listing removed)", finalUrl };
        }
      } catch { /* ignore */ }
    }
    return { ok: true, skipReason: null, finalUrl };
  } catch (err: any) {
    if (err.name === "AbortError") return { ok: false, skipReason: "Pre-check timed out (8s)", finalUrl: null };
    return { ok: false, skipReason: `Pre-check network error: ${err.message?.slice(0, 100)}`, finalUrl: null };
  }
}

// ─── HTML IMAGE EXTRACTION ──────────────────────────────────────────────────

function extractImagesFromHtml(html: string, pageUrl: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  const addCandidate = (rawUrl: string | null | undefined) => {
    if (!rawUrl || rawUrl.length < 10) return;
    const firstUrl = rawUrl.split(",")[0]?.trim().split(/\s+/)[0] || rawUrl.trim();
    const lower = firstUrl.toLowerCase();
    if (lower.includes("logo") || lower.includes("icon") || lower.includes("avatar") ||
        lower.includes("agent") || lower.includes("team") || lower.includes("favicon") ||
        lower.includes("pixel") || lower.includes("tracking") || lower.includes("badge") ||
        lower.includes("flag") || lower.includes("social") || lower.includes("map") ||
        lower.includes("googlemap") || lower.includes("maps.googleapis")) return;
    let absolute = firstUrl;
    try {
      if (firstUrl.startsWith("//")) absolute = `https:${firstUrl}`;
      else if (firstUrl.startsWith("/")) absolute = new URL(firstUrl, pageUrl).toString();
      else if (!firstUrl.startsWith("http")) absolute = new URL(firstUrl, pageUrl).toString();
    } catch { return; }
    const canonical = canonicalImageKey(absolute);
    if (!seen.has(canonical)) {
      seen.add(canonical);
      images.push(absolute);
    }
  };

  // Match <img> tags with src attributes
  const imgRegex = /<img\s[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[0];
    const url = match[1];
    // Skip tiny icons, logos, tracking pixels, agent photos
    if (!url || url.length < 10) continue;
    const lower = url.toLowerCase();
    if (lower.includes("logo") || lower.includes("icon") || lower.includes("avatar") ||
        lower.includes("agent") || lower.includes("team") || lower.includes("favicon") ||
        lower.includes("pixel") || lower.includes("tracking") || lower.includes("badge") ||
        lower.includes("flag") || lower.includes("social") || lower.includes("map") ||
        lower.includes("googlemap") || lower.includes("maps.googleapis")) continue;
    // Check for width/height attributes suggesting small images
    const widthMatch = src.match(/width\s*=\s*["']?(\d+)/i);
    if (widthMatch && parseInt(widthMatch[1]) < 80) continue;
    addCandidate(url);
    const srcsetMatch = src.match(/srcset\s*=\s*["']([^"']+)["']/i);
    if (srcsetMatch) addCandidate(srcsetMatch[1]);
  }

  // Also check lazy-loaded and gallery attributes used by WordPress themes
  const lazySrcRegex = /(?:data-(?:src|lazy-src|original|srcset|large_image|full|thumb)|href)\s*=\s*["']([^"']+)["']/gi;
  while ((match = lazySrcRegex.exec(html)) !== null) {
    addCandidate(match[1]);
  }

  return images;
}

function canonicalImageKey(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.startsWith("//") ? `https:${rawUrl}` : rawUrl);
    const path = url.pathname
      .toLowerCase()
      .replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp)$)/i, "")
      .replace(/_\d+x\d+(?=\.(?:jpe?g|png|webp)$)/i, "")
      .replace(/-(?:scaled|cropped)(?=\.(?:jpe?g|png|webp)$)/i, "");
    return `${url.hostname.toLowerCase()}${path}`;
  } catch {
    return rawUrl.split("?")[0].toLowerCase();
  }
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function textFromHtmlFragment(fragment: string): string {
  return decodeHtmlEntities(fragment.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractAgencyHtmlFallback(html: string, markdown: string, url: string): Record<string, any> | null {
  const result: Record<string, any> = { listing_category: "property" };
  const combined = `${decodeURIComponent(url)}\n${markdown}\n${textFromHtmlFragment(html).slice(0, 6000)}`;
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = h1 ? textFromHtmlFragment(h1[1]) : titleTag ? textFromHtmlFragment(titleTag[1]).split("|")[0].trim() : "";
  if (title) result.title = title;
  const mainMatch = html.match(/<(?:main|article|div)[^>]*(?:property|estate|content|entry-content)[^>]*>([\s\S]{200,6000}?)<\/(?:main|article|div)>/i);
  const desc = mainMatch ? textFromHtmlFragment(mainMatch[1]) : markdown.replace(/\s+/g, " ").trim();
  if (desc && desc.length > 40) result.description = desc.slice(0, 2000);
  const priceMatch = combined.match(/(?:₪|ש["״]?ח|nis)\s*([\d,.]{4,})|([\d,.]{4,})\s*(?:₪|ש["״]?ח|nis)/i);
  if (priceMatch) {
    const price = parseFloat(String(priceMatch[1] || priceMatch[2]).replace(/[^\d.]/g, ""));
    if (!Number.isNaN(price) && price > 0) result.price = price;
  }
  const roomMatch = combined.match(/(\d+(?:\.5)?)\s*(?:חדרים|rooms?)/i);
  if (roomMatch) {
    const rooms = parseFloat(roomMatch[1]);
    result.source_rooms = rooms;
    result.bedrooms = Math.max(0, Math.floor(rooms) - 1);
  }
  const sizeMatch = combined.match(/(\d{2,4})\s*(?:מ["״]?ר|sqm|m²|square meters?)/i);
  if (sizeMatch) result.size_sqm = parseFloat(sizeMatch[1]);
  const enriched = extractAgencyVisibleFacts(html, markdown);
  for (const [key, value] of Object.entries(enriched)) {
    if (value != null && (result[key] == null || result[key] === "" || result[key] === 0 || (Array.isArray(result[key]) && result[key].length === 0))) {
      result[key] = value;
    }
  }
  const city = inferCityFromHebrew(combined) || matchSupportedCity(combined.match(/(?:Tel Aviv|Jerusalem|Herzliya|Ramat Gan|Netanya|Haifa)/i)?.[0] || null);
  if (city) result.city = city;
  if (/להשכרה|השכרה|לטווח|\brent\b/i.test(combined)) result.listing_status = "for_rent";
  else result.listing_status = "for_sale";
  if (/פנטהאוז|penthouse/i.test(combined)) result.property_type = "penthouse";
  else if (/דופלקס|duplex/i.test(combined)) result.property_type = "duplex";
  else if (/דירת גן|garden apartment/i.test(combined)) result.property_type = "garden_apartment";
  else if (/בית|וילה|house|villa/i.test(combined)) result.property_type = "house";
  else result.property_type = "apartment";
  const images = extractImagesFromHtml(html, url);
  if (images.length > 0) {
    result.image_urls = images;
    result._photo_count = images.length;
  }
  return Object.keys(result).length >= 4 ? result : null;
}

function firstNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function cleanFactValue(value: string): string {
  return textFromHtmlFragment(value)
    .replace(/\s+/g, " ")
    .replace(/^[\s:：\-–—|]+|[\s:：\-–—|]+$/g, "")
    .trim();
}

function normalizeFeatureKey(raw: string): string | null {
  const t = raw.toLowerCase();
  if (/private\s+pool|בריכה\s+פרטית/.test(t)) return "pool";
  if (/\bpool\b|בריכה/.test(t)) return "pool";
  if (/parking|חנ(?:י|י)ה|חניות/.test(t)) return "parking";
  if (/storage|storeroom|מחסן|מחסנים/.test(t)) return "storage";
  if (/balcony|terrace|מרפסת/.test(t)) return t.includes("sun") || t.includes("שמש") ? "sun_balcony" : "balcony";
  if (/elevator|lift|מעלית/.test(t)) return "elevator";
  if (/safe room|mamad|ממ["״]?ד/.test(t)) return "mamad";
  if (/sea view|ocean view|view to the sea|נוף לים/.test(t)) return "sea_view";
  if (/city view|נוף עיר/.test(t)) return "city_view";
  if (/garden|גינה/.test(t)) return "garden";
  if (/gym|fitness|חדר כושר/.test(t)) return "gym";
  if (/doorman|concierge|שוער/.test(t)) return "doorman";
  if (/security|guard|שמירה|אבטחה/.test(t)) return "security";
  if (/central\s+(?:a\/c|ac|air)|mini[-\s]?central|מיני מרכזי|מיזוג מרכזי/.test(t)) return "central_ac";
  if (/air.?conditioning|\ba\/c\b|\bac\b|מזגן|מיזוג/.test(t)) return "air_conditioning";
  if (/furnished|מרוהט/.test(t)) return "furnished";
  if (/accessible|wheelchair|נגיש/.test(t)) return "accessible";
  if (/renovated kitchen/.test(t)) return "renovated_kitchen";
  if (/renovated bathroom/.test(t)) return "renovated_bathrooms";
  if (/smart home/.test(t)) return "smart_home";
  if (/underfloor heating|floor heating/.test(t)) return "underfloor_heating";
  if (/jacuzzi|ג'קוזי/.test(t)) return "jacuzzi";
  if (/sauna/.test(t)) return "sauna";
  if (/wine cellar/.test(t)) return "wine_cellar";
  if (/private entrance|כניסה פרטית/.test(t)) return "private_entrance";
  if (/quiet street|רחוב שקט/.test(t)) return "quiet_street";
  return null;
}

function addFeature(features: Set<string>, raw: string | null | undefined) {
  if (!raw) return;
  const key = normalizeFeatureKey(raw);
  if (key) features.add(key);
}

function extractAgencyVisibleFacts(html: string, markdown: string): Record<string, any> {
  const result: Record<string, any> = {};
  const features = new Set<string>();
  const plain = cleanFactValue(`${markdown}\n${textFromHtmlFragment(html).slice(0, 12000)}`);
  const rows: Array<[string, string]> = [];

  const rowPattern = /<(?:li|tr|p|div|span)[^>]*>([\s\S]{0,500}?)<\/(?:li|tr|p|div|span)>/gi;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowPattern.exec(html)) && rows.length < 500) {
    const txt = cleanFactValue(rowMatch[1]);
    if (txt.length < 3 || txt.length > 220) continue;
    const kv = txt.match(/^([^:：|\-–—]{2,45})\s*[:：|\-–—]\s*(.{1,160})$/);
    if (kv) rows.push([cleanFactValue(kv[1]), cleanFactValue(kv[2])]);
    else rows.push([txt, txt]);
  }

  for (const line of plain.split(/\n|(?<=\d)\s{2,}|\s\|\s/).slice(0, 800)) {
    const txt = cleanFactValue(line);
    const kv = txt.match(/^([^:：|\-–—]{2,45})\s*[:：|\-–—]\s*(.{1,160})$/);
    if (kv) rows.push([cleanFactValue(kv[1]), cleanFactValue(kv[2])]);
  }

  const setNumber = (field: string, value: string, transform: (n: number) => number = n => n) => {
    const n = firstNumber(value);
    if (n != null && result[field] == null) result[field] = transform(n);
  };

  for (const [labelRaw, valueRaw] of rows) {
    const label = labelRaw.toLowerCase();
    const value = valueRaw || labelRaw;
    const joined = `${labelRaw} ${valueRaw}`;

    if (/^(address|street|location|כתובת)$/i.test(labelRaw) && !result.address && valueRaw && !/tel aviv|jerusalem|israel/i.test(valueRaw)) result.address = valueRaw;
    if (/neighbou?rhood|area|שכונה|אזור/i.test(labelRaw) && !result.neighborhood && valueRaw && valueRaw.length < 60) result.neighborhood = valueRaw;
    if (/\brooms?\b|חדרים/i.test(label)) setNumber("source_rooms", value, n => n);
    if (/bedrooms?|חדרי שינה/i.test(label)) setNumber("bedrooms", value, n => Math.floor(n));
    if (/bathrooms?|baths?|חדרי רחצה|מקלחות|שירותים/i.test(label)) setNumber("bathrooms", value, n => Math.floor(n));
    if (/parking|חנ(?:י|י)ות?/i.test(joined)) { setNumber("parking", value, n => Math.floor(n)); addFeature(features, "parking"); }
    if (/storage|storerooms?|מחסנים?/i.test(joined)) { setNumber("storage_count", value, n => Math.floor(n)); addFeature(features, "storage"); }
    if (/^(floor|קומה)$/i.test(labelRaw)) setNumber("floor", value, n => Math.floor(n));
    if (/total floors|floors in building|building floors|קומות בבניין|סה["״]?כ קומות/i.test(joined)) setNumber("total_floors", value, n => Math.floor(n));
    if (/year built|construction year|year of construction|built in|שנת בנייה|שנת בניה/i.test(joined)) setNumber("year_built", value, n => Math.floor(n));
    if (/size|built area|property size|sqm|m²|מ["״]?ר/i.test(joined)) setNumber("size_sqm", value, n => n);
    if (/vaad|maintenance|house committee|ועד בית/i.test(joined)) setNumber("vaad_bayit_monthly", value, n => Math.floor(n));
    if (/central\s+(?:a\/c|ac|air)|mini[-\s]?central|מיני מרכזי|מיזוג מרכזי/i.test(joined)) result.ac_type = "central";
    else if (/air.?conditioning|\ba\/c\b|\bac\b|מזגן|מיזוג/i.test(joined)) result.ac_type = result.ac_type || "split";
    if (/furnished|מרוהט/i.test(joined)) result.is_furnished = true;
    if (/accessible|wheelchair|נגיש/i.test(joined)) result.is_accessible = true;
    addFeature(features, joined);
  }

  const proseRules: Array<[RegExp, string]> = [
    [/private\s+pool|בריכה\s+פרטית/i, "pool"],
    [/single\s+(?:apartment|unit)\s+on\s+(?:the\s+)?floor|only\s+(?:apartment|unit)\s+on\s+(?:the\s+)?floor|דירה\s+יחידה\s+בקומה/i, "private_entrance"],
    [/sea\s+view|view\s+to\s+the\s+sea|נוף\s+לים/i, "sea_view"],
    [/quiet\s+street|רחוב\s+שקט/i, "quiet_street"],
  ];
  for (const [re, feature] of proseRules) if (re.test(plain)) features.add(feature);

  const parkingProse = plain.match(/(\d+)\s+(?:private\s+)?parking\s+(?:spaces?|spots?)|(\d+)\s+חנ(?:י|י)ות/i);
  if (parkingProse && result.parking == null) result.parking = Number(parkingProse[1] || parkingProse[2]);
  if (result.parking && result.parking > 0) features.add("parking");
  const storageProse = plain.match(/(\d+)\s+(?:storage\s+rooms?|storerooms?)|(\d+)\s+מחסנים/i);
  if (storageProse) { result.storage_count = Number(storageProse[1] || storageProse[2]); features.add("storage"); }
  if (result.source_rooms != null && result.bedrooms == null) result.bedrooms = Math.max(0, Math.floor(result.source_rooms) - 1);
  if (features.size > 0) result.features = Array.from(features);
  if (!result.featured_highlight) {
    if (features.has("pool")) result.featured_highlight = "Private Pool";
    else if (features.has("sea_view")) result.featured_highlight = "Sea View";
    else if (features.has("parking") && result.parking >= 2) result.featured_highlight = `${result.parking} Parking Spaces`;
  }
  return result;
}

function enrichListingFromVisibleFacts(listing: Record<string, any>, html: string, markdown: string): Record<string, any> {
  const facts = extractAgencyVisibleFacts(html, markdown);
  const merged = { ...listing };
  const appliedFields = new Set<string>(Array.isArray(merged._visible_fact_fields) ? merged._visible_fact_fields : []);
  for (const [key, value] of Object.entries(facts)) {
    if (value == null) continue;
    if (key === "features") {
      merged.features = Array.from(new Set([...(Array.isArray(merged.features) ? merged.features : []), ...(value as string[])]));
      appliedFields.add("features");
    } else if (merged[key] == null || merged[key] === "" || merged[key] === 0 || (Array.isArray(merged[key]) && merged[key].length === 0)) {
      merged[key] = value;
      appliedFields.add(key);
    }
  }
  if (merged.storage_count && !merged.additional_rooms) { merged.additional_rooms = Number(merged.storage_count); appliedFields.add("additional_rooms"); }
  if (Array.isArray(merged.features)) merged.features = Array.from(new Set(merged.features.map((f: string) => normalizeFeatureKey(f) || f).filter(Boolean)));
  if (appliedFields.size > 0) merged._visible_fact_fields = Array.from(appliedFields);
  return merged;
}

async function collectAgencyOwnedImages(listing: any, structuredData: any, pageHtml: string, itemUrl: string, sb: any, jobId: string): Promise<string[]> {
  const candidateImages: string[] = [];
  if (listing.image_urls && Array.isArray(listing.image_urls)) candidateImages.push(...flattenImageCandidates(listing.image_urls));
  if (structuredData?.structured_images?.length) candidateImages.push(...structuredData.structured_images);
  if (candidateImages.length < 3 && pageHtml) candidateImages.push(...extractImagesFromHtml(pageHtml, itemUrl));
  const uniqueImages = [...new Set(candidateImages.map(img => {
    if (!img || typeof img !== "string") return "";
    const first = img.split(",")[0]?.trim().split(/\s+/)[0] || img;
    if (first.startsWith("//")) return `https:${first}`;
    if (first.startsWith("/")) {
      try { return new URL(first, itemUrl).toString(); } catch { return ""; }
    }
    return first;
  }).filter(u => u && u.startsWith("http")))];
  if (uniqueImages.length === 0) return [];
  const downloaded = await parallelImageDownload(uniqueImages, sb, "property-images", jobId);
  listing.image_hashes = Array.from(new Set(downloaded.hashes || []));
  return Array.from(new Set(downloaded.urls || []));
}

function flattenImageCandidates(input: any, depth = 0): string[] {
  if (depth > 4 || input == null) return [];
  if (typeof input === "string") return [input];
  if (Array.isArray(input)) return input.flatMap((item) => flattenImageCandidates(item, depth + 1));
  if (typeof input === "object") {
    const directKeys = ["url", "src", "source_url", "large", "full", "original", "thumbnail", "imageUrl", "image_url", "srcset"];
    const direct = directKeys.flatMap((key) => flattenImageCandidates(input[key], depth + 1));
    const nested = [input.images, input.photos, input.media, input.gallery, input.items]
      .flatMap((value) => flattenImageCandidates(value, depth + 1));
    return [...direct, ...nested];
  }
  return [];
}

async function collectAllowedSourceImages(
  sourceType: string | null | undefined,
  listing: any,
  structuredData: any,
  pageHtml: string,
  itemUrl: string,
  sb: any,
  jobId: string,
  maxImages: number | null = null,
): Promise<string[]> {
  const normalized = String(sourceType || "website").toLowerCase();
  if (listing.image_urls && !Array.isArray(listing.image_urls)) listing.image_urls = [listing.image_urls];
  if (Array.isArray(listing.image_urls)) {
    listing.image_urls = flattenImageCandidates(listing.image_urls);
  }
  if (normalized.includes("yad2")) return [];
  if (isAgencyOwnWebsiteSource(sourceType)) {
    const urls = await collectAgencyOwnedImages(listing, structuredData, pageHtml, itemUrl, sb, jobId);
    if (urls.length > 0) listing._image_source_policy = "agency_website_preferred";
    return urls;
  }
  if (normalized.includes("madlan")) {
    const urls = await collectAgencyOwnedImages(listing, structuredData, pageHtml, itemUrl, sb, jobId);
    if (urls.length > 0) listing._image_source_policy = "madlan_fallback";
    return maxImages == null ? urls : urls.slice(0, maxImages);
  }
  return [];
}

function sanitizeEntryDate(raw: any): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "immediate" || trimmed === "מיידי" || trimmed === "מיידית") {
    return new Date().toISOString().split("T")[0];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return null;
}

// ─── STRUCTURED DATA EXTRACTION (JSON-LD, Open Graph) ───────────────────────

function extractStructuredData(html: string): Record<string, any> | null {
  if (!html || html.length < 100) return null;

  const result: Record<string, any> = {};
  let found = false;

  // 1. JSON-LD extraction
  const jsonLdRegex = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonData = JSON.parse(match[1].trim());
      const items = Array.isArray(jsonData) ? jsonData : [jsonData];
      for (const item of items) {
        const type = (item["@type"] || "").toLowerCase();
        if (type.includes("realestate") || type.includes("product") || type.includes("offer") || type.includes("apartment") || type.includes("house") || type.includes("residence")) {
          if (item.name) { result.title = item.name; found = true; }
          if (item.description) { result.description = item.description; found = true; }
          if (item.floorSize?.value) { result.size_sqm = parseFloat(item.floorSize.value); found = true; }
          if (item.numberOfRooms) { result.bedrooms = parseInt(item.numberOfRooms) - 1; found = true; }
          if (item.numberOfBathroomsTotal) { result.bathrooms = parseInt(item.numberOfBathroomsTotal); found = true; }
          const price = item.offers?.price || item.price;
          if (price) { result.price = parseFloat(String(price).replace(/[^\d.]/g, "")); found = true; }
          const currency = item.offers?.priceCurrency || item.priceCurrency;
          if (currency) { result.currency = currency === "ILS" || currency === "₪" ? "ILS" : currency; }
          if (item.address) {
            if (typeof item.address === "string") { result.address = item.address; found = true; }
            else if (item.address.streetAddress) { result.address = item.address.streetAddress; found = true; }
            if (item.address?.addressLocality) { result.city_hint = item.address.addressLocality; }
          }
          if (item.image) {
            const images = Array.isArray(item.image) ? item.image : [item.image];
            result.structured_images = images.filter((img: any) => typeof img === "string");
            found = true;
          }
          if (item.geo?.latitude) { result.latitude = parseFloat(item.geo.latitude); }
          if (item.geo?.longitude) { result.longitude = parseFloat(item.geo.longitude); }
        }
      }
    } catch { /* ignore invalid JSON-LD */ }
  }

  // 2. Open Graph tags
  const ogTitle = html.match(/<meta\s+(?:property|name)\s*=\s*["']og:title["']\s+content\s*=\s*["']([^"']+)["']/i);
  const ogDesc = html.match(/<meta\s+(?:property|name)\s*=\s*["']og:description["']\s+content\s*=\s*["']([^"']+)["']/i);
  const ogImage = html.match(/<meta\s+(?:property|name)\s*=\s*["']og:image["']\s+content\s*=\s*["']([^"']+)["']/i);

  if (ogTitle && !result.title) { result.og_title = ogTitle[1]; found = true; }
  if (ogDesc && !result.description) { result.og_description = ogDesc[1]; found = true; }
  if (ogImage) {
    if (!result.structured_images) result.structured_images = [];
    result.structured_images.push(ogImage[1]);
    found = true;
  }

  return found ? result : null;
}

// ─── EXTRACTION PROMPT (with comprehensive Hebrew dictionary) ───────────────

function inferYad2RegionHint(url: string): string {
  const YAD2_REGION_CITIES: Record<string, string[]> = {
    "center-and-sharon": ["Petah Tikva", "Ra'anana", "Hod HaSharon", "Herzliya", "Netanya", "Kfar Saba", "Givat Shmuel", "Ramat Gan", "Rehovot", "Rishon LeZion"],
    "jerusalem-and-periphery": ["Jerusalem", "Beit Shemesh", "Ma'ale Adumim", "Mevaseret Zion", "Efrat", "Gush Etzion"],
    "south": ["Beer Sheva", "Ashdod", "Ashkelon", "Eilat"],
    "north": ["Hadera", "Pardes Hanna", "Zichron Yaakov", "Caesarea"],
    "haifa-and-krayot": ["Haifa"],
    "sharon": ["Netanya", "Ra'anana", "Kfar Saba", "Hod HaSharon", "Herzliya"],
    "shfela": ["Modi'in", "Rehovot", "Rishon LeZion"],
    "dan": ["Tel Aviv", "Ramat Gan", "Givat Shmuel", "Petah Tikva"],
  };
  try {
    const path = new URL(url).pathname;
    for (const [region, cities] of Object.entries(YAD2_REGION_CITIES)) {
      if (path.includes(region)) {
        return `This is a Yad2 listing from the "${region}" region. Likely cities: ${cities.join(", ")}.`;
      }
    }
  } catch {}
  return "";
}

// Build a Hebrew city name → English mapping for post-extraction fallback
function inferCityFromHebrew(text: string): string | null {
  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    for (const alias of aliases) {
      // Only check Hebrew aliases (contain Hebrew chars)
      if (/[\u0590-\u05FF]/.test(alias) && text.includes(alias)) {
        return canonical;
      }
    }
  }
  return null;
}

function buildExtractionPrompt(url: string, domain: string, markdown: string, pageLinks: string[], includeImages = true): string {
  const yad2Hint = url.includes("yad2.co.il") ? `\n${inferYad2RegionHint(url)}` : "";
  const imageInstruction = includeImages
    ? "- Extract ALL image URLs you can find"
    : "- Do NOT extract, return, store, download, or reference image/photo URLs from this source";
  return `You are extracting structured data from a scraped Israeli real estate page.

IMPORTANT CONTEXT:
- Website domain: ${domain}${yad2Hint}
- Supported cities (return city as one of these EXACT names): ${SUPPORTED_CITIES.join(", ")}
- If the city is not explicitly stated on the page, INFER it from:
  1. The website domain name (e.g., "jerusalem-real-estate.co" → Jerusalem)
  2. The URL path
  3. Neighborhood context (e.g., Arnona, Baka, Talbieh → Jerusalem; Neve Tzedek → Tel Aviv)
  4. Hebrew city names in the content (e.g., תל אביב → Tel Aviv, ירושלים → Jerusalem, פתח תקווה → Petah Tikva)
- If no price is listed (e.g., "Price on Request"), set price to 0.
- Return city as one of the supported cities listed above.

═══ HEBREW REAL ESTATE DICTIONARY ═══

PROPERTY TYPES (Hebrew → BuyWise key):
דירה = apartment | דירת גן = garden_apartment | בית פרטי / וילה = house | קוטג' = cottage
פנטהאוז = penthouse | מיני פנטהאוז = mini_penthouse | דירת גג = penthouse
דופלקס = duplex | טריפלקס = duplex | לופט = apartment | דירת סטודיו = apartment
יחידת דיור = apartment | בית דו-משפחתי = house | דירת מרתף = apartment
מגרש = land | מחסן = storage | חניה = parking | בניין = building | בניין שלם = building
חקלאי = agricultural_estate | משק חקלאי = agricultural_estate | נחלה = agricultural_estate
דיור מוגן = assisted_living

AMENITIES (Hebrew → English feature name):
ממ"ד = mamad/safe_room | מזגן/מזג אוויר = air_conditioning | חניה = parking
מעלית = elevator | מחסן = storage | מרפסת = balcony | מרפסת שמש = sun_balcony
סוכה = sukkah_balcony | מרוהט = furnished | סורגים = window_bars
דלתות פנדור = security_doors | נגיש לנכים = accessible | גינה = garden
דוד שמש = solar_heater | בלעדי = exclusive | תריסים = shutters
ממ"ק = floor_safe_room | בויידם = storage_above_door

CONDITION (Hebrew → BuyWise value):
חדש מקבלן / חדש = new | משופץ = renovated | במצב טוב / שמור = good
דורש שיפוץ = needs_renovation | ישן = needs_renovation

FLOOR ORDINALS (Hebrew → number):
קרקע = 0 | ראשונה = 1 | שנייה = 2 | שלישית = 3 | רביעית = 4
חמישית = 5 | שישית = 6 | שביעית = 7 | שמינית = 8 | תשיעית = 9
עשירית = 10 | מרתף = -1

RENTAL TERMS (Hebrew → BuyWise field):
שכירות / להשכרה = listing_status: for_rent
תקופת שכירות = lease_term | חוזה ל-12 חודשים = 12_months | חוזה ל-6 חודשים = 6_months | חוזה ל-24 חודשים = 24_months | גמיש = flexible
לטווח קצר / השכרה לטווח קצר / לילה / לילות / יומי / שבועי / נופש / חופשה = short_term_rental: true — unsupported, skip
מרוהט לגמרי / מרוהט = fully | מרוהט חלקית = semi | לא מרוהט / ללא ריהוט = unfurnished
חיות מחמד / בע״ח = pets_policy | מותר חיות = allowed | לפי שיקול דעת = case_by_case | אין חיות = not_allowed
סאבלט / השכרת משנה = subletting_allowed | מותר = allowed | אסור = not_allowed
דמי תיווך = agent_fee_required (boolean)
ערבות בנקאית = bank_guarantee_required (boolean)
צ'קים / שיקים = checks_required (boolean)

═══ EXTRACTION RULES ═══

FIRST, determine the CATEGORY of this page:
- "property": A single unit for sale or rent (resale, rental listing)
- "project": A new construction project / development — SKIP
- "not_listing": Not a property listing page

FOR PROPERTIES — extract these fields:
- title: Generate a professional English listing title (20-60 characters, Title Case).
  Format: "[Bedrooms]-Bedroom [Type] in [Neighborhood]" or "Spacious [Size]sqm [Type] in [City]"
  Examples: "Spacious 4-Bedroom Apartment in Arnona", "Renovated Penthouse in Neve Tzedek", "3-Bedroom Garden Apartment in Rehavia"
  If the page already has a good English title (not just an address, street name, or Hebrew text), keep it with Title Case.
  Do NOT just use the street address as the title. Do NOT return a Hebrew title.
- description: Translate the property description into fluent, professional English for international buyers.
  Keep all factual details (rooms, features, location highlights, renovation info, floor, views, parking, storage).
  Rephrase marketing fluff into clear, compelling English. Make it informative and appealing.
  If the description is already in good English, keep it as-is.
  Do NOT include the agent's name, phone number, or any Hebrew text in the description.
  Aim for 150-400 words. Write in paragraph form, not bullet points.
- In Israel, "rooms" (חדרים) = bedrooms + 1 living room. So 4 rooms = 3 bedrooms. Always subtract 1 for bedrooms.
- Default currency is ILS (₪) unless explicitly stated otherwise.
- Use the dictionary above for property types, not your own guess.
- listing_status: for_sale if buying/מכירה, for_rent if renting/השכרה
- short_term_rental: true if the listing is nightly, weekly, vacation/holiday/Airbnb, or Hebrew לטווח קצר/לילה/יומי/שבועי/נופש/חופשה. These are unsupported even if they are rentals.
- Detect if sold (נמכר), rented (הושכר), under contract (בהסכם). Set is_sold_or_rented=true if so.
- Price might appear as "₪1,500,000" or "1,500,000 ש״ח" or "$450,000"
- For rentals, price is monthly rent (e.g., "₪5,500/חודש" or "5,500 ש״ח לחודש")
- For long-term rentals only: accept monthly/yearly/6+ month leases. Do NOT treat nightly/weekly/vacation rentals as normal rentals.
${imageInstruction}
- For floor: use the Hebrew ordinal map above
- For rental listings: extract lease_term, furnished_status, pets_policy, subletting_allowed, agent_fee_required, bank_guarantee_required, checks_required if mentioned

ADDITIONAL FIELDS — extract whenever present on ANY agency site:
- original_price: If a price drop or previous price is shown, extract the original/higher price
- lot_size_sqm: Total land/plot area for houses, cottages, land (different from built sqm)
- ac_type: "split" (wall units), "central" (מיזוג מרכזי), "mini_central" (מיני מרכזי), or "none"
- vaad_bayit_monthly: Building maintenance fee (ועד בית) in NIS
- is_furnished: true if property comes with furniture
- is_accessible: true if wheelchair accessible / נגיש
- additional_rooms: Count extra half-rooms (storage room, laundry, service balcony, walk-in closet, office/study)
- featured_highlight: THE single most impressive selling point in 3-6 words (e.g. "Panoramic Sea View", "Private Rooftop Terrace", "Fully Renovated with Garden", "Quiet Dead-End Street")
- features: Use STANDARDIZED keys: elevator, balcony, sun_balcony, sukkah_balcony, mamad, parking, storage, garden, pool, gym, doorman, security, air_conditioning, central_ac, solar_heater, furnished, accessible, shutters, window_bars, security_doors, roof_access, sea_view, city_view, quiet_street, renovated_kitchen, renovated_bathrooms, smart_home, underfloor_heating, jacuzzi, sauna, wine_cellar, private_entrance.
  IMPORTANT: Parse the free-text description for features not in structured data tables. Many agencies list features only in prose.

Page URL: ${url}
Page content:
${markdown.substring(0, 8000)}

Links found on page:
${pageLinks.slice(0, 50).join("\n")}`;
}

// ─── CMS ADAPTERS (WordPress + Wix) ─────────────────────────────────────────

function detectCmsType(html: string, _url: string): "wordpress" | "wix" | "generic" {
  if (!html || html.length < 100) return "generic";

  // WordPress indicators
  if (
    html.includes("wp-content") ||
    html.includes("wp-json") ||
    /<meta\s+name\s*=\s*["']generator["']\s+content\s*=\s*["'][^"']*WordPress/i.test(html)
  ) {
    return "wordpress";
  }

  // Wix indicators
  if (
    html.includes("window.__INITIAL_STATE__") ||
    html.includes("wix-warmup-data") ||
    html.includes("_wixCssModules") ||
    html.includes("X-Wix-Published-Version") ||
    html.includes("static.wixstatic.com")
  ) {
    return "wix";
  }

  return "generic";
}

async function extractFromWordPress(url: string, _firecrawlKey: string): Promise<Record<string, any> | null> {
  try {
    const origin = new URL(url).origin;
    const urlPath = new URL(url).pathname;
    const slug = urlPath.split("/").filter(Boolean).pop();

    const endpoints = [
      `${origin}/wp-json/wp/v2/property?per_page=1&_embed`,
      `${origin}/wp-json/wp/v2/listing?per_page=1&_embed`,
      `${origin}/wp-json/wp/v2/properties?per_page=1&_embed`,
      `${origin}/wp-json/wp/v2/listings?per_page=1&_embed`,
      `${origin}/wp-json/wp/v2/real-estate?per_page=1&_embed`,
    ];

    for (const endpoint of endpoints) {
      try {
        const slugEndpoint = slug ? `${endpoint}&slug=${encodeURIComponent(slug)}` : endpoint;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(slugEndpoint, {
          headers: { "Accept": "application/json" },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) continue;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) continue;

        const post = data[0];
        const result: Record<string, any> = {};
        let fieldCount = 0;

        if (post.title?.rendered) {
          result.title = post.title.rendered.replace(/<[^>]+>/g, "").trim();
          fieldCount++;
        }
        if (post.content?.rendered) {
          result.description = post.content.rendered.replace(/<[^>]+>/g, "").trim().slice(0, 2000);
          fieldCount++;
        } else if (post.excerpt?.rendered) {
          result.description = post.excerpt.rendered.replace(/<[^>]+>/g, "").trim();
          fieldCount++;
        }

        const meta = post.acf || post.meta || post.custom_fields || {};

        const priceField = meta.price || meta.property_price || meta._price || meta.listing_price;
        if (priceField) {
          const priceNum = parseFloat(String(priceField).replace(/[^\d.]/g, ""));
          if (!isNaN(priceNum) && priceNum > 0) { result.price = priceNum; fieldCount++; }
        }

        const roomsField = meta.bedrooms || meta.rooms || meta.property_bedrooms || meta._bedrooms;
        if (roomsField) {
          const rooms = parseInt(String(roomsField));
          if (!isNaN(rooms)) { result.bedrooms = rooms; fieldCount++; }
        }

        const sizeField = meta.size || meta.property_size || meta.area || meta.sqm || meta._size;
        if (sizeField) {
          const size = parseFloat(String(sizeField).replace(/[^\d.]/g, ""));
          if (!isNaN(size) && size > 0) { result.size_sqm = size; fieldCount++; }
        }

        const addrField = meta.address || meta.property_address || meta.location || meta._address;
        if (addrField) {
          result.address = typeof addrField === "string" ? addrField : (addrField.address || JSON.stringify(addrField));
          fieldCount++;
        }

        const cityField = meta.city || meta.property_city || meta._city;
        if (cityField) {
          const matched = matchSupportedCity(String(cityField));
          if (matched) { result.city = matched; fieldCount++; }
        }

        const typeField = meta.property_type || meta.type || meta._property_type;
        if (typeField) { result.property_type = String(typeField).toLowerCase(); fieldCount++; }

        const embedded = post._embedded?.["wp:featuredmedia"] || [];
        const images: string[] = [];
        for (const media of embedded) {
          if (media.source_url) images.push(media.source_url);
        }
        const galleryField = meta.gallery || meta.property_gallery || meta.images || meta._gallery;
        if (Array.isArray(galleryField)) {
          for (const img of galleryField) {
            const imgUrl = typeof img === "string" ? img : (img?.url || img?.source_url);
            if (imgUrl) images.push(imgUrl);
          }
        }
        if (images.length > 0) { result._photo_count = images.length; fieldCount++; }

        if (fieldCount >= 3) {
          dlog(`WordPress adapter: extracted ${fieldCount} fields from REST API`);
          return result;
        }
      } catch { /* try next endpoint */ }
    }
    return null;
  } catch (err) {
    console.warn(`WordPress extraction error: ${err}`);
    return null;
  }
}

function extractFromWixState(html: string): Record<string, any> | null {
  try {
    const patterns = [
      /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});\s*(?:<\/script>|window\.)/,
      /window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});\s*(?:<\/script>|window\.)/,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(html);
      if (!match) continue;

      let stateData: any;
      try { stateData = JSON.parse(match[1]); } catch { continue; }

      const result: Record<string, any> = {};
      let fieldCount = 0;

      const findData = (obj: any, depth = 0): any => {
        if (depth > 5 || !obj || typeof obj !== "object") return null;
        if (obj.price && (obj.address || obj.city || obj.rooms || obj.bedrooms)) return obj;
        if (obj.currentItem) return findData(obj.currentItem, depth + 1);
        if (obj.dynamicPageData) return findData(obj.dynamicPageData, depth + 1);
        if (obj.wixCodeProps) return findData(obj.wixCodeProps, depth + 1);
        for (const key of Object.keys(obj)) {
          if (["router", "navigation", "styles", "components", "platform"].includes(key)) continue;
          const child = findData(obj[key], depth + 1);
          if (child) return child;
        }
        return null;
      };

      const propertyData = findData(stateData);
      if (!propertyData) continue;

      if (propertyData.title || propertyData.name) { result.title = propertyData.title || propertyData.name; fieldCount++; }
      if (propertyData.description) { result.description = String(propertyData.description).slice(0, 2000); fieldCount++; }

      const price = propertyData.price || propertyData.listingPrice || propertyData.salePrice;
      if (price) {
        const priceNum = parseFloat(String(price).replace(/[^\d.]/g, ""));
        if (!isNaN(priceNum) && priceNum > 0) { result.price = priceNum; fieldCount++; }
      }

      const rooms = propertyData.rooms || propertyData.bedrooms || propertyData.numberOfRooms;
      if (rooms) {
        const roomsNum = parseInt(String(rooms));
        if (!isNaN(roomsNum)) { result.bedrooms = propertyData.bedrooms ? roomsNum : roomsNum - 1; fieldCount++; }
      }

      const size = propertyData.size || propertyData.area || propertyData.sqm || propertyData.size_sqm;
      if (size) {
        const sizeNum = parseFloat(String(size).replace(/[^\d.]/g, ""));
        if (!isNaN(sizeNum) && sizeNum > 0) { result.size_sqm = sizeNum; fieldCount++; }
      }

      if (propertyData.address) { result.address = String(propertyData.address); fieldCount++; }

      const city = propertyData.city || propertyData.location;
      if (city) {
        const matched = matchSupportedCity(String(city));
        if (matched) { result.city = matched; fieldCount++; }
      }

      if (propertyData.propertyType || propertyData.property_type || propertyData.type) {
        result.property_type = String(propertyData.propertyType || propertyData.property_type || propertyData.type).toLowerCase();
        fieldCount++;
      }

      const images: string[] = [];
      const imgField = propertyData.images || propertyData.photos || propertyData.gallery;
      if (Array.isArray(imgField)) {
        for (const img of imgField) {
          const imgUrl = typeof img === "string" ? img : (img?.src || img?.url || img?.uri);
          if (imgUrl) images.push(imgUrl.startsWith("//") ? `https:${imgUrl}` : imgUrl);
        }
      }
      if (images.length > 0) { result._photo_count = images.length; fieldCount++; }

      if (fieldCount >= 3) {
        dlog(`Wix adapter: extracted ${fieldCount} fields from embedded state`);
        return result;
      }
    }
    return null;
  } catch (err) {
    console.warn(`Wix extraction error: ${err}`);
    return null;
  }
}

// ─── PROCESS SINGLE ITEM ────────────────────────────────────────────────────
// ─── SIMPLIFIED PROMPT RETRY ────────────────────────────────────────────────

async function retryWithSimplifiedPrompt(
  url: string, markdown: string, lovableKey: string
): Promise<any | null> {
  dlog(`Retrying with simplified prompt for ${url}`);
  const truncatedContent = markdown.slice(0, 4000);
  const yad2Hint = url.includes("yad2.co.il") ? `\n${inferYad2RegionHint(url)}\nLook for Hebrew city names like: תל אביב, ירושלים, פתח תקווה, רעננה, הרצליה, רמת גן, גבעת שמואל, כפר סבא, הוד השרון, נתניה, חיפה, באר שבע, אשדוד, אשקלון, מודיעין, חדרה, בית שמש.\n` : "";
  const simplifiedPrompt = `Extract ONLY these fields from this Israeli real estate listing page. Return values only if clearly present, otherwise omit.
${yad2Hint}
- price (number in NIS, 0 if "Price on Request")
- bedrooms (number — Israeli "rooms" minus 1)
- size_sqm (number)
- city (must be one of: ${SUPPORTED_CITIES.join(", ")})
- address (street name + number)
- property_type (one of: apartment, house, penthouse, duplex, garden_apartment, cottage, land)
- listing_status (for_sale or for_rent)
- short_term_rental (boolean; true for nightly/weekly/vacation/Airbnb/לטווח קצר rentals)
- photo_count (number of photos on the page)
- listing_category (property, project, or not_listing)

URL: ${url}
Content:
${truncatedContent}`;

  try {
    const res = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: simplifiedPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "extract_listing",
            description: "Extract core listing data",
            parameters: {
              type: "object",
              properties: {
                listing_category: { type: "string", enum: ["property", "project", "not_listing"] },
                price: { type: "number" },
                bedrooms: { type: "number" },
                size_sqm: { type: "number" },
                address: { type: "string" },
                city: { type: "string" },
                neighborhood: { type: "string" },
                property_type: { type: "string", enum: ["apartment", "garden_apartment", "penthouse", "duplex", "house", "cottage", "land"] },
                listing_status: { type: "string", enum: ["for_sale", "for_rent"] },
                short_term_rental: { type: "boolean" },
                photo_count: { type: "number" },
              },
              required: ["listing_category"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_listing" } },
      }),
    }, 20_000);

    if (!res.ok) {
      console.error(`Simplified retry also failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) return null;

    const parsed = JSON.parse(toolCall.function.arguments);
    parsed._simplified_retry = true;
    dlog(`Simplified retry succeeded for ${url}`);
    return parsed;
  } catch (err) {
    console.error(`Simplified retry error:`, err);
    return null;
  }
}

async function processOneItem(
  item: any, sb: any, job: any, agentId: string | null,
  firecrawlKey: string, lovableKey: string, jobId: string,
  domainCity: string | null = null, importType: string = "resale"
): Promise<{ succeeded: boolean }> {
  try {
    await sb.from("import_job_items").update({ status: "processing" }).eq("id", item.id);

    // 0a-pre. Cross-agency URL blocklist check (normalized comparison)
    // If this agency was previously confirmed NOT to own this URL, skip immediately.
    if (job.agency_id && item.url) {
      const { data: isBlocked } = await sb.rpc("is_url_blocklisted", {
        p_agency_id: job.agency_id,
        p_url: item.url,
      });
      if (isBlocked === true) {
        const { data: blocked } = await sb
          .from("agency_source_blocklist")
          .select("reason")
          .eq("agency_id", job.agency_id)
          .limit(1);
        await sb.from("import_job_items")
          .update({
            status: "skipped",
            error_message: `URL blocked: ${blocked[0].reason || "Resolved as belonging to another agency"}`,
            error_type: "permanent",
          })
          .eq("id", item.id);
        return { succeeded: false };
      }
    }

    // 0a. Source URL dedup
    const normalizedItemUrl = normalizeUrl(item.url);
    const { data: existingByUrl } = await sb
      .from("properties").select("id, source_url").in("source_url", [item.url, normalizedItemUrl]).limit(1);
    if (existingByUrl && existingByUrl.length > 0) {
      await sb.from("import_job_items")
        .update({ status: "skipped", error_message: `Duplicate: URL already imported as property ${existingByUrl[0].id}`, error_type: "permanent" })
        .eq("id", item.id);
      return { succeeded: false };
    }

    // 0b. In-job URL dedup
    const { data: existingJobItem } = await sb
      .from("import_job_items").select("id, property_id")
      .eq("job_id", jobId).in("url", [item.url, normalizedItemUrl]).eq("status", "done").neq("id", item.id).limit(1);
    if (existingJobItem && existingJobItem.length > 0) {
      await sb.from("import_job_items")
        .update({ status: "skipped", error_message: "Duplicate: same URL already processed in this job", error_type: "permanent" })
        .eq("id", item.id);
      return { succeeded: false };
    }

    // 0c. Pre-check (skip for Yad2 — direct fetch hits ShieldSquare, stealth proxy handles it)
    if (!item.url.includes("yad2.co.il")) {
      const preCheck = await preCheckUrl(item.url);
      if (!preCheck.ok) {
        const errorType = (preCheck.skipReason?.includes("timed out") || preCheck.skipReason?.includes("network error")) ? "transient" : "permanent";
        await sb.from("import_job_items")
          .update({ status: "skipped", error_message: preCheck.skipReason, error_type: errorType })
          .eq("id", item.id);
        return { succeeded: false };
      }
    }

    // 1. Scrape
    const isYad2Item = item.url.includes("yad2.co.il");
    const isAgencyOwnWebsite = isAgencyOwnWebsiteSource(job.source_type);
    const isStrongAgencyListing = isAgencyOwnWebsite && isStrongAgencyListingUrl(item.url, job.website_url || item.url);
    dlog(`Scraping: ${item.url}`);

    // For Yad2, wrap the Firecrawl call in a 35s Promise.race timeout.
    // Stealth proxy requests occasionally hang indefinitely, blocking the whole batch.
    let scrapeRes: Response;
    if (isYad2Item) {
      const scrapePromise = fetchWithTimeout("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url, formats: ["markdown", "links", "html"], onlyMainContent: true, proxy: "stealth", waitFor: 5000 }),
      }, 35_000);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Yad2 stealth scrape timeout after 35s")), 35_000)
      );
      try {
        scrapeRes = await Promise.race([scrapePromise, timeoutPromise]) as Response;
      } catch (e) {
        // Timeout — mark as transient failure so it can be retried
        await sb.from("import_job_items").update({
          status: "failed",
          error_message: e instanceof Error ? e.message : "Scrape timeout",
          error_type: "transient",
        }).eq("id", item.id);
        return { succeeded: false };
      }
    } else {
      scrapeRes = await fetchWithTimeout("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url, formats: ["markdown", "links", "html"], onlyMainContent: true }),
      }, 30_000);
    }

    // Retry logic for transient errors (401/500/502/503)
    if (!scrapeRes.ok && [401, 500, 502, 503].includes(scrapeRes.status)) {
      const firstStatus = scrapeRes.status;
      console.warn(`Scrape ${item.url} got ${firstStatus}, retrying in 2s...`);
      await scrapeRes.text(); // consume body
      await new Promise(r => setTimeout(r, 2000));
      if (isYad2Item) {
        const retryPromise = fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: item.url, formats: ["markdown", "links", "html"], onlyMainContent: true, proxy: "stealth", waitFor: 5000 }),
        });
        const retryTimeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Yad2 retry timeout")), 35_000));
        try {
          scrapeRes = await Promise.race([retryPromise, retryTimeout]) as Response;
        } catch (_e) {
          await sb.from("import_job_items").update({ status: "failed", error_message: `Scrape retry timeout after initial ${firstStatus}`, error_type: "transient" }).eq("id", item.id);
          return { succeeded: false };
        }
      } else {
        scrapeRes = await fetchWithTimeout("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: item.url, formats: ["markdown", "links", "html"], onlyMainContent: true }),
        }, 30_000);
      }
    }

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) {
      const statusCode = scrapeRes.status;
      if (statusCode === 404 || statusCode === 410) {
        await sb.from("import_job_items").update({ status: "skipped", error_message: `Page not found (${statusCode})`, error_type: "permanent" }).eq("id", item.id);
        return { succeeded: false };
      }
      const errorType = statusCode === 401 ? "blocked" : "transient";
      await sb.from("import_job_items").update({ status: "failed", error_message: `Scrape failed (${statusCode}) after retry`, error_type: errorType }).eq("id", item.id);
      return { succeeded: false };
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const pageLinks = scrapeData.data?.links || scrapeData.links || [];
    const pageHtml = scrapeData.data?.html || scrapeData.html || "";

    // Track Firecrawl scrape cost
    await trackCost(sb, jobId, "firecrawl", 1, "credits");

    // For Yad2: detect ShieldSquare CAPTCHA page — stealth proxy occasionally fails.
    // CAPTCHA pages are tiny and contain specific ShieldSquare markers.
    if (isYad2Item) {
      const lowerHtml = pageHtml.toLowerCase();
      const isCaptcha =
        lowerHtml.includes("shieldsquare") ||
        lowerHtml.includes("captcha") ||
        lowerHtml.includes("perimeterx") ||
        lowerHtml.includes("px-captcha") ||
        (markdown.length < 200 && lowerHtml.includes("robot"));
      if (isCaptcha) {
        console.warn(`[Yad2] CAPTCHA page detected for ${item.url} — marking transient`);
        await sb.from("import_job_items").update({
          status: "failed",
          error_message: "ShieldSquare CAPTCHA blocked individual listing scrape",
          error_type: "transient",
        }).eq("id", item.id);
        return { succeeded: false };
      }
    }

    if ((!markdown || markdown.length < 50) && !(isStrongAgencyListing && pageHtml && pageHtml.length > 500)) {
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Page content too short", error_type: "permanent" }).eq("id", item.id);
      return { succeeded: false };
    }

    // Pre-LLM: sold/rented/rental/new-dev check (enhanced)
    const preFilter = isNonResalePage(markdown, importType);
    if (preFilter.skip) {
      dlog(`Pre-filter: ${preFilter.reason} for ${item.url}`);
      await sb.from("import_job_items").update({ status: "skipped", error_message: preFilter.reason, error_type: "permanent" }).eq("id", item.id);
      return { succeeded: false };
    }

    const agencyHtmlFallback = isStrongAgencyListing ? extractAgencyHtmlFallback(pageHtml, markdown, item.url) : null;

    // 1b. CMS detection + adapter extraction
    const cmsType = detectCmsType(pageHtml, item.url);
    let cmsData: Record<string, any> | null = null;
    let cmsExtracted: string | null = null;

    if (cmsType === "wordpress") {
      dlog(`CMS detected: WordPress for ${item.url}`);
      cmsData = await extractFromWordPress(item.url, firecrawlKey);
    } else if (cmsType === "wix") {
      dlog(`CMS detected: Wix for ${item.url}`);
      cmsData = extractFromWixState(pageHtml);
    }

    // 2. AI extraction (or skip if CMS got enough data)
    const domain = getDomainFromUrl(item.url);
    let listing: any = null;
    let usedSimplifiedPrompt = false;

    // If CMS extracted all core fields, skip AI entirely
    if (cmsData && cmsData.price && cmsData.city && cmsData.property_type) {
      listing = { ...cmsData, listing_category: "property" };
      cmsExtracted = cmsType;
      dlog(`CMS adapter (${cmsType}) provided full extraction — skipping AI`);
    } else {
      // Normal AI extraction flow. For Yad2/Madlan, do not ask AI for image URLs.
      const sourceType = String(job.source_type || "").toLowerCase();
      const includeImagesInExtraction = isAgencyOwnWebsite;
      const extractionPrompt = buildExtractionPrompt(item.url, domain, markdown, pageLinks, includeImagesInExtraction);

      const extractRes = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: extractionPrompt }],
          tools: [{
            type: "function",
            function: {
              name: "extract_listing",
              description: "Extract structured data from a real estate listing page",
              parameters: {
                type: "object",
              properties: {
                  listing_category: { type: "string", enum: ["property", "project", "not_listing"] },
                  title: { type: "string" },
                  description: { type: "string" },
                  price: { type: "number", description: "Price in NIS; use 0 only for Price on Request" },
                  currency: { type: "string", enum: ["ILS", "USD"] },
                  bedrooms: { type: "number", description: "Sleeping bedrooms only; Israeli rooms minus 1 living room" },
                  source_rooms: { type: "number", description: "Original Israeli room count shown on the source" },
                  bathrooms: { type: "number" },
                  size_sqm: { type: "number" },
                  address: { type: "string" },
                  city: { type: "string", description: "Supported city name only" },
                  neighborhood: { type: "string" },
                  property_type: { type: "string", enum: ["apartment", "garden_apartment", "penthouse", "duplex", "house", "cottage", "land"] },
                  listing_status: { type: "string", enum: ["for_sale", "for_rent"] },
                  short_term_rental: { type: "boolean" },
                  floor: { type: "number" },
                  total_floors: { type: "number" },
                  year_built: { type: "number", description: "Year built / construction year if shown" },
                  features: { type: "array", items: { type: "string" }, description: "Standardized feature keys only, e.g. elevator, balcony, parking, storage, mamad, furnished, pool, sea_view" },
                  parking: { type: "number" },
                  storage_count: { type: "number", description: "Number of storage rooms/storerooms if shown" },
                  condition: { type: "string", enum: ["new", "renovated", "good", "needs_renovation"] },
                  ac_type: { type: "string", enum: ["split", "central", "mini_central", "none"] },
                  entry_date: { type: "string" },
                  original_price: { type: "number" },
                  lot_size_sqm: { type: "number" },
                  vaad_bayit_monthly: { type: "number" },
                  is_furnished: { type: "boolean" },
                  is_accessible: { type: "boolean" },
                  additional_rooms: { type: "number" },
                  featured_highlight: { type: "string" },
                  lease_term: { type: "string" },
                  furnished_status: { type: "string", enum: ["fully", "semi", "unfurnished"] },
                  pets_policy: { type: "string", enum: ["allowed", "case_by_case", "not_allowed"] },
                  subletting_allowed: { type: "boolean" },
                  agent_fee_required: { type: "boolean" },
                  bank_guarantee_required: { type: "boolean" },
                  checks_required: { type: "boolean" },
                  photo_count: { type: "number" },
                },
                required: ["listing_category"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "extract_listing" } },
        }),
      }, 25_000);

      if (!extractRes.ok) {
        const errText = await extractRes.text();
        console.error("AI extraction error:", extractRes.status, errText);
        if (extractRes.status === 429) {
          await sb.from("import_job_items").update({ status: "pending", error_message: "Rate limited, will retry", error_type: "transient" }).eq("id", item.id);
          return { succeeded: false };
        }
        const retryResult = await retryWithSimplifiedPrompt(item.url, markdown, lovableKey);
        if (!retryResult) {
          await sb.from("import_job_items").update({ status: "failed", error_message: `AI extraction failed (${extractRes.status})`, error_type: "transient" }).eq("id", item.id);
          return { succeeded: false };
        }
        listing = retryResult;
        usedSimplifiedPrompt = true;
      }

      if (!listing) {
        const extractData = await extractRes.json();
        const extractToolCall = extractData.choices?.[0]?.message?.tool_calls?.[0];
        if (!extractToolCall?.function?.arguments) {
          const retryResult = await retryWithSimplifiedPrompt(item.url, markdown, lovableKey);
          if (!retryResult) {
            if (agencyHtmlFallback) {
              listing = agencyHtmlFallback;
              cmsExtracted = "agency_html_fallback";
            } else {
            await sb.from("import_job_items").update({ status: "failed", error_message: "AI returned no extraction data", error_type: "permanent" }).eq("id", item.id);
            return { succeeded: false };
            }
          } else {
            listing = retryResult;
            usedSimplifiedPrompt = true;
          }
        } else {
        listing = JSON.parse(extractToolCall.function.arguments);

          // Track AI token cost (estimate from prompt + response length)
          const promptTokens = Math.ceil(extractionPrompt.length / 4);
          const responseTokens = Math.ceil((extractToolCall.function.arguments?.length || 0) / 4);
          await trackCost(sb, jobId, "ai_tokens", promptTokens + responseTokens, "tokens");
        }
      }

      if (!listing && agencyHtmlFallback) {
        listing = agencyHtmlFallback;
        cmsExtracted = "agency_html_fallback";
      }

      // Merge partial CMS data into AI result (CMS takes priority for filling gaps)
      if (cmsData) {
        cmsExtracted = cmsType;
        for (const [key, value] of Object.entries(cmsData)) {
          if (value != null && (listing[key] == null || listing[key] === "" || listing[key] === 0)) {
            listing[key] = value;
          }
        }
        dlog(`CMS adapter (${cmsType}) merged partial data into AI extraction`);
      }
      if (agencyHtmlFallback) {
        for (const [key, value] of Object.entries(agencyHtmlFallback)) {
          if (value != null && (listing[key] == null || listing[key] === "" || listing[key] === 0 || (Array.isArray(listing[key]) && listing[key].length === 0))) {
            listing[key] = value;
          }
        }
        if (!cmsExtracted) cmsExtracted = "agency_html_fallback";
      }

      if (isAgencyOwnWebsite) {
        listing = enrichListingFromVisibleFacts(listing, pageHtml, markdown);
        listing._agency_visible_facts_extracted = true;
      }
    }

    // Merge structured data from HTML (JSON-LD, OG tags) — fills remaining gaps
    const structuredData = extractStructuredData(pageHtml);
    if (structuredData) {
      dlog(`Structured data found for ${item.url}: ${Object.keys(structuredData).join(", ")}`);
      for (const [key, value] of Object.entries(structuredData)) {
        if (key === "structured_images" || key === "og_title" || key === "og_description" || key === "city_hint") continue;
        if (value != null && (listing[key] == null || listing[key] === "" || listing[key] === 0)) {
          listing[key] = value;
        }
      }
      if (structuredData.structured_images?.length && !listing._photo_count) {
        listing._photo_count = structuredData.structured_images.length;
      }
      if (!listing.city && structuredData.city_hint) {
        listing.city = structuredData.city_hint;
      }
      listing._has_structured_data = true;
    }
    if (cmsExtracted) {
      listing._cms_extracted = cmsExtracted;
    }

    // Store raw extraction (strip any photo URLs for legal compliance)
    const sanitizedListing = { ...listing };
    delete sanitizedListing.image_urls;
    delete sanitizedListing.structured_images;
    await sb.from("import_job_items").update({ extracted_data: sanitizedListing }).eq("id", item.id);

    const category = listing.listing_category || (listing.is_listing_page === false ? "not_listing" : "property");

    if (category === "not_listing" && !isStrongAgencyListing) {
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Not a listing page", error_type: "permanent" }).eq("id", item.id);
      return { succeeded: false };
    }

    if (category === "not_listing" && isStrongAgencyListing) {
      listing.listing_category = "property";
      listing._category_overridden = "agency_listing_url";
    }

    if (category === "project") {
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Project/development page — skipped", error_type: "permanent" }).eq("id", item.id);
      return { succeeded: false };
    }

    // ── POST-EXTRACTION CITY INFERENCE ──
    let cityMatchType: "exact" | "fuzzy" | "domain" | "none" = "none";
    if (!listing.city || listing.city.trim() === "") {
      // Try Hebrew city name extraction from scraped content
      if (item.url?.includes("yad2.co.il") && markdown) {
        const hebrewCity = inferCityFromHebrew(markdown.slice(0, 3000));
        if (hebrewCity) {
          listing.city = hebrewCity;
          cityMatchType = "fuzzy";
          dlog(`Inferred city "${hebrewCity}" from Hebrew content for ${item.url}`);
        }
      }
      // Fallback to domain city
      if ((!listing.city || listing.city.trim() === "") && domainCity) {
        listing.city = domainCity;
        cityMatchType = "domain";
      }
    }

    // ── CITY WHITELIST GATE ──
    const matchedCity = matchSupportedCity(listing.city);
    if (!matchedCity) {
      await sb.from("import_job_items").update({
        status: "skipped",
        error_message: `City not supported: "${listing.city || '(none)'}". Only 25 featured cities are imported.`,
        error_type: "permanent",
      }).eq("id", item.id);
      return { succeeded: false };
    }

    // Determine city match type for confidence scoring
    if (cityMatchType !== "domain") {
      const normalizedInput = normalizeCityStr(listing.city || "");
      const normalizedMatched = normalizeCityStr(matchedCity);
      cityMatchType = normalizedInput === normalizedMatched ? "exact" : "fuzzy";
    }
    listing.city = matchedCity;

    // ── SOLD/RENTED POST-EXTRACTION CHECK ──
    if (listing.is_sold_or_rented) {
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Listing is sold or rented", error_type: "permanent" }).eq("id", item.id);
      return { succeeded: false };
    }

    const shortTermPostCheck = detectShortTermRental(`${decodeURIComponent(item.url)}\n${listing.title || ""}\n${listing.description || ""}\n${markdown}\n${pageHtml}`);
    if (listing.short_term_rental === true || shortTermPostCheck.isShortTerm) {
      await sb.from("import_job_items").update({
        status: "skipped",
        error_message: `Short-term rental not supported${shortTermPostCheck.reason ? ` (${shortTermPostCheck.reason})` : ""}`,
        error_type: "permanent",
        extracted_data: { ...listing, short_term_rental: true },
      }).eq("id", item.id);
      return { succeeded: false };
    }

    // Guard against Hebrew agency pages being mislabeled as rentals because
    // generic words like "לטווח" appear in text while the price is clearly a sale price.
    const preValidationWarnings: string[] = [];
    preValidationWarnings.push(...normalizeCompactAgencyPrice(listing, `${decodeURIComponent(item.url)}\n${markdown}\n${pageHtml}`, importType));
    if (listing.listing_status === "for_rent" && listing.price && listing.price > 100_000) {
      const rentSignals = /לחודש|חודשי|שכירות חודשית|per month|monthly/i.test(`${markdown}\n${pageHtml}`);
      if (!rentSignals || /למכירה|מכירה|for sale/i.test(`${decodeURIComponent(item.url)}\n${markdown}`)) {
        listing.listing_status = "for_sale";
        preValidationWarnings.push("corrected_rent_status_to_sale_due_high_price");
      }
    }

    // ── VALIDATION (enhanced with city-specific outlier detection) ──
    const { errors: propertyErrors, warnings: validationWarnings } = validatePropertyData(listing, importType);
    validationWarnings.push(...preValidationWarnings);
    if (propertyErrors.length > 0) {
      await sb.from("import_job_items").update({
        status: "failed",
        error_message: `Validation failed: ${propertyErrors.join("; ")}`,
        error_type: "permanent",
        extracted_data: { ...listing, validation_errors: propertyErrors, validation_warnings: validationWarnings },
      }).eq("id", item.id);
      return { succeeded: false };
    }

    // ── CONFIDENCE SCORING ──
    let confidenceScore = computeConfidenceScore(listing, cityMatchType, validationWarnings, !!listing._has_structured_data, cmsExtracted);
    const copy = await generateBuyWiseTitleAndDescription(
      listing,
      `${listing.title || ""}\n${listing.description || ""}\n${structuredData?.og_title || ""}\n${structuredData?.og_description || ""}\n${markdown}`,
      lovableKey,
      jobId,
      sb,
    );
    listing.ai_title = copy.title;
    listing.ai_english_description = copy.description;
    listing.description = copy.description;
    if (!copy.aiGenerated) validationWarnings.push("ai_description_fallback_generated_from_facts");

    // Apply penalty for simplified prompt extraction
    if (usedSimplifiedPrompt) {
      confidenceScore = Math.max(0, confidenceScore - 10);
      validationWarnings.push("extracted_with_simplified_prompt");
      dlog(`Confidence adjusted to ${confidenceScore} (simplified prompt penalty -10)`);
    } else {
      dlog(`Confidence score for ${item.url}: ${confidenceScore}`);
    }

    // Store confidence score + warnings
    await sb.from("import_job_items").update({
      confidence_score: confidenceScore,
      extracted_data: { ...listing, confidence_score: confidenceScore, validation_warnings: validationWarnings },
    }).eq("id", item.id);

    // Below 40: skip with low confidence, except trusted agency-owned listing URLs.
    // Those should import as draft/needs-review rather than disappearing.
    if (confidenceScore < 40 && isStrongAgencyListing) {
      validationWarnings.push(`agency_site_low_confidence_imported_${confidenceScore}`);
      listing.provisioning_audit_status = "flagged";
      confidenceScore = Math.max(confidenceScore, 40);
      await sb.from("import_job_items").update({
        confidence_score: confidenceScore,
        extracted_data: { ...listing, confidence_score: confidenceScore, validation_warnings: validationWarnings },
      }).eq("id", item.id);
    }

    if (confidenceScore < 40) {
      await sb.from("import_job_items").update({
        status: "skipped",
        error_message: `Low confidence (${confidenceScore}/100): insufficient data quality for import`,
        error_type: "permanent",
      }).eq("id", item.id);
      return { succeeded: false };
    }

    // Download only allowed source photos: website preferred, Madlan fallback, Yad2 never.
    let imageUrls: string[] = [];
    listing.image_hashes = [];
    imageUrls = await collectAllowedSourceImages(job.source_type, listing, structuredData, pageHtml, item.url, sb, jobId);
    if (imageUrls.length > 0) dlog(`Downloaded ${imageUrls.length} allowed ${job.source_type || "website"} images for ${item.url}`);

    // ── Intra-agency strict dedup ──
    // Keep same-building/multi-unit inventory, but block exact same-unit repeats
    // that arrive through alternate URLs, portal mirrors, or URL encoding variants.
    if (job.agency_id && listing.city && (listing.address || (listing.size_sqm && listing.price && listing.bedrooms != null))) {
      const query = sb
        .from("properties")
        .select("id, title, address, city, listing_status, price, size_sqm, bedrooms, bathrooms, floor, source_url")
        .or(`primary_agency_id.eq.${job.agency_id},claimed_by_agency_id.eq.${job.agency_id}`)
        .eq("listing_status", listing.listing_status || "for_sale")
        .ilike("city", listing.city.trim())
        .limit(50);

      if (listing.bedrooms != null) query.eq("bedrooms", Math.floor(listing.bedrooms));
      if (listing.size_sqm) query.gte("size_sqm", listing.size_sqm - 3).lte("size_sqm", listing.size_sqm + 3);
      if (listing.price) query.gte("price", listing.price * 0.97).lte("price", listing.price * 1.03);

      const { data: sameAgencyCandidates } = await query;
      const sameUnit = (sameAgencyCandidates || []).find((candidate: any) => isStrictSameUnitDuplicate(candidate, listing));
      if (sameUnit) {
        await sb.from("import_job_items").update({
          status: "skipped",
          error_message: `Duplicate: same agency same unit already imported as property ${sameUnit.id}`,
          error_type: "permanent",
          property_id: sameUnit.id,
          extracted_data: { ...listing, duplicate_of: sameUnit.id },
        }).eq("id", item.id);
        return { succeeded: false };
      }
    }

    // ── DEDUP: Tier 3 — Cross-source merge ──
    // If this listing already exists from another source, MERGE rather than duplicate.
    // Merge strategy: keep the richer version of each field, track all source URLs.
    let crossSourceMatchId: string | null = null;

    // Search by address + city (most reliable)
    if (listing.address && listing.city) {
      const normalizedAddr = normalizeAddressForDedup(listing.address);
      const addrPattern = buildAddressQueryPattern(normalizedAddr);
      if (normalizedAddr.length > 0) {
        const { data: crossDupes } = await sb
          .from("properties")
          .select("id, agent_id, price, size_sqm, bedrooms, images, description, address, floor, year_built, features, merged_source_urls, source_url, data_quality_score")
          .ilike("address", addrPattern)
          .ilike("city", listing.city.trim())
          .not("import_source", "is", null) // only merge sourced listings
          .neq("id", "00000000-0000-0000-0000-000000000000") // avoid null comparison
          .limit(1);
        if (crossDupes && crossDupes.length > 0) crossSourceMatchId = crossDupes[0].id;
      }
    }

    // Fuzzy search by city + bedrooms + size + price (when no address)
    if (!crossSourceMatchId && listing.city && listing.bedrooms != null && listing.size_sqm && listing.price > 0) {
      const { data: crossFuzzy } = await sb
        .from("properties")
        .select("id, agent_id, price, size_sqm, bedrooms, images, description, address, floor, year_built, features, merged_source_urls, source_url, data_quality_score")
        .ilike("city", listing.city.trim())
        .eq("bedrooms", Math.floor(listing.bedrooms))
        .gte("size_sqm", listing.size_sqm - 5)
        .lte("size_sqm", listing.size_sqm + 5)
        .gte("price", listing.price * 0.90)
        .lte("price", listing.price * 1.10)
        .not("import_source", "is", null)
        .limit(1);
      if (crossFuzzy && crossFuzzy.length > 0) crossSourceMatchId = crossFuzzy[0].id;
    }

    if (crossSourceMatchId) {
      // ── MERGE: enrich existing property with better data from this source ──
      // Source content priority: agency website (1) > Madlan (2) > Yad2 (3). Lower number = preferred.
      // Agency-owned website content/photos should be the base; portals enrich missing fields and surface conflicts.
      const SOURCE_TRUST: Record<string, number> = { website_scrape: 1, madlan: 2, yad2: 3 };
      const incomingSource =
        job.source_type === "yad2" ? "yad2" :
        job.source_type === "madlan" ? "madlan" : "website_scrape";
      const incomingRank = SOURCE_TRUST[incomingSource] ?? 99;

      const { data: existing } = await sb
        .from("properties")
        .select("id, price, size_sqm, bedrooms, bathrooms, source_rooms, images, description, ai_english_description, address, floor, total_floors, year_built, features, merged_source_urls, source_url, data_quality_score, neighborhood, import_source, field_source_map, agent_id, parking, condition, ac_type, entry_date, original_price, lot_size_sqm, vaad_bayit_monthly, is_furnished, is_accessible, additional_rooms, featured_highlight, lease_term, furnished_status, pets_policy, subletting_allowed, agent_fee_required, bank_guarantee_required, checks_required")
        .eq("id", crossSourceMatchId)
        .single();

      if (existing) {
        const fieldSourceMap: Record<string, string> = (existing.field_source_map as any) || {};
        const conflictsToLog: Array<{
          field: string;
          existing_value: any;
          existing_source: string | null;
          incoming_value: any;
          incoming_source: string;
          diff_percent: number | null;
        }> = [];

        // Helper: decide if incoming should win for a structural field.
        // Rule: incoming wins only if (a) existing is empty OR (b) incoming source is strictly preferred.
        const shouldOverride = (fieldName: string, existingVal: any): boolean => {
          if (existingVal == null || existingVal === "" || existingVal === 0) return true;
          const existingSrc = fieldSourceMap[fieldName] || existing.import_source || "website_scrape";
          const existingRank = SOURCE_TRUST[existingSrc] ?? 99;
          return incomingRank < existingRank; // strictly preferred source
        };

        // Helper: record conflict if values differ meaningfully on a numeric field
        const maybeLogConflict = (fieldName: string, existingVal: any, incomingVal: any) => {
          if (existingVal == null || incomingVal == null) return;
          if (typeof existingVal === "number" && typeof incomingVal === "number" && existingVal > 0) {
            const diffPct = Math.abs(existingVal - incomingVal) / existingVal;
            if (diffPct > 0.10) {
              conflictsToLog.push({
                field: fieldName,
                existing_value: existingVal,
                existing_source: fieldSourceMap[fieldName] || existing.import_source || null,
                incoming_value: incomingVal,
                incoming_source: incomingSource,
                diff_percent: Math.round(diffPct * 1000) / 10,
              });
            }
          } else if (existingVal !== incomingVal && typeof existingVal === "string") {
            conflictsToLog.push({
              field: fieldName,
              existing_value: existingVal,
              existing_source: fieldSourceMap[fieldName] || existing.import_source || null,
              incoming_value: incomingVal,
              incoming_source: incomingSource,
              diff_percent: null,
            });
          }
        };

        const mergedUrls: string[] = Array.isArray(existing.merged_source_urls)
          ? [...existing.merged_source_urls]
          : (existing.source_url ? [existing.source_url] : []);
        if (item.url && !mergedUrls.includes(item.url)) mergedUrls.push(item.url);
        const normalizedMergeUrl = normalizeUrl(item.url);
        if (normalizedMergeUrl && !mergedUrls.includes(normalizedMergeUrl)) mergedUrls.push(normalizedMergeUrl);

        const patch: Record<string, any> = {
          merged_source_urls: mergedUrls,
          source_last_checked_at: new Date().toISOString(),
        };
        const visibleFactFields = new Set<string>(Array.isArray(listing._visible_fact_fields) ? listing._visible_fact_fields : []);
        const incomingFieldSource = (field: string) => visibleFactFields.has(field) ? `${incomingSource}_parser` : incomingSource;

        // Structural fields — apply source-trust ranking
        const structuralFields: Array<[string, any]> = [
          ["price", listing.price > 0 ? listing.price : null],
          ["size_sqm", listing.size_sqm && listing.size_sqm > 0 ? listing.size_sqm : null],
          ["bedrooms", listing.bedrooms != null ? Math.floor(listing.bedrooms) : null],
          ["bathrooms", listing.bathrooms != null ? Math.floor(listing.bathrooms) : null],
          ["source_rooms", listing.source_rooms ?? null],
          ["floor", listing.floor ?? null],
          ["total_floors", listing.total_floors ?? null],
          ["year_built", listing.year_built ?? null],
          ["parking", listing.parking ?? null],
          ["condition", listing.condition ?? null],
          ["ac_type", listing.ac_type || null],
          ["entry_date", sanitizeEntryDate(listing.entry_date)],
          ["original_price", listing.original_price ?? null],
          ["lot_size_sqm", listing.lot_size_sqm ?? null],
          ["vaad_bayit_monthly", listing.vaad_bayit_monthly ?? null],
          ["is_furnished", listing.is_furnished === true ? true : null],
          ["is_accessible", listing.is_accessible === true ? true : null],
          ["additional_rooms", listing.additional_rooms ?? null],
          ["featured_highlight", listing.featured_highlight || null],
          ["lease_term", listing.lease_term || null],
          ["furnished_status", listing.furnished_status || null],
          ["pets_policy", listing.pets_policy || null],
          ["subletting_allowed", listing.subletting_allowed === true ? true : null],
          ["agent_fee_required", listing.agent_fee_required ?? null],
          ["bank_guarantee_required", listing.bank_guarantee_required ?? null],
          ["checks_required", listing.checks_required ?? null],
          ["address", listing.address ? normalizeAddressForStorage(listing.address) : null],
          ["neighborhood", listing.neighborhood ?? null],
        ];

        for (const [field, incomingVal] of structuralFields) {
          if (incomingVal == null) continue;
          const existingVal = (existing as any)[field];
          // Log conflict on price/size before deciding (independent of trust)
          if (field === "price" || field === "size_sqm") {
            maybeLogConflict(field, existingVal, incomingVal);
          }
          if (shouldOverride(field, existingVal)) {
            patch[field] = incomingVal;
            fieldSourceMap[field] = incomingFieldSource(field);
          }
        }

        // Description: longer wins regardless of source
        if (listing.description && (!existing.description || existing.description === existing.ai_english_description || listing.description.length > existing.description.length)) {
          patch.description = listing.description;
          patch.ai_english_description = listing.ai_english_description || listing.description;
          fieldSourceMap["description"] = incomingFieldSource("description");
        }

        // Features: union of both arrays
        if (listing.features?.length && existing.features) {
          patch.features = [...new Set([...(existing.features as string[]), ...listing.features])];
          fieldSourceMap["features"] = incomingFieldSource("features");
        } else if (listing.features?.length && !existing.features) {
          patch.features = listing.features;
          fieldSourceMap["features"] = incomingFieldSource("features");
        }

        // Images: first successful source wins. Later matched sources enrich facts/features only,
        // avoiding duplicated/overlapping galleries across agency/Madlan/Yad2.
        if (imageUrls.length > 0) {
          const existingImages = Array.isArray(existing.images) ? existing.images as string[] : [];
          if (existingImages.length === 0 && incomingSource !== "yad2") {
            patch.images = imageUrls;
            fieldSourceMap["images"] = incomingSource === "madlan" ? "madlan_fallback" : incomingSource;
          }
        }

        patch.field_source_map = fieldSourceMap;

        // Recalculate quality score as max of both
        if (confidenceScore > (existing.data_quality_score ?? 0)) {
          patch.data_quality_score = confidenceScore;
          // Don't auto-publish on merge — keep existing publish state
        }

        await sb.from("properties").update(patch).eq("id", crossSourceMatchId);

        // Log any conflicts detected
        if (conflictsToLog.length > 0) {
          const conflictRows = conflictsToLog.map((c) => ({
            property_id: crossSourceMatchId,
            agency_id: job.agency_id,
            field_name: c.field,
            existing_value: c.existing_value,
            existing_source: c.existing_source,
            incoming_value: c.incoming_value,
            incoming_source: c.incoming_source,
            diff_percent: c.diff_percent,
            status: "pending",
          }));
          const { error: confErr } = await sb.from("import_conflicts").insert(conflictRows);
          if (confErr) console.warn(`[Merge] Failed to log conflicts: ${confErr.message}`);
          else dlog(`[Merge] Logged ${conflictRows.length} conflict(s) for property ${crossSourceMatchId}`);
        }

        // Record this as a co-listing agent (different agency, same property)
        if (agentId) {
          await sb.from("property_co_agents").upsert({
            property_id: crossSourceMatchId,
            agent_id: agentId,
            agency_id: job.agency_id,
            source_url: item.url,
            source_type: job.source_type || "website",
          }, { onConflict: "property_id,source_url", ignoreDuplicates: true });
        }

        // Mark this import item as merged (not a new property)
        await sb.from("import_job_items").update({
          status: "done",
          property_id: crossSourceMatchId,
          error_message: `Merged into existing property ${crossSourceMatchId} (cross-source enrichment, source=${incomingSource}, trust=${incomingRank})`,
        }).eq("id", item.id);

        dlog(`[Merge] Enriched property ${crossSourceMatchId} from ${incomingSource} (trust=${incomingRank}, conflicts=${conflictsToLog.length})`);
        return { succeeded: true };
      }
    }

    // Geocode — use Yad2 coordinates if available
    let latitude: number | null = listing._yad2_latitude || null;
    let longitude: number | null = listing._yad2_longitude || null;
    if (!latitude && !longitude && listing.address && listing.city) {
      const coords = await geocodeWithRateLimit(listing.address, listing.city, listing.neighborhood);
      if (coords) { latitude = coords.lat; longitude = coords.lng; }
    }

    // ── CROSS-AGENCY MATCH → CO-LISTING (final gate before insert) ──
    // If this listing already exists from a DIFFERENT agency, don't insert a
    // duplicate row — attach the incoming agency as a SECONDARY co-listing
    // agent on the existing property. The primary (the agency that got there
    // first) keeps the primary slot. Buyer UI renders both.
    //
    // This replaces the old "block + log cross_agency_conflict" flow. Two
    // agencies legitimately representing the same apartment is the Israeli
    // market norm, not a conflict.
    if (job.agency_id && listing.address && listing.city) {
      const { data: crossAgencyMatch } = await sb.rpc("check_cross_agency_duplicate_v2", {
        p_attempted_agency_id: job.agency_id,
        p_address: listing.address,
        p_city: listing.city,
        p_neighborhood: listing.neighborhood || null,
        p_size_sqm: listing.size_sqm || null,
        p_bedrooms: listing.bedrooms != null ? Math.floor(listing.bedrooms) : null,
        p_price: listing.price || null,
        p_latitude: latitude,
        p_longitude: longitude,
        p_floor_number: listing.floor_number != null ? Math.floor(listing.floor_number) : null,
        p_apartment_number: listing.apartment_number || null,
      });

      const match = crossAgencyMatch && crossAgencyMatch.length > 0 ? crossAgencyMatch[0] : null;
      if (match && match.similarity_score >= 70 && !match.same_building_different_unit) {
        // Co-list: upsert the incoming agency as a secondary on the existing property.
        // UNIQUE(property_id, source_url) on property_co_agents de-dupes re-scrapes.
        await sb.from("property_co_agents").upsert(
          {
            property_id: match.property_id,
            agent_id: agentId,
            agency_id: job.agency_id,
            source_url: item.url,
            source_type: job.source_type || "website",
          },
          { onConflict: "property_id,source_url", ignoreDuplicates: true }
        );

        // Refresh existing primary's last_primary_refresh so stale-sweep
        // doesn't penalise a property that's actively represented by
        // multiple agencies.
        await sb.from("properties")
          .update({ last_primary_refresh: new Date().toISOString() })
          .eq("id", match.property_id);

        // Mark the import item as co_listed — distinct from skipped.
        await sb.from("import_job_items").update({
          status: "co_listed",
          error_message: `Co-listed under existing property ${match.property_id} (score ${match.similarity_score}).`,
          error_type: null,
          property_id: match.property_id,
        }).eq("id", item.id);

        dlog(`[Co-Listing] Added agency ${job.agency_id} as secondary on property ${match.property_id} (score ${match.similarity_score})`);
        return { succeeded: false };
      }
    }

    // Insert property
    // Sanitize entry_date: only accept valid ISO dates, convert "immediate"/Hebrew equivalents to today
    const entryDate = sanitizeEntryDate(listing.entry_date);

    const { data: property, error: propErr } = await sb
      .from("properties")
      .insert({
        agent_id: agentId,
        title: listing.ai_title || generateListingTitle(listing, new URL(item.url).hostname),
        description: listing.description,
        ai_english_description: listing.ai_english_description,
        property_type: listing.property_type || "apartment",
        listing_status: listing.listing_status || "for_sale",
        price: listing.price || 0,
        currency: listing.currency || "ILS",
        address: listing.address ? normalizeAddressForStorage(listing.address) : "",
        city: listing.city,
        neighborhood: listing.neighborhood || null,
        latitude, longitude,
        // Use source_rooms to derive bedrooms if bedrooms not explicitly extracted
        bedrooms: listing.bedrooms != null
          ? Math.floor(listing.bedrooms)
          : listing.source_rooms != null
          ? Math.max(0, Math.floor(listing.source_rooms) - 1)
          : null,
        bathrooms: listing.bathrooms != null ? Math.floor(listing.bathrooms) : null,
        source_rooms: listing.source_rooms ?? null,
        size_sqm: listing.size_sqm || null,
        floor: listing.floor ?? null,
        total_floors: listing.total_floors ?? null,
        year_built: listing.year_built ?? null,
        features: listing.features || [],
        images: imageUrls.length > 0 ? imageUrls : null,
        parking: listing.parking ?? 0,
        condition: listing.condition || null,
        ac_type: listing.ac_type || null,
        entry_date: entryDate,
        original_price: listing.original_price ?? null,
        lot_size_sqm: listing.lot_size_sqm ?? null,
        vaad_bayit_monthly: listing.vaad_bayit_monthly ?? null,
        is_furnished: listing.is_furnished ?? false,
        is_accessible: listing.is_accessible ?? false,
        additional_rooms: listing.additional_rooms ?? null,
        featured_highlight: listing.featured_highlight || null,
        lease_term: listing.lease_term || null,
        furnished_status: listing.furnished_status || null,
        pets_policy: listing.pets_policy || null,
        subletting_allowed: listing.subletting_allowed || null,
        agent_fee_required: listing.agent_fee_required ?? null,
        bank_guarantee_required: listing.bank_guarantee_required ?? null,
        checks_required: listing.checks_required ?? null,
        // Always import as draft — agency owner must review before going live
        is_published: false,
        is_featured: false, views_count: 0,
        verification_status: "pending_review",
        provisioning_audit_status: listing.provisioning_audit_status || "pending",
        primary_agency_id: job.agency_id,
        claimed_by_agency_id: job.agency_id,
        import_source: job.source_type === "yad2" ? "yad2" : job.source_type === "madlan" ? "madlan" : "website_scrape",
        source_url: item.url,
        data_quality_score: confidenceScore,
        location_confidence: listing.address?.length > 3 ? "exact" : listing.neighborhood ? "neighborhood" : "city",
        is_claimed: false,
        source_status: "active",
        source_last_checked_at: new Date().toISOString(),
        field_source_map: (() => {
          const src = job.source_type === "yad2" ? "yad2" : job.source_type === "madlan" ? "madlan" : "website_scrape";
          const visibleFactFields = new Set<string>(Array.isArray(listing._visible_fact_fields) ? listing._visible_fact_fields : []);
          const map: Record<string, string> = {};
          for (const f of ["price", "size_sqm", "bedrooms", "bathrooms", "source_rooms", "floor", "total_floors", "year_built", "parking", "condition", "ac_type", "entry_date", "original_price", "lot_size_sqm", "vaad_bayit_monthly", "is_furnished", "is_accessible", "additional_rooms", "featured_highlight", "lease_term", "furnished_status", "pets_policy", "subletting_allowed", "agent_fee_required", "bank_guarantee_required", "checks_required", "address", "neighborhood", "description", "features"]) {
            if ((listing as any)[f] != null && (listing as any)[f] !== "") map[f] = visibleFactFields.has(f) ? `${src}_parser` : src;
          }
          if (latitude != null && longitude != null) map.location = listing._yad2_latitude ? "yad2" : "geocoding";
          return map;
        })(),
      })
      .select("id")
      .single();

    if (propErr) {
      console.error("Property insert error:", propErr);
      await sb.from("import_job_items").update({ status: "failed", error_message: `Insert failed: ${propErr.message}`, error_type: "transient" }).eq("id", item.id);
      return { succeeded: false };
    }

    // Register image pHashes for cross-listing dedup
    if (imageUrls.length > 0 && property?.id) {
      const phashWarnings = await registerImageHashes(property.id, imageUrls, sb);
      if (phashWarnings.length > 0) {
        dlog(`pHash warnings for ${property.id}:`, phashWarnings);
      }
    }

    // ── Generate & enhance street view image after the item is imported.
    // Keep this out of the critical import path so slow image work cannot idle-timeout the batch request.
    if (property?.id) {
      EdgeRuntime.waitUntil(
        generateAndStoreStreetView(sb, property.id, latitude, longitude, listing.address, listing.city, listing.floor, listing.apartment_number || null)
      );
    }

    // Insert cross-source duplicate pair if detected
    if (listing.cross_source_match_id && property?.id) {
      const [pa, pb] = property.id < listing.cross_source_match_id
        ? [property.id, listing.cross_source_match_id]
        : [listing.cross_source_match_id, property.id];
      await sb.from("duplicate_pairs").upsert({
        property_a: pa, property_b: pb,
        detection_method: "cross_source", similarity_score: null, status: "pending",
      }, { onConflict: "property_a,property_b", ignoreDuplicates: true });
    }

    await sb.from("import_job_items").update({ status: "done", property_id: property.id }).eq("id", item.id);
    return { succeeded: true };
  } catch (err) {
    console.error(`Error processing ${item.url}:`, err);
    await sb.from("import_job_items")
      .update({ status: "failed", error_message: err instanceof Error ? err.message : "Unknown error", error_type: "transient" })
      .eq("id", item.id);
    return { succeeded: false };
  }
}

// ─── PROCESS BATCH ──────────────────────────────────────────────────────────

async function handleProcessBatch(body: any) {
  const { job_id } = body;
  if (!job_id) throw new Error("job_id required");

  const sb = supabaseAdmin();
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

  const { data: job, error: jobErr } = await sb
    .from("import_jobs").select("*, agencies!inner(id, admin_user_id)").eq("id", job_id).single();
  if (jobErr || !job) throw new Error("Import job not found");

  const cachedDomainCity = inferCityFromDomain(job.website_url);
  if (cachedDomainCity) dlog(`Domain city: ${cachedDomainCity}`);

  const { data: initialCheck } = await sb
    .from("import_job_items").select("id").eq("job_id", job_id).eq("status", "pending").limit(1);

  if (!initialCheck || initialCheck.length === 0) {
    await sb.from("import_jobs").update({ status: "completed" }).eq("id", job_id);
    return { processed: 0, succeeded: 0, failed: 0, remaining: 0, status: "completed" };
  }

  await sb.from("import_jobs").update({ status: "processing", last_heartbeat: new Date().toISOString() }).eq("id", job_id);

  const { data: agents } = await sb.from("agents").select("id").eq("agency_id", job.agency_id).limit(1);
  const agentId = agents?.[0]?.id || null;

  // Reset per-batch state
  _lastGeoTime = 0;
  _geoQueue = Promise.resolve();
  _batchImageUrlCounts.clear();

  let currentConcurrency = 2;
  const MAX_CONCURRENCY = 2;
  const MIN_CONCURRENCY = 1;
  const REFILL_SIZE = 6;
  const MAX_ITEMS = 12;
  const TIME_LIMIT_MS = 75_000;
  const batchStartTime = Date.now();

  let totalProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;
  let refillCycle = 0;
  let consecutiveSuccessfulChunks = 0;

  while (true) {
    if (totalProcessed >= MAX_ITEMS) break;
    if (Date.now() - batchStartTime > TIME_LIMIT_MS) break;

    const { data: pendingItems, error: itemsErr } = await sb
      .from("import_job_items").select("*")
      .eq("job_id", job_id).eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(Math.min(REFILL_SIZE, MAX_ITEMS - totalProcessed));

    if (itemsErr || !pendingItems || pendingItems.length === 0) break;

    refillCycle++;
    dlog(`Refill ${refillCycle}: ${pendingItems.length} items (concurrency: ${currentConcurrency})`);

    for (let i = 0; i < pendingItems.length && totalProcessed < MAX_ITEMS; i += currentConcurrency) {
      if (Date.now() - batchStartTime > TIME_LIMIT_MS) break;

      const chunk = pendingItems.slice(i, i + currentConcurrency);
      const results = await Promise.allSettled(
        chunk.map(item =>
          processOneItem(item, sb, job, agentId, FIRECRAWL_API_KEY, LOVABLE_API_KEY, job_id, cachedDomainCity, job.import_type || "resale")
        )
      );

      let chunkHadTransientError = false;
      for (const result of results) {
        totalProcessed++;
        if (result.status === "fulfilled" && result.value.succeeded) {
          totalSucceeded++;
        } else {
          totalFailed++;
          // Check for transient/rate-limit errors
          if (result.status === "rejected" || (result.status === "fulfilled" && !result.value.succeeded)) {
            chunkHadTransientError = true;
          }
        }
      }

      // Dynamic concurrency adjustment
      if (chunkHadTransientError) {
        if (currentConcurrency > MIN_CONCURRENCY) {
          currentConcurrency = MIN_CONCURRENCY;
          dlog(`Concurrency reduced to ${currentConcurrency} due to failures`);
        }
        consecutiveSuccessfulChunks = 0;
        // Add a small delay to back off
        await new Promise(r => setTimeout(r, 3000));
      } else {
        consecutiveSuccessfulChunks++;
        if (consecutiveSuccessfulChunks >= 3 && currentConcurrency < MAX_CONCURRENCY) {
          currentConcurrency = MAX_CONCURRENCY;
          consecutiveSuccessfulChunks = 0;
          dlog(`Concurrency recovered to ${currentConcurrency}`);
        }
      }

      // Update heartbeat after each chunk
      await sb.from("import_jobs").update({ last_heartbeat: new Date().toISOString() }).eq("id", job_id);
    }
  }

  dlog(`Batch: ${totalProcessed} processed (${totalSucceeded} ok, ${totalFailed} failed) in ${((Date.now() - batchStartTime) / 1000).toFixed(1)}s`);

  const { data: counts } = await sb.from("import_job_items").select("status").eq("job_id", job_id);
  const doneCount = counts?.filter((c) => c.status === "done").length || 0;
  const failedCount = counts?.filter((c) => ["failed", "skipped"].includes(c.status)).length || 0;
  const remainingCount = counts?.filter((c) => c.status === "pending").length || 0;
  const newStatus = remainingCount === 0 ? "completed" : "ready";

  await sb.from("import_jobs").update({ processed_count: doneCount, failed_count: failedCount, status: newStatus }).eq("id", job_id);

  // ── Self-chain: if items remain, fire the next batch in the background ──
  if (remainingCount > 0) {
    dlog(`Self-chaining: ${remainingCount} items remaining for job ${job_id}`);
    const selfChainUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/import-agency-listings`;
    EdgeRuntime.waitUntil(
      (async () => {
        // Small delay to let the current response flush
        await new Promise((r) => setTimeout(r, 1000));
        try {
          const res = await fetch(selfChainUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ action: "process_batch", job_id }),
          });
          const data = await res.json();
          dlog(`Self-chain batch for ${job_id}: ${data.succeeded || 0} ok, ${data.remaining || 0} remaining`);
        } catch (e) {
          console.error(`Self-chain failed for ${job_id}:`, e);
        }
      })()
    );
  }

  // ─── Cross-agency duplicate scan (fire-and-forget when batch finishes) ───
  // Runs immediately after each completed import so duplicates between agencies
  // are caught right away — not just by the daily 6 AM cron.
  if (newStatus === "completed" && totalSucceeded > 0) {
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          const dupRes = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/detect-duplicates`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ trigger: "post_import", job_id }),
            }
          );
          const dupData = await dupRes.json().catch(() => ({}));
          dlog(`Post-import duplicate scan for ${job_id}:`, dupData);
        } catch (e) {
          console.error(`Post-import duplicate scan failed for ${job_id}:`, e);
        }
      })()
    );
  }

  return { processed: totalProcessed, succeeded: totalSucceeded, failed: totalFailed, remaining: remainingCount, status: newStatus };
}

// ─── RETRY FAILED ───────────────────────────────────────────────────────────

async function handleRetryFailed(body: any) {
  const { job_id } = body;
  if (!job_id) throw new Error("job_id required");

  const sb = supabaseAdmin();

  const { data: resetItems, error: resetErr } = await sb
    .from("import_job_items")
    .update({ status: "pending", error_message: null, error_type: null, confidence_score: null })
    .eq("job_id", job_id)
    .in("status", ["failed", "skipped"])
    .eq("error_type", "transient")
    .select("id");

  if (resetErr) throw new Error(`Failed to reset items: ${resetErr.message}`);
  const resetCount = resetItems?.length || 0;

  const { count: permanentCount } = await sb
    .from("import_job_items")
    .select("id", { count: "exact", head: true })
    .eq("job_id", job_id)
    .in("status", ["failed", "skipped"])
    .eq("error_type", "permanent");

  if (resetCount > 0) await sb.from("import_jobs").update({ status: "ready" }).eq("id", job_id);

  return { reset_count: resetCount, transient_count: resetCount, permanent_count: permanentCount || 0 };
}

async function handleRetryRecoverableSkipped(body: any) {
  const { job_id } = body;
  if (!job_id) throw new Error("job_id required");

  const sb = supabaseAdmin();
  const recoverablePatterns = [
    "Low confidence",
    "Page content too short",
    "AI returned no extraction data",
    "Not a listing page",
    "Pre-check timed out",
    "Pre-check network error",
    "malformed",
  ];
  const { data: items, error } = await sb
    .from("import_job_items")
    .select("id, error_message")
    .eq("job_id", job_id)
    .eq("status", "skipped")
    .eq("error_type", "permanent");
  if (error) throw new Error(`Failed to load skipped items: ${error.message}`);

  const ids = (items || [])
    .filter((item: any) => recoverablePatterns.some((p) => String(item.error_message || "").includes(p)))
    .map((item: any) => item.id);

  if (ids.length > 0) {
    const { error: resetErr } = await sb
      .from("import_job_items")
      .update({ status: "pending", error_message: null, error_type: null, confidence_score: null })
      .in("id", ids);
    if (resetErr) throw new Error(`Failed to reset recoverable skipped items: ${resetErr.message}`);
    await sb.from("import_jobs").update({ status: "ready" }).eq("id", job_id);
  }

  return { reset_count: ids.length, scanned_count: items?.length || 0 };
}

// ─── APPROVE ITEM (manual review) ───────────────────────────────────────────

async function handleApproveItem(body: any) {
  const { item_id, extracted_data } = body;
  if (!item_id) throw new Error("item_id required");

  const sb = supabaseAdmin();

  // Get the item and its job
  const { data: item, error: itemErr } = await sb
    .from("import_job_items").select("*, import_jobs!inner(agency_id, website_url)")
    .eq("id", item_id).single();
  if (itemErr || !item) throw new Error("Import job item not found");

  const agencyId = item.import_jobs.agency_id;
  const listing = extracted_data || item.extracted_data;
  if (!listing) throw new Error("No extracted data to approve");

  // Get agent for this agency
  const { data: agents } = await sb.from("agents").select("id").eq("agency_id", agencyId).limit(1);
  const agentId = agents?.[0]?.id || null;

  // Validate city
  const matchedCity = matchSupportedCity(listing.city);
  if (!matchedCity) throw new Error(`City not supported: "${listing.city}"`);
  listing.city = matchedCity;

  // ⚠️  Do NOT download images from external sources (Yad2/Madlan/agency sites).
  // Images are copyrighted. Agency must upload their own photos via the BuyWise dashboard.
  const imageUrls: string[] = [];

  // Geocode
  let latitude: number | null = null;
  let longitude: number | null = null;
  if (listing.address && listing.city) {
    const coords = await geocodeWithRateLimit(listing.address, listing.city, listing.neighborhood);
    if (coords) { latitude = coords.lat; longitude = coords.lng; }
  }

  const entryDate = listing.entry_date === "immediate" ? new Date().toISOString().split("T")[0] : listing.entry_date || null;

  const { data: property, error: propErr } = await sb
    .from("properties")
    .insert({
      agent_id: agentId,
      title: generateListingTitle(listing, item.import_jobs?.website_url),
      description: listing.description || null,
      property_type: listing.property_type || "apartment",
      listing_status: listing.listing_status || "for_sale",
      price: listing.price || 0,
      currency: listing.currency || "ILS",
      address: listing.address ? normalizeAddressForStorage(listing.address) : "",
      city: listing.city,
      neighborhood: listing.neighborhood || null,
      latitude, longitude,
      bedrooms: Math.floor(listing.bedrooms ?? 0),
      bathrooms: Math.floor(listing.bathrooms ?? 1),
      size_sqm: listing.size_sqm || null,
      floor: listing.floor ?? null,
      total_floors: listing.total_floors ?? null,
      year_built: listing.year_built ?? null,
      features: listing.features || [],
      images: imageUrls.length > 0 ? imageUrls : null,
      parking: listing.parking ?? 0,
      condition: listing.condition || null,
      ac_type: listing.ac_type || null,
      entry_date: entryDate,
      original_price: listing.original_price ?? null,
      lot_size_sqm: listing.lot_size_sqm ?? null,
      vaad_bayit_monthly: listing.vaad_bayit_monthly ?? null,
      is_furnished: listing.is_furnished ?? false,
      is_accessible: listing.is_accessible ?? false,
      additional_rooms: listing.additional_rooms ?? null,
      featured_highlight: listing.featured_highlight || null,
      lease_term: listing.lease_term || null,
      furnished_status: listing.furnished_status || null,
      pets_policy: listing.pets_policy || null,
      subletting_allowed: listing.subletting_allowed || null,
      agent_fee_required: listing.agent_fee_required ?? null,
      bank_guarantee_required: listing.bank_guarantee_required ?? null,
      checks_required: listing.checks_required ?? null,
      is_published: false, is_featured: false, views_count: 0,
      verification_status: "pending_review",
      primary_agency_id: agencyId,
      claimed_by_agency_id: agencyId,
      import_source: "website_scrape",
      source_url: item.url,
    })
    .select("id")
    .single();

  if (propErr) throw new Error(`Insert failed: ${propErr.message}`);

  // Register image pHashes for cross-listing dedup
  if (imageUrls.length > 0 && property?.id) {
    const phashWarnings = await registerImageHashes(property.id, imageUrls, sb);
    if (phashWarnings.length > 0) {
      dlog(`pHash warnings for approved item ${property.id}:`, phashWarnings);
    }
  }

  await sb.from("import_job_items").update({
    status: "done",
    property_id: property.id,
    extracted_data: listing,
  }).eq("id", item_id);

  return { property_id: property.id };
}

// ─── YAD2 ADAPTER ───────────────────────────────────────────────────────────

// Detect Yad2 agency profile URLs
function isYad2AgencyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes("yad2")) return false;
    const path = parsed.pathname.toLowerCase();
    return /\/(agency|professionals|pro)\b/.test(path);
  } catch {
    return false;
  }
}

function normalizeImportType(importType?: string): "resale" | "rental" | "both" {
  const normalized = (importType || "resale").toLowerCase();
  if (normalized === "all" || normalized === "both") return "both";
  if (normalized === "rent" || normalized === "rental") return "rental";
  return "resale";
}

function getYad2AgencyDiscoveryUrls(rawUrl: string, importType: string): string[] {
  const parsed = new URL(rawUrl);
  const basePath = parsed.pathname.replace(/\/(forsale|rent)\/?$/i, "").replace(/\/$/, "");
  const normalizedImportType = normalizeImportType(importType);

  const listingModes = normalizedImportType === "both"
    ? ["forsale", "rent"]
    : [normalizedImportType === "rental" ? "rent" : "forsale"];

  const urls = new Set<string>();
  for (const mode of listingModes) {
    const nextUrl = new URL(parsed.toString());
    nextUrl.pathname = `${basePath}/${mode}`;
    nextUrl.searchParams.delete("page");
    urls.add(nextUrl.toString());
  }

  return Array.from(urls);
}

function buildYad2AgencyPageUrl(pageUrl: string, page: number): string {
  const parsed = new URL(pageUrl);
  if (page <= 1) parsed.searchParams.delete("page");
  else parsed.searchParams.set("page", String(page));
  return parsed.toString();
}

function extractYad2AgencyItemUrls(html: string, pageUrl: string): string[] {
  const urls = new Set<string>();

  const hrefRegex = /href=["']([^"']*\/realestate\/item\/[^"'#<]+)["']/gi;
  let hrefMatch: RegExpExecArray | null;
  while ((hrefMatch = hrefRegex.exec(html)) !== null) {
    try {
      const absoluteUrl = new URL(hrefMatch[1].replace(/&amp;/g, "&"), pageUrl).toString();
      urls.add(normalizeUrl(absoluteUrl));
    } catch {
      // ignore malformed URLs
    }
  }

  if (urls.size === 0) {
    const absoluteRegex = /https?:\/\/(?:www\.)?yad2\.co\.il\/realestate\/item\/[^"'()\s<]+/gi;
    const absoluteMatches = html.match(absoluteRegex) || [];
    for (const match of absoluteMatches) {
      urls.add(normalizeUrl(match.replace(/&amp;/g, "&")));
    }
  }

  return Array.from(urls);
}

function extractYad2AgencyTotalCount(html: string, listingMode: "forsale" | "rent"): number | null {
  const patterns = listingMode === "rent"
    ? [
        /השכרה\s*\(([\d,]+)\)/u,
        /([\d,]+)\s*נכסים\s*להשכרה/u,
        /([\d,]+)\s*תוצאות/u,
      ]
    : [
        /מכירה\s*\(([\d,]+)\)/u,
        /([\d,]+)\s*נכסים\s*למכירה/u,
        /([\d,]+)\s*תוצאות/u,
      ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    const value = Number(match[1].replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0) return value;
  }

  return null;
}

async function fetchYad2AgencyPageHtml(pageUrl: string): Promise<string> {
  // Yad2 is a JS-rendered SPA — raw fetch only returns ~5 server-rendered items.
  // Use Firecrawl's headless browser to get the fully rendered HTML.
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

  const timeoutMs = 30_000; // 30s hard cap per page — prevents hanging in edge functions

  if (FIRECRAWL_API_KEY) {
    try {
      dlog(`[Yad2] Firecrawl scraping: ${pageUrl}`);

      // Use Promise.race for timeout — AbortController + setTimeout unreliable in Deno edge runtime
      const firecrawlPromise = fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: pageUrl,
          formats: ["html"],
          onlyMainContent: false,
          waitFor: 5000,
        }),
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Firecrawl timeout")), timeoutMs)
      );

      const res = await Promise.race([firecrawlPromise, timeoutPromise]) as Response;

      if (res.ok) {
        const data = await res.json();
        const html = data?.data?.html || data?.html || "";
        if (html.length > 500) {
          const itemCount = (html.match(/\/realestate\/item\//gi) || []).length;
          dlog(`[Yad2] Firecrawl returned ${html.length} chars, ${itemCount} item links`);
          if (itemCount > 0) return html;
          console.warn(`[Yad2] Firecrawl HTML has no item links — ShieldSquare CAPTCHA page likely`);
        } else {
          console.warn(`[Yad2] Firecrawl returned very short HTML (${html.length} chars)`);
        }
      } else {
        const errText = await res.text();
        console.warn(`[Yad2] Firecrawl failed (${res.status}): ${errText.slice(0, 200)}`);
      }
    } catch (e) {
      console.warn(`[Yad2] Firecrawl error:`, e instanceof Error ? e.message : e);
    }
  }

  // Fallback: raw fetch — ShieldSquare likely blocks this too, return "" gracefully
  try {
    const rawPromise = fetch(pageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
      },
    });
    const rawTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Raw fetch timeout")), 10_000)
    );
    const response = await Promise.race([rawPromise, rawTimeout]) as Response;
    if (!response.ok) {
      console.warn(`[Yad2] Raw fetch blocked (${response.status})`);
      return "";
    }
    return await response.text();
  } catch (e) {
    console.warn(`[Yad2] Raw fetch error:`, e instanceof Error ? e.message : e);
    return "";
  }
}

async function runYad2AgencyDiscoverJob(params: {
  jobId: string;
  agencyId: string;
  websiteUrl: string;
  effectiveImportType: "resale" | "rental" | "both";
}) {
  const { jobId, agencyId, websiteUrl, effectiveImportType } = params;
  const sb = supabaseAdmin();

  try {
    dlog(`[Yad2] background discovery started for job ${jobId}: ${websiteUrl} (${effectiveImportType})`);

    const discoveryUrls = getYad2AgencyDiscoveryUrls(websiteUrl, effectiveImportType);
    const discoveredUrls = new Set<string>();
    let totalDiscovered = 0;

    for (const discoveryUrl of discoveryUrls) {
      const listingMode = /\/rent\b/i.test(new URL(discoveryUrl).pathname) ? "rent" : "forsale";
      const firstPageUrl = buildYad2AgencyPageUrl(discoveryUrl, 1);
      const firstPageHtml = await fetchYad2AgencyPageHtml(firstPageUrl);
      const firstPageItems = extractYad2AgencyItemUrls(firstPageHtml, firstPageUrl);

      // If page 1 returned nothing, ShieldSquare is blocking — skip pagination entirely
      if (firstPageItems.length === 0) {
        console.warn(`[Yad2] Page 1 returned 0 items — ShieldSquare blocking, skipping pagination`);
        continue;
      }

      const totalCount = extractYad2AgencyTotalCount(firstPageHtml, listingMode) ?? firstPageItems.length;
      const pageSize = Math.max(firstPageItems.length, 5);
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

      totalDiscovered += totalCount;
      firstPageItems.forEach((url) => discoveredUrls.add(url));

      dlog(`Yad2 agency ${listingMode}: page 1=${firstPageItems.length}, total=${totalCount}, pages=${totalPages}`);

      const PAGE_BATCH_SIZE = 2;
      for (let startPage = 2; startPage <= totalPages; startPage += PAGE_BATCH_SIZE) {
        const pageBatch = Array.from(
          { length: Math.min(PAGE_BATCH_SIZE, totalPages - startPage + 1) },
          (_, index) => startPage + index
        );

        const pageHtmlBatch = await Promise.all(
          pageBatch.map((pageNumber) => fetchYad2AgencyPageHtml(buildYad2AgencyPageUrl(discoveryUrl, pageNumber)))
        );

        pageHtmlBatch.forEach((pageHtml, index) => {
          const pageUrl = buildYad2AgencyPageUrl(discoveryUrl, pageBatch[index]);
          const pageItems = extractYad2AgencyItemUrls(pageHtml, pageUrl);
          dlog(`[Yad2] page ${pageBatch[index]}: ${pageItems.length} items`);
          pageItems.forEach((url) => discoveredUrls.add(url));
        });

        if (startPage + PAGE_BATCH_SIZE <= totalPages) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    const dedupedUrls = Array.from(discoveredUrls);
    dlog(`Yad2 agency HTML discovery found ${dedupedUrls.length} unique listings across ${discoveryUrls.length} page set(s)`);

    // If 0 URLs found, ShieldSquare likely blocked all pages — try Apify fallback
    if (dedupedUrls.length === 0) {
      console.warn(`[Yad2] 0 listings via Firecrawl — trying Apify fallback`);
      const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY");
      if (APIFY_API_KEY) {
        try {
          const apifyResult = await handleYad2Discover({
            agency_id: agencyId,
            website_url: websiteUrl,
            import_type: effectiveImportType,
          });
          if (apifyResult.job_id) {
            // Apify created its own job — mark our Firecrawl job as superseded
            await sb.from("import_jobs").update({
              status: "completed",
              failure_reason: "superseded_by_apify",
            }).eq("id", jobId);
            dlog(`[Yad2] Apify fallback succeeded — job ${apifyResult.job_id} created with ${apifyResult.new_urls} new URLs`);
            return;
          }
        } catch (apifyErr) {
          console.error(`[Yad2] Apify fallback also failed:`, apifyErr);
        }
      }
      // Both failed
      await sb.from("import_jobs").update({
        status: "failed",
        failure_reason: "captcha_blocked",
      }).eq("id", jobId);
      return;
    }

    const knownUrls = await getKnownSourceUrlsForAgency(sb, agencyId);

    const newUrls = dedupedUrls.filter((url) => !knownUrls.has(normalizeUrl(url)));

    if (newUrls.length > 0) {
      const INSERT_BATCH_SIZE = 200;
      for (let i = 0; i < newUrls.length; i += INSERT_BATCH_SIZE) {
        const items = newUrls.slice(i, i + INSERT_BATCH_SIZE).map((url) => ({
          job_id: jobId,
          url,
          status: "pending",
        }));
        const { error: itemsErr } = await sb.from("import_job_items").insert(items);
        if (itemsErr) throw new Error(`Failed to create job items: ${itemsErr.message}`);
      }
    }

    const { error: updateErr } = await sb
      .from("import_jobs")
      .update({
        status: newUrls.length > 0 ? "ready" : "completed",
        total_urls: newUrls.length,
        discovered_urls: dedupedUrls,
        processed_count: 0,
        failed_count: 0,
      })
      .eq("id", jobId);

    if (updateErr) throw new Error(`Failed to finalize import job: ${updateErr.message}`);

    dlog(
      `[Yad2] background discovery finished for job ${jobId}: ${newUrls.length} new URLs, ${dedupedUrls.length} discovered, ${dedupedUrls.length - newUrls.length} existing`
    );
  } catch (err) {
    console.error(`[Yad2] background discovery failed for job ${jobId}:`, err);
    await sb.from("import_jobs").update({ status: "failed" }).eq("id", jobId);
  }
}

async function handleYad2AgencyDiscover(body: any) {
  const { agency_id, website_url, import_type = "resale" } = body;
  if (!agency_id || !website_url) throw new Error("agency_id and website_url required");

  const sb = supabaseAdmin();
  const effectiveImportType = normalizeImportType(import_type);

  const { data: agency, error: agencyErr } = await sb
    .from("agencies")
    .select("id, admin_user_id")
    .eq("id", agency_id)
    .single();
  if (agencyErr || !agency) throw new Error("Agency not found");

  const { data: job, error: jobErr } = await sb
    .from("import_jobs")
    .insert({
      agency_id,
      website_url,
      status: "discovering",
      total_urls: 0,
      discovered_urls: [],
      processed_count: 0,
      failed_count: 0,
      import_type: effectiveImportType,
      source_type: "yad2",
    })
    .select("id")
    .single();
  if (jobErr || !job) throw new Error(`Failed to create import job: ${jobErr?.message || 'Unknown error'}`);

  EdgeRuntime.waitUntil(
    runYad2AgencyDiscoverJob({
      jobId: job.id,
      agencyId: agency_id,
      websiteUrl: website_url,
      effectiveImportType,
    })
  );

  return {
    job_id: job.id,
    total_listings: 0,
    total_discovered: 0,
    new_urls: 0,
    skipped_existing: 0,
    started_async: true,
  };
}

async function handleYad2Discover(body: any) {
  const { agency_id, website_url, import_type = "resale" } = body;
  if (!agency_id || !website_url) throw new Error("agency_id and website_url required");

  const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY");
  if (!APIFY_API_KEY) throw new Error("APIFY_API_KEY not configured. Add it in Settings → Secrets.");

  const sb = supabaseAdmin();

  // Validate agency
  const { data: agency, error: agencyErr } = await sb
    .from("agencies").select("id, admin_user_id").eq("id", agency_id).single();
  if (agencyErr || !agency) throw new Error("Agency not found");

  // Start Apify Yad2 scraper actor run
  // Using the amit123/yadscraper Apify actor for Yad2 listings
  const actorId = "gWicCzGByyQlba0Ql";
  dlog(`Starting Apify actor ${actorId} for URL: ${website_url}`);

  const runRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start_urls: [{ url: website_url }],
      maxPagesPerSearch: 10,
      maxRequestsPerCrawl: 1000,
    }),
  });

  if (!runRes.ok) {
    const errData = await runRes.text();
    throw new Error(`Apify actor start failed (${runRes.status}): ${errData.slice(0, 200)}`);
  }

  const runData = await runRes.json();
  const runId = runData.data?.id;
  if (!runId) throw new Error("Apify run did not return an ID");

  // Poll for completion (max 5 minutes)
  const maxWait = 300_000;
  const pollInterval = 5_000;
  const startTime = Date.now();
  let runStatus = "RUNNING";

  while (Date.now() - startTime < maxWait && runStatus === "RUNNING") {
    await delay(pollInterval);
    const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`);
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      runStatus = statusData.data?.status || "RUNNING";
    }
  }

  if (runStatus !== "SUCCEEDED") {
    throw new Error(`Apify run ${runStatus === "RUNNING" ? "timed out" : `failed with status: ${runStatus}`}`);
  }

  // Fetch results from dataset
  const datasetId = runData.data?.defaultDatasetId;
  const resultsRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}&format=json&limit=200`
  );
  if (!resultsRes.ok) throw new Error("Failed to fetch Apify results");
  const results: any[] = await resultsRes.json();

  if (results.length === 0) {
    return { job_id: null, total_listings: 0, total_discovered: 0, new_urls: 0, skipped_existing: 0 };
  }

  dlog(`Apify returned ${results.length} Yad2 listings`);

  // Gather known URLs for dedup
  const knownUrls = await getKnownSourceUrlsForAgency(sb, agency_id);

  // Filter out known URLs
  const newResults = results.filter(r => {
    const url = r.url || r.link || "";
    return url && !knownUrls.has(normalizeUrl(url));
  });

  if (newResults.length === 0) {
    return { job_id: null, total_listings: 0, total_discovered: results.length, new_urls: 0, skipped_existing: results.length };
  }

  // Create job
  const { data: job, error: jobErr } = await sb
    .from("import_jobs")
    .insert({
      agency_id, website_url, status: "ready",
      total_urls: newResults.length,
      discovered_urls: newResults.map((r: any) => r.url || r.link || ""),
      import_type, source_type: "yad2",
    })
    .select("id").single();
  if (jobErr) throw new Error(`Failed to create import job: ${jobErr.message}`);

  // Create job items with pre-extracted data from Yad2
  const items = newResults.map((r: any) => ({
    job_id: job.id,
    url: r.url || r.link || `yad2-${crypto.randomUUID()}`,
    status: "pending",
    extracted_data: normalizeYad2Result(r),
  }));
  const { error: itemsErr } = await sb.from("import_job_items").insert(items);
  if (itemsErr) throw new Error(`Failed to create job items: ${itemsErr.message}`);

  return {
    job_id: job.id, total_listings: newResults.length,
    total_discovered: results.length, new_urls: newResults.length,
    skipped_existing: results.length - newResults.length,
  };
}

function normalizeYad2Result(raw: any): Record<string, any> {
  // Map Yad2 structured fields to our schema
  const price = parseFloat(String(raw.price || "0").replace(/[^\d.]/g, "")) || 0;
  const rooms = parseInt(raw.rooms || raw.roomsCount || "0") || 0;
  const bedrooms = Math.max(0, rooms - 1);
  const sizeSqm = parseInt(raw.squareMeter || raw.size || raw.square_meters || "0") || null;
  const floor = raw.floor != null ? parseInt(raw.floor) : null;

  // City mapping
  let city = raw.city || raw.cityName || raw.city_name || "";
  const matchedCity = matchSupportedCity(city);

  // Extract coordinates from Apify result (avoids geocoding API call)
  const rawLat = parseFloat(raw.latitude || raw.lat || raw.coordinates?.latitude || raw.coordinates?.lat || "");
  const rawLng = parseFloat(raw.longitude || raw.lng || raw.lon || raw.coordinates?.longitude || raw.coordinates?.lng || raw.coordinates?.lon || "");
  const hasCoords = !isNaN(rawLat) && !isNaN(rawLng) && rawLat >= 29 && rawLat <= 34 && rawLng >= 34 && rawLng <= 36;

  return {
    listing_category: "property",
    title: raw.title || raw.description?.slice(0, 80) || "",
    description: raw.description || raw.info_text || "",
    price,
    currency: "ILS",
    bedrooms,
    bathrooms: parseInt(raw.bathrooms || "1") || 1,
    size_sqm: sizeSqm,
    address: raw.address || raw.street || "",
    city: matchedCity || city,
    neighborhood: raw.neighborhood || raw.area || "",
    property_type: mapYad2PropertyType(raw.property_type || raw.type || ""),
    listing_status: (raw.dealType === "rental" || raw.ad_type === "rental") ? "for_rent" : "for_sale",
    floor: floor != null && !isNaN(floor) ? floor : null,
    total_floors: raw.total_floors ? parseInt(raw.total_floors) : null,
    features: raw.features || [],
    parking: raw.parking ? parseInt(raw.parking) : 0,
    condition: raw.condition || null,
    _photo_count: (raw.images || raw.imageUrls || raw.photos || []).filter((u: any) => typeof u === "string").length,
    _source: "yad2",
    _has_structured_data: true,
    _yad2_latitude: hasCoords ? rawLat : null,
    _yad2_longitude: hasCoords ? rawLng : null,
  };
}

function mapYad2PropertyType(type: string): string {
  const t = type.toLowerCase();
  // Non-residential types first (more specific matches)
  if (t.includes("חניה") || t.includes("parking")) return "parking";
  if (t.includes("מחסן") || t.includes("storage")) return "storage";
  if (t.includes("בניין") || t.includes("building")) return "building";
  if (t.includes("חקלאי") || t.includes("נחלה") || t.includes("agricultural")) return "agricultural_estate";
  if (t.includes("דיור מוגן") || t.includes("assisted")) return "assisted_living";
  if (t.includes("מגרש") || t.includes("land")) return "land";
  // Residential types
  if (t.includes("דירת גן") || t.includes("garden")) return "garden_apartment";
  if (t.includes("פנטהאוז") || t.includes("penthouse")) return "penthouse";
  if (t.includes("דופלקס") || t.includes("duplex")) return "duplex";
  if (t.includes("בית") || t.includes("וילה") || t.includes("house") || t.includes("villa")) return "house";
  if (t.includes("קוטג") || t.includes("cottage")) return "cottage";
  if (t.includes("דירה") || t.includes("apartment")) return "apartment";
  return "apartment";
}

// [REMOVED] processYad2Item — dead code, all items now route through processOneItem

// ─── MADLAN ADAPTER ─────────────────────────────────────────────────────────

/**
 * Madlan URL patterns for agency listings:
 * - Office profile page: https://www.madlan.co.il/agentsOffice/re_office_{ID}
 *   This is the canonical page that shows all listings for an office.
 *   It renders via JS and contains listing links in the rendered DOM.
 * - Agent page: https://www.madlan.co.il/agent/re_agent_{ID}
 * - Individual listing: https://www.madlan.co.il/nadlan/listing/{ID}
 *
 * IMPORTANT: The /agentsOffice/ path is the correct listing-bearing route.
 * Do NOT rewrite it to /for-sale/israel--office--{SLUG} — that produces
 * a generic marketplace page with zero listing links.
 * Sale/rent filtering is done via the ?dealType= query parameter.
 */

function isMadlanAgencyUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes("madlan");
  } catch {
    return false;
  }
}

/**
 * Normalize a raw Madlan source URL into discovery URLs.
 * Accepts:
 *   /agentsOffice/re_office_*
 *   /for-sale/agentsOffice/re_office_*   (strips the /for-sale/ prefix)
 *   /for-rent/agentsOffice/re_office_*   (strips the /for-rent/ prefix)
 *   /agent/re_agent_*
 * Returns the canonical office URL(s). For /agentsOffice/ pages, the page
 * already shows all listings — no query params needed for discovery.
 * We fetch the raw office URL first, then optionally add dealType filter.
 */
function getMadlanDiscoveryUrls(rawUrl: string, importType: string): string[] {
  const urls = new Set<string>();
  try {
    const parsed = new URL(rawUrl);

    // Strip any /for-sale/ or /for-rent/ prefix from path — the office page handles both
    let cleanPath = parsed.pathname
      .replace(/^\/(for-sale|for-rent)\//i, "/")
      .replace(/\/+$/, "");

    // Primary: use the clean office page URL without query params (shows all listings)
    const primary = new URL(rawUrl);
    primary.pathname = cleanPath;
    primary.search = "";
    urls.add(primary.toString());

    // If import type is restricted, also try with dealType filter as fallback
    const normalizedType = normalizeImportType(importType);
    if (normalizedType !== "both") {
      const filtered = new URL(primary.toString());
      filtered.searchParams.set("dealType", normalizedType === "rental" ? "rent" : "forsale");
      urls.add(filtered.toString());
    }
  } catch {
    urls.add(rawUrl);
  }
  return Array.from(urls);
}

function buildMadlanPageUrl(baseUrl: string, page: number): string {
  try {
    const u = new URL(baseUrl);
    if (page <= 1) {
      u.searchParams.delete("page");
    } else {
      u.searchParams.set("page", String(page));
    }
    return u.toString();
  } catch {
    return baseUrl;
  }
}

function extractMadlanListingUrls(html: string, pageUrl: string): string[] {
  const urls = new Set<string>();
  // Madlan individual listing URLs look like:
  // /nadlan/listing/XXXXXXXX or /listing/XXXXXXXX
  const patterns = [
    /href=["']([^"']*\/nadlan\/listing\/[\w-]+)["']/gi,
    /href=["']([^"']*\/listing\/[\w-]+)["']/gi,
    // Also match nadlan detail pages like /nadlan/for-sale/apartment-{id}
    /href=["']([^"']*\/nadlan\/(?:for-sale|for-rent)\/[^"']+)["']/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      try {
        const absolute = new URL(match[1], pageUrl).toString();
        // Only keep madlan.co.il listing or nadlan detail URLs
        if (absolute.includes("madlan.co.il") && (absolute.includes("/listing/") || /\/nadlan\/(?:for-sale|for-rent)\//.test(absolute))) {
          urls.add(normalizeUrl(absolute));
        }
      } catch { /* ignore */ }
    }
  }

  // Also try JSON data embedded in __NEXT_DATA__ or window.__STATE__
  const jsonPatterns = [
    /"url":"(https?:\/\/www\.madlan\.co\.il\/(?:nadlan\/)?(?:listing|for-sale|for-rent)\/[^"]+)"/g,
    /"canonicalUrl":"(https?:\/\/www\.madlan\.co\.il\/(?:nadlan\/)?(?:listing|for-sale|for-rent)\/[^"]+)"/g,
    // Match listing IDs in JSON objects (common in __NEXT_DATA__)
    /"listingId":"(\w+)"/g,
  ];
  for (const pattern of jsonPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      try {
        if (match[0].startsWith('"listingId"')) {
          // Convert listingId to a full URL
          urls.add(normalizeUrl(`https://www.madlan.co.il/nadlan/listing/${match[1]}`));
        } else {
          urls.add(normalizeUrl(match[1]));
        }
      } catch { /* ignore */ }
    }
  }

  return Array.from(urls);
}

/**
 * Detect whether a fetched Madlan page is a valid office/agent page with listings,
 * or a generic shell / error page.
 */
function isMadlanValidOfficePage(html: string): { valid: boolean; reason: string } {
  if (!html || html.length < 500) {
    return { valid: false, reason: "Empty or too-short page response" };
  }
  // Bot/captcha block detection
  if (html.includes("משהו בדפדפן שלך גרם לנו לחשוב שאתה רובוט") || 
      html.includes("ShieldSquare") || 
      html.includes("distil_r_captcha")) {
    return { valid: false, reason: "Madlan bot/captcha block" };
  }
  // Check for signs this is a real office page:
  // - Contains listing-related content (Hebrew property terms, listing links, price data)
  const listingSignals = [
    /\/listing\//i,
    /\/nadlan\//i,
    /listingId/i,
    /totalCount/i,
    /נכסים/u,        // "properties"
    /דירות/u,        // "apartments"
    /למכירה/u,       // "for sale"
    /להשכרה/u,       // "for rent"
    /חדרים/u,        // "rooms"
    /"price"/i,
    /₪/,
  ];
  const signalCount = listingSignals.filter(p => p.test(html)).length;
  if (signalCount >= 2) {
    return { valid: true, reason: `Office page with ${signalCount} listing signals` };
  }
  // If the page has the SPA shell but barely any content
  if (html.includes('<div id="root"></div>') && html.length < 2000) {
    return { valid: false, reason: "Empty SPA shell - JS did not render" };
  }
  return { valid: false, reason: `Insufficient listing signals (${signalCount}/11) — likely generic or error page` };
}

function extractMadlanTotalCount(html: string): number | null {
  // Madlan shows counts like "נמצאו 47 דירות" or in JSON data
  const patterns = [
    /נמצאו\s+(\d[\d,]*)/u,
    /(\d[\d,]*)\s*(?:דירות|נכסים|תוצאות)/u,
    /"totalCount":(\d+)/,
    /"total":(\d+)/,
    /"count":(\d+)/,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) {
      const n = parseInt(m[1].replace(/,/g, ""));
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

// Hebrew city name mapping for Madlan Apify actor
const CITY_HEBREW_MAP: Record<string, string> = {
  "Tel Aviv": "תל אביב",
  "Jerusalem": "ירושלים",
  "Haifa": "חיפה",
  "Beer Sheva": "באר שבע",
  "Be'er Sheva": "באר שבע",
  "Netanya": "נתניה",
  "Ashdod": "אשדוד",
  "Ashkelon": "אשקלון",
  "Petah Tikva": "פתח תקווה",
  "Rishon LeZion": "ראשון לציון",
  "Ramat Gan": "רמת גן",
  "Herzliya": "הרצליה",
  "Ra'anana": "רעננה",
  "Raanana": "רעננה",
  "Kfar Saba": "כפר סבא",
  "Hod HaSharon": "הוד השרון",
  "Modi'in": "מודיעין",
  "Modiin": "מודיעין",
  "Rehovot": "רחובות",
  "Givatayim": "גבעתיים",
  "Bat Yam": "בת ים",
  "Holon": "חולון",
  "Beit Shemesh": "בית שמש",
  "Hadera": "חדרה",
  "Nahariya": "נהריה",
  "Acre": "עכו",
  "Tiberias": "טבריה",
  "Eilat": "אילת",
  "Zichron Yaakov": "זכרון יעקב",
  "Pardes Hanna": "פרדס חנה",
  "Caesarea": "קיסריה",
  "Givat Shmuel": "גבעת שמואל",
  "Kiryat Ono": "קריית אונו",
  "Efrat": "אפרת",
  "Efrat Gush Etzion": "אפרת",
  "Shoham": "שוהם",
  "Yavne": "יבנה",
  "Lod": "לוד",
  "Ramla": "רמלה",
  "Carmiel": "כרמיאל",
  "Yokneam": "יקנעם",
  "Afula": "עפולה",
  "Karmiel": "כרמיאל",
  "Nesher": "נשר",
  "Tirat Carmel": "טירת כרמל",
  "Or Yehuda": "אור יהודה",
  "Rosh HaAyin": "ראש העין",
  "Ariel": "אריאל",
  "Dimona": "דימונה",
  "Arad": "ערד",
  "Sderot": "שדרות",
  "Kiryat Gat": "קריית גת",
  "Kiryat Motzkin": "קריית מוצקין",
  "Kiryat Bialik": "קריית ביאליק",
  "Kiryat Yam": "קריית ים",
  "Kiryat Ata": "קריית אתא",
  "Kiryat Shmona": "קריית שמונה",
  "Nazareth Illit": "נצרת עילית",
  "Nof HaGalil": "נוף הגליל",
  "Ma'ale Adumim": "מעלה אדומים",
  "Binyamina": "בנימינה",
};

function toHebrewCity(englishCity: string): string {
  // Direct match
  if (CITY_HEBREW_MAP[englishCity]) return CITY_HEBREW_MAP[englishCity];
  // Case-insensitive match
  const lower = englishCity.toLowerCase();
  for (const [key, val] of Object.entries(CITY_HEBREW_MAP)) {
    if (key.toLowerCase() === lower) return val;
  }
  // Already Hebrew? Return as-is
  if (/[\u0590-\u05FF]/.test(englishCity)) return englishCity;
  // No match — return original (Apify may still handle it)
  return englishCity;
}

async function fetchMadlanDetailHtml(url: string): Promise<string> {
  try {
    const res = await fetchWithTimeout(url, { headers: { Accept: "text/html,*/*", "User-Agent": "Mozilla/5.0" } }, 15_000);
    return res.ok ? await res.text() : "";
  } catch { return ""; }
}

async function inspectMadlanActiveOfficePage(url: string): Promise<{ activeCount: number; saleCount: number; rentCount: number; cardUrls: string[]; cardImages: string[] }> {
  const html = await fetchMadlanDetailHtml(url);
  const text = textFromHtmlFragment(html);
  const numberBefore = (labels: RegExp[]) => {
    for (const label of labels) {
      const m = text.match(new RegExp(`(\\d{1,4})\\s*[·•-]?\\s*${label.source}`, "i"));
      if (m) return parseInt(m[1], 10) || 0;
    }
    return 0;
  };
  const activeMatch = text.match(/(\d{1,4})\s*(?:Active properties|נכסים פעילים)/i);
  const saleCount = numberBefore([/Residences? for sale/i, /דירות למכירה/i, /נכסים למכירה/i]);
  const rentCount = numberBefore([/Residences? for rent/i, /דירות להשכרה/i, /נכסים להשכרה/i]);
  const cardUrls = Array.from(new Set((html.match(/https?:\/\/(?:www\.)?madlan\.co\.il\/(?:listings|properties|forsale|rent)[^"'\s<>]*/gi) || []).map(normalizeUrl)));
  const cardImages = extractImagesFromHtml(html, url).filter((img) => /madlan|img|image|cloud|cdn/i.test(img)).slice(0, 200);
  return { activeCount: activeMatch ? parseInt(activeMatch[1], 10) || saleCount + rentCount : saleCount + rentCount, saleCount, rentCount, cardUrls, cardImages };
}

function isMadlanItemLiveAndAgencyScoped(item: any, agencyName?: string | null, officeUrl?: string): boolean {
  const statusText = String(item.status || item.listingStatus || item.state || item.availability || item.transactionStatus || "").toLowerCase();
  if (/sold|rented|inactive|archived|expired|history|transaction|נמכר|הושכר/.test(statusText)) return false;
  const url = String(item.url || "");
  if (url && !/madlan\.co\.il/i.test(url)) return false;
  const ownerText = `${item.agencyName || ""} ${item.officeName || ""} ${item.agentName || ""} ${item.brokerName || ""}`.toLowerCase();
  const expected = String(agencyName || "").toLowerCase().replace(/[^a-z0-9א-ת]+/g, " ").trim();
  const hasOfficeRef = officeUrl && JSON.stringify(item).includes(String(officeUrl).split("?")[0]);
  if (expected && ownerText && !ownerText.includes(expected.split(" ")[0]) && !hasOfficeRef) return false;
  return true;
}

async function runMadlanAgencyDiscoverJob(params: {
  jobId: string;
  agencyId: string;
  websiteUrl: string;
  effectiveImportType: "resale" | "rental" | "both";
}) {
  const { jobId, agencyId, websiteUrl, effectiveImportType } = params;
  const sb = supabaseAdmin();
  const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY");

  try {
    dlog(`[Madlan/Apify] background discovery started for job ${jobId}: ${websiteUrl}`);

    const activeGate = await inspectMadlanActiveOfficePage(websiteUrl);
    const expectedActive = effectiveImportType === "rental"
      ? activeGate.rentCount
      : effectiveImportType === "resale"
        ? activeGate.saleCount
        : activeGate.activeCount;
    if (expectedActive > 0) {
      await sb.from("import_jobs").update({
        failure_reason: JSON.stringify({
          source: "madlan",
          gate: "active_count_detected",
          expected_active: expectedActive,
          public_active_count: activeGate.activeCount,
          public_sale_count: activeGate.saleCount,
          public_rent_count: activeGate.rentCount,
          public_card_urls: activeGate.cardUrls.length,
          public_card_images: activeGate.cardImages.length,
        }),
      }).eq("id", jobId);
    }

    if (!APIFY_API_KEY) {
      const failReason = "APIFY_API_KEY not configured — required for Madlan scraping";
      console.error(`[Madlan/Apify] ${failReason}`);
      await sb.from("import_jobs").update({ status: "failed" }).eq("id", jobId);
      await sb.from("agency_sources")
        .update({ last_failure_reason: failReason })
        .eq("agency_id", agencyId).eq("source_type", "madlan");
      return;
    }

    // Get the agency's cities to know what to scrape
    const { data: agency } = await sb
      .from("agencies")
      .select("cities_covered, name")
      .eq("id", agencyId)
      .single();

    const cities = agency?.cities_covered;
    if (!cities || cities.length === 0) {
      const failReason = "Agency has no cities_covered set — cannot determine which city to scrape on Madlan";
      console.warn(`[Madlan/Apify] ${failReason}`);
      await sb.from("import_jobs").update({ status: "failed" }).eq("id", jobId);
      await sb.from("agency_sources")
        .update({ last_failure_reason: failReason })
        .eq("agency_id", agencyId).eq("source_type", "madlan");
      return;
    }

    // Translate city names to Hebrew for Madlan Apify actor
    const hebrewCities = cities.map((c: string) => toHebrewCity(c));
    const cityStr = hebrewCities.join(", ");
    const dealTypes = effectiveImportType === "both"
      ? ["buy", "rent"]
      : [effectiveImportType === "rental" ? "rent" : "buy"];

    dlog(`[Madlan/Apify] Scraping cities: ${cityStr} (from: ${cities.join(", ")}), dealTypes: ${dealTypes.join(",")}`);

    // Get existing source_urls for dedup
    const { data: existingProps } = await sb
      .from("properties")
      .select("source_url")
      .not("source_url", "is", null)
      .like("source_url", "%madlan.co.il%");
    const knownUrls = new Set<string>();
    if (existingProps) {
      for (const p of existingProps) {
        if (p.source_url) knownUrls.add(normalizeUrl(p.source_url));
      }
    }

    // Find or create a default agent for this agency
    const { data: agents } = await sb
      .from("agents")
      .select("id")
      .eq("agency_id", agencyId)
      .limit(1);
    const agentId = agents?.[0]?.id || null;

    let totalDiscovered = 0;
    let totalNew = 0;
    let totalInserted = 0;
    let totalMerged = 0;
    let totalRejectedInactive = 0;
    let totalImageFailures = 0;
    const allDiscoveredUrls: string[] = [];

    for (const dealType of dealTypes) {
      dlog(`[Madlan/Apify] Running actor for ${cityStr} / ${dealType}`);

      // Call Apify actor synchronously (returns dataset items directly)
      // Timeout: 120s for the sync call
          const dealExpected = dealType === "rent" ? activeGate.rentCount : activeGate.saleCount;
          const actorInput = {
        city: cityStr,
        dealType,
            officeUrl: websiteUrl,
            agentOfficeUrl: websiteUrl,
            maxItems: dealExpected > 0 ? Math.min(Math.max(dealExpected + 5, 10), 60) : 60,
      };

      let items: any[] = [];
      try {
        const res = await fetch(
          `https://api.apify.com/v2/acts/swerve~madlan-scraper/run-sync-get-dataset-items?token=${APIFY_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(actorInput),
            signal: AbortSignal.timeout(180_000), // 3 min timeout
          }
        );

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[Madlan/Apify] Actor failed (${res.status}): ${errText.slice(0, 300)}`);
          continue;
        }

        items = await res.json();
        dlog(`[Madlan/Apify] Actor returned ${items.length} items for ${cityStr}/${dealType}`);
      } catch (e) {
        console.error(`[Madlan/Apify] Actor call error:`, e);
        continue;
      }

      totalDiscovered += items.length;

      if (dealExpected > 0 && items.length > Math.max(dealExpected + 10, Math.ceil(dealExpected * 1.5))) {
        totalRejectedInactive += items.length;
        console.warn(`[Madlan/ActiveGate] Blocked ${dealType}: public active=${dealExpected}, actor returned=${items.length}`);
        continue;
      }

      // Process each item
      for (const madlanItem of items) {
        try {
          const listingUrl = madlanItem.url || `https://www.madlan.co.il/listings/${madlanItem.id}`;
          allDiscoveredUrls.push(listingUrl);

          if (!isMadlanItemLiveAndAgencyScoped(madlanItem, agency?.name, websiteUrl)) {
            totalRejectedInactive++;
            continue;
          }

          // Dedup check
          if (knownUrls.has(normalizeUrl(listingUrl))) continue;
          knownUrls.add(normalizeUrl(listingUrl));
          totalNew++;

          // Map Madlan fields to our property schema
          const listingStatus = dealType === "rent" ? "for_rent" : "for_sale";
          const rooms = madlanItem.rooms || null;
          const bedrooms = rooms ? Math.max(0, Math.floor(rooms) - 1) : null;

          // Build features array
          const features: string[] = [];
          if (madlanItem.hasElevator) features.push("elevator");
          if (madlanItem.hasBalcony) features.push("balcony");
          if (madlanItem.hasSecureRoom) features.push("mamad");
          if (madlanItem.parking && madlanItem.parking > 0) features.push("parking");
          if (madlanItem.hasStorage) features.push("storage");
          if (madlanItem.hasAirConditioner || madlanItem.hasAirConditioning) features.push("air_conditioning");
          if (madlanItem.isFurnished) features.push("furnished");

          const city = madlanItem.city || cities[0];
          const address = madlanItem.address || (madlanItem.streetName ? `${madlanItem.streetName} ${madlanItem.streetNumber || ""}`.trim() : "");

          // Build listing object for title/description generation
          const listing = {
            property_type: "apartment",
            listing_status: listingStatus,
            price: madlanItem.price || 0,
            city,
            neighborhood: madlanItem.neighbourhood || null,
            bedrooms,
            source_rooms: rooms,
            size_sqm: madlanItem.areaSqm || null,
            address,
            floor: madlanItem.floor || null,
            total_floors: madlanItem.totalFloors || madlanItem.total_floors || null,
            bathrooms: madlanItem.bathrooms || madlanItem.bathroomCount || null,
            condition: madlanItem.condition || null,
            parking: madlanItem.parking || 0,
            ac_type: madlanItem.hasCentralAir || madlanItem.centralAir ? "central" : (madlanItem.hasAirConditioner || madlanItem.hasAirConditioning ? "split" : null),
            is_furnished: madlanItem.isFurnished === true,
            is_accessible: madlanItem.isAccessible === true,
            entry_date: madlanItem.entryDate || madlanItem.entry_date || null,
            vaad_bayit_monthly: madlanItem.vaadBayit || madlanItem.houseCommittee || null,
            image_urls: madlanItem.images || madlanItem.photos || madlanItem.imageUrls || madlanItem.media || [],
          };

          const title = generateListingTitle(listing);
          const description = generateListingDescription(listing);

          // Geocode the address
          let latitude: number | null = null;
          let longitude: number | null = null;
          if (address && city) {
            try {
              const coords = await geocodeWithRateLimit(address, city, madlanItem.neighbourhood);
              if (coords) { latitude = coords.lat; longitude = coords.lng; }
            } catch { /* skip geocoding errors */ }
          }

          // Simple confidence score for structured Apify data
          const confidenceScore = Math.min(100, 50
            + (madlanItem.price ? 15 : 0)
            + (rooms ? 10 : 0)
            + (madlanItem.areaSqm ? 10 : 0)
            + (address ? 10 : 0)
            + (madlanItem.neighbourhood ? 5 : 0)
          );

          let detailHtml = "";
          if (!flattenImageCandidates(listing.image_urls).length) {
            detailHtml = await fetchMadlanDetailHtml(listingUrl);
          }
          const madlanImages = await collectAllowedSourceImages("madlan", listing, null, detailHtml, listingUrl, sb, jobId);
          if (madlanImages.length === 0) totalImageFailures++;

          let existingMatch: any = null;
          if (address && city) {
            const normalizedAddr = normalizeAddressForDedup(address);
            const addrPattern = buildAddressQueryPattern(normalizedAddr);
            if (normalizedAddr.length > 0) {
              const { data: byAddress } = await sb
                .from("properties")
                .select("id, price, size_sqm, bedrooms, bathrooms, source_rooms, images, description, address, floor, total_floors, features, merged_source_urls, source_url, data_quality_score, neighborhood, import_source, field_source_map, parking, condition, ac_type, entry_date, vaad_bayit_monthly, is_furnished, is_accessible")
                .ilike("address", addrPattern)
                .ilike("city", String(city).trim())
                .not("import_source", "is", null)
                .limit(1);
              existingMatch = byAddress?.[0] || null;
            }
          }
          if (!existingMatch && city && bedrooms != null && madlanItem.areaSqm && madlanItem.price) {
            const { data: byFacts } = await sb
              .from("properties")
              .select("id, price, size_sqm, bedrooms, bathrooms, source_rooms, images, description, address, floor, total_floors, features, merged_source_urls, source_url, data_quality_score, neighborhood, import_source, field_source_map, parking, condition, ac_type, entry_date, vaad_bayit_monthly, is_furnished, is_accessible")
              .ilike("city", String(city).trim())
              .eq("bedrooms", Math.floor(bedrooms))
              .gte("size_sqm", Number(madlanItem.areaSqm) - 5)
              .lte("size_sqm", Number(madlanItem.areaSqm) + 5)
              .gte("price", Number(madlanItem.price) * 0.90)
              .lte("price", Number(madlanItem.price) * 1.10)
              .not("import_source", "is", null)
              .limit(1);
            existingMatch = byFacts?.[0] || null;
          }

          if (existingMatch) {
            const fieldSourceMap: Record<string, string> = (existingMatch.field_source_map as any) || {};
            const mergedUrls: string[] = Array.isArray(existingMatch.merged_source_urls)
              ? [...existingMatch.merged_source_urls]
              : (existingMatch.source_url ? [existingMatch.source_url] : []);
            if (!mergedUrls.includes(listingUrl)) mergedUrls.push(listingUrl);
            const patch: Record<string, any> = { merged_source_urls: mergedUrls, source_last_checked_at: new Date().toISOString() };
            const madlanFillFields: Array<[string, any]> = [
              ["price", listing.price || null], ["size_sqm", listing.size_sqm || null], ["bedrooms", bedrooms],
              ["bathrooms", listing.bathrooms != null ? Math.floor(listing.bathrooms) : null], ["source_rooms", rooms],
              ["floor", listing.floor ?? null], ["total_floors", listing.total_floors ?? null], ["parking", listing.parking ?? null],
              ["condition", listing.condition || null], ["ac_type", listing.ac_type || null], ["entry_date", sanitizeEntryDate(listing.entry_date)],
              ["vaad_bayit_monthly", listing.vaad_bayit_monthly ?? null], ["is_furnished", listing.is_furnished === true ? true : null],
              ["is_accessible", listing.is_accessible === true ? true : null], ["neighborhood", listing.neighborhood || null],
            ];
            for (const [field, incomingVal] of madlanFillFields) {
              const existingVal = existingMatch[field];
              if (incomingVal != null && (existingVal == null || existingVal === "" || existingVal === 0 || existingVal === false)) {
                patch[field] = incomingVal;
                fieldSourceMap[field] = "madlan";
              }
            }
            if (description && (!existingMatch.description || description.length > existingMatch.description.length)) {
              patch.description = description;
              fieldSourceMap.description = "madlan";
            }
            if (features.length) {
              patch.features = [...new Set([...(Array.isArray(existingMatch.features) ? existingMatch.features : []), ...features])];
              fieldSourceMap.features = "madlan";
            }
            const existingImages = Array.isArray(existingMatch.images) ? existingMatch.images : [];
            if (existingImages.length === 0 && madlanImages.length > 0) {
              patch.images = madlanImages;
              fieldSourceMap.images = "madlan_fallback";
            }
            patch.field_source_map = fieldSourceMap;
            await sb.from("properties").update(patch).eq("id", existingMatch.id);
            totalMerged++;
            continue;
          }

          const { error: propErr } = await sb
            .from("properties")
            .insert({
              agent_id: agentId,
              title,
              description: description || null,
              property_type: "apartment",
              listing_status: listingStatus,
              price: madlanItem.price || 0,
              currency: "ILS",
              address: address ? normalizeAddressForStorage(address) : "",
              city,
              neighborhood: madlanItem.neighbourhood || null,
              latitude, longitude,
              bedrooms,
              bathrooms: listing.bathrooms != null ? Math.floor(listing.bathrooms) : null,
              source_rooms: rooms,
              size_sqm: madlanItem.areaSqm || null,
              floor: madlanItem.floor ? parseInt(madlanItem.floor) || null : null,
              total_floors: listing.total_floors ? parseInt(String(listing.total_floors)) || null : null,
              features,
              parking: madlanItem.parking || 0,
              condition: madlanItem.condition || null,
              ac_type: listing.ac_type || null,
              entry_date: sanitizeEntryDate(listing.entry_date),
              vaad_bayit_monthly: listing.vaad_bayit_monthly ?? null,
              is_furnished: listing.is_furnished ?? false,
              is_accessible: listing.is_accessible ?? false,
              images: madlanImages.length > 0 ? madlanImages : null,
              // Always import as draft — agency owner must review before going live
              is_published: false,
              is_featured: false,
              views_count: 0,
              verification_status: "pending_review",
              primary_agency_id: agencyId,
              claimed_by_agency_id: agencyId,
              import_source: "madlan",
              source_url: listingUrl,
              data_quality_score: confidenceScore,
              location_confidence: address?.length > 3 ? "exact" : madlanItem.neighbourhood ? "neighborhood" : "city",
              is_claimed: false,
              source_status: "active",
              source_last_checked_at: new Date().toISOString(),
              field_source_map: {
                price: "madlan", size_sqm: "madlan", bedrooms: "madlan", bathrooms: "madlan", source_rooms: "madlan",
                floor: "madlan", total_floors: "madlan", parking: "madlan", condition: "madlan", ac_type: "madlan",
                entry_date: "madlan", vaad_bayit_monthly: "madlan", is_furnished: "madlan", is_accessible: "madlan",
                neighborhood: "madlan", description: "madlan", features: "madlan", ...(madlanImages.length > 0 ? { images: "madlan_fallback" } : {}),
              },
            });

          if (propErr) {
            console.warn(`[Madlan/Apify] Insert failed for ${listingUrl}: ${propErr.message}`);
          } else {
            totalInserted++;
          }
        } catch (itemErr) {
          console.warn(`[Madlan/Apify] Error processing item:`, itemErr);
        }
      }

      // Update heartbeat between deal types
      await sb.from("import_jobs").update({
        last_heartbeat: new Date().toISOString(),
      }).eq("id", jobId);
    }

    if (expectedActive > 0 && totalNew > Math.max(expectedActive + 10, Math.ceil(expectedActive * 1.5))) {
      const reason = { source: "madlan", blocked: true, reason: "active_count_mismatch", expected_active: expectedActive, discovered: totalDiscovered, new: totalNew, rejected_inactive: totalRejectedInactive };
      await sb.from("import_jobs").update({ status: "failed", total_urls: 0, discovered_urls: allDiscoveredUrls.slice(0, 500), processed_count: 0, failed_count: totalNew, failure_reason: JSON.stringify(reason) }).eq("id", jobId);
      await sb.from("agency_sources").update({ last_failure_reason: `Blocked: Madlan reports ${expectedActive} active listings but ${totalNew} candidates were discovered`, last_sync_listings_found: expectedActive, last_synced_at: new Date().toISOString() }).eq("agency_id", agencyId).eq("source_type", "madlan");
      return;
    }

    dlog(`[Madlan/Apify] Summary: ${totalDiscovered} discovered, ${totalNew} new, ${totalInserted} inserted, ${totalMerged} merged, ${totalRejectedInactive} rejected`);

    // Update job
    await sb.from("import_jobs").update({
      status: totalInserted > 0 ? "completed" : (totalDiscovered > 0 ? "completed" : "failed"),
      total_urls: totalNew,
      discovered_urls: allDiscoveredUrls.slice(0, 500), // cap stored URLs
      processed_count: totalInserted + totalMerged,
      failed_count: totalNew - totalInserted - totalMerged,
      failure_reason: JSON.stringify({ source: "madlan", expected_active: expectedActive || null, public_active_count: activeGate.activeCount || null, public_sale_count: activeGate.saleCount || null, public_rent_count: activeGate.rentCount || null, discovered: totalDiscovered, new: totalNew, inserted: totalInserted, merged: totalMerged, rejected_inactive: totalRejectedInactive, image_failures: totalImageFailures }),
    }).eq("id", jobId);

    // Update agency source
    await sb.from("agency_sources")
      .update({
        last_failure_reason: totalDiscovered === 0 ? "Apify actor returned 0 results" : null,
        last_sync_listings_found: totalDiscovered,
        last_synced_at: new Date().toISOString(),
      })
      .eq("agency_id", agencyId)
      .eq("source_type", "madlan");

    dlog(`[Madlan/Apify] discovery+import finished for job ${jobId}: ${totalInserted} properties created, ${totalMerged} merged`);
  } catch (err) {
    console.error(`[Madlan/Apify] discovery failed for job ${jobId}:`, err);
    await sb.from("import_jobs").update({ status: "failed" }).eq("id", jobId);
    await sb.from("agency_sources")
      .update({ last_failure_reason: `Apify discovery crash: ${err instanceof Error ? err.message : String(err)}` })
      .eq("agency_id", agencyId)
      .eq("source_type", "madlan");
  }
}

async function handleMadlanAgencyDiscover(body: any) {
  const { agency_id, website_url, import_type = "resale" } = body;
  if (!agency_id || !website_url) throw new Error("agency_id and website_url required");

  const sb = supabaseAdmin();
  const effectiveImportType = normalizeImportType(import_type);

  const { data: agency, error: agencyErr } = await sb
    .from("agencies").select("id").eq("id", agency_id).single();
  if (agencyErr || !agency) throw new Error("Agency not found");

  const { data: job, error: jobErr } = await sb
    .from("import_jobs")
    .insert({
      agency_id,
      website_url,
      status: "discovering",
      total_urls: 0,
      discovered_urls: [],
      processed_count: 0,
      failed_count: 0,
      import_type: effectiveImportType,
      source_type: "madlan",
    })
    .select("id")
    .single();
  if (jobErr || !job) throw new Error(`Failed to create import job: ${jobErr?.message}`);

  EdgeRuntime.waitUntil(
    runMadlanAgencyDiscoverJob({
      jobId: job.id,
      agencyId: agency_id,
      websiteUrl: website_url,
      effectiveImportType,
    })
  );

  return {
    job_id: job.id,
    total_listings: 0,
    total_discovered: 0,
    new_urls: 0,
    skipped_existing: 0,
    started_async: true,
  };
}

// ─── RESUME STALLED JOB ─────────────────────────────────────────────────────

async function handleResumeJob(body: any) {
  const { job_id } = body;
  if (!job_id) throw new Error("job_id required");

  const sb = supabaseAdmin();

  // Reset any items stuck in 'processing' back to 'pending'
  const { data: resetItems, error: resetErr } = await sb
    .from("import_job_items")
    .update({ status: "pending", error_message: null, error_type: null })
    .eq("job_id", job_id)
    .eq("status", "processing")
    .select("id");

  if (resetErr) throw new Error(`Failed to reset processing items: ${resetErr.message}`);
  const resetCount = resetItems?.length || 0;

  // Set job back to ready
  await sb.from("import_jobs").update({ status: "ready", last_heartbeat: null }).eq("id", job_id);

  return { reset_count: resetCount };
}

async function handleQuarantineMadlanBatch(body: any) {
  const { agency_id } = body;
  if (!agency_id) throw new Error("agency_id required");
  const sb = supabaseAdmin();
  const { data: agents } = await sb.from("agents").select("id").eq("agency_id", agency_id);
  const agentIds = (agents || []).map((agent: any) => agent.id).filter(Boolean);
  const ids = new Set<string>();
  const addIds = (rows?: Array<{ id: string }> | null) => (rows || []).forEach((row) => ids.add(row.id));

  const { data: directRows } = await sb
    .from("properties")
    .select("id")
    .eq("import_source", "madlan")
    .or(`primary_agency_id.eq.${agency_id},claimed_by_agency_id.eq.${agency_id}`);
  addIds(directRows);

  if (agentIds.length > 0) {
    const { data: agentRows } = await sb
      .from("properties")
      .select("id")
      .eq("import_source", "madlan")
      .in("agent_id", agentIds);
    addIds(agentRows);
  }

  const propertyIds = Array.from(ids);
  for (let i = 0; i < propertyIds.length; i += 100) {
    const batch = propertyIds.slice(i, i + 100);
    await sb.from("properties").update({
      is_published: false,
      source_status: "quarantined_active_count_mismatch",
      provisioning_audit_status: "critical",
      admin_notes: "Quarantined: Madlan import exceeded public active listing count and requires active-only reimport.",
      source_last_checked_at: new Date().toISOString(),
    }).in("id", batch);
  }
  return { quarantined_count: propertyIds.length };
}

// ─── CHECK EXISTING LISTINGS (Price Change + Removal Detection) ────────────

async function handleCheckExisting(body: any) {
  const { agency_id, items } = body;
  if (!agency_id || !items?.length) throw new Error("agency_id and items[] required");

  const sb = supabaseAdmin();
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not configured");

  const results = {
    checked: 0,
    price_changes: [] as { id: string; old_price: number; new_price: number }[],
    removed: [] as string[],
    errors: 0,
  };

  // Hebrew price regex patterns
  const pricePatterns = [
    /₪\s?([\d,]+(?:\.\d+)?)/g,
    /(\d{1,3}(?:,\d{3})+)\s?₪/g,
    /NIS\s?([\d,]+)/gi,
    /(\d{1,3}(?:,\d{3})+)\s?(?:ש"ח|שקל|shekel)/gi,
    // Standalone large numbers (likely prices: 500,000+)
    /\b(\d{1,3}(?:,\d{3}){1,3})\b/g,
  ];

  function extractPrice(markdown: string): number | null {
    const prices: number[] = [];
    for (const pattern of pricePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(markdown)) !== null) {
        const numStr = match[1].replace(/,/g, "");
        const num = parseFloat(numStr);
        // Only consider values that look like property prices (100k+)
        if (num >= 100000 && num <= 50000000) {
          prices.push(num);
        }
      }
    }
    // Return the most common price, or the first one found
    if (prices.length === 0) return null;
    const freq = new Map<number, number>();
    for (const p of prices) freq.set(p, (freq.get(p) || 0) + 1);
    return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  // Indicators that a page is a listing index (not an individual listing)
  const indexPageIndicators = [
    /נמצאו\s+\d+\s+תוצאות/i, // "X results found"
    /properties?\s+found/i,
    /listing.*results/i,
    /page\s+not\s+found/i,
    /404/,
    /הדף\s+לא\s+נמצא/i, // "page not found" in Hebrew
    /הנכס\s+נמכר/i, // "property sold"
    /הנכס\s+הושכר/i, // "property rented"
  ];

  for (const item of items) {
    try {
      const { property_id, source_url, current_price } = item;
      if (!property_id || !source_url) {
        results.errors++;
        continue;
      }

      // Scrape via Firecrawl (markdown only, lightweight)
      const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: source_url,
          formats: ["markdown"],
          onlyMainContent: true,
          timeout: 15000,
        }),
      });

      const scrapeData = await scrapeRes.json();

      // Check for 404 / scrape failure
      if (!scrapeRes.ok || !scrapeData.success ||
          scrapeData.data?.metadata?.statusCode === 404 ||
          scrapeData.data?.metadata?.statusCode === 410) {
        // Mark as removed
        await sb.from("properties").update({
          sync_status: "removed",
          last_sync_checked_at: new Date().toISOString(),
        }).eq("id", property_id);
        results.removed.push(property_id);
        results.checked++;
        continue;
      }

      const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";

      // Check if page is an index/redirect (not the actual listing)
      const isIndexPage = indexPageIndicators.some((re) => re.test(markdown));
      if (isIndexPage || markdown.length < 100) {
        await sb.from("properties").update({
          sync_status: "removed",
          last_sync_checked_at: new Date().toISOString(),
        }).eq("id", property_id);
        results.removed.push(property_id);
        results.checked++;
        continue;
      }

      // Extract price from page content
      const extractedPrice = extractPrice(markdown);

      if (extractedPrice && current_price) {
        const priceDiff = Math.abs(extractedPrice - current_price) / current_price;
        // Only update if price differs by >1% (avoid rounding noise)
        if (priceDiff > 0.01) {
          // Update price — existing triggers handle:
          // - handle_price_reduction() → sets original_price, price_reduced_at
          // - log_property_price_change() → inserts into listing_price_history
          // - track_property_lifecycle_price() → updates listing_lifecycle
          // - notify_price_drop() → creates price_drop_notifications
          await sb.from("properties").update({
            price: extractedPrice,
            sync_status: "price_changed",
            last_sync_checked_at: new Date().toISOString(),
          }).eq("id", property_id);

          results.price_changes.push({
            id: property_id,
            old_price: current_price,
            new_price: extractedPrice,
          });
        } else {
          // Price same — clear any previous sync_status, update check time
          await sb.from("properties").update({
            sync_status: null,
            last_sync_checked_at: new Date().toISOString(),
          }).eq("id", property_id);
        }
      } else {
        // Couldn't extract price — just update check time
        await sb.from("properties").update({
          last_sync_checked_at: new Date().toISOString(),
        }).eq("id", property_id);
      }

      results.checked++;
    } catch (err) {
      console.error(`check_existing error for item:`, err);
      results.errors++;
    }
  }

  return results;
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // AuthN/AuthZ — service-role bypasses; user calls must own the agency.
    try {
      await authorize(req, supabaseAdmin(), body, action);
    } catch (authErr) {
      const msg = authErr instanceof Error ? authErr.message : "Unauthorized";
      const status = msg.startsWith("Forbidden") ? 403 : 401;
      return new Response(
        JSON.stringify({ error: msg }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;
    if (action === "discover") {
      if (body.source_type === "yad2_apify") {
        // Force Apify path — used as automatic Firecrawl fallback by yad2-retry-runner
        result = await handleYad2Discover(body);
      } else if (body.source_type === "yad2") {
        // Auto-detect agency profile page vs search results
        if (isYad2AgencyUrl(body.website_url)) {
          result = await handleYad2AgencyDiscover(body);
        } else {
          result = await handleYad2Discover(body);
        }
      } else if (body.source_type === "madlan" || isMadlanAgencyUrl(body.website_url)) {
        result = await handleMadlanAgencyDiscover(body);
      } else {
        result = await handleWebsiteDiscoverAsync(body);
      }
    }
    else if (action === "process_batch") {
      if (body.background === true) {
        const jobId = body.job_id;
        if (!jobId) throw new Error("job_id required");
        EdgeRuntime.waitUntil(handleProcessBatch(body).catch((err) => {
          console.error(`Background process_batch failed for ${jobId}:`, err);
        }));
        result = { job_id: jobId, started_async: true, status: "processing" };
      } else {
        result = await handleProcessBatch(body);
      }
    }
    else if (action === "retry_failed") result = await handleRetryFailed(body);
    else if (action === "retry_recoverable_skipped") result = await handleRetryRecoverableSkipped(body);
    else if (action === "approve_item") result = await handleApproveItem(body);
    else if (action === "resume_job") result = await handleResumeJob(body);
    else if (action === "quarantine_madlan_batch") result = await handleQuarantineMadlanBatch(body);
    else if (action === "check_existing") result = await handleCheckExisting(body);
    else if (action === "backfill_street_view") result = await handleBackfillStreetView(body);
    else throw new Error(`Unknown action: ${action}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("import-agency-listings error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
