import { useState, useMemo } from 'react';
import { Check, Plus, X, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface City {
  name: string;
  slug: string;
}

interface CityComparisonSelectorProps {
  currentCity: string;
  selectedCities: string[];
  onCitiesChange: (cities: string[]) => void;
  availableCities: City[];
}

// Brand colors: Primary blue at different opacities only
const CITY_COLORS = [
  { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30' },
  { bg: 'bg-primary/15', text: 'text-primary/80', border: 'border-primary/25' },
  { bg: 'bg-primary/10', text: 'text-primary/60', border: 'border-primary/20' },
];

export function CityComparisonSelector({
  currentCity,
  selectedCities,
  onCitiesChange,
  availableCities,
}: CityComparisonSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (cityName: string) => {
    if (selectedCities.includes(cityName)) {
      // Don't allow removing the current city
      if (cityName === currentCity) return;
      onCitiesChange(selectedCities.filter((c) => c !== cityName));
    } else if (selectedCities.length < 3) {
      onCitiesChange([...selectedCities, cityName]);
    }
    setOpen(false);
  };

  const handleRemove = (cityName: string) => {
    if (cityName === currentCity) return; // Can't remove current city
    onCitiesChange(selectedCities.filter((c) => c !== cityName));
  };

  const canAddMore = selectedCities.length < 3;

  const sortedCities = useMemo(() => {
    return [...availableCities].sort((a, b) => {
      // Current city first
      if (a.name === currentCity) return -1;
      if (b.name === currentCity) return 1;
      // Then selected cities
      const aSelected = selectedCities.includes(a.name);
      const bSelected = selectedCities.includes(b.name);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      // Then alphabetical
      return a.name.localeCompare(b.name);
    });
  }, [availableCities, currentCity, selectedCities]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selectedCities.map((city, index) => {
        const isCurrentCity = city === currentCity;
        const colorClass = CITY_COLORS[index] || CITY_COLORS[0];
        
        return (
          <Badge
            key={city}
            variant="outline"
            className={cn(
              'px-3 py-1.5 text-sm font-medium transition-all',
              colorClass.bg,
              colorClass.text,
              colorClass.border,
              'border'
            )}
          >
            <span className={cn(
              'w-2 h-2 rounded-full mr-2',
              index === 0 ? 'bg-primary' : index === 1 ? 'bg-primary/70' : 'bg-primary/50'
            )} />
            {city}
            {!isCurrentCity && (
              <button
                onClick={() => handleRemove(city)}
                className="ml-2 hover:opacity-70 transition-opacity"
                aria-label={`Remove ${city}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        );
      })}

      {canAddMore && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Compare City
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0 bg-popover" align="start">
            <Command>
              <CommandInput placeholder="Search cities..." />
              <CommandList>
                <CommandEmpty>No city found.</CommandEmpty>
                <CommandGroup>
                  {sortedCities.map((city) => {
                    const isSelected = selectedCities.includes(city.name);
                    const isCurrentCityItem = city.name === currentCity;
                    const isDisabled = !isSelected && selectedCities.length >= 3;
                    
                    return (
                      <CommandItem
                        key={city.slug}
                        value={city.name}
                        onSelect={() => handleSelect(city.name)}
                        disabled={isDisabled || isCurrentCityItem}
                        className={cn(
                          'cursor-pointer',
                          isCurrentCityItem && 'opacity-50'
                        )}
                      >
                        <div className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                          isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'
                        )}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <span>{city.name}</span>
                        {isCurrentCityItem && (
                          <span className="ml-auto text-xs text-muted-foreground">(current)</span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {selectedCities.length >= 3 && (
        <span className="text-xs text-muted-foreground ml-1">Max 3 cities</span>
      )}
    </div>
  );
}
