import { MapPin, Footprints, Bus, Car, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    walk: distanceKm * 12, // ~5 km/h walking speed
    transit: distanceKm * 3 + 5, // Bus with wait time
    drive: distanceKm * 1.2 + 2, // Driving with parking
  };
  
  const time = Math.round(times[mode]);
  
  // Don't show walking for > 45 min
  if (mode === 'walk' && time > 45) return null;
  // Don't show transit for > 90 min
  if (mode === 'transit' && time > 90) return null;
  
  const icons = { walk: Footprints, transit: Bus, drive: Car };
  const labels = { walk: 'walk', transit: 'by bus', drive: 'drive' };
  
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
  if (!travelInfo && distance) {
    travelInfo = getTravelTime(distance, 'drive');
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
            <div className="flex items-center gap-1.5 mt-2 text-sm">
              <travelInfo.Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">{travelInfo.time} min</span>
              <span className="text-muted-foreground">{travelInfo.label}</span>
            </div>
          ) : !hasPropertyCoords ? (
            <p className="text-xs mt-2 text-muted-foreground/70 italic">
              Travel time pending location
            </p>
          ) : distance ? (
            <p className="text-xs mt-2 text-muted-foreground/70 italic">
              3+ hours away • Check Maps
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
