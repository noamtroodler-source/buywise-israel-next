import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://buywiseisrael.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // ---- Auth: require admin ----
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) {
      return json({ error: "Unauthorized" }, 401);
    }
    const { data: userRes, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userRes?.user) return json({ error: "Unauthorized" }, 401);
    const adminUserId = userRes.user.id;

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const { agencyId } = await req.json();
    if (!agencyId) return json({ error: "agencyId is required" }, 400);

    // ---- Load agency ----
    const { data: agency, error: agencyErr } = await admin
      .from("agencies")
      .select(
        "id, name, email, management_status, agent_email_strategy, admin_user_id"
      )
      .eq("id", agencyId)
      .single();
    if (agencyErr || !agency) return json({ error: "Agency not found" }, 404);

    if (!agency.email) {
      return json(
        { error: "Agency has no owner email. Provision the owner account first." },
        400
      );
    }

    // ---- Load owner setup token (if exists & unused) ----
    let ownerSetupUrl = `${APP_URL}/agency`;
    if (agency.admin_user_id) {
      const { data: ownerToken } = await admin
        .from("password_setup_tokens")
        .select("token, used_at")
        .eq("user_id", agency.admin_user_id)
        .eq("purpose", "owner_setup")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (ownerToken && !ownerToken.used_at) {
        ownerSetupUrl = `${APP_URL}/auth/setup-password?token=${ownerToken.token}`;
      }
    }

    // ---- Load agents ----
    const { data: agents = [] } = await admin
      .from("agents")
      .select("id, name, email, user_id, is_provisional, welcome_email_sent_at, pending_fields")
      .eq("agency_id", agencyId);
    const agentRows = agents ?? [];

    // ---- Load listings count + flag summary for owner email ----
    const { count: listingCount = 0 } = await admin
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId);

    const { data: flags = [] } = await admin
      .from("listing_quality_flags")
      .select("flag_type, severity, property_id")
      .is("resolved_at", null)
      .in(
        "property_id",
        (
          await admin
            .from("properties")
            .select("id")
            .eq("agency_id", agencyId)
        ).data?.map((p: any) => p.id) ?? []
      );

    const pendingItems = summarizeFlags(flags as any[], agents as any[]);

    // ---- Send owner welcome email via queue ----
    const { error: ownerSendErr } = await admin.functions.invoke(
      "send-transactional-email",
      {
        body: {
          templateName: "owner-welcome",
          recipientEmail: agency.email,
          idempotencyKey: `owner-welcome-${agencyId}`,
          templateData: {
            ownerName: null,
            agencyName: agency.name,
            setupUrl: ownerSetupUrl,
            agentCount: agentRows.length,
            listingCount: listingCount ?? 0,
            pendingItems,
          },
        },
      }
    );
    if (ownerSendErr) {
      console.error("Owner email send failed", ownerSendErr);
      return json({ error: "Failed to send owner email" }, 500);
    }

    let agentsEmailed = 0;
    const strategy = agency.agent_email_strategy || "send_all_now";

    if (strategy === "send_all_now") {
      for (const agent of agentRows as any[]) {
        if (!agent.email || agent.welcome_email_sent_at) continue;

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

        const { error: aErr } = await admin.functions.invoke(
          "send-transactional-email",
          {
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
          }
        );
        if (!aErr) {
          await admin
            .from("agents")
            .update({ welcome_email_sent_at: new Date().toISOString() })
            .eq("id", agent.id);
          agentsEmailed++;
        } else {
          console.error("Agent email send failed", { agentId: agent.id, aErr });
        }
      }
    }

    // ---- Flip status ----
    await admin
      .from("agencies")
      .update({
        management_status: "handed_over",
        handover_completed_at: new Date().toISOString(),
      })
      .eq("id", agencyId);

    // ---- Audit ----
    await admin.rpc("log_provisioning_action", {
      _agency_id: agencyId,
      _action: "agency_handed_over",
      _target_user_id: agency.admin_user_id,
      _metadata: {
        strategy,
        agents_total: agentRows.length,
        agents_emailed: agentsEmailed,
        listings: listingCount ?? 0,
      },
    });

    return json({
      success: true,
      agentsEmailed,
      agentsTotal: agentRows.length,
      strategy,
    });
  } catch (err: any) {
    console.error("handover-agency error:", err);
    return json({ error: err?.message || "Internal error" }, 500);
  }
});

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function summarizeFlags(flags: any[], agents: any[]): string[] {
  const items: string[] = [];
  const byType = new Map<string, number>();
  for (const f of flags) {
    byType.set(f.flag_type, (byType.get(f.flag_type) ?? 0) + 1);
  }

  const missingPhotos = byType.get("low_photo_count") ?? 0;
  const unassigned = byType.get("agent_unassigned") ?? 0;
  const vagueAddress = byType.get("address_too_vague_for_geocode") ?? 0;
  const hebrewOnly = byType.get("hebrew_only_description") ?? 0;

  const agentsMissingLicense = agents.filter((a) =>
    (a.pending_fields ?? []).includes("license_number")
  ).length;

  if (agentsMissingLicense > 0) {
    items.push(
      `${agentsMissingLicense} agent${agentsMissingLicense === 1 ? "" : "s"} need a license number`
    );
  }
  if (missingPhotos > 0) {
    items.push(`${missingPhotos} listing${missingPhotos === 1 ? "" : "s"} need additional photos`);
  }
  if (unassigned > 0) {
    items.push(`${unassigned} listing${unassigned === 1 ? "" : "s"} need an agent assigned`);
  }
  if (vagueAddress > 0) {
    items.push(`${vagueAddress} listing${vagueAddress === 1 ? "" : "s"} need a precise address`);
  }
  if (hebrewOnly > 0) {
    items.push(`${hebrewOnly} listing${hebrewOnly === 1 ? "" : "s"} could use an English description`);
  }
  return items;
}
