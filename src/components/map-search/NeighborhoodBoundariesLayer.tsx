import { useEffect, useRef, useCallback, useState } from 'react';
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
    return (coords as number[][][][]).map(polygon => 
      polygon[0].map(([lng, lat]) => ({ lat, lng }))
    );
  }
  return [(coords as number[][][])[0].map(([lng, lat]) => ({ lat, lng }))];
}

export function NeighborhoodBoundariesLayer({ map, city, highlightedNeighborhood, onNeighborhoodClick }: NeighborhoodBoundariesLayerProps) {
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const [, forceUpdate] = useState(0);

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

  // Create/destroy tooltip div
  useEffect(() => {
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 10000;
      background: hsl(0 0% 100% / 0.95);
      backdrop-filter: blur(4px);
      color: hsl(213, 20%, 25%);
      font-size: 11px;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      white-space: nowrap;
      display: none;
      font-family: Inter, system-ui, sans-serif;
    `;
    document.body.appendChild(tooltip);
    tooltipRef.current = tooltip;
    return () => {
      document.body.removeChild(tooltip);
      tooltipRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Clear old
    polygonsRef.current.forEach(p => p.setMap(null));
    polygonsRef.current = [];

    if (!boundaries.length) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (tooltipRef.current && hoveredRef.current) {
        tooltipRef.current.style.left = `${e.clientX + 12}px`;
        tooltipRef.current.style.top = `${e.clientY - 28}px`;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    boundaries.forEach((b) => {
      const paths = toGooglePaths(b.geojson_coords, b.geom_type);
      const style = getStyle(b.neighborhood, false);

      paths.forEach((path) => {
        const polygon = new google.maps.Polygon({
          paths: path,
          ...style,
          map,
          zIndex: b.neighborhood === highlightedNeighborhood ? 2 : 1,
        });

        polygon.addListener('mouseover', () => {
          hoveredRef.current = b.neighborhood;
          polygon.setOptions(getStyle(b.neighborhood, true));
          if (tooltipRef.current) {
            tooltipRef.current.textContent = b.neighborhood;
            tooltipRef.current.style.display = 'block';
          }
        });

        polygon.addListener('mouseout', () => {
          hoveredRef.current = null;
          polygon.setOptions(getStyle(b.neighborhood, false));
          if (tooltipRef.current) {
            tooltipRef.current.style.display = 'none';
          }
        });

        polygon.addListener('click', () => {
          onNeighborhoodClick?.(b.neighborhood);
        });

        polygonsRef.current.push(polygon);
      });
    });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      polygonsRef.current.forEach(p => p.setMap(null));
      polygonsRef.current = [];
      if (tooltipRef.current) tooltipRef.current.style.display = 'none';
    };
  }, [map, boundaries, highlightedNeighborhood, getStyle, onNeighborhoodClick]);

  return null;
}
