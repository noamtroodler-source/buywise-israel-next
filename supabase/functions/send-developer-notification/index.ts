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

const getNotificationContent = (payload: NotificationPayload) => {
  switch (payload.type) {
    case 'project_approved':
      return {
        subject: `Your project "${payload.projectName}" has been approved!`,
        body: `Great news! Your project "${payload.projectName}" has been reviewed and approved. It is now live and visible to potential buyers on our platform.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #22c55e;">🎉 Project Approved!</h1>
            <p>Great news! Your project <strong>"${payload.projectName}"</strong> has been reviewed and approved.</p>
            <p>It is now live and visible to potential buyers on BuyWise Israel.</p>
            <div style="margin-top: 24px; padding: 16px; background-color: #f0fdf4; border-radius: 8px;">
              <p style="margin: 0; color: #166534;">Your project is now active and ready to receive inquiries!</p>
            </div>
            <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
              Log in to your dashboard to view performance metrics.
            </p>
          </div>
        `,
      };
    case 'project_rejected':
      return {
        subject: `Action needed: Your project "${payload.projectName}" was not approved`,
        body: `Your project "${payload.projectName}" could not be approved at this time.\n\nReason: ${payload.rejectionReason || 'Please contact support for more details.'}\n\nPlease update your project and resubmit for review.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Project Not Approved</h1>
            <p>Your project <strong>"${payload.projectName}"</strong> could not be approved at this time.</p>
            <div style="margin-top: 16px; padding: 16px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
              <p style="margin: 0; font-weight: 600;">Reason:</p>
              <p style="margin: 8px 0 0 0;">${payload.rejectionReason || 'Please contact support for more details.'}</p>
            </div>
            <p style="margin-top: 24px;">Please update your project and resubmit for review.</p>
          </div>
        `,
      };
    case 'changes_requested':
      return {
        subject: `Changes requested for "${payload.projectName}"`,
        body: `Our team has reviewed your project "${payload.projectName}" and requested some changes before it can be approved.\n\nFeedback: ${payload.message || 'Please review and update your project.'}\n\nPlease make the requested changes and resubmit.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">Changes Requested</h1>
            <p>Our team has reviewed your project <strong>"${payload.projectName}"</strong> and requested some changes before it can be approved.</p>
            <div style="margin-top: 16px; padding: 16px; background-color: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-weight: 600;">Feedback:</p>
              <p style="margin: 8px 0 0 0;">${payload.message || 'Please review and update your project.'}</p>
            </div>
            <p style="margin-top: 24px;">Please make the requested changes and resubmit for review.</p>
          </div>
        `,
      };
    case 'new_inquiry':
      return {
        subject: `New inquiry for "${payload.projectName}"`,
        body: `You have received a new inquiry for your project "${payload.projectName}".\n\nFrom: ${payload.inquirerName || 'A potential buyer'}${payload.inquirerEmail ? `\nEmail: ${payload.inquirerEmail}` : ''}\n\nLog in to your dashboard to view and respond to this lead.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6;">📩 New Lead!</h1>
            <p>You have received a new inquiry for your project <strong>"${payload.projectName}"</strong>.</p>
            <div style="margin-top: 16px; padding: 16px; background-color: #eff6ff; border-radius: 8px;">
              <p style="margin: 0;"><strong>From:</strong> ${payload.inquirerName || 'A potential buyer'}</p>
              ${payload.inquirerEmail ? `<p style="margin: 8px 0 0 0;"><strong>Email:</strong> ${payload.inquirerEmail}</p>` : ''}
            </div>
            <p style="margin-top: 24px;">Log in to your dashboard to view and respond to this lead.</p>
          </div>
        `,
      };
    case 'project_expiring':
      return {
        subject: `Your project "${payload.projectName}" is expiring soon`,
        body: `Your project "${payload.projectName}" will expire in ${payload.daysUntilExpiry} days.\n\nTo keep your project active and visible to buyers, please renew it from your dashboard.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">⏰ Project Expiring Soon</h1>
            <p>Your project <strong>"${payload.projectName}"</strong> will expire in <strong>${payload.daysUntilExpiry} days</strong>.</p>
            <p>To keep your project active and visible to buyers, please renew it from your dashboard.</p>
          </div>
        `,
      };
    default:
      return {
        subject: 'Notification from BuyWise Israel',
        body: payload.message || 'You have a new notification.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Notification</h1>
            <p>${payload.message || 'You have a new notification.'}</p>
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
