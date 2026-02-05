import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// City center coordinates for all Israeli cities in the database
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Tel Aviv': { lat: 32.0853, lng: 34.7818 },
  'Herzliya': { lat: 32.1663, lng: 34.8434 },
  'Ramat Gan': { lat: 32.0833, lng: 34.8100 },
  'Givatayim': { lat: 32.0714, lng: 34.8114 },
  'Netanya': { lat: 32.3286, lng: 34.8574 },
  "Ra'anana": { lat: 32.1836, lng: 34.8714 },
  'Kfar Saba': { lat: 32.1780, lng: 34.9065 },
  'Petah Tikva': { lat: 32.0841, lng: 34.8878 },
  'Rishon LeZion': { lat: 31.9730, lng: 34.7925 },
  'Rehovot': { lat: 31.8914, lng: 34.8113 },
  'Ashdod': { lat: 31.8044, lng: 34.6553 },
  'Ashkelon': { lat: 31.6688, lng: 34.5743 },
  'Haifa': { lat: 32.7940, lng: 34.9896 },
  'Jerusalem': { lat: 31.7683, lng: 35.2137 },
  'Beer Sheva': { lat: 31.2518, lng: 34.7913 },
  'Eilat': { lat: 29.5577, lng: 34.9519 },
  'Modiin': { lat: 31.8980, lng: 35.0104 },
  'Bat Yam': { lat: 32.0236, lng: 34.7518 },
  'Holon': { lat: 32.0107, lng: 34.7748 },
  'Nahariya': { lat: 33.0061, lng: 35.0945 },
  'Hadera': { lat: 32.4340, lng: 34.9196 },
  'Caesarea': { lat: 32.5005, lng: 34.8975 },
  'Zichron Yaakov': { lat: 32.5714, lng: 34.9526 },
  'Beit Shemesh': { lat: 31.7452, lng: 34.9886 },
  'Tiberias': { lat: 32.7951, lng: 35.5322 },
  'Mevaseret Zion': { lat: 31.8022, lng: 35.1500 },
  // Additional cities from database
  'Raanana': { lat: 32.1836, lng: 34.8714 },
  'Beersheba': { lat: 31.2518, lng: 34.7913 },
  "Modi'in": { lat: 31.8980, lng: 35.0104 },
  'Hod HaSharon': { lat: 32.1500, lng: 34.8917 },
  'Givat Shmuel': { lat: 32.0833, lng: 34.8500 },
  'Pardes Hanna': { lat: 32.4703, lng: 34.9656 },
  "Ma'ale Adumim": { lat: 31.7779, lng: 35.3007 },
  'Gush Etzion': { lat: 31.6500, lng: 35.1167 },
  'Efrat': { lat: 31.6500, lng: 35.1167 },
  'Ariel': { lat: 32.1056, lng: 35.1733 },
  'Kiryat Gat': { lat: 31.6100, lng: 34.7642 },
  'Kiryat Shmona': { lat: 33.2083, lng: 35.5700 },
  'Bnei Brak': { lat: 32.0833, lng: 34.8333 },
  'Or Yehuda': { lat: 32.0306, lng: 34.8556 },
  'Yavne': { lat: 31.8789, lng: 34.7394 },
  'Lod': { lat: 31.9514, lng: 34.8911 },
  'Ramla': { lat: 31.9275, lng: 34.8739 },
  'Rosh HaAyin': { lat: 32.0956, lng: 34.9567 },
  'Kiryat Ono': { lat: 32.0633, lng: 34.8583 },
  'Shoham': { lat: 31.9981, lng: 34.9469 },
  'Kiryat Motzkin': { lat: 32.8400, lng: 35.0750 },
  'Kiryat Yam': { lat: 32.8417, lng: 35.0700 },
  'Kiryat Bialik': { lat: 32.8300, lng: 35.0850 },
  'Karmiel': { lat: 32.9136, lng: 35.2961 },
  'Afula': { lat: 32.6100, lng: 35.2883 },
  'Yokneam': { lat: 32.6592, lng: 35.1108 },
};

interface BackfillRequest {
  entityType?: 'property' | 'project' | 'both';
  limit?: number;
  dryRun?: boolean;
  useLocalCoords?: boolean; // New: use city-center + random offset instead of Nominatim
}

// Add random offset of ~1-3km to scatter properties within city
function addRandomOffset(lat: number, lng: number): { lat: number; lng: number } {
  const offsetLat = (Math.random() - 0.5) * 0.04; // ±0.02 degrees ≈ ±2km
  const offsetLng = (Math.random() - 0.5) * 0.04;
  return {
    lat: lat + offsetLat,
    lng: lng + offsetLng
  };
}

// Get coordinates for a city (with random offset)
function getCityCoordinates(city: string): { lat: number; lng: number } | null {
  const coords = CITY_COORDINATES[city];
  if (coords) {
    return addRandomOffset(coords.lat, coords.lng);
  }
  
  // Try case-insensitive match
  const cityLower = city.toLowerCase();
  for (const [key, value] of Object.entries(CITY_COORDINATES)) {
    if (key.toLowerCase() === cityLower) {
      return addRandomOffset(value.lat, value.lng);
    }
  }
  
  return null;
}

