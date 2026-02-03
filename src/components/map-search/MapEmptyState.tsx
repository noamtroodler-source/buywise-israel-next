import { useState, useMemo } from 'react';
import { MapPin, Search, MousePointerClick, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFeaturedCities, useCities } from '@/hooks/useCities';
import { matchCities } from '@/lib/utils/cityMatcher';
import { cn } from '@/lib/utils';

interface MapEmptyStateProps {
  onCitySelect: (city: string, coordinates: { lat: number; lng: number }) => void;
}

export function MapEmptyState({ onCitySelect }: MapEmptyStateProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: featuredCities, isLoading: featuredLoading } = useFeaturedCities();
  const { data: allCities } = useCities();

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return matchCities(searchQuery, allCities || []).slice(0, 5);
  }, [searchQuery, allCities]);

  const handleCitySelect = (city: { name: string; center_lat?: number | null; center_lng?: number | null }) => {
    if (city.center_lat && city.center_lng) {
      onCitySelect(city.name, { lat: city.center_lat, lng: city.center_lng });
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="h-10 w-10 text-primary" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Where would you like to search?
          </h2>
          <p className="text-muted-foreground">
            Enter a city to explore properties on the map
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-lg rounded-xl border-2 focus:border-primary"
            autoFocus
          />

          {/* Search Results Dropdown */}
          {filteredCities.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl shadow-lg z-50 overflow-hidden">
              {filteredCities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city)}
                  className="w-full text-left px-4 py-3 hover:bg-muted flex items-center gap-3 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{city.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Popular Cities */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            Popular Cities
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {featuredLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 w-24 bg-muted animate-pulse rounded-full" />
              ))
            ) : (
              featuredCities?.map((city) => (
                <Button
                  key={city.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCitySelect(city)}
                  className="rounded-full px-4 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {city.name}
                </Button>
              ))
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-muted/50 rounded-xl p-5 space-y-3 text-left">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MousePointerClick className="h-4 w-4" />
            Search Tips
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Enter a city name to see properties in that area</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use filters to narrow your search by price, rooms, or type</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Draw on the map to search custom areas</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
