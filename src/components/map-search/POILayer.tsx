import { useMemo, useState, useCallback, useEffect } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { useMapPois, MapPoi } from '@/hooks/useMapPois';
import { MapInfoCard } from './MapInfoCard';
import { getBrandedMarkerIcon, MARKER_COLORS } from './mapMarkerIcons';

interface POILayerProps {
  map: google.maps.Map;
  bounds: google.maps.LatLngBounds | null;
  activeCategories: string[];
}

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

  useEffect(() => {
    setSelected(null);
  }, [activeCategories]);

  const visiblePois = useMemo(() => {
    if (zoom < 13) return [];
    const withCoords = pois.filter((p) => p.latitude && p.longitude);
    if (!bounds) return withCoords.slice(0, 150);

    const inBounds = withCoords.filter((p) =>
      bounds.contains(new google.maps.LatLng(p.latitude, p.longitude))
    );

    if (inBounds.length > 150) {
      const center = bounds.getCenter();
      const cLat = center.lat();
      const cLng = center.lng();
      inBounds.sort((a, b) => {
        const dA = (a.latitude - cLat) ** 2 + (a.longitude - cLng) ** 2;
        const dB = (b.latitude - cLat) ** 2 + (b.longitude - cLng) ** 2;
        return dA - dB;
      });
      return inBounds.slice(0, 150);
    }

    return inBounds;
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
          icon={getBrandedMarkerIcon(poi.category, 0.875)}
          title={poi.name}
        />
      ))}
      {selected && (
        <InfoWindow
          position={{ lat: selected.latitude, lng: selected.longitude }}
          onCloseClick={handleClose}
        >
          <MapInfoCard
            name={selected.name}
            hebrewName={selected.name_he}
            subtitle={[selected.subcategory, selected.denomination].filter(Boolean).join(' · ') || null}
            badge={selected.english_level ? {
              label: selected.english_level,
              color: ENGLISH_LEVEL_COLORS[selected.english_level] || '#6b7280',
            } : null}
            description={selected.description}
            address={selected.address}
            phone={selected.phone}
            website={selected.website}
          />
        </InfoWindow>
      )}
    </>
  );
}
