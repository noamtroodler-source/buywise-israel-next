import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============ CURATED UNSPLASH IMAGES ============

const PROPERTY_INTERIORS = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  "https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80",
  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
  "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
  "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80",
  "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&q=80",
  "https://images.unsplash.com/photo-1560440021-33f9b867899d?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80",
  "https://images.unsplash.com/photo-1615873968403-89e068629265?w=800&q=80",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80",
  "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80",
  "https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?w=800&q=80",
  "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&q=80",
  "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&q=80",
];

const PROPERTY_EXTERIORS = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
  "https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=800&q=80",
  "https://images.unsplash.com/photo-1600573472591-ee6c563aaec8?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  "https://images.unsplash.com/photo-1600566752734-c11bf9a21ddd?w=800&q=80",
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800&q=80",
  "https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
  "https://images.unsplash.com/photo-1600566752229-250ed79470f8?w=800&q=80",
  "https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=800&q=80",
  "https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=800&q=80",
];

const MODERN_BUILDINGS = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  "https://images.unsplash.com/photo-1577495508326-19a1b3cf65b7?w=800&q=80",
  "https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=800&q=80",
  "https://images.unsplash.com/photo-1481253127861-534498168948?w=800&q=80",
  "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800&q=80",
  "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800&q=80",
  "https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&q=80",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80",
  "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80",
  "https://images.unsplash.com/photo-1464938050520-ef2571e0d6bf?w=800&q=80",
  "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=800&q=80",
  "https://images.unsplash.com/photo-1478860409698-8707f313ee8b?w=800&q=80",
  "https://images.unsplash.com/photo-1459767129954-1b1c1f9b9ace?w=800&q=80",
  "https://images.unsplash.com/photo-1524813686514-a57563d77965?w=800&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
  "https://images.unsplash.com/photo-1504615755583-2916b52192a3?w=800&q=80",
  "https://images.unsplash.com/photo-1553444836-bc6c8d340ba7?w=800&q=80",
  "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80",
];

const AVATARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&q=80",
  "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=200&q=80",
];

// ============ ISRAELI DATA ============

// City coordinates and price multipliers - used when fetching from database
const CITY_COORDS: Record<string, { lat: number; lng: number; priceMultiplier: number }> = {
  "Tel Aviv": { lat: 32.0853, lng: 34.7818, priceMultiplier: 1.8 },
  "Jerusalem": { lat: 31.7683, lng: 35.2137, priceMultiplier: 1.3 },
  "Haifa": { lat: 32.7940, lng: 34.9896, priceMultiplier: 0.9 },
  "Herzliya": { lat: 32.1656, lng: 34.8467, priceMultiplier: 1.6 },
  "Ra'anana": { lat: 32.1841, lng: 34.8710, priceMultiplier: 1.4 },
  "Netanya": { lat: 32.3286, lng: 34.8570, priceMultiplier: 1.0 },
  "Ashkelon": { lat: 31.6688, lng: 34.5743, priceMultiplier: 0.7 },
  "Ashdod": { lat: 31.8040, lng: 34.6553, priceMultiplier: 0.75 },
  "Beer Sheva": { lat: 31.2518, lng: 34.7913, priceMultiplier: 0.55 },
  "Petah Tikva": { lat: 32.0868, lng: 34.8859, priceMultiplier: 1.0 },
  "Kfar Saba": { lat: 32.1780, lng: 34.9078, priceMultiplier: 1.2 },
  "Modiin": { lat: 31.8977, lng: 35.0104, priceMultiplier: 1.15 },
  "Modi'in": { lat: 31.8977, lng: 35.0104, priceMultiplier: 1.15 },
  "Ramat Gan": { lat: 32.0680, lng: 34.8248, priceMultiplier: 1.35 },
  "Hod HaSharon": { lat: 32.1530, lng: 34.8920, priceMultiplier: 1.25 },
  "Eilat": { lat: 29.5581, lng: 34.9482, priceMultiplier: 0.9 },
  "Beit Shemesh": { lat: 31.7514, lng: 34.9886, priceMultiplier: 0.8 },
  "Caesarea": { lat: 32.5006, lng: 34.8978, priceMultiplier: 2.0 },
  "Pardes Hanna": { lat: 32.4706, lng: 34.9699, priceMultiplier: 0.7 },
  "Mevaseret Zion": { lat: 31.8024, lng: 35.1527, priceMultiplier: 1.25 },
  "Zichron Yaakov": { lat: 32.5714, lng: 34.9520, priceMultiplier: 1.1 },
  "Tiberias": { lat: 32.7940, lng: 35.5300, priceMultiplier: 0.65 },
  "Kiryat Ata": { lat: 32.8100, lng: 35.1100, priceMultiplier: 0.7 },
  "Yavne": { lat: 31.8780, lng: 34.7390, priceMultiplier: 0.85 },
  "Givat Shmuel": { lat: 32.0800, lng: 34.8500, priceMultiplier: 1.3 },
};

