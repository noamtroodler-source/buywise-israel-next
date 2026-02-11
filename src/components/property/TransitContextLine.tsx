import { TrainFront, Footprints, Bus, Car } from 'lucide-react';
import type { CityTransitInfo } from '@/hooks/useCityTransitInfo';

type TravelMode = 'walk' | 'transit' | 'drive';

interface TransitContextLineProps {
  transitInfo: CityTransitInfo;
  propertyLat?: number | null;
  propertyLng?: number | null;
  travelMode: TravelMode;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getTravelTime(distanceKm: number, mode: TravelMode): number {
  const times = {
    walk: distanceKm * 12,
    transit: distanceKm * 1.8 + 10,
    drive: distanceKm * 1.2 + 2,
  };
  return Math.round(times[mode]);
}

const modeLabels: Record<TravelMode, string> = { walk: 'walk', transit: 'transit', drive: 'drive' };
const modeIcons: Record<TravelMode, React.ComponentType<{ className?: string }>> = {
  walk: Footprints,
  transit: Bus,
  drive: Car,
};

export function TransitContextLine({ transitInfo, propertyLat, propertyLng, travelMode }: TransitContextLineProps) {
  if (!transitInfo.hasTrainStation) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrainFront className="h-4 w-4 shrink-0" />
        <span>No train station in {transitInfo.cityName} · Nearest access via bus</span>
      </div>
    );
  }

  const hasCoords = propertyLat != null && propertyLng != null &&
    transitInfo.trainStationLat != null && transitInfo.trainStationLng != null;

  if (!hasCoords) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrainFront className="h-4 w-4 shrink-0" />
        <span>{transitInfo.trainStationName}</span>
      </div>
    );
  }

  const distance = calculateDistance(
    propertyLat!, propertyLng!,
    transitInfo.trainStationLat!, transitInfo.trainStationLng!
  );
  const time = getTravelTime(distance, travelMode);
  const ModeIcon = modeIcons[travelMode];

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <TrainFront className="h-4 w-4 shrink-0" />
      <span>{transitInfo.trainStationName}</span>
      <span className="text-muted-foreground/60">·</span>
      <ModeIcon className="h-3.5 w-3.5 shrink-0" />
      <span className="font-medium text-foreground">{time} min</span>
      <span>{modeLabels[travelMode]} from here</span>
    </div>
  );
}
