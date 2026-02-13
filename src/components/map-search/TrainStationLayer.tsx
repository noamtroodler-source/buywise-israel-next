import { useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Train } from 'lucide-react';
import { TRAIN_STATIONS } from '@/data/trainStations';
import type { LatLngBounds } from 'leaflet';

interface TrainStationLayerProps {
  bounds: LatLngBounds | null;
}

const trainIcon = L.divIcon({
  className: '',
  html: `<div class="train-station-marker">${renderToStaticMarkup(<Train size={14} />)}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export function TrainStationLayer({ bounds }: TrainStationLayerProps) {
  const visibleStations = useMemo(() => {
    if (!bounds) return TRAIN_STATIONS;
    return TRAIN_STATIONS.filter((s) =>
      bounds.contains([s.latitude, s.longitude])
    );
  }, [bounds]);

  return (
    <>
      {visibleStations.map((station) => (
        <Marker
          key={station.id}
          position={[station.latitude, station.longitude]}
          icon={trainIcon}
          interactive
        >
          <Tooltip direction="top" offset={[0, -16]} className="train-station-popup">
            <div className="text-sm font-medium">{station.name}</div>
            <div className="text-xs text-muted-foreground">{station.nameHe}</div>
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}
