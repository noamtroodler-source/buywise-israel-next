import { useMemo, useCallback } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import useSupercluster from 'use-supercluster';
import { Property } from '@/types/database';
import { Project } from '@/types/projects';
import { PropertyMarker } from './PropertyMarker';
import { ProjectMarker } from './ProjectMarker';
import { useState } from 'react';

interface MarkerClusterLayerProps {
  properties: Property[];
  projects?: Project[];
  hoveredPropertyId: string | null;
  activePropertyId: string | null;
  onMarkerClick: (id: string) => void;
  onMarkerHover: (id: string | null) => void;
}

// Major metro areas shown at country zoom
const CITY_WAYPOINTS = [
  { name: 'Haifa', lat: 32.79, lng: 34.99 },
  { name: 'Netanya', lat: 32.33, lng: 34.86 },
  { name: 'Tel Aviv', lat: 32.08, lng: 34.78 },
  { name: 'Ashdod', lat: 31.80, lng: 34.65 },
  { name: 'Jerusalem', lat: 31.77, lng: 35.21 },
  { name: 'Beer Sheva', lat: 31.25, lng: 34.79 },
  { name: 'Eilat', lat: 29.56, lng: 34.95 },
];

function getCityLabelIcon(name: string) {
  const estimatedWidth = name.length * 8 + 36;
  return L.divIcon({
    html: `<div class="city-waypoint-label">${name}</div>`,
    className: 'city-waypoint-container',
    iconSize: [estimatedWidth, 36],
    iconAnchor: [estimatedWidth / 2, 18],
  });
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
  projects = [],
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
  const clusterRadius = zoom >= 14 ? 50 : zoom >= 13 ? 70 : 80;

  const points = useMemo(() => {
    const propertyPoints = properties
      .filter(p => p.latitude && p.longitude)
      .map(p => ({
        type: 'Feature' as const,
        properties: { cluster: false, propertyId: p.id, property: p, itemType: 'property' as const },
        geometry: { type: 'Point' as const, coordinates: [p.longitude!, p.latitude!] },
      }));

    const projectPoints = projects
      .filter(p => p.latitude && p.longitude)
      .map(p => ({
        type: 'Feature' as const,
        properties: { cluster: false, propertyId: `project-${p.id}`, project: p, itemType: 'project' as const },
        geometry: { type: 'Point' as const, coordinates: [p.longitude!, p.latitude!] },
      }));

    return [...propertyPoints, ...projectPoints];
  }, [properties, projects]);

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

  const handleCityClick = useCallback((lat: number, lng: number) => {
    map.flyTo([lat, lng], 13, { duration: 0.8 });
  }, [map]);

  if (zoom <= 9) {
    return (
      <>
        {CITY_WAYPOINTS.map(city => (
          <Marker
            key={city.name}
            position={[city.lat, city.lng]}
            icon={getCityLabelIcon(city.name)}
            eventHandlers={{
              click: () => handleCityClick(city.lat, city.lng),
            }}
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

        const props = cluster.properties as any;

        if (props.itemType === 'project') {
          const project = props.project as Project;
          return (
            <ProjectMarker
              key={`project-${project.id}`}
              project={project}
              isHovered={hoveredPropertyId === `project-${project.id}`}
              isActive={activePropertyId === `project-${project.id}`}
              onClick={onMarkerClick}
              onHover={onMarkerHover}
              displayMode={displayMode}
            />
          );
        }

        const property = props.property as Property;
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
