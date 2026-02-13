import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Property, ListingStatus } from '@/types/database';
import { PropertyMarker } from './PropertyMarker';
import { ProjectMarker } from './ProjectMarker';
import { MapPropertyPopup } from './MapPropertyPopup';
import { MapProjectPopup } from './MapProjectPopup';
import { MarkerClusterLayer } from './MarkerClusterLayer';
import { SearchThisAreaButton } from './SearchThisAreaButton';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

import { MapToolbar } from './MapToolbar';
import { SavedLocationsLayer } from './SavedLocationsLayer';
import { DrawControl, DrawnPolygon, type DrawMode } from './DrawControl';
import { CityOverlay } from './CityOverlay';
import { NeighborhoodChips } from './NeighborhoodChips';
import { TrainStationLayer } from './TrainStationLayer';
import { PriceHeatmapLayer } from './PriceHeatmapLayer';
import { HeatmapLegend } from './HeatmapLegend';
import { CommuteLines } from './CommuteLines';
import { CommuteFilter, type CommuteFilterValue } from './CommuteFilter';
import { AngloCommunityLayer } from './AngloCommunityLayer';
import { NeighborhoodBoundariesLayer } from './NeighborhoodBoundariesLayer';
import { ClearDrawingButton } from './ClearDrawingButton';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { MapBounds } from './MapSearchLayout';
import type { Polygon } from '@/lib/utils/geometry';
import type { SavedLocation } from '@/types/savedLocation';
import 'leaflet/dist/leaflet.css';

interface PropertyMapProps {
  properties: Property[];
  center: [number, number];
  zoom: number;
  onBoundsChange: (bounds: MapBounds, center: [number, number], zoom: number) => void;
  hoveredPropertyId: string | null;
  selectedPropertyId: string | null;
  onPropertyHover: (id: string | null) => void;
  onPropertySelect: (id: string | null) => void;
  searchAsMove: boolean;
  onSearchAsMoveChange: (value: boolean) => void;
  listingStatus: ListingStatus;
  // Polygon/Draw state
  drawnPolygon: Polygon | null;
  onPolygonChange: (polygon: Polygon | null) => void;
  // Neighborhood state
  selectedNeighborhoods: string[];
  onNeighborhoodToggle: (neighborhood: string) => void;
  onClearNeighborhoods: () => void;
  // City selection callback
  onCitySelect?: (cityName: string) => void;
  // Programmatic move flag (for city-to-city animations)
  isProgrammaticMoveRef?: React.MutableRefObject<boolean>;
  // Current city for boundary layer
  currentCity?: string | null;
  // Commute filter
  commuteFilter?: CommuteFilterValue | null;
  savedLocationsData?: SavedLocation[];
  onCommuteFilterChange?: (value: CommuteFilterValue | null) => void;
}

// Map click handler to deselect property when clicking empty map
function MapClickHandler({ onDeselect }: { onDeselect: () => void }) {
  useMapEvents({
    click: (e) => {
      onDeselect();
    },
  });
  return null;
}

// Map bounds listener component
function MapBoundsListener({ 
  onBoundsChange,
  searchAsMove,
  isFlyingRef,
}: { 
  onBoundsChange: (bounds: MapBounds, center: [number, number], zoom: number) => void;
  searchAsMove: boolean;
  isFlyingRef: React.RefObject<boolean>;
}) {
  const map = useMap();
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleMoveEnd = useCallback(() => {
    if (isFlyingRef.current) return;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      const bounds = map.getBounds();
      const center = map.getCenter();
      const zoom = map.getZoom();
      
      // Always report bounds for position tracking (URL, zoom level, etc.)
      // The parent (MapSearchLayout) gates property queries via frozenBounds
      onBoundsChange(
        {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
        [center.lat, center.lng],
        zoom
      );
    }, 300);
  }, [map, onBoundsChange, isFlyingRef]);

  useMapEvents({
    moveend: handleMoveEnd,
    zoomend: handleMoveEnd,
  });

  // Initial bounds on mount
  useEffect(() => {
    handleMoveEnd();
  }, []);

  return null;
}

// Zoom level tracker for overlays
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();
  
  useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, []);

  return null;
}

