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

    const { package_id, entity_type, entity_id, success_url, cancel_url } =
      await req.json();

    if (!package_id || !entity_type || !entity_id) {
      return new Response(
        JSON.stringify({
          error: "package_id, entity_type, and entity_id required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey);

    // Look up package
    const { data: pkg, error: pkgErr } = await adminClient
      .from("credit_packages")
      .select("*")
      .eq("id", package_id)
      .eq("is_active", true)
      .single();

    if (pkgErr || !pkg) {
      return new Response(JSON.stringify({ error: "Package not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lazy sync Stripe product/price
    let stripePriceId = pkg.stripe_price_id;
    if (!stripePriceId) {
      let stripeProductId = pkg.stripe_product_id;
      if (!stripeProductId) {
        const product = await stripe.products.create({
          name: `Credit Package: ${pkg.name}`,
          metadata: { package_id: pkg.id },
        });
        stripeProductId = product.id;
        await adminClient
          .from("credit_packages")
          .update({ stripe_product_id: stripeProductId })
          .eq("id", pkg.id);
      }

      const price = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: Math.round(pkg.price_ils * 100),
        currency: "ils",
        metadata: { package_id: pkg.id },
      });
      stripePriceId = price.id;
      await adminClient
        .from("credit_packages")
        .update({ stripe_price_id: stripePriceId })
        .eq("id", pkg.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: userEmail,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url:
        success_url ||
        `${req.headers.get("origin")}/dashboard?credit_purchase=success`,
      cancel_url:
        cancel_url ||
        `${req.headers.get("origin")}/dashboard?credit_purchase=canceled`,
      metadata: {
        user_id: userId,
        package_id: pkg.id,
        entity_type,
        entity_id,
        credits: Math.floor(pkg.credits_included * (1 + (pkg.bonus_percent || 0) / 100)).toString(),
        type: "credit_purchase",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stripe-credit-checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
