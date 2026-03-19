import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function geocodeNominatim(address: string, city: string): Promise<{ lat: number; lng: number } | null> {
  const query = `${address}, ${city}, Israel`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=il`;
  
  const resp = await fetch(url, {
    headers: { "User-Agent": "BuyWiseIsrael/1.0 (poi-import)" },
  });
  const data = await resp.json();
  
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  
  // Fallback: try city-only geocoding
  const cityUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ", Israel")}&format=json&limit=1&countrycodes=il`;
  const cityResp = await fetch(cityUrl, {
    headers: { "User-Agent": "BuyWiseIsrael/1.0 (poi-import)" },
  });
  const cityData = await cityResp.json();
  
  if (cityData && cityData.length > 0) {
    return { lat: parseFloat(cityData[0].lat), lng: parseFloat(cityData[0].lon) };
  }
  
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Get POIs needing geocoding
  const { data: pois, error } = await supabase
    .from("map_pois")
    .select("id, name, address, city")
    .in("geocode_status", ["failed", "pending"])
    .not("address", "is", null)
    .limit(30); // Nominatim rate limit: 1 req/sec

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!pois || pois.length === 0) {
    return new Response(
      JSON.stringify({ message: "No POIs to geocode", remaining: 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let success = 0;
  let failed = 0;

  for (const poi of pois) {
    const result = await geocodeNominatim(poi.address, poi.city);

    if (result) {
      await supabase
        .from("map_pois")
        .update({
          latitude: result.lat,
          longitude: result.lng,
          geocode_status: "success",
        })
        .eq("id", poi.id);
      success++;
    } else {
      await supabase
        .from("map_pois")
        .update({ geocode_status: "manual" })
        .eq("id", poi.id);
      failed++;
      console.log(`Failed: ${poi.name} - ${poi.address}, ${poi.city}`);
    }

    // Nominatim requires 1 second between requests
    await new Promise((r) => setTimeout(r, 1100));
  }

  // Count remaining
  const { count } = await supabase
    .from("map_pois")
    .select("id", { count: "exact", head: true })
    .in("geocode_status", ["failed", "pending"]);

  return new Response(
    JSON.stringify({ success, failed, remaining: count, batch_size: pois.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
