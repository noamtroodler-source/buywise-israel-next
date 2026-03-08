import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    // Find expired trials
    const { data: expired, error } = await supabase
      .from("subscriptions")
      .select("id, entity_type, entity_id, is_founding_partner")
      .eq("status", "trialing")
      .lt("trial_end", new Date().toISOString());

    if (error) throw error;

    let transitioned = 0;
    const errors: string[] = [];

    for (const sub of expired || []) {
      try {
        // For now, set to expired. When PayPlus is live, we'll initiate a charge instead.
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("id", sub.id);

        if (updateError) throw updateError;

        transitioned++;
        console.log(`Trial expired: subscription ${sub.id} (${sub.entity_type}/${sub.entity_id})`);

        // TODO: Send notification email via send-notification function
        // TODO: When PayPlus is live, initiate first charge for users with payment method
      } catch (err) {
        errors.push(`Sub ${sub.id}: ${(err as Error).message}`);
      }
    }

    console.log(`Done: transitioned=${transitioned}, errors=${errors.length}`);

    return new Response(
      JSON.stringify({ success: true, transitioned, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Check trial expirations failed:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
