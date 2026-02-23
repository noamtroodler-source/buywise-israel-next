import { useMemo, useState, useCallback } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { useSavedLocations } from '@/hooks/useSavedLocations';

interface SavedPlacesLayerProps {
  map: google.maps.Map;
  bounds: google.maps.LatLngBounds | null;
}

const ICON_COLORS: Record<string, string> = {
  home: '#a855f7',
  briefcase: '#f59e0b',
  heart: '#ef4444',
  star: '#eab308',
  building: '#6b7280',
};

export function SavedPlacesLayer({ map, bounds }: SavedPlacesLayerProps) {
  const { data: locations = [] } = useSavedLocations();
  const [selected, setSelected] = useState<typeof locations[0] | null>(null);

  const visibleLocations = useMemo(() => {
    if (!bounds) return locations;
    return locations.filter((loc) =>
      bounds.contains(new google.maps.LatLng(loc.latitude, loc.longitude))
    );
  }, [bounds, locations]);

  const handleClose = useCallback(() => setSelected(null), []);

  return (
    <>
      {visibleLocations.map((loc) => (
        <Marker
          key={loc.id}
          position={{ lat: loc.latitude, lng: loc.longitude }}
          onClick={() => setSelected(loc)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: ICON_COLORS[loc.icon] || '#6b7280',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }}
          title={loc.label}
        />
      ))}
      {selected && (
        <InfoWindow
          position={{ lat: selected.latitude, lng: selected.longitude }}
          onCloseClick={handleClose}
        >
          <div className="p-1">
            <div className="text-sm font-medium">{selected.label}</div>
            <div className="text-xs text-gray-500">{selected.address}</div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
