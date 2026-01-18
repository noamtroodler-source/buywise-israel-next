import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useCities } from '@/hooks/useCities';
import { cityMatchesQuery } from '@/lib/utils/cityMatcher';

interface CityAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CityAutocomplete({ 
  value, 
  onValueChange, 
  placeholder = 'e.g., Tel Aviv',
  className 
}: CityAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const { data: cities = [] } = useCities();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const allCityNames = cities.map(c => c.name);
  
  // Filter cities based on input
  const filteredCities = inputValue.trim()
    ? allCityNames.filter(city => cityMatchesQuery(city, inputValue))
    : allCityNames;

  // Sync input with external value
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setOpen(true);
  };

  const handleSelect = (city: string) => {
    setInputValue(city);
    onValueChange(city);
    setOpen(false);
  };

  const handleFocus = () => {
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("h-11 rounded-xl", className)}
        autoComplete="off"
      />
      
      {open && filteredCities.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl shadow-lg max-h-60 overflow-auto">
          {filteredCities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handleSelect(city)}
              className={cn(
                "w-full px-3 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center gap-2 first:rounded-t-xl last:rounded-b-xl",
                value === city && "bg-muted/50"
              )}
            >
              {value === city && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
              <span className={cn(value !== city && "ml-6")}>{city}</span>
            </button>
          ))}
        </div>
      )}
      
      {open && filteredCities.length === 0 && inputValue.trim() && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl shadow-lg p-3 text-sm text-muted-foreground">
          No city found
        </div>
      )}
    </div>
  );
}
