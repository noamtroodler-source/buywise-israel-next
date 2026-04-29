import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  credentialId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
}).refine((d) => d.credentialId || d.userId, {
  message: "Either credentialId or userId required",
});

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
    const { credentialId, userId } = parsed.data;

    let q = admin
      .from("provisional_credentials")
      .select("id, user_id, agency_id, role, encrypted_password, created_at, revealed_at, delivered_at")
      .order("created_at", { ascending: false })
      .limit(1);
    if (credentialId) q = q.eq("id", credentialId);
    else if (userId) q = q.eq("user_id", userId);

    const { data: cred, error: credErr } = await q.maybeSingle();
    if (credErr || !cred) {
      if (userId && !credentialId) {
        const { data: profile } = await admin
          .from("profiles")
          .select("email, full_name")
          .eq("id", userId)
          .maybeSingle();

        return new Response(
          JSON.stringify({
            success: true,
            credential: {
              id: null,
              userId,
              agencyId: null,
              role: null,
              email: profile?.email ?? null,
              fullName: profile?.full_name ?? null,
              password: null,
              createdAt: null,
              deliveredAt: null,
              unavailableReason: "existing_user_no_provisional_password",
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ success: false, error: "Credential not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as revealed
    await admin
      .from("provisional_credentials")
      .update({
        revealed_at: new Date().toISOString(),
        revealed_by: adminUserId,
      })
      .eq("id", cred.id);

    // Lookup email for display
    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", cred.user_id)
      .maybeSingle();

    await admin.rpc("log_provisioning_action", {
      _agency_id: cred.agency_id,
      _action: "credentials_revealed",
      _target_user_id: cred.user_id,
      _metadata: { credential_id: cred.id, role: cred.role },
    });

    return new Response(
      JSON.stringify({
        success: true,
        credential: {
          id: cred.id,
          userId: cred.user_id,
          agencyId: cred.agency_id,
          role: cred.role,
          email: profile?.email ?? null,
          fullName: profile?.full_name ?? null,
          password: cred.encrypted_password,
          createdAt: cred.created_at,
          deliveredAt: cred.delivered_at,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("reveal-credentials error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
