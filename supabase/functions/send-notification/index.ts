import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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
      };
    case 'listing_rejected':
      return {
        subject: `Action needed: Your listing "${payload.propertyTitle}" was not approved`,
        body: `Your property listing "${payload.propertyTitle}" could not be approved at this time.\n\nReason: ${payload.rejectionReason || 'Please contact support for more details.'}\n\nPlease update your listing and resubmit for review.`,
      };
    case 'changes_requested':
      return {
        subject: `Changes requested for "${payload.propertyTitle}"`,
        body: `Our team has reviewed your listing "${payload.propertyTitle}" and requested some changes before it can be approved.\n\nFeedback: ${payload.message || 'Please review and update your listing.'}\n\nPlease make the requested changes and resubmit.`,
      };
    case 'new_inquiry':
      return {
        subject: `New inquiry for "${payload.propertyTitle}"`,
        body: `You have received a new ${payload.inquiryType || 'inquiry'} for your property "${payload.propertyTitle}".\n\nFrom: ${payload.inquirerName || 'A potential buyer'}${payload.inquirerEmail ? `\nEmail: ${payload.inquirerEmail}` : ''}\n\nLog in to your dashboard to view and respond to this lead.`,
      };
    case 'listing_expiring':
      return {
        subject: `Your listing "${payload.propertyTitle}" is expiring soon`,
        body: `Your property listing "${payload.propertyTitle}" will expire in ${payload.daysUntilExpiry} days.\n\nTo keep your listing active and visible to buyers, please renew it from your dashboard.`,
      };
    default:
      return {
        subject: 'Notification from BuyWise Israel',
        body: payload.message || 'You have a new notification.',
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

    if ((payload.type === 'listing_approved' || payload.type === 'listing_rejected') && !agent.notify_on_approval) {
      console.log("Agent has approval notifications disabled");
      return new Response(
        JSON.stringify({ message: "Approval notifications disabled for this agent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, body } = getNotificationContent(payload);

    // Log the notification (in production, integrate with email service like Resend)
    console.log("=== NOTIFICATION ===");
    console.log("To:", agent.email);
    console.log("Subject:", subject);
    console.log("Body:", body);
    console.log("====================");

    // For now, we'll store the notification in a log
    // In production, you would integrate with Resend or another email service
    // Example with Resend (uncomment when RESEND_API_KEY is configured):
    /*
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: "BuyWise Israel <notifications@buywise.co.il>",
        to: [agent.email],
        subject: subject,
        text: body,
      });
    }
    */

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
