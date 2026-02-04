import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NeighborhoodData {
  name: string;
  name_he?: string;
  boundary_coords: [number, number][];
}

interface CityNeighborhoodUpdate {
  slug: string;
  neighborhoods: NeighborhoodData[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cities } = await req.json() as { cities: CityNeighborhoodUpdate[] };

    if (!cities || !Array.isArray(cities)) {
      return new Response(
        JSON.stringify({ error: 'cities array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: { slug: string; success: boolean; neighborhoods_count: number; error?: string }[] = [];

    for (const cityData of cities) {
      const { slug, neighborhoods } = cityData;

      if (!slug || !neighborhoods) {
        results.push({ slug: slug || 'unknown', success: false, neighborhoods_count: 0, error: 'Missing slug or neighborhoods' });
        continue;
      }

      // Update the city with the new neighborhood data
      const { error: updateError } = await supabase
        .from('cities')
        .update({ neighborhoods: neighborhoods })
        .eq('slug', slug);

      if (updateError) {
        console.error(`Error updating ${slug}:`, updateError);
        results.push({ slug, success: false, neighborhoods_count: 0, error: updateError.message });
      } else {
        console.log(`Updated ${slug} with ${neighborhoods.length} neighborhoods`);
        results.push({ slug, success: true, neighborhoods_count: neighborhoods.length });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalNeighborhoods = results.filter(r => r.success).reduce((sum, r) => sum + r.neighborhoods_count, 0);

    return new Response(
      JSON.stringify({
        success: true,
        cities_updated: successCount,
        cities_failed: results.length - successCount,
        total_neighborhoods: totalNeighborhoods,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
