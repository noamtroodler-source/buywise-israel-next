import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FOUNDING_CAP = 15;
const TRIAL_DAYS = 60;
const FREE_CREDITS_PER_MONTH = 3;
const FREE_CREDITS_DURATION_MONTHS = 2;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan_id, billing_cycle } = await req.json();
    if (!plan_id) {
      return new Response(JSON.stringify({ error: "plan_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get agent + agency
    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .select("id, agency_id")
      .eq("user_id", user.id)
      .single();

    if (agentError || !agent?.agency_id) {
      return new Response(
        JSON.stringify({ error: "You must be an agent with an agency to enroll" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cap
    const { count: enrolledCount, error: countError } = await supabaseAdmin
      .from("founding_partners")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    if (countError) throw countError;
    const enrolled = enrolledCount ?? 0;

    if (enrolled >= FOUNDING_CAP) {
      return new Response(
        JSON.stringify({ error: "Founding Partner program is full", spots_remaining: 0 }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check agency not already enrolled
    const { data: existing } = await supabaseAdmin
      .from("founding_partners")
      .select("id")
      .eq("agency_id", agent.agency_id)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ error: "Your agency is already enrolled in the Founding Partner program" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate plan exists
    const { data: plan, error: planError } = await supabaseAdmin
      .from("membership_plans")
      .select("id, tier, name")
      .eq("id", plan_id)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    // Insert founding partner
    const { data: partner, error: fpError } = await supabaseAdmin
      .from("founding_partners")
      .insert({
        agency_id: agent.agency_id,
        option: "founding_2026",
        discount_percent: 0,
        discount_locked: false,
        free_credits_per_month: FREE_CREDITS_PER_MONTH,
        free_credits_duration_months: FREE_CREDITS_DURATION_MONTHS,
        is_active: true,
      })
      .select("id")
      .single();

    if (fpError) throw fpError;

    // Upsert subscription
    const { data: sub, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          entity_type: "agency",
          entity_id: agent.agency_id,
          plan_id: plan_id,
          billing_cycle: billing_cycle || "monthly",
          status: "trialing",
          trial_start: now.toISOString(),
          trial_end: trialEnd.toISOString(),
          is_founding_partner: true,
          created_by: user.id,
        },
        { onConflict: "entity_type,entity_id" }
      )
      .select("id")
      .single();

    if (subError) throw subError;

    // Grant first month's credits
    const monthEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)
    );

    const { error: creditError } = await supabaseAdmin
      .from("founding_featured_credits")
      .insert({
        founding_partner_id: partner.id,
        month_number: 1,
        credits_granted: FREE_CREDITS_PER_MONTH,
        credits_used: 0,
        expires_at: monthEnd.toISOString(),
      });

    if (creditError) {
      console.error("Credit grant error (non-fatal):", creditError);
    }

    // Record promo redemption
    const { data: promo } = await supabaseAdmin
      .from("promo_codes")
      .select("id")
      .eq("code", "FOUNDING2026")
      .single();

    if (promo) {
      await supabaseAdmin.from("subscription_promo_redemptions").insert({
        subscription_id: sub.id,
        promo_code_id: promo.id,
        credit_months_granted: FREE_CREDITS_DURATION_MONTHS,
      });

      // Increment times_redeemed
      await supabaseAdmin.rpc("increment_promo_redemptions", {
        p_promo_id: promo.id,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        trial_end: trialEnd.toISOString(),
        spots_remaining: FOUNDING_CAP - enrolled - 1,
        plan_name: plan.name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Enroll founding partner error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Enrollment failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