// Helper function to get city data with coordinates
function getCityWithCoords(cityName: string, citySlug: string) {
  const coords = CITY_COORDS[cityName] || { lat: 32.0, lng: 34.8, priceMultiplier: 1.0 };
  return {
    name: cityName,
    slug: citySlug,
    lat: coords.lat,
    lng: coords.lng,
    priceMultiplier: coords.priceMultiplier,
  };
}

const FIRST_NAMES_MALE = ["Yosef", "David", "Moshe", "Avraham", "Yitzhak", "Yaakov", "Eli", "Oren", "Noam", "Amit", "Eitan", "Gal", "Roi", "Nadav", "Ido", "Lior", "Tal", "Amir", "Yonatan", "Dan"];
const FIRST_NAMES_FEMALE = ["Sarah", "Rachel", "Miriam", "Rivka", "Leah", "Tamar", "Noa", "Maya", "Shira", "Yael", "Michal", "Ronit", "Keren", "Dana", "Liora", "Talia", "Avital", "Inbar", "Orly", "Ayelet"];
const LAST_NAMES = ["Cohen", "Levi", "Mizrachi", "Peretz", "Biton", "Dahan", "Azoulay", "Friedman", "Shapiro", "Goldstein", "Bernstein", "Rosenberg", "Klein", "Schwartz", "Weiss", "Rosen", "Katz", "Stern", "Blum", "Gross"];

const AGENCY_NAMES = [
  { name: "Binyan HaZahav Properties", description: "Premier luxury real estate specialists serving Israel's most discerning clients since 1998." },
  { name: "Negev Living Realty", description: "Your trusted partner for Southern Israel real estate, from Beer Sheva to Eilat." },
  { name: "Mediterranean Coast Properties", description: "Coastal living experts specializing in sea-view apartments and beachfront homes." },
  { name: "Jerusalem Heritage Realty", description: "Connecting buyers with Jerusalem's finest properties, blending history with modern living." },
  { name: "Central Israel Real Estate", description: "Comprehensive real estate services across the Sharon and Dan regions." },
  { name: "Anglo Israel Properties", description: "English-speaking specialists helping olim find their perfect Israeli home." },
  { name: "HaSharon Premium Estates", description: "Exclusive properties in Ra'anana, Herzliya, and the prestigious Sharon region." },
  { name: "Gush Dan Realty Group", description: "Full-service agency covering Tel Aviv metropolitan area with expert local knowledge." },
  { name: "North Star Properties", description: "Haifa and Northern Israel specialists with deep roots in the community." },
  { name: "Israel Investment Realty", description: "Expert guidance for real estate investors seeking profitable Israeli opportunities." },
];

const DEVELOPER_NAMES = [
  { name: "Azrieli Development Group", description: "One of Israel's leading development companies, known for landmark towers and mixed-use projects." },
  { name: "Shikun & Binui Residential", description: "Decades of excellence in residential development across Israel." },
  { name: "Gindi Holdings", description: "Innovative developer bringing modern living concepts to Israeli cities." },
  { name: "Africa Israel Residences", description: "Premium residential projects in prime locations nationwide." },
  { name: "Azorim Group", description: "Quality-focused developer with projects from Eilat to Haifa." },
  { name: "Amot Investments", description: "Boutique developer specializing in luxury residential towers." },
  { name: "Blue Square Real Estate", description: "Forward-thinking developer creating sustainable communities." },
  { name: "Tidhar Group", description: "Family-owned developer with a reputation for quality and integrity." },
];

