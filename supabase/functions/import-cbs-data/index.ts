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

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Allow service role key OR admin user
    if (token !== serviceRoleKey) {
      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user }, error: userErr } = await anonClient.auth.getUser();
      if (userErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) {
        return new Response(JSON.stringify({ error: "Admin only" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { table, rows, clear } = await req.json();

    if (table === "city_price_history") {
      // Clear existing data first (unless clear=false)
      if (clear !== false) {
        await supabase.from("city_price_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }

      // Insert in batches of 500
      const batchSize = 500;
      let inserted = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize).map((r: any) => ({
          city_en: r.city_en,
          rooms: r.rooms === 'all' ? 0 : parseInt(r.rooms),
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
      // Clear existing data first (unless clear=false)
      if (clear !== false) {
        await supabase.from("neighborhood_price_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }

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

    // Update cities table from city_summary data
    if (table === "city_summary") {
      let updated = 0;
      for (const r of rows) {
        if (!r.city_en || r.transaction_count === '0') continue;
        
        const updateData: Record<string, any> = {};
        if (r.avg_price_per_sqm) updateData.average_price_sqm = parseFloat(r.avg_price_per_sqm);
        if (r.price_increase_pct) updateData.yoy_price_change = parseFloat(r.price_increase_pct);
        if (r.rental_yield_pct) updateData.gross_yield_percent = parseFloat(r.rental_yield_pct);
        if (r.avg_transaction_price) updateData.average_price = parseFloat(r.avg_transaction_price);
        
        if (Object.keys(updateData).length === 0) continue;
        
        // Match by city name
        const { error } = await supabase
          .from("cities")
          .update(updateData)
          .eq("name", r.city_en);
        
        if (!error) updated++;
      }
      return new Response(JSON.stringify({ success: true, updated }), {
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
