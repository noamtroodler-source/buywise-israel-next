import { useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { SavedLocation, getLocationIcon } from '@/types/savedLocation';

interface SavedLocationsLayerProps {
  locations: SavedLocation[];
}

export function SavedLocationsLayer({ locations }: SavedLocationsLayerProps) {
  return (
    <>
      {locations.map((location) => (
        <SavedLocationMarker key={location.id} location={location} />
      ))}
    </>
  );
}

interface SavedLocationMarkerProps {
  location: SavedLocation;
}

function SavedLocationMarker({ location }: SavedLocationMarkerProps) {
  // Create custom purple marker for saved locations
  const icon = useMemo(() => {
    const IconComponent = getLocationIcon(location.icon);
    
    return L.divIcon({
      html: `
        <div class="saved-location-marker flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white shadow-lg border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${getIconPath(location.icon)}
          </svg>
        </div>
      `,
      className: '',
      iconSize: L.point(32, 32),
      iconAnchor: L.point(16, 16),
    });
  }, [location.icon]);

  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      zIndexOffset={50}
    >
      <Tooltip 
        direction="top" 
        offset={[0, -20]} 
        className="saved-location-tooltip"
        permanent={false}
      >
        <div className="text-center">
          <p className="font-medium text-sm">{location.label}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
            {location.address}
          </p>
        </div>
      </Tooltip>
    </Marker>
  );
}

// Helper to get SVG path for each icon type
function getIconPath(icon: string): string {
  switch (icon) {
    case 'home':
      return '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>';
    case 'briefcase':
      return '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>';
    case 'heart':
      return '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>';
    case 'star':
      return '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>';
    case 'building':
    default:
      return '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path>';
  }
}
