import { useMemo, useCallback } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import useSupercluster from 'use-supercluster';
import { Property } from '@/types/database';
import { PropertyMarker } from './PropertyMarker';
import type { MapBounds } from './MapSearchLayout';

interface MarkerClusterLayerProps {
  properties: Property[];
  mapBounds: MapBounds | null;
  zoom: number;
  hoveredPropertyId: string | null;
  selectedPropertyId: string | null;
  onHover: (id: string | null) => void;
  onClick: (id: string | null) => void;
}

export function MarkerClusterLayer({
  properties,
  mapBounds,
  zoom,
  hoveredPropertyId,
  selectedPropertyId,
  onHover,
  onClick,
}: MarkerClusterLayerProps) {
  const map = useMap();

  // Only cluster when 50+ markers
  const shouldCluster = properties.length >= 50;

  const points = useMemo(() => {
    if (!shouldCluster) return [];
    return properties
      .filter(p => p.latitude && p.longitude)
      .map(p => ({
        type: 'Feature' as const,
        properties: { cluster: false, propertyId: p.id },
        geometry: {
          type: 'Point' as const,
          coordinates: [p.longitude!, p.latitude!],
        },
      }));
  }, [properties, shouldCluster]);

  const bounds: [number, number, number, number] | undefined = mapBounds
    ? [mapBounds.west, mapBounds.south, mapBounds.east, mapBounds.north]
    : undefined;

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 75, maxZoom: 20 },
  });

  const handleClusterClick = useCallback(
    (clusterId: number, lat: number, lng: number) => {
      if (!supercluster) return;
      const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(clusterId), 20);
      map.flyTo([lat, lng], expansionZoom, { duration: 0.5 });
    },
    [supercluster, map]
  );

  // Non-clustered rendering
  if (!shouldCluster) {
    return (
      <>
        {properties
          .filter(p => p.latitude && p.longitude)
          .map(property => (
            <PropertyMarker
              key={property.id}
              property={property}
              isHovered={hoveredPropertyId === property.id}
              isSelected={selectedPropertyId === property.id}
              onHover={onHover}
              onClick={onClick}
            />
          ))}
      </>
    );
  }

  return (
    <>
      {clusters.map(cluster => {
        const [lng, lat] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties as any;

        if (isCluster) {
          const size = Math.min(24 + (pointCount / properties.length) * 30, 48);
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[lat, lng]}
              icon={L.divIcon({
                html: `<div class="cluster-marker" style="width:${size}px;height:${size}px;"><span>${pointCount}</span></div>`,
                className: '',
                iconSize: L.point(size, size),
                iconAnchor: L.point(size / 2, size / 2),
              })}
              eventHandlers={{
                click: () => handleClusterClick(cluster.id as number, lat, lng),
              }}
            />
          );
        }

        const propertyId = (cluster.properties as any).propertyId;
        const property = properties.find(p => p.id === propertyId);
        if (!property) return null;

        return (
          <PropertyMarker
            key={property.id}
            property={property}
            isHovered={hoveredPropertyId === property.id}
            isSelected={selectedPropertyId === property.id}
            onHover={onHover}
            onClick={onClick}
          />
        );
      })}
    </>
  );
}
