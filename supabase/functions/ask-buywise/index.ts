import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-user-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter
const rateLimiter = new Map<string, number[]>();

function isRateLimited(sessionId: string): boolean {
  const now = Date.now();
  const window = 60_000;
  const maxRequests = 5;
  const timestamps = (rateLimiter.get(sessionId) || []).filter(t => now - t < window);
  if (timestamps.length >= maxRequests) return true;
  timestamps.push(now);
  rateLimiter.set(sessionId, timestamps);
  return false;
}

// ─── Tool Definitions ───────────────────────────────────────────────────────

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_listings",
      description: "Search for properties currently listed for sale or rent on BuyWise. Use this whenever a user asks about available apartments, houses, listings, or wants to see what's on the market.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "City name, e.g. 'Ra\\'anana', 'Netanya', 'Jerusalem'" },
          neighborhood: { type: "string", description: "Neighborhood name within the city" },
          listing_status: { type: "string", enum: ["for_sale", "for_rent"], description: "Whether to search sale or rental listings. Defaults to for_sale." },
          property_type: { type: "string", enum: ["apartment", "garden_apartment", "penthouse", "mini_penthouse", "duplex", "house", "cottage", "land", "commercial"], description: "Type of property" },
          min_bedrooms: { type: "number", description: "Minimum number of bedrooms" },
          max_bedrooms: { type: "number", description: "Maximum number of bedrooms" },
          min_price: { type: "number", description: "Minimum price in ILS" },
          max_price: { type: "number", description: "Maximum price in ILS" },
          min_size: { type: "number", description: "Minimum size in sqm" },
          max_size: { type: "number", description: "Maximum size in sqm" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_projects",
      description: "Search for new construction / off-plan projects (from developers). Use when users ask about new builds, new construction, projects, or developer projects.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "City name" },
          min_price: { type: "number", description: "Minimum starting price in ILS" },
          max_price: { type: "number", description: "Maximum starting price in ILS" },
          status: { type: "string", enum: ["planning", "pre_sale", "under_construction", "partially_delivered", "completed"], description: "Project status" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_city_stats",
      description: "Get market statistics and price data for a specific city. Use when users ask about prices, trends, or market conditions in a city.",
      parameters: {
        type: "object",
        properties: {
          city_name: { type: "string", description: "City name, e.g. 'Netanya', 'Ra\\'anana'" },
        },
        required: ["city_name"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_nearby_comps",
      description: "Get recently sold comparable properties near a specific location. Use when users ask about recent sales, fair price, or want comps for negotiation.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "City name" },
          latitude: { type: "number", description: "Latitude of the property" },
          longitude: { type: "number", description: "Longitude of the property" },
          min_rooms: { type: "number", description: "Minimum rooms to filter comps" },
          max_rooms: { type: "number", description: "Maximum rooms to filter comps" },
        },
        required: ["city"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "compare_areas",
      description: "Compare two cities side by side. Use when a user asks to compare cities, is deciding between areas, or asks 'X vs Y'. Returns price/sqm, yields, commute, lifestyle, arnona, anglo presence.",
      parameters: {
        type: "object",
        properties: {
          city_a: { type: "string", description: "First city name" },
          city_b: { type: "string", description: "Second city name" },
        },
        required: ["city_a", "city_b"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_listing_details",
      description: "Get full details about a specific property listing by its ID. Use when a user asks 'tell me more about that one', clicks a listing, or asks a follow-up about a specific property.",
      parameters: {
        type: "object",
        properties: {
          property_id: { type: "string", description: "UUID of the property" },
        },
        required: ["property_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "calculate_purchase_tax",
      description: "Calculate Israeli purchase tax (mas rechisha) for a given price and buyer type. Use when users ask about purchase tax, how much tax they'll pay, or tax savings.",
      parameters: {
        type: "object",
        properties: {
          price: { type: "number", description: "Property price in ILS" },
          buyer_type: { type: "string", enum: ["first_time", "oleh", "upgrader", "investor", "foreign", "company"], description: "Buyer category. first_time = first apartment, oleh = new immigrant within 7 years, upgrader = selling existing within 24 months (Amendment 76), investor = additional property, foreign = non-resident, company = corporate." },
        },
        required: ["price", "buyer_type"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_neighborhood_profile",
      description: "Get detailed neighborhood information including narrative, reputation, best-for, anglo community, daily life, and honest tradeoffs. Use when users ask 'what's X neighborhood like?' or want neighborhood-level detail.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "City name" },
          neighborhood: { type: "string", description: "Neighborhood name" },
        },
        required: ["city", "neighborhood"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_user_saved_listings",
      description: "Get the authenticated user's saved/favorited listings. Use when users ask about their saved properties, want to compare their favorites, or ask 'anything new like my saved ones?'. Only works for logged-in users.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "calculate_affordability",
      description: "Calculate how much property a buyer can afford based on income, debts, and down payment. Uses Bank of Israel PTI/LTV rules. Use when users ask 'how much can I afford?', 'what's my budget?', or 'can I afford X?'.",
      parameters: {
        type: "object",
        properties: {
          monthly_income: { type: "number", description: "Monthly gross income in ILS" },
          existing_debts: { type: "number", description: "Existing monthly debt payments in ILS (default 0)" },
          down_payment: { type: "number", description: "Available down payment in ILS" },
          buyer_type: { type: "string", enum: ["first_time", "oleh", "investor", "foreign"], description: "Buyer category for LTV limits" },
          currency: { type: "string", enum: ["ILS", "USD"], description: "Currency of income (for display). Default ILS." },
        },
        required: ["monthly_income", "down_payment"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "calculate_rental_yield",
      description: "Calculate estimated rental yield for a property. Use when users ask about investment returns, rental income, or 'is this a good investment?'.",
      parameters: {
        type: "object",
        properties: {
          property_price: { type: "number", description: "Property purchase price in ILS" },
          city: { type: "string", description: "City name to look up rental ranges" },
          bedrooms: { type: "number", description: "Number of bedrooms (3, 4, or 5). Affects rental estimate." },
          monthly_rent: { type: "number", description: "Known monthly rent in ILS. If provided, skips city lookup." },
        },
        required: ["property_price", "city"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "compare_listings",
      description: "Compare 2-3 property listings side by side. Use when a user asks to compare specific properties, says 'compare these', or wants a side-by-side view.",
      parameters: {
        type: "object",
        properties: {
          property_ids: {
            type: "array",
            items: { type: "string" },
            description: "Array of 2-3 property UUIDs to compare",
          },
        },
        required: ["property_ids"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "explain_term",
      description: "Look up a Hebrew real estate term from the BuyWise glossary. Use when users ask 'what is X?', 'what does Y mean?', or encounter unfamiliar Hebrew/legal terms.",
      parameters: {
        type: "object",
        properties: {
          term: { type: "string", description: "The term to look up — can be English, Hebrew, or transliteration" },
        },
        required: ["term"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_platform_overview",
      description: "Get a detailed breakdown of BuyWise platform inventory — listings by neighborhood, property type distribution, price quartiles, and agent coverage. Use when users ask 'what do you have?', 'how many listings?', 'what areas do you cover?', or want a detailed market overview.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "Optional city to filter the overview" },
          listing_status: { type: "string", enum: ["for_sale", "for_rent"], description: "Filter by sale or rent. Defaults to for_sale." },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
];

// ─── Tool Executors ─────────────────────────────────────────────────────────

async function executeSearchListings(supabase: any, args: any): Promise<string> {
  let query = supabase
    .from("properties")
    .select("id, title, city, neighborhood, price, bedrooms, bathrooms, size_sqm, property_type, listing_status, currency, floor, total_floors, features, condition, entry_date, parking")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (args.city) query = query.ilike("city", `%${args.city}%`);
  if (args.neighborhood) query = query.ilike("neighborhood", `%${args.neighborhood}%`);
  if (args.listing_status) query = query.eq("listing_status", args.listing_status);
  else query = query.eq("listing_status", "for_sale");
  if (args.property_type) query = query.eq("property_type", args.property_type);
  if (args.min_bedrooms) query = query.gte("bedrooms", args.min_bedrooms);
  if (args.max_bedrooms) query = query.lte("bedrooms", args.max_bedrooms);
  if (args.min_price) query = query.gte("price", args.min_price);
  if (args.max_price) query = query.lte("price", args.max_price);
  if (args.min_size) query = query.gte("size_sqm", args.min_size);
  if (args.max_size) query = query.lte("size_sqm", args.max_size);

  const { data, error } = await query;
  if (error) return `Error searching listings: ${error.message}`;
  if (!data?.length) return "No listings found matching those criteria. Try broadening your search.";

  const results = data.map((p: any) => ({
    id: p.id,
    title: p.title || `${p.bedrooms}BR ${p.property_type} in ${p.neighborhood || p.city}`,
    city: p.city,
    neighborhood: p.neighborhood,
    price: p.price,
    currency: p.currency || "ILS",
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    size_sqm: p.size_sqm,
    property_type: p.property_type,
    listing_status: p.listing_status,
    floor: p.floor,
    total_floors: p.total_floors,
    condition: p.condition,
    entry_date: p.entry_date,
    parking: p.parking,
    features: p.features?.slice(0, 5),
    link: `/property/${p.id}`,
  }));

  return JSON.stringify({ count: results.length, listings: results });
}

async function executeSearchProjects(supabase: any, args: any): Promise<string> {
  let query = supabase
    .from("projects")
    .select("id, name, slug, city, neighborhood, price_from, price_to, status, min_bedrooms, max_bedrooms, estimated_completion, developer_id")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (args.city) query = query.ilike("city", `%${args.city}%`);
  if (args.min_price) query = query.gte("price_from", args.min_price);
  if (args.max_price) query = query.lte("price_from", args.max_price);
  if (args.status) query = query.eq("status", args.status);

  const { data, error } = await query;
  if (error) return `Error searching projects: ${error.message}`;
  if (!data?.length) return "No new construction projects found matching those criteria.";

  const results = data.map((p: any) => ({
    name: p.name,
    slug: p.slug,
    city: p.city,
    neighborhood: p.neighborhood,
    price_from: p.price_from,
    price_to: p.price_to,
    status: p.status,
    bedrooms: p.min_bedrooms && p.max_bedrooms ? `${p.min_bedrooms}-${p.max_bedrooms}` : null,
    estimated_completion: p.estimated_completion,
    link: `/projects/${p.slug}`,
  }));

  return JSON.stringify({ count: results.length, projects: results });
}

async function executeGetCityStats(supabase: any, args: any): Promise<string> {
  const { data: city } = await supabase
    .from("cities")
    .select("name, average_price, average_price_sqm, yoy_price_change, median_apartment_price, gross_yield_percent, rental_3_room_min, rental_3_room_max, rental_4_room_min, rental_4_room_max, population, socioeconomic_rank, commute_time_tel_aviv, commute_time_jerusalem, arnona_rate_sqm, average_vaad_bayit, identity_sentence, highlights")
    .ilike("name", `%${args.city_name}%`)
    .limit(1)
    .maybeSingle();

  if (!city) return `No city data found for "${args.city_name}". Try a different city name.`;

  const { data: priceHistory } = await supabase
    .from("city_price_history")
    .select("year, quarter, rooms, avg_price_nis")
    .ilike("city_en", `%${args.city_name}%`)
    .order("year", { ascending: false })
    .order("quarter", { ascending: false })
    .limit(8);

  const { count: listingCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true)
    .ilike("city", `%${args.city_name}%`);

  return JSON.stringify({
    city: city.name,
    average_price: city.average_price,
    price_per_sqm: city.average_price_sqm,
    yoy_change: city.yoy_price_change,
    median_apartment_price: city.median_apartment_price,
    gross_yield: city.gross_yield_percent,
    rental_3br: city.rental_3_room_min && city.rental_3_room_max ? `₪${city.rental_3_room_min}-${city.rental_3_room_max}/mo` : null,
    rental_4br: city.rental_4_room_min && city.rental_4_room_max ? `₪${city.rental_4_room_min}-${city.rental_4_room_max}/mo` : null,
    population: city.population,
    socioeconomic_rank: city.socioeconomic_rank,
    commute_tel_aviv: city.commute_time_tel_aviv,
    commute_jerusalem: city.commute_time_jerusalem,
    arnona_per_sqm: city.arnona_rate_sqm,
    avg_vaad_bayit: city.average_vaad_bayit,
    description: city.identity_sentence,
    highlights: city.highlights,
    active_listings: listingCount || 0,
    recent_prices: priceHistory || [],
  });
}

async function executeGetNearbyComps(supabase: any, args: any): Promise<string> {
  if (args.latitude && args.longitude) {
    const { data, error } = await supabase.rpc("get_nearby_sold_comps", {
      p_lat: args.latitude,
      p_lng: args.longitude,
      p_city: args.city,
      p_radius_km: 0.5,
      p_months_back: 24,
      p_limit: 5,
      p_min_rooms: args.min_rooms || null,
      p_max_rooms: args.max_rooms || null,
    });

    if (error) return `Error fetching comps: ${error.message}`;
    if (!data?.length) return `No recent sold comparables found near that location in ${args.city}.`;

    return JSON.stringify({
      count: data.length,
      comps: data.map((c: any) => ({
        sold_price: c.sold_price,
        sold_date: c.sold_date,
        rooms: c.rooms,
        size_sqm: c.size_sqm,
        property_type: c.property_type,
        price_per_sqm: c.price_per_sqm,
        distance_meters: c.distance_meters,
        is_same_building: c.is_same_building,
      })),
    });
  }

  const { data, error } = await supabase
    .from("sold_transactions")
    .select("sold_price, sold_date, rooms, size_sqm, property_type, price_per_sqm, neighborhood")
    .eq("city", args.city)
    .order("sold_date", { ascending: false })
    .limit(5);

  if (error) return `Error fetching comps: ${error.message}`;
  if (!data?.length) return `No recent sold data found for ${args.city}.`;

  return JSON.stringify({ count: data.length, comps: data });
}

// ─── NEW Tool Executors ─────────────────────────────────────────────────────

async function executeCompareAreas(supabase: any, args: any): Promise<string> {
  const { data: cities, error } = await supabase
    .from("cities")
    .select("name, slug, average_price, average_price_sqm, average_price_sqm_min, average_price_sqm_max, yoy_price_change, median_apartment_price, gross_yield_percent, gross_yield_percent_min, gross_yield_percent_max, net_yield_percent, rental_3_room_min, rental_3_room_max, rental_4_room_min, rental_4_room_max, population, socioeconomic_rank, commute_time_tel_aviv, commute_time_jerusalem, has_train_station, arnona_rate_sqm, arnona_rate_sqm_min, arnona_rate_sqm_max, average_vaad_bayit, average_vaad_bayit_min, average_vaad_bayit_max, anglo_presence, anglo_note, identity_sentence, highlights, card_description, region")
    .or(`name.ilike.%${args.city_a}%,name.ilike.%${args.city_b}%`);

  if (error) return `Error comparing areas: ${error.message}`;
  if (!cities || cities.length < 2) return `Could not find data for both cities. Found: ${cities?.map((c: any) => c.name).join(', ') || 'none'}. Try exact city names.`;

  // Match each input to closest result
  const matchCity = (input: string) =>
    cities.find((c: any) => c.name.toLowerCase().includes(input.toLowerCase())) || cities[0];

  const a = matchCity(args.city_a);
  const b = matchCity(args.city_b);

  const formatCity = (c: any) => ({
    name: c.name,
    identity: c.identity_sentence,
    region: c.region,
    population: c.population,
    socioeconomic_rank: c.socioeconomic_rank,
    avg_price: c.average_price,
    price_per_sqm: c.average_price_sqm,
    price_per_sqm_range: c.average_price_sqm_min && c.average_price_sqm_max ? `₪${c.average_price_sqm_min.toLocaleString()}-${c.average_price_sqm_max.toLocaleString()}` : null,
    yoy_change: c.yoy_price_change,
    median_apartment: c.median_apartment_price,
    gross_yield: c.gross_yield_percent,
    gross_yield_range: c.gross_yield_percent_min && c.gross_yield_percent_max ? `${c.gross_yield_percent_min}%-${c.gross_yield_percent_max}%` : null,
    rental_3br: c.rental_3_room_min && c.rental_3_room_max ? `₪${c.rental_3_room_min}-${c.rental_3_room_max}` : null,
    rental_4br: c.rental_4_room_min && c.rental_4_room_max ? `₪${c.rental_4_room_min}-${c.rental_4_room_max}` : null,
    commute_tel_aviv_min: c.commute_time_tel_aviv,
    commute_jerusalem_min: c.commute_time_jerusalem,
    has_train: c.has_train_station,
    arnona_per_sqm: c.arnona_rate_sqm,
    vaad_bayit: c.average_vaad_bayit,
    anglo_presence: c.anglo_presence,
    anglo_note: c.anglo_note,
    highlights: c.highlights,
    link: `/areas/${c.slug}`,
  });

  return JSON.stringify({ city_a: formatCity(a), city_b: formatCity(b) });
}

async function executeGetListingDetails(supabase: any, args: any): Promise<string> {
  const { data: p, error } = await supabase
    .from("properties")
    .select("id, title, description, city, neighborhood, address, price, original_price, currency, bedrooms, bathrooms, size_sqm, lot_size_sqm, property_type, listing_status, condition, floor, total_floors, year_built, features, parking, ac_type, is_furnished, furnished_status, furniture_items, is_accessible, entry_date, vaad_bayit_monthly, allows_pets, pets_policy, lease_term, subletting_allowed, agent_fee_required, bank_guarantee_required, checks_required, featured_highlight, images, created_at, price_reduced_at, agent_id")
    .eq("id", args.property_id)
    .maybeSingle();

  if (error) return `Error fetching property: ${error.message}`;
  if (!p) return `Property not found with ID ${args.property_id}. It may have been removed.`;

  // Fetch agent info
  let agentInfo = null;
  if (p.agent_id) {
    const { data: agent } = await supabase
      .from("agents")
      .select("name, agency_name, phone, email, languages, years_experience, is_verified")
      .eq("id", p.agent_id)
      .maybeSingle();
    if (agent) {
      agentInfo = {
        name: agent.name,
        agency: agent.agency_name,
        languages: agent.languages,
        experience_years: agent.years_experience,
        verified: agent.is_verified,
      };
    }
  }

  const result: any = {
    id: p.id,
    title: p.title,
    description: p.description?.slice(0, 500),
    city: p.city,
    neighborhood: p.neighborhood,
    address: p.address,
    price: p.price,
    currency: p.currency || "ILS",
    original_price: p.original_price,
    price_reduced: p.price_reduced_at ? true : false,
    price_drop_percent: p.original_price && p.price < p.original_price
      ? Math.round((1 - p.price / p.original_price) * 100)
      : null,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    size_sqm: p.size_sqm,
    lot_size_sqm: p.lot_size_sqm,
    property_type: p.property_type,
    listing_status: p.listing_status,
    condition: p.condition,
    floor: p.floor,
    total_floors: p.total_floors,
    year_built: p.year_built,
    features: p.features,
    parking: p.parking,
    ac_type: p.ac_type,
    furnished: p.furnished_status || (p.is_furnished ? "yes" : "no"),
    furniture_items: p.furniture_items,
    accessible: p.is_accessible,
    entry_date: p.entry_date,
    vaad_bayit: p.vaad_bayit_monthly,
    pets: p.pets_policy || p.allows_pets,
    lease_term: p.lease_term,
    subletting: p.subletting_allowed,
    agent_fee: p.agent_fee_required,
    bank_guarantee: p.bank_guarantee_required,
    checks_required: p.checks_required,
    highlight: p.featured_highlight,
    images_count: p.images?.length || 0,
    listed_at: p.created_at,
    agent: agentInfo,
    link: `/property/${p.id}`,
  };

  return JSON.stringify(result);
}

async function executeCalculatePurchaseTax(supabase: any, args: any): Promise<string> {
  const { price, buyer_type } = args;

  // Fetch current brackets from DB
  const { data: brackets, error } = await supabase
    .from("purchase_tax_brackets")
    .select("bracket_min, bracket_max, rate_percent")
    .eq("buyer_type", buyer_type)
    .eq("is_current", true)
    .order("bracket_min", { ascending: true });

  if (error) return `Error fetching tax brackets: ${error.message}`;

  // Fallback brackets if DB is empty
  const effectiveBrackets = brackets?.length ? brackets : getFallbackBrackets(buyer_type);

  let totalTax = 0;
  let remainingPrice = price;
  const breakdown: any[] = [];

  for (const bracket of effectiveBrackets) {
    if (remainingPrice <= 0) break;
    const bracketMax = bracket.bracket_max ?? Infinity;
    const bracketSize = bracketMax - bracket.bracket_min;
    const taxableAmount = Math.min(remainingPrice, bracketSize);
    const rate = bracket.rate_percent / 100;
    const taxAmount = Math.round(taxableAmount * rate);

    breakdown.push({
      range: `₪${bracket.bracket_min.toLocaleString()} – ${bracket.bracket_max ? `₪${bracket.bracket_max.toLocaleString()}` : "above"}`,
      rate: `${bracket.rate_percent}%`,
      taxable: taxableAmount,
      tax: taxAmount,
    });

    totalTax += taxAmount;
    remainingPrice -= taxableAmount;
  }

  const effectiveRate = price > 0 ? Math.round((totalTax / price) * 10000) / 100 : 0;

  // Compare with investor rate for savings
  let investorTax = 0;
  if (buyer_type !== "investor" && buyer_type !== "foreign" && buyer_type !== "company") {
    const investorBrackets = getFallbackBrackets("investor");
    let rem = price;
    for (const b of investorBrackets) {
      if (rem <= 0) break;
      const bMax = b.bracket_max ?? Infinity;
      const taxable = Math.min(rem, bMax - b.bracket_min);
      investorTax += Math.round(taxable * (b.rate_percent / 100));
      rem -= taxable;
    }
  }

  return JSON.stringify({
    price,
    buyer_type,
    total_tax: totalTax,
    effective_rate_percent: effectiveRate,
    breakdown,
    savings_vs_investor: buyer_type !== "investor" ? Math.round(investorTax - totalTax) : 0,
    note: "These are 2024 brackets. Consult a tax advisor for your specific situation.",
    calculator_link: "/tools?tool=purchase-tax",
  });
}

function getFallbackBrackets(buyerType: string) {
  const brackets: Record<string, { bracket_min: number; bracket_max: number | null; rate_percent: number }[]> = {
    first_time: [
      { bracket_min: 0, bracket_max: 1978745, rate_percent: 0 },
      { bracket_min: 1978745, bracket_max: 2347040, rate_percent: 3.5 },
      { bracket_min: 2347040, bracket_max: 6055070, rate_percent: 5 },
      { bracket_min: 6055070, bracket_max: 20183560, rate_percent: 8 },
      { bracket_min: 20183560, bracket_max: null, rate_percent: 10 },
    ],
    oleh: [
      { bracket_min: 0, bracket_max: 1978745, rate_percent: 0 },
      { bracket_min: 1978745, bracket_max: 6055070, rate_percent: 0.5 },
      { bracket_min: 6055070, bracket_max: 20183560, rate_percent: 8 },
      { bracket_min: 20183560, bracket_max: null, rate_percent: 10 },
    ],
    upgrader: [
      { bracket_min: 0, bracket_max: 1978745, rate_percent: 0 },
      { bracket_min: 1978745, bracket_max: 2347040, rate_percent: 3.5 },
      { bracket_min: 2347040, bracket_max: 6055070, rate_percent: 5 },
      { bracket_min: 6055070, bracket_max: 20183560, rate_percent: 8 },
      { bracket_min: 20183560, bracket_max: null, rate_percent: 10 },
    ],
    investor: [
      { bracket_min: 0, bracket_max: 6055070, rate_percent: 8 },
      { bracket_min: 6055070, bracket_max: null, rate_percent: 10 },
    ],
    foreign: [
      { bracket_min: 0, bracket_max: 6055070, rate_percent: 8 },
      { bracket_min: 6055070, bracket_max: null, rate_percent: 10 },
    ],
    company: [
      { bracket_min: 0, bracket_max: 6055070, rate_percent: 8 },
      { bracket_min: 6055070, bracket_max: null, rate_percent: 10 },
    ],
  };
  return brackets[buyerType] || brackets.investor;
}

async function executeGetNeighborhoodProfile(supabase: any, args: any): Promise<string> {
  const { data: profile, error } = await supabase
    .from("neighborhood_profiles")
    .select("city, neighborhood, narrative, reputation, best_for, anglo_community, daily_life, honest_tradeoff, transit_mobility, schools_education, religious_life, dining_nightlife, green_spaces, safety_feel, avg_price_indicator, rental_indicator")
    .ilike("city", `%${args.city}%`)
    .ilike("neighborhood", `%${args.neighborhood}%`)
    .limit(1)
    .maybeSingle();

  if (error) return `Error fetching neighborhood profile: ${error.message}`;
  if (!profile) return `No detailed profile found for ${args.neighborhood} in ${args.city}. Try a different spelling or neighborhood name.`;

  return JSON.stringify({
    city: profile.city,
    neighborhood: profile.neighborhood,
    narrative: profile.narrative,
    reputation: profile.reputation,
    best_for: profile.best_for,
    anglo_community: profile.anglo_community,
    daily_life: profile.daily_life,
    honest_tradeoff: profile.honest_tradeoff,
    transit: profile.transit_mobility,
    schools: profile.schools_education,
    religious_life: profile.religious_life,
    dining: profile.dining_nightlife,
    green_spaces: profile.green_spaces,
    safety: profile.safety_feel,
    price_indicator: profile.avg_price_indicator,
    rental_indicator: profile.rental_indicator,
  });
}

async function executeGetUserSavedListings(supabase: any, _args: any, userId?: string): Promise<string> {
  if (!userId) return "User is not logged in. Saved listings are only available for authenticated users. Suggest they sign up or log in.";

  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("property_id, created_at, properties:property_id(id, title, city, neighborhood, price, bedrooms, bathrooms, size_sqm, property_type, listing_status, condition, currency)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return `Error fetching saved listings: ${error.message}`;
  if (!favorites?.length) return "No saved listings found. The user hasn't favorited any properties yet.";

  const results = favorites
    .filter((f: any) => f.properties)
    .map((f: any) => {
      const p = f.properties;
      return {
        id: p.id,
        title: p.title || `${p.bedrooms}BR ${p.property_type} in ${p.neighborhood || p.city}`,
        city: p.city,
        neighborhood: p.neighborhood,
        price: p.price,
        currency: p.currency || "ILS",
        bedrooms: p.bedrooms,
        size_sqm: p.size_sqm,
        property_type: p.property_type,
        listing_status: p.listing_status,
        saved_at: f.created_at,
        link: `/property/${p.id}`,
      };
    });

  return JSON.stringify({ count: results.length, saved_listings: results });
}

// ─── Affordability Tool ──────────────────────────────────────────────────────

async function executeCalculateAffordability(_supabase: any, args: any): Promise<string> {
  const monthlyIncome = args.monthly_income || 0;
  const existingDebts = args.existing_debts || 0;
  const downPayment = args.down_payment || 0;
  const buyerType = args.buyer_type || "first_time";

  const ltvLimits: Record<string, number> = {
    first_time: 0.75, oleh: 0.75, investor: 0.50, foreign: 0.50, upgrader: 0.70,
  };
  const ltvLimit = ltvLimits[buyerType] || 0.75;
  const maxPtiRatio = 0.40;

  const rates = { low: 4.5, mid: 5.25, high: 6.0 };
  const termYears = 25;

  const calcMonthlyPayment = (principal: number, annualRate: number): number => {
    if (principal <= 0) return 0;
    const r = annualRate / 100 / 12;
    const n = termYears * 12;
    if (r === 0) return principal / n;
    return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  };

  const calcMaxMortgage = (maxPayment: number, annualRate: number): number => {
    const r = annualRate / 100 / 12;
    const n = termYears * 12;
    if (r === 0 || maxPayment <= 0) return 0;
    return maxPayment * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
  };

  const maxMonthlyPayment = Math.max(0, (monthlyIncome * maxPtiRatio) - existingDebts);

  const scenarios = Object.entries(rates).map(([label, rate]) => {
    const maxMortgage = calcMaxMortgage(maxMonthlyPayment, rate);
    const maxPriceFromMortgage = maxMortgage / ltvLimit;
    const maxPriceFromDown = downPayment > 0 ? downPayment / (1 - ltvLimit) : Infinity;
    const maxPrice = Math.min(maxPriceFromMortgage, maxPriceFromDown);
    const actualMortgage = maxPrice * ltvLimit;
    const monthlyPayment = calcMonthlyPayment(actualMortgage, rate);
    const downRequired = maxPrice * (1 - ltvLimit);
    return { label, rate, maxPrice: Math.round(maxPrice), maxMortgage: Math.round(maxMortgage), monthlyPayment: Math.round(monthlyPayment), downRequired: Math.round(downRequired) };
  });

  const low = scenarios.find(s => s.label === "low")!;
  const high = scenarios.find(s => s.label === "high")!;
  const mid = scenarios.find(s => s.label === "mid")!;

  const ptiAtMid = monthlyIncome > 0 ? (mid.monthlyPayment + existingDebts) / monthlyIncome : 0;
  let comfortLevel: string;
  if (ptiAtMid < 0.25) comfortLevel = "Comfortable — room to breathe";
  else if (ptiAtMid <= 0.33) comfortLevel = "Manageable — but watch your budget";
  else if (ptiAtMid <= 0.40) comfortLevel = "Stretched — at the Bank of Israel limit";
  else comfortLevel = "Over limit — banks won't approve this";

  return JSON.stringify({
    max_property_price_range: `₪${(high.maxPrice / 1e6).toFixed(1)}M – ₪${(low.maxPrice / 1e6).toFixed(1)}M`,
    max_mortgage_range: `₪${(high.maxMortgage / 1e6).toFixed(1)}M – ₪${(low.maxMortgage / 1e6).toFixed(1)}M`,
    monthly_payment_range: `₪${high.monthlyPayment.toLocaleString()} – ₪${low.monthlyPayment.toLocaleString()}/mo`,
    down_payment_required: `₪${mid.downRequired.toLocaleString()}`,
    ltv_limit: `${(ltvLimit * 100).toFixed(0)}%`,
    pti_limit: "40% (Bank of Israel cap)",
    comfort_level: comfortLevel,
    buyer_type: buyerType,
    rate_assumption: "4.5% – 6.0% (current market range)",
    term: `${termYears} years`,
    note: "BuyWise Estimate — rates and approval depend on your specific bank and financial profile.",
    calculator_link: "/tools?tool=affordability",
  });
}

// ─── Rental Yield Tool ──────────────────────────────────────────────────────

async function executeCalculateRentalYield(supabase: any, args: any): Promise<string> {
  const price = args.property_price;
  const city = args.city;
  const bedrooms = args.bedrooms || 3;
  let monthlyRent = args.monthly_rent;

  if (!monthlyRent) {
    const { data: cityData } = await supabase
      .from("cities")
      .select("rental_3_room_min, rental_3_room_max, rental_4_room_min, rental_4_room_max, rental_5_room_min, rental_5_room_max, gross_yield_percent, gross_yield_percent_min, gross_yield_percent_max")
      .ilike("name", `%${city}%`)
      .limit(1)
      .maybeSingle();

    if (cityData) {
      const roomKey = bedrooms >= 5 ? 5 : bedrooms >= 4 ? 4 : 3;
      const minRent = cityData[`rental_${roomKey}_room_min`];
      const maxRent = cityData[`rental_${roomKey}_room_max`];

      if (minRent && maxRent) {
        const grossYieldLow = price > 0 ? ((minRent * 12) / price * 100).toFixed(1) : "0";
        const grossYieldHigh = price > 0 ? ((maxRent * 12) / price * 100).toFixed(1) : "0";
        const netYieldLow = (parseFloat(grossYieldLow) * 0.75).toFixed(1);
        const netYieldHigh = (parseFloat(grossYieldHigh) * 0.75).toFixed(1);

        return JSON.stringify({
          property_price: price, city, bedrooms: roomKey,
          monthly_rent_range: `₪${minRent.toLocaleString()} – ₪${maxRent.toLocaleString()}/mo`,
          gross_yield_range: `${grossYieldLow}% – ${grossYieldHigh}%`,
          net_yield_estimate: `${netYieldLow}% – ${netYieldHigh}% (after expenses)`,
          city_avg_yield: cityData.gross_yield_percent ? `${cityData.gross_yield_percent}%` : null,
          city_yield_range: cityData.gross_yield_percent_min && cityData.gross_yield_percent_max
            ? `${cityData.gross_yield_percent_min}% – ${cityData.gross_yield_percent_max}%` : null,
          expenses_note: "Net yield deducts ~25% for arnona, va'ad bayit, maintenance, and vacancy",
          label: "BuyWise Estimate",
          calculator_link: "/tools?tool=true-cost",
        });
      }
    }
    return JSON.stringify({ property_price: price, city, error: `No rental data found for ${bedrooms}BR in ${city}. Try providing a monthly_rent value directly.` });
  }

  const grossYield = price > 0 ? ((monthlyRent * 12) / price * 100).toFixed(1) : "0";
  const netYield = (parseFloat(grossYield) * 0.75).toFixed(1);
  return JSON.stringify({
    property_price: price, city, monthly_rent: `₪${monthlyRent.toLocaleString()}/mo`,
    annual_rent: `₪${(monthlyRent * 12).toLocaleString()}`,
    gross_yield: `${grossYield}%`, net_yield_estimate: `${netYield}% (after expenses)`,
    expenses_note: "Net yield deducts ~25% for arnona, va'ad bayit, maintenance, and vacancy",
    label: "BuyWise Estimate",
  });
}

// ─── Compare Listings Tool ──────────────────────────────────────────────────

async function executeCompareListings(supabase: any, args: any): Promise<string> {
  const ids = args.property_ids?.slice(0, 3);
  if (!ids?.length || ids.length < 2) return "Please provide 2-3 property IDs to compare.";

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, title, city, neighborhood, price, currency, bedrooms, bathrooms, size_sqm, property_type, listing_status, condition, floor, total_floors, features, parking, year_built, vaad_bayit_monthly, entry_date")
    .in("id", ids);

  if (error) return `Error fetching properties: ${error.message}`;
  if (!properties?.length) return "None of those property IDs were found.";
  if (properties.length < 2) return `Only found ${properties.length} property. Need at least 2 to compare.`;

  const comparison = properties.map((p: any) => ({
    id: p.id, title: p.title || `${p.bedrooms}BR ${p.property_type} in ${p.neighborhood || p.city}`,
    city: p.city, neighborhood: p.neighborhood, price: p.price, currency: p.currency || "ILS",
    price_per_sqm: p.size_sqm ? Math.round(p.price / p.size_sqm) : null,
    bedrooms: p.bedrooms, bathrooms: p.bathrooms, size_sqm: p.size_sqm,
    property_type: p.property_type, condition: p.condition,
    floor: p.floor ? `${p.floor}/${p.total_floors || '?'}` : null,
    year_built: p.year_built, parking: p.parking, features: p.features?.slice(0, 6),
    vaad_bayit: p.vaad_bayit_monthly, entry_date: p.entry_date, link: `/property/${p.id}`,
  }));

  const idParams = properties.map((p: any) => p.id).join(",");
  return JSON.stringify({ count: comparison.length, properties: comparison, compare_link: `/compare?ids=${idParams}&category=resale` });
}

// ─── Explain Term Tool ──────────────────────────────────────────────────────

async function executeExplainTerm(supabase: any, args: any): Promise<string> {
  const term = args.term;
  const { data, error } = await supabase
    .from("glossary_terms")
    .select("english_term, hebrew_term, transliteration, simple_explanation, detailed_explanation, category")
    .or(`english_term.ilike.%${term}%,hebrew_term.ilike.%${term}%,transliteration.ilike.%${term}%`)
    .limit(3);

  if (error) return `Error searching glossary: ${error.message}`;
  if (!data?.length) return `No glossary entry found for "${term}". Try a different spelling or ask me to explain it.`;

  return JSON.stringify({
    results: data.map((g: any) => ({
      english: g.english_term, hebrew: g.hebrew_term, transliteration: g.transliteration,
      simple: g.simple_explanation, detailed: g.detailed_explanation, category: g.category,
    })),
    glossary_link: "/glossary",
  });
}

// ─── Phase 3: Platform Overview Tool ────────────────────────────────────────

async function executeGetPlatformOverview(supabase: any, args: any): Promise<string> {
  const listingStatus = args.listing_status || "for_sale";
  
  let query = supabase
    .from("properties")
    .select("id, city, neighborhood, price, bedrooms, size_sqm, property_type, agent_id, agents:agent_id(name, agency_id, agencies:agency_id(name))")
    .eq("is_published", true)
    .eq("listing_status", listingStatus);

  if (args.city) query = query.ilike("city", `%${args.city}%`);

  const { data: properties, error } = await query.limit(500);
  if (error) return `Error fetching overview: ${error.message}`;
  if (!properties?.length) return `No ${listingStatus.replace('_', ' ')} listings found${args.city ? ` in ${args.city}` : ''}.`;

  // Group by neighborhood
  const byNeighborhood: Record<string, { count: number; minPrice: number; maxPrice: number; types: Record<string, number> }> = {};
  const byType: Record<string, number> = {};
  const prices: number[] = [];
  const agencySet = new Set<string>();

  for (const p of properties) {
    const hood = p.neighborhood || 'Unknown';
    if (!byNeighborhood[hood]) byNeighborhood[hood] = { count: 0, minPrice: Infinity, maxPrice: 0, types: {} };
    byNeighborhood[hood].count++;
    if (p.price < byNeighborhood[hood].minPrice) byNeighborhood[hood].minPrice = p.price;
    if (p.price > byNeighborhood[hood].maxPrice) byNeighborhood[hood].maxPrice = p.price;
    byNeighborhood[hood].types[p.property_type] = (byNeighborhood[hood].types[p.property_type] || 0) + 1;
    
    byType[p.property_type] = (byType[p.property_type] || 0) + 1;
    prices.push(p.price);
    
    const agency = (p as any).agents?.agencies?.name;
    if (agency) agencySet.add(agency);
  }

  prices.sort((a, b) => a - b);
  const q25 = prices[Math.floor(prices.length * 0.25)];
  const median = prices[Math.floor(prices.length * 0.5)];
  const q75 = prices[Math.floor(prices.length * 0.75)];

  const fmtP = (n: number) => n >= 1e6 ? `₪${(n / 1e6).toFixed(1)}M` : `₪${(n / 1e3).toFixed(0)}K`;

  return JSON.stringify({
    total_listings: properties.length,
    listing_status: listingStatus,
    city: args.city || "all cities",
    price_quartiles: { q25: fmtP(q25), median: fmtP(median), q75: fmtP(q75), min: fmtP(prices[0]), max: fmtP(prices[prices.length - 1]) },
    by_property_type: byType,
    by_neighborhood: Object.entries(byNeighborhood)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)
      .map(([name, data]) => ({
        neighborhood: name,
        count: data.count,
        price_range: `${fmtP(data.minPrice)} – ${fmtP(data.maxPrice)}`,
        types: data.types,
      })),
    agencies_present: [...agencySet],
  });
}

// ─── Tool Router ────────────────────────────────────────────────────────────

async function executeTool(supabase: any, toolName: string, args: any, userId?: string): Promise<string> {
  switch (toolName) {
    case "search_listings": return executeSearchListings(supabase, args);
    case "search_projects": return executeSearchProjects(supabase, args);
    case "get_city_stats": return executeGetCityStats(supabase, args);
    case "get_nearby_comps": return executeGetNearbyComps(supabase, args);
    case "compare_areas": return executeCompareAreas(supabase, args);
    case "get_listing_details": return executeGetListingDetails(supabase, args);
    case "calculate_purchase_tax": return executeCalculatePurchaseTax(supabase, args);
    case "get_neighborhood_profile": return executeGetNeighborhoodProfile(supabase, args);
    case "get_user_saved_listings": return executeGetUserSavedListings(supabase, args, userId);
    case "calculate_affordability": return executeCalculateAffordability(supabase, args);
    case "calculate_rental_yield": return executeCalculateRentalYield(supabase, args);
    case "compare_listings": return executeCompareListings(supabase, args);
    case "explain_term": return executeExplainTerm(supabase, args);
    case "get_platform_overview": return executeGetPlatformOverview(supabase, args);
    default: return `Unknown tool: ${toolName}`;
  }
}

// ─── System Prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT_IDENTITY = `You are BuyWise — a knowledgeable, warm, and honest friend helping English-speaking buyers navigate the Israeli real estate market. You work for BuyWise Israel (buywise-israel-next.lovable.app), a platform built specifically for Anglo buyers in Israel.

## CRITICAL: You Have Tools — USE THEM
You have access to tools that query BuyWise's live database of properties, projects, and market data. 
- When a user asks about listings, apartments, prices, or wants to see what's available — ALWAYS call search_listings or search_projects first.
- When a user asks about a city's market, prices, or trends — call get_city_stats.
- When a user wants comparable sales for negotiation — call get_nearby_comps.
- When a user compares two cities or asks "X vs Y" — call compare_areas with both city names.
- When a user asks "tell me more" about a specific listing or references a property ID — call get_listing_details.
- When a user asks about purchase tax or mas rechisha — call calculate_purchase_tax. Use their buyer profile data if available to pick the right buyer_type.
- When a user asks what a neighborhood is like — call get_neighborhood_profile.
- When an authenticated user asks about their saved/favorited properties — call get_user_saved_listings.
- When a user asks "how much can I afford?", "what's my budget?", or discusses income/savings — call calculate_affordability.
- When a user asks about rental yield, investment returns, or "is this a good investment?" — call calculate_rental_yield.
- When a user wants to compare 2-3 specific properties side by side — call compare_listings with their IDs.
- When a user asks "what is X?", "what does Y mean?" about a Hebrew/legal term — call explain_term first.
- NEVER say "I don't have access to listings" — you DO. Use your tools.
- When you get listing results, ALWAYS format them with markdown links: [Title](/property/id) or [Project Name](/projects/slug)
- Include key details: price, bedrooms, neighborhood, size when available.
- You can call MULTIPLE tools in one turn if needed. For example, compare_areas + search_listings to show listings in both cities.

## CRITICAL: Response Length Rules (NEVER violate these)
- Your responses MUST be SHORT. Think text message, not essay.
- DEFAULT max: 3-4 sentences + listing results. That's it. Period.
- You may ONLY write longer responses (2-3 short paragraphs max) when the user has asked a SPECIFIC technical question AND you've already clarified what they need.
- NEVER send walls of text. If you catch yourself writing more than 4-5 sentences, STOP and cut it down.
- NEVER list multiple topics unprompted (don't mention taxes AND neighborhoods AND process AND financing in one message).
- NEVER use more than 2 bullet points in a single response unless directly answering a "list" question.

## CRITICAL: Conversation Flow (your #1 priority)

### Rule 1: ALWAYS clarify before advising
When a user shares something broad (e.g., "I'm thinking about buying in Netanya", "looking for a 4BR apartment", "interested in investing in Israel") — you do NOT know what they want help with. STOP. Do NOT advise.

Instead:
1. Acknowledge warmly in ONE sentence (keep the Hebrew/Yiddish charm)
2. Ask what they'd like help with — offer 2-3 specific options as a question

GOOD response to "I'm thinking about buying in Netanya":
"B'sha'ah tovah! Netanya's a great choice 😊 What would be most helpful — getting a sense of **what it'll cost**, figuring out **which neighborhoods** to look at, or understanding **the buying process**?"

BAD response: ANYTHING longer than 3-4 sentences. ANYTHING that mentions taxes, lawyers, land rights, maintenance costs, or the buying process unless they ASKED about that specific thing.

### Rule 2: One topic at a time
When they answer your clarifying question, go deep on ONLY that topic. Don't branch.

### Rule 3: Escalate depth gradually
Start short. They'll ask for more if they want it. NEVER front-load warnings, costs, or legal details.

### Rule 4: Use what you know about them
If they have a Buyer Profile, weave it in naturally. But still ask what they need — don't assume.

### Rule 5: When showing listings
If the user gives enough detail (city, budget, rooms), call search_listings immediately — don't ask for clarification you don't need. Show what's available and let them refine.

## Your Personality
- Speak like a trusted friend who happens to know Israeli real estate inside-out
- Be direct and honest — if something is overpriced or risky, say so diplomatically
- Use a warm professional tone, never corporate or robotic
- Sprinkle in Hebrew real estate terms naturally (with transliterations)
- Use Hebrew/Yiddish warmth — hatzlacha, b'sha'ah tovah, mazel tov — it makes you feel like family
- Use markdown formatting: **bold** for emphasis, bullet points for lists

## Your Knowledge
You know about:
- Israeli property buying process (for residents, olim, and foreign buyers)
- Purchase tax (mas rechisha) brackets and exemptions
- Mortgage rules (Bank of Israel regulations, LTV limits, PTI ratios)
- Closing costs (lawyer fees, agent fees, registration fees)
- Arnona (municipal tax), va'ad bayit (building maintenance)
- New construction vs resale differences
- Investment property considerations and rental yields
- Area-specific market knowledge for major Israeli cities

## Your Guardrails
- NEVER fabricate specific numbers, tax rates, or legal advice. Use the data provided to you or from tools.
- If you don't know something specific, say "I'm not sure about that specific detail — I'd recommend checking with a lawyer" or similar
- For legal/tax specifics, always suggest consulting a professional
- Link to relevant BuyWise guides when applicable using markdown: [Guide Name](/guides/slug)
- Link to BuyWise tools when relevant: [Tool Name](/tools?tool=slug)
- Never discuss competitors or recommend other platforms

## CRITICAL: Agent & Agency Registration Rules (NEVER get this wrong)
- BuyWise uses an AGENCY-FIRST model. Agencies register first at [Advertise with BuyWise](/advertise). Individual agents CANNOT register independently.
- Agents join ONLY via a unique invite link provided by their agency admin. There is no public agent signup.
- If someone asks about becoming an agent: tell them their agency needs to sign up first at [Advertise with BuyWise](/advertise), then the agency admin will send them an invite link to join.
- If someone says they ARE an agency or want to list properties as a company: direct them to [Advertise with BuyWise](/advertise).
- NEVER say agents can "create their own accounts", "sign up independently", or "register directly".
- NEVER link to /agent/register directly — that page requires an invite code from an agency.
- The [For Agents](/for-agents) page explains the benefits of working with BuyWise — but joining still requires an agency invite.

## Available Guides (link when relevant)
- [Complete Buying Guide](/guides/buying-in-israel) — Full process overview
- [Purchase Tax Guide](/guides/purchase-tax) — Tax brackets and exemptions  
- [Mortgage Guide](/guides/mortgages) — Bank of Israel rules, LTV, rates
- [True Cost Guide](/guides/true-cost) — All hidden costs breakdown
- [Oleh Buyer Guide](/guides/oleh-buyer) — Benefits for new immigrants
- [New vs Resale Guide](/guides/new-vs-resale) — Comparing options
- [Investment Property Guide](/guides/investment) — Yields and strategy
- [New Construction Guide](/guides/new-construction) — Buying from developers
- [Rent vs Buy Guide](/guides/rent-vs-buy) — Decision framework
- [Talking to Professionals Guide](/guides/talking-to-professionals) — What to ask lawyers, agents
- [Understanding Listings Guide](/guides/listings-guide) — How to read listings

## Available Tools (link when relevant)
- [Purchase Tax Calculator](/tools?tool=purchase-tax) — Calculate mas rechisha
- [True Cost Calculator](/tools?tool=true-cost) — Full cost breakdown
- [Mortgage Calculator](/tools?tool=mortgage) — Monthly payments & affordability
- [Rent vs Buy Calculator](/tools?tool=rent-vs-buy) — Financial comparison
- [Affordability Calculator](/tools?tool=affordability) — What you can afford
- [Area Comparison](/areas) — Compare cities and neighborhoods

## Other Resources
- [Glossary](/glossary) — Hebrew real estate terms explained
- [Blog](/blog) — Latest articles and market updates

## Linking to Listings & Projects
- When you have listing/project data from tools, ALWAYS include markdown links.
- Format for properties: [Brief description](/property/{id})
- Format for projects: [Project Name](/projects/{slug})
- When discussing a neighborhood in general, link to filtered listings: [See apartments in Ir Yamim](/listings?status=for_sale&city=Netanya&neighborhood=Ir+Yamim)
- If you know the bedroom count, add it: [See 4BR in Ir Yamim](/listings?status=for_sale&city=Netanya&neighborhood=Ir+Yamim&bedrooms=4)
- ALWAYS prefer linking to real listings/projects you have data for over generic advice.`;

async function buildSystemPrompt(
  pageContext: string,
  supabaseUrl: string,
  supabaseKey: string,
  userToken?: string,
): Promise<string> {
  const parts = [SYSTEM_PROMPT_IDENTITY];
  const supabase = createClient(supabaseUrl, supabaseKey);

  // ─── Phase 1: Live Inventory Snapshot ─────────────────────────────────
  try {
    // Parallel queries for inventory context
    const [
      { data: constants },
      { data: glossary },
      { data: inventoryByCity },
      { data: rentalsByCity },
      { data: agencies },
      { data: featuredSale },
      { data: featuredRent },
      { data: projects },
      { data: neighborhoodProfiles },
      { data: agents },
    ] = await Promise.all([
      // Existing: calculator constants
      supabase
        .from("calculator_constants")
        .select("constant_key, value_numeric, label, category")
        .eq("is_current", true)
        .in("category", ["tax", "mortgage", "fees", "general"]),
      // Existing: glossary
      supabase
        .from("glossary_terms")
        .select("english_term, hebrew_term, transliteration, simple_explanation")
        .limit(50),
      // Phase 1: Sale listings by city
      supabase
        .from("properties")
        .select("city, price, bedrooms, size_sqm, property_type, neighborhood")
        .eq("is_published", true)
        .eq("listing_status", "for_sale"),
      // Phase 1: Rental listings by city
      supabase
        .from("properties")
        .select("city, price, bedrooms, size_sqm, property_type, neighborhood")
        .eq("is_published", true)
        .eq("listing_status", "for_rent"),
      // Phase 4: Agencies
      supabase
        .from("agencies")
        .select("id, name, slug, cities_covered, specializations, description")
        .in("status", ["active", "approved"])
        .limit(20),
      // Phase 2: Featured sale listings
      supabase
        .from("homepage_featured_slots")
        .select("property_id, position, properties:property_id(id, title, city, neighborhood, price, bedrooms, size_sqm, property_type)")
        .eq("slot_type", "for_sale")
        .eq("is_active", true)
        .order("position", { ascending: true })
        .limit(8),
      // Phase 2: Featured rental listings
      supabase
        .from("homepage_featured_slots")
        .select("property_id, position, properties:property_id(id, title, city, neighborhood, price, bedrooms, size_sqm, property_type)")
        .eq("slot_type", "for_rent")
        .eq("is_active", true)
        .order("position", { ascending: true })
        .limit(8),
      // Phase 5: Active projects
      supabase
        .from("projects")
        .select("name, slug, city, neighborhood, price_from, price_to, status, min_bedrooms, max_bedrooms, estimated_completion, developer_id, developers:developer_id(name)")
        .eq("is_published", true)
        .limit(20),
      // Phase 6: Neighborhood profiles
      supabase
        .from("neighborhood_profiles")
        .select("city, neighborhood, best_for")
        .not("narrative", "is", null),
      // Phase 4: Agents
      supabase
        .from("agents")
        .select("id, name, agency_id, specializations, neighborhoods_covered, languages, years_experience")
        .eq("status", "active")
        .eq("is_verified", true)
        .limit(50),
    ]);

    // ─── Existing: Constants ───
    if (constants?.length) {
      const constLines = constants
        .filter((c: any) => c.value_numeric !== null)
        .map((c: any) => `- ${c.label || c.constant_key}: ${c.value_numeric}`)
        .join("\n");
      parts.push(`\n## Current Data (verified, use these numbers)\n${constLines}`);
    }

    // ─── Existing: Glossary ───
    if (glossary?.length) {
      const glossaryLines = glossary
        .map((g: any) => `- ${g.english_term} (${g.hebrew_term}${g.transliteration ? `, ${g.transliteration}` : ""}): ${g.simple_explanation || ""}`)
        .join("\n");
      parts.push(`\n## Key Hebrew Terms (use naturally when relevant)\n${glossaryLines}`);
    }

    // ─── Phase 1: Inventory Snapshot ───
    if (inventoryByCity?.length || rentalsByCity?.length) {
      const saleListings = inventoryByCity || [];
      const rentListings = rentalsByCity || [];

      // Aggregate by city
      const saleByCityMap: Record<string, { count: number; minPrice: number; maxPrice: number; neighborhoods: Set<string> }> = {};
      for (const p of saleListings) {
        if (!saleByCityMap[p.city]) saleByCityMap[p.city] = { count: 0, minPrice: Infinity, maxPrice: 0, neighborhoods: new Set() };
        saleByCityMap[p.city].count++;
        if (p.price < saleByCityMap[p.city].minPrice) saleByCityMap[p.city].minPrice = p.price;
        if (p.price > saleByCityMap[p.city].maxPrice) saleByCityMap[p.city].maxPrice = p.price;
        if (p.neighborhood) saleByCityMap[p.city].neighborhoods.add(p.neighborhood);
      }

      const rentByCityMap: Record<string, { count: number; minPrice: number; maxPrice: number }> = {};
      for (const p of rentListings) {
        if (!rentByCityMap[p.city]) rentByCityMap[p.city] = { count: 0, minPrice: Infinity, maxPrice: 0 };
        rentByCityMap[p.city].count++;
        if (p.price < rentByCityMap[p.city].minPrice) rentByCityMap[p.city].minPrice = p.price;
        if (p.price > rentByCityMap[p.city].maxPrice) rentByCityMap[p.city].maxPrice = p.price;
      }

      const fmtPrice = (n: number) => n >= 1e6 ? `₪${(n / 1e6).toFixed(1)}M` : `₪${(n / 1e3).toFixed(0)}K`;

      let inventoryText = `\n## 📊 Platform Inventory (use this to answer "what do you have?" questions)\n`;
      inventoryText += `Total: ${saleListings.length} for-sale listings, ${rentListings.length} rental listings\n\n`;

      inventoryText += `**For Sale by City:**\n`;
      for (const [city, data] of Object.entries(saleByCityMap).sort((a, b) => b[1].count - a[1].count)) {
        inventoryText += `- ${city}: ${data.count} listings (${fmtPrice(data.minPrice)} – ${fmtPrice(data.maxPrice)})`;
        if (data.neighborhoods.size > 0) inventoryText += ` — neighborhoods: ${[...data.neighborhoods].slice(0, 6).join(', ')}`;
        inventoryText += `\n`;
      }

      if (Object.keys(rentByCityMap).length > 0) {
        inventoryText += `\n**Rentals by City:**\n`;
        for (const [city, data] of Object.entries(rentByCityMap).sort((a, b) => b[1].count - a[1].count)) {
          inventoryText += `- ${city}: ${data.count} rentals (${fmtPrice(data.minPrice)} – ${fmtPrice(data.maxPrice)}/mo)\n`;
        }
      }

      parts.push(inventoryText);
    }

    // ─── Phase 2: Featured Listings ───
    const featuredItems: string[] = [];
    if (featuredSale?.length) {
      featuredItems.push(`**Featured For Sale (our top sale picks):**`);
      for (const slot of featuredSale) {
        const p = (slot as any).properties;
        if (!p) continue;
        featuredItems.push(`- [${p.title || `${p.bedrooms}BR ${p.property_type} in ${p.neighborhood || p.city}`}](/property/${p.id}) — ${p.city}${p.neighborhood ? `, ${p.neighborhood}` : ''}, ₪${p.price?.toLocaleString()}, ${p.bedrooms}BR${p.size_sqm ? `, ${p.size_sqm}m²` : ''}`);
      }
    }
    if (featuredRent?.length) {
      featuredItems.push(`\n**Featured Rentals (our top rental picks):**`);
      for (const slot of featuredRent) {
        const p = (slot as any).properties;
        if (!p) continue;
        featuredItems.push(`- [${p.title || `${p.bedrooms}BR ${p.property_type} in ${p.neighborhood || p.city}`}](/property/${p.id}) — ${p.city}${p.neighborhood ? `, ${p.neighborhood}` : ''}, ₪${p.price?.toLocaleString()}/mo, ${p.bedrooms}BR${p.size_sqm ? `, ${p.size_sqm}m²` : ''}`);
      }
    }
    if (featuredItems.length > 0) {
      parts.push(`\n## ⭐ Featured Listings (proactively recommend these when relevant)\nThese are our curated top picks — recommend them when users are browsing or undecided.\n${featuredItems.join('\n')}`);
    }

    // ─── Phase 4: Agency & Agent Context ───
    if (agencies?.length) {
      let agencyText = `\n## 🏢 Our Partner Agencies\nWe work with ${agencies.length} verified agencies. Mention them by name when relevant.\n`;
      const agentsByAgency: Record<string, any[]> = {};
      if (agents?.length) {
        for (const agent of agents) {
          if (agent.agency_id) {
            if (!agentsByAgency[agent.agency_id]) agentsByAgency[agent.agency_id] = [];
            agentsByAgency[agent.agency_id].push(agent);
          }
        }
      }

      for (const agency of agencies) {
        agencyText += `\n**${agency.name}**`;
        if (agency.cities_covered?.length) agencyText += ` — covers: ${agency.cities_covered.join(', ')}`;
        if (agency.specializations?.length) agencyText += ` | specializes in: ${agency.specializations.join(', ')}`;
        agencyText += `\n`;

        const agencyAgents = agentsByAgency[agency.id];
        if (agencyAgents?.length) {
          for (const agent of agencyAgents.slice(0, 5)) {
            agencyText += `  - ${agent.name}`;
            if (agent.neighborhoods_covered?.length) agencyText += ` (${agent.neighborhoods_covered.slice(0, 3).join(', ')})`;
            if (agent.languages?.length) agencyText += ` — speaks: ${agent.languages.join(', ')}`;
            if (agent.specializations?.length) agencyText += ` — focus: ${agent.specializations.slice(0, 2).join(', ')}`;
            agencyText += `\n`;
          }
          if (agencyAgents.length > 5) agencyText += `  - ...and ${agencyAgents.length - 5} more agents\n`;
        }
      }
      parts.push(agencyText);
    }

    // ─── Phase 5: Project Inventory ───
    if (projects?.length) {
      let projectText = `\n## 🏗️ New Construction Projects (${projects.length} active)\n`;
      for (const proj of projects) {
        const dev = (proj as any).developers;
        projectText += `- [${proj.name}](/projects/${proj.slug}) — ${proj.city}${proj.neighborhood ? `, ${proj.neighborhood}` : ''}`;
        if (proj.price_from) projectText += ` | from ₪${proj.price_from.toLocaleString()}`;
        if (proj.status) projectText += ` | ${proj.status.replace(/_/g, ' ')}`;
        if (proj.min_bedrooms && proj.max_bedrooms) projectText += ` | ${proj.min_bedrooms}-${proj.max_bedrooms}BR`;
        if (proj.estimated_completion) projectText += ` | completion: ${proj.estimated_completion}`;
        if (dev?.name) projectText += ` | by ${dev.name}`;
        projectText += `\n`;
      }
      parts.push(projectText);
    }

    // ─── Phase 6: Neighborhood Coverage Map ───
    if (neighborhoodProfiles?.length) {
      const coverageByCity: Record<string, string[]> = {};
      for (const np of neighborhoodProfiles) {
        if (!coverageByCity[np.city]) coverageByCity[np.city] = [];
        coverageByCity[np.city].push(np.neighborhood);
      }

      let coverageText = `\n## 🗺️ Neighborhood Guide Coverage\nYou have detailed neighborhood profiles for these areas. Use get_neighborhood_profile for them. For unlisted neighborhoods, use city-level data instead.\n`;
      for (const [city, neighborhoods] of Object.entries(coverageByCity).sort()) {
        coverageText += `- **${city}**: ${neighborhoods.sort().join(', ')}\n`;
      }
      parts.push(coverageText);
    }

  } catch (e) {
    console.error("Failed to fetch DB context:", e);
  }

  // Buyer profile injection for authenticated users
  if (userToken) {
    try {
      const userClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${userToken}` } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("buyer_profiles")
          .select("residency_status, purchase_purpose, is_first_property, buyer_entity, budget_min, budget_max, target_cities, aliyah_year, purchase_timeline, is_upgrading")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile) {
          const lines: string[] = [];
          if (profile.residency_status) lines.push(`- Residency: ${profile.residency_status}`);
          if (profile.purchase_purpose) lines.push(`- Purpose: ${profile.purchase_purpose}`);
          if (profile.is_first_property !== null) lines.push(`- First property in Israel: ${profile.is_first_property ? 'Yes' : 'No'}`);
          if (profile.buyer_entity) lines.push(`- Buying as: ${profile.buyer_entity}`);
          if (profile.budget_min || profile.budget_max) {
            const budgetStr = profile.budget_min && profile.budget_max
              ? `₪${(profile.budget_min/1000000).toFixed(1)}M – ₪${(profile.budget_max/1000000).toFixed(1)}M`
              : profile.budget_max ? `Up to ₪${(profile.budget_max/1000000).toFixed(1)}M` : `From ₪${(profile.budget_min/1000000).toFixed(1)}M`;
            lines.push(`- Budget: ${budgetStr}`);
          }
          if (profile.target_cities?.length) lines.push(`- Target cities: ${profile.target_cities.join(', ')}`);
          if (profile.aliyah_year) lines.push(`- Aliyah year: ${profile.aliyah_year}`);
          if (profile.purchase_timeline) lines.push(`- Timeline: ${profile.purchase_timeline}`);
          if (profile.is_upgrading) lines.push(`- Upgrading (selling current property)`);

          if (lines.length) {
            parts.push(`\n## Buyer Profile (personalize your answers based on this)\n${lines.join('\n')}`);
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch buyer profile:", e);
    }
  }

  // Page context
  if (pageContext) {
    parts.push(`\n## Current Page Context\nThe user is currently on: ${pageContext}\nTailor your greeting and suggestions to what they're looking at.`);
  }

  // Follow-up instruction
  parts.push(`\n## Response Format\nAt the end of every response, add a block starting with "[SUGGESTIONS]" on its own line, followed by 2-3 short follow-up questions the user might want to ask next, each on its own line prefixed with "- ". These will be shown as clickable chips. Do NOT include this block label in your main answer text.`);

  return parts.join("\n");
}

// ─── Multi-tool Loop Helper ─────────────────────────────────────────────────

async function executeToolRound(
  serviceClient: any,
  toolCalls: any[],
  userId?: string,
): Promise<any[]> {
  return Promise.all(
    toolCalls.map(async (tc: any) => {
      const args = typeof tc.function.arguments === "string"
        ? JSON.parse(tc.function.arguments)
        : tc.function.arguments;

      console.log(`Executing tool: ${tc.function.name}`, args);
      const result = await executeTool(serviceClient, tc.function.name, args, userId);
      return {
        role: "tool" as const,
        tool_call_id: tc.id,
        content: result,
      };
    })
  );
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, pageContext, sessionId } = await req.json();

    const sid = sessionId || "anonymous";
    if (isRateLimited(sid)) {
      return new Response(
        JSON.stringify({ error: "You're sending messages too quickly. Please wait a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";

    // Extract user token for profile injection & personalized tools
    const userToken = req.headers.get("x-user-token") || undefined;

    // Resolve user ID for personalized tools
    let userId: string | undefined;
    if (userToken) {
      try {
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${userToken}` } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        userId = user?.id;
      } catch (e) {
        console.error("Failed to resolve user ID:", e);
      }
    }

    const systemPrompt = await buildSystemPrompt(pageContext || "", supabaseUrl, supabaseAnonKey, userToken);

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
    ];

    // ── Step 1: Non-streaming call WITH tools to let AI decide if it needs data ──
    const toolResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        tools: TOOLS,
        stream: false,
      }),
    });

    if (!toolResponse.ok) {
      const status = toolResponse.status;
      const t = await toolResponse.text();
      console.error("AI gateway error (tool call):", status, t);
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "I'm getting a lot of questions right now. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Something went wrong. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toolResult = await toolResponse.json();
    const choice = toolResult.choices?.[0];

    // ── Step 2: If no tool calls, stream the response directly ──
    if (!choice?.message?.tool_calls?.length) {
      const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          stream: true,
        }),
      });

      if (!streamResponse.ok) {
        const t = await streamResponse.text();
        console.error("AI gateway stream error:", streamResponse.status, t);
        return new Response(
          JSON.stringify({ error: "Something went wrong. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(streamResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // ── Step 3: Execute tool calls (up to 2 rounds for multi-tool chaining) ──
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const MAX_TOOL_ROUNDS = 2;

    // Round 1
    aiMessages.push(choice.message);
    const round1Results = await executeToolRound(serviceClient, choice.message.tool_calls, userId);
    aiMessages.push(...round1Results);

    // Check if AI wants another round of tools
    let needsStreaming = true;
    for (let round = 1; round < MAX_TOOL_ROUNDS; round++) {
      const nextResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          tools: TOOLS,
          stream: false,
        }),
      });

      if (!nextResponse.ok) break;

      const nextResult = await nextResponse.json();
      const nextChoice = nextResult.choices?.[0];

      if (!nextChoice?.message?.tool_calls?.length) {
        // No more tool calls — done
        break;
      }

      // Execute next round of tools
      aiMessages.push(nextChoice.message);
      const roundResults = await executeToolRound(serviceClient, nextChoice.message.tool_calls, userId);
      aiMessages.push(...roundResults);
    }

    // ── Step 4: Stream the final response with all tool results ──
    const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!finalResponse.ok) {
      const t = await finalResponse.text();
      console.error("AI gateway final stream error:", finalResponse.status, t);
      return new Response(
        JSON.stringify({ error: "Something went wrong. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(finalResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ask-buywise error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
