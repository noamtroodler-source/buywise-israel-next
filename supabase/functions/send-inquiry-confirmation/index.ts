import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const brandFooter = `
  <p style="color: #999; font-size: 12px; margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
    Questions? Just reply — we read every email.<br>
    <span style="color: #666; font-style: italic;">— Your friends at BuyWise Israel</span>
  </p>
`;

interface ConfirmationPayload {
  buyerEmail: string;
  buyerName: string;
  listingTitle: string;
  listingType: "property" | "project";
  contactName?: string;
  inquiryType?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ConfirmationPayload = await req.json();

    if (!payload.buyerEmail) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "No buyer email provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendApiKey);

    const firstName = payload.buyerName?.split(" ")[0] || "there";
    const contactLabel = payload.contactName || "the listing agent";
    const typeLabel = payload.listingType === "project" ? "project" : "property";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Your inquiry has been sent, ${firstName}! ✉️</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          We've forwarded your inquiry about <strong>"${payload.listingTitle}"</strong> to ${contactLabel}.
        </p>
        <div style="margin-top: 20px; padding: 16px; background-color: #eff6ff; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a1a1a;">What happens next?</p>
          <ul style="margin: 0; padding-left: 20px; color: #333; line-height: 1.8;">
            <li>The ${typeLabel === "project" ? "developer" : "agent"} will receive your inquiry</li>
            <li>Most respond within <strong>24 hours</strong></li>
            <li>They'll reach out via your preferred contact method</li>
          </ul>
        </div>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          While you wait, you can continue browsing ${typeLabel === "project" ? "new developments" : "listings"} on BuyWise Israel.
        </p>
        <a href="https://buywiseisrael.com/${typeLabel === "project" ? "projects" : "properties"}" 
           style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px;">
          Browse More ${typeLabel === "project" ? "Projects" : "Properties"}
        </a>
        ${brandFooter}
      </div>
    `;

    await resend.emails.send({
      from: "BuyWise Israel <hello@buywiseisrael.com>",
      to: [payload.buyerEmail],
      subject: `Your inquiry about "${payload.listingTitle}" has been sent`,
      html,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-inquiry-confirmation error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
