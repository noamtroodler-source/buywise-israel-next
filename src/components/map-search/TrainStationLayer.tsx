import { useMemo, useState, useEffect } from 'react';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { TRAIN_STATIONS, TrainStation } from '@/data/trainStations';
import { Badge } from '@/components/ui/badge';

interface TrainStationLayerProps {
  visible: boolean;
  minZoom?: number;
}

export function TrainStationLayer({ visible, minZoom = 11 }: TrainStationLayerProps) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  // Track zoom changes using useMapEvents hook (proper React way)
  useMapEvents({
    zoomend: () => {
      setCurrentZoom(map.getZoom());
    },
  });

  // Set initial zoom on mount
  useEffect(() => {
    setCurrentZoom(map.getZoom());
  }, [map]);

  // Only show stations when zoomed in enough
  const shouldShow = visible && currentZoom >= minZoom;

  if (!shouldShow) return null;

  return (
    <>
      {TRAIN_STATIONS.map((station) => (
        <TrainStationMarker key={station.id} station={station} />
      ))}
    </>
  );
}

interface TrainStationMarkerProps {
  station: TrainStation;
}

function TrainStationMarker({ station }: TrainStationMarkerProps) {
  const icon = useMemo(() => {
    return L.divIcon({
      html: `
        <div class="train-station-marker">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="16" height="16" x="4" y="3" rx="2"/>
            <path d="M4 11h16"/>
            <path d="M12 3v8"/>
            <path d="m8 19-2 3"/>
            <path d="m18 22-2-3"/>
            <path d="M8 15h.01"/>
            <path d="M16 15h.01"/>
          </svg>
        </div>
      `,
      className: '',
      iconSize: L.point(28, 28),
      iconAnchor: L.point(14, 14),
    });
  }, []);

  return (
    <Marker
      position={[station.latitude, station.longitude]}
      icon={icon}
      zIndexOffset={100}
    >
      <Popup className="train-station-popup" minWidth={200}>
        <div className="space-y-2">
          <div>
            <p className="font-semibold text-sm">{station.name}</p>
            <p className="text-xs text-muted-foreground" dir="rtl">{station.nameHe}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {station.lines.map((line) => (
              <Badge key={line} variant="secondary" className="text-xs">
                {line}
              </Badge>
            ))}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