interface NominatimResult {
  lat: string;
  lon: string;
}

async function geocodeWithNominatim(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Add a delay to respect Nominatim rate limits (1 request per second)
    await new Promise(resolve => setTimeout(resolve, 1100));

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=il&limit=1`,
      {
        headers: {
          'User-Agent': 'BuyWiseIsrael/1.0 (backfill geocoding)'
        }
      }
    );

    if (!response.ok) {
      console.error("Nominatim request failed:", response.status);
      return null;
    }

    const results: NominatimResult[] = await response.json();

    if (results && results.length > 0) {
      const lat = parseFloat(results[0].lat);
      const lng = parseFloat(results[0].lon);

      // Validate coordinates are within Israel bounds
      if (lat >= 29 && lat <= 34 && lng >= 34 && lng <= 36) {
        return { lat, lng };
      }
    }

    return null;
  } catch (error) {
    console.error("Nominatim geocoding error:", error);
    return null;
  }
}

// Try multiple address formats
async function tryMultipleFormats(address: string, city: string, neighborhood?: string): Promise<{ lat: number; lng: number } | null> {
  // Extract street number and name (handles "Street Name 123" format)
  const streetMatch = address.match(/^(.+?)\s+(\d+)$/);
  const numberFirst = streetMatch ? `${streetMatch[2]} ${streetMatch[1]}` : null;
  
  // Also try extracting "123 Street Name" format
  const reverseMatch = address.match(/^(\d+)\s+(.+)$/);
  const nameFirst = reverseMatch ? `${reverseMatch[2]} ${reverseMatch[1]}` : null;
  
  // Build address variations to try
  const variations: string[] = [];
  
  if (neighborhood) {
    variations.push(`${address}, ${neighborhood}, ${city}, Israel`);
  }
  
  variations.push(`${address}, ${city}, Israel`);
  
  if (numberFirst) {
    variations.push(`${numberFirst}, ${city}, Israel`);
  }
  
  if (nameFirst) {
    variations.push(`${nameFirst}, ${city}, Israel`);
  }
  
  if (streetMatch) {
    variations.push(`${streetMatch[1]}, ${city}, Israel`);
  }
  if (reverseMatch) {
    variations.push(`${reverseMatch[2]}, ${city}, Israel`);
  }

  for (const query of variations) {
    console.log(`Trying: ${query}`);
    const coords = await geocodeWithNominatim(query);
    if (coords) {
      console.log(`Success with: ${query}`);
      return coords;
    }
  }

  // Last resort: just the city
  console.log(`Trying city only: ${city}, Israel`);
  return await geocodeWithNominatim(`${city}, Israel`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({})) as BackfillRequest;
    const entityType = body.entityType || 'both';
    const useLocalCoords = body.useLocalCoords !== false; // Default to true now
    const limit = useLocalCoords ? Math.min(body.limit || 5000, 5000) : Math.min(body.limit || 10, 20);
    const dryRun = body.dryRun || false;

    console.log(`Backfill starting: entityType=${entityType}, limit=${limit}, dryRun=${dryRun}, useLocalCoords=${useLocalCoords}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = {
      properties: { total: 0, success: 0, failed: 0, skipped: 0, details: [] as Record<string, unknown>[] },
      projects: { total: 0, success: 0, failed: 0, skipped: 0, details: [] as Record<string, unknown>[] }
    };

    // Process properties
    if (entityType === 'property' || entityType === 'both') {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, address, city, neighborhood, title')
        .or('latitude.is.null,longitude.is.null')
        .limit(limit);

      if (error) {
        console.error("Error fetching properties:", error);
      } else if (properties) {
        results.properties.total = properties.length;
        console.log(`Found ${properties.length} properties with missing coordinates`);

        // For local coords mode, batch update for efficiency
        if (useLocalCoords) {
          const updates: { id: string; latitude: number; longitude: number }[] = [];
          
          for (const prop of properties) {
            if (!prop.city) {
              results.properties.skipped++;
              continue;
            }

            const coords = getCityCoordinates(prop.city);
            if (coords) {
              updates.push({ id: prop.id, latitude: coords.lat, longitude: coords.lng });
              results.properties.success++;
            } else {
              results.properties.failed++;
              console.log(`No coordinates found for city: ${prop.city}`);
            }
          }

          // Batch update using parallel promises for speed
          if (!dryRun && updates.length > 0) {
            const batchSize = 50;
            for (let i = 0; i < updates.length; i += batchSize) {
              const batch = updates.slice(i, i + batchSize);
              await Promise.all(batch.map(update => 
                supabase
                  .from('properties')
                  .update({ latitude: update.latitude, longitude: update.longitude })
                  .eq('id', update.id)
              ));
              console.log(`Updated ${Math.min(i + batchSize, updates.length)} / ${updates.length} properties`);
            }
          }
        } else {
          // Original Nominatim-based geocoding (slow, for real addresses)
          for (const prop of properties) {
            if (!prop.address || !prop.city) {
              results.properties.skipped++;
              results.properties.details.push({
                id: prop.id,
                title: prop.title,
                status: 'skipped',
                reason: 'Missing address or city'
              });
              continue;
            }

            console.log(`Geocoding property: ${prop.title} - ${prop.address}, ${prop.city}`);

            const coords = await tryMultipleFormats(prop.address, prop.city, prop.neighborhood);

            if (coords) {
              if (!dryRun) {
                const { error: updateError } = await supabase
                  .from('properties')
                  .update({ latitude: coords.lat, longitude: coords.lng })
                  .eq('id', prop.id);

                if (updateError) {
                  results.properties.failed++;
                  results.properties.details.push({
                    id: prop.id,
                    title: prop.title,
                    status: 'failed',
                    reason: 'Database update failed'
                  });
                  continue;
                }
              }

              results.properties.success++;
              results.properties.details.push({
                id: prop.id,
                title: prop.title,
                status: 'success',
                coordinates: coords
              });
            } else {
              results.properties.failed++;
              results.properties.details.push({
                id: prop.id,
                title: prop.title,
                status: 'failed',
                reason: 'Geocoding returned no results'
              });
            }
          }
        }
      }
    }

    // Process projects
    if (entityType === 'project' || entityType === 'both') {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, address, city, neighborhood, name')
        .or('latitude.is.null,longitude.is.null')
        .limit(limit);

      if (error) {
        console.error("Error fetching projects:", error);
      } else if (projects) {
        results.projects.total = projects.length;
        console.log(`Found ${projects.length} projects with missing coordinates`);

        if (useLocalCoords) {
          const updates: { id: string; latitude: number; longitude: number }[] = [];
          
          for (const proj of projects) {
            if (!proj.city) {
              results.projects.skipped++;
              continue;
            }

            const coords = getCityCoordinates(proj.city);
            if (coords) {
              updates.push({ id: proj.id, latitude: coords.lat, longitude: coords.lng });
              results.projects.success++;
            } else {
              results.projects.failed++;
              console.log(`No coordinates found for city: ${proj.city}`);
            }
          }

          if (!dryRun && updates.length > 0) {
            const batchSize = 50;
            for (let i = 0; i < updates.length; i += batchSize) {
              const batch = updates.slice(i, i + batchSize);
              await Promise.all(batch.map(update => 
                supabase
                  .from('projects')
                  .update({ latitude: update.latitude, longitude: update.longitude })
                  .eq('id', update.id)
              ));
              console.log(`Updated ${Math.min(i + batchSize, updates.length)} / ${updates.length} projects`);
            }
          }
        } else {
          for (const proj of projects) {
            if (!proj.address || !proj.city) {
              results.projects.skipped++;
              results.projects.details.push({
                id: proj.id,
                name: proj.name,
                status: 'skipped',
                reason: 'Missing address or city'
              });
              continue;
            }

            console.log(`Geocoding project: ${proj.name} - ${proj.address}, ${proj.city}`);

            const coords = await tryMultipleFormats(proj.address, proj.city, proj.neighborhood);

            if (coords) {
              if (!dryRun) {
                const { error: updateError } = await supabase
                  .from('projects')
                  .update({ latitude: coords.lat, longitude: coords.lng })
                  .eq('id', proj.id);

                if (updateError) {
                  results.projects.failed++;
                  results.projects.details.push({
                    id: proj.id,
                    name: proj.name,
                    status: 'failed',
                    reason: 'Database update failed'
                  });
                  continue;
                }
              }

              results.projects.success++;
              results.projects.details.push({
                id: proj.id,
                name: proj.name,
                status: 'success',
                coordinates: coords
              });
            } else {
              results.projects.failed++;
              results.projects.details.push({
                id: proj.id,
                name: proj.name,
                status: 'failed',
                reason: 'Geocoding returned no results'
              });
            }
          }
        }
      }
    }

    console.log("Backfill complete:", JSON.stringify({
      properties: { 
        total: results.properties.total,
        success: results.properties.success,
        failed: results.properties.failed,
        skipped: results.properties.skipped
      },
      projects: {
        total: results.projects.total,
        success: results.projects.success,
        failed: results.projects.failed,
        skipped: results.projects.skipped
      }
    }));

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        useLocalCoords,
        summary: {
          properties: {
            total: results.properties.total,
            success: results.properties.success,
            failed: results.properties.failed,
            skipped: results.properties.skipped
          },
          projects: {
            total: results.projects.total,
            success: results.projects.success,
            failed: results.projects.failed,
            skipped: results.projects.skipped
          }
        },
        details: useLocalCoords ? undefined : results // Only include details for Nominatim mode
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("backfill-coordinates error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Backfill failed" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
