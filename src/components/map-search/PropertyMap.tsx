import { useState, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { MapToolbar } from './MapToolbar';
import { DrawControl } from './DrawControl';
import { TrainStationLayer } from './TrainStationLayer';

import { NeighborhoodBoundariesLayer } from './NeighborhoodBoundariesLayer';
import { NeighborhoodChips } from './NeighborhoodChips';
import { SearchThisAreaButton } from './SearchThisAreaButton';
import { MarkerClusterLayer } from './MarkerClusterLayer';
import { MapPropertyPopup } from './MapPropertyPopup';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { useMapKeyboardShortcuts } from '@/hooks/useMapKeyboardShortcuts';
import type { LatLngBounds, Map as LeafletMap } from 'leaflet';
import type { Property } from '@/types/database';
import type { Polygon } from '@/lib/utils/geometry';
import 'leaflet/dist/leaflet.css';

const ISRAEL_CENTER: [number, number] = [31.2, 34.8];
const DEFAULT_ZOOM = 8;
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

interface PropertyMapProps {
  onBoundsChange?: (bounds: LatLngBounds) => void;
  properties?: Property[];
  hoveredPropertyId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  onMarkerClick?: (id: string) => void;
  searchAsMove?: boolean;
  onSearchThisArea?: () => void;
  onPolygonChange?: (polygon: Polygon | null) => void;
  listingStatus?: string;
  cityFilter?: string | null;
  initialCenter?: [number, number];
  initialZoom?: number;
  onMapMove?: (lat: number, lng: number, zoom: number) => void;
}

function MapEventHandler({
  onBoundsChange,
  onZoomChange,
}: {
  onBoundsChange?: (b: LatLngBounds) => void;
  onZoomChange?: (zoom: number) => void;
}) {
  useMapEvents({
    moveend(e) {
      onBoundsChange?.(e.target.getBounds());
      onZoomChange?.(e.target.getZoom());
    },
  });
  return null;
}

export function PropertyMap({
  onBoundsChange,
  properties = [],
  hoveredPropertyId = null,
  onMarkerHover,
  onMarkerClick,
  searchAsMove = true,
  onSearchThisArea,
  onPolygonChange,
  listingStatus = 'for_sale',
  cityFilter = null,
  initialCenter,
  initialZoom,
  onMapMove,
}: PropertyMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(initialZoom ?? DEFAULT_ZOOM);
  const [currentBounds, setCurrentBounds] = useState<LatLngBounds | null>(null);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());
  const [drawnPolygon, setDrawnPolygon] = useState<Polygon | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [boundsChanged, setBoundsChanged] = useState(false);
  const lastQueriedBoundsRef = useRef<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const center: [number, number] = initialCenter ?? ISRAEL_CENTER;
  const startZoom = initialZoom ?? DEFAULT_ZOOM;

  const setMapRef = useCallback((m: LeafletMap | null) => {
    setMap(m);
    mapRef.current = m;
  }, []);

  const handleBoundsChange = useCallback(
    (b: LatLngBounds) => {
      setCurrentBounds(b);
      const c = b.getCenter();
      onMapMove?.(c.lat, c.lng, map?.getZoom() ?? zoom);
      if (searchAsMove) {
        onBoundsChange?.(b);
        lastQueriedBoundsRef.current = b.toBBoxString();
        setBoundsChanged(false);
      } else {
        const bboxStr = b.toBBoxString();
        setBoundsChanged(bboxStr !== lastQueriedBoundsRef.current);
      }
    },
    [searchAsMove, onBoundsChange, onMapMove, map, zoom]
  );

  const handleZoomChange = useCallback((z: number) => {
    setZoom(z);
  }, []);

  const handleSearchThisArea = useCallback(() => {
    if (currentBounds) {
      onBoundsChange?.(currentBounds);
      lastQueriedBoundsRef.current = currentBounds.toBBoxString();
      setBoundsChanged(false);
      onSearchThisArea?.();
    }
  }, [currentBounds, onBoundsChange, onSearchThisArea]);

  const handleMarkerClick = useCallback(
    (id: string) => {
      setActivePropertyId((prev) => (prev === id ? null : id));
      onMarkerClick?.(id);
    },
    [onMarkerClick]
  );

  const handlePopupClose = useCallback(() => {
    setActivePropertyId(null);
  }, []);

  const handleToggleDraw = useCallback(() => {
    setIsDrawMode((prev) => {
      if (prev) {
        // Turning off draw mode, clear polygon
        setDrawnPolygon(null);
        onPolygonChange?.(null);
      } else {
        // Entering draw mode, dismiss active popup
        setActivePropertyId(null);
      }
      return !prev;
    });
  }, [onPolygonChange]);

  const handlePolygonDrawn = useCallback(
    (polygon: Polygon) => {
      setDrawnPolygon(polygon);
      onPolygonChange?.(polygon);
      setIsDrawMode(false);
    },
    [onPolygonChange]
  );

  const handleClearDrawing = useCallback(() => {
    setDrawnPolygon(null);
    setIsDrawMode(false);
    onPolygonChange?.(null);
  }, [onPolygonChange]);

  const handleToggleLayer = useCallback((layerId: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }, []);

  // Keyboard shortcuts
  const handleShowHelp = useCallback(() => setShowHelp(true), []);
  const handleClearSelection = useCallback(() => {
    setActivePropertyId(null);
    if (isDrawMode) {
      setIsDrawMode(false);
      setDrawnPolygon(null);
      onPolygonChange?.(null);
    }
  }, [isDrawMode, onPolygonChange]);

  const handleResetView = useCallback(() => {
    map?.flyTo(ISRAEL_CENTER, DEFAULT_ZOOM, { duration: 1.2 });
  }, [map]);

  const shortcutHandlers = useMemo(() => ({
    onZoomIn: () => map?.zoomIn(),
    onZoomOut: () => map?.zoomOut(),
    onResetView: handleResetView,
    onToggleDraw: handleToggleDraw,
    onClearSelection: handleClearSelection,
    onToggleSavedLocations: () => handleToggleLayer('saved'),
    onToggleTrainStations: () => handleToggleLayer('trains'),
    onToggleHeatmap: () => handleToggleLayer('heatmap'),
    onLocate: () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => map?.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: 1.2 }),
          () => {},
          { enableHighAccuracy: false, timeout: 10000 }
        );
      }
    },
    onShowHelp: handleShowHelp,
  }), [map, handleResetView, handleToggleDraw, handleClearSelection, handleToggleLayer, handleShowHelp]);

  useMapKeyboardShortcuts(mapRef, shortcutHandlers);

  const activeProperty = activePropertyId
    ? properties.find((p) => p.id === activePropertyId)
    : null;

  const showNeighborhoods = activeLayers.has('neighborhoods') && zoom >= 13;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={startZoom}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={false}
        ref={setMapRef}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
        <MapEventHandler onBoundsChange={handleBoundsChange} onZoomChange={handleZoomChange} />

        {/* Property markers */}
        {properties.length > 0 && (
          <MarkerClusterLayer
            properties={properties}
            hoveredPropertyId={hoveredPropertyId}
            activePropertyId={activePropertyId}
            onMarkerClick={handleMarkerClick}
            onMarkerHover={onMarkerHover ?? (() => {})}
          />
        )}

        {/* Train stations layer */}
        {activeLayers.has('trains') && <TrainStationLayer bounds={currentBounds} />}

        {/* Neighborhood boundaries layer */}
        {showNeighborhoods && (
          <NeighborhoodBoundariesLayer city={cityFilter} highlightedNeighborhood={selectedNeighborhood} />
        )}

        {/* Draw control */}
        {isDrawMode && (
          <DrawControl
            onPolygonDrawn={handlePolygonDrawn}
            drawnPolygon={drawnPolygon}
            onClear={handleClearDrawing}
          />
        )}

        {/* Drawn polygon clear chip (when not in draw mode but polygon exists) */}
        {!isDrawMode && drawnPolygon && (
          <DrawControl
            onPolygonDrawn={handlePolygonDrawn}
            drawnPolygon={drawnPolygon}
            onClear={handleClearDrawing}
          />
        )}

        {activeProperty && activeProperty.latitude && activeProperty.longitude && (
          <MapPropertyPopup key={activeProperty.id} property={activeProperty} onClose={handlePopupClose} />
        )}
      </MapContainer>

      {/* Toolbar */}
      <MapToolbar
        map={map}
        isDrawMode={isDrawMode}
        onToggleDraw={handleToggleDraw}
        activeLayers={activeLayers}
        onToggleLayer={handleToggleLayer}
        onShowHelp={handleShowHelp}
      />

      <KeyboardShortcutsDialog open={showHelp} onOpenChange={setShowHelp} />

      {/* Search this area button */}
      {!searchAsMove && boundsChanged && !drawnPolygon && (
        <SearchThisAreaButton onClick={handleSearchThisArea} />
      )}

      {/* Neighborhood chips */}
      {showNeighborhoods && (
        <NeighborhoodChips
          city={cityFilter}
          map={map}
          selectedNeighborhood={selectedNeighborhood}
          onSelect={setSelectedNeighborhood}
        />
      )}
    </div>
  );
}
