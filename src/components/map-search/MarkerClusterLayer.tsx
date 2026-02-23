import { useMemo, useCallback, useState, useEffect } from 'react';
import { GoogleOverlayView } from '@/components/maps/GoogleOverlayView';
import { Property } from '@/types/database';
import { Project } from '@/types/projects';
import { PropertyMarker } from './PropertyMarker';
import { ProjectMarker } from './ProjectMarker';

interface MarkerClusterLayerProps {
  map: google.maps.Map;
  properties: Property[];
  projects?: Project[];
  hoveredPropertyId: string | null;
  activePropertyId: string | null;
  onMarkerClick: (id: string) => void;
  onMarkerHover: (id: string | null) => void;
}

const CITY_WAYPOINTS = [
  { name: 'Haifa', lat: 32.79, lng: 34.99 },
  { name: 'Netanya', lat: 32.33, lng: 34.86 },
  { name: 'Tel Aviv', lat: 32.08, lng: 34.78 },
  { name: 'Ashdod', lat: 31.80, lng: 34.65 },
  { name: 'Jerusalem', lat: 31.77, lng: 35.21 },
  { name: 'Beer Sheva', lat: 31.25, lng: 34.79 },
  { name: 'Eilat', lat: 29.56, lng: 34.95 },
];

export function MarkerClusterLayer({
  map,
  properties,
  projects = [],
  hoveredPropertyId,
  activePropertyId,
  onMarkerClick,
  onMarkerHover,
}: MarkerClusterLayerProps) {
  const [zoom, setZoom] = useState(map.getZoom() ?? 7);

  useEffect(() => {
    const listener = map.addListener('idle', () => {
      setZoom(map.getZoom() ?? 7);
    });
    return () => google.maps.event.removeListener(listener);
  }, [map]);

  const handleCityClick = useCallback((lat: number, lng: number) => {
    map.panTo({ lat, lng });
    map.setZoom(13);
  }, [map]);

  const compact = zoom <= 12;

  if (zoom <= 9) {
    return (
      <>
        {CITY_WAYPOINTS.map(city => (
          <GoogleOverlayView
            key={city.name}
            map={map}
            lat={city.lat}
            lng={city.lng}
            onClick={() => handleCityClick(city.lat, city.lng)}
          >
            <div className="city-waypoint-label">{city.name}</div>
          </GoogleOverlayView>
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
            map={map}
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
            map={map}
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
