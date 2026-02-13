import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { Plus, Minus, LocateFixed } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';
import type { LatLngBounds, Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ISRAEL_CENTER: [number, number] = [31.5, 34.8];
const DEFAULT_ZOOM = 8;
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

interface PropertyMapProps {
  onBoundsChange?: (bounds: LatLngBounds) => void;
}

function MapEventHandler({ onBoundsChange }: { onBoundsChange?: (b: LatLngBounds) => void }) {
  useMapEvents({
    moveend(e) {
      onBoundsChange?.(e.target.getBounds());
    },
  });
  return null;
}

function MapControls({ map }: { map: LeafletMap | null }) {
  const { getLocation, isLoading } = useGeolocation();

  const handleZoomIn = useCallback(() => map?.zoomIn(), [map]);
  const handleZoomOut = useCallback(() => map?.zoomOut(), [map]);

  const handleLocate = useCallback(() => {
    getLocation();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map?.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: 1.2 });
        },
        () => {},
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }
  }, [map, getLocation]);

  const btnClass =
    'flex items-center justify-center w-9 h-9 bg-background/90 backdrop-blur-sm text-foreground hover:bg-accent transition-colors cursor-pointer';

  return (
    <div className="absolute bottom-6 right-3 z-[40] flex flex-col gap-2">
      <div className="rounded-lg border border-border shadow-md overflow-hidden">
        <button onClick={handleZoomIn} className={cn(btnClass, 'border-b border-border')} aria-label="Zoom in">
          <Plus className="h-4 w-4" />
        </button>
        <button onClick={handleZoomOut} className={btnClass} aria-label="Zoom out">
          <Minus className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={handleLocate}
        className={cn(btnClass, 'rounded-lg border border-border shadow-md', isLoading && 'animate-pulse')}
        aria-label="Find my location"
      >
        <LocateFixed className="h-4 w-4" />
      </button>
    </div>
  );
}

export function PropertyMap({ onBoundsChange }: PropertyMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={ISRAEL_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={false}
        ref={setMap}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
        <MapEventHandler onBoundsChange={onBoundsChange} />
      </MapContainer>
      <MapControls map={map} />
    </div>
  );
}
