import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PriceDropNotification {
  id: string;
  user_id: string;
  property_id: string;
  previous_price: number;
  new_price: number;
  drop_percent: number;
  created_at: string;
}

interface Property {
  id: string;
  title: string;
  city: string;
  neighborhood: string | null;
  images: string[] | null;
  bedrooms: number;
  size_sqm: number | null;
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  notify_email: boolean;
  notify_price_drops: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch unprocessed price drop notifications (email_sent_at is null)
    const { data: notifications, error: notifError } = await supabase
      .from("price_drop_notifications")
      .select("*")
      .is("email_sent_at", null)
      .order("created_at", { ascending: true })
      .limit(50);

    if (notifError) throw notifError;
    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending notifications", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get unique user IDs and property IDs
    const userIds = [...new Set(notifications.map((n: PriceDropNotification) => n.user_id))];
    const propertyIds = [...new Set(notifications.map((n: PriceDropNotification) => n.property_id))];

    // Fetch user profiles with email preferences
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, notify_email, notify_price_drops")
      .in("id", userIds);

    if (profileError) throw profileError;

    // Fetch property details
    const { data: properties, error: propError } = await supabase
      .from("properties")
      .select("id, title, city, neighborhood, images, bedrooms, size_sqm")
      .in("id", propertyIds);

    if (propError) throw propError;

    const profileMap = new Map(profiles?.map((p: Profile) => [p.id, p]) || []);
    const propertyMap = new Map(properties?.map((p: Property) => [p.id, p]) || []);

    let emailsSent = 0;
    const processedIds: string[] = [];
    const errors: string[] = [];

    for (const notification of notifications as PriceDropNotification[]) {
      const profile = profileMap.get(notification.user_id);
      const property = propertyMap.get(notification.property_id);

      // Skip if user doesn't want email notifications
      if (!profile || !profile.email || !profile.notify_email || !profile.notify_price_drops) {
        processedIds.push(notification.id);
        continue;
      }

      if (!property) {
        processedIds.push(notification.id);
        continue;
      }

      const savings = notification.previous_price - notification.new_price;
      const formattedSavings = new Intl.NumberFormat("en-IL", {
        style: "currency",
        currency: "ILS",
        maximumFractionDigits: 0,
      }).format(savings);

      const formattedNewPrice = new Intl.NumberFormat("en-IL", {
        style: "currency",
        currency: "ILS",
        maximumFractionDigits: 0,
      }).format(notification.new_price);

      const propertyImage = property.images?.[0] || "";
      const propertyUrl = `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/property/${property.id}`;

      try {
        await resend.emails.send({
          from: "BuyWise Israel <notifications@resend.dev>",
          to: [profile.email],
          subject: `🔔 Price Drop: ${property.title} is now ${formattedNewPrice}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
                <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">Price Drop Alert! 📉</h1>
                <p style="color: #666; font-size: 16px; margin-bottom: 24px;">
                  Hi ${profile.full_name || "there"}, a property you saved just dropped in price.
                </p>
                
                <div style="border: 1px solid #e5e5e5; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                  ${propertyImage ? `<img src="${propertyImage}" alt="${property.title}" style="width: 100%; height: 200px; object-fit: cover;">` : ""}
                  <div style="padding: 20px;">
                    <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 8px 0;">${property.title}</h2>
                    <p style="color: #666; font-size: 14px; margin: 0 0 16px 0;">
                      ${property.city}${property.neighborhood ? `, ${property.neighborhood}` : ""} • ${property.bedrooms} rooms${property.size_sqm ? ` • ${property.size_sqm} sqm` : ""}
                    </p>
                    
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                      <span style="font-size: 24px; font-weight: bold; color: #16a34a;">${formattedNewPrice}</span>
                      <span style="font-size: 16px; color: #999; text-decoration: line-through;">${new Intl.NumberFormat("en-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(notification.previous_price)}</span>
                    </div>
                    
                    <div style="background-color: #f0fdf4; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                      <p style="color: #16a34a; font-size: 14px; font-weight: 600; margin: 0;">
                        You save ${formattedSavings} (${notification.drop_percent}% off)
                      </p>
                    </div>
                    
                    <a href="${propertyUrl}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
                      View Property
                    </a>
                  </div>
                </div>
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                  You're receiving this because you enabled price alerts for this property.<br>
                  <a href="#" style="color: #666;">Manage notification preferences</a>
                </p>
              </div>
            </body>
            </html>
          `,
        });

        emailsSent++;
        processedIds.push(notification.id);
      } catch (emailError: any) {
        console.error("Failed to send email:", emailError);
        errors.push(`Failed to send to ${profile.email}: ${emailError.message}`);
      }
    }

    // Mark all processed notifications as sent
    if (processedIds.length > 0) {
      await supabase
        .from("price_drop_notifications")
        .update({ email_sent_at: new Date().toISOString() })
        .in("id", processedIds);
    }

    return new Response(
      JSON.stringify({
        message: "Price drop alerts processed",
        processed: processedIds.length,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing price drop alerts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
