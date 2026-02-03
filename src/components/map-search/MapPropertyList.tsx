import { useCallback, useRef, useEffect } from 'react';
import { Property } from '@/types/database';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Loader2, Home } from 'lucide-react';
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
}: MapPropertyListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isMobile = useIsMobile();

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
          <Home className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No properties in this area</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Try zooming out or moving the map to explore other areas
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Results count header */}
      <div className="px-4 py-3 border-b bg-muted/30 flex-shrink-0">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{properties.length}</span> properties
        </p>
      </div>
      
      {/* Scrollable list - 2-column grid on desktop, 1-column on mobile */}
      <ScrollArea className="flex-1">
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
                showShareButton={false}
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
    </div>
  );
}
