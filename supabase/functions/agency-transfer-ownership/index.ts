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

    const { agency_id, new_owner_user_id } = await req.json();
    if (!agency_id || !new_owner_user_id) {
      return new Response(JSON.stringify({ error: "Missing agency_id or new_owner_user_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Caller must be the current owner
    const { data: ownerRow } = await admin
      .from('agency_members')
      .select('id')
      .eq('agency_id', agency_id)
      .eq('user_id', caller.id)
      .eq('role', 'owner')
      .maybeSingle();

    const { data: agency } = await admin
      .from('agencies')
      .select('admin_user_id')
      .eq('id', agency_id)
      .maybeSingle();

    const isOwner = !!ownerRow || agency?.admin_user_id === caller.id;
    if (!isOwner) {
      return new Response(JSON.stringify({ error: "Only the current owner can transfer ownership" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Target must already be an admin
    const { data: targetAdmin } = await admin
      .from('agency_members')
      .select('id')
      .eq('agency_id', agency_id)
      .eq('user_id', new_owner_user_id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!targetAdmin) {
      // Auto-promote them first
      const { error: promoErr } = await admin.from('agency_members').insert({
        agency_id, user_id: new_owner_user_id, role: 'admin', created_by: caller.id,
      });
      if (promoErr) throw promoErr;
    }

    // Insert new owner row first (this will block on unique-owner index if one exists)
    // So we must delete the old owner row in the same transaction.
    // Workaround: use rpc for atomic swap.
    const { error: rpcErr } = await admin.rpc('transfer_agency_ownership', {
      _agency_id: agency_id,
      _new_owner: new_owner_user_id,
      _actor: caller.id,
    });

    if (rpcErr) {
      // Fallback: manual swap (will briefly violate unique index — wrap in serializable txn via RPC ideally)
      // Delete old, insert new
      await admin.from('agency_members').delete()
        .eq('agency_id', agency_id).eq('role', 'owner');
      const { error: insErr } = await admin.from('agency_members').insert({
        agency_id, user_id: new_owner_user_id, role: 'owner', is_primary_contact: false, created_by: caller.id,
      });
      if (insErr) throw insErr;
    }

    // Update legacy pointer to keep things consistent
    await admin.from('agencies').update({ admin_user_id: new_owner_user_id }).eq('id', agency_id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[agency-transfer-ownership]', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
