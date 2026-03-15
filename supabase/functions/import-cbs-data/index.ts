import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user is admin
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { table, rows } = await req.json();

    if (table === "city_price_history") {
      // Clear existing data first
      await supabase.from("city_price_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Insert in batches of 500
      const batchSize = 500;
      let inserted = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize).map((r: any) => ({
          city_en: r.city_en,
          rooms: parseInt(r.rooms),
          year: parseInt(r.year),
          quarter: parseInt(r.quarter),
          avg_price_nis: r.avg_price_nis ? parseFloat(r.avg_price_nis) : null,
          country_avg: r.country_avg_nis ? parseFloat(r.country_avg_nis) : null,
        }));
        const { error } = await supabase.from("city_price_history").insert(batch);
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message, inserted, batch_index: i }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        inserted += batch.length;
      }
      return new Response(JSON.stringify({ success: true, inserted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (table === "neighborhood_price_history") {
      // Clear existing data first
      await supabase.from("neighborhood_price_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const batchSize = 500;
      let inserted = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize).map((r: any) => {
          // CSV has month, derive quarter
          const month = parseInt(r.month);
          const quarter = Math.ceil(month / 3);
          return {
            city_en: r.city_en,
            neighborhood_he: r.neighborhood_he,
            neighborhood_id: String(r.neighborhood_id),
            rooms: parseInt(r.rooms),
            year: parseInt(r.year),
            quarter,
            avg_price_nis: r.avg_price_nis ? parseFloat(r.avg_price_nis) : null,
            latest_avg_price: r.latest_avg_price ? parseFloat(r.latest_avg_price) : null,
            yoy_change_pct: r.yoy_change_pct ? parseFloat(r.yoy_change_pct) : null,
            price_increase_pct: r.price_increase_pct ? parseFloat(r.price_increase_pct) : null,
            rental_yield_pct: r.rental_yield_pct ? parseFloat(r.rental_yield_pct) : null,
          };
        });
        const { error } = await supabase
          .from("neighborhood_price_history")
          .upsert(batch, { onConflict: "neighborhood_id,rooms,year,quarter" });
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message, inserted, batch_index: i }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        inserted += batch.length;
      }
      return new Response(JSON.stringify({ success: true, inserted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown table" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
