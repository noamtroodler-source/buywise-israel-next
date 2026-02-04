import { useCallback, useRef, useEffect, useState } from 'react';
import { Property } from '@/types/database';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Loader2, Home, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
}: MapPropertyListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Scroll to hovered property when hovering on map marker
  useEffect(() => {
    if (hoveredPropertyId && cardRefs.current.has(hoveredPropertyId)) {
      const card = cardRefs.current.get(hoveredPropertyId);
      card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [hoveredPropertyId]);

  const setCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(id, el);
    } else {
      cardRefs.current.delete(id);
    }
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setShowBackToTop(e.currentTarget.scrollTop > 400);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
    <div className="h-full flex flex-col relative">
      {/* Results count header */}
      <div className="px-4 py-3 border-b bg-muted/30 flex-shrink-0">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{properties.length}</span> properties
        </p>
      </div>
      
      {/* Scrollable list - 2-column grid on desktop, 1-column on mobile */}
      <ScrollArea className="flex-1" ref={scrollContainerRef} onScrollCapture={handleScroll as any}>
        <div 
          ref={listRef} 
          className={cn(
            "p-3 gap-3",
            isMobile ? "space-y-3" : "grid grid-cols-2"
          )}
        >
          {properties.map((property) => (
            <div
              key={property.id}
              ref={(el) => setCardRef(property.id, el)}
              onMouseEnter={() => onPropertyHover(property.id)}
              onMouseLeave={() => onPropertyHover(null)}
              onClick={() => onPropertySelect(property.id)}
              className={cn(
                "transition-all duration-200 rounded-xl cursor-pointer",
                hoveredPropertyId === property.id && "ring-2 ring-primary shadow-lg"
              )}
            >
              <PropertyCard
                property={property}
                compact
                showCompareButton={false}
                showShareButton={true}
                maxBadges={1}
              />
            </div>
          ))}
          
          {/* Load More */}
          {hasNextPage && (
            <div className="pt-4 pb-2 flex justify-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isFetching}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Loading overlay */}
      {isFetching && !isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center pointer-events-none">
          <div className="bg-background rounded-full p-3 shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
      )}

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
