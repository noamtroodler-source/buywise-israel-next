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
}: { 
  onBoundsChange: (bounds: MapBounds, center: [number, number], zoom: number) => void;
  searchAsMove: boolean;
}) {
  const map = useMap();
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleMoveEnd = useCallback(() => {
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
  }, [map, onBoundsChange, searchAsMove]);

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
}: PropertyMapProps) {
  const { user } = useAuth();
  const { data: savedLocations } = useSavedLocations();
  const mapRef = useRef<L.Map>(null);
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
    // Could filter by city here if needed
  }, []);

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
