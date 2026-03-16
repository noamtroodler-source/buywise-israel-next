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

// ─── SUPPORTED CITIES WHITELIST ─────────────────────────────────────────────

const SUPPORTED_CITIES = [
  "Ashdod", "Ashkelon", "Beer Sheva", "Beit Shemesh", "Caesarea",
  "Efrat", "Eilat", "Givat Shmuel", "Gush Etzion", "Hadera",
  "Haifa", "Herzliya", "Hod HaSharon", "Jerusalem", "Kfar Saba",
  "Ma'ale Adumim", "Mevaseret Zion", "Modi'in", "Netanya",
  "Pardes Hanna", "Petah Tikva", "Ra'anana", "Ramat Gan",
  "Tel Aviv", "Zichron Yaakov",
];

// Common aliases/transliterations for supported cities
const CITY_ALIASES: Record<string, string[]> = {
  "Beer Sheva": ["beersheva", "beersheba", "beer sheba", "bersheva", "bersheba", "be'er sheva"],
  "Beit Shemesh": ["beit shemesh", "bet shemesh", "beth shemesh", "beitschemesh"],
  "Caesarea": ["kesaria", "cesaria", "qesaria", "kaisaria", "cesarea", "kesarya", "qesarya"],
  "Givat Shmuel": ["givat shmuel", "givat shemuel", "givat shmu'el"],
  "Gush Etzion": ["gush etzion", "gush ezion"],
  "Haifa": ["haipha", "hafia", "hefa", "heifa"],
  "Herzliya": ["herzeliya", "herzelia", "herzlia", "hertzeliya", "hertzlia", "hertzliya"],
  "Hod HaSharon": ["hod hasharon", "hod sharon"],
  "Jerusalem": ["yerushalayim", "jeruslaem", "jerusalm", "yerushalaim"],
  "Kfar Saba": ["kfar saba", "kfar sabba", "kfar sava"],
  "Ma'ale Adumim": ["maale adumim", "maaleh adumim", "male adumim", "ma'aleh adummim"],
  "Mevaseret Zion": ["mevaseret zion", "mevasseret zion", "mevasseret", "mevaseret tzion"],
  "Modi'in": ["modiin", "modin", "modein", "modiin maccabim reut"],
  "Netanya": ["natanya", "netaniya", "netanyah", "netania", "nathanya"],
  "Pardes Hanna": ["pardes hanna", "pardes hana", "pardes hanna karkur", "pardes hanna-karkur", "pardes chana"],
  "Petah Tikva": ["petach tikva", "petah tikwa", "petachtikva", "petach tikvah"],
  "Ra'anana": ["raanana", "ranana", "rannana", "raananah"],
  "Ramat Gan": ["ramat gan", "ramatgan", "ramat-gan"],
  "Tel Aviv": ["telaviv", "tel aviv", "tlv", "tel avive", "tel-aviv", "tel aviv-yafo", "tel aviv yafo"],
  "Zichron Yaakov": ["zichron yaakov", "zichron yakov", "zichron jacob", "zichron ya'akov", "zikhron"],
  "Ashkelon": ["ashqelon"],
  "Eilat": ["elat", "eliat"],
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
  "Zichron Yaakov": { min: 1_200_000, max: 5_000_000,  sqm_min: 20_000, sqm_max: 35_000 },
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

  console.log(`Index page pre-filter: scraping ${indexPages.length} pages`);
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
];
const VALID_LISTING_STATUSES = ["for_sale", "for_rent"];

// Property types to skip during resale import
const SKIP_PROPERTY_TYPES = new Set(["land", "commercial"]);

