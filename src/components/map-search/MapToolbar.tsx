import { useCallback } from 'react';
import { Plus, Minus, LocateFixed, PenTool, Layers, Share2 } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';
import { LayersMenu } from './LayersMenu';
import type { Map as LeafletMap } from 'leaflet';

interface MapToolbarProps {
  map: LeafletMap | null;
  isDrawMode: boolean;
  onToggleDraw: () => void;
  activeLayers: Set<string>;
  onToggleLayer: (layerId: string) => void;
}

export function MapToolbar({
  map,
  isDrawMode,
  onToggleDraw,
  activeLayers,
  onToggleLayer,
}: MapToolbarProps) {
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

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'Map View', url });
    } else {
      navigator.clipboard.writeText(url);
    }
  }, []);

  const btnBase =
    'flex items-center justify-center w-8 h-8 text-foreground hover:bg-accent transition-colors cursor-pointer rounded';

  return (
    <div className="absolute bottom-6 right-3 z-[40] flex flex-col gap-2">
      {/* Navigation group */}
      <div className="map-toolbar-group flex flex-col">
        <button onClick={handleZoomIn} className={btnBase} aria-label="Zoom in">
          <Plus className="h-4 w-4" />
        </button>
        <button onClick={handleZoomOut} className={btnBase} aria-label="Zoom out">
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={handleLocate}
          className={cn(btnBase, isLoading && 'animate-pulse')}
          aria-label="Find my location"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>

      {/* Tools group */}
      <div className="map-toolbar-group flex flex-col">
        <button
          onClick={onToggleDraw}
          className={cn(btnBase, isDrawMode && 'bg-primary text-primary-foreground hover:bg-primary/90')}
          aria-label="Draw to search"
        >
          <PenTool className="h-4 w-4" />
        </button>
        <button onClick={handleShare} className={btnBase} aria-label="Share map view">
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* Layers group */}
      <div className="map-toolbar-group flex flex-col">
        <LayersMenu activeLayers={activeLayers} onToggleLayer={onToggleLayer}>
          <button
            className={cn(btnBase, activeLayers.size > 0 && 'text-primary')}
            aria-label="Map layers"
          >
            <Layers className="h-4 w-4" />
          </button>
        </LayersMenu>
      </div>
    </div>
  );
}
