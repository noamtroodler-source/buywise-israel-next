import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ACTIVATE-BOOST] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;
    logStep("Authenticated", { userId });

    const { product_slug, target_type, target_id } = await req.json();
    if (!product_slug || !target_type || !target_id) {
      return new Response(JSON.stringify({ error: "Missing required fields: product_slug, target_type, target_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Resolve entity
    let entityType: string | null = null;
    let entityId: string | null = null;

    const { data: agency } = await admin.from("agencies").select("id").eq("admin_user_id", userId).maybeSingle();
    if (agency) { entityType = "agency"; entityId = agency.id; }

    if (!entityId) {
      const { data: dev } = await admin.from("developers").select("id").eq("user_id", userId).maybeSingle();
      if (dev) { entityType = "developer"; entityId = dev.id; }
    }

    if (!entityType || !entityId) {
      return new Response(JSON.stringify({ error: "No agency or developer profile found" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    logStep("Entity resolved", { entityType, entityId });

    // Verify ownership
    if (target_type === "property") {
      // Agent must belong to this agency, or be the agent who owns the property
      const { data: prop } = await admin.from("properties").select("agent_id").eq("id", target_id).maybeSingle();
      if (!prop) {
        return new Response(JSON.stringify({ error: "Property not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      // Verify agent belongs to this agency
      if (entityType === "agency") {
        const { data: agent } = await admin.from("agents").select("agency_id").eq("id", prop.agent_id).maybeSingle();
        if (!agent || agent.agency_id !== entityId) {
          return new Response(JSON.stringify({ error: "You don't own this property" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    } else if (target_type === "project") {
      const { data: proj } = await admin.from("projects").select("developer_id").eq("id", target_id).maybeSingle();
      if (!proj || proj.developer_id !== entityId) {
        return new Response(JSON.stringify({ error: "You don't own this project" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      return new Response(JSON.stringify({ error: "Invalid target_type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    logStep("Ownership verified");

    // Fetch visibility product
    const { data: product, error: productErr } = await admin
      .from("visibility_products")
      .select("*")
      .eq("slug", product_slug)
      .eq("is_active", true)
      .maybeSingle();

    if (productErr || !product) {
      return new Response(JSON.stringify({ error: "Boost product not found or inactive" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check applies_to
    if (product.applies_to !== "all" && product.applies_to !== entityType) {
      return new Response(JSON.stringify({ error: `This boost is not available for ${entityType} accounts` }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    logStep("Product validated", { slug: product.slug, cost: product.credit_cost });

    // Check credit balance
    const { data: balance } = await admin.rpc("get_credit_balance", {
      p_entity_type: entityType,
      p_entity_id: entityId,
    });
    const currentBalance = (balance as number) || 0;

    if (currentBalance < product.credit_cost) {
      return new Response(JSON.stringify({
        error: "Insufficient credits",
        current_balance: currentBalance,
        required: product.credit_cost,
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    logStep("Balance sufficient", { currentBalance, cost: product.credit_cost });

    // Check slot availability
    if (product.max_slots) {
      const { data: activeCount } = await admin.rpc("get_active_boost_count", { p_product_id: product.id });
      if ((activeCount as number) >= product.max_slots) {
        return new Response(JSON.stringify({ error: "No boost slots available. Try again later." }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Deduct credits
    const { data: txnId, error: spendErr } = await admin.rpc("spend_credits", {
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_amount: product.credit_cost,
      p_description: `Boost: ${product.name} for ${target_type} ${target_id}`,
    });

    if (spendErr) {
      logStep("Spend credits failed", { error: spendErr.message });
      return new Response(JSON.stringify({ error: spendErr.message }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    logStep("Credits deducted", { txnId });

    // Create active boost
    const startsAt = new Date().toISOString();
    const endsAt = new Date(Date.now() + product.duration_days * 86400000).toISOString();

    const { data: boost, error: boostErr } = await admin
      .from("active_boosts")
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        product_id: product.id,
        target_type: target_type,
        target_id: target_id,
        starts_at: startsAt,
        ends_at: endsAt,
        is_active: true,
        credit_transaction_id: txnId,
      })
      .select()
      .single();

    if (boostErr) {
      logStep("Boost creation failed", { error: boostErr.message });
      return new Response(JSON.stringify({ error: "Failed to create boost" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Boost activated", { boostId: boost.id });

    return new Response(JSON.stringify({
      success: true,
      boost,
      new_balance: currentBalance - product.credit_cost,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
