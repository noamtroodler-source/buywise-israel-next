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

  const allUrls: string[] = mapData.links || mapData.data || [];
  if (allUrls.length === 0) throw new Error("No URLs discovered on this website");

  console.log(`Discovered ${allUrls.length} total URLs`);

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

Return ONLY the listing and project URLs as a JSON array of strings. If unsure about a URL, exclude it.

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

  for (const item of pendingItems) {
    try {
      await sb.from("import_job_items").update({ status: "processing" }).eq("id", item.id);

      // 1. Scrape the page
      console.log(`Scraping: ${item.url}`);
      const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
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
          failed++;
          continue;
        }
        throw new Error(`Scrape failed: ${JSON.stringify(scrapeData)}`);
      }

      const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
      const pageLinks = scrapeData.data?.links || scrapeData.links || [];

      if (!markdown || markdown.length < 50) {
        await sb.from("import_job_items").update({ status: "skipped", error_message: "Page content too short — likely not a listing" }).eq("id", item.id);
        failed++;
        continue;
      }

      // Pre-LLM sold/rented keyword check
      if (isSoldOrRentedPage(markdown)) {
        console.log(`Pre-filter: sold/rented detected for ${item.url}`);
        await sb.from("import_job_items").update({ status: "skipped", error_message: "Pre-filter: listing appears sold/rented" }).eq("id", item.id);
        failed++;
        continue;
      }

      // 2. AI extraction — with domain hint + supported cities context
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
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
          failed++;
          continue;
        }
        throw new Error(`AI extraction failed (${extractRes.status})`);
      }

      const extractData = await extractRes.json();
      const extractToolCall = extractData.choices?.[0]?.message?.tool_calls?.[0];

      if (!extractToolCall?.function?.arguments) {
        await sb.from("import_job_items").update({ status: "failed", error_message: "AI returned no extraction data" }).eq("id", item.id);
        failed++;
        continue;
      }

      const listing = JSON.parse(extractToolCall.function.arguments);

      // Store raw extraction
      await sb.from("import_job_items").update({ extracted_data: listing }).eq("id", item.id);

      const category = listing.listing_category || (listing.is_listing_page === false ? "not_listing" : "property");

      // ── NOT A LISTING / PROJECT ──
      if (category === "not_listing") {
        await sb.from("import_job_items").update({ status: "skipped", error_message: "Not a listing page" }).eq("id", item.id);
        failed++;
        continue;
      }

      // ── POST-EXTRACTION CITY INFERENCE ──
      // If AI didn't extract a city, try to infer from domain
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
        failed++;
        continue;
      }
      listing.city = matchedCity; // Use canonical name

      // ── PROJECT PATH ──
      if (category === "project") {
        const projectErrors = validateProjectData(listing);
        if (projectErrors.length > 0) {
          await sb.from("import_job_items").update({
            status: "failed",
            error_message: `Validation failed: ${projectErrors.join("; ")}`,
          }).eq("id", item.id);
          failed++;
          continue;
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
            failed++;
            continue;
          }
        }

        // Download & re-host images
        const imageUrls: string[] = [];
        const sourceImages = listing.image_urls || [];
        for (const imgUrl of sourceImages.slice(0, 15)) {
          try {
            const imgRes = await fetch(imgUrl);
            if (!imgRes.ok) continue;
            const contentType = imgRes.headers.get("content-type") || "image/jpeg";
            const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
            const imgBuffer = await imgRes.arrayBuffer();
            const fileName = `imports/${job_id}/${crypto.randomUUID()}.${ext}`;
            const { error: uploadErr } = await sb.storage
              .from("project-images")
              .upload(fileName, imgBuffer, { contentType, upsert: false });
            if (!uploadErr) {
              const { data: urlData } = sb.storage.from("project-images").getPublicUrl(fileName);
              if (urlData?.publicUrl) imageUrls.push(urlData.publicUrl);
            }
          } catch (imgErr) {
            console.warn("Image download failed:", imgUrl, imgErr);
          }
        }

        // Geocode
        let latitude: number | null = null;
        let longitude: number | null = null;
        const geoAddr = listing.address || projectName;
        if (geoAddr && projectCity) {
          try {
            const geoQuery = encodeURIComponent(`${geoAddr}, ${projectCity}, Israel`);
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${geoQuery}&format=json&limit=1`,
              { headers: { "User-Agent": "BuyWiseIsrael/1.0" } }
            );
            const geoData = await geoRes.json();
            if (geoData?.[0]) {
              latitude = parseFloat(geoData[0].lat);
              longitude = parseFloat(geoData[0].lon);
            }
          } catch (geoErr) {
            console.warn("Geocoding failed:", geoErr);
          }
        }

        const slug = projectName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") + "-" + crypto.randomUUID().substring(0, 6);

        const statusMap: Record<string, string> = {
          planning: "planning",
          pre_sale: "pre_sale",
          foundation: "foundation",
          structure: "structure",
          finishing: "finishing",
          delivery: "delivery",
          completed: "completed",
        };
        const projectStatus = statusMap[listing.construction_status] || "pre_sale";

        const { data: project, error: projErr } = await sb
          .from("projects")
          .insert({
            name: projectName,
            slug,
            description: listing.project_description || listing.description || null,
            city: projectCity,
            neighborhood: listing.neighborhood || null,
            address: listing.address || null,
            latitude,
            longitude,
            status: projectStatus,
            total_units: listing.total_units || 0,
            available_units: listing.total_units || 0,
            price_from: listing.price_from || null,
            price_to: listing.price_to || null,
            currency: listing.currency || "ILS",
            completion_date: listing.completion_date || null,
            amenities: listing.amenities || null,
            images: imageUrls.length > 0 ? imageUrls : null,
            is_featured: false,
            is_published: false,
            views_count: 0,
            import_source: "website_scrape",
          })
          .select("id")
          .single();

        if (projErr) {
          console.error("Project insert error:", projErr);
          await sb.from("import_job_items").update({ status: "failed", error_message: `Project insert failed: ${projErr.message}` }).eq("id", item.id);
          failed++;
          continue;
        }

        await sb.from("import_job_items").update({ status: "done", project_id: project.id }).eq("id", item.id);
        succeeded++;
        continue;
      }

      // ── PROPERTY PATH ──

      // Sold or rented listing?
      if (listing.is_sold_or_rented) {
        await sb.from("import_job_items").update({ status: "skipped", error_message: "Listing is sold or rented" }).eq("id", item.id);
        failed++;
        continue;
      }

      // Validate property data (relaxed price rules)
      const propertyErrors = validatePropertyData(listing);
      if (propertyErrors.length > 0) {
        await sb.from("import_job_items").update({
          status: "failed",
          error_message: `Validation failed: ${propertyErrors.join("; ")}`,
        }).eq("id", item.id);
        failed++;
        continue;
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
            failed++;
            continue;
          }
        }
      }

      // Tier 2: Fuzzy match — city + rooms + size + ~price (skip if price is 0 / Price on Request)
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
          failed++;
          continue;
        }
      }

      // Download and re-host images
      const imageUrls: string[] = [];
      const sourceImages = listing.image_urls || [];

      for (const imgUrl of sourceImages.slice(0, 15)) {
        try {
          const imgRes = await fetch(imgUrl);
          if (!imgRes.ok) continue;

          const contentType = imgRes.headers.get("content-type") || "image/jpeg";
          const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
          const imgBuffer = await imgRes.arrayBuffer();
          const fileName = `imports/${job_id}/${crypto.randomUUID()}.${ext}`;

          const { error: uploadErr } = await sb.storage
            .from("property-images")
            .upload(fileName, imgBuffer, { contentType, upsert: false });

          if (!uploadErr) {
            const { data: urlData } = sb.storage.from("property-images").getPublicUrl(fileName);
            if (urlData?.publicUrl) imageUrls.push(urlData.publicUrl);
          }
        } catch (imgErr) {
          console.warn("Image download failed:", imgUrl, imgErr);
        }
      }

      // Geocode
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (listing.address && listing.city) {
        try {
          const geoQuery = encodeURIComponent(`${listing.address}, ${listing.city}, Israel`);
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${geoQuery}&format=json&limit=1`,
            { headers: { "User-Agent": "BuyWiseIsrael/1.0" } }
          );
          const geoData = await geoRes.json();
          if (geoData?.[0]) {
            latitude = parseFloat(geoData[0].lat);
            longitude = parseFloat(geoData[0].lon);
          }
        } catch (geoErr) {
          console.warn("Geocoding failed:", geoErr);
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
          price: listing.price || 0, // 0 = Price on Request
          currency: listing.currency || "ILS",
          address: listing.address || "",
          city: listing.city, // Already canonical from whitelist gate
          neighborhood: listing.neighborhood || null,
          latitude,
          longitude,
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
          is_published: false,
          is_featured: false,
          views_count: 0,
          verification_status: "draft",
          import_source: "website_scrape",
        })
        .select("id")
        .single();

      if (propErr) {
        console.error("Property insert error:", propErr);
        await sb.from("import_job_items").update({ status: "failed", error_message: `Insert failed: ${propErr.message}` }).eq("id", item.id);
        failed++;
        continue;
      }

      await sb.from("import_job_items").update({ status: "done", property_id: property.id }).eq("id", item.id);
      succeeded++;
    } catch (err) {
      console.error(`Error processing ${item.url}:`, err);
      await sb
        .from("import_job_items")
        .update({ status: "failed", error_message: err instanceof Error ? err.message : "Unknown error" })
        .eq("id", item.id);
      failed++;
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
