import { useMemo } from 'react';
import { Marker, useMap } from '@/vendor/react-leaflet';
import L from 'leaflet';
import { useCities } from '@/hooks/useCities';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ListingStatus } from '@/types/database';

interface CityOverlayProps {
  visible: boolean;
  listingStatus: ListingStatus;
  onCityClick: (cityName: string, center: [number, number]) => void;
}

export function CityOverlay({ visible, listingStatus, onCityClick }: CityOverlayProps) {
  const map = useMap();
  const { data: cities } = useCities();

  // Fetch property counts per city
  const { data: cityCounts } = useQuery({
    queryKey: ['city-property-counts', listingStatus],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('city')
        .eq('listing_status', listingStatus)
        .eq('is_published', true);

      if (error) throw error;

      // Count properties per city
      const counts: Record<string, number> = {};
      data?.forEach((p) => {
        if (p.city) {
          counts[p.city] = (counts[p.city] || 0) + 1;
        }
      });
      return counts;
    },
    staleTime: 60000, // 1 minute
  });

  // Create city markers with coordinates
  const cityMarkers = useMemo(() => {
    if (!cities || !visible) return [];

    return cities
      .filter((city) => city.center_lat && city.center_lng)
      .map((city) => ({
        id: city.id,
        name: city.name,
        center: [city.center_lat!, city.center_lng!] as [number, number],
        count: cityCounts?.[city.name] || 0,
      }))
      .filter((city) => city.count > 0); // Only show cities with properties
  }, [cities, cityCounts, visible]);

  if (!visible) return null;

  return (
    <>
      {cityMarkers.map((city) => (
        <CityMarker
          key={city.id}
          name={city.name}
          center={city.center}
          count={city.count}
          onClick={() => {
            // Zoom to city at level 13
            map.flyTo(city.center, 13, { duration: 1 });
            onCityClick(city.name, city.center);
          }}
        />
      ))}
    </>
  );
}

interface CityMarkerProps {
  name: string;
  center: [number, number];
  count: number;
  onClick: () => void;
}

function CityMarker({ name, center, count, onClick }: CityMarkerProps) {
  const icon = useMemo(() => {
    return L.divIcon({
      html: `
        <div class="city-overlay-marker">
          <span class="city-name">${name}</span>
          <span class="city-count">${count}</span>
        </div>
      `,
      className: '',
      iconSize: L.point(0, 0), // Let CSS handle sizing
      iconAnchor: L.point(0, 0),
    });
  }, [name, count]);

  return (
    <Marker
      position={center}
      icon={icon}
      eventHandlers={{
        click: onClick,
      }}
    />
  );
}
