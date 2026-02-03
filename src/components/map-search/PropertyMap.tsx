import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Marker } from '@/vendor/react-leaflet';
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
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { useAuth } from '@/hooks/useAuth';
import type { MapBounds } from './MapSearchLayout';
import type { Polygon } from '@/lib/utils/geometry';
import 'leaflet/dist/leaflet.css';
import useSupercluster from 'use-supercluster';

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

// Get cluster size tier based on property count
function getClusterSizeTier(count: number): 'small' | 'medium' | 'large' {
  if (count <= 10) return 'small';
  if (count <= 50) return 'medium';
  return 'large';
}

interface ClusterMarkerProps {
  position: [number, number];
  count: number;
  priceRange: string;
  onClick: () => void;
}

function ClusterMarker({ position, count, priceRange, onClick }: ClusterMarkerProps) {
  const sizeTier = getClusterSizeTier(count);
  
  const icon = useMemo(() => {
    const sizes = {
      small: { iconSize: 50, anchor: 25 },
      medium: { iconSize: 65, anchor: 32.5 },
      large: { iconSize: 80, anchor: 40 },
    };
    
    const { iconSize, anchor } = sizes[sizeTier];
    
    return L.divIcon({
      html: `
        <div class="cluster-marker ${sizeTier}">
          <span class="cluster-count">${count}</span>
          <span class="cluster-price">${priceRange}</span>
        </div>
      `,
      className: '',
      iconSize: L.point(iconSize, iconSize),
      iconAnchor: L.point(anchor, anchor),
    });
  }, [count, priceRange, sizeTier]);

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: onClick,
      }}
    />
  );
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
  
  // Convert properties to GeoJSON points for clustering
  const points = useMemo(() => 
    properties
      .filter(p => p.latitude && p.longitude)
      .map(property => ({
        type: 'Feature' as const,
        properties: {
          cluster: false,
          propertyId: property.id,
          price: property.price,
          listingStatus: property.listing_status,
          property,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [property.longitude!, property.latitude!],
        },
      })),
    [properties]
  );

  // Get map bounds for clustering
  const [clusterBounds, setClusterBounds] = useState<[number, number, number, number]>([-180, -85, 180, 85]);

  // Supercluster hook
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: clusterBounds,
    zoom: currentZoom,
    options: {
      radius: 75,
      maxZoom: 17,
      minZoom: 0,
    },
  });

  // Format price range for cluster
  const formatClusterPriceRange = useCallback((clusterProperties: any[]) => {
    const prices = clusterProperties.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    const formatCompact = (n: number) => {
      if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
      if (n >= 1000) return `${Math.round(n / 1000)}K`;
      return String(n);
    };
    
    if (min === max) return formatCompact(min);
    return `${formatCompact(min)}-${formatCompact(max)}`;
  }, []);

  // Handle cluster click - zoom in
  const handleClusterClick = useCallback((clusterId: number, coordinates: [number, number]) => {
    if (!supercluster || !mapRef.current) return;
    
    const expansionZoom = Math.min(
      supercluster.getClusterExpansionZoom(clusterId),
      17
    );
    
    mapRef.current.flyTo(
      { lat: coordinates[1], lng: coordinates[0] },
      expansionZoom,
      { duration: 0.5 }
    );
  }, [supercluster]);

  // Handle draw completion
  const handleDrawComplete = useCallback((polygon: Polygon) => {
    onPolygonChange(polygon);
    setDrawMode(null);
    // Disable search as move when polygon is drawn
    onSearchAsMoveChange(false);
  }, [onPolygonChange, onSearchAsMoveChange]);

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
            setClusterBounds([b.west, b.south, b.east, b.north]);
            setCurrentZoom(z);
            setMapBounds(b);
          }}
          searchAsMove={searchAsMove}
        />

        <ZoomTracker onZoomChange={setCurrentZoom} />

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
        
        {/* Property Markers / Clusters (when zoomed in enough) */}
        {!showCityOverlay && clusters.map(cluster => {
          const [lng, lat] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount } = cluster.properties;
          
          if (isCluster) {
            // Get all properties in this cluster for price range
            const leaves = supercluster?.getLeaves(cluster.id as number, Infinity) || [];
            const clusterProps = leaves.map((l: any) => l.properties);
            const priceRange = formatClusterPriceRange(clusterProps);
            
            return (
              <ClusterMarker
                key={`cluster-${cluster.id}`}
                position={[lat, lng]}
                count={pointCount}
                priceRange={priceRange}
                onClick={() => handleClusterClick(cluster.id as number, [lng, lat])}
              />
            );
          }
          
          // Single property marker
          const property = cluster.properties.property;
          return (
            <PropertyMarker
              key={property.id}
              property={property}
              isHovered={hoveredPropertyId === property.id}
              isSelected={selectedPropertyId === property.id}
              onHover={onPropertyHover}
              onClick={onPropertySelect}
            />
          );
        })}
        
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
