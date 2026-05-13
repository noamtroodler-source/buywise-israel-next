// Backfill ai_buyer_takeaway for all active listings.
// Admin-only (validates JWT + admin role). Pages through properties and
// invokes generate-buyer-takeaway with limited concurrency. Safe to re-run.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const CONCURRENCY = 4;
const STATUSES = ['for_sale', 'for_rent'];

async function isAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims) return false;
  const userId = data.claims.sub as string;
  const svc = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: roles } = await svc
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  return Boolean(roles);
}

async function invokeOne(propertyId: string, force: boolean): Promise<{ id: string; ok: boolean; cached?: boolean; reason?: string }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-buyer-takeaway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({ property_id: propertyId, force }),
    });
    const json = await res.json().catch(() => ({}));
    return { id: propertyId, ok: Boolean(json?.ok), cached: json?.cached, reason: json?.reason };
  } catch (e) {
    return { id: propertyId, ok: false, reason: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  const ok = await isAdmin(authHeader);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'admin required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json().catch(() => ({}));
  const force = Boolean(body?.force);
  const onlyMissing = body?.only_missing !== false; // default true

  const svc = createClient(SUPABASE_URL, SERVICE_ROLE);
  let q = svc.from('properties').select('id').in('listing_status', STATUSES);
  if (onlyMissing && !force) q = q.is('ai_buyer_takeaway', null);
  const { data: rows, error } = await q;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const ids: string[] = (rows ?? []).map((r: any) => r.id);

  // Process in parallel chunks
  const results: Awaited<ReturnType<typeof invokeOne>>[] = [];
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const chunk = ids.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(chunk.map((id) => invokeOne(id, force)));
    results.push(...chunkResults);
  }

  const summary = {
    total: ids.length,
    generated: results.filter((r) => r.ok && !r.cached).length,
    cached: results.filter((r) => r.ok && r.cached).length,
    failed: results.filter((r) => !r.ok).length,
  };

  return new Response(JSON.stringify({ ok: true, summary, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