function validatePropertyData(listing: Record<string, any>, importType: string = "resale"): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const currentYear = new Date().getFullYear();

  // Price validation
  if (listing.price != null && listing.price < 0) {
    errors.push("price cannot be negative");
  } else if (listing.price === 1) {
    errors.push("price=1 is a sold placeholder — skip");
  } else if (listing.price != null && listing.price > 0 && listing.price < 20_000) {
    if (importType === "resale") {
      errors.push(`price ${listing.price} NIS appears to be rent, not sale price`);
    } else {
      warnings.push(`price ${listing.price} NIS — verify this is correct for a rental listing`);
    }
  } else if (listing.price != null && listing.price > 0 && listing.price < 100_000) {
    if (importType === "resale") {
      warnings.push(`price ${listing.price} seems unusually low for a property`);
    }
  }

  // Skip rentals only in resale mode
  if (listing.listing_status === "for_rent" && importType === "resale") {
    errors.push("rental listing — resale import only");
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
  if (listing.year_built != null && (typeof listing.year_built !== "number" || listing.year_built < 1800 || listing.year_built > currentYear + 5)) {
    errors.push(`year_built ${listing.year_built} is out of range`);
  }

  // ── City-specific price range validation (only for resale) ──
  if (listing.city && listing.price && listing.price > 0 && importType === "resale") {
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
  validationWarnings: string[]
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

  // Photos
  const photoCount = listing.image_urls?.length || 0;
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

  return Math.min(100, Math.max(0, score));
}

// ─── ADDRESS NORMALIZATION FOR DEDUP ────────────────────────────────────────

function normalizeAddressForDedup(address: string): string {
  let norm = address.trim().toLowerCase();
  // Strip Hebrew "רחוב" (street) prefix
  norm = norm.replace(/^רחוב\s+/, "");
  norm = norm.replace(/^rechov\s+/i, "");
  // Normalize Hebrew final-form characters
  norm = norm.replace(/ך/g, "כ").replace(/ם/g, "מ").replace(/ן/g, "נ").replace(/ף/g, "פ").replace(/ץ/g, "צ");
  // Remove extra spaces and hyphens in house numbers
  norm = norm.replace(/\s+/g, " ").replace(/-/g, "").trim();
  return norm;
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

  console.log(`Classifying ${allUrls.length} URLs in ${chunks.length} chunk(s)`);
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
    console.log("All AI classification chunks returned 0 results, using fallback (first 100 URLs)");
    return allUrls.slice(0, 100);
  }
  console.log(`Batch classification complete: ${listingUrls.length} listing URLs (${totalFailed} empty chunks)`);
  return listingUrls;
}

// ─── DISCOVER ───────────────────────────────────────────────────────────────

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!url.startsWith("http")) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    parsed.hostname = parsed.hostname.toLowerCase();
    if (parsed.pathname.endsWith("/") && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return url.toLowerCase().replace(/\/+$/, "");
  }
}

