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
  const googleKey = Deno.env.get("GOOGLE_MAPS_API_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Get POIs with failed/pending geocoding
  const { data: pois, error } = await supabase
    .from("map_pois")
    .select("id, name, address, city")
    .in("geocode_status", ["failed", "pending"])
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
          .update({ geocode_status: "failed" })
          .eq("id", poi.id);
        failed++;
        console.log(`Failed: ${poi.name} (${data.status}: ${data.error_message || "no results"})`);
      }
    } catch (e) {
      failed++;
      console.error(`Error geocoding ${poi.name}:`, e);
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 100));
  }

  // Count remaining
  const { count } = await supabase
    .from("map_pois")
    .select("id", { count: "exact", head: true })
    .in("geocode_status", ["failed", "pending"]);

  return new Response(
    JSON.stringify({ success, failed, remaining: count }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
