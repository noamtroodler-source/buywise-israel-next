import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BackfillRequest {
  entityType?: 'property' | 'project' | 'both';
  limit?: number;
  dryRun?: boolean;
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
    const limit = Math.min(body.limit || 10, 20); // Cap at 20 to avoid timeout
    const dryRun = body.dryRun || false;

    console.log(`Backfill starting: entityType=${entityType}, limit=${limit}, dryRun=${dryRun}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = {
      properties: { total: 0, success: 0, failed: 0, skipped: 0, details: [] as any[] },
      projects: { total: 0, success: 0, failed: 0, skipped: 0, details: [] as any[] }
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
        details: results
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
