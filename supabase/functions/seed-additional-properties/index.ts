import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// City price multipliers (Tel Aviv = 1.0 baseline)
const CITY_MULTIPLIERS: Record<string, number> = {
  'Tel Aviv': 1.8,
  'Herzliya': 1.6,
  'Ramat Gan': 1.3,
  'Givatayim': 1.25,
  'Netanya': 1.0,
  'Ra\'anana': 1.5,
  'Kfar Saba': 1.2,
  'Petah Tikva': 1.1,
  'Rishon LeZion': 1.15,
  'Rehovot': 1.05,
  'Ashdod': 0.85,
  'Ashkelon': 0.75,
  'Haifa': 0.9,
  'Jerusalem': 1.4,
  'Beer Sheva': 0.55,
  'Eilat': 0.8,
  'Modiin': 1.25,
  'Bat Yam': 0.95,
  'Holon': 1.0,
  'Nahariya': 0.65,
  'Hadera': 0.7,
  'Caesarea': 1.7,
  'Zichron Yaakov': 1.1,
  'Beit Shemesh': 0.9,
  'Tiberias': 0.6,
};

// Property type configurations
const PROPERTY_TYPES = [
  { type: 'apartment', weight: 60, minRooms: 2, maxRooms: 5, minSqm: 50, maxSqm: 140, minFloor: 1, maxFloor: 20 },
  { type: 'garden_apartment', weight: 16, minRooms: 3, maxRooms: 5, minSqm: 80, maxSqm: 160, minFloor: 0, maxFloor: 1 },
  { type: 'penthouse', weight: 10, minRooms: 4, maxRooms: 6, minSqm: 120, maxSqm: 250, minFloor: 10, maxFloor: 30 },
  { type: 'duplex', weight: 8, minRooms: 4, maxRooms: 6, minSqm: 140, maxSqm: 220, minFloor: 0, maxFloor: 5 },
  { type: 'house', weight: 4, minRooms: 4, maxRooms: 7, minSqm: 150, maxSqm: 300, minFloor: 0, maxFloor: 0 },
  { type: 'cottage', weight: 2, minRooms: 5, maxRooms: 8, minSqm: 180, maxSqm: 350, minFloor: 0, maxFloor: 0 },
];

const CONDITIONS = ['new', 'renovated', 'good'];
const AC_TYPES = ['split', 'central', 'mini_central'];
const LEASE_TERMS = ['6_months', '12_months', '24_months', 'flexible'];
const FURNISHED_STATUS = ['fully', 'semi', 'unfurnished'];
const PETS_POLICY = ['allowed', 'case_by_case', 'not_allowed'];

const FEATURES_POOL = [
  'balcony', 'storage', 'parking', 'elevator', 'sea_view', 'city_view',
  'renovated', 'quiet', 'bright', 'spacious', 'garden', 'roof_access',
  'security', 'concierge', 'gym', 'pool', 'sauna', 'shabbat_elevator',
];

