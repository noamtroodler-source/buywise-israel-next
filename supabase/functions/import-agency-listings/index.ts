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
  "Caesarea": ["kesaria", "cesaria", "qesaria", "kaisaria", "cesarea"],
  "Givat Shmuel": ["givat shmuel", "givat shemuel"],
  "Gush Etzion": ["gush etzion", "gush ezion"],
  "Haifa": ["haipha", "hafia", "hefa", "heifa"],
  "Herzliya": ["herzeliya", "herzelia", "herzlia", "hertzeliya"],
  "Hod HaSharon": ["hod hasharon", "hod sharon"],
  "Jerusalem": ["yerushalayim", "jeruslaem", "jerusalm"],
  "Kfar Saba": ["kfar saba", "kfar sabba", "kfar sava"],
  "Ma'ale Adumim": ["maale adumim", "maaleh adumim", "male adumim"],
  "Mevaseret Zion": ["mevaseret zion", "mevasseret zion", "mevasseret"],
  "Modi'in": ["modiin", "modin", "modein"],
  "Netanya": ["natanya", "netaniya", "netanyah"],
  "Pardes Hanna": ["pardes hanna", "pardes hana", "pardes hanna karkur"],
  "Petah Tikva": ["petach tikva", "petah tikwa", "petachtikva"],
  "Ra'anana": ["raanana", "ranana", "rannana"],
  "Ramat Gan": ["ramat gan", "ramatgan"],
  "Tel Aviv": ["telaviv", "tel aviv", "tlv", "tel avive"],
  "Zichron Yaakov": ["zichron yaakov", "zichron yakov", "zichron jacob"],
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

/**
 * Match a city name against the supported cities list.
 * Returns canonical city name or null if not matched.
 */
function matchSupportedCity(city: string | undefined | null): string | null {
  if (!city || typeof city !== "string" || city.trim() === "") return null;

  const normalized = normalizeCityStr(city);

  // 1. Direct match (normalized)
  for (const supported of SUPPORTED_CITIES) {
    if (normalizeCityStr(supported) === normalized) return supported;
  }

  // 2. Alias match
  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    for (const alias of aliases) {
      if (normalizeCityStr(alias) === normalized) return canonical;
    }
  }

  // 3. Substring / contains match (e.g. "Tel Aviv-Yafo" → "Tel Aviv")
  for (const supported of SUPPORTED_CITIES) {
    const normSupported = normalizeCityStr(supported);
    if (normalized.includes(normSupported) || normSupported.includes(normalized)) {
      return supported;
    }
  }

  return null;
}

/**
 * Try to infer a city from the URL domain name.
 */
function inferCityFromDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/\./g, "");
    for (const [keyword, city] of Object.entries(DOMAIN_CITY_HINTS)) {
      if (hostname.includes(keyword)) return city;
    }
  } catch {
    // ignore invalid URLs
  }
  return null;
}

/**
 * Extract domain name from URL for AI context.
 */
function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

// ─── INDEX PAGE SOLD-URL PRE-FILTER ─────────────────────────────────────────

const INDEX_PAGE_PATTERNS = [
  /\/(properties|listings|for-sale|for-rent|our-listings|all-listings|catalog|portfolio|real-estate|homes)/i,
  /\/(נכסים|דירות|למכירה|להשכרה|נדלן|דירות-למכירה|דירות-להשכרה)/,
  /\/(page|p)\/\d+/i, // pagination pages
];

const SOLD_BADGE_PATTERNS = [
  // English
  /\bsold\b/i,
  /\brented\b/i,
  /\bleased\b/i,
  /\bunder\s+contract\b/i,
  /\boff[\s-]?market\b/i,
  /\bno\s+longer\s+available\b/i,
  /\bsale\s+agreed\b/i,
  /\blet\s+agreed\b/i,
  /\bunavailable\b/i,
  // Hebrew
  /נמכר[הו]?/,
  /הושכר[הו]?/,
  /בהסכם/,
  /לא\s*זמינ[הו]?/,
  /לא\s*פנוי[הו]?/,
];

const SOLD_CSS_CLASS_PATTERN = /class\s*=\s*"[^"]*\b(sold|rented|unavailable|off-market|leased|inactive|expired)\b[^"]*"/gi;

function identifyIndexPages(allUrls: string[], websiteUrl: string): string[] {
  const candidates = new Set<string>();
  
  // Always include the homepage
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
        if (pattern.test(path)) {
          candidates.add(url);
          break;
        }
      }
    } catch { /* ignore */ }
  }

  // Cap at 8 pages to limit Firecrawl credits
  return Array.from(candidates).slice(0, 8);
}

