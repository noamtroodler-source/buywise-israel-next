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

// Featured Highlights for properties
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

const STREET_NAMES = [
  'Herzl', 'Rothschild', 'Ben Gurion', 'Weizmann', 'Jabotinsky', 'Dizengoff',
  'Allenby', 'HaYarkon', 'King George', 'Bialik', 'Nordau', 'Sokolov',
  'HaNassi', 'HaRav Kook', 'Arlozorov', 'Ibn Gabirol', 'Kaplan', 'Lincoln',
  'Begin', 'Shaul HaMelech', 'Derech HaShalom', 'Einstein', 'Trumpeldor',
];

// Curated Unsplash property images - interiors
const PROPERTY_INTERIORS = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
  "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800&q=80",
  "https://images.unsplash.com/photo-1560185127-6a8c6c9e26b4?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1583845112203-29329902332e?w=800&q=80",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
  "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80",
  "https://images.unsplash.com/photo-1615873968403-89e068629265?w=800&q=80",
  "https://images.unsplash.com/photo-1585128792020-803d29415281?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
  "https://images.unsplash.com/photo-1600573472556-e636c2acda88?w=800&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80",
  "https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800&q=80",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687644-c7f34b5063cd?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
  "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&q=80",
  "https://images.unsplash.com/photo-1560440021-33f9b867899d?w=800&q=80",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80",
  "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&q=80",
  "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800&q=80",
  "https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?w=800&q=80",
  "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80",
];

// Curated Unsplash property images - exteriors
const PROPERTY_EXTERIORS = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  "https://images.unsplash.com/photo-1600573472591-ee6c563aaec8?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
  "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&q=80",
  "https://images.unsplash.com/photo-1598228723793-52759bba239c?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&q=80",
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

function generatePropertyImages(): string[] {
  const count = randomInt(3, 6);
  const images: string[] = [];
  
  // Start with an exterior shot
  images.push(randomChoice(PROPERTY_EXTERIORS));
  
  // Add unique interior shots
  const shuffled = [...PROPERTY_INTERIORS].sort(() => Math.random() - 0.5);
  for (let i = 0; i < count - 1; i++) {
    images.push(shuffled[i]);
  }
  
  return images;
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
    images: generatePropertyImages(),
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
    featured_highlight: Math.random() < 0.4 
      ? randomChoice(listingStatus === 'for_rent' ? RENTAL_HIGHLIGHTS : SALE_HIGHLIGHTS) 
      : null,
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

    // Check for backfill mode
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'backfill') {
      // Backfill images for existing properties with null images
      const { data: propsWithoutImages, error: fetchError } = await supabase
        .from('properties')
        .select('id')
        .is('images', null);

      if (fetchError) throw fetchError;

      if (!propsWithoutImages || propsWithoutImages.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: 'No properties need image backfill', updated: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let updated = 0;
      const batchSize = 50;
      
      for (let i = 0; i < propsWithoutImages.length; i += batchSize) {
        const batch = propsWithoutImages.slice(i, i + batchSize);
        for (const prop of batch) {
          const { error: updateError } = await supabase
            .from('properties')
            .update({ images: generatePropertyImages() })
            .eq('id', prop.id);
          
          if (!updateError) updated++;
        }
        console.log(`Backfilled ${Math.min(i + batchSize, propsWithoutImages.length)} / ${propsWithoutImages.length} properties`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Backfilled images for ${updated} properties`,
          updated 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
