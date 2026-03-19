import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isWithinIsrael(lat: number, lng: number): boolean {
  return lat >= 29 && lat <= 34 && lng >= 34 && lng <= 36;
}

async function geocodeWithGoogle(query: string): Promise<{ lat: number; lng: number; source: string } | null> {
  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!apiKey) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}&region=il`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK" && data.results?.[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      if (isWithinIsrael(lat, lng)) return { lat, lng, source: "google_maps" };
    }
  } catch (e) { console.error("Google error:", e); }
  return null;
}

async function geocodeWithNominatim(query: string): Promise<{ lat: number; lng: number; source: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=il&limit=1`,
      { headers: { "User-Agent": "BuyWiseIsrael/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.[0]) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (isWithinIsrael(lat, lng)) return { lat, lng, source: "nominatim" };
    }
  } catch (e) { console.error("Nominatim error:", e); }
  return null;
}

async function geocodeAddress(address: string, city: string, neighborhood?: string) {
  const variations: string[] = [];
  if (neighborhood) variations.push(`${address}, ${neighborhood}, ${city}, Israel`);
  variations.push(`${address}, ${city}, Israel`);

  // Try Google first
  for (const q of variations.slice(0, 2)) {
    const r = await geocodeWithGoogle(q);
    if (r) return r;
  }
  // Nominatim fallback
  for (const q of variations) {
    const r = await geocodeWithNominatim(q);
    if (r) return r;
  }
  return null;
}

// Process a batch of transactions concurrently (limited concurrency)
async function processBatch(
  transactions: Array<{ id: string; address: string; city: string; neighborhood: string | null }>,
  serviceClient: ReturnType<typeof createClient>,
  concurrency: number = 5
) {
  let geocoded = 0;
  let failed = 0;

  // Process in chunks of `concurrency`
  for (let i = 0; i < transactions.length; i += concurrency) {
    const chunk = transactions.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      chunk.map(async (txn) => {
        const result = await geocodeAddress(txn.address, txn.city, txn.neighborhood || undefined);
        if (result) {
          const { error } = await serviceClient
            .from("sold_transactions")
            .update({
              latitude: result.lat,
              longitude: result.lng,
              geocoded_at: new Date().toISOString(),
              geocode_source: result.source,
            })
            .eq("id", txn.id);
          if (!error) return true;
        }
        return false;
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) geocoded++;
      else failed++;
    }

    // Rate limit between chunks (100ms per item in chunk)
    if (i + concurrency < transactions.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return { geocoded, failed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { city, batchSize = 200 } = body;
    const limit = Math.min(batchSize, 500);

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get total un-geocoded count
    let countQuery = serviceClient
      .from("sold_transactions")
      .select("id", { count: "exact", head: true })
      .is("latitude", null);
    if (city) countQuery = countQuery.eq("city", city);
    const { count: totalRemaining } = await countQuery;

    // Fetch batch
    let query = serviceClient
      .from("sold_transactions")
      .select("id, address, city, neighborhood")
      .is("latitude", null)
      .limit(limit);
    if (city) query = query.eq("city", city);

    const { data: transactions, error: fetchError } = await query;

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!transactions || transactions.length === 0) {
      return new Response(JSON.stringify({
        success: true, geocoded: 0, failed: 0, remaining: 0,
        message: "No transactions to geocode",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { geocoded, failed } = await processBatch(transactions, serviceClient, 5);

    return new Response(JSON.stringify({
      success: true,
      total: transactions.length,
      geocoded,
      failed,
      remaining: Math.max(0, (totalRemaining || 0) - geocoded),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Batch geocoding error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Batch geocoding failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
