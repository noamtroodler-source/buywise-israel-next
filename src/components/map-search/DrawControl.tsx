import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { X } from 'lucide-react';
import { latLngsToPolygon, type Polygon } from '@/lib/utils/geometry';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import type L from 'leaflet';

interface DrawControlProps {
  onPolygonDrawn: (polygon: Polygon) => void;
  drawnPolygon: Polygon | null;
  onClear: () => void;
}

export function DrawControl({ onPolygonDrawn, drawnPolygon, onClear }: DrawControlProps) {
  const map = useMap();
  const drawnLayerRef = useRef<L.Layer | null>(null);

  // Enable draw mode
  useEffect(() => {
    if (!map) return;

    // Add crosshair class
    map.getContainer().classList.add('draw-mode-active');

    // Hide default Geoman toolbar
    map.pm.addControls({ drawControls: false, editControls: false, optionsControls: false, customControls: false });
    
    // Enable polygon draw
    map.pm.enableDraw('Polygon', {
      snappable: false,
      templineStyle: { color: 'hsl(213, 94%, 45%)', weight: 2 },
      hintlineStyle: { color: 'hsl(213, 94%, 45%)', dashArray: '5,5' },
      pathOptions: { color: 'hsl(213, 94%, 45%)', fillOpacity: 0.15 },
    });

    const handleCreate = (e: any) => {
      // Remove previous drawn layer
      if (drawnLayerRef.current) {
        map.removeLayer(drawnLayerRef.current);
      }
      drawnLayerRef.current = e.layer;

      const latLngs = e.layer.getLatLngs()[0] as L.LatLng[];
      const polygon = latLngsToPolygon(latLngs);
      onPolygonDrawn(polygon);

      // Disable draw after creating
      map.pm.disableDraw();
    };

    map.on('pm:create', handleCreate);

    // Escape key handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClear();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      map.getContainer().classList.remove('draw-mode-active');
      map.pm.disableDraw();
      map.off('pm:create', handleCreate);
      document.removeEventListener('keydown', handleKeyDown);
      if (drawnLayerRef.current) {
        map.removeLayer(drawnLayerRef.current);
        drawnLayerRef.current = null;
      }
    };
  }, [map, onPolygonDrawn, onClear]);

  const handleClear = useCallback(() => {
    if (drawnLayerRef.current && map) {
      map.removeLayer(drawnLayerRef.current);
      drawnLayerRef.current = null;
    }
    onClear();
  }, [map, onClear]);

  if (!drawnPolygon) return null;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[40]">
      <button
        onClick={handleClear}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-background/95 backdrop-blur-sm rounded-full border border-border shadow-md text-sm font-medium hover:bg-accent transition-colors"
      >
        <X className="h-3.5 w-3.5" />
        Clear drawing
      </button>
    </div>
  );
}
