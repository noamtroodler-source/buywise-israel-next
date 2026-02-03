import { useMemo } from 'react';
import { useCities } from '@/hooks/useCities';
import { boundsContainPoint } from '@/lib/utils/geometry';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MapBounds } from './MapSearchLayout';
import type { Neighborhood } from '@/types/content';

interface NeighborhoodChipsProps {
  visible: boolean;
  mapBounds: MapBounds | null;
  selectedNeighborhoods: string[];
  onNeighborhoodToggle: (neighborhood: string) => void;
  onClearNeighborhoods: () => void;
}

export function NeighborhoodChips({
  visible,
  mapBounds,
  selectedNeighborhoods,
  onNeighborhoodToggle,
  onClearNeighborhoods,
}: NeighborhoodChipsProps) {
  const { data: cities } = useCities();

  // Find which city we're viewing (if any)
  const currentCity = useMemo(() => {
    if (!cities || !mapBounds) return null;

    // Find city whose center is within current map bounds
    for (const city of cities) {
      if (city.center_lat && city.center_lng) {
        if (boundsContainPoint(mapBounds, [city.center_lat, city.center_lng])) {
          return city;
        }
      }
    }
    return null;
  }, [cities, mapBounds]);

  // Extract neighborhoods from current city
  const neighborhoods = useMemo(() => {
    if (!currentCity?.neighborhoods) return [];

    // neighborhoods is stored as JSONB - could be array or unknown
    const hoods = currentCity.neighborhoods as Neighborhood[] | unknown;
    
    if (Array.isArray(hoods)) {
      return hoods.filter((n): n is Neighborhood => 
        typeof n === 'object' && n !== null && 'name' in n
      );
    }
    
    return [];
  }, [currentCity]);

  if (!visible || neighborhoods.length === 0) return null;

  return (
    <div className="neighborhood-bar">
      {selectedNeighborhoods.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
          onClick={onClearNeighborhoods}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      {neighborhoods.map((neighborhood) => (
        <button
          key={neighborhood.name}
          className={cn(
            'neighborhood-chip',
            selectedNeighborhoods.includes(neighborhood.name) && 'selected'
          )}
          onClick={() => onNeighborhoodToggle(neighborhood.name)}
          title={neighborhood.description}
        >
          {neighborhood.name}
        </button>
      ))}
    </div>
  );
}
