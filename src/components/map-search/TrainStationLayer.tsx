import { useMemo, useState, useCallback } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { TRAIN_STATIONS } from '@/data/trainStations';

interface TrainStationLayerProps {
  map: google.maps.Map;
  bounds: google.maps.LatLngBounds | null;
}

export function TrainStationLayer({ map, bounds }: TrainStationLayerProps) {
  const [selected, setSelected] = useState<typeof TRAIN_STATIONS[0] | null>(null);

  const visibleStations = useMemo(() => {
    if (!bounds) return TRAIN_STATIONS;
    return TRAIN_STATIONS.filter((s) =>
      bounds.contains(new google.maps.LatLng(s.latitude, s.longitude))
    );
  }, [bounds]);

  const handleClose = useCallback(() => setSelected(null), []);

  return (
    <>
      {visibleStations.map((station) => (
        <Marker
          key={station.id}
          position={{ lat: station.latitude, lng: station.longitude }}
          onClick={() => setSelected(station)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }}
          title={station.name}
        />
      ))}
      {selected && (
        <InfoWindow
          position={{ lat: selected.latitude, lng: selected.longitude }}
          onCloseClick={handleClose}
        >
          <div className="p-1">
            <div className="text-sm font-medium">{selected.name}</div>
            <div className="text-xs text-gray-500">{selected.nameHe}</div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
