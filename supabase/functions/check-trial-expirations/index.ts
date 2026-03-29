import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@^2.0.0";

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

        // Send trial expired email
        try {
          const resendApiKey = Deno.env.get("RESEND_API_KEY");
          if (resendApiKey) {
            let recipientEmail: string | null = null;
            if (sub.entity_type === "agency") {
              const { data } = await supabase.from("agencies").select("email").eq("id", sub.entity_id).single();
              recipientEmail = data?.email || null;
            } else if (sub.entity_type === "developer") {
              const { data } = await supabase.from("developers").select("email").eq("id", sub.entity_id).single();
              recipientEmail = data?.email || null;
            }

            if (recipientEmail) {
              const resend = new Resend(resendApiKey);
              await resend.emails.send({
                from: "BuyWise Israel <hello@buywiseisrael.com>",
                to: [recipientEmail],
                subject: "Your free trial has ended — BuyWise Israel",
                html: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                      <a href="https://buywiseisrael.com" style="text-decoration: none;">
                        <img src="https://buywiseisrael.com/og-image.png" alt="BuyWise Israel" style="height: 48px; width: auto;" />
                      </a>
                    </div>
                    <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Your free trial has ended</h1>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">We hope you enjoyed exploring BuyWise Israel during your trial. Your trial period has now ended.</p>
                    <div style="margin-top: 16px; padding: 16px; background-color: #eff6ff; border-radius: 8px;">
                      <p style="margin: 0; color: #2563eb; font-weight: 500;">To keep access to all features, choose a plan that works for you.</p>
                    </div>
                    <a href="https://buywiseisrael.com/pricing" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 24px;">
                      View Plans
                    </a>
                    <p style="margin-top: 24px; color: #666; font-size: 14px;">Questions about which plan is right for you? Just reply — we're happy to help.</p>
                    <p style="color: #999; font-size: 12px; margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                      Questions? Just reply — we read every email.<br>
                      <span style="color: #666; font-style: italic;">— Your friends at BuyWise Israel</span>
                    </p>
                  </div>
                `,
              });
            }
          }
        } catch (emailErr) {
          console.error(`Failed to send trial expiry email for sub ${sub.id}:`, emailErr);
        }
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
