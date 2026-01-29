import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SearchAlert {
  id: string;
  user_id: string;
  name: string | null;
  filters: Record<string, any>;
  listing_type: string;
  frequency: string;
  notify_email: boolean;
  last_sent_at: string | null;
  last_checked_at: string | null;
  is_active: boolean;
}

interface Property {
  id: string;
  title: string;
  city: string;
  neighborhood: string | null;
  price: number;
  bedrooms: number;
  size_sqm: number | null;
  images: string[] | null;
  created_at: string;
  listing_status: string;
  property_type: string;
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  notify_email: boolean;
  notify_search_alerts: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const frequency = url.searchParams.get("frequency") || "instant";
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the cutoff time based on frequency
    const now = new Date();
    let cutoffTime: Date;
    
    switch (frequency) {
      case "instant":
        cutoffTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
        break;
      case "daily":
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
        break;
      case "weekly":
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        break;
      default:
        cutoffTime = new Date(now.getTime() - 5 * 60 * 1000);
    }

    // Fetch active search alerts for this frequency
    const { data: alerts, error: alertError } = await supabase
      .from("search_alerts")
      .select("*")
      .eq("frequency", frequency)
      .eq("is_active", true)
      .eq("notify_email", true)
      .or(`last_checked_at.is.null,last_checked_at.lt.${cutoffTime.toISOString()}`);

    if (alertError) throw alertError;
    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No alerts to process", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get unique user IDs
    const userIds = [...new Set(alerts.map((a: SearchAlert) => a.user_id))];

    // Fetch user profiles
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, notify_email, notify_search_alerts")
      .in("id", userIds);

    if (profileError) throw profileError;

    const profileMap = new Map(profiles?.map((p: Profile) => [p.id, p]) || []);

    let emailsSent = 0;
    const processedAlertIds: string[] = [];
    const errors: string[] = [];

    for (const alert of alerts as SearchAlert[]) {
      const profile = profileMap.get(alert.user_id);
      
      // Skip if user doesn't want emails
      if (!profile || !profile.email || !profile.notify_email || !profile.notify_search_alerts) {
        processedAlertIds.push(alert.id);
        continue;
      }

      // Build the property query based on alert filters
      let query = supabase
        .from("properties")
        .select("id, title, city, neighborhood, price, bedrooms, size_sqm, images, created_at, listing_status, property_type")
        .eq("is_published", true);

      // Apply listing type filter
      if (alert.listing_type === "for_sale") {
        query = query.eq("listing_status", "for_sale");
      } else if (alert.listing_type === "for_rent") {
        query = query.eq("listing_status", "for_rent");
      }

      // Only get properties created since last check
      const lastCheck = alert.last_sent_at || cutoffTime.toISOString();
      query = query.gte("created_at", lastCheck);

      // Apply filters from the alert
      const filters = alert.filters || {};
      
      if (filters.city) {
        query = query.eq("city", filters.city);
      }
      if (filters.neighborhoods && filters.neighborhoods.length > 0) {
        query = query.in("neighborhood", filters.neighborhoods);
      }
      if (filters.property_types && filters.property_types.length > 0) {
        query = query.in("property_type", filters.property_types);
      }
      if (filters.min_price) {
        query = query.gte("price", filters.min_price);
      }
      if (filters.max_price) {
        query = query.lte("price", filters.max_price);
      }
      if (filters.min_rooms) {
        query = query.gte("bedrooms", filters.min_rooms);
      }
      if (filters.max_rooms) {
        query = query.lte("bedrooms", filters.max_rooms);
      }
      if (filters.min_size) {
        query = query.gte("size_sqm", filters.min_size);
      }
      if (filters.max_size) {
        query = query.lte("size_sqm", filters.max_size);
      }

      query = query.order("created_at", { ascending: false }).limit(10);

      const { data: matchingProperties, error: propError } = await query;

      if (propError) {
        errors.push(`Error querying for alert ${alert.id}: ${propError.message}`);
        continue;
      }

      if (!matchingProperties || matchingProperties.length === 0) {
        // No new matches, just update last_checked_at
        processedAlertIds.push(alert.id);
        continue;
      }

      // Build email content
      const alertName = alert.name || "Your Search Alert";
      const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "";

      const propertyCards = matchingProperties.map((p: Property) => {
        const formattedPrice = new Intl.NumberFormat("en-IL", {
          style: "currency",
          currency: "ILS",
          maximumFractionDigits: 0,
        }).format(p.price);

        const image = p.images?.[0] || "";
        const propertyUrl = `${baseUrl}/property/${p.id}`;

        return `
          <div style="border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
            ${image ? `<img src="${image}" alt="${p.title}" style="width: 100%; height: 150px; object-fit: cover;">` : ""}
            <div style="padding: 16px;">
              <h3 style="color: #1a1a1a; font-size: 16px; margin: 0 0 4px 0;">${p.title}</h3>
              <p style="color: #666; font-size: 14px; margin: 0 0 8px 0;">
                ${p.city}${p.neighborhood ? `, ${p.neighborhood}` : ""} • ${p.bedrooms} rooms${p.size_sqm ? ` • ${p.size_sqm} sqm` : ""}
              </p>
              <p style="font-size: 18px; font-weight: bold; color: #2563eb; margin: 0 0 12px 0;">${formattedPrice}</p>
              <a href="${propertyUrl}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px;">
                View Details
              </a>
            </div>
          </div>
        `;
      }).join("");

      try {
        await resend.emails.send({
          from: "BuyWise Israel <hello@buywiseisrael.com>",
          to: [profile.email],
          subject: `🏠 ${matchingProperties.length} New ${matchingProperties.length === 1 ? "Match" : "Matches"} for "${alertName}"`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
                <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">New Properties Match Your Search! 🏠</h1>
                <p style="color: #666; font-size: 16px; margin-bottom: 24px;">
                  Hi ${profile.full_name || "there"}, we found ${matchingProperties.length} new ${matchingProperties.length === 1 ? "property" : "properties"} matching "<strong>${alertName}</strong>".
                </p>
                
                ${propertyCards}
                
                <div style="text-align: center; margin-top: 24px;">
                  <a href="${baseUrl}/search" style="display: inline-block; background-color: #1a1a1a; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
                    View All Results
                  </a>
                </div>
                
                <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
                  You're receiving this ${frequency} alert because you set up a search alert.<br>
                  <a href="${baseUrl}/settings" style="color: #666;">Manage your alerts</a>
                </p>
              </div>
            </body>
            </html>
          `,
        });

        emailsSent++;
      } catch (emailError: any) {
        console.error("Failed to send email:", emailError);
        errors.push(`Failed to send to ${profile.email}: ${emailError.message}`);
      }

      processedAlertIds.push(alert.id);
    }

    // Update last_checked_at and last_sent_at for all processed alerts
    if (processedAlertIds.length > 0) {
      const updateData: Record<string, string> = {
        last_checked_at: new Date().toISOString(),
      };
      
      // Only update last_sent_at if emails were actually sent
      if (emailsSent > 0) {
        updateData.last_sent_at = new Date().toISOString();
      }

      await supabase
        .from("search_alerts")
        .update(updateData)
        .in("id", processedAlertIds);
    }

    return new Response(
      JSON.stringify({
        message: `Search alerts processed for frequency: ${frequency}`,
        processed: processedAlertIds.length,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing search alerts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
