import { MapPin, Footprints, Bus, Car, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SearchedLocation } from './LocationSearchInput';

type TravelMode = 'walk' | 'transit' | 'drive';

interface SearchedLocationCardProps {
  location: SearchedLocation;
  propertyLat?: number | null;
  propertyLng?: number | null;
  travelMode: TravelMode;
  onRemove: () => void;
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get travel time based on mode and distance
function getTravelTime(distanceKm: number, mode: TravelMode) {
  const times = {
    walk: distanceKm * 12,           // ~5 km/h walking speed
    transit: distanceKm * 1.8 + 10,  // ~33 km/h avg (mix of bus/train) + 10 min wait
    drive: distanceKm * 1.2 + 2,     // ~50 km/h avg + 2 min parking
  };
  
  const time = Math.round(times[mode]);
  
  // Thresholds - return null if exceeds
  if (mode === 'walk' && time > 60) return null;     // 60 min walk max
  if (mode === 'transit' && time > 150) return null; // 2.5 hours transit max
  if (mode === 'drive' && time > 180) return null;   // 3 hours drive max
  
  const icons = { walk: Footprints, transit: Bus, drive: Car };
  const labels = { walk: 'walk', transit: 'transit', drive: 'drive' };
  
  return { time, Icon: icons[mode], label: labels[mode] };
}

export function SearchedLocationCard({
  location,
  propertyLat,
  propertyLng,
  travelMode,
  onRemove,
}: SearchedLocationCardProps) {
  const hasPropertyCoords = propertyLat != null && propertyLng != null;
  
  const distance = hasPropertyCoords
    ? calculateDistance(propertyLat, propertyLng, location.latitude, location.longitude)
    : null;
  
  // Get travel time for selected mode, fall back to drive
  let travelInfo = distance ? getTravelTime(distance, travelMode) : null;
  let usedFallback = false;
  
  if (!travelInfo && distance && travelMode !== 'drive') {
    travelInfo = getTravelTime(distance, 'drive');
    usedFallback = true;
  }

  return (
    <div className="relative group bg-muted/30 border border-border/40 rounded-xl p-3 hover:bg-muted/50 transition-colors">
      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </Button>
      
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
          <MapPin className="h-4 w-4 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm leading-tight truncate">
            {location.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Your search</p>
          
          {travelInfo ? (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 text-sm">
                <travelInfo.Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium text-foreground">{travelInfo.time} min</span>
                <span className="text-muted-foreground">{travelInfo.label}</span>
              </div>
              {usedFallback && (
                <p className="text-xs text-muted-foreground/70 italic">
                  ({travelMode === 'walk' ? 'walking' : 'transit'} 3+ hrs)
                </p>
              )}
            </div>
          ) : !hasPropertyCoords ? (
            <p className="text-xs mt-2 text-muted-foreground/70 italic">
              Travel time pending location
            </p>
          ) : distance ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs mt-2 text-muted-foreground/70 italic cursor-help underline decoration-dotted">
                    3+ hours away
                  </p>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  <p className="text-xs">
                    This location exceeds our estimate limit. Check Google Maps for accurate directions.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
      </div>
    </div>
  );
}
