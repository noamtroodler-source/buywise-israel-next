import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const brandHeader = `
  <div style="text-align: center; margin-bottom: 32px;">
    <a href="https://buywiseisrael.com" style="text-decoration: none;">
      <img src="https://buywiseisrael.com/og-image.png" alt="BuyWise Israel" style="height: 48px; width: auto;" />
    </a>
  </div>
`;

const brandFooter = `
  <p style="color: #999; font-size: 12px; margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
    Questions? Just reply — we read every email.<br>
    <span style="color: #666; font-style: italic;">— Your friends at BuyWise Israel</span>
  </p>
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, category, message } = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendApiKey);
    const adminEmail = "hello@buywiseisrael.com";

    const categoryLabel = category || "general";

    // Admin notification
    const adminHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
        ${brandHeader}
        <div style="background: #2563eb; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">📬 New Contact Form Submission</h1>
          <p style="margin: 4px 0 0; opacity: 0.85; font-size: 14px;">Someone reached out via the contact page</p>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Category:</strong> ${categoryLabel}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p style="margin-bottom: 4px;"><strong>Message:</strong></p>
          <div style="background: #f9fafb; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 0 4px 4px 0;">
            ${message}
          </div>
          <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
            Reply directly to this email to respond to ${name}.
          </p>
        </div>
      </div>
    `;

    // Confirmation to submitter
    const confirmHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">We got your message, ${name.split(" ")[0]}! 👋</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Thanks for reaching out. We've received your message and will get back to you within 24 hours.</p>
        <div style="margin-top: 16px; padding: 16px; background-color: #eff6ff; border-radius: 8px;">
          <p style="margin: 0; color: #2563eb; font-weight: 500;">In the meantime, feel free to reply to this email if you think of anything else.</p>
        </div>
        ${brandFooter}
      </div>
    `;

    // Send both emails in parallel
    const [adminRes, confirmRes] = await Promise.allSettled([
      resend.emails.send({
        from: "BuyWise Israel <hello@buywiseisrael.com>",
        to: [adminEmail],
        replyTo: email,
        subject: `New contact form: ${categoryLabel} from ${name}`,
        html: adminHtml,
      }),
      resend.emails.send({
        from: "BuyWise Israel <hello@buywiseisrael.com>",
        to: [email],
        subject: "We got your message — BuyWise Israel",
        html: confirmHtml,
      }),
    ]);

    if (adminRes.status === "rejected") {
      console.error("Admin email failed:", adminRes.reason);
    }
    if (confirmRes.status === "rejected") {
      console.warn("Confirmation email failed:", confirmRes.reason);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("contact-form-notify error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
