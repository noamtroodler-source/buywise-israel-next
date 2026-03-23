import { useMemo, useState, useCallback } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { MapInfoCard } from './MapInfoCard';
import { getSavedLocationMarkerIcon } from './mapMarkerIcons';

interface SavedPlacesLayerProps {
  map: google.maps.Map;
  bounds: google.maps.LatLngBounds | null;
}

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
          icon={getSavedLocationMarkerIcon(loc.icon)}
          title={loc.label}
        />
      ))}
      {selected && (
        <InfoWindow
          position={{ lat: selected.latitude, lng: selected.longitude }}
          onCloseClick={handleClose}
        >
          <MapInfoCard
            name={selected.label}
            address={selected.address}
          />
        </InfoWindow>
      )}
    </>
  );
}
