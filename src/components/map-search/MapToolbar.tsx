import { useCallback } from 'react';
import { Plus, Minus, LocateFixed, PenTool, Layers, Share2, Keyboard, Bell } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';
import { LayersMenu } from './LayersMenu';
import { findNearestCity } from '@/lib/utils/findNearestCity';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Map as LeafletMap } from 'leaflet';

interface MapToolbarProps {
  map: LeafletMap | null;
  isDrawMode: boolean;
  onToggleDraw: () => void;
  activeLayers: Set<string>;
  onToggleLayer: (layerId: string) => void;
  onShowHelp?: () => void;
  onCreateAlert?: () => void;
}

export function MapToolbar({
  map,
  isDrawMode,
  onToggleDraw,
  activeLayers,
  onToggleLayer,
  onShowHelp,
  onCreateAlert,
}: MapToolbarProps) {
  const { getLocation, isLoading } = useGeolocation();

  const { data: cities } = useQuery({
    queryKey: ['cities-coords'],
    queryFn: async () => {
      const { data } = await supabase.from('cities').select('name, center_lat, center_lng');
      return data ?? [];
    },
    staleTime: Infinity,
  });

  const handleZoomIn = useCallback(() => map?.zoomIn(), [map]);
  const handleZoomOut = useCallback(() => map?.zoomOut(), [map]);

  const handleLocate = useCallback(() => {
    getLocation();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const nearest = cities?.length ? findNearestCity(coords, cities) : null;
          if (!nearest) {
            toast.error("We don't cover your area yet", {
              description: 'Your location is not near any of the cities on our platform.',
            });
            return;
          }
          map?.flyTo([coords.lat, coords.lng], 14, { duration: 1.2 });
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            toast.error('Location access denied', { description: 'Please enable location permissions in your browser settings.' });
          } else {
            toast.error('Could not get your location', { description: 'Please try again.' });
          }
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }
  }, [map, getLocation, cities]);

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
    <div className="absolute bottom-40 lg:bottom-6 right-3 z-[40] flex flex-col gap-2">
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
        {onCreateAlert && (
          <button onClick={onCreateAlert} className={btnBase} aria-label="Create search alert">
            <Bell className="h-4 w-4" />
          </button>
        )}
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

      {/* Help (desktop only) */}
      {onShowHelp && (
        <div className="map-toolbar-group flex-col hidden lg:flex">
          <button onClick={onShowHelp} className={btnBase} aria-label="Keyboard shortcuts">
            <Keyboard className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
