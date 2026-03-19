import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const googleKey = Deno.env.get("GOOGLE_GEOCODING_API_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Get POIs needing geocoding
  const { data: pois, error } = await supabase
    .from("map_pois")
    .select("id, name, address, city")
    .in("geocode_status", ["failed", "pending", "manual"])
    .not("address", "is", null)
    .limit(50);

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
  const failures: string[] = [];

  for (const poi of pois) {
    const query = `${poi.address}, ${poi.city}, Israel`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${googleKey}`;

    try {
      const resp = await fetch(url);
      const data = await resp.json();

      if (data.status === "OK" && data.results?.length > 0) {
        const loc = data.results[0].geometry.location;
        await supabase
          .from("map_pois")
          .update({
            latitude: loc.lat,
            longitude: loc.lng,
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
        failures.push(`${poi.name}: ${data.status}`);
      }
    } catch (e) {
      failed++;
      failures.push(`${poi.name}: ${e.message}`);
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 50));
  }

  // Count remaining
  const { count } = await supabase
    .from("map_pois")
    .select("id", { count: "exact", head: true })
    .in("geocode_status", ["failed", "pending", "manual"]);

  return new Response(
    JSON.stringify({ success, failed, remaining: count, batch_size: pois.length, sample_failures: failures.slice(0, 5) }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
