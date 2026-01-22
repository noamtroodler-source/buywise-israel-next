import { Home, Briefcase, Heart, Star, Building2, Car, Train, Footprints, LucideIcon } from 'lucide-react';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { useAuth } from '@/hooks/useAuth';
import { SavedLocation, LocationIcon } from '@/types/savedLocation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type TravelMode = 'walk' | 'transit' | 'drive';

interface SavedLocationsSectionProps {
  propertyLat: number;
  propertyLng: number;
  travelMode: TravelMode;
}

const iconMap: Record<LocationIcon, LucideIcon> = {
  home: Home,
  briefcase: Briefcase,
  heart: Heart,
  star: Star,
  building: Building2,
};

// Calculate distance using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get travel time based on distance and mode
function getTravelTime(
  distanceKm: number,
  mode: TravelMode
): { time: number; Icon: LucideIcon; label: string } | null {
  const speeds: Record<TravelMode, number> = {
    walk: 5,      // 5 km/h walking
    transit: 25,  // 25 km/h average including wait
    drive: 40,    // 40 km/h average urban driving
  };

  const icons: Record<TravelMode, LucideIcon> = {
    walk: Footprints,
    transit: Train,
    drive: Car,
  };

  const labels: Record<TravelMode, string> = {
    walk: 'walk',
    transit: 'transit',
    drive: 'drive',
  };

  const timeMinutes = Math.round((distanceKm / speeds[mode]) * 60);

  // Max reasonable times for each mode
  const maxTimes: Record<TravelMode, number> = {
    walk: 60,     // Max 60 min walk
    transit: 120, // Max 2 hours transit
    drive: 180,   // Max 3 hours drive
  };

  if (timeMinutes > maxTimes[mode]) {
    return null;
  }

  return {
    time: timeMinutes,
    Icon: icons[mode],
    label: labels[mode],
  };
}

function SavedLocationRow({
  location,
  propertyLat,
  propertyLng,
  travelMode,
}: {
  location: SavedLocation;
  propertyLat: number;
  propertyLng: number;
  travelMode: TravelMode;
}) {
  const IconComponent = iconMap[location.icon] || Building2;
  const distance = calculateDistance(propertyLat, propertyLng, location.latitude, location.longitude);
  
  // Try the selected mode first, then fall back
  let travelInfo = getTravelTime(distance, travelMode);
  let actualMode = travelMode;
  
  if (!travelInfo && travelMode !== 'drive') {
    travelInfo = getTravelTime(distance, 'drive');
    actualMode = 'drive';
  }

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <IconComponent className="h-4 w-4 text-primary" />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-medium text-sm truncate max-w-[120px]">
                {location.label}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{location.address}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {travelInfo ? (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <travelInfo.Icon className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{travelInfo.time} min</span>
          <span className="text-xs">{travelInfo.label}</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">Too far</span>
      )}
    </div>
  );
}

export function SavedLocationsSection({
  propertyLat,
  propertyLng,
  travelMode,
}: SavedLocationsSectionProps) {
  const { user } = useAuth();
  const { data: locations = [], isLoading } = useSavedLocations();

  // Don't render if not logged in or no locations
  if (!user || isLoading || locations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-foreground">Your Saved Locations</h4>
      <div className="space-y-1.5">
        {locations.map((location) => (
          <SavedLocationRow
            key={location.id}
            location={location}
            propertyLat={propertyLat}
            propertyLng={propertyLng}
            travelMode={travelMode}
          />
        ))}
      </div>
    </div>
  );
}