function extractSoldUrlsFromHtml(html: string, pageUrl: string, knownUrls: Set<string>): Set<string> {
  const soldUrls = new Set<string>();
  let baseUrl: URL;
  try {
    baseUrl = new URL(pageUrl);
  } catch {
    return soldUrls;
  }

  // Strategy 1: Find <a> tags and check surrounding context for sold signals
  const linkRegex = /<a\s[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const linkOuterStart = Math.max(0, match.index - 300);
    const linkOuterEnd = Math.min(html.length, match.index + match[0].length + 300);
    const surroundingContext = html.substring(linkOuterStart, linkOuterEnd);

    // Check if surrounding context has sold/rented signals
    let hasSoldSignal = false;

    for (const pattern of SOLD_BADGE_PATTERNS) {
      if (pattern.test(surroundingContext)) {
        hasSoldSignal = true;
        break;
      }
    }

    if (!hasSoldSignal && SOLD_CSS_CLASS_PATTERN.test(surroundingContext)) {
      hasSoldSignal = true;
    }
    // Reset lastIndex since we used the global flag
    SOLD_CSS_CLASS_PATTERN.lastIndex = 0;

    if (hasSoldSignal) {
      // Normalize href to absolute URL
      let absoluteUrl: string;
      try {
        absoluteUrl = new URL(href, baseUrl).toString();
      } catch {
        continue;
      }
      // Normalize and check if it's in our known URLs
      const normalized = normalizeUrl(absoluteUrl);
      if (knownUrls.has(normalized)) {
        soldUrls.add(normalized);
      }
    }
  }

  // Strategy 2: Find elements with sold CSS classes and extract their child links
  const soldContainerRegex = /<(?:div|article|li|section)\s[^>]*class\s*=\s*"[^"]*\b(sold|rented|unavailable|off-market|leased)\b[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article|li|section)>/gi;
  
  while ((match = soldContainerRegex.exec(html)) !== null) {
    const containerHtml = match[2];
    const innerLinkRegex = /href\s*=\s*["']([^"'#]+)["']/gi;
    let innerMatch: RegExpExecArray | null;
    while ((innerMatch = innerLinkRegex.exec(containerHtml)) !== null) {
      try {
        const absoluteUrl = new URL(innerMatch[1], baseUrl).toString();
        const normalized = normalizeUrl(absoluteUrl);
        if (knownUrls.has(normalized)) {
          soldUrls.add(normalized);
        }
      } catch { /* ignore */ }
    }
  }

  return soldUrls;
}

async function findSoldUrlsFromIndexPages(
  allUrls: string[],
  websiteUrl: string,
  firecrawlKey: string
): Promise<Set<string>> {
  const soldUrls = new Set<string>();

  const indexPages = identifyIndexPages(allUrls, websiteUrl);
  if (indexPages.length === 0) {
    console.log("No index pages identified for sold-URL pre-filter");
    return soldUrls;
  }

  console.log(`Index page pre-filter: scraping ${indexPages.length} pages: ${indexPages.join(", ")}`);

  // Build a Set of normalized known URLs for fast lookup
  const knownUrlSet = new Set(allUrls.map(u => normalizeUrl(u)));

  // Scrape index pages in parallel (batches of 4 to avoid rate limits)
  const batchSize = 4;
  for (let i = 0; i < indexPages.length; i += batchSize) {
    const batch = indexPages.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (pageUrl) => {
        try {
          const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: pageUrl,
              formats: ["html"],
              onlyMainContent: false, // Need full page to see badges in grid
              waitFor: 2000, // Wait for JS-rendered badges
            }),
          });

          if (!res.ok) {
            const errData = await res.text();
            console.warn(`Index page scrape failed for ${pageUrl}: ${res.status} ${errData.substring(0, 200)}`);
            return null;
          }

          const data = await res.json();
          const html = data.data?.html || data.html || "";
          if (!html || html.length < 100) {
            console.warn(`Index page ${pageUrl}: empty HTML response`);
            return null;
          }

          const found = extractSoldUrlsFromHtml(html, pageUrl, knownUrlSet);
          if (found.size > 0) {
            console.log(`Index page ${pageUrl}: found ${found.size} sold URLs`);
          }
          return found;
        } catch (err) {
          console.warn(`Index page scrape error for ${pageUrl}: ${err}`);
          return null;
        }
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        for (const url of result.value) {
          soldUrls.add(url);
        }
      }
    }
  }

  return soldUrls;
}

// ─── PRE-LLM SOLD/RENTED DETECTION ─────────────────────────────────────────

function isSoldOrRentedPage(markdown: string): boolean {
  const hebrewPatterns = [
    /נמכר[הו]?/,
    /הושכר[הו]?/,
    /בהסכם/,
    /לא\s*זמינ[הו]?/,
    /לא\s*פנוי[הו]?/,
    /אין\s*בנמצא/,
  ];

  const englishPatterns = [
    /\bsold\b/i,
    /\brented\b/i,
    /\bleased\b/i,
    /\bunder\s+contract\b/i,
    /\bunder\s+offer\b/i,
    /\bsale\s+agreed\b/i,
    /\blet\s+agreed\b/i,
    /\boff\s*market\b/i,
    /\bno\s+longer\s+available\b/i,
    /\bunavailable\b/i,
  ];

  const snippet = markdown.substring(0, 2000);

  for (const p of hebrewPatterns) {
    if (p.test(snippet)) return true;
  }
  for (const p of englishPatterns) {
    if (p.test(snippet)) return true;
  }
  return false;
}

