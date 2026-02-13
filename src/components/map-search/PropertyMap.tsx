import { useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { MapToolbar } from './MapToolbar';
import { DrawControl } from './DrawControl';
import { TrainStationLayer } from './TrainStationLayer';
import { CityOverlayLayer } from './CityOverlayLayer';
import { NeighborhoodBoundariesLayer } from './NeighborhoodBoundariesLayer';
import { NeighborhoodChips } from './NeighborhoodChips';
import { SearchThisAreaButton } from './SearchThisAreaButton';
import { MarkerClusterLayer } from './MarkerClusterLayer';
import { MapPropertyPopup } from './MapPropertyPopup';
import type { LatLngBounds, Map as LeafletMap } from 'leaflet';
import type { Property } from '@/types/database';
import type { Polygon } from '@/lib/utils/geometry';
import 'leaflet/dist/leaflet.css';

const ISRAEL_CENTER: [number, number] = [31.5, 34.8];
const DEFAULT_ZOOM = 8;
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

interface PropertyMapProps {
  onBoundsChange?: (bounds: LatLngBounds) => void;
  properties?: Property[];
  hoveredPropertyId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  onMarkerClick?: (id: string) => void;
  // Phase 5 props
  searchAsMove?: boolean;
  onSearchThisArea?: () => void;
  onPolygonChange?: (polygon: Polygon | null) => void;
  onCityClick?: (city: string) => void;
  listingStatus?: string;
  cityFilter?: string | null;
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
  onCityClick,
  listingStatus = 'for_sale',
  cityFilter = null,
}: PropertyMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [currentBounds, setCurrentBounds] = useState<LatLngBounds | null>(null);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());
  const [drawnPolygon, setDrawnPolygon] = useState<Polygon | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [boundsChanged, setBoundsChanged] = useState(false);
  const lastQueriedBoundsRef = useRef<string | null>(null);

  const handleBoundsChange = useCallback(
    (b: LatLngBounds) => {
      setCurrentBounds(b);
      if (searchAsMove) {
        onBoundsChange?.(b);
        lastQueriedBoundsRef.current = b.toBBoxString();
        setBoundsChanged(false);
      } else {
        const bboxStr = b.toBBoxString();
        setBoundsChanged(bboxStr !== lastQueriedBoundsRef.current);
      }
    },
    [searchAsMove, onBoundsChange]
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

  const activeProperty = activePropertyId
    ? properties.find((p) => p.id === activePropertyId)
    : null;

  const showNeighborhoods = activeLayers.has('neighborhoods') && zoom >= 13;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={ISRAEL_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={false}
        ref={setMap}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
        <MapEventHandler onBoundsChange={handleBoundsChange} onZoomChange={handleZoomChange} />

        {/* City overlay at low zoom */}
        {zoom < 12 && (
          <CityOverlayLayer
            bounds={currentBounds}
            listingStatus={listingStatus}
            map={map}
            onCityClick={onCityClick}
          />
        )}

        {/* Property markers at higher zoom */}
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
      />

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
