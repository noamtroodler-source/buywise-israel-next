import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyId, guestId, action } = await req.json();

    // Validate required fields
    if (!propertyId || !guestId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: propertyId, guestId, action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate guestId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(guestId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid guest ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate propertyId is a valid UUID
    if (!uuidRegex.test(propertyId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid property ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate action
    if (action !== 'save' && action !== 'unsave') {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "save" or "unsave"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (action === 'save') {
      const { error } = await supabaseAdmin
        .from('guest_property_saves')
        .upsert(
          { property_id: propertyId, guest_id: guestId },
          { onConflict: 'property_id,guest_id' }
        );

      if (error) {
        console.error('Error saving property:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to save property' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, action: 'saved' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // action === 'unsave'
      const { error } = await supabaseAdmin
        .from('guest_property_saves')
        .delete()
        .eq('property_id', propertyId)
        .eq('guest_id', guestId);

      if (error) {
        console.error('Error removing save:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to remove save' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, action: 'unsaved' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
