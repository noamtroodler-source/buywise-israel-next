// Drafts/regenerates a BuyWise Take (Breakdown OR Deep Read) for an article.
// Admin-only. Returns the draft for review — does not auto-publish.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { draftBreakdown, draftDeepRead, deepReadToBody } from '../_shared/intel-ai.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleOk } = await admin.rpc('has_role', { _user_id: userData.user.id, _role: 'admin' });
    if (!roleOk) {
      return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const articleId = String(body?.article_id ?? '').trim();
    const tier = String(body?.tier ?? 'breakdown') as 'breakdown' | 'deep_read';
    if (!articleId) {
      return new Response(JSON.stringify({ error: 'article_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: article, error: aErr } = await admin
      .from('intel_articles')
      .select('id, headline, headline_en, excerpt, excerpt_en, category, source_name')
      .eq('id', articleId)
      .maybeSingle();
    if (aErr || !article) {
      return new Response(JSON.stringify({ error: 'article not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const input = {
      headline: article.headline_en || article.headline,
      excerpt: article.excerpt_en || article.excerpt,
      category: article.category ?? 'general',
      source_name: article.source_name ?? 'unknown',
    };

    if (tier === 'deep_read') {
      const dr = await draftDeepRead(input);
      if (!dr) return new Response(JSON.stringify({ error: 'ai_failed' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({
        ok: true,
        tier: 'deep_read',
        draft: {
          take_label: dr.take_label,
          deep_read_subheads: dr.sections,
          deep_read_body: deepReadToBody(dr),
        },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const b = await draftBreakdown(input);
    if (!b) return new Response(JSON.stringify({ error: 'ai_failed' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({
      ok: true,
      tier: 'breakdown',
      draft: {
        take_label: b.take_label,
        signal: b.signal,
        why_you_care: b.why_you_care,
        our_move: b.our_move,
        take_body: [b.signal, b.why_you_care, b.our_move].filter(Boolean).join('\n\n'),
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('draft-intel-take error', e);
    return new Response(JSON.stringify({ error: 'internal' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
