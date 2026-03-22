import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NeighborhoodBoundariesLayerProps {
  map: google.maps.Map;
  city: string | null;
  highlightedNeighborhood?: string | null;
  onNeighborhoodClick?: (name: string) => void;
}

interface BoundaryRow {
  neighborhood: string;
  geojson_coords: number[][][] | number[][][][];
  geom_type: string;
}

function computeCentroid(coords: Array<{ lat: number; lng: number }>): { lat: number; lng: number } {
  let latSum = 0, lngSum = 0;
  for (const c of coords) { latSum += c.lat; lngSum += c.lng; }
  return { lat: latSum / coords.length, lng: lngSum / coords.length };
}

/** Convert GeoJSON coordinates to Google Maps LatLng paths */
function toGooglePaths(coords: number[][][] | number[][][][], geomType: string): Array<{ lat: number; lng: number }>[] {
  if (geomType === 'MultiPolygon') {
    // coords is number[][][][] — array of polygons, each with rings
    return (coords as number[][][][]).map(polygon => 
      polygon[0].map(([lng, lat]) => ({ lat, lng }))
    );
  }
  // Polygon — coords is number[][][] — array of rings
  return [(coords as number[][][])[0].map(([lng, lat]) => ({ lat, lng }))];
}

export function NeighborhoodBoundariesLayer({ map, city, highlightedNeighborhood, onNeighborhoodClick }: NeighborhoodBoundariesLayerProps) {
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const labelsRef = useRef<google.maps.Marker[]>([]);
  const hoveredRef = useRef<string | null>(null);

  const { data: boundaries = [] } = useQuery({
    queryKey: ['neighborhood-boundaries', city],
    queryFn: async (): Promise<BoundaryRow[]> => {
      if (!city) return [];
      const { data, error } = await supabase
        .from('neighborhood_boundaries')
        .select('neighborhood, geojson_coords, geom_type')
        .eq('city', city);

      if (error || !data) return [];
      return data as BoundaryRow[];
    },
    enabled: !!city,
    staleTime: 30 * 60 * 1000,
  });

  const getStyle = useCallback((name: string, isHovered: boolean) => {
    const isHighlighted = name === highlightedNeighborhood;
    const active = isHighlighted || isHovered;
    return {
      strokeColor: active ? 'hsl(213, 70%, 45%)' : 'hsl(213, 20%, 65%)',
      strokeWeight: active ? 1.8 : 0.7,
      strokeOpacity: active ? 0.7 : 0.35,
      fillColor: active ? 'hsl(213, 60%, 55%)' : 'hsl(213, 30%, 70%)',
      fillOpacity: active ? 0.12 : 0.02,
    };
  }, [highlightedNeighborhood]);

  useEffect(() => {
    // Clear old
    polygonsRef.current.forEach(p => p.setMap(null));
    polygonsRef.current = [];
    labelsRef.current.forEach(m => m.setMap(null));
    labelsRef.current = [];

    if (!boundaries.length) return;

    boundaries.forEach((b) => {
      const paths = toGooglePaths(b.geojson_coords, b.geom_type);
      const style = getStyle(b.neighborhood, false);

      // For MultiPolygon, create a polygon per sub-polygon
      paths.forEach((path, pathIdx) => {
        const polygon = new google.maps.Polygon({
          paths: path,
          ...style,
          map,
          zIndex: b.neighborhood === highlightedNeighborhood ? 2 : 1,
        });

        polygon.addListener('mouseover', () => {
          hoveredRef.current = b.neighborhood;
          const hStyle = getStyle(b.neighborhood, true);
          polygon.setOptions(hStyle);
        });

        polygon.addListener('mouseout', () => {
          hoveredRef.current = null;
          const nStyle = getStyle(b.neighborhood, false);
          polygon.setOptions(nStyle);
        });

        polygon.addListener('click', () => {
          onNeighborhoodClick?.(b.neighborhood);
        });

        polygonsRef.current.push(polygon);

        // Add label only for first path of each neighborhood
        if (pathIdx === 0) {
          const centroid = computeCentroid(path);
          const label = new google.maps.Marker({
            position: centroid,
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 0,
            },
            label: {
              text: b.neighborhood,
              color: 'hsl(213, 10%, 58%)',
              fontSize: '9px',
              fontWeight: '400',
              className: 'neighborhood-label',
            },
            clickable: false,
            zIndex: 3,
          });
          labelsRef.current.push(label);
        }
      });
    });

    return () => {
      polygonsRef.current.forEach(p => p.setMap(null));
      polygonsRef.current = [];
      labelsRef.current.forEach(m => m.setMap(null));
      labelsRef.current = [];
    };
  }, [map, boundaries, highlightedNeighborhood, getStyle, onNeighborhoodClick]);

  // Show/hide labels based on zoom
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('zoom_changed', () => {
      const z = map.getZoom() ?? 0;
      const visible = z >= 15;
      labelsRef.current.forEach(m => m.setVisible(visible));
    });
    // Set initial visibility
    const z = map.getZoom() ?? 0;
    labelsRef.current.forEach(m => m.setVisible(z >= 15));
    return () => google.maps.event.removeListener(listener);
  }, [map, boundaries]);

  return null;
}