// ─── DATA VALIDATION ────────────────────────────────────────────────────────

const VALID_PROPERTY_TYPES = [
  "apartment", "garden_apartment", "penthouse", "mini_penthouse",
  "duplex", "house", "cottage", "land", "commercial",
];
const VALID_LISTING_STATUSES = ["for_sale", "for_rent"];
const VALID_CONSTRUCTION_STATUSES = [
  "planning", "pre_sale", "foundation", "structure", "finishing", "delivery", "completed",
];

function validatePropertyData(listing: Record<string, any>): string[] {
  const errors: string[] = [];
  const currentYear = new Date().getFullYear();

  // Price validation — allow 0 (Price on Request) and null/undefined
  if (listing.price != null && listing.price < 0) {
    errors.push("price cannot be negative");
  } else if (listing.price != null && listing.price > 0 && listing.price < 1000) {
    errors.push(`price ${listing.price} seems too low (likely extraction error)`);
  }
  // price === 0 or null/undefined is allowed (Price on Request)

  // City is no longer validated here — handled by city whitelist gate after extraction

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
    errors.push(`year_built ${listing.year_built} is out of range (1800–${currentYear + 5})`);
  }

  return errors;
}

function validateProjectData(listing: Record<string, any>): string[] {
  const errors: string[] = [];

  const name = listing.project_name || listing.title;
  if (!name || typeof name !== "string" || name.trim() === "") {
    errors.push("project name is required");
  }

  // City is no longer validated here — handled by city whitelist gate after extraction

  if (listing.price_from != null && (typeof listing.price_from !== "number" || listing.price_from < 0)) {
    errors.push("price_from cannot be negative");
  }

  if (listing.construction_status && !VALID_CONSTRUCTION_STATUSES.includes(listing.construction_status)) {
    errors.push(`invalid construction_status '${listing.construction_status}'`);
  }

  return errors;
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
  const { agency_id, website_url } = body;
  if (!agency_id || !website_url) throw new Error("agency_id and website_url required");

  const sb = supabaseAdmin();
  const normalizedUrl = normalizeUrl(website_url);

  const { data: agency, error: agencyErr } = await sb
    .from("agencies")
    .select("id, admin_user_id")
    .eq("id", agency_id)
    .single();
  if (agencyErr || !agency) throw new Error("Agency not found");

  const { data: existingJobs } = await sb
    .from("import_jobs")
    .select("id, status, total_urls")
    .eq("agency_id", agency_id)
    .eq("website_url", normalizedUrl)
    .not("status", "eq", "failed")
    .order("created_at", { ascending: false })
    .limit(1);

  if (existingJobs && existingJobs.length > 0) {
    const existing = existingJobs[0];
    const { count } = await sb
      .from("import_job_items")
      .select("id", { count: "exact", head: true })
      .eq("job_id", existing.id);
    
    console.log(`Duplicate detected — returning existing job ${existing.id} (status: ${existing.status})`);
    return {
      job_id: existing.id,
      total_listings: existing.total_urls || 0,
      total_discovered: count || 0,
      resumed: true,
    };
  }

  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

  let formattedUrl = normalizedUrl;

  console.log("Mapping URL:", formattedUrl);
  const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: formattedUrl, limit: 500, includeSubdomains: false }),
  });

  const mapData = await mapRes.json();
  if (!mapRes.ok) throw new Error(`Firecrawl MAP failed: ${JSON.stringify(mapData)}`);

  const rawUrls: string[] = mapData.links || mapData.data || [];
  if (rawUrls.length === 0) throw new Error("No URLs discovered on this website");

  console.log(`Discovered ${rawUrls.length} total URLs`);

  // Pre-filter: remove URLs that contain sold/rented keywords
  const SOLD_URL_KEYWORDS = [
    'sold', 'rented', 'leased', 'archived', 'completed',
    'past-sale', 'under-contract', 'off-market',
    'נמכר', 'הושכר', 'בהסכם',
    '%D7%A0%D7%9E%D7%9B%D7%A8',  // נמכר URL-encoded
    '%D7%94%D7%95%D7%A9%D7%9B%D7%A8', // הושכר URL-encoded
  ];

  const allUrls = rawUrls.filter(url => {
    try {
      const decoded = decodeURIComponent(url).toLowerCase();
      return !SOLD_URL_KEYWORDS.some(kw => decoded.includes(kw));
    } catch {
      return true; // keep URL if decode fails
    }
  });

  const urlFilteredOut = rawUrls.length - allUrls.length;
  if (urlFilteredOut > 0) {
    console.log(`URL keyword filter: removed ${urlFilteredOut} sold/rented URLs, ${allUrls.length} remaining`);
  }

  // Index page sold-URL pre-filter: scrape listing grid pages to find sold badges
  let indexFilteredOut = 0;
  try {
    const soldUrlsFromIndex = await findSoldUrlsFromIndexPages(allUrls, normalizedUrl, FIRECRAWL_API_KEY);
    if (soldUrlsFromIndex.size > 0) {
      const beforeCount = allUrls.length;
      const filteredUrls = allUrls.filter(url => !soldUrlsFromIndex.has(normalizeUrl(url)));
      indexFilteredOut = beforeCount - filteredUrls.length;
      // Replace allUrls contents
      allUrls.length = 0;
      allUrls.push(...filteredUrls);
      console.log(`Index page filter: removed ${indexFilteredOut} sold/rented URLs, ${allUrls.length} remaining`);
    }
  } catch (err) {
    console.warn(`Index page pre-filter failed (non-blocking): ${err}`);
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const filterPrompt = `You are analyzing URLs from a real estate agency website. 
Given this list of URLs, identify which ones are individual property/listing detail pages OR project/development pages (not category pages, contact pages, about pages, blog posts, etc.).

Look for URL patterns that suggest individual listings, such as:
- URLs containing property IDs, slugs, or numeric identifiers
- URLs with paths like /property/, /listing/, /נכס/, /דירה/, etc.
- URLs that look like they point to a single property page

Also look for project/development pages:
- URLs with paths like /project/, /פרויקט/, /development/, /בנייה-חדשה/, /new-construction/
- URLs that point to a new construction development page

IMPORTANT: Only return URLs for ACTIVE, LIVE listings that are currently for sale or for rent. 
Exclude any URLs that appear to be sold, rented, leased, archived, off-market, or completed listings.
Look for signals like "sold", "rented", "נמכר", "הושכר", "under-contract", "past-sales", "archive" in the URL path or slug.

Return ONLY the active listing and project URLs as a JSON array of strings. If unsure about a URL, exclude it.

URLs to analyze:
${allUrls.join("\n")}`;

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: filterPrompt }],
      tools: [
        {
          type: "function",
          function: {
            name: "return_listing_urls",
            description: "Return the filtered listing and project URLs",
            parameters: {
              type: "object",
              properties: {
                listing_urls: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of URLs that are individual listing or project pages",
                },
              },
              required: ["listing_urls"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "return_listing_urls" } },
    }),
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    console.error("AI filter error:", aiRes.status, errText);
    throw new Error(`AI filtering failed (${aiRes.status})`);
  }

  const aiData = await aiRes.json();
  let listingUrls: string[] = [];

  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    const parsed = JSON.parse(toolCall.function.arguments);
    listingUrls = parsed.listing_urls || [];
  }

  if (listingUrls.length === 0) {
    console.log("AI returned 0 listing URLs, using all discovered URLs as fallback");
    listingUrls = allUrls.slice(0, 100);
  }

  console.log(`AI identified ${listingUrls.length} listing URLs`);

  const { data: job, error: jobErr } = await sb
    .from("import_jobs")
    .insert({
      agency_id,
      website_url: formattedUrl,
      status: "ready",
      total_urls: listingUrls.length,
      discovered_urls: allUrls,
    })
    .select("id")
    .single();
  if (jobErr) throw new Error(`Failed to create import job: ${jobErr.message}`);

  const items = listingUrls.map((url) => ({
    job_id: job.id,
    url,
    status: "pending",
  }));

  const { error: itemsErr } = await sb.from("import_job_items").insert(items);
  if (itemsErr) throw new Error(`Failed to create job items: ${itemsErr.message}`);

  return { job_id: job.id, total_listings: listingUrls.length, total_discovered: allUrls.length };
}

