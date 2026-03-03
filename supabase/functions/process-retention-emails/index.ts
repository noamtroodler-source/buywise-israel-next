import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Guide progression map — slug-based
const GUIDE_PROGRESSION: Record<string, { slug: string; title: string }> = {
  "buying-in-israel": { slug: "purchase-tax", title: "Purchase Tax Guide" },
  "purchase-tax": { slug: "true-cost", title: "The True Cost of Buying" },
  "true-cost": { slug: "talking-to-professionals", title: "What to Know Before Talking to an Agent, Lawyer, or Broker" },
  "talking-to-professionals": { slug: "mortgages", title: "Mortgages in Israel for Foreign Buyers" },
  "mortgages": { slug: "new-vs-resale", title: "New Construction vs Resale in Israel" },
  "new-vs-resale": { slug: "rent-vs-buy", title: "Rent vs Buy in Israel" },
  "rent-vs-buy": { slug: "buying-in-israel", title: "Complete Guide to Buying in Israel" },
};

const brandFooter = `
  <p style="color: #999; font-size: 12px; margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
    Questions? Just reply — we read every email.<br>
    <span style="color: #666; font-style: italic;">— Your friends at BuyWise Israel</span>
  </p>
  <p style="color: #bbb; font-size: 11px; text-align: center; margin-top: 8px;">
    Don't want these emails? <a href="https://buywiseisrael.com/settings" style="color: #bbb;">Update your preferences</a>
  </p>
`;

function formatPrice(price: number, currency: string): string {
  if (currency === "USD") return `$${price.toLocaleString("en-US")}`;
  return `₪${price.toLocaleString("en-IL")}`;
}

