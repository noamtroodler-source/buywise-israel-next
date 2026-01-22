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
    <div className="bg-muted/30 border border-border/40 rounded-xl p-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-2.5">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <IconComponent className="h-4 w-4 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="font-medium text-foreground text-sm leading-tight truncate">
                  {location.label}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{location.address}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="text-xs text-muted-foreground mt-0.5">Saved</p>
          
          {travelInfo ? (
            <div className="flex items-center gap-1.5 mt-2 text-sm">
              <travelInfo.Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">{travelInfo.time} min</span>
              <span className="text-muted-foreground">{travelInfo.label}</span>
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs mt-2 text-muted-foreground/70 italic cursor-help">
                    3+ hours away
                  </p>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[180px]">
                  <p className="text-xs">
                    Over 3 hours from this property. Check Google Maps for directions.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
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

  // Return grid items directly (no wrapper) to integrate into parent grid
  return (
    <>
      {locations.map((location) => (
        <SavedLocationRow
          key={location.id}
          location={location}
          propertyLat={propertyLat}
          propertyLng={propertyLng}
          travelMode={travelMode}
        />
      ))}
    </>
  );
}
