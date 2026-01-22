import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeocodeRequest {
  entityType: 'property' | 'project';
  entityId: string;
  address: string;
  city: string;
  neighborhood?: string;
}

interface GeocodeResponse {
  success: boolean;
  latitude?: number;
  longitude?: number;
  source?: string;
  error?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

async function geocodeWithNominatim(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=il&limit=1`,
      {
        headers: {
          'User-Agent': 'BuyWiseIsrael/1.0 (server-side geocoding)'
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

      // Validate coordinates are within Israel bounds (roughly)
      if (lat >= 29 && lat <= 34 && lng >= 34 && lng <= 36) {
        return { lat, lng };
      } else {
        console.warn("Geocoded location outside Israel bounds:", lat, lng);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error("Nominatim geocoding error:", error);
    return null;
  }
}

// Try multiple address formats to maximize geocoding success
async function tryMultipleFormats(address: string, city: string, neighborhood?: string): Promise<{ lat: number; lng: number } | null> {
  // Extract street number and name (handles "Street Name 123" format)
  const streetMatch = address.match(/^(.+?)\s+(\d+)$/);
  const numberFirst = streetMatch ? `${streetMatch[2]} ${streetMatch[1]}` : null;
  
  // Also try extracting "123 Street Name" format
  const reverseMatch = address.match(/^(\d+)\s+(.+)$/);
  const nameFirst = reverseMatch ? `${reverseMatch[2]} ${reverseMatch[1]}` : null;
  
  // Build address variations to try (in order of specificity)
  const variations: string[] = [];
  
  // Full address with neighborhood
  if (neighborhood) {
    variations.push(`${address}, ${neighborhood}, ${city}, Israel`);
  }
  
  // Street, city, Israel
  variations.push(`${address}, ${city}, Israel`);
  
  // Number-first format (European style): "8 HaMeyasdim, Mevaseret Zion"
  if (numberFirst) {
    variations.push(`${numberFirst}, ${city}, Israel`);
  }
  
  // Name-first format: "HaMeyasdim 8, Mevaseret Zion"
  if (nameFirst) {
    variations.push(`${nameFirst}, ${city}, Israel`);
  }
  
  // Just street name and city (less specific but might work)
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entityType, entityId, address, city, neighborhood } = await req.json() as GeocodeRequest;

    // Validate required fields
    if (!entityType || !entityId || !address || !city) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: entityType, entityId, address, city" 
        } as GeocodeResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate entity type
    if (entityType !== 'property' && entityType !== 'project') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid entityType. Must be 'property' or 'project'" 
        } as GeocodeResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Geocoding ${entityType} ${entityId}: ${address}, ${city}`);

    // Try multiple address formats
    const coords = await tryMultipleFormats(address, city, neighborhood);

    if (!coords) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Could not geocode address. Please verify the address is correct." 
        } as GeocodeResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lat, lng } = coords;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the database
    const tableName = entityType === 'property' ? 'properties' : 'projects';
    
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ 
        latitude: lat, 
        longitude: lng 
      })
      .eq('id', entityId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Geocoded successfully but failed to save to database" 
        } as GeocodeResponse),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully geocoded and saved: ${lat}, ${lng}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        latitude: lat, 
        longitude: lng,
        source: 'nominatim'
      } as GeocodeResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("geocode-address error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Failed to geocode address" 
      } as GeocodeResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
