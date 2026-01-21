import { useState, useEffect, useRef, useCallback } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';
import { cityMatchesQuery } from '@/lib/utils/cityMatcher';

export interface ParsedAddress {
  streetAddress: string;
  neighborhood: string;
  city: string;
  matchedSupportedCity?: string;
  latitude: number;
  longitude: number;
  placeId: string;
  fullAddress: string;
}

interface AddressAutocompleteProps {
  value: string;
  onAddressSelect: (address: ParsedAddress) => void;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  supportedCities?: string[];
}

// Fallback to Nominatim when Google Maps is not available
async function searchNominatim(query: string): Promise<NominatimResult[]> {
  if (query.length < 3) return [];
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        countrycodes: 'il',
        limit: '5',
        'accept-language': 'en',
      }),
      { headers: { 'User-Agent': 'BuywiseIsrael/1.0' } }
    );
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  } catch {
    return [];
  }
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
  };
  place_id: number;
}

function parseNominatimResult(result: NominatimResult): ParsedAddress {
  const { address } = result;
  const streetParts: string[] = [];
  if (address.road) streetParts.push(address.road);
  if (address.house_number) streetParts.push(address.house_number);
  
  return {
    streetAddress: streetParts.join(' '),
    neighborhood: address.neighbourhood || address.suburb || '',
    city: address.city || address.town || address.village || '',
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    placeId: result.place_id.toString(),
    fullAddress: result.display_name,
  };
}

// Helper to find matching supported city
function findMatchedCity(extractedCity: string, supportedCities?: string[]): string | null {
  if (!supportedCities || supportedCities.length === 0) return extractedCity;
  const match = supportedCities.find(supported => cityMatchesQuery(supported, extractedCity));
  return match || null;
}

