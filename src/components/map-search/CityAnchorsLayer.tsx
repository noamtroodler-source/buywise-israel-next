import { useMemo, useState, useCallback } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { useCityAnchors } from '@/hooks/useCityAnchors';
import { MapInfoCard } from './MapInfoCard';
import { getBrandedMarkerIcon } from './mapMarkerIcons';

interface CityAnchorsLayerProps {
  map: google.maps.Map;
  cityFilter: string | null;
  bounds: google.maps.LatLngBounds | null;
}

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
          icon={getBrandedMarkerIcon(anchor.anchor_type)}
          title={anchor.name}
        />
      ))}
      {selected && (
        <InfoWindow
          position={{ lat: selected.latitude!, lng: selected.longitude! }}
          onCloseClick={handleClose}
        >
          <MapInfoCard
            name={selected.name}
            hebrewName={selected.name_he}
            description={selected.description}
          />
        </InfoWindow>
      )}
    </>
  );
}
