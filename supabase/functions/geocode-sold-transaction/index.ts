import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeocodeRequest {
  transactionIds?: string[];
  city?: string;
  limit?: number;
}

interface GeocodeResult {
  lat: number;
  lng: number;
  source: string;
}

// Validate coordinates are within Israel bounds
function isWithinIsrael(lat: number, lng: number): boolean {
  return lat >= 29 && lat <= 34 && lng >= 34 && lng <= 36;
}

// Primary: Google Maps Geocoding API
async function geocodeWithGoogle(query: string): Promise<GeocodeResult | null> {
  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}&region=il`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results?.[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      if (isWithinIsrael(lat, lng)) {
        return { lat, lng, source: "google_maps" };
      }
      console.warn("Google result outside Israel bounds:", lat, lng);
    }
  } catch (error) {
    console.error("Google geocoding error:", error);
  }
  return null;
}

// Fallback: Nominatim (free, OSM-based)
async function geocodeWithNominatim(query: string): Promise<GeocodeResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=il&limit=1`,
      { headers: { "User-Agent": "BuyWiseIsrael/1.0" } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data?.[0]) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (isWithinIsrael(lat, lng)) {
        return { lat, lng, source: "nominatim" };
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

  return variations;
}

// Combined geocoding: Google first, then Nominatim with multiple formats
async function geocodeAddress(address: string, city: string, neighborhood?: string): Promise<GeocodeResult | null> {
  const variations = buildAddressVariations(address, city, neighborhood);

  // Try Google with most specific variations
  for (const query of variations.slice(0, 2)) {
    const result = await geocodeWithGoogle(query);
    if (result) return result;
  }

  // Fall back to Nominatim with all variations
  for (const query of variations) {
    const result = await geocodeWithNominatim(query);
    if (result) return result;
  }

  // Last resort: city only
  return await geocodeWithNominatim(`${city}, Israel`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: GeocodeRequest = await req.json();
    const { transactionIds, city, limit = 50 } = body;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = serviceClient
      .from("sold_transactions")
      .select("id, address, city, neighborhood")
      .is("latitude", null)
      .limit(Math.min(limit, 100));

    if (transactionIds && transactionIds.length > 0) {
      query = query.in("id", transactionIds);
    } else if (city) {
      query = query.eq("city", city);
    }

    const { data: transactions, error: fetchError } = await query;

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, geocoded: 0, failed: 0, message: "No transactions to geocode" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let geocoded = 0;
    let failed = 0;
    const results: { id: string; success: boolean; source?: string }[] = [];

    for (const txn of transactions) {
      const fullAddress = txn.neighborhood
        ? `${txn.address}, ${txn.neighborhood}`
        : txn.address;

      const result = await geocodeAddress(fullAddress, txn.city, txn.neighborhood);

      if (result) {
        const { error: updateError } = await serviceClient
          .from("sold_transactions")
          .update({
            latitude: result.lat,
            longitude: result.lng,
            geocoded_at: new Date().toISOString(),
            geocode_source: result.source,
          })
          .eq("id", txn.id);

        if (!updateError) {
          geocoded++;
          results.push({ id: txn.id, success: true, source: result.source });
        } else {
          failed++;
          results.push({ id: txn.id, success: false });
        }
      } else {
        failed++;
        results.push({ id: txn.id, success: false });
      }

      // Rate limiting between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(
      JSON.stringify({ success: true, total: transactions.length, geocoded, failed, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Geocoding error:", error);
    const message = error instanceof Error ? error.message : "Geocoding failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
