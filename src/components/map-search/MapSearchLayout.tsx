import { useCallback, useState, useMemo } from 'react';
import { PropertyMap } from './PropertyMap';
import { MapListPanel } from './MapListPanel';
import { MobileMapSheet } from './MobileMapSheet';
import { MobileMapFilterBar } from './MobileMapFilterBar';
import { MobileMapListToggle } from './MobileMapListToggle';
import { PropertyFilters as PropertyFiltersComponent } from '@/components/filters/PropertyFilters';
import { useMapFilters } from '@/hooks/useMapFilters';
import { usePaginatedProperties } from '@/hooks/usePaginatedProperties';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { isPointInPolygon, type Polygon } from '@/lib/utils/geometry';
import type { PropertyFilters, SortOption, MapBounds, PropertyType } from '@/types/database';
import type { LatLngBounds } from 'leaflet';
import type { MapUrlFilters } from '@/hooks/useMapFilters';

function toBounds(b: LatLngBounds): MapBounds {
  return {
    north: b.getNorth(),
    south: b.getSouth(),
    east: b.getEast(),
    west: b.getWest(),
  };
}

/** Convert URL filter state → PropertyFilters object for the component */
function urlToPropertyFilters(u: MapUrlFilters): PropertyFilters {
  return {
    city: u.city ?? undefined,
    min_price: u.minPrice ?? undefined,
    max_price: u.maxPrice ?? undefined,
    min_rooms: u.minRooms ?? undefined,
    max_rooms: u.maxRooms ?? undefined,
    property_type: (u.propertyType as PropertyType) ?? undefined,
    property_types: (u.propertyTypes as PropertyType[]) ?? undefined,
    min_bathrooms: u.minBathrooms ?? undefined,
    min_size: u.minSize ?? undefined,
    max_size: u.maxSize ?? undefined,
    min_floor: u.minFloor ?? undefined,
    max_floor: u.maxFloor ?? undefined,
    min_parking: u.minParking ?? undefined,
    max_days_listed: u.maxDaysListed ?? undefined,
    features: u.features ?? undefined,
    sort_by: u.sortBy as SortOption,
  };
}

/** Convert PropertyFilters object → flat URL params record */
function propertyFiltersToUrlParams(f: PropertyFilters): Record<string, string | number | null> {
  return {
    city: f.city ?? null,
    min_price: f.min_price ?? null,
    max_price: f.max_price ?? null,
    min_rooms: f.min_rooms ?? null,
    max_rooms: f.max_rooms ?? null,
    property_type: f.property_type ?? null,
    property_types: f.property_types?.length ? f.property_types.join(',') : null,
    min_bathrooms: f.min_bathrooms ?? null,
    min_size: f.min_size ?? null,
    max_size: f.max_size ?? null,
    min_floor: f.min_floor ?? null,
    max_floor: f.max_floor ?? null,
    min_parking: f.min_parking ?? null,
    max_days_listed: f.max_days_listed ?? null,
    features: f.features?.length ? f.features.join(',') : null,
    sort_by: f.sort_by ?? null,
  };
}

