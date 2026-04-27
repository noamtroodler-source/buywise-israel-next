import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profiles } = await req.json();

    if (!Array.isArray(profiles) || profiles.length === 0) {
      return new Response(JSON.stringify({ error: "profiles array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let inserted = 0;
    let updated = 0;
    let errors: string[] = [];
    const BATCH_SIZE = 100;

    for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
      const batch = profiles.slice(i, i + BATCH_SIZE);

      for (const p of batch) {
        if (!p.city || !p.neighborhood) {
          errors.push(`Missing city/neighborhood: ${JSON.stringify(p).slice(0, 100)}`);
          continue;
        }

        const row = {
          city: p.city.trim(),
          neighborhood: p.neighborhood.trim(),
          reputation: p.reputation || null,
          physical_character: p.physical_character || null,
          proximity_anchors: p.proximity_anchors || null,
          anglo_community: p.anglo_community || null,
          daily_life: p.daily_life || null,
          transit_mobility: p.transit_mobility || null,
          honest_tradeoff: p.honest_tradeoff || null,
          best_for: p.best_for || null,
          sources: p.sources || null,
        };

        const { error: upsertError, data: upsertData } = await adminClient
          .from("neighborhood_profiles")
          .upsert(row, { onConflict: "city,neighborhood" })
          .select("id");

        if (upsertError) {
          errors.push(`${p.city}/${p.neighborhood}: ${upsertError.message}`);
        } else {
          inserted++;
        }
      }
    }

    return new Response(
      JSON.stringify({ inserted, errors, total: profiles.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