const PROPERTY_TYPES = ['apartment', 'garden_apartment', 'penthouse', 'mini_penthouse', 'duplex', 'house', 'cottage'];
const CONDITIONS = ['new', 'renovated', 'good'];
const AC_TYPES = ['split', 'central', 'mini_central'];
const FEATURES = ['balcony', 'storage', 'parking', 'elevator', 'security', 'gym', 'pool', 'garden', 'renovated_kitchen', 'sea_view', 'city_view', 'quiet_street', 'near_park', 'near_schools'];
const LEASE_TERMS = ['6_months', '12_months', '24_months', 'flexible'];
const FURNISHED_STATUS = ['fully', 'semi', 'unfurnished'];
const PETS_POLICY = ['allowed', 'case_by_case', 'not_allowed'];
const LANGUAGES = ['Hebrew', 'English', 'Russian', 'French', 'Spanish', 'Arabic', 'Amharic'];
const SPECIALIZATIONS = ['First-time buyers', 'Investment properties', 'Luxury homes', 'Rentals', 'Anglo clients', 'New developments', 'Commercial'];
const PROJECT_STATUS = ['planning', 'pre_sale', 'under_construction', 'completed'];
const PROJECT_AMENITIES = ['gym', 'pool', 'lobby', 'underground_parking', 'rooftop_terrace', 'playground', 'security_24_7', 'concierge', 'storage_units', 'ev_charging'];

// ============ FEATURED HIGHLIGHTS ============
const SALE_HIGHLIGHTS = [
  "Panoramic sea views from every room",
  "Massive 40m² south-facing balcony",
  "Fully renovated with designer finishes",
  "Private rooftop terrace",
  "Smart home automation throughout",
  "Protected room with natural light",
  "Gourmet chef's kitchen",
  "Direct elevator to apartment",
  "Walk-in closet in master suite",
  "Floor-to-ceiling windows",
  "High ceilings throughout",
  "Corner apartment with cross ventilation",
];

const RENTAL_HIGHLIGHTS = [
  "Move-in ready, fully furnished",
  "Pet-friendly with private garden",
  "All bills included in rent",
  "Flexible lease terms available",
  "Home office with separate entrance",
  "Quiet apartment, faces inner courtyard",
  "Walking distance to beach",
  "Near top-rated schools",
  "Underground parking included",
  "New central A/C system",
  "Recently renovated bathroom",
  "Bright and airy with balcony",
];

const PROJECT_HIGHLIGHTS = [
  "Rooftop infinity pool with sea views",
  "Smart home technology in every unit",
  "5-star hotel-style concierge service",
  "Private landscaped gardens per unit",
  "Direct beach access for residents",
  "24/7 spa and wellness center",
  "EV charging in every parking spot",
  "Award-winning architectural design",
  "LEED-certified green building",
  "Exclusive residents-only lounge",
  "Underground parking with storage",
  "Premium designer finishes included",
];

// ============ HELPER FUNCTIONS ============

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomChoices<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

function generatePhone(): string {
  const prefixes = ['050', '052', '053', '054', '055', '058'];
  return `${randomChoice(prefixes)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`;
}

