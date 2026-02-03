import { useState, useCallback } from 'react';
import { Property, ListingStatus } from '@/types/database';
import { PropertyMap } from './PropertyMap';
import { MapPropertyCard } from './MapPropertyCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import type { MapBounds } from './MapSearchLayout';
import type { Polygon } from '@/lib/utils/geometry';
import { cn } from '@/lib/utils';

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

  const toggleSheet = useCallback(() => {
    setSheetState(prev => {
      if (prev === 'peek') return 'half';
      if (prev === 'half') return 'full';
      return 'half';
    });
  }, []);

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
      <div className={cn("transition-all duration-300", getMapHeight())}>
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
      <div className={cn(
        "bg-background border-t rounded-t-2xl shadow-lg transition-all duration-300",
        getSheetHeight()
      )}>
        {/* Drag Handle */}
        <button
          onClick={toggleSheet}
          className="w-full py-3 flex flex-col items-center justify-center touch-none"
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
                  className="flex-shrink-0 w-[200px]"
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