const STREET_NAMES = [
  'Herzl', 'Rothschild', 'Ben Gurion', 'Weizmann', 'Jabotinsky', 'Dizengoff',
  'Allenby', 'HaYarkon', 'King George', 'Bialik', 'Nordau', 'Sokolov',
  'HaNassi', 'HaRav Kook', 'Arlozorov', 'Ibn Gabirol', 'Kaplan', 'Lincoln',
  'Begin', 'Shaul HaMelech', 'Derech HaShalom', 'Einstein', 'Trumpeldor',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = randomInt(min, max);
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getWeightedPropertyType() {
  const totalWeight = PROPERTY_TYPES.reduce((sum, pt) => sum + pt.weight, 0);
  let random = Math.random() * totalWeight;
  for (const pt of PROPERTY_TYPES) {
    random -= pt.weight;
    if (random <= 0) return pt;
  }
  return PROPERTY_TYPES[0];
}

function getListingAge(): number {
  const rand = Math.random() * 100;
  if (rand < 15) return randomInt(0, 3);      // 15% hot (0-3 days)
  if (rand < 40) return randomInt(4, 7);      // 25% fresh (4-7 days)
  if (rand < 80) return randomInt(8, 30);     // 40% standard (8-30 days)
  return randomInt(31, 90);                    // 20% older (31-90 days)
}

function generateProperty(
  cityName: string,
  listingStatus: 'for_sale' | 'for_rent',
  agentId: string
) {
  const propType = getWeightedPropertyType();
  const rooms = randomInt(propType.minRooms, propType.maxRooms);
  const sqm = randomInt(propType.minSqm, propType.maxSqm);
  const floor = randomInt(propType.minFloor, propType.maxFloor);
  const totalFloors = Math.max(floor + randomInt(0, 5), floor);
  
  const cityMultiplier = CITY_MULTIPLIERS[cityName] || 1.0;
  const variance = 0.7 + Math.random() * 0.6; // ±30% variance
  
  // Base prices per sqm
  const baseSalePricePerSqm = 35000; // ~35,000 NIS/sqm baseline
  const baseRentPricePerSqm = 55;    // ~55 NIS/sqm/month baseline
  
  let price: number;
  if (listingStatus === 'for_sale') {
    price = Math.round((sqm * baseSalePricePerSqm * cityMultiplier * variance) / 10000) * 10000;
  } else {
    price = Math.round((sqm * baseRentPricePerSqm * cityMultiplier * variance) / 100) * 100;
  }
  
  const daysAgo = getListingAge();
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);
  
  const streetName = randomChoice(STREET_NAMES);
  const streetNumber = randomInt(1, 150);
  
  const condition = randomChoice(CONDITIONS);
  const features = randomSubset(FEATURES_POOL, 2, 6);
  
  // Entry date: 30% immediate, 70% within 1-6 months
  const entryDate = new Date();
  if (Math.random() > 0.3) {
    entryDate.setMonth(entryDate.getMonth() + randomInt(1, 6));
  }
  
  const property: Record<string, unknown> = {
    agent_id: agentId,
    title: `${rooms} Room ${propType.type.replace('_', ' ')} in ${cityName}`,
    description: `Beautiful ${rooms} room ${propType.type.replace('_', ' ')} located on ${streetName} Street in ${cityName}. ${sqm} sqm, ${condition} condition. Features include: ${features.join(', ')}.`,
    property_type: propType.type,
    listing_status: listingStatus,
    price: price,
    currency: 'ILS',
    address: `${streetNumber} ${streetName} Street`,
    city: cityName,
    neighborhood: null,
    latitude: null,
    longitude: null,
    bedrooms: rooms,
    bathrooms: Math.max(1, Math.floor(rooms / 2)),
    size_sqm: sqm,
    floor: floor,
    total_floors: totalFloors,
    year_built: randomInt(1970, 2024),
    features: features,
    images: null,
    views_count: randomInt(0, 500),
    is_featured: Math.random() < 0.05,
    is_published: true,
    parking: Math.random() < 0.7 ? randomInt(1, 2) : 0,
    condition: condition,
    is_furnished: listingStatus === 'for_rent' && Math.random() < 0.3,
    is_accessible: Math.random() < 0.2,
    entry_date: entryDate.toISOString().split('T')[0],
    ac_type: randomChoice(AC_TYPES),
    vaad_bayit_monthly: randomInt(150, 800),
    verification_status: 'approved',
    created_at: createdAt.toISOString(),
    updated_at: createdAt.toISOString(),
  };
  
  // Add rental-specific fields
  if (listingStatus === 'for_rent') {
    property.lease_term = randomChoice(LEASE_TERMS);
    property.furnished_status = randomChoice(FURNISHED_STATUS);
    property.pets_policy = randomChoice(PETS_POLICY);
    property.agent_fee_required = Math.random() < 0.6;
    property.bank_guarantee_required = Math.random() < 0.7;
    property.checks_required = Math.random() < 0.8;
  }
  
  return property;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id')
      .eq('status', 'active');

    if (agentsError) throw agentsError;
    if (!agents || agents.length === 0) {
      throw new Error('No active agents found');
    }

    const agentIds = agents.map(a => a.id);

    // Fetch all cities
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('name');

    if (citiesError) throw citiesError;
    if (!cities || cities.length === 0) {
      throw new Error('No cities found');
    }

    const cityNames = cities.map(c => c.name);
    
    let totalInserted = 0;
    const batchSize = 100;

    for (const cityName of cityNames) {
      const properties: Record<string, unknown>[] = [];

      // Generate 50 for_sale properties
      for (let i = 0; i < 50; i++) {
        const agentId = randomChoice(agentIds);
        properties.push(generateProperty(cityName, 'for_sale', agentId));
      }

      // Generate 50 for_rent properties
      for (let i = 0; i < 50; i++) {
        const agentId = randomChoice(agentIds);
        properties.push(generateProperty(cityName, 'for_rent', agentId));
      }

      // Insert in batches
      for (let i = 0; i < properties.length; i += batchSize) {
        const batch = properties.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('properties')
          .insert(batch);

        if (insertError) {
          console.error(`Error inserting batch for ${cityName}:`, insertError);
          throw insertError;
        }
        totalInserted += batch.length;
      }

      console.log(`Seeded ${properties.length} properties for ${cityName}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully seeded ${totalInserted} properties across ${cityNames.length} cities`,
        cities: cityNames.length,
        propertiesPerCity: 100,
        totalProperties: totalInserted,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Seeding error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
