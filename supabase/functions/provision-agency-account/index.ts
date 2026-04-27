import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  agencyId: z.string().uuid(),
  ownerEmail: z.string().email(),
  ownerName: z.string().min(1).max(255),
  ownerPhone: z.string().optional(),
});

// Generate a strong random password (16 chars, mixed)
function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  const len = 16;
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

async function findUserByEmail(admin: ReturnType<typeof createClient>, email: string) {
  const target = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((u) => u.email?.trim().toLowerCase() === target);
    if (user) return user;
    if (data.users.length < perPage) return null;
    page += 1;
  }

  return null;
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
    const { agencyId, ownerEmail, ownerName, ownerPhone } = parsed.data;

    // Verify agency exists
    const { data: agency, error: agencyErr } = await admin
      .from("agencies")
      .select("id, name, admin_user_id, management_status")
      .eq("id", agencyId)
      .maybeSingle();
    if (agencyErr || !agency) {
      return new Response(JSON.stringify({ success: false, error: "Agency not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (agency.admin_user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Agency already has an owner account" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const password = generatePassword();
    let authUser = await findUserByEmail(admin, ownerEmail);
    let reusedExistingUser = Boolean(authUser);

    if (!authUser) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: ownerEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: ownerName,
          phone: ownerPhone ?? null,
          provisioned: true,
          provisioned_for_agency_id: agencyId,
          role_intent: "agency_owner",
        },
      });
      if (createErr || !created?.user) {
        if (createErr?.code === "email_exists" || createErr?.message?.includes("already been registered")) {
          authUser = await findUserByEmail(admin, ownerEmail);
          reusedExistingUser = Boolean(authUser);
        }
        if (!authUser) {
          console.error("createUser error:", createErr);
          return new Response(
            JSON.stringify({ success: false, error: createErr?.message || "Failed to create user" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        authUser = created.user;
      }
    }
    const newUserId = authUser.id;

    // Ensure profile row exists
    await admin.from("profiles").upsert({
      id: newUserId,
      email: ownerEmail,
      full_name: ownerName,
    }, { onConflict: "id" });

    await admin
      .from("user_roles")
      .upsert({ user_id: newUserId, role: "agency_admin" }, { onConflict: "user_id,role" });

    // Link to agency
    await admin
      .from("agencies")
      .update({
        admin_user_id: newUserId,
        provisioned_by: adminUserId,
        provisioned_at: new Date().toISOString(),
        management_status: "provisioning",
      })
      .eq("id", agencyId);

    if (!reusedExistingUser) {
      await admin.from("provisional_credentials").insert({
        user_id: newUserId,
        agency_id: agencyId,
        role: "owner",
        encrypted_password: password,
        created_by: adminUserId,
      });
    }

    // Create password setup token
    const { data: tokenRow, error: tokenErr } = await admin
      .from("password_setup_tokens")
      .insert({
        user_id: newUserId,
        agency_id: agencyId,
        purpose: "owner_setup",
      })
      .select("token")
      .single();
    if (tokenErr) console.error("token insert err", tokenErr);

    // Audit log
    await admin.rpc("log_provisioning_action", {
      _agency_id: agencyId,
      _action: "owner_account_provisioned",
      _target_user_id: newUserId,
        _metadata: { email: ownerEmail, reused_existing_user: reusedExistingUser },
    });

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUserId,
        agencyId,
        setupToken: tokenRow?.token ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("provision-agency-account error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
