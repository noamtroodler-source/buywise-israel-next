// Minimal, no-fabrication enrichment for JRE listings.
// All previous rule-based guesses (features by neighborhood/price/floor,
// bathrooms by bedrooms, parking by type, floor by id-hash, ac_type by price,
// price by neighborhood-avg-per-sqm, fabricated street addresses) have been
// REMOVED — they violated the No-Fabrication policy.
//
// Real features now come exclusively from:
//   1) Structured fields on the agency page (handled in import-agency-listings)
//   2) Gemini extraction of the prose description (handled in import-agency-listings
//      and re-run via the refresh-jre-features function)
//
// This function now only sets safe, non-inferred defaults.

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

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const AGENCY_ID = "0058c3aa-2331-4a34-9c0e-c11aa984deff";

    const { data: properties, error: propErr } = await sb
      .from("properties")
      .select("id, city, is_published")
      .eq("primary_agency_id", AGENCY_ID);

    if (propErr) throw propErr;
    if (!properties?.length) {
      return new Response(JSON.stringify({ error: "No properties found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    for (const prop of properties) {
      const updates: Record<string, unknown> = { is_published: true };
      if (!prop.city || prop.city.trim() === "") updates.city = "Jerusalem";

      const { error } = await sb
        .from("properties")
        .update(updates)
        .eq("id", prop.id);
      if (!error) updated++;
      else console.error(`Failed to update ${prop.id}: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        total: properties.length,
        updated,
        note:
          "Fabricated enrichment removed. Use refresh-jre-features to re-extract features from descriptions.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("enrich-jre-listings error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
