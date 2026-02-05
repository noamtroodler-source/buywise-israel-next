import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Israeli street names for realistic addresses
const STREET_NAMES = [
  "Herzl", "Ben Yehuda", "Rothschild", "Jabotinsky", "Weizmann",
  "Dizengoff", "Ben Gurion", "Nordau", "Arlozorov", "King George",
  "HaNevi'im", "Emek Refaim", "Jaffa", "Bialik", "Sokolov",
  "Ahad Ha'am", "Allenby", "Shlomo HaMelech", "Ibn Gabirol", "Kaplan",
  "Nahalat Binyamin", "Florentin", "Levinsky", "HaYarkon", "Gordon"
];

const PROPERTY_TYPES = [
  { type: 'apartment', weight: 60 },
  { type: 'duplex', weight: 15 },
  { type: 'penthouse', weight: 10 },
  { type: 'garden_apartment', weight: 10 },
  { type: 'cottage', weight: 5 },
];

const ASSET_CONDITIONS = [
  { condition: 'good', weight: 40 },
  { condition: 'renovated', weight: 35 },
  { condition: 'new', weight: 25 },
];

// Helper functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedChoice<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

function generateNearbyCoords(lat: number, lng: number, minMeters: number, maxMeters: number) {
  const minRadiusInDegrees = minMeters / 111000;
  const maxRadiusInDegrees = maxMeters / 111000;
  
  const angle = Math.random() * 2 * Math.PI;
  // Use sqrt to ensure uniform distribution within the ring
  const r = Math.sqrt(
    Math.random() * (maxRadiusInDegrees ** 2 - minRadiusInDegrees ** 2) + minRadiusInDegrees ** 2
  );
  
  return {
    latitude: lat + r * Math.cos(angle),
    longitude: lng + r * Math.sin(angle) / Math.cos(lat * Math.PI / 180),
  };
}

function generateSoldDate(): string {
  const now = new Date();
  let monthsBack: number;
  
  // Weighted distribution: 45% recent, 35% mid-range, 20% older
  const rand = Math.random();
  if (rand < 0.45) {
    monthsBack = randomInt(0, 6);
  } else if (rand < 0.80) {
    monthsBack = randomInt(6, 12);
  } else {
    monthsBack = randomInt(12, 24);
  }
  
  const soldDate = new Date(now);
  soldDate.setMonth(soldDate.getMonth() - monthsBack);
  soldDate.setDate(randomInt(1, 28));
  
  return soldDate.toISOString().split('T')[0];
}

function generateSoldPrice(listingPrice: number, listingSqm: number, soldSqm: number): number {
  const listingPriceSqm = listingPrice / listingSqm;
  
  // Add ±15% variance to create realistic spread
  const variance = 0.85 + Math.random() * 0.30; // 0.85 to 1.15
  const soldPriceSqm = listingPriceSqm * variance;
  
  // Round to nearest 10,000
  return Math.round((soldSqm * soldPriceSqm) / 10000) * 10000;
}

function generateAddress(city: string, usedAddresses: Set<string>): string {
  let address: string;
  let attempts = 0;
  
  do {
    const street = randomChoice(STREET_NAMES);
    const number = randomInt(1, 120);
    const apt = randomInt(1, 30);
    address = `${number} ${street} Street, Apt ${apt}`;
    attempts++;
  } while (usedAddresses.has(`${address}-${city}`) && attempts < 100);
  
  usedAddresses.add(`${address}-${city}`);
  return address;
}

function generateFloor(): number {
  // Weighted toward middle floors
  const rand = Math.random();
  if (rand < 0.1) return 0; // Ground floor
  if (rand < 0.3) return randomInt(1, 2); // Low floors
  if (rand < 0.8) return randomInt(3, 6); // Middle floors
  return randomInt(7, 12); // High floors
}

function generateYearBuilt(): number {
  const rand = Math.random();
  if (rand < 0.15) return randomInt(1975, 1990);
  if (rand < 0.35) return randomInt(1990, 2000);
  if (rand < 0.65) return randomInt(2000, 2015);
  return randomInt(2015, 2024);
}

interface SeedRequest {
  clearExisting?: boolean;
  clearMockExisting?: boolean;
  compsPerProperty?: number;
  limitCities?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request options
    let options: SeedRequest = {};
    try {
      options = await req.json();
    } catch {
      // Use defaults if no body
    }

    const { clearExisting = false, clearMockExisting = true, compsPerProperty, limitCities } = options;

    // Optionally clear ALL existing data (use with caution - deletes real data too)
    if (clearExisting) {
      const { error: deleteError } = await supabase
        .from('sold_transactions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (deleteError) {
        console.error('Error clearing existing data:', deleteError);
      }
    }