// Track user pans when searchAsMove is off
function PanTracker({ 
  searchAsMove, 
  isFlyingRef,
  onUserPanned,
}: { 
  searchAsMove: boolean;
  isFlyingRef: React.RefObject<boolean>;
  onUserPanned: () => void;
}) {
  useMapEvents({
    moveend: () => {
      if (!searchAsMove && !isFlyingRef.current) {
        onUserPanned();
      }
    },
  });
  return null;
}

// Syncs external center/zoom state to the map (for city selection)
function MapViewUpdater({ 
  center, 
  zoom,
  isFlyingRef,
  isProgrammaticMoveRef,
  onBoundsChange,
}: { 
  center: [number, number]; 
  zoom: number;
  isFlyingRef: React.MutableRefObject<boolean>;
  isProgrammaticMoveRef?: React.MutableRefObject<boolean>;
  onBoundsChange: (bounds: MapBounds, center: [number, number], zoom: number) => void;
}) {
  const map = useMap();
  const prevCenterRef = useRef<[number, number]>(center);
  const prevZoomRef = useRef<number>(zoom);
  
  useEffect(() => {
    const centerChanged = 
      center[0] !== prevCenterRef.current[0] || 
      center[1] !== prevCenterRef.current[1];
    const zoomChanged = zoom !== prevZoomRef.current;

    if (!centerChanged && !zoomChanged) return;

    if (isProgrammaticMoveRef && !isProgrammaticMoveRef.current) {
      prevCenterRef.current = center;
      prevZoomRef.current = zoom;
      return;
    }
    
    isFlyingRef.current = true;
    map.flyTo(center, zoom, { duration: 1.5 });
    
    map.once('moveend', () => {
      isFlyingRef.current = false;
      if (isProgrammaticMoveRef) {
        isProgrammaticMoveRef.current = false;
      }
      
      const finalBounds = map.getBounds();
      const finalCenter = map.getCenter();
      const finalZoom = map.getZoom();
      onBoundsChange(
        {
          north: finalBounds.getNorth(),
          south: finalBounds.getSouth(),
          east: finalBounds.getEast(),
          west: finalBounds.getWest(),
        },
        [finalCenter.lat, finalCenter.lng],
        finalZoom
      );
    });
    
    prevCenterRef.current = center;
    prevZoomRef.current = zoom;
  }, [map, center, zoom, isFlyingRef, isProgrammaticMoveRef, onBoundsChange]);
  
  return null;
}


