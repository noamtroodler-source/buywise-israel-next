import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all active founding partners
    const { data: partners, error: partnersError } = await supabase
      .from("founding_partners")
      .select("id, agency_id, free_credits_per_month, free_credits_duration_months")
      .eq("is_active", true);

    if (partnersError) throw partnersError;

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    // End of current month UTC
    const expiresAt = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)).toISOString();
    // Start of current month for idempotency check
    const monthStart = new Date(Date.UTC(year, month, 1)).toISOString();

    let granted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const partner of partners || []) {
      try {
        // Count existing credit rows for this partner
        const { count, error: countError } = await supabase
          .from("founding_featured_credits")
          .select("id", { count: "exact", head: true })
          .eq("founding_partner_id", partner.id);

        if (countError) throw countError;

        // Check if all months exhausted
        if ((count ?? 0) >= partner.free_credits_duration_months) {
          skipped++;
          continue;
        }

        // Check if already granted this month (idempotent)
        const { data: existing } = await supabase
          .from("founding_featured_credits")
          .select("id")
          .eq("founding_partner_id", partner.id)
          .gte("granted_at", monthStart)
          .limit(1);

        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        // Grant credits
        const { error: insertError } = await supabase
          .from("founding_featured_credits")
          .insert({
            founding_partner_id: partner.id,
            month_number: (count ?? 0) + 1,
            credits_granted: partner.free_credits_per_month,
            credits_used: 0,
            expires_at: expiresAt,
          });

        if (insertError) throw insertError;

        granted++;
        console.log(`Granted ${partner.free_credits_per_month} credits to partner ${partner.id} (month ${(count ?? 0) + 1})`);
      } catch (err) {
        errors.push(`Partner ${partner.id}: ${err.message}`);
        console.error(`Error for partner ${partner.id}:`, err);
      }
    }

    console.log(`Done: granted=${granted}, skipped=${skipped}, errors=${errors.length}`);

    return new Response(
      JSON.stringify({ success: true, granted, skipped, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Grant credits failed:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