    // Clear only mock-seeded data (safe - preserves real/imported data)
    if (clearMockExisting && !clearExisting) {
      const { error: deleteMockError } = await supabase
        .from('sold_transactions')
        .delete()
        .eq('source', 'mock_seed');
      
      if (deleteMockError) {
        console.error('Error clearing mock data:', deleteMockError);
      } else {
        console.log('Cleared existing mock_seed transactions');
      }
    }

    // Fetch all resale properties with coordinates - paginate to avoid 1000 row limit
    const allProperties: Array<{
      id: string;
      city: string;
      price: number;
      size_sqm: number;
      bedrooms: number | null;
      latitude: number;
      longitude: number;
    }> = [];
    
    const PAGE_SIZE = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('properties')
        .select('id, city, price, size_sqm, bedrooms, latitude, longitude')
        .eq('listing_status', 'for_sale')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .not('price', 'is', null)
        .not('size_sqm', 'is', null)
        .order('id')
        .range(offset, offset + PAGE_SIZE - 1);

      if (limitCities && limitCities.length > 0) {
        query = query.in('city', limitCities);
      }

      const { data: pageData, error: pageError } = await query;

      if (pageError) {
        throw new Error(`Failed to fetch properties: ${pageError.message}`);
      }

      if (pageData && pageData.length > 0) {
        allProperties.push(...pageData);
        offset += pageData.length;
        hasMore = pageData.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    console.log(`Fetched ${allProperties.length} properties total`);

    if (allProperties.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No eligible properties found',
          seeded: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${allProperties.length} properties to seed comps for`);

    const usedAddresses = new Set<string>();
    const allTransactions: Record<string, unknown>[] = [];
    let totalGenerated = 0;

    for (const property of allProperties) {
      // Generate 4-8 comps per property (or custom amount)
      const numComps = compsPerProperty ?? randomInt(4, 8);

      for (let i = 0; i < numComps; i++) {
        // Determine distance tier
        const tierRand = Math.random();
        let minDist: number, maxDist: number;
        
        if (tierRand < 0.15) {
          // Same building (0-20m)
          minDist = 0;
          maxDist = 20;
        } else if (tierRand < 0.50) {
          // Very close (20-150m)
          minDist = 20;
          maxDist = 150;
        } else {
          // Nearby (150-500m)
          minDist = 150;
          maxDist = 500;
        }

        const coords = generateNearbyCoords(
          property.latitude,
          property.longitude,
          minDist,
          maxDist
        );

        // Generate rooms with slight variance from listing
        const baseRooms = property.bedrooms || 3;
        const rooms = Math.max(2, Math.min(6, baseRooms + randomInt(-1, 1)));

        // Generate size with ±20% variance
        const baseSqm = property.size_sqm;
        const sizeVariance = 0.80 + Math.random() * 0.40; // 0.80 to 1.20
        const size_sqm = Math.round(baseSqm * sizeVariance);

        // Generate sold price based on listing's price/sqm
        const sold_price = generateSoldPrice(property.price, baseSqm, size_sqm);

        const yearBuilt = generateYearBuilt();
        const propertyType = weightedChoice(PROPERTY_TYPES).type;
        const assetCondition = weightedChoice(ASSET_CONDITIONS).condition;

        const transaction = {
          city: property.city,
          address: generateAddress(property.city, usedAddresses),
          sold_price,
          sold_date: generateSoldDate(),
          rooms,
          size_sqm,
          property_type: propertyType,
          floor: generateFloor(),
          year_built: yearBuilt,
          asset_condition: assetCondition,
          is_new_construction: yearBuilt > 2022,
          latitude: coords.latitude,
          longitude: coords.longitude,
          source: 'mock_seed',
        };

        allTransactions.push(transaction);
        totalGenerated++;
      }
    }

    // Batch insert in chunks of 500
    const BATCH_SIZE = 500;
    let insertedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < allTransactions.length; i += BATCH_SIZE) {
      const batch = allTransactions.slice(i, i + BATCH_SIZE);
      
      const { data: inserted, error: insertError } = await supabase
        .from('sold_transactions')
        .insert(batch)
        .select('id');

      if (insertError) {
        console.error(`Batch insert error at ${i}:`, insertError);
        failedCount += batch.length;
      } else {
        insertedCount += inserted?.length || 0;
      }
    }

    console.log(`Seeding complete: ${insertedCount} inserted, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Seeded ${insertedCount} sold transactions for ${allProperties.length} properties`,
        properties_processed: allProperties.length,
        transactions_generated: totalGenerated,
        transactions_inserted: insertedCount,
        transactions_failed: failedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Seed error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
