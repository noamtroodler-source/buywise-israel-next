import { useMemo } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import { useCities } from '@/hooks/useCities';

interface NeighborhoodBoundariesLayerProps {
  visible: boolean;
  currentCity: string | null;
}

// Note: This layer requires neighborhood boundary coordinates to be stored in the cities.neighborhoods JSONB.
// If boundary_coords are not available, the layer gracefully shows nothing.
export function NeighborhoodBoundariesLayer({ visible, currentCity }: NeighborhoodBoundariesLayerProps) {
  const { data: cities } = useCities();

  const neighborhoods = useMemo(() => {
    if (!visible || !currentCity || !cities) return [];
    
    const city = cities.find(c => c.name === currentCity);
    if (!city?.neighborhoods) return [];
    
    // Filter neighborhoods that have boundary coordinates
    const hoods = city.neighborhoods as any[];
    if (!Array.isArray(hoods)) return [];
    
    return hoods.filter(n => n.boundary_coords && Array.isArray(n.boundary_coords) && n.boundary_coords.length >= 3);
  }, [visible, currentCity, cities]);

  if (!visible || neighborhoods.length === 0) return null;

  return (
    <>
      {neighborhoods.map((hood) => (
        <Polygon
          key={hood.name}
          positions={hood.boundary_coords}
          pathOptions={{
            color: 'hsl(213, 94%, 45%)',
            fillColor: 'hsl(213, 94%, 45%)',
            fillOpacity: 0.05,
            weight: 1.5,
            dashArray: '4, 4',
          }}
        >
          <Tooltip permanent direction="center" className="neighborhood-boundary-label">
            {hood.name}
          </Tooltip>
        </Polygon>
      ))}
    </>
  );
}
