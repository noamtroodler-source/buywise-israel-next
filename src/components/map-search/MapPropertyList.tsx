import { useCallback, useRef, useState, useEffect, memo } from 'react';
import { Property, SortOption } from '@/types/database';
import { MapListCard } from './MapListCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronUp, Search, SlidersHorizontal, ArrowUpDown, ChevronDown, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Infinite scroll sentinel component
const InfiniteScrollSentinel = memo(function InfiniteScrollSentinel({ 
  loadMore, 
  isFetching 
}: { 
  loadMore: () => void; 
  isFetching: boolean;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, isFetching]);

  return (
    <div ref={sentinelRef} className="pt-4 pb-2 flex justify-center">
      {isFetching && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
    </div>
  );
});

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest Listings' },
  { value: 'price_drop', label: 'Price Drops First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'size_desc', label: 'Largest First' },
  { value: 'rooms_desc', label: 'Rooms: Most to Fewest' },
];

interface MapPropertyListProps {
  properties: Property[];
  isLoading: boolean;
  isFetching: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
  hoveredPropertyId: string | null;
  onPropertyHover: (id: string | null) => void;
  onPropertySelect: (id: string | null) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  cityName?: string;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  onCreateAlert?: () => void;
  scrollToPropertyId?: string | null;
}

export function MapPropertyList({
  properties,
  isLoading,
  isFetching,
  hasNextPage,
  loadMore,
  hoveredPropertyId,
  onPropertyHover,
  onPropertySelect,
  hasActiveFilters = false,
  onClearFilters,
  cityName,
  sortBy,
  onSortChange,
  onCreateAlert,
  scrollToPropertyId,
}: MapPropertyListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setShowBackToTop(e.currentTarget.scrollTop > 400);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Scroll to property when requested from map popup "Find in list"
  useEffect(() => {
    if (!scrollToPropertyId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-property-id="${scrollToPropertyId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [scrollToPropertyId]);

  const getSortLabel = () => {
    if (sortBy) {
      const found = SORT_OPTIONS.find(s => s.value === sortBy);
      return found?.label || 'Newest';
    }
    return 'Newest';
  };

  if (isLoading) {
    return (
      <div className="h-full p-4 space-y-4 overflow-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3 border rounded-lg">
            <Skeleton className="w-28 h-24 rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No properties in this area</h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-4">
          Try adjusting your search to find more options
        </p>
        <div className="space-y-2 text-sm text-left max-w-xs mb-4">
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Zoom out to see more areas</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Adjust your price range</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Remove amenity filters</span>
          </p>
        </div>
        {hasActiveFilters && onClearFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearFilters}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Clear All Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative" ref={containerRef}>
      {/* Minimal results header */}
        <div className="px-4 py-2.5 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {properties.length} results
              </p>
              {cityName && (
                <p className="text-xs text-muted-foreground">{cityName}</p>
              )}
            </div>
            {onSortChange && (
              <Popover open={sortOpen} onOpenChange={setSortOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {getSortLabel()}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-2 bg-popover border shadow-xl z-50" align="end">
                  {SORT_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors text-left",
                        sortBy === option.value 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "hover:bg-muted"
                      )}
                      onClick={() => {
                        onSortChange(option.value);
                        setSortOpen(false);
                      }}
                    >
                      {sortBy === option.value && <Check className="h-4 w-4" />}
                      <span className={sortBy !== option.value ? "ml-6" : ""}>{option.label}</span>
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        
        {/* Scrollable list - responsive grid */}
        <ScrollArea className="flex-1" ref={scrollContainerRef} onScrollCapture={handleScroll as any}>
          <div 
            ref={listRef} 
            className={cn(
              "p-3 grid gap-3 grid-cols-2",
              isFetching && !isLoading && "opacity-50 pointer-events-none transition-opacity"
            )}
          >
            {properties.map((property) => (
              <div
                key={property.id}
                data-property-id={property.id}
              >
                <MapListCard
                  property={property}
                  isHovered={hoveredPropertyId === property.id}
                  onHover={onPropertyHover}
                  onSelect={onPropertySelect}
                />
              </div>
            ))}

            {/* Infinite scroll sentinel */}
            {hasNextPage && (
              <InfiniteScrollSentinel loadMore={loadMore} isFetching={isFetching} />
            )}
          </div>
        </ScrollArea>
        
        {/* Loading overlay */}
        {/* Removed full overlay spinner - grid now dims via opacity-50 during fetch */}

        {/* Back to Top button */}
        {showBackToTop && (
          <Button
            size="sm"
            className="absolute bottom-4 right-4 rounded-full shadow-lg z-10 h-10 w-10 p-0"
            onClick={scrollToTop}
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        )}
      </div>
  );
}
