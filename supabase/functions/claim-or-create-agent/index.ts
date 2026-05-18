import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({
  agency_id: z.string().uuid().optional().nullable(),
  agency_name: z.string().optional().nullable(),
  name: z.string().min(1).max(200),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional().nullable(),
  license_number: z.string().max(100).optional().nullable(),
  bio: z.string().max(5000).optional().nullable(),
  languages: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  years_experience: z.number().int().min(0).max(80).optional(),
  confirm_claim_agent_id: z.string().uuid().optional().nullable(),
  skip_match: z.boolean().optional(),
});

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePhone(s: string | null | undefined): string | null {
  if (!s) return null;
  const digits = s.replace(/\D/g, '');
  if (digits.length < 7) return null;
  return digits.slice(-9);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const v0 = new Array(b.length + 1);
  const v1 = new Array(b.length + 1);
  for (let i = 0; i <= b.length; i++) v0[i] = i;
  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
  }
  return v1[b.length];
}

function nameMatches(input: string, candidate: string): boolean {
  const a = normalizeName(input);
  const b = normalizeName(candidate);
  if (!a || !b) return false;
  if (a === b) return true;
  // Compare whole strings
  const dist = levenshtein(a, b);
  const threshold = Math.max(a.length, b.length) >= 8 ? 2 : 1;
  if (dist <= threshold) return true;
  // Check if last name + first initial overlap (handles "Sara Cohen" vs "Sarah Cohen")
  const aParts = a.split(' ');
  const bParts = b.split(' ');
  if (aParts.length >= 2 && bParts.length >= 2) {
    if (aParts[aParts.length - 1] === bParts[bParts.length - 1]) {
      const firstDist = levenshtein(aParts[0], bParts[0]);
      if (firstDist <= 2) return true;
    }
  }
  return false;
}

function buildClaimUpdate(userId: string, data: z.infer<typeof BodySchema>) {
  return {
    user_id: userId,
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    license_number: data.license_number || null,
    bio: data.bio || null,
    languages: data.languages?.length ? data.languages : ['Hebrew', 'English'],
    specializations: data.specializations || null,
    years_experience: data.years_experience ?? 0,
    is_provisional: false,
    joined_via: 'invite_code',
    email_verified_at: new Date().toISOString(),
    status: 'active',
    approved_at: new Date().toISOString(),
    needs_review: false,
    updated_at: new Date().toISOString(),
  };
}

async function ensureAgentRole(admin: ReturnType<typeof createClient>, userId: string) {
  const { error } = await admin.from('user_roles').insert({ user_id: userId, role: 'agent' });
  if (error && !String(error.message).toLowerCase().includes('duplicate')) {
    console.error('user_roles insert error:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const data = parsed.data;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // If user already has an agent row, return it (idempotent re-runs)
    const { data: existingForUser } = await admin
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (existingForUser) {
      await ensureAgentRole(admin, userId);
      return new Response(
        JSON.stringify({ status: 'existing', agent: existingForUser }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Explicit confirmation path (user picked a fuzzy candidate)
    if (data.confirm_claim_agent_id) {
      const { data: claimed, error: claimErr } = await admin
        .from('agents')
        .update(buildClaimUpdate(userId, data))
        .eq('id', data.confirm_claim_agent_id)
        .is('user_id', null)
        .eq('agency_id', data.agency_id ?? '')
        .select()
        .single();
      if (claimErr || !claimed) {
        console.error('confirm_claim failed:', claimErr);
        return new Response(
          JSON.stringify({ error: 'Could not claim that profile — it may already be taken.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      await ensureAgentRole(admin, userId);
      return new Response(
        JSON.stringify({ status: 'claimed', agent: claimed, match_tier: 'name_confirmed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Run matching only when an agency invite is in play and skip_match is not set
    if (data.agency_id && !data.skip_match) {
      const { data: candidates, error: candErr } = await admin
        .from('agents')
        .select('id, name, email, phone, license_number, is_provisional, user_id, agency_id')
        .eq('agency_id', data.agency_id)
        .is('user_id', null);
      if (candErr) console.error('candidate fetch error:', candErr);

      const pool = candidates ?? [];
      const inputLicense = data.license_number?.trim().toLowerCase() || null;
      const inputPhone = normalizePhone(data.phone);
      const inputEmail = data.email.trim().toLowerCase();

      let autoClaim: (typeof pool)[number] | null = null;
      let matchTier = '';

      if (inputLicense) {
        autoClaim = pool.find(
          (c) => c.license_number && c.license_number.trim().toLowerCase() === inputLicense,
        ) || null;
        if (autoClaim) matchTier = 'license';
      }
      if (!autoClaim && inputPhone) {
        autoClaim = pool.find((c) => normalizePhone(c.phone) === inputPhone) || null;
        if (autoClaim) matchTier = 'phone';
      }
      if (!autoClaim) {
        autoClaim = pool.find(
          (c) => c.email && c.email.trim().toLowerCase() === inputEmail,
        ) || null;
        if (autoClaim) matchTier = 'email';
      }

      if (autoClaim) {
        const { data: claimed, error: claimErr } = await admin
          .from('agents')
          .update(buildClaimUpdate(userId, data))
          .eq('id', autoClaim.id)
          .is('user_id', null)
          .select()
          .single();
        if (!claimErr && claimed) {
          await ensureAgentRole(admin, userId);
          return new Response(
            JSON.stringify({ status: 'claimed', agent: claimed, match_tier: matchTier }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        // race lost — fall through
      }

      // Tier 4: fuzzy name — suggest, do not auto-claim
      const fuzzy = pool.find((c) => c.name && nameMatches(data.name, c.name));
      if (fuzzy) {
        // Count their assigned listings for context
        const { count: listingCount } = await admin
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', fuzzy.id);
        return new Response(
          JSON.stringify({
            status: 'needs_confirmation',
            candidate: {
              id: fuzzy.id,
              name: fuzzy.name,
              license_number: fuzzy.license_number,
              listing_count: listingCount ?? 0,
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // No match → create new agent row
    const { data: created, error: createErr } = await admin
      .from('agents')
      .insert({
        user_id: userId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        bio: data.bio || null,
        license_number: data.license_number || null,
        agency_id: data.agency_id || null,
        agency_name: data.agency_name || null,
        joined_via: data.agency_id ? 'invite_code' : 'direct',
        years_experience: data.years_experience ?? 0,
        languages: data.languages?.length ? data.languages : ['Hebrew', 'English'],
        specializations: data.specializations || null,
        email_verified_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (createErr) {
      console.error('create agent error:', createErr);
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    await ensureAgentRole(admin, userId);
    return new Response(
      JSON.stringify({ status: 'created', agent: created }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('claim-or-create-agent error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
