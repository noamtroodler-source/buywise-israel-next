import { useState } from 'react';
import { MapPin, ExternalLink, Train, GraduationCap, ShoppingBag, Building, Heart, Trees, Footprints, Bus, Car, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface NearbyItem {
  name: string;
  distanceKm: number;
}

interface NearbyCategory {
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NearbyItem[];
}

interface PropertyLocationProps {
  address: string;
  city: string;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

type TravelMode = 'walk' | 'transit' | 'drive';

const formatTravelTime = (distanceKm: number, mode: TravelMode) => {
  const times = {
    walk: distanceKm * 12, // ~5 km/h walking speed
    transit: distanceKm * 3 + 5, // Bus with wait time
    drive: distanceKm * 1.2 + 2, // Driving with parking
  };
  
  const time = Math.round(times[mode]);
  
  // Don't show walking for > 30 min
  if (mode === 'walk' && time > 30) return null;
  // Don't show transit for > 60 min
  if (mode === 'transit' && time > 60) return null;
  
  const icons = { walk: Footprints, transit: Bus, drive: Car };
  const labels = { walk: 'walk', transit: 'by bus', drive: 'drive' };
  
  return { time, Icon: icons[mode], label: labels[mode] };
};

// Get best travel display for an item
const getTravelDisplay = (distanceKm: number, mode: TravelMode) => {
  const travel = formatTravelTime(distanceKm, mode);
  if (travel) return travel;
  
  // Fall back to driving for far distances
  return formatTravelTime(distanceKm, 'drive');
};

export function PropertyLocation({ 
  address, 
  city, 
  neighborhood,
  latitude,
  longitude,
}: PropertyLocationProps) {
  const [travelMode, setTravelMode] = useState<TravelMode>('walk');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const fullAddress = `${address}${neighborhood ? `, ${neighborhood}` : ''}, ${city}, Israel`;
  
  const openGoogleMaps = () => {
    const query = latitude && longitude 
      ? `${latitude},${longitude}`
      : encodeURIComponent(fullAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const openWaze = () => {
    const query = latitude && longitude 
      ? `ll=${latitude},${longitude}`
      : `q=${encodeURIComponent(fullAddress)}`;
    window.open(`https://waze.com/ul?${query}&navigate=yes`, '_blank');
  };

  // Mock nearby essentials data - 6 categories, 3 items each
  const nearbyEssentials: NearbyCategory[] = [
    { 
      category: 'Synagogues', 
      icon: Building, 
      items: [
        { name: 'Great Synagogue', distanceKm: 0.3 },
        { name: 'Chabad House', distanceKm: 0.5 },
        { name: 'Young Israel', distanceKm: 0.8 },
      ]
    },
    { 
      category: 'Schools', 
      icon: GraduationCap, 
      items: [
        { name: 'Elementary School', distanceKm: 0.4 },
        { name: 'High School', distanceKm: 1.2 },
        { name: 'International School', distanceKm: 2.5 },
      ]
    },
    { 
      category: 'Shopping', 
      icon: ShoppingBag, 
      items: [
        { name: 'AM:PM / Supermarket', distanceKm: 0.15 },
        { name: 'City Mall', distanceKm: 1.8 },
        { name: 'Pharmacy', distanceKm: 0.3 },
      ]
    },
    { 
      category: 'Transport', 
      icon: Train, 
      items: [
        { name: 'Bus Stop', distanceKm: 0.1 },
        { name: 'Train Station', distanceKm: 1.5 },
        { name: 'Tel Aviv Center', distanceKm: 25 },
      ]
    },
    { 
      category: 'Healthcare', 
      icon: Heart, 
      items: [
        { name: 'Kupat Cholim Clinic', distanceKm: 0.4 },
        { name: 'Pharmacy', distanceKm: 0.2 },
        { name: 'Hospital', distanceKm: 3.5 },
      ]
    },
    { 
      category: 'Parks & Recreation', 
      icon: Trees, 
      items: [
        { name: 'City Park', distanceKm: 0.3 },
        { name: 'Sports Center', distanceKm: 1.2 },
        { name: 'Beach', distanceKm: 2.0 },
      ]
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Location</h3>
      </div>
      
      <div className="space-y-5">
        {/* Address & Map Links */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-foreground">{fullAddress}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={openGoogleMaps} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Google Maps
            </Button>
            <Button variant="outline" size="sm" onClick={openWaze} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Waze
            </Button>
          </div>
        </div>

        {/* Nearby Essentials */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Nearby Essentials</h4>
            <ToggleGroup 
              type="single" 
              value={travelMode} 
              onValueChange={(v) => v && setTravelMode(v as TravelMode)} 
              size="sm"
              className="bg-muted rounded-lg p-0.5"
            >
              <ToggleGroupItem value="walk" aria-label="Walking" className="data-[state=on]:bg-background">
                <Footprints className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="transit" aria-label="Public Transit" className="data-[state=on]:bg-background">
                <Bus className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="drive" aria-label="Driving" className="data-[state=on]:bg-background">
                <Car className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {/* Compact Summary - Closest item per category (6 items total) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {nearbyEssentials.map((category) => {
              const CategoryIcon = category.icon;
              const closestItem = category.items[0]; // First item is closest
              const travel = getTravelDisplay(closestItem.distanceKm, travelMode);
              
              if (!travel) return null;
              
              const TravelIcon = travel.Icon;
              const isFallback = travelMode !== 'drive' && formatTravelTime(closestItem.distanceKm, travelMode) === null;
              
              return (
                <div 
                  key={category.category} 
                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50 border border-border/50"
                >
                  <CategoryIcon className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{closestItem.name}</p>
                    <p className={`text-xs flex items-center gap-1 ${isFallback ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                      <TravelIcon className="h-3 w-3" />
                      {travel.time} min {travel.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded View - All items per category */}
          {isExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-border/50">
              {nearbyEssentials.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm text-foreground">{category.category}</span>
                    </div>
                    <ul className="space-y-1.5 pl-6">
                      {category.items.map((item, i) => {
                        const travel = getTravelDisplay(item.distanceKm, travelMode);
                        if (!travel) return null;
                        
                        const TravelIcon = travel.Icon;
                        const isFallback = travelMode !== 'drive' && formatTravelTime(item.distanceKm, travelMode) === null;
                        
                        return (
                          <li key={i} className="flex items-center justify-between text-sm gap-2">
                            <span className="truncate text-muted-foreground">{item.name}</span>
                            <span className={`flex items-center gap-1 text-xs whitespace-nowrap ${isFallback ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                              <TravelIcon className="h-3 w-3" />
                              {travel.time} min {travel.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1.5" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1.5" />
                See all nearby places
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
