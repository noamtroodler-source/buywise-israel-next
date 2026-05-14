// Generate AI buyer takeaway for a property listing.
// Pulls property + city benchmarks + nearby sold comps, hashes the brief,
// skips regeneration unless inputs changed (or force=true), and writes a
// 1-2 sentence "Trusted Friend" summary into properties.ai_buyer_takeaway.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MODEL = 'google/gemini-2.5-flash';
const MAX_CHARS = 320;
const BANNED = ['anglo'];

const SYSTEM_PROMPT = `You are BuyWise's "Trusted Friend" — a sharp, plainspoken property advisor for international buyers in Israel.

Write ONE buyer takeaway: max 2 sentences, max 280 characters, plain English.

Hard rules:
- NEVER invent numbers. Only restate signals from the JSON brief I give you.
- Reference at least one concrete signal: gap vs benchmark %, comps count, premium feature, condition, ownership type, fees, or price reduction.
- End with the single most useful next step the buyer should take (e.g. "ask the agent for…", "verify…", "compare against…", "get a tax quote on…").
- Voice: warm, candid, never salesy. No emojis. No exclamation marks. No "Anglo" — say "international buyers" if needed.
- No preamble, no quotes, no markdown. Output the takeaway sentence(s) only.`;

interface Brief {
  property: Record<string, unknown>;
  city_benchmarks: Record<string, unknown> | null;
  comps: { count: number; radius_m: number; median_price_per_sqm: number | null; sample: unknown[] };
  derived: Record<string, unknown>;
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getIsraeliRoomCount(p: Record<string, unknown>): number | null {
  const beds = (p.bedrooms as number) ?? 0;
  const add = (p.additional_rooms as number) ?? 0;
  const total = beds + add;
  return total > 0 ? total : null;
}

async function buildBrief(supa: ReturnType<typeof createClient>, propertyId: string): Promise<Brief | null> {
  const { data: prop, error } = await supa.from('properties').select('*').eq('id', propertyId).maybeSingle();
  if (error || !prop) return null;

  const city = (prop as any).city as string | null;
  let cityRow: any = null;
  if (city) {
    const { data } = await supa
      .from('cities')
      .select('average_price_sqm, yoy_price_change, average_vaad_bayit, arnona_rate_sqm, gross_yield_percent, rental_3_room_min, rental_3_room_max, rental_4_room_min, rental_4_room_max')
      .eq('name', city)
      .maybeSingle();
    cityRow = data;
  }

  // Comps
  let compsCount = 0;
  let radiusM = 500;
  let medianPpsm: number | null = null;
  const sample: any[] = [];
  const rooms = getIsraeliRoomCount(prop as Record<string, unknown>);
  const lat = (prop as any).latitude as number | null;
  const lng = (prop as any).longitude as number | null;
  if (lat && lng && city) {
    for (const radiusKm of [0.5, 1.0]) {
      const { data: comps } = await supa.rpc('get_nearby_sold_comps', {
        p_lat: lat,
        p_lng: lng,
        p_city: city,
        p_radius_km: radiusKm,
        p_months_back: 24,
        p_limit: 8,
        p_min_rooms: rooms ? Math.max(1, rooms - 1) : null,
        p_max_rooms: rooms ? rooms + 1 : null,
      });
      if (comps && comps.length > 0) {
        compsCount = comps.length;
        radiusM = radiusKm * 1000;
        const ppsms = comps
          .map((c: any) => c.price_per_sqm as number | null)
          .filter((v: number | null): v is number => typeof v === 'number' && v > 0)
          .sort((a: number, b: number) => a - b);
        if (ppsms.length > 0) {
          medianPpsm = ppsms[Math.floor(ppsms.length / 2)];
        }
        comps.slice(0, 4).forEach((c: any) =>
          sample.push({
            sold_price: c.sold_price,
            rooms: c.rooms,
            size_sqm: c.size_sqm,
            price_per_sqm: c.price_per_sqm,
            distance_m: Math.round(c.distance_meters),
            sold_date: c.sold_date,
          })
        );
        break;
      }
    }
  }

  const p = prop as any;
  const pricePerSqm = p.price && p.size_sqm ? Math.round(p.price / p.size_sqm) : null;
  const benchmarkPpsm = cityRow?.average_price_sqm ?? null;
  const gapPct =
    pricePerSqm && benchmarkPpsm ? Math.round(((pricePerSqm - benchmarkPpsm) / benchmarkPpsm) * 100) : null;
  const compsGapPct =
    pricePerSqm && medianPpsm ? Math.round(((pricePerSqm - medianPpsm) / medianPpsm) * 100) : null;
  const priceReducedPct =
    p.original_price && p.price && p.original_price > p.price
      ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
      : null;

  return {
    property: {
      city: p.city,
      neighborhood: p.neighborhood,
      listing_status: p.listing_status,
      property_type: p.property_type,
      price_nis: p.price,
      currency: p.currency,
      size_sqm: p.size_sqm,
      sqm_source: p.sqm_source,
      israeli_rooms: rooms,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      floor: p.floor,
      total_floors: p.total_floors,
      year_built: p.year_built,
      condition: p.condition,
      has_elevator: p.has_elevator,
      parking: p.parking,
      has_balcony: p.has_balcony,
      has_storage: p.has_storage,
      is_accessible: p.is_accessible,
      ownership_type: p.ownership_type,
      vaad_bayit_monthly: p.vaad_bayit_monthly,
      premium_drivers: p.premium_drivers,
      premium_explanation: p.premium_explanation,
      featured_highlight: p.featured_highlight,
      original_price: p.original_price,
      created_at: p.created_at,
    },
    city_benchmarks: cityRow,
    comps: { count: compsCount, radius_m: radiusM, median_price_per_sqm: medianPpsm, sample },
    derived: {
      price_per_sqm: pricePerSqm,
      gap_vs_city_avg_pct: gapPct,
      gap_vs_comps_median_pct: compsGapPct,
      price_reduced_pct: priceReducedPct,
    },
  };
}

function validateOutput(text: string): string | null {
  let t = (text || '').trim().replace(/^["'`]|["'`]$/g, '').trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  for (const word of BANNED) {
    if (lower.includes(word)) return null;
  }
  if (t.length > MAX_CHARS) {
    // truncate to last sentence boundary within the cap
    const slice = t.slice(0, MAX_CHARS);
    const lastDot = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('? '), slice.lastIndexOf('! '));
    t = lastDot > 80 ? slice.slice(0, lastDot + 1) : slice;
  }
  return t;
}

async function callLovableAi(brief: Brief): Promise<string | null> {
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY missing');
    return null;
  }
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            'Write the buyer takeaway for this listing using only signals from the brief below. Output the takeaway only.\n\nBRIEF:\n' +
            JSON.stringify(brief),
        },
      ],
      temperature: 0.4,
      max_tokens: 200,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error('AI gateway error', res.status, txt.slice(0, 300));
    return null;
  }
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content as string | undefined;
  return text ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const propertyId = body?.property_id as string | undefined;
    const force = Boolean(body?.force);
    if (!propertyId || typeof propertyId !== 'string') {
      return new Response(JSON.stringify({ error: 'property_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

    const brief = await buildBrief(supa, propertyId);
    if (!brief) {
      // Property no longer exists (e.g. deleted while a stale page tab is open).
      // Return 200 with takeaway=null so the client can render gracefully without an error toast.
      return new Response(JSON.stringify({ takeaway: null, reason: 'property_not_found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const inputHash = await sha256(JSON.stringify(brief));

    // Check if already up-to-date
    const { data: existing } = await supa
      .from('properties')
      .select('ai_buyer_takeaway, ai_buyer_takeaway_input_hash')
      .eq('id', propertyId)
      .maybeSingle();

    if (
      !force &&
      existing?.ai_buyer_takeaway &&
      existing?.ai_buyer_takeaway_input_hash === inputHash
    ) {
      return new Response(
        JSON.stringify({ ok: true, cached: true, takeaway: existing.ai_buyer_takeaway }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const raw = await callLovableAi(brief);
    const takeaway = raw ? validateOutput(raw) : null;

    if (!takeaway) {
      return new Response(JSON.stringify({ ok: false, reason: 'generation_failed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: upErr } = await supa
      .from('properties')
      .update({
        ai_buyer_takeaway: takeaway,
        ai_buyer_takeaway_generated_at: new Date().toISOString(),
        ai_buyer_takeaway_input_hash: inputHash,
      })
      .eq('id', propertyId);

    if (upErr) {
      console.error('update error', upErr);
      return new Response(JSON.stringify({ ok: false, error: upErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, cached: false, takeaway }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-buyer-takeaway fatal', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
