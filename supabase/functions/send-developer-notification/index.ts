import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type NotificationType = 
  | 'project_approved'
  | 'project_rejected'
  | 'changes_requested'
  | 'new_inquiry'
  | 'project_expiring';

interface NotificationPayload {
  type: NotificationType;
  developerId: string;
  projectId?: string;
  projectName?: string;
  message?: string;
  inquirerName?: string;
  inquirerEmail?: string;
  rejectionReason?: string;
  daysUntilExpiry?: number;
}

const brandFooter = `
  <p style="color: #999; font-size: 12px; margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
    Questions? Just reply — we read every email.<br>
    <span style="color: #666; font-style: italic;">— Your friends at BuyWise Israel</span>
  </p>
`;

const getNotificationContent = (payload: NotificationPayload) => {
  switch (payload.type) {
    case 'project_approved':
      return {
        subject: `Great news — "${payload.projectName}" is now live`,
        body: `Great news! Your project "${payload.projectName}" has been reviewed and approved. It is now live and visible to potential buyers on our platform.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Great news — your project is now live</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Your project <strong>"${payload.projectName}"</strong> has been reviewed and approved.</p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">It's now visible to potential buyers on BuyWise Israel.</p>
            <div style="margin-top: 24px; padding: 16px; background-color: #eff6ff; border-radius: 8px;">
              <p style="margin: 0; color: #2563eb; font-weight: 500;">Your project is active and ready to receive inquiries.</p>
            </div>
            <a href="https://buywiseisrael.com/developer/projects" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 24px;">
              View Project
            </a>
            ${brandFooter}
          </div>
        `,
      };
    case 'project_rejected':
      return {
        subject: `We couldn't approve "${payload.projectName}" — here's why`,
        body: `Your project "${payload.projectName}" could not be approved at this time.\n\nReason: ${payload.rejectionReason || 'Please contact support for more details.'}\n\nPlease update your project and resubmit for review.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">We couldn't approve this one — here's why</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">We know this isn't the news you wanted. Your project <strong>"${payload.projectName}"</strong> couldn't be approved at this time.</p>
            <div style="margin-top: 16px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #64748b;">
              <p style="margin: 0; font-weight: 600; color: #333;">Reason:</p>
              <p style="margin: 8px 0 0 0; color: #666;">${payload.rejectionReason || 'Please contact support for more details.'}</p>
            </div>
            <p style="margin-top: 24px; color: #666; font-size: 14px;">Please update your project and resubmit when you're ready. We're happy to help if you have questions.</p>
            <a href="https://buywiseisrael.com/developer/projects" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px;">
              Edit Project
            </a>
            ${brandFooter}
          </div>
        `,
      };
    case 'changes_requested':
      return {
        subject: `Just a few tweaks needed for "${payload.projectName}"`,
        body: `Our team has reviewed your project "${payload.projectName}" and requested some changes before it can be approved.\n\nFeedback: ${payload.message || 'Please review and update your project.'}\n\nPlease make the requested changes and resubmit.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Just a few tweaks needed — we're almost there</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Our team has reviewed your project <strong>"${payload.projectName}"</strong> and requested some small changes before it can go live.</p>
            <div style="margin-top: 16px; padding: 16px; background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #2563eb;">
              <p style="margin: 0; font-weight: 600; color: #333;">Feedback:</p>
              <p style="margin: 8px 0 0 0; color: #666;">${payload.message || 'Please review and update your project.'}</p>
            </div>
            <p style="margin-top: 24px; color: #666; font-size: 14px;">Once you've made the changes, resubmit and we'll take another look.</p>
            <a href="https://buywiseisrael.com/developer/projects" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px;">
              Edit Project
            </a>
            ${brandFooter}
          </div>
        `,
      };
    case 'new_inquiry':
      return {
        subject: `New inquiry for "${payload.projectName}"`,
        body: `You have received a new inquiry for your project "${payload.projectName}".\n\nFrom: ${payload.inquirerName || 'A potential buyer'}${payload.inquirerEmail ? `\nEmail: ${payload.inquirerEmail}` : ''}\n\nLog in to your dashboard to view and respond to this lead.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">New inquiry received</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Someone is interested in your project <strong>"${payload.projectName}"</strong>.</p>
            <div style="margin-top: 16px; padding: 16px; background-color: #eff6ff; border-radius: 8px;">
              <p style="margin: 0; color: #333;"><strong>From:</strong> ${payload.inquirerName || 'A potential buyer'}</p>
              ${payload.inquirerEmail ? `<p style="margin: 8px 0 0 0; color: #333;"><strong>Email:</strong> ${payload.inquirerEmail}</p>` : ''}
            </div>
            <p style="margin-top: 24px; color: #666;">Log in to your dashboard to view and respond to this lead.</p>
            <a href="https://buywiseisrael.com/developer/leads" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px;">
              View Lead
            </a>
            ${brandFooter}
          </div>
        `,
      };
    case 'project_expiring':
      return {
        subject: `Heads up: "${payload.projectName}" expires in ${payload.daysUntilExpiry} days`,
        body: `Your project "${payload.projectName}" will expire in ${payload.daysUntilExpiry} days.\n\nTo keep your project active and visible to buyers, please renew it from your dashboard.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Just a heads up</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Your project <strong>"${payload.projectName}"</strong> will expire in <strong>${payload.daysUntilExpiry} days</strong>.</p>
            <p style="color: #666; font-size: 14px;">To keep your project visible to buyers, you can renew it from your dashboard. No rush — just wanted to make sure you knew.</p>
            <a href="https://buywiseisrael.com/developer/projects" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 24px;">
              View Project
            </a>
            ${brandFooter}
          </div>
        `,
      };
    default:
      return {
        subject: 'Notification from BuyWise Israel',
        body: payload.message || 'You have a new notification.',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
            <h1 style="color: #1a1a1a; font-size: 24px;">Notification</h1>
            <p style="color: #333; font-size: 16px;">${payload.message || 'You have a new notification.'}</p>
            ${brandFooter}
          </div>
        `,
      };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const payload: NotificationPayload = await req.json();
    
    console.log("Processing developer notification:", payload.type, "for developer:", payload.developerId);

    // Fetch developer details
    const { data: developer, error: developerError } = await supabase
      .from('developers')
      .select('id, name, email, notify_email, notify_on_inquiry, notify_on_approval')
      .eq('id', payload.developerId)
      .single();

    if (developerError || !developer) {
      console.error("Developer not found:", developerError);
      return new Response(
        JSON.stringify({ error: "Developer not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check notification preferences
    if (!developer.notify_email) {
      console.log("Developer has email notifications disabled");
      return new Response(
        JSON.stringify({ message: "Email notifications disabled for this developer" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check specific notification type preferences
    if (payload.type === 'new_inquiry' && !developer.notify_on_inquiry) {
      console.log("Developer has inquiry notifications disabled");
      return new Response(
        JSON.stringify({ message: "Inquiry notifications disabled for this developer" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((payload.type === 'project_approved' || payload.type === 'project_rejected' || payload.type === 'changes_requested') && !developer.notify_on_approval) {
      console.log("Developer has approval notifications disabled");
      return new Response(
        JSON.stringify({ message: "Approval notifications disabled for this developer" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, body, html } = getNotificationContent(payload);

    // Send email using Resend
    if (resendApiKey && developer.email) {
      const resend = new Resend(resendApiKey);
      
      try {
        const emailResponse = await resend.emails.send({
          from: "BuyWise Israel <hello@buywiseisrael.com>",
          to: [developer.email],
          subject: subject,
          html: html,
          text: body,
        });
        
        console.log("Email sent successfully:", emailResponse);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    } else {
      console.log("RESEND_API_KEY not configured or no email - logging notification only");
      console.log("=== NOTIFICATION ===");
      console.log("To:", developer.email);
      console.log("Subject:", subject);
      console.log("Body:", body);
      console.log("====================");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification processed",
        recipient: developer.email,
        type: payload.type,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    console.error("Error processing notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
