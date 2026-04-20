import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  token: z.string().uuid(),
  password: z.string().min(10).max(128),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { token, password } = parsed.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Consume the token (atomic: marks used_at, returns user info)
    const { data: consumeData, error: consumeError } = await admin.rpc(
      "consume_password_setup_token",
      { p_token: token },
    );

    if (consumeError) {
      console.error("[complete-password-setup] consume error:", consumeError);
      return new Response(
        JSON.stringify({ error: "Failed to validate token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const row = Array.isArray(consumeData) ? consumeData[0] : consumeData;

    if (!row || !row.user_id) {
      return new Response(
        JSON.stringify({ error: "Invalid or unknown token" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (row.was_already_used) {
      return new Response(
        JSON.stringify({ error: "This setup link has already been used" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Update the auth user's password
    const { error: updateError } = await admin.auth.admin.updateUserById(
      row.user_id,
      { password, email_confirm: true },
    );

    if (updateError) {
      console.error("[complete-password-setup] password update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to set password" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mark provisional credential as delivered
    await admin
      .from("provisional_credentials")
      .update({ delivered_at: new Date().toISOString() })
      .eq("user_id", row.user_id);

    // Log audit
    await admin.from("agency_provisioning_audit").insert({
      agency_id: row.agency_id,
      target_user_id: row.user_id,
      action: "password_setup_completed",
      metadata: { purpose: row.purpose },
    });

    // Fetch user email for sign-in convenience
    const { data: userData } = await admin.auth.admin.getUserById(row.user_id);

    return new Response(
      JSON.stringify({
        success: true,
        purpose: row.purpose,
        agency_id: row.agency_id,
        email: userData?.user?.email ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[complete-password-setup] unexpected:", e);
    return new Response(
      JSON.stringify({ error: "Unexpected server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
