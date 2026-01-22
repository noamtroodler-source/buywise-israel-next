import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';

export interface SearchedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface LocationSearchInputProps {
  onLocationSelect: (location: SearchedLocation) => void;
  propertyLat: number;
  propertyLng: number;
}

function GoogleLocationSearch({ onLocationSelect, propertyLat, propertyLng }: LocationSearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      locationBias: {
        center: { lat: propertyLat, lng: propertyLng },
        radius: 10000, // 10km radius
      },
      types: ['establishment', 'geocode'],
    },
    debounce: 300,
  });

  const handleSelect = async (description: string, placeId: string) => {
    setValue('', false);
    clearSuggestions();
    setIsFocused(false);

    try {
      const results = await getGeocode({ placeId });
      const { lat, lng } = getLatLng(results[0]);
      
      // Extract a clean name from the description (first part before comma)
      const name = description.split(',')[0].trim();
      
      onLocationSelect({
        id: crypto.randomUUID(),
        name,
        latitude: lat,
        longitude: lng,
      });
    } catch (error) {
      console.error('Error geocoding place:', error);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          disabled={!ready}
          placeholder="Search for a place (mall, station, etc.)"
          className="pl-9 bg-muted/50 border-border/40"
        />
      </div>
      
      {isFocused && status === 'OK' && data.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
          {data.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted/50 flex items-start gap-2 transition-colors"
              onMouseDown={() => handleSelect(suggestion.description, suggestion.place_id)}
            >
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-foreground">{suggestion.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Nominatim fallback for when Google Maps is not available
function NominatimLocationSearch({ onLocationSelect, propertyLat, propertyLng }: LocationSearchInputProps) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (!value.trim() || value.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=il&limit=5&viewbox=${propertyLng - 0.1},${propertyLat + 0.1},${propertyLng + 0.1},${propertyLat - 0.1}&bounded=1`
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Nominatim search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [value, propertyLat, propertyLng]);

  const handleSelect = (result: any) => {
    setValue('');
    setSuggestions([]);
    setIsFocused(false);
    
    const name = result.display_name.split(',')[0].trim();
    
    onLocationSelect({
      id: crypto.randomUUID(),
      name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    });
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Search for a place (mall, station, etc.)"
          className="pl-9 bg-muted/50 border-border/40"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>
      
      {isFocused && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((result, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted/50 flex items-start gap-2 transition-colors"
              onMouseDown={() => handleSelect(result)}
            >
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-foreground">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LocationSearchInput(props: LocationSearchInputProps) {
  const { isLoaded, loadError } = useGoogleMaps();

  // Use Google Places if loaded successfully, otherwise fall back to Nominatim
  if (isLoaded && !loadError) {
    return <GoogleLocationSearch {...props} />;
  }
  
  return <NominatimLocationSearch {...props} />;
}
