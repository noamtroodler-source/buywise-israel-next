import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://buywiseisrael.com";

// Sends welcome emails to all unsent agents in an agency.
// Used by the owner dashboard "Send welcome emails to my agents" button
// (when agency.agent_email_strategy = 'send_after_owner').

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    const functionInvoker = createClient(supabaseUrl, anonKey);

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Unauthorized" }, 401);
    const { data: userRes, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userRes?.user) return json({ error: "Unauthorized" }, 401);
    const callerId = userRes.user.id;

    const { agencyId } = await req.json();
    if (!agencyId) return json({ error: "agencyId is required" }, 400);

    // Caller must be the agency admin OR a platform admin
    const { data: agency } = await admin
      .from("agencies")
      .select("id, name, admin_user_id")
      .eq("id", agencyId)
      .single();
    if (!agency) return json({ error: "Agency not found" }, 404);

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    const isPlatformAdmin = !!roleRow;
    const isAgencyAdmin = agency.admin_user_id === callerId;
    if (!isPlatformAdmin && !isAgencyAdmin) return json({ error: "Forbidden" }, 403);

    const { data: agents = [] } = await admin
      .from("agents")
      .select("id, name, email, user_id, welcome_email_sent_at")
      .eq("agency_id", agencyId)
      .is("welcome_email_sent_at", null);
    const agentRows = agents ?? [];

    let sent = 0;
    for (const agent of agentRows as any[]) {
      if (!agent.email) continue;
      let setupUrl = `${APP_URL}/agent`;
      if (agent.user_id) {
        const { data: t } = await admin
          .from("password_setup_tokens")
          .select("token, used_at")
          .eq("user_id", agent.user_id)
          .eq("purpose", "agent_setup")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (t && !t.used_at) {
          setupUrl = `${APP_URL}/auth/setup-password?token=${t.token}`;
        }
      }

      const { error } = await functionInvoker.functions.invoke("send-transactional-email", {
        body: {
          templateName: "agent-welcome",
          recipientEmail: agent.email,
          idempotencyKey: `agent-welcome-${agent.id}`,
          templateData: {
            agentName: agent.name,
            agencyName: agency.name,
            setupUrl,
          },
        },
      });
      if (!error) {
        await admin
          .from("agents")
          .update({ welcome_email_sent_at: new Date().toISOString() })
          .eq("id", agent.id);
        sent++;
      }
    }

    return json({ success: true, sent, total: agentRows.length });
  } catch (err: any) {
    console.error("send-agent-welcome error:", err);
    return json({ error: err?.message || "Internal error" }, 500);
  }
});

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
