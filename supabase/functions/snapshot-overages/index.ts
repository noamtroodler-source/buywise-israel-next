import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check — must be admin
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Validate caller is admin
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData } = await supabaseUser.auth.getClaims(token);
  if (!claimsData?.claims) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }
  const userId = claimsData.claims.sub;
  const { data: roleRow } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (!roleRow) {
    return new Response(JSON.stringify({ error: 'Forbidden — admin only' }), { status: 403, headers: corsHeaders });
  }

  // Determine billing period (current calendar month)
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  // Load current overage rates (latest effective rate per entity+resource)
  const { data: rates, error: ratesError } = await supabaseAdmin
    .from('overage_rates')
    .select('entity_type, resource_type, rate_ils')
    .order('effective_from', { ascending: false });

  if (ratesError) {
    return new Response(JSON.stringify({ error: ratesError.message }), { status: 500, headers: corsHeaders });
  }

  // Build a rates lookup: entityType+resourceType -> rate
  const rateMap: Record<string, number> = {};
  for (const r of rates ?? []) {
    const key = `${r.entity_type}:${r.resource_type}`;
    if (!(key in rateMap)) rateMap[key] = r.rate_ils; // first = latest (desc ordered)
  }

  // Load all active/trialing subscriptions with plan limits
  const { data: subscriptions, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select('id, entity_type, entity_id, status, max_listings, max_seats')
    .in('status', ['active', 'trialing']);

  if (subError) {
    return new Response(JSON.stringify({ error: subError.message }), { status: 500, headers: corsHeaders });
  }

  const results: { subId: string; resource: string; overage: number }[] = [];

  for (const sub of subscriptions ?? []) {
    if (!sub.entity_id || !sub.entity_type) continue;

    const upserts: Array<{
      subscription_id: string;
      entity_type: string;
      entity_id: string;
      billing_period_start: string;
      billing_period_end: string;
      resource_type: string;
      plan_limit: number;
      actual_count: number;
      rate_ils_per_unit: number;
      status: string;
    }> = [];

    if (sub.entity_type === 'agency') {
      // Count non-draft properties
      const { data: agentRow } = await supabaseAdmin
        .from('agents')
        .select('id')
        .eq('agency_id', sub.entity_id);

      let listingCount = 0;
      if (agentRow && agentRow.length > 0) {
        const agentIds = agentRow.map((a: { id: string }) => a.id);
        const { count } = await supabaseAdmin
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .in('agent_id', agentIds)
          .neq('verification_status', 'draft');
        listingCount = count ?? 0;
      }

      // Count seats
      const { count: seatCount } = await supabaseAdmin
        .from('agents')
        .select('id', { count: 'exact', head: true })
        .eq('agency_id', sub.entity_id);

      const listingLimit = sub.max_listings ?? 0;
      const seatLimit = sub.max_seats ?? 0;
      const listingRate = rateMap['agency:listing'] ?? 150;
      const seatRate = rateMap['agency:seat'] ?? 100;

      if (listingLimit > 0 && listingCount > listingLimit) {
        upserts.push({
          subscription_id: sub.id,
          entity_type: 'agency',
          entity_id: sub.entity_id,
          billing_period_start: periodStart,
          billing_period_end: periodEnd,
          resource_type: 'listing',
          plan_limit: listingLimit,
          actual_count: listingCount,
          rate_ils_per_unit: listingRate,
          status: 'pending',
        });
        results.push({ subId: sub.id, resource: 'listing', overage: listingCount - listingLimit });
      }

      if (seatLimit > 0 && (seatCount ?? 0) > seatLimit) {
        upserts.push({
          subscription_id: sub.id,
          entity_type: 'agency',
          entity_id: sub.entity_id,
          billing_period_start: periodStart,
          billing_period_end: periodEnd,
          resource_type: 'seat',
          plan_limit: seatLimit,
          actual_count: seatCount ?? 0,
          rate_ils_per_unit: seatRate,
          status: 'pending',
        });
        results.push({ subId: sub.id, resource: 'seat', overage: (seatCount ?? 0) - seatLimit });
      }

    } else if (sub.entity_type === 'developer') {
      const { count: projectCount } = await supabaseAdmin
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('developer_id', sub.entity_id)
        .neq('verification_status', 'draft');

      const projectLimit = sub.max_listings ?? 0; // max_listings maps to projects for developers
      const projectRate = rateMap['developer:project'] ?? 500;

      if (projectLimit > 0 && (projectCount ?? 0) > projectLimit) {
        upserts.push({
          subscription_id: sub.id,
          entity_type: 'developer',
          entity_id: sub.entity_id,
          billing_period_start: periodStart,
          billing_period_end: periodEnd,
          resource_type: 'project',
          plan_limit: projectLimit,
          actual_count: projectCount ?? 0,
          rate_ils_per_unit: projectRate,
          status: 'pending',
        });
        results.push({ subId: sub.id, resource: 'project', overage: (projectCount ?? 0) - projectLimit });
      }
    }

    if (upserts.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from('overage_records')
        .upsert(upserts, {
          onConflict: 'entity_id,entity_type,resource_type,billing_period_start',
          ignoreDuplicates: false,
        });
      if (upsertError) {
        console.error('Upsert error:', upsertError);
      }
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      period: { start: periodStart, end: periodEnd },
      processed: subscriptions?.length ?? 0,
      overages_written: results.length,
      details: results,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
