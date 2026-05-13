import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACTIONS = ['promote', 'demote', 'set_primary'] as const;
type Action = typeof ACTIONS[number];

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

    const body = await req.json();
    const agency_id: string = body?.agency_id;
    const target_user_id: string = body?.user_id;
    const action: Action = body?.action;

    if (!agency_id || !target_user_id || !ACTIONS.includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorize: caller must be admin/owner of this agency
    const { data: callerRole } = await admin.rpc('get_my_agency_role', { _agency_id: agency_id })
      .then(() => ({ data: null }))
      .catch(() => ({ data: null }));

    // Use direct check via membership table (rpc uses auth.uid which may differ in service ctx)
    const { data: callerMember } = await admin
      .from('agency_members')
      .select('role')
      .eq('agency_id', agency_id)
      .eq('user_id', caller.id)
      .in('role', ['owner', 'admin'])
      .maybeSingle();

    const { data: agency } = await admin
      .from('agencies')
      .select('admin_user_id, name')
      .eq('id', agency_id)
      .maybeSingle();

    // Platform admins (BuyWise staff) can manage any agency's roles
    const { data: hasPlatformAdmin } = await admin.rpc('has_role', {
      _user_id: caller.id, _role: 'admin',
    });

    const isCallerAdmin = !!callerMember || agency?.admin_user_id === caller.id || !!hasPlatformAdmin;
    if (!isCallerAdmin) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'promote') {
      // Insert admin row (idempotent via unique constraint)
      const { error } = await admin
        .from('agency_members')
        .upsert({
          agency_id,
          user_id: target_user_id,
          role: 'admin',
          created_by: caller.id,
        }, { onConflict: 'agency_id,user_id,role', ignoreDuplicates: true });
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true, action }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'demote') {
      // Owner is a founder label only — admins and owners have identical powers.
      // Demote removes both 'owner' and 'admin' rows for this user; the last-admin
      // DB trigger will block leaving the agency with zero admins.
      const { error } = await admin
        .from('agency_members')
        .delete()
        .eq('agency_id', agency_id)
        .eq('user_id', target_user_id)
        .in('role', ['owner', 'admin']);
      if (error) throw error; // last-admin trigger will surface here

      return new Response(JSON.stringify({ ok: true, action }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'set_primary') {
      // Target must be a member (owner or admin)
      const { data: targetMember } = await admin
        .from('agency_members')
        .select('id, role')
        .eq('agency_id', agency_id)
        .eq('user_id', target_user_id)
        .in('role', ['owner', 'admin'])
        .order('role', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!targetMember) {
        return new Response(JSON.stringify({ error: "Target is not an owner or admin" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Clear existing primary then set new one (atomic enough for our scale)
      await admin.from('agency_members').update({ is_primary_contact: false })
        .eq('agency_id', agency_id).eq('is_primary_contact', true);

      const { error } = await admin.from('agency_members')
        .update({ is_primary_contact: true })
        .eq('id', targetMember.id);
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true, action }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[agency-promote-member]', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
