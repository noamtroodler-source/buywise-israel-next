import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  agentId: z.string().uuid(),
});

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  const len = 16;
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ success: false, error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminUserId = claimsData.claims.sub;

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: hasAdminRole } = await admin.rpc("has_role", {
      _user_id: adminUserId, _role: "admin",
    });
    if (!hasAdminRole) {
      return new Response(JSON.stringify({ success: false, error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ success: false, error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { agentId } = parsed.data;

    // Load agent
    const { data: agent, error: agentErr } = await admin
      .from("agents")
      .select("id, name, email, phone, agency_id, user_id")
      .eq("id", agentId)
      .maybeSingle();
    if (agentErr || !agent) {
      return new Response(JSON.stringify({ success: false, error: "Agent not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (agent.user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Agent already has an account" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!agent.email) {
      return new Response(
        JSON.stringify({ success: false, error: "Agent has no email on file" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const password = generatePassword();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: agent.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: agent.name,
        phone: agent.phone ?? null,
        provisioned: true,
        provisioned_for_agent_id: agentId,
        provisioned_for_agency_id: agent.agency_id,
        role_intent: "agent",
      },
    });
    if (createErr || !created?.user) {
      console.error("createUser error:", createErr);
      return new Response(
        JSON.stringify({ success: false, error: createErr?.message || "Failed to create user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const newUserId = created.user.id;

    await admin.from("profiles").upsert({
      id: newUserId,
      email: agent.email,
      full_name: agent.name,
    }, { onConflict: "id" });

    await admin.from("user_roles").insert({ user_id: newUserId, role: "agent" }).select();

    await admin
      .from("agents")
      .update({
        user_id: newUserId,
        is_provisional: true,
      })
      .eq("id", agentId);

    await admin.from("provisional_credentials").insert({
      user_id: newUserId,
      agency_id: agent.agency_id,
      role: "agent",
      encrypted_password: password,
      created_by: adminUserId,
    });

    const { data: tokenRow } = await admin
      .from("password_setup_tokens")
      .insert({
        user_id: newUserId,
        agency_id: agent.agency_id,
        purpose: "agent_setup",
      })
      .select("token")
      .single();

    await admin.rpc("log_provisioning_action", {
      _agency_id: agent.agency_id,
      _action: "agent_account_provisioned",
      _target_user_id: newUserId,
      _metadata: { agent_id: agentId, email: agent.email },
    });

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUserId,
        agentId,
        setupToken: tokenRow?.token ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("provision-agent-account error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