function generateLicense(): string {
  return `IL${randomInt(10000, 99999)}`;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getRandomImages(count: number, type: 'interior' | 'exterior' | 'building'): string[] {
  const source = type === 'interior' ? PROPERTY_INTERIORS : type === 'exterior' ? PROPERTY_EXTERIORS : MODERN_BUILDINGS;
  return randomChoices(source, count);
}

function generatePropertyDescription(city: string, type: string, bedrooms: number, features: string[]): string {
  const intros = [
    `Stunning ${bedrooms} bedroom ${type.replace('_', ' ')} in the heart of ${city}.`,
    `Beautiful ${type.replace('_', ' ')} offering ${bedrooms} spacious bedrooms in ${city}.`,
    `Exceptional ${bedrooms} bedroom residence in one of ${city}'s most sought-after locations.`,
    `Gorgeous ${type.replace('_', ' ')} featuring ${bedrooms} bedrooms in prestigious ${city}.`,
  ];
  
  const mids = [
    `This property has been designed with modern living in mind, featuring high-quality finishes throughout.`,
    `Recently updated with premium materials and contemporary design elements.`,
    `Offering a perfect blend of comfort and style in every room.`,
    `Meticulously maintained and ready for immediate move-in.`,
  ];
  
  const featureText = features.length > 0 
    ? `Key features include: ${features.slice(0, 4).join(', ').replace(/_/g, ' ')}.` 
    : '';
  
  const endings = [
    `Located in a quiet, family-friendly neighborhood with excellent amenities nearby.`,
    `Walking distance to shops, restaurants, and public transportation.`,
    `Perfect for families or professionals seeking quality living.`,
    `Don't miss this rare opportunity in today's competitive market.`,
  ];
  
  return `${randomChoice(intros)} ${randomChoice(mids)} ${featureText} ${randomChoice(endings)}`;
}

function generateProjectDescription(name: string, city: string, units: number): string {
  return `${name} is an exciting new residential development in ${city}, offering ${units} thoughtfully designed apartments. This project combines modern architecture with practical living spaces, featuring premium amenities and excellent connectivity. Residents will enjoy a vibrant community atmosphere with landscaped gardens, recreational facilities, and convenient access to local services. An ideal choice for families and professionals seeking contemporary urban living.`;
}

// ============ MAIN SEEDING FUNCTION ============

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============ FETCH OFFICIAL CITIES FROM DATABASE ============
    console.log("Fetching official cities from database...");
    const { data: dbCities, error: citiesError } = await supabase
      .from('cities')
      .select('name, slug');
    
    if (citiesError || !dbCities || dbCities.length === 0) {
      throw new Error(`Failed to fetch cities: ${citiesError?.message || 'No cities found'}`);
    }
    
    // Build CITIES array from database - ensures we ONLY use official cities
    const CITIES = dbCities.map(city => getCityWithCoords(city.name, city.slug));
    console.log(`Using ${CITIES.length} official cities from database`);

    const results = {
      agencies: 0,
      agents: 0,
      developers: 0,
      properties_sale: 0,
      properties_rent: 0,
      projects: 0,
      project_units: 0,
    };

    // ============ STEP 1: CREATE AGENCIES ============
    console.log("Creating agencies...");
    const agencyIds: string[] = [];
    
    for (const agencyData of AGENCY_NAMES) {
      const citiesCovered = randomChoices(CITIES.map(c => c.name), randomInt(3, 8));
      const specializations = randomChoices(SPECIALIZATIONS, randomInt(2, 4));
      
      const { data: agency, error } = await supabase
        .from('agencies')
        .insert({
          name: agencyData.name,
          slug: slugify(agencyData.name),
          description: agencyData.description,
          phone: generatePhone(),
          email: `info@${slugify(agencyData.name)}.co.il`,
          website: `https://${slugify(agencyData.name)}.co.il`,
          founded_year: randomInt(1990, 2020),
          cities_covered: citiesCovered,
          specializations: specializations,
          logo_url: randomChoice(AVATARS),
          office_address: `${randomInt(1, 200)} ${randomChoice(['Rothschild Blvd', 'Ben Yehuda St', 'Dizengoff St', 'HaYarkon St'])}`,
          status: 'active',
          verification_status: 'approved',
          is_verified: true,
        })
        .select('id')
        .single();

      if (error) {
        console.error("Error creating agency:", error);
        continue;
      }
      
      agencyIds.push(agency.id);
      results.agencies++;
    }

    // ============ STEP 2: CREATE AGENTS ============
    console.log("Creating agents...");
    const agentIds: string[] = [];
    
    for (let i = 0; i < 50; i++) {
      const isMale = Math.random() > 0.5;
      const firstName = randomChoice(isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE);
      const lastName = randomChoice(LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;
      const agencyId = randomChoice(agencyIds);
      const yearsExp = randomInt(2, 25);
      const languages = randomChoices(LANGUAGES, randomInt(2, 4));
      if (!languages.includes('Hebrew')) languages.unshift('Hebrew');
      
      const { data: agent, error } = await supabase
        .from('agents')
        .insert({
          name: fullName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@realty.co.il`,
          phone: generatePhone(),
          agency_id: agencyId,
          avatar_url: AVATARS[i % AVATARS.length],
          bio: `Experienced real estate professional with ${yearsExp} years in the Israeli market. Specializing in helping clients find their perfect home with personalized service and deep market knowledge.`,
          license_number: generateLicense(),
          years_experience: yearsExp,
          languages: languages,
          specializations: randomChoices(SPECIALIZATIONS, randomInt(2, 3)),
          status: 'active',
          is_verified: true,
        })
        .select('id')
        .single();

      if (error) {
        console.error("Error creating agent:", error);
        continue;
      }
      
      agentIds.push(agent.id);
      results.agents++;
    }

    // ============ STEP 3: CREATE DEVELOPERS ============
    console.log("Creating developers...");
    const developerIds: string[] = [];
    
    for (const devData of DEVELOPER_NAMES) {
      const { data: developer, error } = await supabase
        .from('developers')
        .insert({
          name: devData.name,
          slug: slugify(devData.name),
          description: devData.description,
          phone: generatePhone(),
          email: `info@${slugify(devData.name)}.co.il`,
          website: `https://${slugify(devData.name)}.co.il`,
          founded_year: randomInt(1970, 2015),
          total_projects: randomInt(10, 100),
          office_city: randomChoice(['Tel Aviv', 'Jerusalem', 'Haifa', 'Herzliya']),
          office_address: `${randomInt(1, 100)} Business Tower`,
          company_type: randomChoice(['public', 'private', 'boutique']),
          specialties: randomChoices(['residential', 'mixed-use', 'luxury', 'affordable', 'urban renewal'], 3),
          logo_url: randomChoice(AVATARS),
          status: 'active',
          verification_status: 'approved',
          is_verified: true,
        })
        .select('id')
        .single();

      if (error) {
        console.error("Error creating developer:", error);
        continue;
      }
      
      developerIds.push(developer.id);
      results.developers++;
    }

    // ============ STEP 4: CREATE PROPERTIES FOR SALE ============
    console.log("Creating for-sale properties...");
    const BASE_PRICE = 2500000; // 2.5M NIS base
    
    for (const city of CITIES) {
      for (let i = 0; i < 8; i++) {
        const propertyType = PROPERTY_TYPES[i % PROPERTY_TYPES.length];
        const bedrooms = propertyType === 'penthouse' ? randomInt(4, 6) : 
                        propertyType === 'garden_apartment' ? randomInt(3, 5) :
                        propertyType === 'house' ? randomInt(4, 6) : randomInt(2, 4);
        const additionalRooms = propertyType === 'house' ? randomInt(1, 3) : randomInt(1, 2);
        const sizeSqm = propertyType === 'penthouse' ? randomInt(120, 250) :
                       propertyType === 'house' ? randomInt(150, 300) :
                       propertyType === 'garden_apartment' ? randomInt(90, 150) :
                       randomInt(60, 120);
        const floor = propertyType === 'penthouse' ? randomInt(15, 30) :
                     propertyType === 'garden_apartment' ? 0 :
                     randomInt(1, 15);
        const totalFloors = Math.max(floor + randomInt(0, 5), floor + 1);
        const features = randomChoices(FEATURES, randomInt(3, 7));
        const price = Math.round(BASE_PRICE * city.priceMultiplier * (sizeSqm / 80) * (1 + Math.random() * 0.3));
        
        const { error } = await supabase
          .from('properties')
          .insert({
            title: `${bedrooms} Bedroom ${propertyType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} in ${city.name}`,
            description: generatePropertyDescription(city.name, propertyType, bedrooms, features),
            property_type: propertyType,
            listing_status: 'for_sale',
            price: price,
            currency: 'ILS',
            address: `${randomInt(1, 200)} ${randomChoice(['HaNassi', 'Ben Gurion', 'Herzl', 'Weizmann', 'Jabotinsky'])} Street`,
            city: city.name,
            neighborhood: null,
            latitude: city.lat + (Math.random() - 0.5) * 0.05,
            longitude: city.lng + (Math.random() - 0.5) * 0.05,
            bedrooms: bedrooms,
            additional_rooms: additionalRooms,
            bathrooms: bathrooms,
            size_sqm: sizeSqm,
            floor: floor,
            total_floors: totalFloors,
            year_built: randomInt(1980, 2024),
            features: features,
            images: [...getRandomImages(3, 'interior'), ...getRandomImages(2, 'exterior')],
            condition: randomChoice(CONDITIONS),
            ac_type: randomChoice(AC_TYPES),
            parking: randomInt(0, 2),
            vaad_bayit_monthly: randomInt(200, 800),
            entry_date: Math.random() > 0.3 ? new Date(Date.now() + randomInt(0, 180) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
            agent_id: randomChoice(agentIds),
            is_published: true,
            is_featured: Math.random() > 0.85,
            featured_highlight: Math.random() < 0.4 ? randomChoice(SALE_HIGHLIGHTS) : null,
          });

        if (error) {
          console.error("Error creating property:", error);
          continue;
        }
        results.properties_sale++;
      }
    }

    // ============ STEP 5: CREATE RENTAL PROPERTIES ============
    console.log("Creating rental properties...");
    const BASE_RENT = 5000; // 5K NIS base
    
    for (const city of CITIES) {
      for (let i = 0; i < 8; i++) {
        const propertyType = PROPERTY_TYPES[i % PROPERTY_TYPES.length];
        const bedrooms = propertyType === 'penthouse' ? randomInt(4, 6) : 
                        propertyType === 'garden_apartment' ? randomInt(3, 5) :
                        propertyType === 'house' ? randomInt(4, 6) : randomInt(2, 4);
        const additionalRooms = propertyType === 'house' ? randomInt(1, 3) : randomInt(1, 2);
        const bathrooms = Math.max(1, Math.floor(bedrooms / 2) + randomInt(0, 1));
        const sizeSqm = propertyType === 'penthouse' ? randomInt(120, 250) :
                       propertyType === 'house' ? randomInt(150, 300) :
                       propertyType === 'garden_apartment' ? randomInt(90, 150) :
                       randomInt(60, 120);
        const floor = propertyType === 'penthouse' ? randomInt(15, 30) :
                     propertyType === 'garden_apartment' ? 0 :
                     randomInt(1, 15);
        const totalFloors = Math.max(floor + randomInt(0, 5), floor + 1);
        const features = randomChoices(FEATURES, randomInt(3, 7));
        const rent = Math.round(BASE_RENT * city.priceMultiplier * (sizeSqm / 80) * (1 + Math.random() * 0.3));
        
        const { error } = await supabase
          .from('properties')
          .insert({
            title: `${bedrooms} Bedroom ${propertyType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} for Rent in ${city.name}`,
            description: generatePropertyDescription(city.name, propertyType, bedrooms, features),
            property_type: propertyType,
            listing_status: 'for_rent',
            price: rent,
            currency: 'ILS',
            address: `${randomInt(1, 200)} ${randomChoice(['HaNassi', 'Ben Gurion', 'Herzl', 'Weizmann', 'Jabotinsky'])} Street`,
            city: city.name,
            neighborhood: null,
            latitude: city.lat + (Math.random() - 0.5) * 0.05,
            longitude: city.lng + (Math.random() - 0.5) * 0.05,
            bedrooms: bedrooms,
            additional_rooms: additionalRooms,
            bathrooms: bathrooms,
            size_sqm: sizeSqm,
            floor: floor,
            total_floors: totalFloors,
            year_built: randomInt(1980, 2024),
            features: features,
            images: [...getRandomImages(3, 'interior'), ...getRandomImages(2, 'exterior')],
            condition: randomChoice(CONDITIONS),
            ac_type: randomChoice(AC_TYPES),
            parking: randomInt(0, 2),
            vaad_bayit_monthly: randomInt(200, 800),
            entry_date: Math.random() > 0.5 ? new Date(Date.now() + randomInt(0, 60) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
            lease_term: randomChoice(LEASE_TERMS),
            furnished_status: randomChoice(FURNISHED_STATUS),
            pets_policy: randomChoice(PETS_POLICY),
            agent_fee_required: Math.random() > 0.4,
            bank_guarantee_required: Math.random() > 0.3,
            checks_required: Math.random() > 0.5,
            agent_id: randomChoice(agentIds),
            is_published: true,
            is_featured: Math.random() > 0.9,
            featured_highlight: Math.random() < 0.4 ? randomChoice(RENTAL_HIGHLIGHTS) : null,
          });

        if (error) {
          console.error("Error creating rental:", error);
          continue;
        }
        results.properties_rent++;
      }
    }

    // ============ STEP 6: CREATE PROJECTS ============
    console.log("Creating projects...");
    const projectIds: string[] = [];
    
    for (const city of CITIES) {
      for (let i = 0; i < 4; i++) {
        const projectNames = [
          `${city.name} Heights`,
          `Park View ${city.name}`,
          `${city.name} Residence`,
          `The Gardens ${city.name}`,
          `${city.name} Tower`,
          `Sunset ${city.name}`,
          `${city.name} Oasis`,
          `The ${city.name} Collection`,
        ];
        
        const projectName = projectNames[i % projectNames.length];
        const status = randomChoice(PROJECT_STATUS);
        const totalUnits = randomInt(30, 200);
        const availableUnits = Math.floor(totalUnits * (0.2 + Math.random() * 0.5));
        const priceFrom = Math.round(BASE_PRICE * city.priceMultiplier * 0.8);
        const priceTo = Math.round(BASE_PRICE * city.priceMultiplier * 2.5);
        const constructionProgress = status === 'planning' ? randomInt(0, 10) :
                                    status === 'pre_sale' ? randomInt(5, 25) :
                                    status === 'under_construction' ? randomInt(25, 85) :
                                    randomInt(90, 100);
        
        const completionDate = new Date();
        completionDate.setMonth(completionDate.getMonth() + randomInt(6, 36));
        
        const { data: project, error } = await supabase
          .from('projects')
          .insert({
            name: projectName,
            slug: slugify(projectName),
            description: generateProjectDescription(projectName, city.name, totalUnits),
            city: city.name,
            address: `${randomInt(1, 100)} ${randomChoice(['Development Zone', 'New District', 'Urban Renewal Area'])}`,
            latitude: city.lat + (Math.random() - 0.5) * 0.03,
            longitude: city.lng + (Math.random() - 0.5) * 0.03,
            status: status,
            total_units: totalUnits,
            available_units: availableUnits,
            price_from: priceFrom,
            price_to: priceTo,
            currency: 'ILS',
            completion_date: completionDate.toISOString().split('T')[0],
            construction_progress_percent: constructionProgress,
            amenities: randomChoices(PROJECT_AMENITIES, randomInt(4, 8)),
            images: getRandomImages(5, 'building'),
            developer_id: randomChoice(developerIds),
            representing_agent_id: randomChoice(agentIds),
            is_published: true,
            is_featured: Math.random() > 0.85,
            featured_highlight: Math.random() < 0.5 ? randomChoice(PROJECT_HIGHLIGHTS) : null,
          })
          .select('id')
          .single();

        if (error) {
          console.error("Error creating project:", error);
          continue;
        }
        
        projectIds.push(project.id);
        results.projects++;

        // Create project units
        const unitTypes = [
          { type: '2 Bedroom', bedrooms: 2, additionalRooms: 1, sizeMin: 70, sizeMax: 90 },
          { type: '3 Bedroom', bedrooms: 3, additionalRooms: 1, sizeMin: 90, sizeMax: 120 },
          { type: '4 Bedroom', bedrooms: 4, additionalRooms: 1, sizeMin: 120, sizeMax: 150 },
          { type: 'Penthouse', bedrooms: 4, additionalRooms: 2, sizeMin: 150, sizeMax: 250 },
          { type: 'Garden Apartment', bedrooms: 3, additionalRooms: 1, sizeMin: 100, sizeMax: 140 },
        ];

        for (const unitType of randomChoices(unitTypes, randomInt(3, 5))) {
          const unitPrice = Math.round(priceFrom * (1 + Math.random() * 0.8));
          
          const { error: unitError } = await supabase
            .from('project_units')
            .insert({
              project_id: project.id,
              unit_type: unitType.type,
              bedrooms: unitType.bedrooms,
              additional_rooms: unitType.additionalRooms,
              bathrooms: Math.floor(unitType.bedrooms / 2) + 1,
              size_sqm: randomInt(unitType.sizeMin, unitType.sizeMax),
              floor: randomInt(1, 20),
              price: unitPrice,
              currency: 'ILS',
              status: randomChoice(['available', 'available', 'reserved', 'sold']),
            });

          if (unitError) {
            console.error("Error creating unit:", unitError);
            continue;
          }
          results.project_units++;
        }
      }
    }

    console.log("Seeding complete!", results);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demo data seeded successfully!",
        results: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Seeding error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to seed data",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