async function handleDiscover(body: any) {
  const { agency_id, website_url, import_type = "resale" } = body;
  if (!agency_id || !website_url) throw new Error("agency_id and website_url required");

  const sb = supabaseAdmin();
  const normalizedUrl = normalizeUrl(website_url);

  const { data: agency, error: agencyErr } = await sb
    .from("agencies").select("id, admin_user_id").eq("id", agency_id).single();
  if (agencyErr || !agency) throw new Error("Agency not found");

  // Gather previously-known URLs
  const { data: previousJobIds } = await sb
    .from("import_jobs").select("id").eq("agency_id", agency_id).eq("website_url", normalizedUrl);

  let knownUrlSet = new Set<string>();
  if (previousJobIds && previousJobIds.length > 0) {
    const jobIds = previousJobIds.map((j: any) => j.id);
    for (let i = 0; i < jobIds.length; i += 50) {
      const batch = jobIds.slice(i, i + 50);
      const { data: prevItems } = await sb.from("import_job_items").select("url").in("job_id", batch);
      if (prevItems) for (const item of prevItems) knownUrlSet.add(normalizeUrl(item.url));
    }
  }

  const { data: existingProperties } = await sb
    .from("properties").select("source_url").eq("agency_id", agency_id).not("source_url", "is", null);
  if (existingProperties) {
    for (const prop of existingProperties) {
      if (prop.source_url) knownUrlSet.add(normalizeUrl(prop.source_url));
    }
  }

  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

  const formattedUrl = normalizedUrl;
  console.log("Mapping URL:", formattedUrl);

  const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
    method: "POST",
    headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url: formattedUrl, limit: 500, includeSubdomains: false }),
  });
  const mapData = await mapRes.json();
  if (!mapRes.ok) throw new Error(`Firecrawl MAP failed: ${JSON.stringify(mapData)}`);

  const rawUrls: string[] = mapData.links || mapData.data || [];
  if (rawUrls.length === 0) throw new Error("No URLs discovered on this website");
  console.log(`Discovered ${rawUrls.length} total URLs`);

  // Pre-filter: remove sold/rented keyword URLs
  const SOLD_URL_KEYWORDS = [
    'sold', 'rented', 'leased', 'archived', 'completed',
    'past-sale', 'under-contract', 'off-market',
    'נמכר', 'הושכר', 'בהסכם',
    '%D7%A0%D7%9E%D7%9B%D7%A8', '%D7%94%D7%95%D7%A9%D7%9B%D7%A8',
  ];

  const allUrls = rawUrls.filter(url => {
    try {
      const decoded = decodeURIComponent(url).toLowerCase();
      return !SOLD_URL_KEYWORDS.some(kw => decoded.includes(kw));
    } catch { return true; }
  });

  const urlFilteredOut = rawUrls.length - allUrls.length;
  if (urlFilteredOut > 0) console.log(`URL keyword filter: removed ${urlFilteredOut} sold/rented URLs`);

  // Index page sold-URL pre-filter
  try {
    const soldUrlsFromIndex = await findSoldUrlsFromIndexPages(allUrls, normalizedUrl, FIRECRAWL_API_KEY);
    if (soldUrlsFromIndex.size > 0) {
      const beforeCount = allUrls.length;
      const filteredUrls = allUrls.filter(url => !soldUrlsFromIndex.has(normalizeUrl(url)));
      allUrls.length = 0;
      allUrls.push(...filteredUrls);
      console.log(`Index page filter: removed ${beforeCount - allUrls.length} sold URLs`);
    }
  } catch (err) { console.warn(`Index page pre-filter failed: ${err}`); }

  // Non-listing URL pattern filter
  const { listingCandidates, removed: nonListingRemoved } = filterNonListingUrls(allUrls);
  if (nonListingRemoved > 0 && listingCandidates.length > 0) {
    allUrls.length = 0;
    allUrls.push(...listingCandidates);
    console.log(`Non-listing filter: removed ${nonListingRemoved}, ${allUrls.length} remaining`);
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  // Subtract already-known URLs BEFORE AI classification
  const newUrls = knownUrlSet.size > 0
    ? allUrls.filter(url => !knownUrlSet.has(normalizeUrl(url)))
    : allUrls;
  const skippedExisting = allUrls.length - newUrls.length;

  if (skippedExisting > 0) console.log(`Incremental dedup: ${skippedExisting} known, ${newUrls.length} new`);

  if (newUrls.length === 0) {
    return { job_id: null, total_listings: 0, total_discovered: allUrls.length, new_urls: 0, skipped_existing: skippedExisting };
  }

  const listingUrls = await classifyUrlsInBatches(newUrls, LOVABLE_API_KEY);
  console.log(`AI identified ${listingUrls.length} listing URLs`);

  if (listingUrls.length === 0) {
    return { job_id: null, total_listings: 0, total_discovered: allUrls.length, new_urls: 0, skipped_existing: skippedExisting };
  }

  const { data: job, error: jobErr } = await sb
    .from("import_jobs")
    .insert({ agency_id, website_url: formattedUrl, status: "ready", total_urls: listingUrls.length, discovered_urls: allUrls, import_type })
    .select("id").single();
  if (jobErr) throw new Error(`Failed to create import job: ${jobErr.message}`);

  const items = listingUrls.map((url) => ({ job_id: job.id, url, status: "pending" }));
  const { error: itemsErr } = await sb.from("import_job_items").insert(items);
  if (itemsErr) throw new Error(`Failed to create job items: ${itemsErr.message}`);

  return { job_id: job.id, total_listings: listingUrls.length, total_discovered: allUrls.length, new_urls: listingUrls.length, skipped_existing: skippedExisting };
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── NON-LISTING URL PATTERN FILTER ─────────────────────────────────────────

const NON_LISTING_SEGMENTS = new Set([
  "about", "contact", "team", "careers", "jobs", "privacy", "terms", "legal",
  "disclaimer", "login", "signin", "signup", "register", "auth", "account",
  "dashboard", "admin", "panel", "blog", "news", "press", "media", "faq",
  "help", "support", "sitemap", "accessibility", "cookie", "cookies", "cart",
  "checkout", "payment", "subscribe", "unsubscribe", "partners", "affiliates",
  "investors", "testimonials", "reviews", "awards", "archive", "category",
  "tag", "tags", "author", "feed", "wp-admin", "wp-login", "wp-content",
  "project", "projects", "development", "developments", "new-construction",
  "new-building", "new-homes", "new-development",
  "פרויקט", "פרויקטים", "בנייה-חדשה", "דירות-חדשות", "מתחם", "מתחמים",
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

let _lastGeoTime = 0;
let _geoQueue: Promise<void> = Promise.resolve();

async function geocodeWithRateLimit(address: string, city: string): Promise<{ lat: number; lng: number } | null> {
  const result = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
    _geoQueue = _geoQueue.then(async () => {
      const now = Date.now();
      const wait = Math.max(0, 1100 - (now - _lastGeoTime));
      if (wait > 0) await delay(wait);
      _lastGeoTime = Date.now();
      try {
        const geoQuery = encodeURIComponent(`${address}, ${city}, Israel`);
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${geoQuery}&format=json&limit=1`,
          { headers: { "User-Agent": "BuyWiseIsrael/1.0" } }
        );
        const geoData = await geoRes.json();
        if (geoData?.[0]) {
          resolve({ lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) });
        } else { resolve(null); }
      } catch { resolve(null); }
    });
  });
  return result;
}

// ─── IMAGE HANDLING (with placeholder detection) ────────────────────────────

async function enhanceImage(imagePublicUrl: string, sb: any, bucketName: string, jobId: string): Promise<string> {
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return imagePublicUrl;
    const enhancePath = `imports/${jobId}/${crypto.randomUUID()}-enhanced.png`;
    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/enhance-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imagePublicUrl, bucket: bucketName, path: enhancePath }),
    });
    if (!res.ok) return imagePublicUrl;
    const data = await res.json();
    return (data.success && data.enhanced && data.image_url) ? data.image_url : imagePublicUrl;
  } catch { return imagePublicUrl; }
}

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

async function parallelImageDownload(
  sourceImages: string[], sb: any, bucketName: string, jobId: string, maxImages = 15
): Promise<string[]> {
  const imageUrls: string[] = [];
  // Filter out placeholder images first
  const validImages = sourceImages.filter(url => !isPlaceholderImage(url)).slice(0, maxImages);
  const BATCH_SIZE = 5;

  for (let i = 0; i < validImages.length; i += BATCH_SIZE) {
    const batch = validImages.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (imgUrl, batchIdx) => {
        const globalIdx = i + batchIdx;
        const imgRes = await fetch(imgUrl);
        if (!imgRes.ok) return null;

        // Skip tiny images (< 5KB — likely placeholders)
        const contentLength = imgRes.headers.get("content-length");
        if (contentLength && parseInt(contentLength) < 5000) {
          console.log(`Skipping tiny image (${contentLength} bytes): ${imgUrl.slice(0, 80)}`);
          return null;
        }

        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
        const imgBuffer = await imgRes.arrayBuffer();

        // Double-check size after download
        if (imgBuffer.byteLength < 5000) return null;

        const fileName = `imports/${jobId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await sb.storage
          .from(bucketName).upload(fileName, imgBuffer, { contentType, upsert: false });

        if (!uploadErr) {
          const { data: urlData } = sb.storage.from(bucketName).getPublicUrl(fileName);
          const publicUrl = urlData?.publicUrl || null;
          if (!publicUrl) return null;
          // Only enhance the first image (cover photo)
          if (globalIdx === 0) return await enhanceImage(publicUrl, sb, bucketName, jobId);
          return publicUrl;
        }
        return null;
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) imageUrls.push(r.value);
    }
  }
  return imageUrls;
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

// ─── EXTRACTION PROMPT (with comprehensive Hebrew dictionary) ───────────────

function buildExtractionPrompt(url: string, domain: string, markdown: string, pageLinks: string[]): string {
  return `You are extracting structured data from a scraped Israeli real estate page.

IMPORTANT CONTEXT:
- Website domain: ${domain}
- Supported cities (return city as one of these EXACT names): ${SUPPORTED_CITIES.join(", ")}
- If the city is not explicitly stated on the page, INFER it from:
  1. The website domain name (e.g., "jerusalem-real-estate.co" → Jerusalem)
  2. The URL path
  3. Neighborhood context (e.g., Arnona, Baka, Talbieh → Jerusalem; Neve Tzedek → Tel Aviv)
- If no price is listed (e.g., "Price on Request"), set price to 0.
- Return city as one of the supported cities listed above.

═══ HEBREW REAL ESTATE DICTIONARY ═══

PROPERTY TYPES (Hebrew → BuyWise key):
דירה = apartment | דירת גן = garden_apartment | בית פרטי / וילה = house | קוטג' = cottage
פנטהאוז = penthouse | מיני פנטהאוז = mini_penthouse | דירת גג = penthouse
דופלקס = duplex | טריפלקס = duplex | לופט = apartment | דירת סטודיו = apartment
יחידת דיור = apartment | בית דו-משפחתי = house | דירת מרתף = apartment
מגרש = land | מחסן = commercial | חניה = commercial

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

═══ EXTRACTION RULES ═══

FIRST, determine the CATEGORY of this page:
- "property": A single unit for sale or rent (resale, rental listing)
- "project": A new construction project / development — SKIP
- "not_listing": Not a property listing page

FOR PROPERTIES — extract these fields:
- In Israel, "rooms" (חדרים) = bedrooms + 1 living room. So 4 rooms = 3 bedrooms. Always subtract 1 for bedrooms.
- Default currency is ILS (₪) unless explicitly stated otherwise.
- Use the dictionary above for property types, not your own guess.
- listing_status: for_sale if buying/מכירה, for_rent if renting/השכרה
- Detect if sold (נמכר), rented (הושכר), under contract (בהסכם). Set is_sold_or_rented=true if so.
- Price might appear as "₪1,500,000" or "1,500,000 ש״ח" or "$450,000"
- Extract ALL image URLs you can find
- For floor: use the Hebrew ordinal map above

Page URL: ${url}
Page content:
${markdown.substring(0, 8000)}

Links found on page:
${pageLinks.slice(0, 50).join("\n")}`;
}

// ─── PROCESS SINGLE ITEM ────────────────────────────────────────────────────

async function processOneItem(
  item: any, sb: any, job: any, agentId: string | null,
  firecrawlKey: string, lovableKey: string, jobId: string,
  domainCity: string | null = null, importType: string = "resale"
): Promise<{ succeeded: boolean }> {
  try {
    await sb.from("import_job_items").update({ status: "processing" }).eq("id", item.id);

    // 0a. Source URL dedup
    const { data: existingByUrl } = await sb
      .from("properties").select("id").eq("source_url", item.url).limit(1);
    if (existingByUrl && existingByUrl.length > 0) {
      await sb.from("import_job_items")
        .update({ status: "skipped", error_message: `Duplicate: URL already imported as property ${existingByUrl[0].id}`, error_type: "permanent" })
        .eq("id", item.id);
      return { succeeded: false };
    }

    // 0b. In-job URL dedup
    const { data: existingJobItem } = await sb
      .from("import_job_items").select("id, property_id")
      .eq("job_id", jobId).eq("url", item.url).eq("status", "done").neq("id", item.id).limit(1);
    if (existingJobItem && existingJobItem.length > 0) {
      await sb.from("import_job_items")
        .update({ status: "skipped", error_message: "Duplicate: same URL already processed in this job", error_type: "permanent" })
        .eq("id", item.id);
      return { succeeded: false };
    }

    // 0c. Pre-check
    const preCheck = await preCheckUrl(item.url);
    if (!preCheck.ok) {
      const errorType = (preCheck.skipReason?.includes("timed out") || preCheck.skipReason?.includes("network error")) ? "transient" : "permanent";
      await sb.from("import_job_items")
        .update({ status: "skipped", error_message: preCheck.skipReason, error_type: errorType })
        .eq("id", item.id);
      return { succeeded: false };
    }

    // 1. Scrape
    console.log(`Scraping: ${item.url}`);
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url: item.url, formats: ["markdown", "links", "html"], onlyMainContent: true }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) {
      const statusCode = scrapeRes.status;
      if (statusCode === 404 || statusCode === 410) {
        await sb.from("import_job_items").update({ status: "skipped", error_message: `Page not found (${statusCode})`, error_type: "permanent" }).eq("id", item.id);
        return { succeeded: false };
      }
      await sb.from("import_job_items").update({ status: "failed", error_message: `Scrape failed (${statusCode})`, error_type: "transient" }).eq("id", item.id);
      return { succeeded: false };
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const pageLinks = scrapeData.data?.links || scrapeData.links || [];
    const pageHtml = scrapeData.data?.html || scrapeData.html || "";

    if (!markdown || markdown.length < 50) {
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Page content too short", error_type: "permanent" }).eq("id", item.id);
      return { succeeded: false };
    }

    // Pre-LLM: sold/rented/rental/new-dev check (enhanced)
    const preFilter = isNonResalePage(markdown, importType);
    if (preFilter.skip) {
      console.log(`Pre-filter: ${preFilter.reason} for ${item.url}`);
      await sb.from("import_job_items").update({ status: "skipped", error_message: preFilter.reason, error_type: "permanent" }).eq("id", item.id);
      return { succeeded: false };
    }

    // 2. AI extraction (with comprehensive Hebrew dictionary prompt)
    const domain = getDomainFromUrl(item.url);
    const extractionPrompt = buildExtractionPrompt(item.url, domain, markdown, pageLinks);

    const extractRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
                price: { type: "number", description: "Price (0 if Price on Request)" },
                currency: { type: "string", enum: ["ILS", "USD", "EUR"] },
                bedrooms: { type: "number", description: "Bedrooms (rooms - 1)" },
                bathrooms: { type: "number" },
                size_sqm: { type: "number" },
                address: { type: "string" },
                city: { type: "string", description: "Must be one of the supported cities" },
                neighborhood: { type: "string" },
                property_type: { type: "string", enum: ["apartment", "garden_apartment", "penthouse", "mini_penthouse", "duplex", "house", "cottage", "land", "commercial"] },
                listing_status: { type: "string", enum: ["for_sale", "for_rent"] },
                floor: { type: "number" },
                total_floors: { type: "number" },
                features: { type: "array", items: { type: "string" } },
                parking: { type: "number" },
                entry_date: { type: "string" },
                year_built: { type: "number" },
                ac_type: { type: "string", enum: ["none", "split", "central", "mini_central"] },
                condition: { type: "string", enum: ["new", "renovated", "good", "needs_renovation"] },
                is_sold_or_rented: { type: "boolean" },
                image_urls: { type: "array", items: { type: "string" } },
              },
              required: ["listing_category"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_listing" } },
      }),
    });

    if (!extractRes.ok) {
      const errText = await extractRes.text();
      console.error("AI extraction error:", extractRes.status, errText);
      if (extractRes.status === 429) {
        await sb.from("import_job_items").update({ status: "pending", error_message: "Rate limited, will retry", error_type: "transient" }).eq("id", item.id);
        return { succeeded: false };
      }
      await sb.from("import_job_items").update({ status: "failed", error_message: `AI extraction failed (${extractRes.status})`, error_type: "transient" }).eq("id", item.id);
      return { succeeded: false };
    }

    const extractData = await extractRes.json();
    const extractToolCall = extractData.choices?.[0]?.message?.tool_calls?.[0];
    if (!extractToolCall?.function?.arguments) {
      await sb.from("import_job_items").update({ status: "failed", error_message: "AI returned no extraction data", error_type: "permanent" }).eq("id", item.id);
      return { succeeded: false };
    }

    const listing = JSON.parse(extractToolCall.function.arguments);

    // Store raw extraction
    await sb.from("import_job_items").update({ extracted_data: listing }).eq("id", item.id);

    const category = listing.listing_category || (listing.is_listing_page === false ? "not_listing" : "property");

    if (category === "not_listing") {
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Not a listing page", error_type: "permanent" }).eq("id", item.id);
      return { succeeded: false };
    }

    if (category === "project") {
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Project/development page — skipped", error_type: "permanent" }).eq("id", item.id);
      return { succeeded: false };
    }

    // ── POST-EXTRACTION CITY INFERENCE ──
    let cityMatchType: "exact" | "fuzzy" | "domain" | "none" = "none";
    if (!listing.city || listing.city.trim() === "") {
      if (domainCity) {
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

    // ── VALIDATION (enhanced with city-specific outlier detection) ──
    const { errors: propertyErrors, warnings: validationWarnings } = validatePropertyData(listing);
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
    const confidenceScore = computeConfidenceScore(listing, cityMatchType, validationWarnings);
    console.log(`Confidence score for ${item.url}: ${confidenceScore}`);

    // Store confidence score + warnings
    await sb.from("import_job_items").update({
      confidence_score: confidenceScore,
      extracted_data: { ...listing, confidence_score: confidenceScore, validation_warnings: validationWarnings },
    }).eq("id", item.id);

    // Below 40: skip with low confidence
    if (confidenceScore < 40) {
      await sb.from("import_job_items").update({
        status: "skipped",
        error_message: `Low confidence (${confidenceScore}/100): insufficient data quality for import`,
        error_type: "permanent",
      }).eq("id", item.id);
      return { succeeded: false };
    }

    // ── DEDUP: Tier 1 — Normalized address + city ──
    if (listing.address && listing.city) {
      const normalizedAddr = normalizeAddressForDedup(listing.address);
      if (normalizedAddr.length > 0) {
        const { data: dupes } = await sb
          .from("properties").select("id")
          .eq("agent_id", agentId)
          .ilike("address", normalizedAddr)
          .ilike("city", listing.city.trim())
          .limit(1);

        if (dupes && dupes.length > 0) {
          await sb.from("import_job_items").update({
            status: "skipped",
            error_message: `Duplicate: matches property ${dupes[0].id} (same address + city)`,
            error_type: "permanent",
          }).eq("id", item.id);
          return { succeeded: false };
        }
      }
    }

    // ── DEDUP: Tier 2 — Fuzzy match with tolerance bands ──
    if (listing.city && listing.bedrooms != null && listing.size_sqm && listing.price && listing.price > 0) {
      const priceLow = listing.price * 0.95;
      const priceHigh = listing.price * 1.05;
      const sizeLow = listing.size_sqm - 5;
      const sizeHigh = listing.size_sqm + 5;

      const { data: fuzzyDupes } = await sb
        .from("properties").select("id")
        .eq("agent_id", agentId)
        .ilike("city", listing.city.trim())
        .eq("bedrooms", Math.floor(listing.bedrooms))
        .gte("size_sqm", sizeLow)
        .lte("size_sqm", sizeHigh)
        .gte("price", priceLow)
        .lte("price", priceHigh)
        .limit(1);

      if (fuzzyDupes && fuzzyDupes.length > 0) {
        await sb.from("import_job_items").update({
          status: "skipped",
          error_message: `Duplicate: matches property ${fuzzyDupes[0].id} (same city, rooms, ~size, ~price)`,
          error_type: "permanent",
        }).eq("id", item.id);
        return { succeeded: false };
      }
    }

    // Download and re-host images (with placeholder detection)
    const imageUrls = await parallelImageDownload(listing.image_urls || [], sb, "property-images", jobId);

    // Geocode
    let latitude: number | null = null;
    let longitude: number | null = null;
    if (listing.address && listing.city) {
      const coords = await geocodeWithRateLimit(listing.address, listing.city);
      if (coords) { latitude = coords.lat; longitude = coords.lng; }
    }

    // Insert property
    const entryDate = listing.entry_date === "immediate" ? new Date().toISOString().split("T")[0] : listing.entry_date || null;

    const { data: property, error: propErr } = await sb
      .from("properties")
      .insert({
        agent_id: agentId,
        title: listing.title || `Imported from ${new URL(item.url).hostname}`,
        description: listing.description || null,
        property_type: listing.property_type || "apartment",
        listing_status: listing.listing_status || "for_sale",
        price: listing.price || 0,
        currency: listing.currency || "ILS",
        address: listing.address || "",
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
        is_published: false, is_featured: false, views_count: 0,
        verification_status: "draft",
        import_source: "website_scrape",
        source_url: item.url,
      })
      .select("id")
      .single();

    if (propErr) {
      console.error("Property insert error:", propErr);
      await sb.from("import_job_items").update({ status: "failed", error_message: `Insert failed: ${propErr.message}`, error_type: "transient" }).eq("id", item.id);
      return { succeeded: false };
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
  if (cachedDomainCity) console.log(`Domain city: ${cachedDomainCity}`);

  const { data: initialCheck } = await sb
    .from("import_job_items").select("id").eq("job_id", job_id).eq("status", "pending").limit(1);

  if (!initialCheck || initialCheck.length === 0) {
    await sb.from("import_jobs").update({ status: "completed" }).eq("id", job_id);
    return { processed: 0, succeeded: 0, failed: 0, remaining: 0, status: "completed" };
  }

  await sb.from("import_jobs").update({ status: "processing" }).eq("id", job_id);

  const { data: agents } = await sb.from("agents").select("id").eq("agency_id", job.agency_id).limit(1);
  const agentId = agents?.[0]?.id || null;

  // Reset per-batch state
  _lastGeoTime = 0;
  _geoQueue = Promise.resolve();
  _batchImageUrlCounts.clear();

  const CONCURRENCY = 3;
  const REFILL_SIZE = 6;
  const MAX_ITEMS = 9;
  const TIME_LIMIT_MS = 120_000;
  const batchStartTime = Date.now();

  let totalProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;
  let refillCycle = 0;

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
    console.log(`Refill ${refillCycle}: ${pendingItems.length} items`);

    for (let i = 0; i < pendingItems.length && totalProcessed < MAX_ITEMS; i += CONCURRENCY) {
      if (Date.now() - batchStartTime > TIME_LIMIT_MS) break;

      const chunk = pendingItems.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        chunk.map(item => processOneItem(item, sb, job, agentId, FIRECRAWL_API_KEY, LOVABLE_API_KEY, job_id, cachedDomainCity))
      );

      for (const result of results) {
        totalProcessed++;
        if (result.status === "fulfilled" && result.value.succeeded) totalSucceeded++;
        else totalFailed++;
      }
    }
  }

  console.log(`Batch: ${totalProcessed} processed (${totalSucceeded} ok, ${totalFailed} failed) in ${((Date.now() - batchStartTime) / 1000).toFixed(1)}s`);

  const { data: counts } = await sb.from("import_job_items").select("status").eq("job_id", job_id);
  const doneCount = counts?.filter((c) => c.status === "done").length || 0;
  const failedCount = counts?.filter((c) => ["failed", "skipped"].includes(c.status)).length || 0;
  const remainingCount = counts?.filter((c) => c.status === "pending").length || 0;
  const newStatus = remainingCount === 0 ? "completed" : "ready";

  await sb.from("import_jobs").update({ processed_count: doneCount, failed_count: failedCount, status: newStatus }).eq("id", job_id);

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

// ─── MAIN ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    let result;
    if (action === "discover") result = await handleDiscover(body);
    else if (action === "process_batch") result = await handleProcessBatch(body);
    else if (action === "retry_failed") result = await handleRetryFailed(body);
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
