import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OverpassElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
  members?: Array<{
    type: string;
    ref: number;
    role: string;
    geometry?: Array<{ lat: number; lon: number }>;
  }>;
}

interface NeighborhoodData {
  name: string;
  name_he?: string;
  boundary_coords: [number, number][]; // [lat, lng]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city_slug, city_name_he } = await req.json();

    if (!city_slug) {
      return new Response(
        JSON.stringify({ error: 'city_slug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the city from database to find its center coordinates
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id, name, center_lat, center_lng, neighborhoods')
      .eq('slug', city_slug)
      .single();

    if (cityError || !city) {
      return new Response(
        JSON.stringify({ error: 'City not found', details: cityError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching boundaries for ${city.name} (${city_slug})`);

    // Query Overpass API for neighborhood boundaries
    // Using a radius search from city center for more accurate results
    const lat = city.center_lat || 32.18;
    const lng = city.center_lng || 34.87;
    const radiusKm = 5; // 5km radius from city center
    
    // Overpass query to find neighborhoods around the city center
    const overpassQuery = `
      [out:json][timeout:60];
      (
        way["place"="neighbourhood"](around:${radiusKm * 1000},${lat},${lng});
        relation["place"="neighbourhood"](around:${radiusKm * 1000},${lat},${lng});
        way["place"="quarter"](around:${radiusKm * 1000},${lat},${lng});
        relation["place"="quarter"](around:${radiusKm * 1000},${lat},${lng});
        way["place"="suburb"](around:${radiusKm * 1000},${lat},${lng});
        relation["place"="suburb"](around:${radiusKm * 1000},${lat},${lng});
      );
      out geom;
    `;

    console.log('Overpass query:', overpassQuery);

    const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!overpassResponse.ok) {
      const errorText = await overpassResponse.text();
      console.error('Overpass API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Overpass API error', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const overpassData = await overpassResponse.json();
    console.log(`Found ${overpassData.elements?.length || 0} elements from OSM`);

    // Process the OSM data into neighborhood boundaries
    const neighborhoods: NeighborhoodData[] = [];

    for (const element of overpassData.elements || []) {
      const name = element.tags?.name || element.tags?.['name:en'];
      const nameHe = element.tags?.['name:he'];
      
      if (!name) continue;

      let coords: [number, number][] = [];

      if (element.type === 'way' && element.geometry) {
        // Way has direct geometry
        coords = element.geometry.map((p: { lat: number; lon: number }) => [p.lat, p.lon]);
      } else if (element.type === 'relation' && element.members) {
        // Relation - combine outer ways
        const outerWays = element.members.filter((m: any) => m.role === 'outer' && m.geometry);
        for (const way of outerWays) {
          if (way.geometry) {
            coords.push(...way.geometry.map((p: { lat: number; lon: number }) => [p.lat, p.lon]));
          }
        }
      }

      // Only include if we have at least 3 points (minimum for a polygon)
      if (coords.length >= 3) {
        neighborhoods.push({
          name: name,
          name_he: nameHe,
          boundary_coords: coords,
        });
        console.log(`Processed neighborhood: ${name} with ${coords.length} points`);
      }
    }

    console.log(`Processed ${neighborhoods.length} neighborhoods with boundaries`);

    // Merge with existing neighborhood data (preserve descriptions, etc.)
    const existingNeighborhoods = (city.neighborhoods as any[]) || [];
    const mergedNeighborhoods = existingNeighborhoods.map((existing: any) => {
      // Find matching boundary data by name
      const boundaryData = neighborhoods.find(
        n => n.name.toLowerCase() === existing.name?.toLowerCase() ||
             n.name_he === existing.name_he
      );
      
      if (boundaryData) {
        return {
          ...existing,
          boundary_coords: boundaryData.boundary_coords,
        };
      }
      return existing;
    });

    // Add any new neighborhoods not already in the list
    for (const newHood of neighborhoods) {
      const exists = mergedNeighborhoods.some(
        (e: any) => e.name?.toLowerCase() === newHood.name.toLowerCase()
      );
      if (!exists) {
        mergedNeighborhoods.push({
          name: newHood.name,
          name_he: newHood.name_he,
          boundary_coords: newHood.boundary_coords,
        });
      }
    }

    // Update the city with the new neighborhood data
    const { error: updateError } = await supabase
      .from('cities')
      .update({ neighborhoods: mergedNeighborhoods })
      .eq('id', city.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update city', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        city: city.name,
        neighborhoods_found: neighborhoods.length,
        neighborhoods_merged: mergedNeighborhoods.length,
        sample: neighborhoods.slice(0, 3).map(n => ({
          name: n.name,
          points: n.boundary_coords.length,
        })),
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
