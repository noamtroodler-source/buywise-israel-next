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

// Geocode using Google Maps API (primary, more accurate for Israel)
async function geocodeWithGoogle(address: string, city: string): Promise<GeocodeResult | null> {
  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!apiKey) return null;

  const fullAddress = `${address}, ${city}, Israel`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results?.[0]) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        source: "google_maps",
      };
    }
  } catch (error) {
    console.error("Google geocoding error:", error);
  }

  return null;
}

// Geocode using Nominatim (fallback, free)
async function geocodeWithNominatim(address: string, city: string): Promise<GeocodeResult | null> {
  const fullAddress = `${address}, ${city}, Israel`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "BuyWiseIsrael/1.0" },
    });
    const data = await response.json();

    if (data?.[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        source: "nominatim",
      };
    }
  } catch (error) {
    console.error("Nominatim geocoding error:", error);
  }

  return null;
}

// Combined geocoding with fallback
async function geocodeAddress(address: string, city: string): Promise<GeocodeResult | null> {
  // Try Google first (more accurate for Israeli addresses)
  const googleResult = await geocodeWithGoogle(address, city);
  if (googleResult) return googleResult;

  // Fallback to Nominatim
  const nominatimResult = await geocodeWithNominatim(address, city);
  if (nominatimResult) return nominatimResult;

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
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

    // Use service role for updates
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Build query for transactions needing geocoding
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

    // Process with rate limiting (1 request per 100ms for Nominatim)
    for (const txn of transactions) {
      const fullAddress = txn.neighborhood 
        ? `${txn.address}, ${txn.neighborhood}`
        : txn.address;

      const result = await geocodeAddress(fullAddress, txn.city);

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

      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: transactions.length,
        geocoded,
        failed,
        results,
      }),
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
