import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isWithinIsrael(lat: number, lng: number): boolean {
  return lat >= 29 && lat <= 34 && lng >= 34 && lng <= 36;
}

async function geocodeWithGoogle(query: string): Promise<{ lat: number; lng: number; source: string } | null> {
  const apiKey = Deno.env.get("GOOGLE_GEOCODING_API_KEY") || Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!apiKey) {
    console.error("Neither GOOGLE_GEOCODING_API_KEY nor GOOGLE_MAPS_API_KEY is set");
    return null;
  }
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}&region=il`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK" && data.results?.[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      if (isWithinIsrael(lat, lng)) return { lat, lng, source: "google_maps" };
      console.warn(`Google result outside Israel: ${lat},${lng} for "${query}"`);
    } else if (data.status !== "ZERO_RESULTS") {
      console.warn(`Google geocode status: ${data.status} for "${query}" - ${data.error_message || ''}`);
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

  for (const q of variations.slice(0, 2)) {
    const r = await geocodeWithGoogle(q);
    if (r) return r;
  }
  for (const q of variations) {
    await new Promise(resolve => setTimeout(resolve, 1100)); // Nominatim: max 1 req/sec
    const r = await geocodeWithNominatim(q);
    if (r) return r;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check how many remain
    const { count: totalRemaining } = await serviceClient
      .from("sold_transactions")
      .select("id", { count: "exact", head: true })
      .is("latitude", null);

    if (!totalRemaining || totalRemaining === 0) {
      console.log("No ungeooded transactions remaining. Idling.");
      return new Response(JSON.stringify({
        success: true, geocoded: 0, failed: 0, remaining: 0,
        message: "All transactions geocoded",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch batch of 200
    const { data: transactions, error: fetchError } = await serviceClient
      .from("sold_transactions")
      .select("id, address, city, neighborhood")
      .is("latitude", null)
      .limit(5);

    if (fetchError || !transactions || transactions.length === 0) {
      return new Response(JSON.stringify({
        success: true, geocoded: 0, failed: 0, remaining: totalRemaining,
        message: fetchError?.message || "No transactions fetched",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let geocoded = 0;
    let failed = 0;

    // Process in chunks of 5 concurrent
    for (let i = 0; i < transactions.length; i += 5) {
      const chunk = transactions.slice(i, i + 5);
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
            return !error;
          }
          return false;
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled" && r.value) geocoded++;
        else failed++;
      }

      // Rate limit: 200ms between Google chunks, 1.2s if hitting Nominatim
      if (i + 5 < transactions.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`Batch complete: ${geocoded} geocoded, ${failed} failed, ~${Math.max(0, (totalRemaining || 0) - geocoded)} remaining`);

    return new Response(JSON.stringify({
      success: true,
      total: transactions.length,
      geocoded,
      failed,
      remaining: Math.max(0, (totalRemaining || 0) - geocoded),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Auto-geocode error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Auto-geocode failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
