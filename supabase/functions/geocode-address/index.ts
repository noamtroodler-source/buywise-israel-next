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

// Validate coordinates are within Israel bounds
function isWithinIsrael(lat: number, lng: number): boolean {
  return lat >= 29 && lat <= 34 && lng >= 34 && lng <= 36;
}

// Primary: Google Maps Geocoding API
async function geocodeWithGoogle(query: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}&region=il`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results?.[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      if (isWithinIsrael(lat, lng)) {
        return { lat, lng };
      }
      console.warn("Google result outside Israel bounds:", lat, lng);
    }
  } catch (error) {
    console.error("Google geocoding error:", error);
  }
  return null;
}

// Fallback: Nominatim (free, OSM-based)
async function geocodeWithNominatim(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=il&limit=1`,
      { headers: { 'User-Agent': 'BuyWiseIsrael/1.0 (server-side geocoding)' } }
    );

    if (!response.ok) return null;

    const results = await response.json();
    if (results?.[0]) {
      const lat = parseFloat(results[0].lat);
      const lng = parseFloat(results[0].lon);
      if (isWithinIsrael(lat, lng)) {
        return { lat, lng };
      }
      console.warn("Nominatim result outside Israel bounds:", lat, lng);
    }
  } catch (error) {
    console.error("Nominatim geocoding error:", error);
  }
  return null;
}

// Build address variations for multi-format attempts
function buildAddressVariations(address: string, city: string, neighborhood?: string): string[] {
  const variations: string[] = [];
  const streetMatch = address.match(/^(.+?)\s+(\d+)$/);
  const reverseMatch = address.match(/^(\d+)\s+(.+)$/);

  if (neighborhood) {
    variations.push(`${address}, ${neighborhood}, ${city}, Israel`);
  }
  variations.push(`${address}, ${city}, Israel`);

  if (streetMatch) {
    variations.push(`${streetMatch[2]} ${streetMatch[1]}, ${city}, Israel`);
  }
  if (reverseMatch) {
    variations.push(`${reverseMatch[2]} ${reverseMatch[1]}, ${city}, Israel`);
  }
  if (streetMatch) {
    variations.push(`${streetMatch[1]}, ${city}, Israel`);
  }
  if (reverseMatch) {
    variations.push(`${reverseMatch[2]}, ${city}, Israel`);
  }

  return variations;
}

// Try Google first with the best address, then fall back through Nominatim variations
async function tryGeocode(address: string, city: string, neighborhood?: string): Promise<{ lat: number; lng: number; source: string } | null> {
  const variations = buildAddressVariations(address, city, neighborhood);

  // Try Google with the most specific variation first
  for (const query of variations.slice(0, 2)) {
    console.log(`[Google] Trying: ${query}`);
    const coords = await geocodeWithGoogle(query);
    if (coords) {
      console.log(`[Google] Success: ${query}`);
      return { ...coords, source: 'google_maps' };
    }
  }

  // Fall back to Nominatim with all variations
  for (const query of variations) {
    console.log(`[Nominatim] Trying: ${query}`);
    const coords = await geocodeWithNominatim(query);
    if (coords) {
      console.log(`[Nominatim] Success: ${query}`);
      return { ...coords, source: 'nominatim' };
    }
  }

  // Last resort: city only via Nominatim
  console.log(`[Nominatim] Trying city only: ${city}, Israel`);
  const cityCoords = await geocodeWithNominatim(`${city}, Israel`);
  if (cityCoords) return { ...cityCoords, source: 'nominatim' };

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entityType, entityId, address, city, neighborhood } = await req.json() as GeocodeRequest;

    if (!entityType || !entityId || !address || !city) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: entityType, entityId, address, city" } as GeocodeResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (entityType !== 'property' && entityType !== 'project') {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid entityType. Must be 'property' or 'project'" } as GeocodeResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Geocoding ${entityType} ${entityId}: ${address}, ${city}`);

    const result = await tryGeocode(address, city, neighborhood);

    if (!result) {
      return new Response(
        JSON.stringify({ success: false, error: "Could not geocode address. Please verify the address is correct." } as GeocodeResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lat, lng, source } = result;

    // Save to database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const tableName = entityType === 'property' ? 'properties' : 'projects';
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ latitude: lat, longitude: lng })
      .eq('id', entityId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Geocoded successfully but failed to save to database" } as GeocodeResponse),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully geocoded via ${source}: ${lat}, ${lng}`);

    return new Response(
      JSON.stringify({ success: true, latitude: lat, longitude: lng, source } as GeocodeResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("geocode-address error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Failed to geocode address" } as GeocodeResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
