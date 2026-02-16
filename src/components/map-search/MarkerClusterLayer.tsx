import { useMemo, useCallback, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Property } from '@/types/database';
import { Project } from '@/types/projects';
import { PropertyMarker } from './PropertyMarker';
import { ProjectMarker } from './ProjectMarker';

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

  useMapEvents({
    moveend() {
      setZoom(map.getZoom());
    },
  });

  const handleCityClick = useCallback((lat: number, lng: number) => {
    map.flyTo([lat, lng], 13, { duration: 0.8 });
  }, [map]);

  const compact = zoom <= 12;

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
      {properties.map(property => {
        if (!property.latitude || !property.longitude) return null;
        return (
          <PropertyMarker
            key={property.id}
            property={property}
            compact={compact}
            isHovered={hoveredPropertyId === property.id}
            isActive={activePropertyId === property.id}
            onClick={onMarkerClick}
            onHover={onMarkerHover}
          />
        );
      })}
      {projects.map(project => {
        if (!project.latitude || !project.longitude) return null;
        return (
          <ProjectMarker
            key={`project-${project.id}`}
            project={project}
            compact={compact}
            isHovered={hoveredPropertyId === `project-${project.id}`}
            isActive={activePropertyId === `project-${project.id}`}
            onClick={onMarkerClick}
            onHover={onMarkerHover}
          />
        );
      })}
    </>
  );
}
