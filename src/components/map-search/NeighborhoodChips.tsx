import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NeighborhoodChipsProps {
  city: string | null;
  map: google.maps.Map | null;
  selectedNeighborhood: string | null;
  onSelect: (name: string | null) => void;
  onFilterNeighborhood?: (name: string | null) => void;
}

export function NeighborhoodChips({ city, map, selectedNeighborhood, onSelect, onFilterNeighborhood }: NeighborhoodChipsProps) {
  const { data: neighborhoods = [] } = useQuery({
    queryKey: ['neighborhood-names', city],
    queryFn: async () => {
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
          center: getCentroid(n.boundary_coords as [number, number][]),
        }));
    },
    enabled: !!city,
    staleTime: 10 * 60 * 1000,
  });

  if (neighborhoods.length === 0) return null;

  const handleClick = (n: { name: string; center: [number, number] }) => {
    if (selectedNeighborhood === n.name) {
      onSelect(null);
    } else {
      onSelect(n.name);
      map?.panTo({ lat: n.center[0], lng: n.center[1] });
      map?.setZoom(15);
    }
  };

  return (
    <div className="neighborhood-bar">
      {neighborhoods.map((n) => (
        <button
          key={n.name}
          className={`neighborhood-chip ${selectedNeighborhood === n.name ? 'selected' : ''}`}
          onClick={() => handleClick(n)}
        >
          {n.name}
        </button>
      ))}
    </div>
  );
}

function getCentroid(coords: [number, number][]): [number, number] {
  let latSum = 0, lngSum = 0;
  for (const [lat, lng] of coords) {
    latSum += lat;
    lngSum += lng;
  }
  return [latSum / coords.length, lngSum / coords.length];
}
