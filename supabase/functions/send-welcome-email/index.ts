import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type UserType = 'buyer' | 'agent' | 'developer' | 'agency';

interface WelcomeEmailPayload {
  email: string;
  name: string;
  userType: UserType;
}

const brandFooter = `
  <p style="color: #999; font-size: 12px; margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
    Questions? Just reply — we read every email.<br>
    <span style="color: #666; font-style: italic;">— Your friends at BuyWise Israel</span>
  </p>
`;

const getWelcomeContent = (name: string, userType: UserType) => {
  const firstName = name.split(' ')[0];
  
  switch (userType) {
    case 'buyer':
      return {
        subject: `Welcome to BuyWise Israel, ${firstName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
              <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 16px;">Welcome to your corner of clarity</h1>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                We built BuyWise for people exactly like you — navigating a new market, asking good questions, and taking your time. There's no pressure here. Explore at your own pace.
              </p>
              
              <div style="background-color: #eff6ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 16px 0;">Here's what you can do:</h2>
                <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>Browse listings</strong> with English descriptions and transparent pricing</li>
                  <li><strong>Save favorites</strong> and get notified when prices drop</li>
                  <li><strong>Set up search alerts</strong> for new properties matching your criteria</li>
                  <li><strong>Use our calculators</strong> to understand taxes, mortgages, and true costs</li>
                  <li><strong>Read city guides</strong> to find the perfect neighborhood</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-bottom: 24px;">
                Take your time. We'd rather you take six months to feel ready than rush into something you'll regret.
              </p>
              
              <a href="https://buywiseisrael.com/search" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 16px;">
                Start Exploring
              </a>
              
              ${brandFooter}
            </div>
          </body>
          </html>
        `,
      };
    
    case 'agent':
      return {
        subject: `Welcome to BuyWise Israel, ${firstName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
              <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 16px;">You've taken the first step</h1>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Thank you for joining BuyWise Israel. Our team will review your registration — usually within 1-2 business days. We'll let you know as soon as you're approved.
              </p>
              
              <div style="background-color: #eff6ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 16px 0;">What happens next:</h2>
                <ol style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>Profile Review</strong> – Our team will review your registration</li>
                  <li><strong>Approval Email</strong> – You'll receive an email once approved</li>
                  <li><strong>Start Listing</strong> – Add your properties and reach English-speaking buyers</li>
                  <li><strong>Receive Leads</strong> – Get qualified inquiries directly to your dashboard</li>
                </ol>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                While you wait, feel free to explore the platform and prepare your listings. No rush — we're here when you need us.
              </p>
              
              <a href="https://buywiseisrael.com/agent" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 16px;">
                Go to Dashboard
              </a>
              
              ${brandFooter}
            </div>
          </body>
          </html>
        `,
      };
    
    case 'developer':
      return {
        subject: `Welcome to BuyWise Israel, ${firstName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
              <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 16px;">You've taken the first step</h1>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Thank you for registering your company on BuyWise Israel. Our team will review your profile — usually within 1-2 business days. We'll be in touch as soon as you're approved.
              </p>
              
              <div style="background-color: #eff6ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 16px 0;">What BuyWise offers developers:</h2>
                <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>English-speaking audience</strong> – Reach olim and international buyers</li>
                  <li><strong>Project showcase</strong> – Display your developments with detailed pages</li>
                  <li><strong>Qualified leads</strong> – Receive inquiries from serious buyers</li>
                  <li><strong>Analytics dashboard</strong> – Track views and engagement</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                No rush on our end — we're here when you need us.
              </p>
              
              <a href="https://buywiseisrael.com/developer" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 16px;">
                Go to Dashboard
              </a>
              
              ${brandFooter}
            </div>
          </body>
          </html>
        `,
      };
    
    case 'agency':
      return {
        subject: `Welcome to BuyWise Israel, ${firstName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
              <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 16px;">You've taken the first step</h1>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Thank you for registering your agency on BuyWise Israel. Our team will review your profile — usually within 1-2 business days. We'll let you know as soon as you're approved.
              </p>
              
              <div style="background-color: #eff6ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 16px 0;">Agency features on BuyWise:</h2>
                <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>Team management</strong> – Invite and manage your agents</li>
                  <li><strong>Centralized leads</strong> – View all inquiries in one place</li>
                  <li><strong>Agency branding</strong> – Showcase your agency on agent profiles</li>
                  <li><strong>Performance analytics</strong> – Track team performance metrics</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Once approved, you'll be able to invite agents to join your agency using invite codes. No rush — we're here when you need us.
              </p>
              
              <a href="https://buywiseisrael.com/agency" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 16px;">
                Go to Dashboard
              </a>
              
              ${brandFooter}
            </div>
          </body>
          </html>
        `,
      };
    
    default:
      return {
        subject: `Welcome to BuyWise Israel, ${firstName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
              <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 16px;">Welcome to BuyWise Israel</h1>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${firstName}, thank you for joining us.</p>
              ${brandFooter}
            </div>
          </body>
          </html>
        `,
      };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    
    const payload: WelcomeEmailPayload = await req.json();
    
    if (!payload.email || !payload.name || !payload.userType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, name, userType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Sending welcome email to:", payload.email, "type:", payload.userType);

    const { subject, html } = getWelcomeContent(payload.name, payload.userType);
    
    const resend = new Resend(resendApiKey);
    
    const emailResponse = await resend.emails.send({
      from: "BuyWise Israel <hello@buywiseisrael.com>",
      to: [payload.email],
      subject: subject,
      html: html,
    });
    
    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Welcome email sent",
        recipient: payload.email,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    console.error("Error sending welcome email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