export default function MapSearchLayout() {
  const { filters: urlFilters, setFilter, setMultipleFilters } = useMapFilters();
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [drawnPolygon, setDrawnPolygon] = useState<Polygon | null>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Mobile sheet snap state
  const [mobileSnap, setMobileSnap] = useState<string | number | null>('148px');
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

  const handleMobileViewToggle = useCallback((view: 'map' | 'list') => {
    setMobileView(view);
    setMobileSnap(view === 'list' ? 1 : '148px');
  }, []);

  const handleSnapChange = useCallback((snap: string | number | null) => {
    setMobileSnap(snap);
    if (snap === 1) setMobileView('list');
    else setMobileView('map');
  }, []);

  const handleBoundsChange = useCallback((b: LatLngBounds) => {
    setMapBounds(toBounds(b));
  }, []);

  const componentFilters = useMemo(() => urlToPropertyFilters(urlFilters), [urlFilters]);

  const handleFiltersChange = useCallback((newFilters: PropertyFilters) => {
    const params = propertyFiltersToUrlParams(newFilters);
    setMultipleFilters(params);
  }, [setMultipleFilters]);

  const handleBuyRentChange = useCallback((type: 'for_sale' | 'for_rent') => {
    setFilter('status', type);
  }, [setFilter]);

  const handleCityClick = useCallback((city: string) => {
    setFilter('city', city);
  }, [setFilter]);

  const handlePolygonChange = useCallback((polygon: Polygon | null) => {
    setDrawnPolygon(polygon);
  }, []);

  const listingType = urlFilters.status !== 'projects' ? urlFilters.status : 'for_sale';

  const mergedFilters: PropertyFilters = useMemo(() => ({
    ...componentFilters,
    listing_status: listingType as any,
    bounds: mapBounds ?? undefined,
  }), [componentFilters, listingType, mapBounds]);

  const {
    properties: rawProperties,
    totalCount,
    isLoading,
    isFetching,
    hasNextPage,
    loadMore,
  } = usePaginatedProperties(mergedFilters);

  // Client-side polygon filter
  const properties = useMemo(() => {
    if (!drawnPolygon) return rawProperties;
    return rawProperties.filter((p) => {
      if (!p.longitude || !p.latitude) return false;
      return isPointInPolygon([p.longitude, p.latitude], drawnPolygon);
    });
  }, [rawProperties, drawnPolygon]);

  const handleSortChange = useCallback((value: SortOption) => {
    setFilter('sort_by', value);
  }, [setFilter]);

  const handleMarkerHover = useCallback((id: string | null) => {
    setHoveredPropertyId(id);
  }, []);

  const handleCardHover = useCallback((id: string | null) => {
    setHoveredPropertyId(id);
  }, []);

  // Desktop layout
  if (isDesktop) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col">
        <div className="shrink-0 border-b border-border bg-background">
          <PropertyFiltersComponent
            filters={componentFilters}
            onFiltersChange={handleFiltersChange}
            listingType={urlFilters.status}
            mapMode
            showBuyRentToggle
            onBuyRentChange={handleBuyRentChange}
            activeView="map"
            previewCount={drawnPolygon ? properties.length : totalCount}
            isCountLoading={isFetching}
          />
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[3fr_2fr] min-h-0">
          <PropertyMap
            onBoundsChange={handleBoundsChange}
            properties={properties}
            hoveredPropertyId={hoveredPropertyId}
            onMarkerHover={handleMarkerHover}
            onPolygonChange={handlePolygonChange}
            onCityClick={handleCityClick}
            listingStatus={listingType}
            cityFilter={urlFilters.city}
          />
          <MapListPanel
            properties={properties}
            totalCount={drawnPolygon ? properties.length : totalCount}
            isLoading={isLoading}
            isFetching={isFetching}
            hasNextPage={hasNextPage}
            loadMore={loadMore}
            sortBy={(urlFilters.sortBy as SortOption) || 'newest'}
            onSortChange={handleSortChange}
            hoveredPropertyId={hoveredPropertyId}
            onCardHover={handleCardHover}
          />
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="h-[calc(100vh-64px)] relative">
      {/* Full-screen map */}
      <PropertyMap
        onBoundsChange={handleBoundsChange}
        properties={properties}
        hoveredPropertyId={hoveredPropertyId}
        onMarkerHover={handleMarkerHover}
        onPolygonChange={handlePolygonChange}
        onCityClick={handleCityClick}
        listingStatus={listingType}
        cityFilter={urlFilters.city}
      />

      {/* Mobile filter bar overlay */}
      <MobileMapFilterBar
        filters={componentFilters}
        onFiltersChange={handleFiltersChange}
        listingType={listingType}
        onBuyRentChange={handleBuyRentChange}
        previewCount={drawnPolygon ? properties.length : totalCount}
        isCountLoading={isFetching}
      />

      {/* Map/List toggle pill */}
      <MobileMapListToggle activeView={mobileView} onToggle={handleMobileViewToggle} />

      {/* Bottom sheet */}
      <MobileMapSheet
        properties={properties}
        totalCount={drawnPolygon ? properties.length : totalCount}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        loadMore={loadMore}
        sortBy={(urlFilters.sortBy as SortOption) || 'newest'}
        onSortChange={handleSortChange}
        hoveredPropertyId={hoveredPropertyId}
        onCardHover={handleCardHover}
        activeSnap={mobileSnap}
        onSnapChange={handleSnapChange}
      />
    </div>
  );
}
