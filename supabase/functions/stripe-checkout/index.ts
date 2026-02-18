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
    // Auth
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

    // Verify user
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
    const userEmail = claimsData.claims.email as string;

    const { plan_id, billing_cycle, promo_code, success_url, cancel_url } =
      await req.json();

    if (!plan_id || !billing_cycle) {
      return new Response(
        JSON.stringify({ error: "plan_id and billing_cycle required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey);

    // Look up plan
    const { data: plan, error: planErr } = await adminClient
      .from("membership_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planErr || !plan) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Guard: Enterprise plans have no fixed price
    const priceIls =
      billing_cycle === "annual"
        ? plan.price_annual_ils
        : plan.price_monthly_ils;

    if (priceIls == null) {
      return new Response(
        JSON.stringify({
          error:
            "Enterprise plans require a custom quote — please contact us",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Ensure Stripe Product + Price exist (lazy sync with race-condition guard)
    let stripePriceId: string;
    const priceColumn =
      billing_cycle === "annual"
        ? "stripe_price_annual_id"
        : "stripe_price_monthly_id";

    if (plan[priceColumn]) {
      stripePriceId = plan[priceColumn];
    } else {
      // Re-fetch plan to catch concurrent writes before creating anything
      const { data: freshPlan } = await adminClient
        .from("membership_plans")
        .select("*")
        .eq("id", plan_id)
        .single();

      if (freshPlan?.[priceColumn]) {
        // Another request already created it — use the existing price
        stripePriceId = freshPlan[priceColumn];
      } else {
        // Create product if needed (re-check after re-fetch)
        let stripeProductId =
          freshPlan?.stripe_product_id || plan.stripe_product_id;
        if (!stripeProductId) {
          const product = await stripe.products.create({
            name: `${plan.name} (${plan.entity_type})`,
            metadata: { plan_id: plan.id, entity_type: plan.entity_type },
          });
          stripeProductId = product.id;
          await adminClient
            .from("membership_plans")
            .update({ stripe_product_id: stripeProductId })
            .eq("id", plan.id);
        }

        // Create price
        const price = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: Math.round(priceIls * 100), // ILS to agorot
          currency: "ils",
          recurring: {
            interval: billing_cycle === "annual" ? "year" : "month",
          },
          metadata: { plan_id: plan.id, billing_cycle },
        });
        stripePriceId = price.id;
        await adminClient
          .from("membership_plans")
          .update({ [priceColumn]: stripePriceId })
          .eq("id", plan.id);
      }
    }

    // Build checkout session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      customer_email: userEmail,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: success_url || `${req.headers.get("origin")}/dashboard?checkout=success`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/dashboard?checkout=canceled`,
      metadata: {
        user_id: userId,
        plan_id: plan.id,
        entity_type: plan.entity_type,
        billing_cycle,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_id: plan.id,
          entity_type: plan.entity_type,
          billing_cycle,
        },
      },
    };

    // Handle promo code
    if (promo_code) {
      const { data: promo } = await adminClient
        .from("promo_codes")
        .select("*")
        .eq("code", promo_code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (
        promo &&
        (promo.applies_to === "all" ||
          promo.applies_to === plan.entity_type) &&
        (promo.max_redemptions === null ||
          promo.times_redeemed < promo.max_redemptions) &&
        (!promo.valid_from || new Date(promo.valid_from) <= new Date()) &&
        (!promo.valid_until || new Date(promo.valid_until) >= new Date())
      ) {
        // Create Stripe coupon
        if (promo.discount_percent && promo.discount_percent > 0) {
          const coupon = await stripe.coupons.create({
            percent_off: Number(promo.discount_percent),
            duration: "repeating",
            duration_in_months: promo.discount_duration_months || 12,
            currency: "ils",
            name: `Promo: ${promo.code}`,
            metadata: { promo_code_id: promo.id },
          });
          sessionParams.discounts = [{ coupon: coupon.id }];
        }

        // Trial days
        if (promo.trial_days && promo.trial_days > 0) {
          sessionParams.subscription_data!.trial_period_days =
            promo.trial_days;
        }

        // Store promo_code_id in metadata for webhook
        sessionParams.metadata!.promo_code_id = promo.id;
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stripe-checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