// Google Places component
function GoogleAddressAutocomplete({
  value,
  onAddressSelect,
  onInputChange,
  placeholder,
  className,
  supportedCities,
}: AddressAutocompleteProps) {
  const [hasValidSelection, setHasValidSelection] = useState(!!value);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [unsupportedCityError, setUnsupportedCityError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'il' },
      types: ['address'],
    },
    debounce: 300,
    defaultValue: value,
  });

  // Sync external value
  useEffect(() => {
    if (value) {
      setValue(value, false);
      setHasValidSelection(true);
    }
  }, [value, setValue]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        clearSuggestions();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearSuggestions]);

  const handleSelect = useCallback(async (placeId: string, description: string) => {
    try {
      const results = await getGeocode({ placeId });
      const { lat, lng } = await getLatLng(results[0]);
      
      // Parse address components
      const components = results[0].address_components;
      let streetNumber = '';
      let streetName = '';
      let neighborhood = '';
      let city = '';

      for (const component of components) {
        const types = component.types;
        if (types.includes('street_number')) {
          streetNumber = component.long_name;
        } else if (types.includes('route')) {
          streetName = component.long_name;
        } else if (types.includes('neighborhood') || types.includes('sublocality_level_1') || types.includes('sublocality')) {
          neighborhood = component.long_name;
        } else if (types.includes('locality')) {
          city = component.long_name;
        }
      }

      // Check if city is supported
      const matchedCity = findMatchedCity(city, supportedCities);
      if (supportedCities && supportedCities.length > 0 && !matchedCity) {
        setUnsupportedCityError(city);
        setValue('', false);
        clearSuggestions();
        setHasValidSelection(false);
        onInputChange?.('');
        return;
      }

      setUnsupportedCityError(null);
      setValue(description, false);
      clearSuggestions();
      setHasValidSelection(true);

      const streetAddress = streetNumber 
        ? `${streetName} ${streetNumber}` 
        : streetName;

      onAddressSelect({
        streetAddress,
        neighborhood,
        city,
        matchedSupportedCity: matchedCity || undefined,
        latitude: lat,
        longitude: lng,
        placeId,
        fullAddress: description,
      });
    } catch (error) {
      console.error('Error geocoding address:', error);
    }
  }, [setValue, clearSuggestions, onAddressSelect, supportedCities, onInputChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (status !== 'OK' || data.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, data.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && data[selectedIndex]) {
          handleSelect(data[selectedIndex].place_id, data[selectedIndex].description);
        }
        break;
      case 'Escape':
        clearSuggestions();
        break;
    }
  };

  const isOpen = status === 'OK' && data.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => {
            setValue(e.target.value);
            setHasValidSelection(false);
            setSelectedIndex(-1);
            onInputChange?.(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          disabled={!ready}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-form-type="other"
          className={cn(
            'h-11 rounded-xl pr-10',
            hasValidSelection && 'border-primary/50 bg-primary/5',
            className
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {!ready ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : hasValidSelection ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg">
          <ul className="max-h-[240px] overflow-auto py-1">
            {data.map((suggestion, index) => (
              <li
                key={suggestion.place_id}
                onClick={() => handleSelect(suggestion.place_id, suggestion.description)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                )}
              >
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{suggestion.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {unsupportedCityError && (
        <p className="mt-1 text-xs text-destructive">
          "{unsupportedCityError}" is not a supported city. Please choose an address in one of our 25 focus cities.
        </p>
      )}

      {!unsupportedCityError && !hasValidSelection && inputValue.length > 0 && inputValue.length < 3 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Type at least 3 characters to search
        </p>
      )}
    </div>
  );
}

// Nominatim fallback component
function NominatimAddressAutocomplete({
  value,
  onAddressSelect,
  onInputChange,
  placeholder,
  className,
  supportedCities,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasValidSelection, setHasValidSelection] = useState(false);
  const [unsupportedCityError, setUnsupportedCityError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
    if (value) setHasValidSelection(true);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNominatimInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setHasValidSelection(false);
    onInputChange?.(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      const results = await searchNominatim(newValue);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
      setIsLoading(false);
    }, 300);
  };

  const handleSelect = (result: NominatimResult) => {
    const parsed = parseNominatimResult(result);
    
    // Check if city is supported
    const matchedCity = findMatchedCity(parsed.city, supportedCities);
    if (supportedCities && supportedCities.length > 0 && !matchedCity) {
      setUnsupportedCityError(parsed.city);
      setInputValue('');
      setHasValidSelection(false);
      setIsOpen(false);
      setSuggestions([]);
      onInputChange?.('');
      return;
    }

    setUnsupportedCityError(null);
    setInputValue(parsed.streetAddress || parsed.fullAddress);
    setHasValidSelection(true);
    setIsOpen(false);
    setSuggestions([]);
    onAddressSelect({
      ...parsed,
      matchedSupportedCity: matchedCity || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const formatSuggestion = (result: NominatimResult) => {
    const parts: string[] = [];
    const { address } = result;
    
    if (address.road) {
      parts.push(address.house_number ? `${address.road} ${address.house_number}` : address.road);
    }
    
    const area = address.neighbourhood || address.suburb;
    const city = address.city || address.town || address.village;
    
    if (area && city) {
      parts.push(`${area}, ${city}`);
    } else if (city) {
      parts.push(city);
    } else if (area) {
      parts.push(area);
    }

    return parts.join(' • ') || result.display_name;
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleNominatimInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-form-type="other"
          className={cn(
            'h-11 rounded-xl pr-10',
            hasValidSelection && 'border-primary/50 bg-primary/5',
            className
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : hasValidSelection ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg">
          <ul className="max-h-[240px] overflow-auto py-1">
            {suggestions.map((result, index) => (
              <li
                key={result.place_id}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                )}
              >
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{formatSuggestion(result)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {unsupportedCityError && (
        <p className="mt-1 text-xs text-destructive">
          "{unsupportedCityError}" is not a supported city. Please choose an address in one of our 25 focus cities.
        </p>
      )}

      {!unsupportedCityError && !hasValidSelection && inputValue.length > 0 && inputValue.length < 3 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Type at least 3 characters to search
        </p>
      )}
    </div>
  );
}

// Main component that decides which implementation to use
export function AddressAutocomplete(props: AddressAutocompleteProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  
  // Use Google Places if available, otherwise fall back to Nominatim
  if (isLoaded && !loadError) {
    return <GoogleAddressAutocomplete {...props} />;
  }
  
  return <NominatimAddressAutocomplete {...props} />;
}
