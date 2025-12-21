import { useState } from 'react';
import { X, Plus, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useCities } from '@/hooks/useCities';

interface CityCompareSelectorProps {
  currentCity: string;
  selectedCities: string[];
  onCitiesChange: (cities: string[]) => void;
  maxCities?: number;
}

// Define comparison colors - these will be used across all comparison components
export const COMPARISON_COLORS = {
  primary: 'hsl(213, 94%, 45%)', // Current city - blue
  compare1: 'hsl(142, 76%, 36%)', // Green
  compare2: 'hsl(280, 70%, 50%)', // Purple
  compare3: 'hsl(25, 95%, 53%)', // Orange
};

export const getComparisonColor = (index: number): string => {
  const colors = [COMPARISON_COLORS.primary, COMPARISON_COLORS.compare1, COMPARISON_COLORS.compare2, COMPARISON_COLORS.compare3];
  return colors[index] || colors[0];
};

export const getComparisonBgClass = (index: number): string => {
  const classes = ['bg-primary', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500'];
  return classes[index] || classes[0];
};

export const getComparisonTextClass = (index: number): string => {
  const classes = ['text-primary', 'text-emerald-500', 'text-purple-500', 'text-orange-500'];
  return classes[index] || classes[0];
};

export function CityCompareSelector({
  currentCity,
  selectedCities,
  onCitiesChange,
  maxCities = 3,
}: CityCompareSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: cities = [] } = useCities();

  // Filter out current city and already selected cities
  const availableCities = cities.filter(
    (city) => city.name !== currentCity && !selectedCities.includes(city.name)
  );

  const handleAddCity = (cityName: string) => {
    if (selectedCities.length < maxCities) {
      onCitiesChange([...selectedCities, cityName]);
    }
    setIsOpen(false);
  };

  const handleRemoveCity = (cityName: string) => {
    onCitiesChange(selectedCities.filter((c) => c !== cityName));
  };

  const handleClearAll = () => {
    onCitiesChange([]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Current city badge */}
      <Badge 
        variant="outline" 
        className="bg-primary/10 border-primary/30 text-primary py-1.5 px-3"
      >
        <div className="w-2 h-2 rounded-full bg-primary mr-2" />
        {currentCity}
      </Badge>

      {/* Selected comparison cities */}
      {selectedCities.map((city, index) => (
        <Badge
          key={city}
          variant="outline"
          className={`py-1.5 px-3 pr-2 ${
            index === 0
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
              : index === 1
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-600'
              : 'bg-orange-500/10 border-orange-500/30 text-orange-600'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              index === 0 ? 'bg-emerald-500' : index === 1 ? 'bg-purple-500' : 'bg-orange-500'
            }`}
          />
          {city}
          <button
            onClick={() => handleRemoveCity(city)}
            className="ml-1.5 p-0.5 rounded-full hover:bg-foreground/10 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Add city button */}
      {selectedCities.length < maxCities && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-dashed"
            >
              <Plus className="h-3.5 w-3.5" />
              Compare
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground px-2 py-1.5">
                Select a city to compare
              </p>
              {availableCities.length > 0 ? (
                <div className="max-h-48 overflow-y-auto">
                  {availableCities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleAddCity(city.name)}
                      className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground px-2 py-2">
                  No more cities available
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Clear all button */}
      {selectedCities.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="h-8 text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}

      {/* Hint text when no comparisons */}
      {selectedCities.length === 0 && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <BarChart3 className="h-3 w-3" />
          Add up to {maxCities} cities to compare
        </span>
      )}
    </div>
  );
}
