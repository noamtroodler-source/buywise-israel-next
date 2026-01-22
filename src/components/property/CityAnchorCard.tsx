import { Building, Train, Bus, Car, ShoppingBag, Trees, GraduationCap, Heart, Coffee, Waves, Plane, MapPin, Footprints, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CityAnchor } from '@/hooks/useCityAnchors';

type TravelMode = 'walk' | 'transit' | 'drive';

interface CityAnchorCardProps {
  anchor: CityAnchor;
  propertyLat?: number | null;
  propertyLng?: number | null;
  travelMode: TravelMode;
}

// Icon mapping based on the icon field from database
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'building': Building,
  'train': Train,
  'bus': Bus,
  'car': Car,
  'shopping-bag': ShoppingBag,
  'trees': Trees,
  'graduation-cap': GraduationCap,
  'heart': Heart,
  'coffee': Coffee,
  'waves': Waves,
  'plane': Plane,
  'map-pin': MapPin,
};

// Label for each anchor type
const anchorTypeLabels: Record<string, string> = {
  'orientation': 'City Landmark',
  'daily_life': 'Daily Essentials',
  'mobility': 'Transit Access',
};

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate travel time based on distance and mode
function getTravelTime(distanceKm: number, mode: TravelMode): { time: number; label: string; Icon: React.ComponentType<{ className?: string }> } | null {
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

export function CityAnchorCard({ anchor, propertyLat, propertyLng, travelMode }: CityAnchorCardProps) {
  const Icon = iconMap[anchor.icon || 'map-pin'] || MapPin;
  
  // Check if we have property coordinates
  const hasPropertyCoords = propertyLat != null && propertyLng != null;
  
  // Calculate distance if we have both property and anchor coordinates
  const distance = hasPropertyCoords && anchor.latitude && anchor.longitude
    ? calculateDistance(propertyLat, propertyLng, anchor.latitude, anchor.longitude)
    : null;
  
  // Get travel display (fallback to drive if selected mode doesn't work)
  let travel = distance ? getTravelTime(distance, travelMode) : null;
  if (!travel && distance) {
    travel = getTravelTime(distance, 'drive');
  }
  
  const isFallback = travelMode !== 'drive' && distance && getTravelTime(distance, travelMode) === null;
  
  return (
    <div className="bg-muted/30 border border-border/40 rounded-xl p-3 hover:bg-muted/50 transition-colors flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground truncate">{anchor.name}</p>
          {anchor.description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px]">
                <p className="text-xs leading-relaxed">{anchor.description}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{anchorTypeLabels[anchor.anchor_type]}</p>
        {travel ? (
          <div className="flex items-center gap-1.5 mt-2 text-sm">
            <travel.Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">{travel.time} min</span>
            <span className="text-muted-foreground">{travel.label}</span>
          </div>
        ) : !hasPropertyCoords ? (
          <p className="text-sm mt-2 text-muted-foreground/70 italic">
            Travel time pending location
          </p>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-sm mt-2 text-muted-foreground/70 italic cursor-help underline decoration-dotted">
                3+ hours away
              </p>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px]">
              <p className="text-xs">
                This location exceeds our estimate limit. Check Google Maps for accurate directions.
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