export function PropertyMap({
  properties,
  center,
  zoom,
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
  onCitySelect,
  isProgrammaticMoveRef,
  currentCity,
  commuteFilter,
  savedLocationsData,
  onCommuteFilterChange,
}: PropertyMapProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recentPropertyIds } = useRecentlyViewed();
  const viewedPropertyIds = useMemo(() => new Set(recentPropertyIds), [recentPropertyIds]);
  const { data: savedLocations } = useSavedLocations();
  const mapRef = useRef<L.Map>(null);
  const isFlyingRef = useRef(false);
  const [showSavedLocations, setShowSavedLocations] = useState(true);
  const [showTrainStations, setShowTrainStations] = useState(false);
  const [showPriceHeatmap, setShowPriceHeatmap] = useState(false);
  const [showAngloCommunity, setShowAngloCommunity] = useState(false);
  const [showNeighborhoodBoundaries, setShowNeighborhoodBoundaries] = useState(true);
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showSearchButton, setShowSearchButton] = useState(false);

  // Fetch projects for Buy mode (only when zoomed in enough)
  const { data: projects } = useQuery({
    queryKey: ['map-projects', mapBounds, listingStatus],
    queryFn: async () => {
      if (!mapBounds) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, slug, city, latitude, longitude, price_from, status')
        .eq('is_published', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .gte('latitude', mapBounds.south)
        .lte('latitude', mapBounds.north)
        .gte('longitude', mapBounds.west)
        .lte('longitude', mapBounds.east);
      
      if (error) {
        console.error('Error fetching projects:', error);
        return [];
      }
      return data || [];
    },
    enabled: listingStatus === 'for_sale' && currentZoom >= 10 && !!mapBounds,
    staleTime: 30000,
  });

  // Handle draw completion
  const handleDrawComplete = useCallback((polygon: Polygon) => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      onBoundsChange(
        {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
        [center.lat, center.lng],
        zoom
      );
    }
    
    onPolygonChange(polygon);
    setDrawMode(null);
    onSearchAsMoveChange(false);
  }, [onPolygonChange, onSearchAsMoveChange, onBoundsChange]);

  // Handle draw cancel
  const handleDrawCancel = useCallback(() => {
    setDrawMode(null);
  }, []);

  // Handle clear polygon
  const handleClearPolygon = useCallback(() => {
    onPolygonChange(null);
    onSearchAsMoveChange(true);
    setShowSearchButton(false);
  }, [onPolygonChange, onSearchAsMoveChange]);

  // Handle city click from overlay
  const handleCityClick = useCallback((cityName: string, cityCenter: [number, number]) => {
    onCitySelect?.(cityName);
  }, [onCitySelect]);

  // Handle "Search this area" click
  const handleSearchThisArea = useCallback(() => {
    setShowSearchButton(false);
    onSearchAsMoveChange(true);
    // Force bounds update
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      onBoundsChange(
        {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
        [center.lat, center.lng],
        zoom
      );
    }
  }, [onSearchAsMoveChange, onBoundsChange]);

  // Handle user pan when searchAsMove is off
  const handleUserPanned = useCallback(() => {
    if (!drawnPolygon) {
      setShowSearchButton(true);
    }
  }, [drawnPolygon]);

  // Hide search button when searchAsMove gets enabled
  useEffect(() => {
    if (searchAsMove) {
      setShowSearchButton(false);
    }
  }, [searchAsMove]);

  // Show city overlay when zoomed out
  const showCityOverlay = currentZoom < 10;
  // Show neighborhood chips when zoomed in
  const showNeighborhoodChips = currentZoom >= 12;

  // Effective saved locations (prefer prop, fallback to hook)
  const effectiveSavedLocations = savedLocationsData || savedLocations;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        <MapBoundsListener 
          onBoundsChange={(b, c, z) => {
            onBoundsChange(b, c, z);
            setCurrentZoom(z);
            setMapBounds(b);
          }}
          searchAsMove={searchAsMove}
          isFlyingRef={isFlyingRef}
        />

        <MapViewUpdater 
          center={center} 
          zoom={zoom} 
          isFlyingRef={isFlyingRef} 
          isProgrammaticMoveRef={isProgrammaticMoveRef}
          onBoundsChange={onBoundsChange}
        />

        <ZoomTracker onZoomChange={setCurrentZoom} />

        {/* Track user pans for "Search this area" button */}
        <PanTracker 
          searchAsMove={searchAsMove} 
          isFlyingRef={isFlyingRef}
          onUserPanned={handleUserPanned}
        />

        <MapClickHandler onDeselect={() => {
          onPropertySelect(null);
          onPropertyHover(null);
          setSelectedProjectId(null);
        }} />

        <DrawControl
          drawMode={drawMode}
          onDrawComplete={handleDrawComplete}
          onDrawCancel={handleDrawCancel}
        />

        {drawnPolygon && (
          <DrawnPolygon polygon={drawnPolygon} onClear={handleClearPolygon} />
        )}

        <CityOverlay
          visible={showCityOverlay}
          listingStatus={listingStatus}
          onCityClick={handleCityClick}
        />
        
        {/* Property Markers with clustering */}
        {!showCityOverlay && (
          <MarkerClusterLayer
            properties={properties.filter(p => p.latitude && p.longitude)}
            mapBounds={mapBounds}
            zoom={currentZoom}
            hoveredPropertyId={hoveredPropertyId}
            selectedPropertyId={selectedPropertyId}
            viewedPropertyIds={viewedPropertyIds}
            onHover={onPropertyHover}
            onClick={onPropertySelect}
          />
        )}

        {/* Project Markers (Buy mode only) */}
        {!showCityOverlay && listingStatus === 'for_sale' && projects?.map(project => (
          <ProjectMarker
            key={`project-${project.id}`}
            project={project}
            isHovered={hoveredProjectId === project.id}
            isSelected={selectedProjectId === project.id}
            onHover={setHoveredProjectId}
            onClick={(_slug: string) => {
              onPropertySelect(null); // clear property popup
              setSelectedProjectId(project.id);
            }}
          />
        ))}

        {/* Saved Locations Layer */}
        {user && showSavedLocations && effectiveSavedLocations && effectiveSavedLocations.length > 0 && (
          <SavedLocationsLayer locations={effectiveSavedLocations} />
        )}

        {/* Commute Lines */}
        {user && showSavedLocations && effectiveSavedLocations && effectiveSavedLocations.length > 0 && selectedPropertyId && (
          <CommuteLines
            property={properties.find(p => p.id === selectedPropertyId) || null}
            savedLocations={effectiveSavedLocations}
          />
        )}

        <TrainStationLayer visible={showTrainStations} />
        <PriceHeatmapLayer visible={showPriceHeatmap} />
        <AngloCommunityLayer visible={showAngloCommunity} />

        <NeighborhoodBoundariesLayer 
          visible={showNeighborhoodBoundaries} 
          currentCity={currentCity || null} 
        />
        
        {selectedPropertyId && !selectedProjectId && (
          <MapPropertyPopup
            key={selectedPropertyId}
            propertyId={selectedPropertyId}
            properties={properties}
            onClose={() => onPropertySelect(null)}
            savedLocations={effectiveSavedLocations}
          />
        )}

        {/* Project Popup */}
        {selectedProjectId && (() => {
          const proj = projects?.find(p => p.id === selectedProjectId);
          return proj ? (
            <MapProjectPopup
              key={selectedProjectId}
              project={proj}
              onClose={() => setSelectedProjectId(null)}
            />
          ) : null;
        })()}
      </MapContainer>
      
      {/* Search This Area Button */}
      <SearchThisAreaButton
        visible={showSearchButton}
        onClick={handleSearchThisArea}
      />

      {/* Map empty state */}
      {properties.length === 0 && currentZoom >= 10 && !showCityOverlay && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[40] bg-background/95 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-md border text-sm text-muted-foreground">
          No properties here. Try zooming out or adjusting filters.
        </div>
      )}

      {/* Map Toolbar */}
      <MapToolbar
        mapRef={mapRef}
        showSavedLocations={showSavedLocations}
        onToggleSavedLocations={() => setShowSavedLocations(!showSavedLocations)}
        hasSavedLocations={!!effectiveSavedLocations?.length}
        searchAsMove={searchAsMove}
        onSearchAsMoveChange={onSearchAsMoveChange}
        drawMode={drawMode}
        onDrawModeChange={setDrawMode}
        hasDrawnPolygon={!!drawnPolygon}
        onClearPolygon={handleClearPolygon}
        showTrainStations={showTrainStations}
        onToggleTrainStations={() => setShowTrainStations(!showTrainStations)}
        showPriceHeatmap={showPriceHeatmap}
        onTogglePriceHeatmap={() => setShowPriceHeatmap(!showPriceHeatmap)}
        showAngloCommunity={showAngloCommunity}
        onToggleAngloCommunity={() => setShowAngloCommunity(!showAngloCommunity)}
        showNeighborhoodBoundaries={showNeighborhoodBoundaries}
        onToggleNeighborhoodBoundaries={() => setShowNeighborhoodBoundaries(!showNeighborhoodBoundaries)}
      />

      <HeatmapLegend visible={showPriceHeatmap} />

      <ClearDrawingButton 
        visible={!!drawnPolygon} 
        onClear={handleClearPolygon} 
      />

      {/* Commute Filter - bottom left */}
      {user && effectiveSavedLocations && effectiveSavedLocations.length > 0 && onCommuteFilterChange && (
        <div className="absolute bottom-4 left-4 z-[40]">
          <CommuteFilter
            savedLocations={effectiveSavedLocations}
            value={commuteFilter || null}
            onChange={onCommuteFilterChange}
          />
        </div>
      )}

      <NeighborhoodChips
        visible={showNeighborhoodChips}
        mapBounds={mapBounds}
        selectedNeighborhoods={selectedNeighborhoods}
        onNeighborhoodToggle={onNeighborhoodToggle}
        onClearNeighborhoods={onClearNeighborhoods}
      />
    </div>
  );
}
