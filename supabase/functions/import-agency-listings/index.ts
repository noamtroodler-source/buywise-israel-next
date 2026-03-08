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

// validateProjectData removed — projects are no longer imported (add via Project Wizard)

// ─── AI URL CLASSIFICATION (BATCHED) ────────────────────────────────────────

async function classifyUrlChunk(
  urls: string[],
  lovableKey: string
): Promise<string[]> {
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
      headers: {
        Authorization: `Bearer ${lovableKey}`,
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
                    description: "Array of URLs that are individual listing pages only (no projects/developments)",
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
      console.warn(`AI chunk classification failed (${aiRes.status}): ${errText}`);
      return [];
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return parsed.listing_urls || [];
    }
    return [];
  } catch (err) {
    console.warn(`classifyUrlChunk failed (non-fatal): ${err}`);
    return [];
  }
}

async function classifyUrlsInBatches(
  allUrls: string[],
  lovableKey: string,
  chunkSize = 80,
  concurrency = 3
): Promise<string[]> {
  // Split into chunks
  const chunks: string[][] = [];
  for (let i = 0; i < allUrls.length; i += chunkSize) {
    chunks.push(allUrls.slice(i, i + chunkSize));
  }

  console.log(`Classifying ${allUrls.length} URLs in ${chunks.length} chunk(s) (concurrency=${concurrency})`);

  const allResults = new Set<string>();
  let totalFailed = 0;

  // Process chunks in parallel groups
  for (let i = 0; i < chunks.length; i += concurrency) {
    const group = chunks.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      group.map(chunk => classifyUrlChunk(chunk, lovableKey))
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value.length > 0) {
        for (const url of r.value) allResults.add(url);
      } else if (r.status === "rejected") {
        totalFailed++;
        console.warn(`Chunk classification rejected: ${r.reason}`);
      } else if (r.status === "fulfilled" && r.value.length === 0) {
        // Could be a failure that returned [] or genuinely no listings in chunk
        totalFailed++;
      }
    }
  }

  const listingUrls = Array.from(allResults);

  // If ALL chunks failed, fall back to first 100 URLs
  if (listingUrls.length === 0) {
    console.log("All AI classification chunks returned 0 results, using fallback (first 100 URLs)");
    return allUrls.slice(0, 100);
  }

  console.log(`Batch classification complete: ${listingUrls.length} unique listing URLs from ${chunks.length} chunks (${totalFailed} returned empty)`);
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

  // Gather all previously-known URLs for this agency + website combo (for incremental dedup)
  const { data: previousJobIds } = await sb
    .from("import_jobs")
    .select("id")
    .eq("agency_id", agency_id)
    .eq("website_url", normalizedUrl);

  let knownUrlSet = new Set<string>();
  if (previousJobIds && previousJobIds.length > 0) {
    const jobIds = previousJobIds.map((j: any) => j.id);
    // Fetch all URLs from previous job items in batches (Supabase 1000-row limit)
    for (let i = 0; i < jobIds.length; i += 50) {
      const batch = jobIds.slice(i, i + 50);
      const { data: prevItems } = await sb
        .from("import_job_items")
        .select("url")
        .in("job_id", batch);
      if (prevItems) {
        for (const item of prevItems) {
          knownUrlSet.add(normalizeUrl(item.url));
        }
      }
    }
    console.log(`Found ${knownUrlSet.size} previously-known URLs across ${previousJobIds.length} past jobs`);
  }

  // Also check properties table for source_url matches (catches listings from deleted jobs)
  const { data: existingProperties } = await sb
    .from("properties")
    .select("source_url")
    .eq("agency_id", agency_id)
    .not("source_url", "is", null);
  if (existingProperties) {
    for (const prop of existingProperties) {
      if (prop.source_url) knownUrlSet.add(normalizeUrl(prop.source_url));
    }
    console.log(`Added ${existingProperties.length} source_urls from properties table, total known: ${knownUrlSet.size}`);
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

  let rawUrls: string[] = mapData.links || mapData.data || [];
  console.log(`Firecrawl map returned ${rawUrls.length} URLs`);

  // Fallback: if map returned very few URLs, scrape the provided page and extract links
  const MAP_LOW_YIELD_THRESHOLD = 5;
  if (rawUrls.length < MAP_LOW_YIELD_THRESHOLD) {
    console.log(`Low yield from map (${rawUrls.length} < ${MAP_LOW_YIELD_THRESHOLD}), using scrape fallback to extract links from ${formattedUrl}`);
    try {
      const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formattedUrl,
          formats: ["links"],
          onlyMainContent: false,
        }),
      });
      const scrapeData = await scrapeRes.json();
      if (scrapeRes.ok) {
        const scrapedLinks: string[] = scrapeData?.data?.links || scrapeData?.links || [];
        // Filter to same domain only
        const baseDomain = getDomainFromUrl(formattedUrl).replace(/^www\./, "");
        const sameDomainLinks = scrapedLinks.filter(link => {
          try {
            const linkDomain = new URL(link).hostname.replace(/^www\./, "").toLowerCase();
            return linkDomain === baseDomain || linkDomain.endsWith(`.${baseDomain}`);
          } catch { return false; }
        });
        // Merge with map results (dedup)
        const existingSet = new Set(rawUrls.map(u => normalizeUrl(u)));
        let added = 0;
        for (const link of sameDomainLinks) {
          const norm = normalizeUrl(link);
          if (!existingSet.has(norm)) {
            rawUrls.push(link);
            existingSet.add(norm);
            added++;
          }
        }
        console.log(`Scrape fallback: found ${sameDomainLinks.length} same-domain links, added ${added} new URLs (total: ${rawUrls.length})`);
      } else {
        console.warn(`Scrape fallback failed: ${JSON.stringify(scrapeData)}`);
      }
    } catch (err) {
      console.warn(`Scrape fallback error (non-blocking): ${err}`);
    }
  }

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

  // Non-listing URL pattern pre-filter (before AI classification)
  const { listingCandidates, removed: nonListingRemoved } = filterNonListingUrls(allUrls);
  if (nonListingRemoved > 0 && listingCandidates.length > 0) {
    allUrls.length = 0;
    allUrls.push(...listingCandidates);
    console.log(`Non-listing pattern filter: removed ${nonListingRemoved} URLs, ${allUrls.length} remaining`);
  } else if (nonListingRemoved > 0 && listingCandidates.length === 0) {
    console.warn(`Non-listing filter would remove ALL ${allUrls.length} URLs — skipping filter (safety check)`);
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  // Subtract already-known URLs BEFORE AI classification to save AI calls
  const newUrls = knownUrlSet.size > 0
    ? allUrls.filter(url => !knownUrlSet.has(normalizeUrl(url)))
    : allUrls;
  const skippedExisting = allUrls.length - newUrls.length;
  
  if (skippedExisting > 0) {
    console.log(`Incremental dedup: ${skippedExisting} URLs already known, ${newUrls.length} new URLs to classify`);
  }

  // If no new URLs, return early without creating a job
  if (newUrls.length === 0) {
    console.log(`All ${allUrls.length} discovered URLs already known — site is up to date`);
    return {
      job_id: null,
      total_listings: 0,
      total_discovered: allUrls.length,
      new_urls: 0,
      skipped_existing: skippedExisting,
    };
  }

  const listingUrls = await classifyUrlsInBatches(newUrls, LOVABLE_API_KEY);
  console.log(`AI identified ${listingUrls.length} listing URLs from ${newUrls.length} new candidates`);

  if (listingUrls.length === 0) {
    console.log(`No new listing URLs found after classification`);
    return {
      job_id: null,
      total_listings: 0,
      total_discovered: allUrls.length,
      new_urls: 0,
      skipped_existing: skippedExisting,
    };
  }

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

  return {
    job_id: job.id,
    total_listings: listingUrls.length,
    total_discovered: allUrls.length,
    new_urls: listingUrls.length,
    skipped_existing: skippedExisting,
  };
}

