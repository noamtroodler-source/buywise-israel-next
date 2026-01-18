import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressResult {
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
    state?: string;
    country?: string;
  };
  place_id: number;
}

interface ParsedAddress {
  streetAddress: string;
  neighborhood: string;
  city: string;
  latitude: number;
  longitude: number;
  placeId: string;
  fullAddress: string;
}

interface AddressAutocompleteProps {
  value: string;
  onAddressSelect: (address: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onAddressSelect,
  placeholder = 'Start typing an address...',
  className,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasValidSelection, setHasValidSelection] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
    if (value) {
      setHasValidSelection(true);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Use Nominatim with Israel country code for better results
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
        {
          headers: {
            'User-Agent': 'BuywiseIsrael/1.0',
          },
        }
      );

      if (!response.ok) throw new Error('Search failed');

      const results: AddressResult[] = await response.json();
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setHasValidSelection(false);

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddress(newValue);
    }, 300);
  };

  const parseAddressResult = (result: AddressResult): ParsedAddress => {
    const { address } = result;
    
    // Build street address
    const streetParts: string[] = [];
    if (address.road) streetParts.push(address.road);
    if (address.house_number) streetParts.push(address.house_number);
    const streetAddress = streetParts.join(' ');

    // Get neighborhood - Nominatim uses various fields
    const neighborhood = address.neighbourhood || address.suburb || '';

    // Get city - Nominatim uses city, town, or village
    const city = address.city || address.town || address.village || '';

    return {
      streetAddress,
      neighborhood,
      city,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      placeId: result.place_id.toString(),
      fullAddress: result.display_name,
    };
  };

  const handleSelect = (result: AddressResult) => {
    const parsed = parseAddressResult(result);
    setInputValue(parsed.streetAddress || parsed.fullAddress);
    setHasValidSelection(true);
    setIsOpen(false);
    setSuggestions([]);
    onAddressSelect(parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
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

  const formatSuggestion = (result: AddressResult) => {
    // Show a cleaner format: Street, Neighborhood/City
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
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={cn(
            'h-11 rounded-xl pr-10',
            hasValidSelection && 'border-green-500/50 bg-green-500/5',
            className
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : hasValidSelection ? (
            <Check className="h-4 w-4 text-green-500" />
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

      {!hasValidSelection && inputValue.length > 0 && inputValue.length < 3 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Type at least 3 characters to search
        </p>
      )}
    </div>
  );
}
