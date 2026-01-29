import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AgentStats {
  totalViews: number;
  totalInquiries: number;
  activeListings: number;
  newInquiriesThisWeek: number;
}

interface DeveloperStats {
  totalViews: number;
  totalInquiries: number;
  activeProjects: number;
  newInquiriesThisWeek: number;
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

const generateAgentDigestHtml = (name: string, stats: AgentStats): string => {
  const firstName = name.split(' ')[0];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">📊 Your Weekly Performance Report</h1>
        <p style="color: #666; font-size: 16px; margin-bottom: 24px;">
          Hi ${firstName}, here's how your listings performed this week.
        </p>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; text-align: center;">
            <p style="color: #3b82f6; font-size: 32px; font-weight: bold; margin: 0;">${formatNumber(stats.totalViews)}</p>
            <p style="color: #666; font-size: 14px; margin: 4px 0 0 0;">Total Views</p>
          </div>
          <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center;">
            <p style="color: #22c55e; font-size: 32px; font-weight: bold; margin: 0;">${formatNumber(stats.newInquiriesThisWeek)}</p>
            <p style="color: #666; font-size: 14px; margin: 4px 0 0 0;">New Inquiries</p>
          </div>
          <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; text-align: center;">
            <p style="color: #f59e0b; font-size: 32px; font-weight: bold; margin: 0;">${formatNumber(stats.activeListings)}</p>
            <p style="color: #666; font-size: 14px; margin: 4px 0 0 0;">Active Listings</p>
          </div>
          <div style="background-color: #fce7f3; border-radius: 12px; padding: 20px; text-align: center;">
            <p style="color: #ec4899; font-size: 32px; font-weight: bold; margin: 0;">${formatNumber(stats.totalInquiries)}</p>
            <p style="color: #666; font-size: 14px; margin: 4px 0 0 0;">Total Inquiries</p>
          </div>
        </div>
        
        <a href="https://buywiseisrael.com/agent" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View Full Dashboard
        </a>
        
        <p style="color: #999; font-size: 12px; margin-top: 40px; text-align: center;">
          You're receiving this weekly digest because you have active listings on BuyWise Israel.<br>
          <a href="https://buywiseisrael.com/agent/settings" style="color: #666;">Manage notification preferences</a>
        </p>
      </div>
    </body>
    </html>
  `;
};

const generateDeveloperDigestHtml = (name: string, stats: DeveloperStats): string => {
  const firstName = name.split(' ')[0];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">📊 Your Weekly Project Report</h1>
        <p style="color: #666; font-size: 16px; margin-bottom: 24px;">
          Hi ${firstName}, here's how your projects performed this week.
        </p>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; text-align: center;">
            <p style="color: #3b82f6; font-size: 32px; font-weight: bold; margin: 0;">${formatNumber(stats.totalViews)}</p>
            <p style="color: #666; font-size: 14px; margin: 4px 0 0 0;">Total Views</p>
          </div>
          <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center;">
            <p style="color: #22c55e; font-size: 32px; font-weight: bold; margin: 0;">${formatNumber(stats.newInquiriesThisWeek)}</p>
            <p style="color: #666; font-size: 14px; margin: 4px 0 0 0;">New Inquiries</p>
          </div>
          <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; text-align: center;">
            <p style="color: #f59e0b; font-size: 32px; font-weight: bold; margin: 0;">${formatNumber(stats.activeProjects)}</p>
            <p style="color: #666; font-size: 14px; margin: 4px 0 0 0;">Active Projects</p>
          </div>
          <div style="background-color: #fce7f3; border-radius: 12px; padding: 20px; text-align: center;">
            <p style="color: #ec4899; font-size: 32px; font-weight: bold; margin: 0;">${formatNumber(stats.totalInquiries)}</p>
            <p style="color: #666; font-size: 14px; margin: 4px 0 0 0;">Total Inquiries</p>
          </div>
        </div>
        
        <a href="https://buywiseisrael.com/developer" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View Full Dashboard
        </a>
        
        <p style="color: #999; font-size: 12px; margin-top: 40px; text-align: center;">
          You're receiving this weekly digest because you have active projects on BuyWise Israel.<br>
          <a href="https://buywiseisrael.com/developer/settings" style="color: #666;">Manage notification preferences</a>
        </p>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    let emailsSent = 0;
    const errors: string[] = [];

    // Process agents
    const { data: agents, error: agentError } = await supabase
      .from('agents')
      .select('id, name, email, notify_email')
      .eq('status', 'active')
      .eq('notify_email', true)
      .not('email', 'is', null);

    if (agentError) {
      console.error("Error fetching agents:", agentError);
    } else if (agents && agents.length > 0) {
      for (const agent of agents) {
        try {
          // Get agent stats
          const [propertiesResult, inquiriesResult, weeklyInquiriesResult] = await Promise.all([
            supabase
              .from('properties')
              .select('id, views_count')
              .eq('agent_id', agent.id)
              .eq('is_published', true),
            supabase
              .from('inquiries')
              .select('id', { count: 'exact', head: true })
              .eq('agent_id', agent.id),
            supabase
              .from('inquiries')
              .select('id', { count: 'exact', head: true })
              .eq('agent_id', agent.id)
              .gte('created_at', oneWeekAgo),
          ]);

          const properties = propertiesResult.data || [];
          const totalViews = properties.reduce((sum, p) => sum + (p.views_count || 0), 0);
          
          const stats: AgentStats = {
            totalViews,
            totalInquiries: inquiriesResult.count || 0,
            activeListings: properties.length,
            newInquiriesThisWeek: weeklyInquiriesResult.count || 0,
          };

          // Only send if there's some activity
          if (stats.activeListings > 0 || stats.totalInquiries > 0) {
            const html = generateAgentDigestHtml(agent.name, stats);
            
            await resend.emails.send({
              from: "BuyWise Israel <hello@buywiseisrael.com>",
              to: [agent.email!],
              subject: `📊 Your Weekly Report: ${stats.newInquiriesThisWeek} new inquiries, ${formatNumber(stats.totalViews)} views`,
              html,
            });
            
            emailsSent++;
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`Agent ${agent.id}: ${errorMsg}`);
        }
      }
    }

    // Process developers
    const { data: developers, error: devError } = await supabase
      .from('developers')
      .select('id, name, email, notify_email')
      .eq('status', 'active')
      .eq('notify_email', true)
      .not('email', 'is', null);

    if (devError) {
      console.error("Error fetching developers:", devError);
    } else if (developers && developers.length > 0) {
      for (const developer of developers) {
        try {
          // Get developer stats
          const [projectsResult, inquiriesResult, weeklyInquiriesResult] = await Promise.all([
            supabase
              .from('projects')
              .select('id, views_count')
              .eq('developer_id', developer.id)
              .eq('is_published', true),
            supabase
              .from('project_inquiries')
              .select('id', { count: 'exact', head: true })
              .eq('developer_id', developer.id),
            supabase
              .from('project_inquiries')
              .select('id', { count: 'exact', head: true })
              .eq('developer_id', developer.id)
              .gte('created_at', oneWeekAgo),
          ]);

          const projects = projectsResult.data || [];
          const totalViews = projects.reduce((sum, p) => sum + (p.views_count || 0), 0);
          
          const stats: DeveloperStats = {
            totalViews,
            totalInquiries: inquiriesResult.count || 0,
            activeProjects: projects.length,
            newInquiriesThisWeek: weeklyInquiriesResult.count || 0,
          };

          // Only send if there's some activity
          if (stats.activeProjects > 0 || stats.totalInquiries > 0) {
            const html = generateDeveloperDigestHtml(developer.name, stats);
            
            await resend.emails.send({
              from: "BuyWise Israel <hello@buywiseisrael.com>",
              to: [developer.email!],
              subject: `📊 Your Weekly Report: ${stats.newInquiriesThisWeek} new inquiries, ${formatNumber(stats.totalViews)} views`,
              html,
            });
            
            emailsSent++;
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`Developer ${developer.id}: ${errorMsg}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Weekly digest emails processed",
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    console.error("Error processing digest emails:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
