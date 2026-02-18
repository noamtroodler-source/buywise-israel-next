import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;

    // Verify user is admin
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey);

    // Fetch all active plans with a non-null monthly price (skip Enterprise)
    const { data: plans, error: plansErr } = await adminClient
      .from("membership_plans")
      .select("*")
      .eq("is_active", true)
      .not("price_monthly_ils", "is", null);

    if (plansErr || !plans) {
      return new Response(JSON.stringify({ error: "Failed to fetch plans" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let createdProducts = 0;
    let createdPrices = 0;
    let skipped = 0;
    const results: object[] = [];

    for (const plan of plans) {
      let stripeProductId = plan.stripe_product_id;
      let monthlyPriceId = plan.stripe_price_monthly_id;
      let annualPriceId = plan.stripe_price_annual_id;
      let planChanged = false;

      // Create product if missing
      if (!stripeProductId) {
        const product = await stripe.products.create({
          name: `${plan.name} (${plan.entity_type})`,
          metadata: { plan_id: plan.id, entity_type: plan.entity_type },
        });
        stripeProductId = product.id;
        planChanged = true;
        createdProducts++;
      }

      // Create monthly price if missing
      if (!monthlyPriceId) {
        const price = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: Math.round(plan.price_monthly_ils * 100),
          currency: "ils",
          recurring: { interval: "month" },
          metadata: { plan_id: plan.id, billing_cycle: "monthly" },
        });
        monthlyPriceId = price.id;
        planChanged = true;
        createdPrices++;
      }

      // Create annual price if missing
      if (!annualPriceId && plan.price_annual_ils != null) {
        const price = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: Math.round(plan.price_annual_ils * 100),
          currency: "ils",
          recurring: { interval: "year" },
          metadata: { plan_id: plan.id, billing_cycle: "annual" },
        });
        annualPriceId = price.id;
        planChanged = true;
        createdPrices++;
      }

      if (!planChanged) {
        skipped++;
      }

      // Write IDs back to DB
      if (planChanged) {
        await adminClient
          .from("membership_plans")
          .update({
            stripe_product_id: stripeProductId,
            stripe_price_monthly_id: monthlyPriceId,
            stripe_price_annual_id: annualPriceId,
          })
          .eq("id", plan.id);
      }

      results.push({
        name: plan.name,
        entity_type: plan.entity_type,
        product_id: stripeProductId,
        monthly: monthlyPriceId,
        annual: annualPriceId,
        was_skipped: !planChanged,
      });
    }

    return new Response(
      JSON.stringify({
        synced: plans.length - skipped,
        created_products: createdProducts,
        created_prices: createdPrices,
        skipped,
        plans: results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("sync-stripe-plans error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
