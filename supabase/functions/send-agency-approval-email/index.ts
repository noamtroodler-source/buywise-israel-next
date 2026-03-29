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
    const { agencyId } = await req.json();
    if (!agencyId) {
      return new Response(
        JSON.stringify({ error: "agencyId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("name, email, slug, admin_user_id")
      .eq("id", agencyId)
      .single();

    if (agencyError || !agency) {
      return new Response(
        JSON.stringify({ error: "Agency not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!agency.email) {
      return new Response(
        JSON.stringify({ error: "Agency has no email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const portalUrl = "https://buywiseisrael.com/agency/dashboard";
    const publicPageUrl = `https://buywiseisrael.com/agencies/${agency.slug}`;

    const { error: emailError } = await resend.emails.send({
      from: "BuyWise Israel <hello@buywiseisrael.com>",
      to: [agency.email],
      subject: `Welcome aboard — ${agency.name} is now live on BuyWise Israel!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="https://buywiseisrael.com" style="text-decoration: none;">
              <img src="https://buywiseisrael.com/og-image.png" alt="BuyWise Israel" style="height: 48px; width: auto;" />
            </a>
          </div>

          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">
            🎉 Congratulations, ${agency.name}!
          </h1>

          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            Your agency has been reviewed and approved. You're now officially part of the BuyWise Israel platform — welcome aboard!
          </p>

          <div style="margin: 24px 0; padding: 20px; background-color: #f0fdf4; border-radius: 12px; border-left: 4px solid #22c55e;">
            <p style="margin: 0 0 8px; color: #166534; font-weight: 600; font-size: 15px;">Here's what you can do now:</p>
            <ul style="margin: 0; padding-left: 20px; color: #333; font-size: 14px; line-height: 2;">
              <li>Invite your agents using your unique invite link</li>
              <li>Add and manage property listings</li>
              <li>Track leads, views, and performance</li>
              <li>Customize your public agency profile</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${portalUrl}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
              Go to Your Dashboard
            </a>
          </div>

          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 8px;">
            Your public agency page is live at:
          </p>
          <p style="margin-bottom: 24px;">
            <a href="${publicPageUrl}" style="color: #2563eb; font-size: 14px; word-break: break-all;">${publicPageUrl}</a>
          </p>

          <p style="color: #999; font-size: 12px; margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            Questions? Just reply — we read every email.<br>
            <span style="color: #666; font-style: italic;">— Your friends at BuyWise Israel</span>
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Failed to send approval email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Approval email sent to ${agency.email} for agency ${agency.name}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send agency approval email failed:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
