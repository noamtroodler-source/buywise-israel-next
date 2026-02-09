import { useState, useCallback, useRef } from 'react';
import { Property, ListingStatus } from '@/types/database';
import { PropertyMap } from './PropertyMap';
import { MapPropertyCard } from './MapPropertyCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ChevronUp, ChevronDown, List, Map } from 'lucide-react';
import type { MapBounds } from './MapSearchLayout';
import type { Polygon } from '@/lib/utils/geometry';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface MobileMapSheetProps {
  properties: Property[];
  mappableProperties: Property[];
  mapCenter: [number, number];
  mapZoom: number;
  onBoundsChange: (bounds: MapBounds, center: [number, number], zoom: number) => void;
  hoveredPropertyId: string | null;
  selectedPropertyId: string | null;
  onPropertyHover: (id: string | null) => void;
  onPropertySelect: (id: string | null) => void;
  searchAsMove: boolean;
  onSearchAsMoveChange: (value: boolean) => void;
  listingStatus: ListingStatus;
  drawnPolygon: Polygon | null;
  onPolygonChange: (polygon: Polygon | null) => void;
  selectedNeighborhoods: string[];
  onNeighborhoodToggle: (neighborhood: string) => void;
  onClearNeighborhoods: () => void;
  isLoading: boolean;
  isFetching: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
}

type SheetState = 'peek' | 'half' | 'full';

export function MobileMapSheet({
  properties,
  mappableProperties,
  mapCenter,
  mapZoom,
  onBoundsChange,
  hoveredPropertyId,
  selectedPropertyId,
  onPropertyHover,
  onPropertySelect,
  searchAsMove,
  onSearchAsMoveChange,
  listingStatus,
  drawnPolygon,
  onPolygonChange,
  selectedNeighborhoods,
  onNeighborhoodToggle,
  onClearNeighborhoods,
  isLoading,
  isFetching,
  hasNextPage,
  loadMore,
}: MobileMapSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>('half');
  const { light: hapticLight } = useHapticFeedback();
  
  // Touch gesture handling
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartY.current === null || touchCurrentY.current === null) return;

    const deltaY = touchStartY.current - touchCurrentY.current;
    const threshold = 50;

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        // Swipe up - expand
        setSheetState(prev => {
          if (prev === 'peek') {
            hapticLight();
            return 'half';
          }
          if (prev === 'half') {
            hapticLight();
            return 'full';
          }
          return prev;
        });
      } else {
        // Swipe down - collapse
        setSheetState(prev => {
          if (prev === 'full') {
            hapticLight();
            return 'half';
          }
          if (prev === 'half') {
            hapticLight();
            return 'peek';
          }
          return prev;
        });
      }
    }

    touchStartY.current = null;
    touchCurrentY.current = null;
  }, [hapticLight]);

  const toggleSheet = useCallback(() => {
    hapticLight();
    setSheetState(prev => {
      if (prev === 'peek') return 'half';
      if (prev === 'half') return 'full';
      return 'half';
    });
  }, [hapticLight]);

  const getSheetHeight = () => {
    switch (sheetState) {
      case 'peek': return 'h-[120px]';
      case 'half': return 'h-[45%]';
      case 'full': return 'h-[85%]';
    }
  };

  const getMapHeight = () => {
    switch (sheetState) {
      case 'peek': return 'h-[calc(100%-120px)]';
      case 'half': return 'h-[55%]';
      case 'full': return 'h-[15%]';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Map Section */}
      <div className={cn("mobile-sheet", getMapHeight())}>
        <PropertyMap
          properties={mappableProperties}
          center={mapCenter}
          zoom={mapZoom}
          onBoundsChange={onBoundsChange}
          hoveredPropertyId={hoveredPropertyId}
          selectedPropertyId={selectedPropertyId}
          onPropertyHover={onPropertyHover}
          onPropertySelect={onPropertySelect}
          searchAsMove={searchAsMove}
          onSearchAsMoveChange={onSearchAsMoveChange}
          listingStatus={listingStatus}
          drawnPolygon={drawnPolygon}
          onPolygonChange={onPolygonChange}
          selectedNeighborhoods={selectedNeighborhoods}
          onNeighborhoodToggle={onNeighborhoodToggle}
          onClearNeighborhoods={onClearNeighborhoods}
        />
      </div>

      {/* Property List Sheet */}
      <div 
        className={cn(
          "relative bg-background border-t rounded-t-2xl shadow-lg mobile-sheet",
          getSheetHeight()
        )}
        role="region"
        aria-label="Property list"
      >
        {/* Floating Map/List Toggle */}
        <button
          onClick={() => {
            hapticLight();
            setSheetState(prev => prev === 'full' ? 'peek' : 'full');
          }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-xs font-medium shadow-lg"
        >
          {sheetState === 'full' ? (
            <><Map className="h-3.5 w-3.5" /> Map</>
          ) : (
            <><List className="h-3.5 w-3.5" /> List</>
          )}
        </button>

        {/* Drag Handle */}
        <button
          onClick={toggleSheet}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full py-3 flex flex-col items-center justify-center touch-none"
          aria-label={sheetState === 'peek' ? 'Expand property list' : sheetState === 'full' ? 'Collapse property list' : 'Toggle property list'}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mb-1" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {sheetState === 'peek' && (
              <>
                <ChevronUp className="h-3 w-3" />
                Show {properties.length} properties
              </>
            )}
            {sheetState === 'half' && (
              <>
                <ChevronUp className="h-3 w-3" />
                {properties.length} properties
                <ChevronDown className="h-3 w-3" />
              </>
            )}
            {sheetState === 'full' && (
              <>
                <ChevronDown className="h-3 w-3" />
                Show map
              </>
            )}
          </div>
        </button>

        {/* Property List */}
        {sheetState !== 'peek' && (
          <ScrollArea className="h-[calc(100%-50px)]">
            <div className="px-4 pb-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No properties in this area
                </div>
              ) : (
                <>
                  {properties.map((property) => (
                    <MapPropertyCard
                      key={property.id}
                      property={property}
                      isHovered={hoveredPropertyId === property.id}
                      onHover={onPropertyHover}
                      onSelect={onPropertySelect}
                    />
                  ))}
                  
                  {hasNextPage && (
                    <div className="pt-2 pb-4 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
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
                </>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Peek Preview */}
        {sheetState === 'peek' && properties.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {properties.slice(0, 5).map((property) => (
                <div 
                  key={property.id} 
                  className="flex-shrink-0 w-[240px]"
                >
                  <MapPropertyCard
                    property={property}
                    isHovered={hoveredPropertyId === property.id}
                    onHover={onPropertyHover}
                    onSelect={onPropertySelect}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
