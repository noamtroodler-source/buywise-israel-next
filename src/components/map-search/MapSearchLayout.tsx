import { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { PropertyMap } from './PropertyMap';
import { MapListPanel } from './MapListPanel';
import { MobileMapSheet } from './MobileMapSheet';
import { MobileMapFilterBar } from './MobileMapFilterBar';
import { MobileMapListToggle } from './MobileMapListToggle';
import { PropertyFilters as PropertyFiltersComponent } from '@/components/filters/PropertyFilters';
import { CreateAlertDialog } from '@/components/filters/CreateAlertDialog';
import { useMapFilters } from '@/hooks/useMapFilters';
import { usePaginatedProperties } from '@/hooks/usePaginatedProperties';
import { useMapProjects } from '@/hooks/useMapProjects';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { isPointInPolygon, deserializePolygon, serializePolygon, type Polygon } from '@/lib/utils/geometry';
import { mergeIntoMapItems, type MapItem } from '@/types/mapItem';
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
  const [drawnPolygon, setDrawnPolygon] = useState<Polygon | null>(() => {
    return urlFilters.polygon ? deserializePolygon(urlFilters.polygon) : null;
  });
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const handleCreateAlert = useCallback(() => setShowAlertDialog(true), []);

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


  const handlePolygonChange = useCallback((polygon: Polygon | null) => {
    setDrawnPolygon(polygon);
    setFilter('polygon', polygon ? serializePolygon(polygon) : null);
  }, [setFilter]);

  const moveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(moveTimerRef.current), []);
  const handleMapMove = useCallback((lat: number, lng: number, zoom: number) => {
    clearTimeout(moveTimerRef.current);
    moveTimerRef.current = setTimeout(() => {
      setMultipleFilters({
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        zoom,
      });
    }, 300);
  }, [setMultipleFilters]);

  const initialCenter = useMemo<[number, number] | undefined>(() => {
    if (urlFilters.lat != null && urlFilters.lng != null) return [urlFilters.lat, urlFilters.lng];
    return undefined;
  }, []);

  const initialZoom = useMemo(() => urlFilters.zoom ?? undefined, []);

  const handleClearFilters = useCallback(() => {
    setMultipleFilters({
      city: null, min_price: null, max_price: null, min_rooms: null, max_rooms: null,
      property_type: null, property_types: null, min_bathrooms: null,
      min_size: null, max_size: null, min_floor: null, max_floor: null,
      min_parking: null, max_days_listed: null, features: null,
    });
  }, [setMultipleFilters]);

  const listingType = urlFilters.status === 'projects' ? 'for_sale' : urlFilters.status;

  // Property filters (skip when projects-only)
  const mergedPropertyFilters: PropertyFilters = useMemo(() => {
    const { city, ...filtersWithoutCity } = componentFilters;
    return {
      ...filtersWithoutCity,
      listing_status: listingType as any,
      bounds: mapBounds ?? undefined,
    };
  }, [componentFilters, listingType, mapBounds]);

  const {
    properties: rawProperties,
    totalCount: propertyCount,
    isLoading: propertiesLoading,
    isFetching: propertiesFetching,
    hasNextPage: propertiesHasNext,
    loadMore: propertiesLoadMore,
  } = usePaginatedProperties(mergedPropertyFilters);

  // Project filters — fetch when status is 'for_sale' or 'projects'
  const shouldFetchProjects = urlFilters.status === 'for_sale' || urlFilters.status === 'projects';

  const projectFilters: PropertyFilters = useMemo(() => {
    const { city, ...filtersWithoutCity } = componentFilters;
    return {
      min_price: filtersWithoutCity.min_price,
      max_price: filtersWithoutCity.max_price,
      bounds: mapBounds ?? undefined,
      sort_by: filtersWithoutCity.sort_by,
    };
  }, [componentFilters, mapBounds]);

  const {
    projects: rawProjects,
    totalCount: projectCount,
    isLoading: projectsLoading,
    isFetching: projectsFetching,
    hasNextPage: projectsHasNext,
    loadMore: projectsLoadMore,
  } = useMapProjects(projectFilters, { enabled: shouldFetchProjects });

  // Client-side polygon filter
  const properties = useMemo(() => {
    if (!drawnPolygon) return rawProperties;
    return rawProperties.filter((p) => {
      if (!p.longitude || !p.latitude) return false;
      return isPointInPolygon([p.longitude, p.latitude], drawnPolygon);
    });
  }, [rawProperties, drawnPolygon]);

  const projects = useMemo(() => {
    if (!shouldFetchProjects) return [];
    if (!drawnPolygon) return rawProjects;
    return rawProjects.filter((p) => {
      if (!p.longitude || !p.latitude) return false;
      return isPointInPolygon([p.longitude, p.latitude], drawnPolygon);
    });
  }, [rawProjects, drawnPolygon, shouldFetchProjects]);

  // Merged items for the list
  const items: MapItem[] = useMemo(() => {
    return mergeIntoMapItems(properties, projects, componentFilters.sort_by);
  }, [properties, projects, componentFilters.sort_by]);

  const totalCount = drawnPolygon
    ? items.length
    : propertyCount + (shouldFetchProjects ? projectCount : 0);

  const isLoading = propertiesLoading;
  const isFetching = propertiesFetching || projectsFetching;
  const hasNextPage = propertiesHasNext || projectsHasNext;

  const loadMore = useCallback(() => {
    propertiesLoadMore();
    if (shouldFetchProjects) projectsLoadMore();
  }, [propertiesLoadMore, projectsLoadMore, shouldFetchProjects]);

  const handleSortChange = useCallback((value: SortOption) => {
    setFilter('sort_by', value);
  }, [setFilter]);

  const handleMarkerHover = useCallback((id: string | null) => {
    setHoveredPropertyId(id);
  }, []);

  const handleCardHover = useCallback((id: string | null) => {
    setHoveredPropertyId(id);
  }, []);

  if (isDesktop) {
    return (
      <>
        <div className="h-[calc(100vh-64px)] flex flex-col">
          <div className="shrink-0 border-b border-border bg-background">
            <PropertyFiltersComponent
              filters={componentFilters}
              onFiltersChange={handleFiltersChange}
              listingType={urlFilters.status}
              mapMode
              showBuyRentToggle
              onBuyRentChange={handleBuyRentChange as any}
              activeView="map"
              previewCount={drawnPolygon ? items.length : totalCount}
              isCountLoading={isFetching}
            />
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[3fr_2fr] min-h-0">
            <PropertyMap
              onBoundsChange={handleBoundsChange}
              properties={properties}
              projects={projects}
              hoveredPropertyId={hoveredPropertyId}
              onMarkerHover={handleMarkerHover}
              onPolygonChange={handlePolygonChange}
              listingStatus={listingType}
              cityFilter={urlFilters.city}
              initialCenter={initialCenter}
              initialZoom={initialZoom}
              onMapMove={handleMapMove}
              onCreateAlert={handleCreateAlert}
            />
            <MapListPanel
              items={items}
              totalCount={drawnPolygon ? items.length : totalCount}
              isLoading={isLoading}
              isFetching={isFetching}
              hasNextPage={hasNextPage}
              loadMore={loadMore}
              sortBy={(urlFilters.sortBy as SortOption) || 'newest'}
              onSortChange={handleSortChange}
              hoveredPropertyId={hoveredPropertyId}
              onCardHover={handleCardHover}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>
        <CreateAlertDialog
          open={showAlertDialog}
          onOpenChange={setShowAlertDialog}
          filters={componentFilters}
          listingType={listingType as 'for_sale' | 'for_rent'}
        />
      </>
    );
  }

  // Mobile layout
  return (
    <>
      <div className="h-[calc(100vh-64px)] relative">
        <PropertyMap
          onBoundsChange={handleBoundsChange}
          properties={properties}
          projects={projects}
          hoveredPropertyId={hoveredPropertyId}
          onMarkerHover={handleMarkerHover}
          onPolygonChange={handlePolygonChange}
          listingStatus={listingType}
          cityFilter={urlFilters.city}
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          onMapMove={handleMapMove}
          onCreateAlert={handleCreateAlert}
        />

        <MobileMapFilterBar
          filters={componentFilters}
          onFiltersChange={handleFiltersChange}
          listingType={listingType}
          onBuyRentChange={handleBuyRentChange}
          previewCount={drawnPolygon ? items.length : totalCount}
          isCountLoading={isFetching}
        />

        <MobileMapListToggle activeView={mobileView} onToggle={handleMobileViewToggle} />

        <MobileMapSheet
          items={items}
          totalCount={drawnPolygon ? items.length : totalCount}
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
      <CreateAlertDialog
        open={showAlertDialog}
        onOpenChange={setShowAlertDialog}
        filters={componentFilters}
        listingType={listingType as 'for_sale' | 'for_rent'}
      />
    </>
  );
}