// ─── HELPERS: PARALLEL PROCESSING ───────────────────────────────────────────

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Geocoding rate limiter — serializes Nominatim calls with 1.1s gap
let _lastGeoTime = 0;
let _geoQueue: Promise<void> = Promise.resolve();

async function geocodeWithRateLimit(
  address: string,
  city: string
): Promise<{ lat: number; lng: number } | null> {
  // Chain onto the shared queue to serialize
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
          resolve({
            lat: parseFloat(geoData[0].lat),
            lng: parseFloat(geoData[0].lon),
          });
        } else {
          resolve(null);
        }
      } catch (geoErr) {
        console.warn("Geocoding failed:", geoErr);
        resolve(null);
      }
    });
  });
  return result;
}

// Parallel image download — batches of 5
async function parallelImageDownload(
  sourceImages: string[],
  sb: any,
  bucketName: string,
  jobId: string,
  maxImages = 15
): Promise<string[]> {
  const imageUrls: string[] = [];
  const images = sourceImages.slice(0, maxImages);
  const BATCH_SIZE = 5;

  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (imgUrl) => {
        const imgRes = await fetch(imgUrl);
        if (!imgRes.ok) return null;

        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
        const imgBuffer = await imgRes.arrayBuffer();
        const fileName = `imports/${jobId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadErr } = await sb.storage
          .from(bucketName)
          .upload(fileName, imgBuffer, { contentType, upsert: false });

        if (!uploadErr) {
          const { data: urlData } = sb.storage.from(bucketName).getPublicUrl(fileName);
          return urlData?.publicUrl || null;
        }
        return null;
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        imageUrls.push(r.value);
      }
    }
  }

  return imageUrls;
}

// Process a single item end-to-end
async function processOneItem(
  item: any,
  sb: any,
  job: any,
  agentId: string | null,
  firecrawlKey: string,
  lovableKey: string,
  jobId: string,
): Promise<{ succeeded: boolean }> {
  try {
    await sb.from("import_job_items").update({ status: "processing" }).eq("id", item.id);

    // 1. Scrape the page
    console.log(`Scraping: ${item.url}`);
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: item.url,
        formats: ["markdown", "links"],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) {
      const statusCode = scrapeRes.status;
      if (statusCode === 404 || statusCode === 410) {
        await sb.from("import_job_items").update({ status: "skipped", error_message: `Page not found (${statusCode})` }).eq("id", item.id);
        return { succeeded: false };
      }
      throw new Error(`Scrape failed: ${JSON.stringify(scrapeData)}`);
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const pageLinks = scrapeData.data?.links || scrapeData.links || [];

    if (!markdown || markdown.length < 50) {
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Page content too short — likely not a listing" }).eq("id", item.id);
      return { succeeded: false };
    }

    // Pre-LLM sold/rented keyword check
    if (isSoldOrRentedPage(markdown)) {
      console.log(`Pre-filter: sold/rented detected for ${item.url}`);
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Pre-filter: listing appears sold/rented" }).eq("id", item.id);
      return { succeeded: false };
    }

    // 2. AI extraction
    const domain = getDomainFromUrl(item.url);

    const extractionPrompt = `You are extracting structured data from a scraped Israeli real estate page.

IMPORTANT CONTEXT:
- Website domain: ${domain}
- Supported cities (return city as one of these EXACT names): ${SUPPORTED_CITIES.join(", ")}
- If the city is not explicitly stated on the page, INFER it from:
  1. The website domain name (e.g., "jerusalem-real-estate.co" → Jerusalem)
  2. The URL path
  3. Neighborhood context (e.g., Arnona, Baka, Talbieh → Jerusalem; Neve Tzedek → Tel Aviv)
- If no price is listed (e.g., "Price on Request", "Call for price", "Contact us for pricing"), set price to 0.
- Return city as one of the supported cities listed above.

FIRST, determine the CATEGORY of this page:
- "property": A single unit for sale or rent (resale, rental listing for one apartment/house)
- "project": A new construction project / development with multiple units, marketed by a developer. Keywords: פרויקט, project, development, new construction, בנייה חדשה, דירות חדשות, מתחם מגורים. These pages typically show a project name, multiple unit types, construction timeline, developer info, etc.
- "not_listing": Not a property listing or project page (blog, about, contact, category page, etc.)

FOR PROPERTIES — extract these fields:
- In Israel, "rooms" (חדרים) = bedrooms + 1 living room. So 4 rooms = 3 bedrooms. Always subtract 1 for bedrooms.
- Default currency is ILS (₪) unless explicitly stated otherwise.
- Property types: דירה=apartment, פנטהאוז=penthouse, דופלקס=duplex, בית/וילה=house, קוטג'=cottage, דירת גן=garden_apartment, מיני פנטהאוז=mini_penthouse
- listing_status: for_sale if buying/מכירה, for_rent if renting/השכרה
- Detect if sold (נמכר), rented (הושכר), under contract (בהסכם). Set is_sold_or_rented=true if so.
- Price might appear as "₪1,500,000" or "1,500,000 ש״ח" or "$450,000"
- Extract ALL image URLs you can find
- For floor: "קומה 3" = floor 3, "קרקע" = floor 0

FOR PROJECTS — extract these fields:
- project_name: The name of the development/project
- project_description: Description of the project
- city, neighborhood, address: Location
- price_from / price_to: Price range for units (numbers only, 0 if not listed)
- currency: ILS/USD/EUR
- total_units: Total number of units in the project
- construction_status: One of planning, pre_sale, foundation, structure, finishing, delivery, completed
- completion_date: Expected completion date (YYYY-MM-DD)
- amenities: List of project amenities
- image_urls: All image URLs found

Page URL: ${item.url}
Page content:
${markdown.substring(0, 8000)}

Links found on page:
${pageLinks.slice(0, 50).join("\n")}`;

    const extractRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: extractionPrompt }],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_listing",
              description: "Extract structured data from a real estate page — could be a property listing or a project/development",
              parameters: {
                type: "object",
                properties: {
                  listing_category: {
                    type: "string",
                    enum: ["property", "project", "not_listing"],
                    description: "The category of the page: property (single unit listing), project (new development), or not_listing",
                  },
                  title: { type: "string", description: "Listing title (for properties)" },
                  description: { type: "string", description: "Property description" },
                  price: { type: "number", description: "Price as number (0 if Price on Request)" },
                  currency: { type: "string", enum: ["ILS", "USD", "EUR"], description: "Currency code" },
                  bedrooms: { type: "number", description: "Number of bedrooms (rooms - 1)" },
                  bathrooms: { type: "number", description: "Number of bathrooms" },
                  size_sqm: { type: "number", description: "Size in square meters" },
                  address: { type: "string", description: "Street address" },
                  city: { type: "string", description: "City name — must be one of the supported cities" },
                  neighborhood: { type: "string", description: "Neighborhood name" },
                  property_type: {
                    type: "string",
                    enum: ["apartment", "garden_apartment", "penthouse", "mini_penthouse", "duplex", "house", "cottage", "land", "commercial"],
                  },
                  listing_status: { type: "string", enum: ["for_sale", "for_rent"] },
                  floor: { type: "number", description: "Floor number" },
                  total_floors: { type: "number", description: "Total floors in building" },
                  features: { type: "array", items: { type: "string" }, description: "Features like balcony, elevator, etc." },
                  parking: { type: "number", description: "Number of parking spots" },
                  entry_date: { type: "string", description: "Entry date (YYYY-MM-DD or 'immediate')" },
                  year_built: { type: "number", description: "Year built" },
                  ac_type: { type: "string", enum: ["none", "split", "central", "mini_central"] },
                  is_sold_or_rented: { type: "boolean", description: "True if listing is sold/rented/under contract" },
                  project_name: { type: "string", description: "Name of the project/development" },
                  project_description: { type: "string", description: "Description of the project" },
                  price_from: { type: "number", description: "Lowest unit price in project (0 if not listed)" },
                  price_to: { type: "number", description: "Highest unit price in project" },
                  total_units: { type: "number", description: "Total number of units" },
                  construction_status: {
                    type: "string",
                    enum: ["planning", "pre_sale", "foundation", "structure", "finishing", "delivery", "completed"],
                    description: "Construction stage",
                  },
                  completion_date: { type: "string", description: "Expected completion (YYYY-MM-DD)" },
                  amenities: { type: "array", items: { type: "string" }, description: "Project amenities" },
                  image_urls: { type: "array", items: { type: "string" }, description: "All image URLs found" },
                },
                required: ["listing_category"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_listing" } },
      }),
    });

    if (!extractRes.ok) {
      const errText = await extractRes.text();
      console.error("AI extraction error:", extractRes.status, errText);
      if (extractRes.status === 429) {
        await sb.from("import_job_items").update({ status: "pending", error_message: "Rate limited, will retry" }).eq("id", item.id);
        return { succeeded: false };
      }
      throw new Error(`AI extraction failed (${extractRes.status})`);
    }

    const extractData = await extractRes.json();
    const extractToolCall = extractData.choices?.[0]?.message?.tool_calls?.[0];

    if (!extractToolCall?.function?.arguments) {
      await sb.from("import_job_items").update({ status: "failed", error_message: "AI returned no extraction data" }).eq("id", item.id);
      return { succeeded: false };
    }

    const listing = JSON.parse(extractToolCall.function.arguments);

    // Store raw extraction
    await sb.from("import_job_items").update({ extracted_data: listing }).eq("id", item.id);

    const category = listing.listing_category || (listing.is_listing_page === false ? "not_listing" : "property");

    // ── NOT A LISTING / PROJECT ──
    if (category === "not_listing") {
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Not a listing page" }).eq("id", item.id);
      return { succeeded: false };
    }

    // ── POST-EXTRACTION CITY INFERENCE ──
    if (!listing.city || listing.city.trim() === "") {
      const domainCity = inferCityFromDomain(item.url);
      if (domainCity) {
        console.log(`City inferred from domain for ${item.url}: ${domainCity}`);
        listing.city = domainCity;
      }
    }

    // ── CITY WHITELIST GATE ──
    const matchedCity = matchSupportedCity(listing.city);
    if (!matchedCity) {
      await sb.from("import_job_items").update({
        status: "skipped",
        error_message: `City not supported: "${listing.city || '(none)'}". Only 25 featured cities are imported.`,
      }).eq("id", item.id);
      return { succeeded: false };
    }
    listing.city = matchedCity;

    // ── PROJECT PATH ──
    if (category === "project") {
      const projectErrors = validateProjectData(listing);
      if (projectErrors.length > 0) {
        await sb.from("import_job_items").update({
          status: "failed",
          error_message: `Validation failed: ${projectErrors.join("; ")}`,
        }).eq("id", item.id);
        return { succeeded: false };
      }

      const projectName = listing.project_name || listing.title || `Imported project from ${new URL(item.url).hostname}`;
      const projectCity = listing.city;

      // Duplicate detection for projects
      if (projectName && projectCity) {
        const { data: dupeProjects } = await sb
          .from("projects")
          .select("id")
          .ilike("name", projectName)
          .ilike("city", projectCity)
          .limit(1);

        if (dupeProjects && dupeProjects.length > 0) {
          await sb.from("import_job_items").update({
            status: "skipped",
            error_message: `Duplicate: matches existing project ${dupeProjects[0].id} (same name + city)`
          }).eq("id", item.id);
          return { succeeded: false };
        }
      }

      // Download & re-host images (parallel)
      const imageUrls = await parallelImageDownload(
        listing.image_urls || [], sb, "project-images", jobId
      );

      // Geocode (rate-limited)
      let latitude: number | null = null;
      let longitude: number | null = null;
      const geoAddr = listing.address || projectName;
      if (geoAddr && projectCity) {
        const coords = await geocodeWithRateLimit(geoAddr, projectCity);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lng;
        }
      }

      const slug = projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") + "-" + crypto.randomUUID().substring(0, 6);

      const statusMap: Record<string, string> = {
        planning: "planning", pre_sale: "pre_sale", foundation: "foundation",
        structure: "structure", finishing: "finishing", delivery: "delivery", completed: "completed",
      };
      const projectStatus = statusMap[listing.construction_status] || "pre_sale";

      const { data: project, error: projErr } = await sb
        .from("projects")
        .insert({
          name: projectName, slug,
          description: listing.project_description || listing.description || null,
          city: projectCity, neighborhood: listing.neighborhood || null,
          address: listing.address || null, latitude, longitude,
          status: projectStatus,
          total_units: listing.total_units || 0,
          available_units: listing.total_units || 0,
          price_from: listing.price_from || null,
          price_to: listing.price_to || null,
          currency: listing.currency || "ILS",
          completion_date: listing.completion_date || null,
          amenities: listing.amenities || null,
          images: imageUrls.length > 0 ? imageUrls : null,
          is_featured: false, is_published: false, views_count: 0,
          import_source: "website_scrape",
        })
        .select("id")
        .single();

      if (projErr) {
        console.error("Project insert error:", projErr);
        await sb.from("import_job_items").update({ status: "failed", error_message: `Project insert failed: ${projErr.message}` }).eq("id", item.id);
        return { succeeded: false };
      }

      await sb.from("import_job_items").update({ status: "done", project_id: project.id }).eq("id", item.id);
      return { succeeded: true };
    }

    // ── PROPERTY PATH ──

    if (listing.is_sold_or_rented) {
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Listing is sold or rented" }).eq("id", item.id);
      return { succeeded: false };
    }

    const propertyErrors = validatePropertyData(listing);
    if (propertyErrors.length > 0) {
      await sb.from("import_job_items").update({
        status: "failed",
        error_message: `Validation failed: ${propertyErrors.join("; ")}`,
      }).eq("id", item.id);
      return { succeeded: false };
    }

    // ── Duplicate detection (two-tier) ──
    // Tier 1: Same address + city
    if (listing.address && listing.city) {
      const trimmedAddr = listing.address.trim();
      if (trimmedAddr.length > 0) {
        const { data: dupes } = await sb
          .from("properties")
          .select("id")
          .eq("agent_id", agentId)
          .ilike("address", trimmedAddr)
          .ilike("city", listing.city.trim())
          .limit(1);

        if (dupes && dupes.length > 0) {
          await sb.from("import_job_items").update({
            status: "skipped",
            error_message: `Duplicate: matches existing property ${dupes[0].id} (same address + city)`
          }).eq("id", item.id);
          return { succeeded: false };
        }
      }
    }

    // Tier 2: Fuzzy match
    if (listing.city && listing.bedrooms != null && listing.size_sqm && listing.price && listing.price > 0) {
      const priceLow = listing.price * 0.95;
      const priceHigh = listing.price * 1.05;

      const { data: fuzzyDupes } = await sb
        .from("properties")
        .select("id")
        .eq("agent_id", agentId)
        .ilike("city", listing.city.trim())
        .eq("bedrooms", Math.floor(listing.bedrooms))
        .eq("size_sqm", listing.size_sqm)
        .gte("price", priceLow)
        .lte("price", priceHigh)
        .limit(1);

      if (fuzzyDupes && fuzzyDupes.length > 0) {
        await sb.from("import_job_items").update({
          status: "skipped",
          error_message: `Duplicate: matches existing property ${fuzzyDupes[0].id} (same city, rooms, size, ~price)`
        }).eq("id", item.id);
        return { succeeded: false };
      }
    }

    // Download and re-host images (parallel)
    const imageUrls = await parallelImageDownload(
      listing.image_urls || [], sb, "property-images", jobId
    );

    // Geocode (rate-limited)
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (listing.address && listing.city) {
      const coords = await geocodeWithRateLimit(listing.address, listing.city);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lng;
      }
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
        ac_type: listing.ac_type || null,
        entry_date: entryDate,
        is_published: false, is_featured: false, views_count: 0,
        verification_status: "draft",
        import_source: "website_scrape",
      })
      .select("id")
      .single();

    if (propErr) {
      console.error("Property insert error:", propErr);
      await sb.from("import_job_items").update({ status: "failed", error_message: `Insert failed: ${propErr.message}` }).eq("id", item.id);
      return { succeeded: false };
    }

    await sb.from("import_job_items").update({ status: "done", property_id: property.id }).eq("id", item.id);
    return { succeeded: true };
  } catch (err) {
    console.error(`Error processing ${item.url}:`, err);
    await sb
      .from("import_job_items")
      .update({ status: "failed", error_message: err instanceof Error ? err.message : "Unknown error" })
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
    .from("import_jobs")
    .select("*, agencies!inner(id, admin_user_id)")
    .eq("id", job_id)
    .single();
  if (jobErr || !job) throw new Error("Import job not found");

  const { data: pendingItems, error: itemsErr } = await sb
    .from("import_job_items")
    .select("*")
    .eq("job_id", job_id)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(10);
  if (itemsErr) throw new Error(`Failed to fetch pending items: ${itemsErr.message}`);

  if (!pendingItems || pendingItems.length === 0) {
    await sb.from("import_jobs").update({ status: "completed" }).eq("id", job_id);
    return { processed: 0, succeeded: 0, failed: 0, remaining: 0, status: "completed" };
  }

  await sb.from("import_jobs").update({ status: "processing" }).eq("id", job_id);

  const { data: agents } = await sb
    .from("agents")
    .select("id")
    .eq("agency_id", job.agency_id)
    .limit(1);
  const agentId = agents?.[0]?.id || null;

  let succeeded = 0;
  let failed = 0;

  // Reset geocode rate limiter for this batch
  _lastGeoTime = 0;
  _geoQueue = Promise.resolve();

  const CONCURRENCY = 3;
  const batchStartTime = Date.now();

  for (let i = 0; i < pendingItems.length; i += CONCURRENCY) {
    // Timeout safety: stop launching new chunks if we've used > 120s
    if (Date.now() - batchStartTime > 120_000) {
      console.log(`Timeout safety: ${Date.now() - batchStartTime}ms elapsed, stopping before chunk ${i}. Remaining items will be processed in next batch.`);
      break;
    }

    const chunk = pendingItems.slice(i, i + CONCURRENCY);
    console.log(`Processing chunk ${Math.floor(i / CONCURRENCY) + 1}: ${chunk.length} items concurrently`);

    const results = await Promise.allSettled(
      chunk.map(item => processOneItem(item, sb, job, agentId, FIRECRAWL_API_KEY, LOVABLE_API_KEY, job_id))
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.succeeded) {
        succeeded++;
      } else {
        failed++;
      }
    }
  }

  // Update job counts
  const { data: counts } = await sb
    .from("import_job_items")
    .select("status")
    .eq("job_id", job_id);

  const doneCount = counts?.filter((c) => c.status === "done").length || 0;
  const failedCount = counts?.filter((c) => ["failed", "skipped"].includes(c.status)).length || 0;
  const remainingCount = counts?.filter((c) => c.status === "pending").length || 0;

  const newStatus = remainingCount === 0 ? "completed" : "ready";

  await sb
    .from("import_jobs")
    .update({ processed_count: doneCount, failed_count: failedCount, status: newStatus })
    .eq("id", job_id);

  return {
    processed: pendingItems.length,
    succeeded,
    failed,
    remaining: remainingCount,
    status: newStatus,
  };
}

// ─── RETRY FAILED ───────────────────────────────────────────────────────────

async function handleRetryFailed(body: any) {
  const { job_id } = body;
  if (!job_id) throw new Error("job_id required");

  const sb = supabaseAdmin();

  const { data: resetItems, error: resetErr } = await sb
    .from("import_job_items")
    .update({ status: "pending", error_message: null })
    .eq("job_id", job_id)
    .in("status", ["failed", "skipped"])
    .select("id");

  if (resetErr) throw new Error(`Failed to reset items: ${resetErr.message}`);

  const resetCount = resetItems?.length || 0;

  if (resetCount > 0) {
    await sb.from("import_jobs").update({ status: "ready" }).eq("id", job_id);
  }

  return { reset_count: resetCount };
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
    if (action === "discover") {
      result = await handleDiscover(body);
    } else if (action === "process_batch") {
      result = await handleProcessBatch(body);
    } else if (action === "retry_failed") {
      result = await handleRetryFailed(body);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

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
