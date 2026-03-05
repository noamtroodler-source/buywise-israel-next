import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';
import { MapToolbar } from './MapToolbar';
import { MapLoadingIndicator } from './MapLoadingIndicator';
import { DrawControl } from './DrawControl';
import { TrainStationLayer } from './TrainStationLayer';
import { SavedPlacesLayer } from './SavedPlacesLayer';
import { CityAnchorsLayer } from './CityAnchorsLayer';
import { NeighborhoodBoundariesLayer } from './NeighborhoodBoundariesLayer';
import { NeighborhoodChips } from './NeighborhoodChips';
import { SearchThisAreaButton } from './SearchThisAreaButton';
import { MarkerClusterLayer } from './MarkerClusterLayer';
import { MapPropertyOverlay } from './MapPropertyOverlay';
import { MapProjectOverlay } from './MapProjectOverlay';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { useMapKeyboardShortcuts } from '@/hooks/useMapKeyboardShortcuts';
import type { Property } from '@/types/database';
import type { Project } from '@/types/projects';
import type { Polygon } from '@/lib/utils/geometry';
import { supabase } from '@/integrations/supabase/client';

const ISRAEL_CENTER = { lat: 31.2, lng: 34.8 };
const DEFAULT_ZOOM = 7;

const MAP_STYLES = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#c9e4f5' }] },
  { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#f0f0f0' }] },
];

const containerStyle = { width: '100%', height: '100%' };

interface PropertyMapProps {
  onBoundsChange?: (bounds: google.maps.LatLngBounds) => void;
  properties?: Property[];
  projects?: Project[];
  hoveredPropertyId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  onMarkerClick?: (id: string) => void;
  searchAsMove?: boolean;
  onSearchThisArea?: () => void;
  onPolygonChange?: (polygon: Polygon | null) => void;
  isFetching?: boolean;
  isLoading?: boolean;
  listingStatus?: string;
  cityFilter?: string | null;
  initialCenter?: [number, number];
  initialZoom?: number;
  onMapMove?: (lat: number, lng: number, zoom: number) => void;
  onNeighborhoodFilter?: (name: string | null) => void;
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
  isFetching = false,
  isLoading = false,
  listingStatus = 'for_sale',
  cityFilter = null,
  initialCenter,
  initialZoom,
  onMapMove,
  onNeighborhoodFilter,
}: PropertyMapProps) {
  const { isLoaded } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(initialZoom ?? DEFAULT_ZOOM);
  const [currentBounds, setCurrentBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());
  const [drawnPolygon, setDrawnPolygon] = useState<Polygon | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [boundsChanged, setBoundsChanged] = useState(false);
  const lastQueriedBoundsRef = useRef<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const center = useMemo(() => {
    if (initialCenter) return { lat: initialCenter[0], lng: initialCenter[1] };
    return ISRAEL_CENTER;
  }, []);

  const startZoom = initialZoom ?? DEFAULT_ZOOM;

  const onLoad = useCallback((m: google.maps.Map) => {
    setMap(m);
    mapRef.current = m;
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
    mapRef.current = null;
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
          map.panTo({ lat: data.center_lat, lng: data.center_lng });
          map.setZoom(13);
        }
      });
  }, [cityFilter, map]);

  const boundsToString = (b: google.maps.LatLngBounds) => {
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    return `${sw.lat()},${sw.lng()},${ne.lat()},${ne.lng()}`;
  };

  const handleIdle = useCallback(() => {
    if (!map) return;
    const b = map.getBounds();
    if (!b) return;
    const z = map.getZoom() ?? zoom;
    setZoom(z);
    setCurrentBounds(b);

    const c = b.getCenter();
    onMapMove?.(c.lat(), c.lng(), z);

    if (searchAsMove) {
      onBoundsChange?.(b);
      lastQueriedBoundsRef.current = boundsToString(b);
      setBoundsChanged(false);
    } else {
      const bboxStr = boundsToString(b);
      setBoundsChanged(bboxStr !== lastQueriedBoundsRef.current);
    }
  }, [map, searchAsMove, onBoundsChange, onMapMove, zoom]);

  const handleSearchThisArea = useCallback(() => {
    if (currentBounds) {
      onBoundsChange?.(currentBounds);
      lastQueriedBoundsRef.current = boundsToString(currentBounds);
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
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
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
    map?.panTo(ISRAEL_CENTER);
    map?.setZoom(DEFAULT_ZOOM);
  }, [map]);

  const shortcutHandlers = useMemo(() => ({
    onZoomIn: () => { if (map) map.setZoom((map.getZoom() ?? zoom) + 1); },
    onZoomOut: () => { if (map) map.setZoom((map.getZoom() ?? zoom) - 1); },
    onResetView: handleResetView,
    onToggleDraw: handleToggleDraw,
    onClearSelection: handleClearSelection,
    onToggleSavedLocations: () => handleToggleLayer('saved'),
    onToggleTrainStations: () => handleToggleLayer('trains'),
    onToggleHeatmap: () => handleToggleLayer('heatmap'),
    onLocate: () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            map?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            map?.setZoom(14);
          },
          () => {},
          { enableHighAccuracy: false, timeout: 10000 }
        );
      }
    },
    onShowHelp: handleShowHelp,
  }), [map, zoom, handleResetView, handleToggleDraw, handleClearSelection, handleToggleLayer, handleShowHelp]);

  useMapKeyboardShortcuts(mapRef, shortcutHandlers);

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

  if (!isLoaded) {
    return <div className="h-full w-full bg-muted animate-pulse" />;
  }

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={startZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onIdle={handleIdle}
        options={{
          styles: MAP_STYLES,
          disableDefaultUI: true,
          zoomControl: false,
          gestureHandling: 'greedy',
          clickableIcons: false,
          minZoom: 7,
          maxZoom: 19,
        }}
      >
        {map && (properties.length > 0 || projects.length > 0) && (
          <MarkerClusterLayer
            map={map}
            properties={properties}
            projects={projects}
            hoveredPropertyId={hoveredPropertyId}
            activePropertyId={activePropertyId}
            onMarkerClick={handleMarkerClick}
            onMarkerHover={onMarkerHover ?? (() => {})}
          />
        )}

        {map && activeLayers.has('trains') && <TrainStationLayer map={map} bounds={currentBounds} />}
        {map && activeLayers.has('saved') && <SavedPlacesLayer map={map} bounds={currentBounds} />}
        {map && activeLayers.has('landmarks') && <CityAnchorsLayer map={map} cityFilter={cityFilter} bounds={currentBounds} />}

        {map && showNeighborhoods && (
          <NeighborhoodBoundariesLayer map={map} city={cityFilter} highlightedNeighborhood={selectedNeighborhood} />
        )}

        {map && (isDrawMode || drawnPolygon) && (
          <DrawControl
            map={map}
            isDrawing={isDrawMode}
            onPolygonDrawn={handlePolygonDrawn}
            drawnPolygon={drawnPolygon}
            onClear={handleClearDrawing}
          />
        )}
      </GoogleMap>

      {activeProperty && !isActiveProject && (activeProperty as Property).latitude && (activeProperty as Property).longitude && map && (
        <MapPropertyOverlay
          key={(activeProperty as Property).id}
          property={activeProperty as Property}
          map={map}
          onClose={handlePopupClose}
        />
      )}

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

      <MapLoadingIndicator visible={isFetching && !isLoading} />

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
