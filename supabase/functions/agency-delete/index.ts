import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) throw new Error("Not authenticated");
    const caller = userData.user;

    const { agency_id, confirm_name } = await req.json();
    if (!agency_id || !confirm_name) {
      return new Response(JSON.stringify({ error: "Missing agency_id or confirm_name" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: agency } = await admin
      .from('agencies')
      .select('id, name, admin_user_id')
      .eq('id', agency_id)
      .maybeSingle();

    if (!agency) throw new Error("Agency not found");

    if ((agency.name || '').trim().toLowerCase() !== String(confirm_name).trim().toLowerCase()) {
      return new Response(JSON.stringify({ error: "Confirmation name does not match" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Caller must be owner
    const { data: ownerRow } = await admin
      .from('agency_members')
      .select('id')
      .eq('agency_id', agency_id)
      .eq('user_id', caller.id)
      .eq('role', 'owner')
      .maybeSingle();

    if (!ownerRow && agency.admin_user_id !== caller.id) {
      return new Response(JSON.stringify({ error: "Only the owner can delete the agency" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hard delete (cascade handles agency_members)
    const { error } = await admin.from('agencies').delete().eq('id', agency_id);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[agency-delete]', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
