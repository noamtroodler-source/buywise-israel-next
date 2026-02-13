import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LatLngBounds, Map as LeafletMap } from 'leaflet';

interface CityOverlayLayerProps {
  bounds: LatLngBounds | null;
  listingStatus: string;
  map: LeafletMap | null;
  onCityClick?: (city: string) => void;
}

interface CityCount {
  city: string;
  count: number;
  lat: number;
  lng: number;
}

function sizeTier(count: number): string {
  if (count >= 50) return 'large';
  if (count >= 15) return 'medium';
  return 'small';
}

export function CityOverlayLayer({ bounds, listingStatus, map, onCityClick }: CityOverlayLayerProps) {
  // Fetch property counts per city
  const { data: cityCounts = [] } = useQuery({
    queryKey: ['city-property-counts', listingStatus],
    queryFn: async (): Promise<CityCount[]> => {
      // Get counts
      const { data: counts, error } = await supabase.rpc('get_city_property_counts', {
        p_listing_status: listingStatus,
      });
      if (error || !counts) return [];

      // Get city centers
      const { data: cities } = await supabase
        .from('cities')
        .select('name, center_lat, center_lng')
        .not('center_lat', 'is', null);

      if (!cities) return [];

      const centerMap = new Map(cities.map((c) => [c.name, { lat: c.center_lat!, lng: c.center_lng! }]));

      return counts
        .filter((c) => centerMap.has(c.city) && c.count > 0)
        .map((c) => ({
          city: c.city,
          count: c.count,
          lat: centerMap.get(c.city)!.lat,
          lng: centerMap.get(c.city)!.lng,
        }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const visibleCities = useMemo(() => {
    if (!bounds) return cityCounts;
    return cityCounts.filter((c) => bounds.contains([c.lat, c.lng]));
  }, [cityCounts, bounds]);

  return (
    <>
      {visibleCities.map((city) => {
        const tier = sizeTier(city.count);
        const icon = L.divIcon({
          className: '',
          html: `<div class="city-marker-pill ${tier}">
            <span class="city-label">${city.city}</span>
            <span class="city-divider">•</span>
            <span class="city-count">${city.count}</span>
          </div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        return (
          <Marker
            key={city.city}
            position={[city.lat, city.lng]}
            icon={icon}
            eventHandlers={{
              click: () => {
                map?.flyTo([city.lat, city.lng], 13, { duration: 1.2 });
                onCityClick?.(city.city);
              },
            }}
          />
        );
      })}
    </>
  );
}
