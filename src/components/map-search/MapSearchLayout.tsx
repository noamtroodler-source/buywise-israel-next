import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { PropertyMap } from './PropertyMap';
import { MapPropertyList } from './MapPropertyList';
import { PropertyFilters } from '@/components/filters/PropertyFilters';
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
  const isProgrammaticMoveRef = useRef(false);
  const cityDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDetectedCityRef = useRef<string | null>(null);
  const pendingDetectedCityRef = useRef<string | null>(null);
  const pendingDetectedCityCountRef = useRef(0);

  // Initial map view from URL (MapContainer only reads props on mount; we also keep state in sync)
  const initialMapCenter = (() => {
    const center = searchParams.get('center');
    if (center) {
      const [lat, lng] = center.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) return [lat, lng] as [number, number];
    }
    return ISRAEL_CENTER;
  })();

  const initialMapZoom = (() => {
    const zoom = searchParams.get('zoom');
    if (zoom) {
      const z = Number(zoom);
      if (!isNaN(z)) return z;
    }
    return ISRAEL_ZOOM;
  })();
  
  // City data for auto-centering
  const { recentCity, isLoading: recentCityLoading } = useRecentSearchCity();
  const { data: allCities } = useCities();
  
  // Map state
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [frozenBounds, setFrozenBounds] = useState<MapBounds | null>(null); // Bounds when searchAsMove was disabled
  const [searchAsMove, setSearchAsMove] = useState(true);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialMapCenter);
  const [mapZoom, setMapZoom] = useState(initialMapZoom);
  
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

  // Cleanup city detection timeout on unmount
  useEffect(() => {
    return () => {
      if (cityDetectionTimeoutRef.current) {
        clearTimeout(cityDetectionTimeoutRef.current);
      }
    };
  }, []);

  // Handle searchAsMove toggle - freeze bounds when disabled
  const handleSearchAsMoveChange = useCallback((enabled: boolean) => {
    if (!enabled && mapBounds) {
      // Freeze current bounds when disabling
      setFrozenBounds(mapBounds);
    } else if (enabled) {
      // Clear frozen bounds when enabling
      setFrozenBounds(null);
    }
    setSearchAsMove(enabled);
  }, [mapBounds]);

  // Combined filters with bounds
  const queryFilters = useMemo(() => {
    const baseFilters = { ...filters };
    
    // Add neighborhoods to filters if selected
    if (selectedNeighborhoods.length > 0) {
      baseFilters.neighborhoods = selectedNeighborhoods;
    }
    
    // Determine which bounds to use:
    // - If searchAsMove is ON: use current map bounds (live updates)
    // - If searchAsMove is OFF: use frozen bounds (static results)
    // - If polygon is drawn: always include bounds for proper dataset
    const boundsToUse = searchAsMove ? mapBounds : (frozenBounds || mapBounds);
    const shouldIncludeBounds = boundsToUse && (searchAsMove || frozenBounds || drawnPolygon);
    
    if (!shouldIncludeBounds || !boundsToUse) return baseFilters;
    
    return {
      ...baseFilters,
      bounds: boundsToUse,
    };
  }, [filters, mapBounds, frozenBounds, searchAsMove, selectedNeighborhoods, drawnPolygon]);

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
  const updateUrlParams = useCallback((newFilters: PropertyFiltersType, nextCenter?: [number, number], nextZoom?: number) => {
    const centerToSave = nextCenter ?? mapCenter;
    const zoomToSave = nextZoom ?? mapZoom;
    const params = new URLSearchParams();
    params.set('status', urlStatus);
    if (newFilters.city) params.set('city', newFilters.city);
    if (newFilters.property_type) params.set('type', newFilters.property_type);
    if (newFilters.min_price) params.set('min_price', String(newFilters.min_price));
    if (newFilters.max_price) params.set('max_price', String(newFilters.max_price));
    if (newFilters.min_rooms) params.set('min_rooms', String(newFilters.min_rooms));
    // Save map position
    params.set('center', `${centerToSave[0].toFixed(4)},${centerToSave[1].toFixed(4)}`);
    params.set('zoom', String(zoomToSave));
    setSearchParams(params, { replace: true });
  }, [urlStatus, setSearchParams, mapCenter, mapZoom]);

  const handleFiltersChange = useCallback((newFilters: PropertyFiltersType) => {
    const updatedFilters = { ...newFilters, listing_status: listingStatus };
    
    // Check if city was CLEARED (had a value, now undefined)
    const cityCleared = filters.city && !newFilters.city;
    if (cityCleared) {
      // Set flag to prevent handleBoundsChange from overwriting during animation
      isProgrammaticMoveRef.current = true;
      // Zoom back out to show all of Israel
      const nextCenter = ISRAEL_CENTER;
      const nextZoom = ISRAEL_ZOOM;
      setMapCenter(nextCenter);
      setMapZoom(nextZoom);
      setFilters(updatedFilters);
      updateUrlParams(updatedFilters, nextCenter, nextZoom);
      return;
    }
    
    // If city changed to a NEW city, compute the next center/zoom first so the map reliably fly-zooms.
    const cityChanged = newFilters.city && newFilters.city !== filters.city;
    if (cityChanged) {
      const city = allCities?.find(c => c.name === newFilters.city);
      if (city?.center_lat && city?.center_lng) {
        // Set flag to prevent handleBoundsChange from overwriting during animation
        isProgrammaticMoveRef.current = true;
        const nextCenter: [number, number] = [city.center_lat, city.center_lng];
        const nextZoom = CITY_ZOOM;
        setMapCenter(nextCenter);
        setMapZoom(nextZoom);
        saveRecentCity(city.name, city.center_lat, city.center_lng);
        setFilters(updatedFilters);
        updateUrlParams(updatedFilters, nextCenter, nextZoom);
        return;
      }
    }

    // Default: no special map view update
    setFilters(updatedFilters);
    updateUrlParams(updatedFilters);
  }, [listingStatus, updateUrlParams, filters.city, allCities]);

  // Helper: Find closest city to given coordinates
  const findCityByCoordinates = useCallback((lat: number, lng: number): string | null => {
    if (!allCities) return null;
    
    const MAX_DISTANCE_KM = 10; // Increased from 5km for more stable detection at boundaries
    let closestCity: string | null = null;
    let minDistance = Infinity;
    
    for (const city of allCities) {
      if (!city.center_lat || !city.center_lng) continue;
      
      const distanceKm = getDistanceInMeters(
        [lng, lat], 
        [city.center_lng, city.center_lat]
      ) / 1000;
      
      if (distanceKm < minDistance && distanceKm < MAX_DISTANCE_KM) {
        minDistance = distanceKm;
        closestCity = city.name;
      }
    }
    
    return closestCity;
  }, [allCities]);

  // Debounced city detection - runs 800ms after user stops moving
  // Uses hysteresis + “2 confirmations” to prevent flicker while navigating city-to-city.
  const detectAndUpdateCity = useCallback((center: [number, number], zoom: number) => {
    if (!allCities) return;

    const ENTER_ZOOM = 12;
    const EXIT_ZOOM = 11; // only clear when clearly zoomed out to avoid toggling around 11-12

    // Clear when sufficiently zoomed out
    if (zoom <= EXIT_ZOOM) {
      pendingDetectedCityRef.current = null;
      pendingDetectedCityCountRef.current = 0;
      if (lastDetectedCityRef.current !== null) {
        lastDetectedCityRef.current = null;
        setFilters(prev => ({ ...prev, city: undefined, listing_status: listingStatus }));
      }
      return;
    }

    // Only attempt detection when zoomed in enough
    if (zoom < ENTER_ZOOM) return;

    const detectedCity = findCityByCoordinates(center[0], center[1]);

    // If we're not confidently in a city, don't force-clearing; keep current city to avoid flashing.
    if (!detectedCity) {
      pendingDetectedCityRef.current = null;
      pendingDetectedCityCountRef.current = 0;
      return;
    }

    // Require 2 consecutive detections of the same city before committing.
    if (pendingDetectedCityRef.current === detectedCity) {
      pendingDetectedCityCountRef.current += 1;
    } else {
      pendingDetectedCityRef.current = detectedCity;
      pendingDetectedCityCountRef.current = 1;
    }

    if (pendingDetectedCityCountRef.current < 2) return;

    if (detectedCity !== lastDetectedCityRef.current) {
      lastDetectedCityRef.current = detectedCity;
      setFilters(prev => ({ ...prev, city: detectedCity, listing_status: listingStatus }));
      // Note: NOT updating URL here to reduce re-renders during navigation
    }
  }, [allCities, findCityByCoordinates, listingStatus]);

  const handleBoundsChange = useCallback((bounds: MapBounds, center: [number, number], zoom: number) => {
    // Always update mapBounds so property queries get correct viewport
    setMapBounds(bounds);
    
    // Skip updates during programmatic moves (city selection animations)
    if (isProgrammaticMoveRef.current) return;
    
    setMapCenter(center);
    setMapZoom(zoom);
    
    // Schedule debounced city detection (800ms after user stops moving)
    if (cityDetectionTimeoutRef.current) {
      clearTimeout(cityDetectionTimeoutRef.current);
    }
    
    cityDetectionTimeoutRef.current = setTimeout(() => {
      detectAndUpdateCity(center, zoom);
    }, 800);
  }, [detectAndUpdateCity]); // Minimal dependencies - much more stable

  const handlePropertyHover = useCallback((propertyId: string | null) => {
    setHoveredPropertyId(propertyId);
  }, []);

  const handlePropertySelect = useCallback((propertyId: string | null) => {
    setSelectedPropertyId(propertyId);
  }, []);

  // Note: handleSearchAsMoveChange is defined earlier to support frozen bounds logic

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

  // Handle city selection from map overlay
  const handleCitySelect = useCallback((cityName: string) => {
    handleFiltersChange({ ...filters, city: cityName });
  }, [filters, handleFiltersChange]);

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
    onCitySelect: handleCitySelect,
    isProgrammaticMoveRef,
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Filter Bar */}
        <PropertyFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          listingType={listingStatus === 'for_rent' ? 'for_rent' : 'for_sale'}
          showBuyRentToggle={true}
          onBuyRentChange={(type) => {
            const params = new URLSearchParams(searchParams);
            params.set('status', type);
            setSearchParams(params);
          }}
          previewCount={drawnPolygon || commuteFilter ? properties.length : totalCount}
          isCountLoading={isFetching}
          activeView="map"
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
      <PropertyFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        listingType={listingStatus === 'for_rent' ? 'for_rent' : 'for_sale'}
        showBuyRentToggle={true}
        onBuyRentChange={(type) => {
          const params = new URLSearchParams(searchParams);
          params.set('status', type);
          setSearchParams(params);
        }}
        previewCount={drawnPolygon || commuteFilter ? properties.length : totalCount}
        isCountLoading={isFetching}
        activeView="map"
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
