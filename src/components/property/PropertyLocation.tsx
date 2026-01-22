import { useState } from 'react';
import { MapPin, ExternalLink, Footprints, Bus, Car, Search, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PropertyMiniMapWrapper } from './PropertyMiniMapWrapper';
import { CityAnchorCard } from './CityAnchorCard';
import { useCityAnchors } from '@/hooks/useCityAnchors';

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
  
  // Fetch city anchors from database
  const { data: cityAnchors, isLoading: anchorsLoading } = useCityAnchors(city);
  
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

  // Search This Area - opens Google Maps centered on property
  const searchThisArea = () => {
    if (latitude && longitude) {
      window.open(`https://www.google.com/maps/search/?api=1&query=&center=${latitude},${longitude}&zoom=16`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`, '_blank');
    }
  };

  // Generate map POIs from city anchors
  const generateMapPOIs = () => {
    if (!latitude || !longitude) return [];
    
    // Add city anchors to map if they have coordinates
    const anchorPOIs = (cityAnchors || [])
      .filter(anchor => anchor.latitude && anchor.longitude)
      .map(anchor => ({
        category: anchor.anchor_type === 'orientation' ? 'Landmark' : 
                  anchor.anchor_type === 'daily_life' ? 'Shopping' : 'Transport',
        name: anchor.name,
        lat: anchor.latitude!,
        lng: anchor.longitude!,
      }));
    
    // If we have city anchors with coordinates, use those
    if (anchorPOIs.length > 0) {
      return anchorPOIs;
    }
    
    // Otherwise fall back to mock POIs
    const offsets = [
      { category: 'Synagogues', name: 'Great Synagogue', latOffset: 0.003, lngOffset: 0.002 },
      { category: 'Schools', name: 'Elementary School', latOffset: -0.004, lngOffset: 0.003 },
      { category: 'Shopping', name: 'AM:PM / Supermarket', latOffset: 0.001, lngOffset: -0.002 },
      { category: 'Transport', name: 'Bus Stop', latOffset: -0.001, lngOffset: 0.001 },
      { category: 'Healthcare', name: 'Kupat Cholim Clinic', latOffset: 0.004, lngOffset: -0.003 },
      { category: 'Parks & Recreation', name: 'City Park', latOffset: -0.003, lngOffset: -0.002 },
    ];
    
    return offsets.map(({ category, name, latOffset, lngOffset }) => ({
      category,
      name,
      lat: latitude + latOffset,
      lng: longitude + lngOffset,
    }));
  };

  const hasCityAnchors = cityAnchors && cityAnchors.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Location</h3>
      </div>
      
      <div className="space-y-5">
        {/* Mini Map - Slightly taller for better orientation */}
        {latitude && longitude ? (
          <PropertyMiniMapWrapper
            latitude={latitude}
            longitude={longitude}
            propertyTitle={address}
            nearbyPOIs={generateMapPOIs()}
          />
        ) : (
          <div className="h-[200px] bg-muted rounded-xl flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Map preview not available</p>
            </div>
          </div>
        )}

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
            <Button variant="outline" size="sm" onClick={searchThisArea} className="gap-2">
              <Search className="h-4 w-4" />
              Search this area
            </Button>
          </div>
        </div>

        {/* City Anchors - The 3 curated reference points */}
        {hasCityAnchors && latitude && longitude && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">City Reference Points</h4>
              </div>
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
            
            <div className="grid gap-2 sm:grid-cols-3">
              {cityAnchors.map((anchor) => (
                <CityAnchorCard
                  key={anchor.id}
                  anchor={anchor}
                  propertyLat={latitude}
                  propertyLng={longitude}
                  travelMode={travelMode}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
