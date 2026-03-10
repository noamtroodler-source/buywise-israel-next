import { useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useNeighborhoodNames, useAllNeighborhoods } from '@/hooks/useNeighborhoodNames';
import { neighborhoodMatchesQuery } from '@/lib/utils/neighborhoodMatcher';

interface NeighborhoodSelectorProps {
  cityName?: string;
  selectedNeighborhoods: string[];
  onNeighborhoodsChange: (neighborhoods: string[]) => void;
  onCityChange?: (city: string) => void;
}

export function NeighborhoodSelector({
  cityName,
  selectedNeighborhoods,
  onNeighborhoodsChange,
  onCityChange,
}: NeighborhoodSelectorProps) {
  const [search, setSearch] = useState('');
  const { data: cityNeighborhoods = [] } = useNeighborhoodNames(cityName);
  const { data: allNeighborhoods = [] } = useAllNeighborhoods();

  const toggleNeighborhood = (name: string, city?: string) => {
    // Cross-sync: if selecting from a different city, update city filter
    if (city && onCityChange && city !== cityName) {
      onCityChange(city);
      onNeighborhoodsChange([name]);
      return;
    }

    if (selectedNeighborhoods.includes(name)) {
      onNeighborhoodsChange(selectedNeighborhoods.filter(n => n !== name));
    } else {
      onNeighborhoodsChange([...selectedNeighborhoods, name]);
    }
  };

  // City-scoped mode
  if (cityName) {
    const filtered = search
      ? cityNeighborhoods.filter(n => n.toLowerCase().includes(search.toLowerCase()))
      : cityNeighborhoods;

    if (cityNeighborhoods.length === 0) return null;

    return (
      <div className="space-y-2">
        {cityNeighborhoods.length > 6 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search neighborhoods..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm rounded-lg"
            />
          </div>
        )}
        <div className="max-h-[192px] overflow-y-auto space-y-0.5">
          {filtered.map(name => {
            const isSelected = selectedNeighborhoods.includes(name);
            return (
              <button
                key={name}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center justify-between",
                  isSelected
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted"
                )}
                onClick={() => toggleNeighborhood(name)}
              >
                <span>{name}</span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
          {filtered.length === 0 && search && (
            <p className="text-xs text-muted-foreground px-3 py-2">No neighborhoods found</p>
          )}
        </div>
      </div>
    );
  }

  // Global mode - search across all cities
  const filtered = search.length >= 2
    ? allNeighborhoods.filter(n => n.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  // Group by city
  const grouped = filtered.reduce<Record<string, string[]>>((acc, n) => {
    if (!acc[n.city]) acc[n.city] = [];
    acc[n.city].push(n.name);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search all neighborhoods..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-8 text-sm rounded-lg"
        />
      </div>
      {search.length >= 2 && (
        <div className="max-h-[240px] overflow-y-auto space-y-1">
          {Object.entries(grouped).map(([city, names]) => (
            <div key={city}>
              <p className="text-xs font-medium text-muted-foreground px-3 py-1 uppercase tracking-wide">{city}</p>
              {names.map(name => {
                const isSelected = selectedNeighborhoods.includes(name) && cityName === city;
                return (
                  <button
                    key={`${city}-${name}`}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center justify-between",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    )}
                    onClick={() => toggleNeighborhood(name, city)}
                  >
                    <span>{name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-2">No neighborhoods found</p>
          )}
        </div>
      )}
      {search.length > 0 && search.length < 2 && (
        <p className="text-xs text-muted-foreground px-3 py-1">Type at least 2 characters</p>
      )}
      {search.length === 0 && (
        <p className="text-xs text-muted-foreground px-3 py-2">
          Select a city first, or search to find neighborhoods across all cities
        </p>
      )}
    </div>
  );
}
