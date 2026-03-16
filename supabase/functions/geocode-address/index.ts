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
  skipDbSave?: boolean;
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

// ─── ITM (Israeli Transverse Mercator) to WGS84 conversion ──────────────────
function itmToWgs84(e: number, n: number): { lat: number; lng: number } {
  // ITM parameters
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const e2 = 2 * f - f * f;
  const e1 = Math.sqrt(e2);
  const e1sq = e2 / (1 - e2);
  const k0 = 1.0000067;
  const lon0 = (31 + 44 / 60 + 3.8170 / 3600) * Math.PI / 180;
  const lat0 = (31 + 44 / 60 + 3.8170 / 3600) * Math.PI / 180;
  const falseE = 219529.584;
  const falseN = 626907.39;

  // Use standard reverse TM projection
  const x = (e - falseE) / k0;
  const y = (n - falseN) / k0;

  const M = y + computeM(lat0, a, e2);
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));

  const e1r = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 = mu + (3 * e1r / 2 - 27 * e1r * e1r * e1r / 32) * Math.sin(2 * mu)
    + (21 * e1r * e1r / 16 - 55 * e1r * e1r * e1r * e1r / 32) * Math.sin(4 * mu)
    + (151 * e1r * e1r * e1r / 96) * Math.sin(6 * mu);

  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = sinPhi1 / cosPhi1;
  const N1 = a / Math.sqrt(1 - e2 * sinPhi1 * sinPhi1);
  const T1 = tanPhi1 * tanPhi1;
  const C1 = e1sq * cosPhi1 * cosPhi1;
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * sinPhi1 * sinPhi1, 1.5);
  const D = x / N1;

  const lat = phi1 - (N1 * tanPhi1 / R1) * (
    D * D / 2
    - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * e1sq) * D * D * D * D / 24
    + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * e1sq - 3 * C1 * C1) * D * D * D * D * D * D / 720
  );

  const lng = lon0 + (D - (1 + 2 * T1 + C1) * D * D * D / 6
    + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * e1sq + 24 * T1 * T1) * D * D * D * D * D / 120) / cosPhi1;

  return { lat: lat * 180 / Math.PI, lng: lng * 180 / Math.PI };
}

function computeM(lat: number, a: number, e2: number): number {
  return a * (
    (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * lat
    - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * lat)
    + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * lat)
    - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * lat)
  );
}

// ─── Geocoding Providers ────────────────────────────────────────────────────

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

// Secondary: GovMap (Israeli government, free, no API key)
async function geocodeWithGovMap(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://es.govmap.gov.il/TldSearch/api/DetailsByQuery?query=${encodeURIComponent(query)}&lyrs=1&gid=govmap`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'BuyWiseIsrael/1.0', 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    // GovMap returns { data: { ADDRESS: [...] } } with X, Y in ITM
    const results = data?.data?.ADDRESS;
    if (results && results.length > 0) {
      const first = results[0];
      const x = parseFloat(first.X);
      const y = parseFloat(first.Y);
      if (!isNaN(x) && !isNaN(y) && x > 0 && y > 0) {
        const { lat, lng } = itmToWgs84(x, y);
        if (isWithinIsrael(lat, lng)) {
          return { lat, lng };
        }
        console.warn("GovMap result outside Israel bounds:", lat, lng);
      }
    }
  } catch (error) {
    console.error("GovMap geocoding error:", error);
  }
  return null;
}

// Tertiary: Nominatim (free, OSM-based)
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

// Try Google → GovMap → Nominatim with address variations
async function tryGeocode(address: string, city: string, neighborhood?: string): Promise<{ lat: number; lng: number; source: string } | null> {
  const variations = buildAddressVariations(address, city, neighborhood);

  // Try Google with the most specific variations first
  for (const query of variations.slice(0, 2)) {
    console.log(`[Google] Trying: ${query}`);
    const coords = await geocodeWithGoogle(query);
    if (coords) {
      console.log(`[Google] Success: ${query}`);
      return { ...coords, source: 'google_maps' };
    }
  }

  // Try GovMap with top variations (works best with Hebrew addresses)
  for (const query of variations.slice(0, 2)) {
    console.log(`[GovMap] Trying: ${query}`);
    const coords = await geocodeWithGovMap(query);
    if (coords) {
      console.log(`[GovMap] Success: ${query}`);
      return { ...coords, source: 'govmap' };
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
    const { entityType, entityId, address, city, neighborhood, skipDbSave } = await req.json() as GeocodeRequest;

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

    // Save to database (skip when called from import pipeline)
    if (!skipDbSave) {
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
