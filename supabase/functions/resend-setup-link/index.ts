import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  userId: z.string().uuid(),
  purpose: z.enum(["owner_setup", "agent_setup"]),
});

// Phase 9 — admin tool. Voids any existing unused setup token for the given
// user+purpose, then issues a fresh one. Used when the original link is lost
// or the admin wants to re-send.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ success: false, error: "Unauthorized" }, 401);
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
      return json({ success: false, error: "Invalid token" }, 401);
    }
    const adminUserId = claimsData.claims.sub;

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: hasAdminRole } = await admin.rpc("has_role", {
      _user_id: adminUserId, _role: "admin",
    });
    if (!hasAdminRole) return json({ success: false, error: "Admin access required" }, 403);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ success: false, error: parsed.error.flatten().fieldErrors }, 400);
    }
    const { userId, purpose } = parsed.data;

    // Look up the original agency_id from any prior token, fall back to direct lookup.
    const { data: existing } = await admin
      .from("password_setup_tokens")
      .select("agency_id, used_at")
      .eq("user_id", userId)
      .eq("purpose", purpose)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let agencyId = existing?.agency_id ?? null;
    if (!agencyId) {
      // Fallback: agencies.admin_user_id or agents.user_id
      if (purpose === "owner_setup") {
        const { data: ag } = await admin.from("agencies").select("id").eq("admin_user_id", userId).maybeSingle();
        agencyId = ag?.id ?? null;
      } else {
        const { data: ag } = await admin.from("agents").select("agency_id").eq("user_id", userId).maybeSingle();
        agencyId = ag?.agency_id ?? null;
      }
    }
    if (!agencyId) return json({ success: false, error: "Could not determine agency" }, 404);

    // Void any unused tokens for this user+purpose
    await admin
      .from("password_setup_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("purpose", purpose)
      .is("used_at", null);

    // Issue fresh token
    const { data: tokenRow, error: tokenErr } = await admin
      .from("password_setup_tokens")
      .insert({ user_id: userId, agency_id: agencyId, purpose })
      .select("token")
      .single();
    if (tokenErr || !tokenRow) {
      console.error("token insert err", tokenErr);
      return json({ success: false, error: "Failed to issue token" }, 500);
    }

    await admin.rpc("log_provisioning_action", {
      _agency_id: agencyId,
      _action: "setup_link_resent",
      _target_user_id: userId,
      _metadata: { purpose },
    });

    return json({ success: true, token: tokenRow.token, agencyId });
  } catch (err: any) {
    console.error("resend-setup-link error:", err);
    return json({ success: false, error: err?.message || "Internal error" }, 500);
  }
});

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
