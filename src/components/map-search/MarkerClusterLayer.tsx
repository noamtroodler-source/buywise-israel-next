import { useMemo, useCallback } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import useSupercluster from 'use-supercluster';
import { Property } from '@/types/database';
import { PropertyMarker } from './PropertyMarker';
import { useState } from 'react';

interface MarkerClusterLayerProps {
  properties: Property[];
  hoveredPropertyId: string | null;
  activePropertyId: string | null;
  onMarkerClick: (id: string) => void;
  onMarkerHover: (id: string | null) => void;
}

function getClusterIcon(count: number) {
  const size = count < 10 ? 32 : count < 50 ? 38 : 44;
  return L.divIcon({
    html: `<div class="marker-cluster-circle" style="width:${size}px;height:${size}px;">${count}</div>`,
    className: 'marker-cluster-container',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function MarkerClusterLayer({
  properties,
  hoveredPropertyId,
  activePropertyId,
  onMarkerClick,
  onMarkerHover,
}: MarkerClusterLayerProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [bounds, setBounds] = useState(() => {
    const b = map.getBounds();
    return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()] as [number, number, number, number];
  });

  useMapEvents({
    moveend() {
      setZoom(map.getZoom());
      const b = map.getBounds();
      setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    },
  });

  const displayMode: 'dot' | 'pill' = zoom >= 13 ? 'pill' : 'dot';
  const clusterRadius = zoom >= 13 ? 60 : 80;

  const points = useMemo(() =>
    properties
      .filter(p => p.latitude && p.longitude)
      .map(p => ({
        type: 'Feature' as const,
        properties: { cluster: false, propertyId: p.id, property: p },
        geometry: { type: 'Point' as const, coordinates: [p.longitude!, p.latitude!] },
      })),
    [properties]
  );

  const { clusters } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: clusterRadius, maxZoom: 14 },
  });

  const handleClusterClick = useCallback((clusterId: number, lng: number, lat: number) => {
    try {
      map.flyTo([lat, lng], Math.min(zoom + 2, 18), { duration: 0.5 });
    } catch {
      map.setView([lat, lng], Math.min(zoom + 2, 18));
    }
  }, [map, zoom]);

  // Hide all markers at very low zoom (world scale)
  if (zoom < 7) return null;

  return (
    <>
      {clusters.map(cluster => {
        const [lng, lat] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties as any;

        if (isCluster) {
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[lat, lng]}
              icon={getClusterIcon(pointCount)}
              eventHandlers={{
                click: () => handleClusterClick(cluster.id as number, lng, lat),
              }}
            />
          );
        }

        const property = (cluster.properties as any).property as Property;
        return (
          <PropertyMarker
            key={property.id}
            property={property}
            isHovered={hoveredPropertyId === property.id}
            isActive={activePropertyId === property.id}
            onClick={onMarkerClick}
            onHover={onMarkerHover}
            displayMode={displayMode}
          />
        );
      })}
    </>
  );
}