function buildDormantSaverEmail(
  userName: string,
  city: string,
  properties: Array<{ id: string; title: string; price: number; currency: string; bedrooms: number; size_sqm: number | null; images: string[] | null }>
): { subject: string; html: string } {
  const count = properties.length;
  const subject = `${count} new listing${count > 1 ? "s" : ""} in ${city} this week`;

  const listingsHtml = properties
    .map((p) => {
      const img = p.images?.[0];
      const imgTag = img
        ? `<img src="${img}" alt="${p.title}" style="width: 100%; max-height: 180px; object-fit: cover; border-radius: 8px 8px 0 0;" />`
        : "";
      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 16px; overflow: hidden;">
          ${imgTag}
          <div style="padding: 16px;">
            <h3 style="margin: 0 0 4px; font-size: 16px; color: #1a1a1a;">${p.title}</h3>
            <p style="margin: 0 0 4px; font-size: 18px; font-weight: 600; color: #2563eb;">${formatPrice(p.price, p.currency)}</p>
            <p style="margin: 0; font-size: 14px; color: #666;">${p.bedrooms} rooms${p.size_sqm ? ` · ${p.size_sqm} m²` : ""}</p>
            <a href="https://buywiseisrael.com/property/${p.id}" style="display: inline-block; margin-top: 12px; padding: 8px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">View Listing</a>
          </div>
        </div>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
          <h1 style="color: #1a1a1a; font-size: 22px; margin-bottom: 8px;">Hey${userName ? " " + userName : ""},</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            We noticed some new properties just hit the market in ${city} that match what you've been looking at. Thought you'd want to see them before they get snapped up.
          </p>
          ${listingsHtml}
          <a href="https://buywiseisrael.com/search?city=${encodeURIComponent(city)}" style="display: block; text-align: center; margin-top: 24px; padding: 12px 24px; background: #f3f4f6; color: #2563eb; text-decoration: none; border-radius: 6px; font-size: 14px;">See all listings in ${city} →</a>
          ${brandFooter}
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}

function buildGuideStalledEmail(
  userName: string,
  lastGuideTitle: string,
  nextGuide: { slug: string; title: string }
): { subject: string; html: string } {
  const subject = `People who read our ${lastGuideTitle.toLowerCase().includes("guide") ? lastGuideTitle : lastGuideTitle + " guide"} found this useful`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
          <h1 style="color: #1a1a1a; font-size: 22px; margin-bottom: 8px;">Hey${userName ? " " + userName : ""},</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            We saw you were reading our <strong>${lastGuideTitle}</strong> — great stuff. A lot of people at the same stage found this guide really helpful as a next step:
          </p>
          <div style="background: #f0f7ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 0 8px 8px 0; margin: 24px 0;">
            <h2 style="margin: 0 0 8px; font-size: 18px; color: #1a1a1a;">${nextGuide.title}</h2>
            <p style="margin: 0 0 12px; font-size: 14px; color: #666;">The natural next step in your Israel property journey.</p>
            <a href="https://buywiseisrael.com/guides/${nextGuide.slug}" style="display: inline-block; padding: 10px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">Read the Guide →</a>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 24px;">
            No rush — it'll be there whenever you're ready. And if you have questions about anything you've read so far, just hit reply. We're always happy to help.
          </p>
          ${brandFooter}
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}

// Guide slug-to-title mapping
const GUIDE_TITLES: Record<string, string> = {
  "buying-in-israel": "Complete Guide to Buying in Israel",
  "purchase-tax": "Purchase Tax Guide",
  "true-cost": "The True Cost of Buying",
  "talking-to-professionals": "What to Know Before Talking to an Agent, Lawyer, or Broker",
  "mortgages": "Mortgages in Israel for Foreign Buyers",
  "new-vs-resale": "New Construction vs Resale in Israel",
  "rent-vs-buy": "Rent vs Buy in Israel",
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

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const results = { dormant_saver: 0, guide_stalled: 0, errors: [] as string[] };

    // ─── TRIGGER 1: Dormant Saver ──────────────────────────────────────
    console.log("Processing dormant saver trigger...");

    // Find users with favorites who've been inactive 14-21 days and have buyer profiles
    const { data: dormantUsers, error: dormantErr } = await supabase
      .from("profiles")
      .select("id, email, full_name, last_active_at")
      .lt("last_active_at", fourteenDaysAgo)
      .gt("last_active_at", twentyOneDaysAgo)
      .eq("notify_recommendations", true)
      .not("email", "is", null);

    if (dormantErr) {
      console.error("Error fetching dormant users:", dormantErr);
      results.errors.push(`dormant query: ${dormantErr.message}`);
    }

    if (dormantUsers && dormantUsers.length > 0) {
      console.log(`Found ${dormantUsers.length} potentially dormant users`);

      for (const user of dormantUsers) {
        try {
          // Check 30-day cooldown
          const { data: recentEmail } = await supabase
            .from("retention_emails_log")
            .select("id")
            .eq("user_id", user.id)
            .eq("trigger_type", "dormant_saver")
            .gt("created_at", thirtyDaysAgo)
            .limit(1);

          if (recentEmail && recentEmail.length > 0) continue;

          // Check if user has favorites
          const { data: favorites } = await supabase
            .from("favorites")
            .select("property_id")
            .eq("user_id", user.id)
            .limit(1);

          if (!favorites || favorites.length === 0) continue;

          // Get buyer profile for target cities
          const { data: buyerProfile } = await supabase
            .from("buyer_profiles")
            .select("target_cities, budget_min, budget_max")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

          const targetCities = buyerProfile?.target_cities;
          if (!targetCities || targetCities.length === 0) continue;

          const city = targetCities[0]; // Use first target city

          // Fetch recent matching properties
          let query = supabase
            .from("properties")
            .select("id, title, price, currency, bedrooms, size_sqm, images")
            .eq("city", city)
            .eq("is_published", true)
            .in("listing_status", ["for_sale", "for_rent"])
            .order("created_at", { ascending: false })
            .limit(3);

          if (buyerProfile?.budget_min) {
            query = query.gte("price", buyerProfile.budget_min);
          }
          if (buyerProfile?.budget_max) {
            query = query.lte("price", buyerProfile.budget_max);
          }

          const { data: properties } = await query;

          if (!properties || properties.length === 0) continue;

          const { subject, html } = buildDormantSaverEmail(
            user.full_name?.split(" ")[0] || "",
            city,
            properties
          );

          await resend.emails.send({
            from: "BuyWise Israel <hello@buywiseisrael.com>",
            to: [user.email!],
            subject,
            html,
          });

          // Log the send
          await supabase.from("retention_emails_log").insert({
            user_id: user.id,
            trigger_type: "dormant_saver",
            email_sent_to: user.email!,
            metadata: {
              city,
              property_ids: properties.map((p) => p.id),
            },
          });

          results.dormant_saver++;
          console.log(`Sent dormant_saver email to ${user.email}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`Error processing dormant user ${user.id}:`, msg);
          results.errors.push(`dormant_saver ${user.id}: ${msg}`);
        }
      }
    }

    // ─── TRIGGER 2: Guide Stalled ──────────────────────────────────────
    console.log("Processing guide stalled trigger...");

    // Find users with 2+ guide visits whose most recent was 10-21 days ago
    const { data: guideVisits, error: guideVisitsErr } = await supabase
      .from("content_visits")
      .select("user_id, content_path, last_visited_at")
      .eq("content_type", "guide")
      .lt("last_visited_at", tenDaysAgo)
      .gt("last_visited_at", twentyOneDaysAgo);

    if (guideVisitsErr) {
      console.error("Error fetching guide visits:", guideVisitsErr);
      results.errors.push(`guide query: ${guideVisitsErr.message}`);
    }

    if (guideVisits && guideVisits.length > 0) {
      // Group by user
      const userGuideMap = new Map<string, Array<{ path: string; visitedAt: string }>>();
      for (const v of guideVisits) {
        const entries = userGuideMap.get(v.user_id) || [];
        entries.push({ path: v.content_path, visitedAt: v.last_visited_at });
        userGuideMap.set(v.user_id, entries);
      }

      for (const [userId, visits] of userGuideMap.entries()) {
        // Need 2+ guide visits total (not just in the window)
        const { count: totalGuideVisits } = await supabase
          .from("content_visits")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("content_type", "guide");

        if ((totalGuideVisits || 0) < 2) continue;

        try {
          // Check 30-day cooldown
          const { data: recentEmail } = await supabase
            .from("retention_emails_log")
            .select("id")
            .eq("user_id", userId)
            .gt("created_at", thirtyDaysAgo)
            .limit(1);

          if (recentEmail && recentEmail.length > 0) continue;

          // Get user profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name, notify_recommendations")
            .eq("id", userId)
            .maybeSingle();

          if (!profile?.email || !profile.notify_recommendations) continue;

          // Find most recent guide visited — extract slug from path
          const sorted = visits.sort(
            (a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime()
          );
          const lastPath = sorted[0].path;

          // Extract guide slug from path like /guides/buying-in-israel or /guides/buying-in-israel/chapter-1
          const guideSlugMatch = lastPath.match(/\/guides\/([^/]+)/);
          if (!guideSlugMatch) continue;

          const guideSlug = guideSlugMatch[1];
          const nextGuide = GUIDE_PROGRESSION[guideSlug];
          if (!nextGuide) continue;

          const lastGuideTitle = GUIDE_TITLES[guideSlug] || guideSlug;

          const { subject, html } = buildGuideStalledEmail(
            profile.full_name?.split(" ")[0] || "",
            lastGuideTitle,
            nextGuide
          );

          await resend.emails.send({
            from: "BuyWise Israel <hello@buywiseisrael.com>",
            to: [profile.email],
            subject,
            html,
          });

          await supabase.from("retention_emails_log").insert({
            user_id: userId,
            trigger_type: "guide_stalled",
            email_sent_to: profile.email,
            metadata: {
              last_guide: guideSlug,
              next_guide: nextGuide.slug,
            },
          });

          results.guide_stalled++;
          console.log(`Sent guide_stalled email to ${profile.email}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`Error processing guide user ${userId}:`, msg);
          results.errors.push(`guide_stalled ${userId}: ${msg}`);
        }
      }
    }

    console.log("Retention email processing complete:", results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Fatal error in process-retention-emails:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
