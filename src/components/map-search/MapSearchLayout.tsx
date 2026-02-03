import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { PropertyMap } from './PropertyMap';
import { MapPropertyList } from './MapPropertyList';
import { MapFiltersBar } from './MapFiltersBar';
import { MobileMapSheet } from './MobileMapSheet';
import { MobileQuickFilters } from './MobileQuickFilters';
import { MapKeyboardShortcuts } from './MapKeyboardShortcuts';
import { MapOnboardingHints } from './MapOnboardingHints';

import { usePaginatedProperties } from '@/hooks/usePaginatedProperties';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { useMapKeyboardShortcuts } from '@/hooks/useMapKeyboardShortcuts';
import { useRecentSearchCity, saveRecentCity } from '@/hooks/useRecentSearchCity';
import { useCities } from '@/hooks/useCities';
import { PropertyFilters as PropertyFiltersType, ListingStatus, Property } from '@/types/database';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { List, Map as MapIcon, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPointInPolygon, getDistanceInMeters, type Polygon } from '@/lib/utils/geometry';
import type { CommuteFilterValue } from './CommuteFilter';

// Israel bounds for initial view
const ISRAEL_CENTER: [number, number] = [31.5, 34.8];
const ISRAEL_ZOOM = 8;
const CITY_ZOOM = 13;

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export default function MapSearchLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const mapRef = useRef<L.Map | null>(null);
  
  // City data for auto-centering
  const { recentCity, isLoading: recentCityLoading } = useRecentSearchCity();
  const { data: allCities } = useCities();
  
  // Map state
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [searchAsMove, setSearchAsMove] = useState(true);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(ISRAEL_CENTER);
  const [mapZoom, setMapZoom] = useState(ISRAEL_ZOOM);
  
  // Draw-to-search state
  const [drawnPolygon, setDrawnPolygon] = useState<Polygon | null>(null);
  
  // Neighborhood filter state
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);

  // Commute filter state
  const [commuteFilter, setCommuteFilter] = useState<CommuteFilterValue | null>(null);
  
  // Mobile view state
  const [mobileView, setMobileView] = useState<'map' | 'list' | 'split'>('split');
  
  // Layer toggles state (for keyboard shortcuts)
  const [showSavedLocations, setShowSavedLocations] = useState(true);
  const [showTrainStations, setShowTrainStations] = useState(false);
  const [showPriceHeatmap, setShowPriceHeatmap] = useState(false);
  const [drawMode, setDrawMode] = useState<'rectangle' | 'polygon' | 'circle' | null>(null);
  
  // Keyboard shortcuts help modal
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  // Get listing status from URL
  const urlStatus = searchParams.get('status') || 'for_sale';
  const listingStatus: ListingStatus = urlStatus as ListingStatus;
  
  // Check if city is already specified in URL
  const urlCity = searchParams.get('city');

  // Keyboard shortcuts
  useMapKeyboardShortcuts(mapRef, {
    onZoomIn: () => mapRef.current?.zoomIn(),
    onZoomOut: () => mapRef.current?.zoomOut(),
    onResetView: () => mapRef.current?.flyTo([31.5, 34.8], 8, { duration: 1 }),
    onToggleDraw: () => setDrawMode(prev => prev ? null : 'rectangle'),
    onClearSelection: () => {
      setSelectedPropertyId(null);
      if (drawMode) setDrawMode(null);
    },
    onToggleSavedLocations: () => setShowSavedLocations(prev => !prev),
    onToggleTrainStations: () => setShowTrainStations(prev => !prev),
    onToggleHeatmap: () => setShowPriceHeatmap(prev => !prev),
    onLocate: () => mapRef.current?.locate({ setView: true, maxZoom: 14 }),
    onShowHelp: () => setShowKeyboardHelp(true),
  });

  // Parse filters from URL
  const [filters, setFilters] = useState<PropertyFiltersType>(() => {
    const initialFilters: PropertyFiltersType = {
      listing_status: listingStatus,
    };
    
    const city = searchParams.get('city');
    if (city) initialFilters.city = city;
    
    const type = searchParams.get('type');
    if (type) initialFilters.property_type = type as any;
    
    const minPrice = searchParams.get('min_price');
    if (minPrice) initialFilters.min_price = Number(minPrice);
    
    const maxPrice = searchParams.get('max_price');
    if (maxPrice) initialFilters.max_price = Number(maxPrice);
    
    const minRooms = searchParams.get('min_rooms');
    if (minRooms) initialFilters.min_rooms = Number(minRooms);
    
    // Parse map center and zoom from URL
    const center = searchParams.get('center');
    if (center) {
      const [lat, lng] = center.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
      }
    }
    
    const zoom = searchParams.get('zoom');
    if (zoom) {
      const z = Number(zoom);
      if (!isNaN(z)) setMapZoom(z);
    }

    return initialFilters;
  });

  // Auto-center to recent city if available (non-blocking)
  useEffect(() => {
    // Skip if already has city in URL
    if (urlCity) return;
    
    // Wait until recent city is loaded
    if (recentCityLoading) return;
    
    // If we have a recent city, auto-center to it (but don't block anything)
    if (recentCity) {
      setMapCenter([recentCity.lat, recentCity.lng]);
      setMapZoom(CITY_ZOOM);
    }
  }, [recentCity, recentCityLoading, urlCity]);

  // Combined filters with bounds (when searchAsMove is enabled OR polygon is active)
  const queryFilters = useMemo(() => {
    const baseFilters = { ...filters };
    
    // Add neighborhoods to filters if selected
    if (selectedNeighborhoods.length > 0) {
      baseFilters.neighborhoods = selectedNeighborhoods;
    }
    
    // Include bounds when: searchAsMove is enabled OR a polygon is drawn
    // This ensures polygon filtering has the correct geographic dataset to filter
    const shouldIncludeBounds = searchAsMove || drawnPolygon;
    
    if (!shouldIncludeBounds || !mapBounds) return baseFilters;
    
    return {
      ...baseFilters,
      bounds: mapBounds,
    };
  }, [filters, mapBounds, searchAsMove, selectedNeighborhoods, drawnPolygon]);

  // Fetch saved locations for commute filter
  const { data: savedLocations } = useSavedLocations();

  // Fetch properties with bounds filtering
  const { 
    properties: rawProperties, 
    totalCount, 
    isLoading, 
    isFetching,
    hasNextPage,
    loadMore,
    reset,
  } = usePaginatedProperties(queryFilters, { pageSize: 50 });

  // Apply polygon and commute filtering client-side
  const properties = useMemo(() => {
    let filtered = rawProperties;

    // Apply polygon filter
    if (drawnPolygon && drawnPolygon.length > 0) {
      filtered = filtered.filter(property => {
        if (!property.longitude || !property.latitude) return false;
        return isPointInPolygon(
          [property.longitude, property.latitude],
          drawnPolygon
        );
      });
    }

    // Apply commute filter
    if (commuteFilter && savedLocations) {
      const targetLocation = savedLocations.find(l => l.id === commuteFilter.locationId);
      if (targetLocation) {
        const maxDistanceKm = commuteFilter.maxMinutes / 1.2; // Approximate: 1.2 min/km for driving
        
        filtered = filtered.filter(property => {
          if (!property.longitude || !property.latitude) return false;
          const distanceMeters = getDistanceInMeters(
            [property.longitude, property.latitude],
            [targetLocation.longitude, targetLocation.latitude]
          );
          const distanceKm = distanceMeters / 1000;
          const travelTime = distanceKm * 1.2 + 2; // Same formula as CommuteLines
          return travelTime <= commuteFilter.maxMinutes;
        });
      }
    }

    return filtered;
  }, [rawProperties, drawnPolygon, commuteFilter, savedLocations]);

  // Keep listing_status in sync with URL
  useEffect(() => {
    if (filters.listing_status !== listingStatus) {
      setFilters(prev => ({ ...prev, listing_status: listingStatus }));
    }
  }, [listingStatus, filters.listing_status]);

  // Update URL when filters change
  const updateUrlParams = useCallback((newFilters: PropertyFiltersType) => {
    const params = new URLSearchParams();
    params.set('status', urlStatus);
    if (newFilters.city) params.set('city', newFilters.city);
    if (newFilters.property_type) params.set('type', newFilters.property_type);
    if (newFilters.min_price) params.set('min_price', String(newFilters.min_price));
    if (newFilters.max_price) params.set('max_price', String(newFilters.max_price));
    if (newFilters.min_rooms) params.set('min_rooms', String(newFilters.min_rooms));
    // Save map position
    params.set('center', `${mapCenter[0].toFixed(4)},${mapCenter[1].toFixed(4)}`);
    params.set('zoom', String(mapZoom));
    setSearchParams(params, { replace: true });
  }, [urlStatus, setSearchParams, mapCenter, mapZoom]);

  const handleFiltersChange = useCallback((newFilters: PropertyFiltersType) => {
    const updatedFilters = { ...newFilters, listing_status: listingStatus };
    setFilters(updatedFilters);
    updateUrlParams(updatedFilters);
    
    // If city changed, save it and update map position
    if (newFilters.city && newFilters.city !== filters.city) {
      const city = allCities?.find(c => c.name === newFilters.city);
      if (city?.center_lat && city?.center_lng) {
        setMapCenter([city.center_lat, city.center_lng]);
        setMapZoom(CITY_ZOOM);
        saveRecentCity(city.name, city.center_lat, city.center_lng);
      }
    }
  }, [listingStatus, updateUrlParams, filters.city, allCities]);

  const handleBoundsChange = useCallback((bounds: MapBounds, center: [number, number], zoom: number) => {
    setMapBounds(bounds);
    setMapCenter(center);
    setMapZoom(zoom);
  }, []);

  const handlePropertyHover = useCallback((propertyId: string | null) => {
    setHoveredPropertyId(propertyId);
  }, []);

  const handlePropertySelect = useCallback((propertyId: string | null) => {
    setSelectedPropertyId(propertyId);
  }, []);

  const handleSearchAsMoveChange = useCallback((value: boolean) => {
    setSearchAsMove(value);
  }, []);

  const handlePolygonChange = useCallback((polygon: Polygon | null) => {
    setDrawnPolygon(polygon);
  }, []);

  const handleNeighborhoodToggle = useCallback((neighborhood: string) => {
    setSelectedNeighborhoods(prev => 
      prev.includes(neighborhood)
        ? prev.filter(n => n !== neighborhood)
        : [...prev, neighborhood]
    );
  }, []);

  const handleClearNeighborhoods = useCallback(() => {
    setSelectedNeighborhoods([]);
  }, []);

  // Properties with coordinates for map
  const mappableProperties = useMemo(() => 
    properties.filter(p => p.latitude && p.longitude),
    [properties]
  );

  // Shared PropertyMap props
  const propertyMapProps = {
    properties: mappableProperties,
    center: mapCenter,
    zoom: mapZoom,
    onBoundsChange: handleBoundsChange,
    hoveredPropertyId,
    selectedPropertyId,
    onPropertyHover: handlePropertyHover,
    onPropertySelect: handlePropertySelect,
    searchAsMove,
    onSearchAsMoveChange: handleSearchAsMoveChange,
    listingStatus,
    drawnPolygon,
    onPolygonChange: handlePolygonChange,
    selectedNeighborhoods,
    onNeighborhoodToggle: handleNeighborhoodToggle,
    onClearNeighborhoods: handleClearNeighborhoods,
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Filter Bar */}
        <MapFiltersBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          listingType={listingStatus === 'for_rent' ? 'for_rent' : 'for_sale'}
          resultCount={drawnPolygon || commuteFilter ? properties.length : totalCount}
          isLoading={isFetching}
          searchAsMove={searchAsMove}
          onSearchAsMoveChange={handleSearchAsMoveChange}
          savedLocations={savedLocations}
          commuteFilter={commuteFilter}
          onCommuteFilterChange={setCommuteFilter}
        />

        {/* Mobile Quick Filters */}
        <MobileQuickFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          listingType={listingStatus === 'for_rent' ? 'for_rent' : 'for_sale'}
        />
        
        {/* Mobile View Toggle */}
        <div className="flex items-center justify-center gap-1 p-2 border-b bg-background">
          <Button
            variant={mobileView === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMobileView('list')}
            aria-pressed={mobileView === 'list'}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button
            variant={mobileView === 'split' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMobileView('split')}
            aria-pressed={mobileView === 'split'}
          >
            <Layers className="h-4 w-4 mr-1" />
            Split
          </Button>
          <Button
            variant={mobileView === 'map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMobileView('map')}
            aria-pressed={mobileView === 'map'}
          >
            <MapIcon className="h-4 w-4 mr-1" />
            Map
          </Button>
        </div>
        
        {/* Mobile Content */}
        <div className="flex-1 relative overflow-hidden">
          {mobileView === 'map' ? (
            <PropertyMap {...propertyMapProps} />
          ) : mobileView === 'list' ? (
            <MapPropertyList
              properties={properties}
              isLoading={isLoading}
              isFetching={isFetching}
              hasNextPage={hasNextPage}
              loadMore={loadMore}
              hoveredPropertyId={hoveredPropertyId}
              onPropertyHover={handlePropertyHover}
              onPropertySelect={handlePropertySelect}
            />
          ) : (
            <MobileMapSheet
              properties={properties}
              mappableProperties={mappableProperties}
              mapCenter={mapCenter}
              mapZoom={mapZoom}
              onBoundsChange={handleBoundsChange}
              hoveredPropertyId={hoveredPropertyId}
              selectedPropertyId={selectedPropertyId}
              onPropertyHover={handlePropertyHover}
              onPropertySelect={handlePropertySelect}
              searchAsMove={searchAsMove}
              onSearchAsMoveChange={handleSearchAsMoveChange}
              listingStatus={listingStatus}
              drawnPolygon={drawnPolygon}
              onPolygonChange={handlePolygonChange}
              selectedNeighborhoods={selectedNeighborhoods}
              onNeighborhoodToggle={handleNeighborhoodToggle}
              onClearNeighborhoods={handleClearNeighborhoods}
              isLoading={isLoading}
              isFetching={isFetching}
              hasNextPage={hasNextPage}
              loadMore={loadMore}
            />
          )}
        </div>
      </div>
    );
  }

  // Desktop layout with resizable panels
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Filter Bar */}
      <MapFiltersBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        listingType={listingStatus === 'for_rent' ? 'for_rent' : 'for_sale'}
        resultCount={drawnPolygon || commuteFilter ? properties.length : totalCount}
        isLoading={isFetching}
        searchAsMove={searchAsMove}
        onSearchAsMoveChange={handleSearchAsMoveChange}
        savedLocations={savedLocations}
        commuteFilter={commuteFilter}
        onCommuteFilterChange={setCommuteFilter}
      />
      
      {/* Split View */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={55} minSize={35} maxSize={75}>
          <div className="relative h-full">
            <PropertyMap {...propertyMapProps} />
            {/* Onboarding Hints */}
            <MapOnboardingHints 
              visible={true} 
              hasSavedLocations={!!savedLocations?.length} 
            />
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={45} minSize={25} maxSize={65}>
          <MapPropertyList
            properties={properties}
            isLoading={isLoading}
            isFetching={isFetching}
            hasNextPage={hasNextPage}
            loadMore={loadMore}
            hoveredPropertyId={hoveredPropertyId}
            onPropertyHover={handlePropertyHover}
            onPropertySelect={handlePropertySelect}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Keyboard Shortcuts Modal */}
      <MapKeyboardShortcuts 
        open={showKeyboardHelp} 
        onOpenChange={setShowKeyboardHelp} 
      />
    </div>
  );
}
