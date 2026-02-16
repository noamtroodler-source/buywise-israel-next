import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { MapToolbar } from './MapToolbar';
import { DrawControl } from './DrawControl';
import { TrainStationLayer } from './TrainStationLayer';
import { SavedPlacesLayer } from './SavedPlacesLayer';
import { CityAnchorsLayer } from './CityAnchorsLayer';
import { NeighborhoodBoundariesLayer } from './NeighborhoodBoundariesLayer';
import { SoldTransactionsLayer } from './SoldTransactionsLayer';
import { NeighborhoodChips } from './NeighborhoodChips';
import { SearchThisAreaButton } from './SearchThisAreaButton';
import { MarkerClusterLayer } from './MarkerClusterLayer';
import { MapPropertyOverlay } from './MapPropertyOverlay';
import { MapProjectOverlay } from './MapProjectOverlay';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { useMapKeyboardShortcuts } from '@/hooks/useMapKeyboardShortcuts';
import type { LatLngBounds, Map as LeafletMap } from 'leaflet';
import type { Property } from '@/types/database';
import type { Project } from '@/types/projects';
import type { Polygon } from '@/lib/utils/geometry';
import { supabase } from '@/integrations/supabase/client';
import 'leaflet/dist/leaflet.css';

const ISRAEL_CENTER: [number, number] = [31.0, 34.8];
const DEFAULT_ZOOM = 8;
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

interface PropertyMapProps {
  onBoundsChange?: (bounds: LatLngBounds) => void;
  properties?: Property[];
  projects?: Project[];
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
  projects = [],
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

  // Fly to city when cityFilter changes
  const prevCityRef = useRef<string | null>(cityFilter);
  useEffect(() => {
    if (cityFilter === prevCityRef.current) return;
    prevCityRef.current = cityFilter;
    if (!cityFilter || !map) return;

    supabase
      .from('cities')
      .select('center_lat, center_lng')
      .eq('name', cityFilter)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.center_lat && data?.center_lng) {
          map.flyTo([data.center_lat, data.center_lng], 13, { duration: 1.2 });
        }
      });
  }, [cityFilter, map]);

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
        setDrawnPolygon(null);
        onPolygonChange?.(null);
      } else {
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

  // Determine active overlay — could be property or project
  const activeProperty = useMemo(() => {
    if (!activePropertyId) return null;
    if (activePropertyId.startsWith('project-')) {
      const projectId = activePropertyId.replace('project-', '');
      return projects.find(p => p.id === projectId) ?? null;
    }
    return properties.find(p => p.id === activePropertyId) ?? null;
  }, [activePropertyId, properties, projects]);

  const isActiveProject = activePropertyId?.startsWith('project-') ?? false;

  const showNeighborhoods = activeLayers.has('neighborhoods') && zoom >= 13;
  const showSoldTransactions = activeLayers.has('sold_transactions') && zoom >= 13;

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

        {(properties.length > 0 || projects.length > 0) && (
          <MarkerClusterLayer
            properties={properties}
            projects={projects}
            hoveredPropertyId={hoveredPropertyId}
            activePropertyId={activePropertyId}
            onMarkerClick={handleMarkerClick}
            onMarkerHover={onMarkerHover ?? (() => {})}
          />
        )}

        {activeLayers.has('trains') && <TrainStationLayer bounds={currentBounds} />}
        {activeLayers.has('saved') && <SavedPlacesLayer bounds={currentBounds} />}
        {activeLayers.has('landmarks') && <CityAnchorsLayer cityFilter={cityFilter} bounds={currentBounds} />}
        {showSoldTransactions && <SoldTransactionsLayer bounds={currentBounds} />}

        {showNeighborhoods && (
          <NeighborhoodBoundariesLayer city={cityFilter} highlightedNeighborhood={selectedNeighborhood} />
        )}

        {isDrawMode && (
          <DrawControl
            onPolygonDrawn={handlePolygonDrawn}
            drawnPolygon={drawnPolygon}
            onClear={handleClearDrawing}
          />
        )}

        {!isDrawMode && drawnPolygon && (
          <DrawControl
            onPolygonDrawn={handlePolygonDrawn}
            drawnPolygon={drawnPolygon}
            onClear={handleClearDrawing}
          />
        )}
      </MapContainer>

      {/* Property overlay */}
      {activeProperty && !isActiveProject && (activeProperty as Property).latitude && (activeProperty as Property).longitude && map && (
        <MapPropertyOverlay
          key={(activeProperty as Property).id}
          property={activeProperty as Property}
          map={map}
          onClose={handlePopupClose}
        />
      )}

      {/* Project overlay */}
      {activeProperty && isActiveProject && (activeProperty as Project).latitude && (activeProperty as Project).longitude && map && (
        <MapProjectOverlay
          key={(activeProperty as Project).id}
          project={activeProperty as Project}
          map={map}
          onClose={handlePopupClose}
        />
      )}

      <MapToolbar
        map={map}
        isDrawMode={isDrawMode}
        onToggleDraw={handleToggleDraw}
        activeLayers={activeLayers}
        onToggleLayer={handleToggleLayer}
        onShowHelp={handleShowHelp}
      />

      <KeyboardShortcutsDialog open={showHelp} onOpenChange={setShowHelp} />

      {!searchAsMove && boundsChanged && !drawnPolygon && (
        <SearchThisAreaButton onClick={handleSearchThisArea} />
      )}

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
