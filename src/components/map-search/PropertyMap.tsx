import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Property, ListingStatus } from '@/types/database';
import { PropertyMarker } from './PropertyMarker';
import { MapPropertyPopup } from './MapPropertyPopup';
import { MapToolbar } from './MapToolbar';
import { SavedLocationsLayer } from './SavedLocationsLayer';
import { DrawControl, DrawnPolygon, type DrawMode } from './DrawControl';
import { CityOverlay } from './CityOverlay';
import { NeighborhoodChips } from './NeighborhoodChips';
import { TrainStationLayer } from './TrainStationLayer';
import { PriceHeatmapLayer } from './PriceHeatmapLayer';
import { HeatmapLegend } from './HeatmapLegend';
import { CommuteLines } from './CommuteLines';
import { ClearDrawingButton } from './ClearDrawingButton';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { useAuth } from '@/hooks/useAuth';
import type { MapBounds } from './MapSearchLayout';
import type { Polygon } from '@/lib/utils/geometry';
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
}

// Map click handler to deselect property when clicking empty map
function MapClickHandler({ onDeselect }: { onDeselect: () => void }) {
  useMapEvents({
    click: (e) => {
      // Only deselect if clicking on empty map (not on a marker)
      // Markers stop propagation, so this only fires for empty space
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
    // Skip if programmatic flight in progress
    if (isFlyingRef.current) return;
    if (!searchAsMove) return;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      const bounds = map.getBounds();
      const center = map.getCenter();
      const zoom = map.getZoom();
      
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
  }, [map, onBoundsChange, searchAsMove, isFlyingRef]);

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
  onBoundsChange: (bounds: import('./MapSearchLayout').MapBounds, center: [number, number], zoom: number) => void;
}) {
  const map = useMap();
  const prevCenterRef = useRef<[number, number]>(center);
  const prevZoomRef = useRef<number>(zoom);
  
  useEffect(() => {
    // Check if center or zoom actually changed (comparing values, not references)
    const centerChanged = 
      center[0] !== prevCenterRef.current[0] || 
      center[1] !== prevCenterRef.current[1];
    const zoomChanged = zoom !== prevZoomRef.current;

    if (!centerChanged && !zoomChanged) return;

    // IMPORTANT:
    // The parent updates `center/zoom` state on *manual* map navigation (moveend/zoomend)
    // so we can keep URL + UI in sync.
    // If we call `flyTo()` in response to those changes, the map starts “fighting itself”
    // (manual pan -> state update -> flyTo -> moveend -> refetch -> flicker).
    // Therefore, only run flyTo when the parent explicitly marks this as programmatic.
    if (isProgrammaticMoveRef && !isProgrammaticMoveRef.current) {
      prevCenterRef.current = center;
      prevZoomRef.current = zoom;
      return;
    }
    
    // Mark as flying to prevent bounds updates during animation
    isFlyingRef.current = true;
    
    // Fly to new location with smooth animation
    map.flyTo(center, zoom, { duration: 1.5 });
    
    // Clear flying flag when animation ends and push final bounds
    map.once('moveend', () => {
      isFlyingRef.current = false;
      // Clear programmatic move flag after animation completes
      if (isProgrammaticMoveRef) {
        isProgrammaticMoveRef.current = false;
      }
      
      // Force a final bounds sync so property query updates to new city
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
    
    // Update refs
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
}: PropertyMapProps) {
  const { user } = useAuth();
  const { data: savedLocations } = useSavedLocations();
  const mapRef = useRef<L.Map>(null);
  const isFlyingRef = useRef(false);
  const [showSavedLocations, setShowSavedLocations] = useState(true);
  const [showTrainStations, setShowTrainStations] = useState(false);
  const [showPriceHeatmap, setShowPriceHeatmap] = useState(false);
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

  // Handle draw completion
  const handleDrawComplete = useCallback((polygon: Polygon) => {
    // Capture current map bounds BEFORE disabling searchAsMove
    // This ensures the backend query uses the correct geographic area
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
    // Disable search as move when polygon is drawn
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
  }, [onPolygonChange, onSearchAsMoveChange]);

  // Handle city click from overlay
  const handleCityClick = useCallback((cityName: string, cityCenter: [number, number]) => {
    // Update filters with selected city
    onCitySelect?.(cityName);
  }, [onCitySelect]);

  // Show city overlay when zoomed out
  const showCityOverlay = currentZoom < 10;
  // Show neighborhood chips when zoomed in
  const showNeighborhoodChips = currentZoom >= 12;

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

        {/* Sync external center/zoom to map (for city selection) */}
        <MapViewUpdater 
          center={center} 
          zoom={zoom} 
          isFlyingRef={isFlyingRef} 
          isProgrammaticMoveRef={isProgrammaticMoveRef}
          onBoundsChange={onBoundsChange}
        />

        <ZoomTracker onZoomChange={setCurrentZoom} />

        {/* Click handler to deselect when clicking empty map */}
        <MapClickHandler onDeselect={() => {
          onPropertySelect(null);
          onPropertyHover(null);
        }} />

        {/* Draw Control */}
        <DrawControl
          drawMode={drawMode}
          onDrawComplete={handleDrawComplete}
          onDrawCancel={handleDrawCancel}
        />

        {/* Display drawn polygon */}
        {drawnPolygon && (
          <DrawnPolygon polygon={drawnPolygon} onClear={handleClearPolygon} />
        )}

        {/* City Overlay (when zoomed out) */}
        <CityOverlay
          visible={showCityOverlay}
          listingStatus={listingStatus}
          onCityClick={handleCityClick}
        />
        
        {/* Property Markers (when zoomed in enough) */}
        {!showCityOverlay && properties
          .filter(p => p.latitude && p.longitude)
          .map(property => (
            <PropertyMarker
              key={property.id}
              property={property}
              isHovered={hoveredPropertyId === property.id}
              isSelected={selectedPropertyId === property.id}
              onHover={onPropertyHover}
              onClick={onPropertySelect}
            />
          ))}
        
        {/* Saved Locations Layer */}
        {user && showSavedLocations && savedLocations && savedLocations.length > 0 && (
          <SavedLocationsLayer locations={savedLocations} />
        )}

        {/* Commute Lines (when property is selected and user has saved locations) */}
        {user && showSavedLocations && savedLocations && savedLocations.length > 0 && selectedPropertyId && (
          <CommuteLines
            property={properties.find(p => p.id === selectedPropertyId) || null}
            savedLocations={savedLocations}
          />
        )}

        {/* Train Station Layer */}
        <TrainStationLayer visible={showTrainStations} />

        {/* Price Heatmap Layer */}
        <PriceHeatmapLayer visible={showPriceHeatmap} />
        
        {/* Selected Property Popup */}
        {selectedPropertyId && (
          <MapPropertyPopup
            propertyId={selectedPropertyId}
            properties={properties}
            onClose={() => onPropertySelect(null)}
            savedLocations={savedLocations}
          />
        )}
      </MapContainer>
      
      {/* Map Toolbar */}
      <MapToolbar
        mapRef={mapRef}
        showSavedLocations={showSavedLocations}
        onToggleSavedLocations={() => setShowSavedLocations(!showSavedLocations)}
        hasSavedLocations={!!savedLocations?.length}
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
      />

      {/* Heatmap Legend */}
      <HeatmapLegend visible={showPriceHeatmap} />

      {/* Clear Drawing Button - prominent floating button when polygon exists */}
      <ClearDrawingButton 
        visible={!!drawnPolygon} 
        onClear={handleClearPolygon} 
      />

      {/* Neighborhood Chips (when zoomed in) */}
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
