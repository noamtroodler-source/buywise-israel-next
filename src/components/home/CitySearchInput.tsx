import * as React from 'react';
import { useRef, useState, useEffect, useMemo } from 'react';
import { MapPin, Clock, X, Search, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCities } from '@/hooks/useCities';
import { useAllNeighborhoods } from '@/hooks/useNeighborhoodNames';
import { cityMatchesQuery } from '@/lib/utils/cityMatcher';
import { neighborhoodMatchesQuery } from '@/lib/utils/neighborhoodMatcher';

interface CitySearchInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSearch?: (city: string) => void;
  onNeighborhoodSelect?: (neighborhood: string, city: string) => void;
  placeholder?: string;
}

const HISTORY_KEY = 'buywise_city_search_history';
const MAX_HISTORY = 5;
const popularCities = ['Tel Aviv', 'Jerusalem', 'Herzliya', "Ra'anana", "Modi'in"];

function getSearchHistory(): string[] {
  try {
    const stored = sessionStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addToSearchHistory(city: string) {
  try {
    const history = getSearchHistory().filter(c => c !== city);
    const updated = [city, ...history].slice(0, MAX_HISTORY);
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // sessionStorage unavailable
  }
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) return text;
  
  return (
    <>
      {text.slice(0, index)}
      <span className="font-semibold text-foreground">{text.slice(index, index + query.length)}</span>
      {text.slice(index + query.length)}
    </>
  );
}

export function CitySearchInput({ 
  value, 
  onValueChange, 
  onSearch,
  onNeighborhoodSelect,
  placeholder = 'Where are you looking?' 
}: CitySearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { data: cities = [] } = useCities();
  const { data: allNeighborhoods = [] } = useAllNeighborhoods();
  const allCityNames = cities.map(c => c.name);

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  // Sync input value with external value
  useEffect(() => {
    if (!isOpen) {
      setInputValue(value);
    }
  }, [value, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setInputValue(value); // Reset to selected value
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  // Filter cities based on input
  const filteredCities = inputValue.trim()
    ? allCityNames.filter(city => cityMatchesQuery(city, inputValue))
    : [];

  // Filter neighborhoods based on input
  const filteredNeighborhoods = useMemo(() => {
    if (!inputValue.trim()) return [];
    const q = inputValue.trim().toLowerCase();
    return allNeighborhoods
      .filter(n => n.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [inputValue, allNeighborhoods]);

  // Build the list of items to show
  const showHistory = !inputValue.trim() && searchHistory.length > 0;
  const showPopular = !inputValue.trim();
  const showFiltered = inputValue.trim() && (filteredCities.length > 0 || filteredNeighborhoods.length > 0);
  const showNoResults = inputValue.trim() && filteredCities.length === 0 && filteredNeighborhoods.length === 0;

  // Get all selectable items for keyboard navigation
  const selectableItems: { type: 'history' | 'popular' | 'city' | 'neighborhood'; city: string; neighborhood?: string }[] = [];
  if (showHistory) {
    searchHistory.forEach(city => selectableItems.push({ type: 'history', city }));
  }
  if (showPopular) {
    const popularToShow = popularCities.filter(c => !searchHistory.includes(c));
    popularToShow.forEach(city => selectableItems.push({ type: 'popular', city }));
  }
  if (showFiltered) {
    filteredCities.forEach(city => selectableItems.push({ type: 'city', city }));
    filteredNeighborhoods.forEach(n => selectableItems.push({ type: 'neighborhood', city: n.city, neighborhood: n.name }));
  }

  const handleSelect = (city: string) => {
    setInputValue(city);
    onValueChange(city);
    addToSearchHistory(city);
    setSearchHistory(getSearchHistory());
    setIsOpen(false);
    onSearch?.(city);
  };

  const handleNeighborhoodClick = (neighborhood: string, city: string) => {
    setInputValue(`${neighborhood}, ${city}`);
    onValueChange(city);
    addToSearchHistory(`${neighborhood}, ${city}`);
    setSearchHistory(getSearchHistory());
    setIsOpen(false);
    onNeighborhoodSelect?.(neighborhood, city);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue('');
    onValueChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < selectableItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : selectableItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && selectableItems[highlightedIndex]) {
          const item = selectableItems[highlightedIndex];
          if (item.type === 'neighborhood' && item.neighborhood) {
            handleNeighborhoodClick(item.neighborhood, item.city);
          } else {
            handleSelect(item.city);
          }
        } else if (selectableItems.length > 0) {
          const item = selectableItems[0];
          if (item.type === 'neighborhood' && item.neighborhood) {
            handleNeighborhoodClick(item.neighborhood, item.city);
          } else {
            handleSelect(item.city);
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setInputValue(value);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Container */}
      <div className={cn(
        "flex items-center h-12 bg-background border border-input rounded-lg px-3 gap-2 transition-all",
        isOpen && "ring-2 ring-primary ring-offset-1"
      )}>
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setHighlightedIndex(-1);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-muted rounded transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in-0 duration-100">
          <div className="max-h-[300px] overflow-y-auto py-1">
            {/* Search History Section */}
            {showHistory && (
              <div>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Recent Searches
                </div>
                {searchHistory.map((city, idx) => (
                  <button
                    key={`history-${city}`}
                    onClick={() => handleSelect(city)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors",
                      highlightedIndex === idx && "bg-muted"
                    )}
                  >
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{city}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Cities Section */}
            {showPopular && (
              <div>
                {showHistory && <div className="border-t border-border my-1" />}
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Popular Cities
                </div>
                {popularCities
                  .filter(city => !searchHistory.includes(city))
                  .map((city, idx) => {
                    const itemIndex = showHistory ? searchHistory.length + idx : idx;
                    return (
                      <button
                        key={`popular-${city}`}
                        onClick={() => handleSelect(city)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors",
                          highlightedIndex === itemIndex && "bg-muted"
                        )}
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground">{city}</span>
                      </button>
                    );
                  })}
              </div>
            )}

            {/* Filtered Results - Cities */}
            {showFiltered && filteredCities.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Cities
                </div>
                {filteredCities.map((city, idx) => (
                  <button
                    key={`result-${city}`}
                    onClick={() => handleSelect(city)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors",
                      highlightedIndex === idx && "bg-muted"
                    )}
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                      {highlightMatch(city, inputValue)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Filtered Results - Neighborhoods */}
            {showFiltered && filteredNeighborhoods.length > 0 && (
              <div>
                {filteredCities.length > 0 && <div className="border-t border-border my-1" />}
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Neighborhoods
                </div>
                {filteredNeighborhoods.map((n, idx) => {
                  const itemIndex = filteredCities.length + idx;
                  return (
                    <button
                      key={`neighborhood-${n.city}-${n.name}`}
                      onClick={() => handleNeighborhoodClick(n.name, n.city)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors",
                        highlightedIndex === itemIndex && "bg-muted"
                      )}
                    >
                      <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        {highlightMatch(n.name, inputValue)}
                        <span className="text-xs ml-1 opacity-60">{n.city}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* No Results */}
            {showNoResults && (
              <div className="px-3 py-6 text-center text-muted-foreground">
                No cities found for "{inputValue}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
