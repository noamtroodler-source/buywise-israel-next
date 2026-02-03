import { useMemo } from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import { SavedLocation } from '@/types/savedLocation';
import { Property } from '@/types/database';
import { getDistanceInMeters } from '@/lib/utils/geometry';
import { Car, TrainFront, Footprints } from 'lucide-react';

interface CommuteLinesProps {
  property: Property | null;
  savedLocations: SavedLocation[];
  preferredMode?: 'drive' | 'transit' | 'walk';
}

// Travel time calculation (matches SavedLocationsSection.tsx)
function calculateTravelTime(distanceKm: number, mode: 'walk' | 'transit' | 'drive'): number {
  switch (mode) {
    case 'walk':
      return Math.round(distanceKm * 12); // ~5 km/h walking
    case 'transit':
      return Math.round(distanceKm * 1.8 + 10); // ~33 km/h avg + 10 min wait
    case 'drive':
      return Math.round(distanceKm * 1.2 + 2); // ~50 km/h avg + 2 min parking
  }
}

// Get best mode based on distance
function getBestMode(distanceKm: number): 'walk' | 'transit' | 'drive' {
  if (distanceKm <= 1.5) return 'walk';
  if (distanceKm <= 10) return 'transit';
  return 'drive';
}

// Mode colors
const MODE_COLORS = {
  walk: '#22c55e', // green-500
  transit: '#3b82f6', // blue-500
  drive: '#64748b', // slate-500
};

export function CommuteLines({ property, savedLocations, preferredMode }: CommuteLinesProps) {
  const lines = useMemo(() => {
    if (!property || !property.latitude || !property.longitude) return [];
    if (savedLocations.length === 0) return [];

    return savedLocations.map((location) => {
      // Calculate distance
      const distanceMeters = getDistanceInMeters(
        [property.longitude!, property.latitude!],
        [location.longitude, location.latitude]
      );
      const distanceKm = distanceMeters / 1000;
      
      // Determine mode
      const mode = preferredMode || getBestMode(distanceKm);
      const travelTime = calculateTravelTime(distanceKm, mode);
      
      // Calculate midpoint for tooltip
      const midLat = (property.latitude! + location.latitude) / 2;
      const midLng = (property.longitude! + location.longitude) / 2;
      
      return {
        id: location.id,
        label: location.label,
        positions: [
          [property.latitude!, property.longitude!] as [number, number],
          [location.latitude, location.longitude] as [number, number],
        ],
        midpoint: [midLat, midLng] as [number, number],
        mode,
        travelTime,
        distanceKm,
        color: MODE_COLORS[mode],
      };
    });
  }, [property, savedLocations, preferredMode]);

  if (lines.length === 0) return null;

  return (
    <>
      {lines.map((line) => (
        <Polyline
          key={line.id}
          positions={line.positions}
          pathOptions={{
            color: line.color,
            weight: 3,
            opacity: 0.7,
            dashArray: '8, 8',
            lineCap: 'round',
            lineJoin: 'round',
          }}
        >
          <Tooltip
            direction="center"
            offset={[0, 0]}
            permanent
            className={`commute-line-tooltip ${line.mode}`}
          >
            <span className="flex items-center gap-1">
              {line.mode === 'walk' && '🚶'}
              {line.mode === 'transit' && '🚇'}
              {line.mode === 'drive' && '🚗'}
              <span>{line.travelTime} min</span>
            </span>
          </Tooltip>
        </Polyline>
      ))}
    </>
  );
}

// Compact commute info for popup
interface CommuteInfoProps {
  property: Property;
  savedLocations: SavedLocation[];
}

export function CommuteInfo({ property, savedLocations }: CommuteInfoProps) {
  const commutes = useMemo(() => {
    if (!property.latitude || !property.longitude) return [];
    
    return savedLocations.map((location) => {
      const distanceMeters = getDistanceInMeters(
        [property.longitude!, property.latitude!],
        [location.longitude, location.latitude]
      );
      const distanceKm = distanceMeters / 1000;
      const mode = getBestMode(distanceKm);
      const travelTime = calculateTravelTime(distanceKm, mode);
      
      return {
        id: location.id,
        label: location.label,
        mode,
        travelTime,
        distanceKm,
      };
    }).sort((a, b) => a.travelTime - b.travelTime);
  }, [property, savedLocations]);

  if (commutes.length === 0) return null;

  const closest = commutes[0];

  return (
    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
      <div className="flex items-center gap-1">
        {closest.mode === 'walk' && <Footprints className="h-3 w-3" />}
        {closest.mode === 'transit' && <TrainFront className="h-3 w-3" />}
        {closest.mode === 'drive' && <Car className="h-3 w-3" />}
        <span>
          {closest.travelTime} min to {closest.label}
        </span>
      </div>
      {commutes.length > 1 && (
        <p className="text-[10px] opacity-70 mt-0.5">
          + {commutes.length - 1} more saved place{commutes.length > 2 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
