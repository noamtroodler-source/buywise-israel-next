import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type NotificationType = 
  | 'agent_joined'
  | 'agent_left'
  | 'new_lead'
  | 'join_request';

interface NotificationPayload {
  type: NotificationType;
  agencyId: string;
  agentName?: string;
  agentEmail?: string;
  leadName?: string;
  leadEmail?: string;
  propertyTitle?: string;
  message?: string;
}

const brandFooter = `
  <p style="color: #999; font-size: 12px; margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
    Questions? Just reply — we read every email.<br>
    <span style="color: #666; font-style: italic;">— Your friends at BuyWise Israel</span>
  </p>
`;

const getNotificationContent = (payload: NotificationPayload) => {
  switch (payload.type) {
    case 'agent_joined':
      return {
        subject: `${payload.agentName} joined your agency`,
        body: `${payload.agentName} has joined your agency using an invite code.\n\nEmail: ${payload.agentEmail || 'Not provided'}\n\nYou can view and manage your team from your agency dashboard.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Something good just happened</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>${payload.agentName}</strong> has joined your agency using an invite code.</p>
            <div style="margin-top: 16px; padding: 16px; background-color: #eff6ff; border-radius: 8px;">
              <p style="margin: 0; color: #333;"><strong>Name:</strong> ${payload.agentName}</p>
              ${payload.agentEmail ? `<p style="margin: 8px 0 0 0; color: #333;"><strong>Email:</strong> ${payload.agentEmail}</p>` : ''}
            </div>
            <p style="margin-top: 24px; color: #666;">You can view and manage your team from your agency dashboard.</p>
            <a href="https://buywiseisrael.com/agency/team" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px;">
              View Team
            </a>
            ${brandFooter}
          </div>
        `,
      };
    case 'agent_left':
      return {
        subject: `Just a heads up: ${payload.agentName} has left your agency`,
        body: `${payload.agentName} has left your agency.\n\nIf this was unexpected, you may want to reach out to them.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Just a heads up</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>${payload.agentName}</strong> has left your agency.</p>
            <p style="color: #666; font-size: 14px;">If this was unexpected, you may want to reach out to them.</p>
            <a href="https://buywiseisrael.com/agency/team" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px;">
              View Team
            </a>
            ${brandFooter}
          </div>
        `,
      };
    case 'new_lead':
      return {
        subject: `New inquiry for ${payload.propertyTitle || 'your agency'}`,
        body: `Your agency has received a new lead!\n\nFrom: ${payload.leadName || 'A potential buyer'}${payload.leadEmail ? `\nEmail: ${payload.leadEmail}` : ''}${payload.propertyTitle ? `\nProperty: ${payload.propertyTitle}` : ''}\n\nLog in to your dashboard to assign this lead to an agent.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">New inquiry received</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Your agency has received a new inquiry.</p>
            <div style="margin-top: 16px; padding: 16px; background-color: #eff6ff; border-radius: 8px;">
              <p style="margin: 0; color: #333;"><strong>From:</strong> ${payload.leadName || 'A potential buyer'}</p>
              ${payload.leadEmail ? `<p style="margin: 8px 0 0 0; color: #333;"><strong>Email:</strong> ${payload.leadEmail}</p>` : ''}
              ${payload.propertyTitle ? `<p style="margin: 8px 0 0 0; color: #333;"><strong>Property:</strong> ${payload.propertyTitle}</p>` : ''}
            </div>
            <p style="margin-top: 24px; color: #666;">Log in to your dashboard to assign this lead to an agent.</p>
            <a href="https://buywiseisrael.com/agency/leads" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px;">
              View Leads
            </a>
            ${brandFooter}
          </div>
        `,
      };
    case 'join_request':
      return {
        subject: `${payload.agentName} wants to join your agency`,
        body: `${payload.agentName} has requested to join your agency.\n\nEmail: ${payload.agentEmail || 'Not provided'}${payload.message ? `\nMessage: ${payload.message}` : ''}\n\nLog in to your dashboard to approve or decline this request.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Someone wants to join your team</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>${payload.agentName}</strong> has requested to join your agency.</p>
            <div style="margin-top: 16px; padding: 16px; background-color: #eff6ff; border-radius: 8px;">
              <p style="margin: 0; color: #333;"><strong>Name:</strong> ${payload.agentName}</p>
              ${payload.agentEmail ? `<p style="margin: 8px 0 0 0; color: #333;"><strong>Email:</strong> ${payload.agentEmail}</p>` : ''}
              ${payload.message ? `<p style="margin: 8px 0 0 0; color: #333;"><strong>Message:</strong> ${payload.message}</p>` : ''}
            </div>
            <p style="margin-top: 24px; color: #666;">Log in to your dashboard to approve or decline this request.</p>
            <a href="https://buywiseisrael.com/agency/requests" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px;">
              View Requests
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
    
    console.log("Processing agency notification:", payload.type, "for agency:", payload.agencyId);

    // Fetch agency details
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, name, email, notify_email, notify_on_join_request, notify_on_lead')
      .eq('id', payload.agencyId)
      .single();

    if (agencyError || !agency) {
      console.error("Agency not found:", agencyError);
      return new Response(
        JSON.stringify({ error: "Agency not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check notification preferences
    if (!agency.notify_email) {
      console.log("Agency has email notifications disabled");
      return new Response(
        JSON.stringify({ message: "Email notifications disabled for this agency" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check specific notification type preferences
    if ((payload.type === 'agent_joined' || payload.type === 'join_request') && !agency.notify_on_join_request) {
      console.log("Agency has join request notifications disabled");
      return new Response(
        JSON.stringify({ message: "Join request notifications disabled for this agency" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payload.type === 'new_lead' && !agency.notify_on_lead) {
      console.log("Agency has lead notifications disabled");
      return new Response(
        JSON.stringify({ message: "Lead notifications disabled for this agency" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, body, html } = getNotificationContent(payload);

    // Send email using Resend
    if (resendApiKey && agency.email) {
      const resend = new Resend(resendApiKey);
      
      try {
        const emailResponse = await resend.emails.send({
          from: "BuyWise Israel <hello@buywiseisrael.com>",
          to: [agency.email],
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
      console.log("To:", agency.email);
      console.log("Subject:", subject);
      console.log("Body:", body);
      console.log("====================");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification processed",
        recipient: agency.email,
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