// ─── HELPERS: PARALLEL PROCESSING ───────────────────────────────────────────

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
  // Project/development segments — skip entirely (agencies add projects manually)
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
    try {
      const parsed = new URL(url);
      pathname = parsed.pathname;
    } catch {
      // If URL can't be parsed, keep it (let AI decide)
      listingCandidates.push(url);
      continue;
    }

    // Decode for Hebrew/encoded URLs
    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(pathname).toLowerCase();
    } catch {
      decodedPath = pathname.toLowerCase();
    }

    // Check file extension
    const lastDot = decodedPath.lastIndexOf(".");
    if (lastDot > decodedPath.lastIndexOf("/")) {
      const ext = decodedPath.slice(lastDot);
      if (NON_LISTING_EXTENSIONS.has(ext)) {
        removed++;
        continue;
      }
    }

    // Check path segments (exact match only)
    const segments = decodedPath.split("/").filter(Boolean);
    const hasBlockedSegment = segments.some(seg => NON_LISTING_SEGMENTS.has(seg));
    if (hasBlockedSegment) {
      removed++;
      continue;
    }

    listingCandidates.push(url);
  }

  return { listingCandidates, removed };
}


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

// Enhance a single image via AI (best-effort, returns original on failure)
async function enhanceImage(
  imagePublicUrl: string,
  sb: any,
  bucketName: string,
  jobId: string,
): Promise<string> {
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return imagePublicUrl;

    const enhancePath = `imports/${jobId}/${crypto.randomUUID()}-enhanced.png`;

    const res = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/enhance-image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imagePublicUrl,
          bucket: bucketName,
          path: enhancePath,
        }),
      }
    );

    if (!res.ok) {
      console.log(`Enhancement failed (${res.status}), keeping original`);
      return imagePublicUrl;
    }

    const data = await res.json();
    if (data.success && data.enhanced && data.image_url) {
      console.log(`Image enhanced: ${data.image_url.slice(0, 80)}`);
      return data.image_url;
    }
    return imagePublicUrl;
  } catch (err) {
    console.log(`Enhancement error, keeping original:`, err);
    return imagePublicUrl;
  }
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
      batch.map(async (imgUrl, batchIdx) => {
        const globalIdx = i + batchIdx;
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
          const publicUrl = urlData?.publicUrl || null;
          if (!publicUrl) return null;

          // Only enhance the first image (cover photo) to reduce costs
          if (globalIdx === 0) {
            const enhanced = await enhanceImage(publicUrl, sb, bucketName, jobId);
            return enhanced;
          }
          return publicUrl;
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

// Lightweight pre-check: HEAD request to detect dead links before using a Firecrawl credit
async function preCheckUrl(url: string): Promise<{
  ok: boolean;
  skipReason: string | null;
  finalUrl: string | null;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PropertyImporter/1.0)",
      },
    });

    // Some servers reject HEAD requests
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PropertyImporter/1.0)",
        },
      });
    }

    clearTimeout(timeout);

    const status = response.status;
    const finalUrl = response.url;

    // Dead links
    if (status === 404 || status === 410 || status === 451) {
      return { ok: false, skipReason: `HTTP ${status} — page not found`, finalUrl };
    }

    // Server errors
    if (status >= 500) {
      return { ok: false, skipReason: `HTTP ${status} — server error`, finalUrl };
    }

    // Check if redirect landed on homepage (common for deleted listings)
    if (finalUrl !== url) {
      try {
        const originalPath = new URL(url).pathname;
        const finalPath = new URL(finalUrl).pathname;
        if (finalPath === "/" && originalPath !== "/") {
          return { ok: false, skipReason: `Redirected to homepage (listing removed)`, finalUrl };
        }
      } catch { /* URL parse failed, continue anyway */ }
    }

    return { ok: true, skipReason: null, finalUrl };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { ok: false, skipReason: "Pre-check timed out (8s)", finalUrl: null };
    }
    return { ok: false, skipReason: `Pre-check network error: ${err.message?.slice(0, 100)}`, finalUrl: null };
  }
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
  domainCity: string | null = null,
): Promise<{ succeeded: boolean }> {
  try {
    await sb.from("import_job_items").update({ status: "processing" }).eq("id", item.id);

    // 0a. Skip duplicate URLs early (free, no Firecrawl credit or AI call)
    const { data: existingByUrl } = await sb
      .from("properties")
      .select("id")
      .eq("source_url", item.url)
      .limit(1);

    if (existingByUrl && existingByUrl.length > 0) {
      console.log(`URL duplicate skip: ${item.url} → existing property ${existingByUrl[0].id}`);
      await sb.from("import_job_items")
        .update({ status: "skipped", error_message: `Duplicate: URL already imported as property ${existingByUrl[0].id}`, error_type: "permanent" })
        .eq("id", item.id);
      return { succeeded: false };
    }

    // 0b. Also check if another item in the same job already imported this URL
    const { data: existingJobItem } = await sb
      .from("import_job_items")
      .select("id, property_id")
      .eq("job_id", jobId)
      .eq("url", item.url)
      .eq("status", "done")
      .neq("id", item.id)
      .limit(1);

    if (existingJobItem && existingJobItem.length > 0) {
      console.log(`In-job duplicate skip: ${item.url} → already done as item ${existingJobItem[0].id}`);
      await sb.from("import_job_items")
        .update({ status: "skipped", error_message: `Duplicate: same URL already processed in this job`, error_type: "permanent" })
        .eq("id", item.id);
      return { succeeded: false };
    }

    // 0c. Lightweight pre-check (free, no Firecrawl credit)
    const preCheck = await preCheckUrl(item.url);
    if (!preCheck.ok) {
      console.log(`Pre-check skip: ${item.url} — ${preCheck.skipReason}`);
      // Timeouts and network errors are transient; 404s/redirects are permanent
      const preCheckErrorType = (preCheck.skipReason?.includes("timed out") || preCheck.skipReason?.includes("network error")) ? "transient" : "permanent";
      await sb.from("import_job_items")
        .update({ status: "skipped", error_message: preCheck.skipReason, error_type: preCheckErrorType })
        .eq("id", item.id);
      return { succeeded: false };
    }

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
        await sb.from("import_job_items").update({ status: "skipped", error_message: `Page not found (${statusCode})`, error_type: "permanent" }).eq("id", item.id);
        return { succeeded: false };
      }
      // 5xx and other scrape failures are transient
      await sb.from("import_job_items").update({ status: "failed", error_message: `Scrape failed (${statusCode})`, error_type: "transient" }).eq("id", item.id);
      return { succeeded: false };
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const pageLinks = scrapeData.data?.links || scrapeData.links || [];

    if (!markdown || markdown.length < 50) {
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Page content too short — likely not a listing", error_type: "permanent" }).eq("id", item.id);
      return { succeeded: false };
    }

    // Pre-LLM sold/rented keyword check
    if (isSoldOrRentedPage(markdown)) {
      console.log(`Pre-filter: sold/rented detected for ${item.url}`);
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Pre-filter: listing appears sold/rented", error_type: "permanent" }).eq("id", item.id);
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
- "project": A new construction project / development with multiple units — these should be SKIPPED
- "not_listing": Not a property listing page (blog, about, contact, category page, etc.)

FOR PROPERTIES — extract these fields:
- In Israel, "rooms" (חדרים) = bedrooms + 1 living room. So 4 rooms = 3 bedrooms. Always subtract 1 for bedrooms.
- Default currency is ILS (₪) unless explicitly stated otherwise.
- Property types: דירה=apartment, פנטהאוז=penthouse, דופלקס=duplex, בית/וילה=house, קוטג'=cottage, דירת גן=garden_apartment, מיני פנטהאוז=mini_penthouse
- listing_status: for_sale if buying/מכירה, for_rent if renting/השכרה
- Detect if sold (נמכר), rented (הושכר), under contract (בהסכם). Set is_sold_or_rented=true if so.
- Price might appear as "₪1,500,000" or "1,500,000 ש״ח" or "$450,000"
- Extract ALL image URLs you can find
- For floor: "קומה 3" = floor 3, "קרקע" = floor 0

If this is a project/development page, just set listing_category to "project" — no other fields needed.

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
              description: "Extract structured data from a real estate listing page (resale/rental only)",
              parameters: {
                type: "object",
                properties: {
                  listing_category: {
                    type: "string",
                    enum: ["property", "project", "not_listing"],
                    description: "The category of the page: property (single listing), project (new development — will be skipped), or not_listing",
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
        await sb.from("import_job_items").update({ status: "pending", error_message: "Rate limited, will retry", error_type: "transient" }).eq("id", item.id);
        return { succeeded: false };
      }
      // Other AI failures are transient (might work on retry)
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

    // ── NOT A LISTING ──
    if (category === "not_listing") {
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Not a listing page", error_type: "permanent" }).eq("id", item.id);
      return { succeeded: false };
    }

    // ── PROJECT/DEVELOPMENT — skip (add manually via Project Wizard) ──
    if (category === "project") {
      console.log(`Project page skipped: ${item.url}`);
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Project/development page — skipped (add projects manually via Project Wizard)", error_type: "permanent" }).eq("id", item.id);
      return { succeeded: false };
    }

    // ── POST-EXTRACTION CITY INFERENCE (cached at batch level) ──
    if (!listing.city || listing.city.trim() === "") {
      if (domainCity) {
        listing.city = domainCity;
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
    listing.city = matchedCity;

    // Project path removed — projects are now skipped above before reaching this point

    // ── PROPERTY PATH ──

    if (listing.is_sold_or_rented) {
      await sb.from("import_job_items").update({ status: "skipped", error_message: "Listing is sold or rented", error_type: "permanent" }).eq("id", item.id);
      return { succeeded: false };
    }

    const propertyErrors = validatePropertyData(listing);
    if (propertyErrors.length > 0) {
      await sb.from("import_job_items").update({
        status: "failed",
        error_message: `Validation failed: ${propertyErrors.join("; ")}`,
        error_type: "permanent",
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
            error_message: `Duplicate: matches existing property ${dupes[0].id} (same address + city)`,
            error_type: "permanent",
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
          error_message: `Duplicate: matches existing property ${fuzzyDupes[0].id} (same city, rooms, size, ~price)`,
          error_type: "permanent",
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
    await sb
      .from("import_job_items")
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
    .from("import_jobs")
    .select("*, agencies!inner(id, admin_user_id)")
    .eq("id", job_id)
    .single();
  if (jobErr || !job) throw new Error("Import job not found");

  // Cache domain→city inference once for the entire batch
  const cachedDomainCity = inferCityFromDomain(job.website_url);
  if (cachedDomainCity) {
    console.log(`Domain city cached for job: ${cachedDomainCity} (from ${job.website_url})`);
  }

  // Check if there's any pending work before setting up
  const { data: initialCheck } = await sb
    .from("import_job_items")
    .select("id")
    .eq("job_id", job_id)
    .eq("status", "pending")
    .limit(1);

  if (!initialCheck || initialCheck.length === 0) {
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

  // Reset geocode rate limiter for this batch
  _lastGeoTime = 0;
  _geoQueue = Promise.resolve();

  const CONCURRENCY = 3;
  const REFILL_SIZE = 6;
  const MAX_ITEMS = 9; // Hard cap per single batch call (3 concurrency × 3 chunks)
  const TIME_LIMIT_MS = 120_000;
  const batchStartTime = Date.now();

  let totalProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;
  let refillCycle = 0;

  while (true) {
    // Check item cap
    if (totalProcessed >= MAX_ITEMS) {
      console.log(`Item cap (${MAX_ITEMS}) reached after ${refillCycle} refill cycles, ${totalProcessed} items processed`);
      break;
    }
    // Time check before fetching more work
    if (Date.now() - batchStartTime > TIME_LIMIT_MS) {
      console.log(`Time limit reached after ${refillCycle} refill cycles, ${totalProcessed} items processed`);
      break;
    }

    // Fetch next batch of pending items
    const { data: pendingItems, error: itemsErr } = await sb
      .from("import_job_items")
      .select("*")
      .eq("job_id", job_id)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(Math.min(REFILL_SIZE, MAX_ITEMS - totalProcessed));

    if (itemsErr) {
      console.error(`Failed to fetch pending items on refill ${refillCycle}:`, itemsErr.message);
      break;
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log(`No more pending items after ${refillCycle} refill cycles, ${totalProcessed} items processed`);
      break;
    }

    refillCycle++;
    console.log(`Refill cycle ${refillCycle}: fetched ${pendingItems.length} pending items`);

    // Process in chunks of CONCURRENCY
    for (let i = 0; i < pendingItems.length && totalProcessed < MAX_ITEMS; i += CONCURRENCY) {
      if (Date.now() - batchStartTime > TIME_LIMIT_MS) {
        console.log(`Time limit reached mid-refill at chunk ${i}, stopping`);
        break;
      }

      const chunk = pendingItems.slice(i, i + CONCURRENCY);
      console.log(`Refill ${refillCycle}, chunk ${Math.floor(i / CONCURRENCY) + 1}: ${chunk.length} items`);

      const results = await Promise.allSettled(
        chunk.map(item => processOneItem(item, sb, job, agentId, FIRECRAWL_API_KEY, LOVABLE_API_KEY, job_id, cachedDomainCity))
      );

      for (const result of results) {
        totalProcessed++;
        if (result.status === "fulfilled" && result.value.succeeded) {
          totalSucceeded++;
        } else {
          totalFailed++;
        }
      }
    }
  }

  const elapsedSec = ((Date.now() - batchStartTime) / 1000).toFixed(1);
  console.log(`Batch complete: ${totalProcessed} processed (${totalSucceeded} ok, ${totalFailed} failed) in ${elapsedSec}s across ${refillCycle} refills`);

  // Update job counts from DB (source of truth)
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
    processed: totalProcessed,
    succeeded: totalSucceeded,
    failed: totalFailed,
    remaining: remainingCount,
    status: newStatus,
  };
}

// ─── RETRY FAILED ───────────────────────────────────────────────────────────

async function handleRetryFailed(body: any) {
  const { job_id } = body;
  if (!job_id) throw new Error("job_id required");

  const sb = supabaseAdmin();

  // Only reset transient failures (worth retrying)
  const { data: resetItems, error: resetErr } = await sb
    .from("import_job_items")
    .update({ status: "pending", error_message: null, error_type: null })
    .eq("job_id", job_id)
    .in("status", ["failed", "skipped"])
    .eq("error_type", "transient")
    .select("id");

  if (resetErr) throw new Error(`Failed to reset items: ${resetErr.message}`);

  const resetCount = resetItems?.length || 0;

  // Count permanent failures for UI feedback
  const { count: permanentCount } = await sb
    .from("import_job_items")
    .select("id", { count: "exact", head: true })
    .eq("job_id", job_id)
    .in("status", ["failed", "skipped"])
    .eq("error_type", "permanent");

  if (resetCount > 0) {
    await sb.from("import_jobs").update({ status: "ready" }).eq("id", job_id);
  }

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
