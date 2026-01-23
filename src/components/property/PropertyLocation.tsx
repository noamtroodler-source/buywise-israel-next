import { useState } from 'react';
import { MapPin, ExternalLink, Footprints, Bus, Car, Compass, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PropertyMiniMapWrapper } from './PropertyMiniMapWrapper';
import { CityAnchorCard } from './CityAnchorCard';
import { useCityAnchors } from '@/hooks/useCityAnchors';
import { LocationSearchInput, type SearchedLocation } from './LocationSearchInput';
import { SearchedLocationCard } from './SearchedLocationCard';
import { useAutoGeocode } from '@/hooks/useAutoGeocode';
import { SavedLocationsSection } from './SavedLocationsSection';
import { useSavedLocations } from '@/hooks/useSavedLocations';

interface PropertyLocationProps {
  address: string;
  city: string;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  entityId?: string;
  entityType?: 'property' | 'project';
}

type TravelMode = 'walk' | 'transit' | 'drive';

export function PropertyLocation({ 
  address, 
  city, 
  neighborhood,
  latitude: initialLatitude,
  longitude: initialLongitude,
  entityId,
  entityType = 'property',
}: PropertyLocationProps) {
  // Auto-geocode if coordinates are missing
  const { 
    latitude: geocodedLat, 
    longitude: geocodedLng, 
    isLoading: isGeocoding 
  } = useAutoGeocode(
    entityType,
    entityId,
    address,
    city,
    initialLatitude,
    initialLongitude
  );
  
  // Use geocoded coordinates if available, otherwise initial
  const latitude = geocodedLat ?? initialLatitude;
  const longitude = geocodedLng ?? initialLongitude;
  const [travelMode, setTravelMode] = useState<TravelMode>('walk');
  const [searchedLocations, setSearchedLocations] = useState<SearchedLocation[]>([]);
  
  // Fetch city anchors from database
  const { data: cityAnchors, isLoading: anchorsLoading } = useCityAnchors(city);
  
  // Fetch user's saved locations for map display
  const { data: savedLocations } = useSavedLocations();
  
  // Handle adding a searched location
  const handleLocationSelect = (location: SearchedLocation) => {
    // Prevent duplicates
    if (searchedLocations.some(l => l.name === location.name)) return;
    // Max 5 searches
    if (searchedLocations.length >= 5) return;
    setSearchedLocations(prev => [...prev, location]);
  };
  
  // Handle removing a searched location
  const handleRemoveSearch = (id: string) => {
    setSearchedLocations(prev => prev.filter(l => l.id !== id));
  };
  
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


  // Generate map POIs from city anchors, saved locations, and searched locations
  const generateMapPOIs = () => {
    if (!latitude || !longitude) return [];
    
    const allPOIs: { category: string; name: string; lat: number; lng: number }[] = [];
    
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
    
    // Add saved locations from user profile
    const savedPOIs = (savedLocations || [])
      .filter(loc => loc.latitude && loc.longitude)
      .map(loc => ({
        category: 'Saved',
        name: loc.label,
        lat: loc.latitude,
        lng: loc.longitude,
      }));
    
    // Add searched locations (temporary)
    const searchedPOIs = searchedLocations
      .filter(loc => loc.latitude && loc.longitude)
      .map(loc => ({
        category: 'Searched',
        name: loc.name,
        lat: loc.latitude,
        lng: loc.longitude,
      }));
    
    // Combine all POIs
    allPOIs.push(...savedPOIs, ...searchedPOIs, ...anchorPOIs);
    
    // If we have any real POIs, return them
    if (allPOIs.length > 0) {
      return allPOIs;
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
        ) : isGeocoding ? (
          <div className="h-[200px] bg-muted rounded-xl flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
              <p className="text-sm">Finding map location...</p>
            </div>
          </div>
        ) : (
          <div className="h-[200px] bg-muted rounded-xl flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Map location not available</p>
            </div>
          </div>
        )}
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

        {/* Search a location */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Search a location</h4>
          <LocationSearchInput
            onLocationSelect={handleLocationSelect}
            propertyLat={latitude ?? 31.7683}
            propertyLng={longitude ?? 35.2137}
          />
        </div>

        {/* Unified Travel Times Section */}
        {(hasCityAnchors || latitude || searchedLocations.length > 0) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">Travel Times</h4>
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

            {/* Unified grid: Searched + Saved + City Anchors */}
            <div className="grid gap-2 sm:grid-cols-3">
              {/* Searched locations (with remove button) */}
              {searchedLocations.map((location) => (
                <SearchedLocationCard
                  key={location.id}
                  location={location}
                  propertyLat={latitude}
                  propertyLng={longitude}
                  travelMode={travelMode}
                  onRemove={() => handleRemoveSearch(location.id)}
                />
              ))}
              
              {/* User's saved locations */}
              {latitude && longitude && (
                <SavedLocationsSection
                  propertyLat={latitude}
                  propertyLng={longitude}
                  travelMode={travelMode}
                />
              )}
              
              {/* City reference points */}
              {cityAnchors?.map((anchor) => (
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
