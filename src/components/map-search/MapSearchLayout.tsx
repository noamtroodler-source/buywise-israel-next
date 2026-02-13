import { useCallback, useState, useMemo } from 'react';
import { PropertyMap } from './PropertyMap';
import { MapListPanel } from './MapListPanel';
import { useMapFilters } from '@/hooks/useMapFilters';
import { usePaginatedProperties } from '@/hooks/usePaginatedProperties';
import type { PropertyFilters, SortOption, MapBounds } from '@/types/database';
import type { LatLngBounds } from 'leaflet';

function toBounds(b: LatLngBounds): MapBounds {
  return {
    north: b.getNorth(),
    south: b.getSouth(),
    east: b.getEast(),
    west: b.getWest(),
  };
}

export default function MapSearchLayout() {
  const { filters: urlFilters, setFilter } = useMapFilters();
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

  const handleBoundsChange = useCallback((b: LatLngBounds) => {
    setMapBounds(toBounds(b));
  }, []);

  // Merge URL filters + map bounds into PropertyFilters for the query hook
  const mergedFilters: PropertyFilters = useMemo(() => ({
    listing_status: urlFilters.status !== 'projects' ? urlFilters.status : 'for_sale',
    city: urlFilters.city ?? undefined,
    min_price: urlFilters.minPrice ?? undefined,
    max_price: urlFilters.maxPrice ?? undefined,
    min_rooms: urlFilters.minRooms ?? undefined,
    max_rooms: urlFilters.maxRooms ?? undefined,
    property_type: urlFilters.propertyType as any ?? undefined,
    sort_by: urlFilters.sortBy as SortOption,
    bounds: mapBounds ?? undefined,
  }), [urlFilters, mapBounds]);

  const {
    properties,
    totalCount,
    isLoading,
    isFetching,
    hasNextPage,
    loadMore,
  } = usePaginatedProperties(mergedFilters);

  const handleSortChange = useCallback((value: SortOption) => {
    setFilter('sort_by', value);
  }, [setFilter]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Filter bar placeholder — reserved for Phase 4 */}
      <div className="h-12 shrink-0 border-b border-border bg-background flex items-center px-4">
        <span className="text-xs text-muted-foreground tracking-wide uppercase">Filters coming soon</span>
      </div>

      {/* Main content: map + list */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[3fr_2fr] min-h-0">
        <PropertyMap onBoundsChange={handleBoundsChange} />
        <MapListPanel
          properties={properties}
          totalCount={totalCount}
          isLoading={isLoading}
          isFetching={isFetching}
          hasNextPage={hasNextPage}
          loadMore={loadMore}
          sortBy={(urlFilters.sortBy as SortOption) || 'newest'}
          onSortChange={handleSortChange}
        />
      </div>
    </div>
  );
}
