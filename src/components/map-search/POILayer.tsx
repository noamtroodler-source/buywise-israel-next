import { useMemo, useState, useCallback, useEffect } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { useMapPois, MapPoi } from '@/hooks/useMapPois';

interface POILayerProps {
  map: google.maps.Map;
  bounds: google.maps.LatLngBounds | null;
  activeCategories: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  shul: '#e11d48',
  school: '#f59e0b',
  mikveh: '#8b5cf6',
  community: '#06b6d4',
  grocery: '#10b981',
  medical: '#ef4444',
  restaurant: '#f97316',
};

const CATEGORY_LABELS: Record<string, string> = {
  shul: '🕍',
  school: '🏫',
  mikveh: '🛁',
  community: '🏘️',
  grocery: '🛒',
  medical: '🏥',
  restaurant: '🍽️',
};

const ENGLISH_LEVEL_COLORS: Record<string, string> = {
  'Anglo Hub': '#16a34a',
  'English Primary': '#2563eb',
  'English Friendly': '#7c3aed',
  'English Available': '#6b7280',
};

export function POILayer({ map, bounds, activeCategories }: POILayerProps) {
  const { data: pois = [] } = useMapPois(activeCategories);
  const [selected, setSelected] = useState<MapPoi | null>(null);
  const [zoom, setZoom] = useState(map.getZoom() ?? 7);

  useEffect(() => {
    const listener = map.addListener('idle', () => {
      setZoom(map.getZoom() ?? 7);
    });
    return () => google.maps.event.removeListener(listener);
  }, [map]);

  const visiblePois = useMemo(() => {
    if (zoom < 13) return []; // Only show at neighborhood zoom
    const withCoords = pois.filter((p) => p.latitude && p.longitude);
    if (!bounds) return withCoords;
    return withCoords.filter((p) =>
      bounds.contains(new google.maps.LatLng(p.latitude, p.longitude))
    );
  }, [bounds, pois, zoom]);

  const handleClose = useCallback(() => setSelected(null), []);

  if (zoom < 13) return null;

  return (
    <>
      {visiblePois.map((poi) => (
        <Marker
          key={poi.id}
          position={{ lat: poi.latitude, lng: poi.longitude }}
          onClick={() => setSelected(poi)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: CATEGORY_COLORS[poi.category] || '#6b7280',
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }}
          label={{
            text: CATEGORY_LABELS[poi.category] || '📍',
            fontSize: '12px',
          }}
          title={poi.name}
        />
      ))}
      {selected && (
        <InfoWindow
          position={{ lat: selected.latitude, lng: selected.longitude }}
          onCloseClick={handleClose}
        >
          <div className="p-1 max-w-[220px]">
            <div className="text-sm font-medium">{selected.name}</div>
            {selected.name_he && (
              <div className="text-xs text-gray-500">{selected.name_he}</div>
            )}
            {selected.denomination && (
              <div className="text-xs text-gray-500 mt-0.5">{selected.denomination}</div>
            )}
            {selected.english_level && (
              <span
                className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1"
                style={{
                  backgroundColor: `${ENGLISH_LEVEL_COLORS[selected.english_level] || '#6b7280'}20`,
                  color: ENGLISH_LEVEL_COLORS[selected.english_level] || '#6b7280',
                }}
              >
                {selected.english_level}
              </span>
            )}
            {selected.description && (
              <div className="text-xs text-gray-500 mt-0.5">{selected.description}</div>
            )}
            {selected.address && (
              <div className="text-xs text-gray-400 mt-0.5">{selected.address}</div>
            )}
            {selected.phone && (
              <a href={`tel:${selected.phone}`} className="text-xs text-primary mt-0.5 block">
                {selected.phone}
              </a>
            )}
            {selected.website && (
              <a
                href={selected.website.startsWith('http') ? selected.website : `https://${selected.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary mt-0.5 block"
              >
                Website →
              </a>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}
