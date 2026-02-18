import Stripe from 'https://esm.sh/stripe@18.5.0';
import { createClient } from 'npm:@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !data?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { entity_type, entity_id } = await req.json();
    if (!entity_type || !entity_id) {
      return new Response(JSON.stringify({ error: 'Missing entity_type or entity_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role to look up stripe_customer_id
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const { data: sub } = await adminSupabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return new Response(JSON.stringify({ invoices: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2025-08-27.basil',
    });

    const stripeInvoices = await stripe.invoices.list({
      customer: sub.stripe_customer_id,
      limit: 20,
    });

    const invoices = stripeInvoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number ?? '',
      created: inv.created,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status ?? 'unknown',
      description: inv.lines?.data?.[0]?.description ?? inv.description ?? '',
      invoice_pdf: inv.invoice_pdf ?? null,
    }));

    return new Response(JSON.stringify({ invoices }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[list-invoices] error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
