import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotificationType = 
  | 'listing_approved'
  | 'listing_rejected'
  | 'changes_requested'
  | 'new_inquiry'
  | 'listing_expiring';

interface NotificationPayload {
  type: NotificationType;
  agentId: string;
  propertyId?: string;
  propertyTitle?: string;
  message?: string;
  inquirerName?: string;
  inquirerEmail?: string;
  inquiryType?: string;
  rejectionReason?: string;
  daysUntilExpiry?: number;
}

const getNotificationContent = (payload: NotificationPayload) => {
  switch (payload.type) {
    case 'listing_approved':
      return {
        subject: `Your listing "${payload.propertyTitle}" has been approved!`,
        body: `Great news! Your property listing "${payload.propertyTitle}" has been reviewed and approved. It is now live and visible to potential buyers on our platform.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #22c55e;">🎉 Listing Approved!</h1>
            <p>Great news! Your property listing <strong>"${payload.propertyTitle}"</strong> has been reviewed and approved.</p>
            <p>It is now live and visible to potential buyers on BuyWise Israel.</p>
            <div style="margin-top: 24px; padding: 16px; background-color: #f0fdf4; border-radius: 8px;">
              <p style="margin: 0; color: #166534;">Your listing is now active and ready to receive inquiries!</p>
            </div>
            <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
              Log in to your dashboard to view performance metrics.
            </p>
          </div>
        `,
      };
    case 'listing_rejected':
      return {
        subject: `Action needed: Your listing "${payload.propertyTitle}" was not approved`,
        body: `Your property listing "${payload.propertyTitle}" could not be approved at this time.\n\nReason: ${payload.rejectionReason || 'Please contact support for more details.'}\n\nPlease update your listing and resubmit for review.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Listing Not Approved</h1>
            <p>Your property listing <strong>"${payload.propertyTitle}"</strong> could not be approved at this time.</p>
            <div style="margin-top: 16px; padding: 16px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
              <p style="margin: 0; font-weight: 600;">Reason:</p>
              <p style="margin: 8px 0 0 0;">${payload.rejectionReason || 'Please contact support for more details.'}</p>
            </div>
            <p style="margin-top: 24px;">Please update your listing and resubmit for review.</p>
          </div>
        `,
      };
    case 'changes_requested':
      return {
        subject: `Changes requested for "${payload.propertyTitle}"`,
        body: `Our team has reviewed your listing "${payload.propertyTitle}" and requested some changes before it can be approved.\n\nFeedback: ${payload.message || 'Please review and update your listing.'}\n\nPlease make the requested changes and resubmit.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">Changes Requested</h1>
            <p>Our team has reviewed your listing <strong>"${payload.propertyTitle}"</strong> and requested some changes before it can be approved.</p>
            <div style="margin-top: 16px; padding: 16px; background-color: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-weight: 600;">Feedback:</p>
              <p style="margin: 8px 0 0 0;">${payload.message || 'Please review and update your listing.'}</p>
            </div>
            <p style="margin-top: 24px;">Please make the requested changes and resubmit for review.</p>
          </div>
        `,
      };
    case 'new_inquiry':
      return {
        subject: `New inquiry for "${payload.propertyTitle}"`,
        body: `You have received a new ${payload.inquiryType || 'inquiry'} for your property "${payload.propertyTitle}".\n\nFrom: ${payload.inquirerName || 'A potential buyer'}${payload.inquirerEmail ? `\nEmail: ${payload.inquirerEmail}` : ''}\n\nLog in to your dashboard to view and respond to this lead.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6;">📩 New Lead!</h1>
            <p>You have received a new <strong>${payload.inquiryType || 'inquiry'}</strong> for your property <strong>"${payload.propertyTitle}"</strong>.</p>
            <div style="margin-top: 16px; padding: 16px; background-color: #eff6ff; border-radius: 8px;">
              <p style="margin: 0;"><strong>From:</strong> ${payload.inquirerName || 'A potential buyer'}</p>
              ${payload.inquirerEmail ? `<p style="margin: 8px 0 0 0;"><strong>Email:</strong> ${payload.inquirerEmail}</p>` : ''}
            </div>
            <p style="margin-top: 24px;">Log in to your dashboard to view and respond to this lead.</p>
          </div>
        `,
      };
    case 'listing_expiring':
      return {
        subject: `Your listing "${payload.propertyTitle}" is expiring soon`,
        body: `Your property listing "${payload.propertyTitle}" will expire in ${payload.daysUntilExpiry} days.\n\nTo keep your listing active and visible to buyers, please renew it from your dashboard.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">⏰ Listing Expiring Soon</h1>
            <p>Your property listing <strong>"${payload.propertyTitle}"</strong> will expire in <strong>${payload.daysUntilExpiry} days</strong>.</p>
            <p>To keep your listing active and visible to buyers, please renew it from your dashboard.</p>
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const payload: NotificationPayload = await req.json();
    
    console.log("Processing notification:", payload.type, "for agent:", payload.agentId);

    // Fetch agent details
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, email, notify_email, notify_on_inquiry, notify_on_approval')
      .eq('id', payload.agentId)
      .single();

    if (agentError || !agent) {
      console.error("Agent not found:", agentError);
      return new Response(
        JSON.stringify({ error: "Agent not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check notification preferences
    if (!agent.notify_email) {
      console.log("Agent has email notifications disabled");
      return new Response(
        JSON.stringify({ message: "Email notifications disabled for this agent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check specific notification type preferences
    if (payload.type === 'new_inquiry' && !agent.notify_on_inquiry) {
      console.log("Agent has inquiry notifications disabled");
      return new Response(
        JSON.stringify({ message: "Inquiry notifications disabled for this agent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((payload.type === 'listing_approved' || payload.type === 'listing_rejected' || payload.type === 'changes_requested') && !agent.notify_on_approval) {
      console.log("Agent has approval notifications disabled");
      return new Response(
        JSON.stringify({ message: "Approval notifications disabled for this agent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, body, html } = getNotificationContent(payload);

    // Send email using Resend
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      try {
        const emailResponse = await resend.emails.send({
          from: "BuyWise Israel <notifications@resend.dev>",
          to: [agent.email],
          subject: subject,
          html: html,
          text: body,
        });
        
        console.log("Email sent successfully:", emailResponse);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // Don't fail the whole request if email fails
      }
    } else {
      console.log("RESEND_API_KEY not configured - logging notification only");
      console.log("=== NOTIFICATION ===");
      console.log("To:", agent.email);
      console.log("Subject:", subject);
      console.log("Body:", body);
      console.log("====================");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification processed",
        recipient: agent.email,
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
