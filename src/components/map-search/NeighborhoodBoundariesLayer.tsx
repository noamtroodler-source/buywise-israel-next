import { useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NeighborhoodBoundariesLayerProps {
  map: google.maps.Map;
  city: string | null;
  highlightedNeighborhood?: string | null;
}

interface NeighborhoodData {
  name: string;
  boundary_coords: [number, number][]; // [lat, lng]
}

export function NeighborhoodBoundariesLayer({ map, city, highlightedNeighborhood }: NeighborhoodBoundariesLayerProps) {
  const polygonsRef = useRef<google.maps.Polygon[]>([]);

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

  useEffect(() => {
    // Clear old polygons
    polygonsRef.current.forEach(p => p.setMap(null));
    polygonsRef.current = [];

    neighborhoods.forEach((n) => {
      const isHighlighted = n.name === highlightedNeighborhood;
      const polygon = new google.maps.Polygon({
        paths: n.boundary_coords.map(([lat, lng]) => ({ lat, lng })),
        strokeColor: isHighlighted ? 'hsl(213, 94%, 45%)' : 'hsl(213, 94%, 60%)',
        strokeWeight: isHighlighted ? 3 : 1.5,
        fillColor: 'hsl(213, 94%, 60%)',
        fillOpacity: isHighlighted ? 0.25 : 0.1,
        map,
      });
      polygonsRef.current.push(polygon);
    });

    return () => {
      polygonsRef.current.forEach(p => p.setMap(null));
      polygonsRef.current = [];
    };
  }, [map, neighborhoods, highlightedNeighborhood]);

  return null;
}
