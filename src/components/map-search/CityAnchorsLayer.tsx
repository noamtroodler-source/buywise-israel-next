import { useMemo, useState, useCallback } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { useCityAnchors } from '@/hooks/useCityAnchors';

interface CityAnchorsLayerProps {
  map: google.maps.Map;
  cityFilter: string | null;
  bounds: google.maps.LatLngBounds | null;
}

const ANCHOR_COLORS: Record<string, string> = {
  orientation: '#0ea5e9',
  daily_life: '#10b981',
  mobility: '#3b82f6',
};

export function CityAnchorsLayer({ map, cityFilter, bounds }: CityAnchorsLayerProps) {
  const { data: anchors = [] } = useCityAnchors(cityFilter ?? undefined);
  const [selected, setSelected] = useState<typeof anchors[0] | null>(null);

  const visibleAnchors = useMemo(() => {
    const withCoords = anchors.filter((a) => a.latitude && a.longitude);
    if (!bounds) return withCoords;
    return withCoords.filter((a) =>
      bounds.contains(new google.maps.LatLng(a.latitude!, a.longitude!))
    );
  }, [bounds, anchors]);

  const handleClose = useCallback(() => setSelected(null), []);

  return (
    <>
      {visibleAnchors.map((anchor) => (
        <Marker
          key={anchor.id}
          position={{ lat: anchor.latitude!, lng: anchor.longitude! }}
          onClick={() => setSelected(anchor)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: ANCHOR_COLORS[anchor.anchor_type] || '#6b7280',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }}
          title={anchor.name}
        />
      ))}
      {selected && (
        <InfoWindow
          position={{ lat: selected.latitude!, lng: selected.longitude! }}
          onCloseClick={handleClose}
        >
          <div className="p-1">
            <div className="text-sm font-medium">{selected.name}</div>
            {selected.name_he && (
              <div className="text-xs text-gray-500">{selected.name_he}</div>
            )}
            {selected.description && (
              <div className="text-xs text-gray-500 mt-0.5">{selected.description}</div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}
