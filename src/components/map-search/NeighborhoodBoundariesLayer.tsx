import { useMemo } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LatLngExpression } from 'leaflet';

interface NeighborhoodBoundariesLayerProps {
  city: string | null;
  highlightedNeighborhood?: string | null;
}

interface NeighborhoodData {
  name: string;
  boundary_coords: [number, number][]; // [lat, lng]
}

export function NeighborhoodBoundariesLayer({ city, highlightedNeighborhood }: NeighborhoodBoundariesLayerProps) {
  const { data: neighborhoods = [] } = useQuery({
    queryKey: ['neighborhood-boundaries', city],
    queryFn: async (): Promise<NeighborhoodData[]> => {
      if (!city) return [];
      const { data, error } = await supabase
        .from('cities')
        .select('neighborhoods')
        .eq('name', city)
        .single();

      if (error || !data?.neighborhoods) return [];

      const raw = data.neighborhoods as any[];
      if (!Array.isArray(raw)) return [];

      return raw
        .filter((n: any) => n.name && Array.isArray(n.boundary_coords) && n.boundary_coords.length >= 3)
        .map((n: any) => ({
          name: n.name as string,
          boundary_coords: n.boundary_coords as [number, number][],
        }));
    },
    enabled: !!city,
    staleTime: 10 * 60 * 1000,
  });

  const polygons = useMemo(() => {
    return neighborhoods.map((n) => ({
      name: n.name,
      positions: n.boundary_coords as LatLngExpression[],
      isHighlighted: n.name === highlightedNeighborhood,
    }));
  }, [neighborhoods, highlightedNeighborhood]);

  return (
    <>
      {polygons.map((p) => (
        <Polygon
          key={p.name}
          positions={p.positions}
          pathOptions={{
            color: p.isHighlighted ? 'hsl(213, 94%, 45%)' : 'hsl(213, 94%, 60%)',
            fillOpacity: p.isHighlighted ? 0.25 : 0.1,
            weight: p.isHighlighted ? 3 : 1.5,
          }}
        >
          <Tooltip sticky direction="center" className="text-xs font-medium">
            {p.name}
          </Tooltip>
        </Polygon>
      ))}
    </>
  );
}
