import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import type { Polygon } from '@/lib/utils/geometry';

interface DrawControlProps {
  map: google.maps.Map;
  isDrawing: boolean;
  onPolygonDrawn: (polygon: Polygon) => void;
  drawnPolygon: Polygon | null;
  onClear: () => void;
}

export function DrawControl({ map, isDrawing, onPolygonDrawn, drawnPolygon, onClear }: DrawControlProps) {
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const drawnPolygonRef = useRef<google.maps.Polygon | null>(null);

  // Show existing drawn polygon on map
  useEffect(() => {
    if (drawnPolygon && !isDrawing) {
      const polygon = new google.maps.Polygon({
        paths: drawnPolygon.map(([lng, lat]) => ({ lat, lng })),
        strokeColor: 'hsl(213, 94%, 45%)',
        strokeWeight: 2,
        fillColor: 'hsl(213, 94%, 45%)',
        fillOpacity: 0.15,
        editable: false,
        map,
      });
      drawnPolygonRef.current = polygon;
      return () => {
        polygon.setMap(null);
      };
    }
  }, [drawnPolygon, isDrawing, map]);

  // Drawing manager
  useEffect(() => {
    if (!isDrawing) {
      drawingManagerRef.current?.setMap(null);
      drawingManagerRef.current = null;
      return;
    }

    map.getDiv().style.cursor = 'crosshair';

    const dm = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: false,
      polygonOptions: {
        strokeColor: 'hsl(213, 94%, 45%)',
        strokeWeight: 2,
        fillColor: 'hsl(213, 94%, 45%)',
        fillOpacity: 0.15,
        editable: false,
      },
    });

    dm.setMap(map);
    drawingManagerRef.current = dm;

    const listener = google.maps.event.addListener(dm, 'polygoncomplete', (polygon: google.maps.Polygon) => {
      const path = polygon.getPath();
      const coords: Polygon = [];
      for (let i = 0; i < path.getLength(); i++) {
        const p = path.getAt(i);
        coords.push([p.lng(), p.lat()]);
      }
      polygon.setMap(null);
      onPolygonDrawn(coords);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClear();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      map.getDiv().style.cursor = '';
      dm.setMap(null);
      google.maps.event.removeListener(listener);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawing, map, onPolygonDrawn, onClear]);

  const handleClear = useCallback(() => {
    if (drawnPolygonRef.current) {
      drawnPolygonRef.current.setMap(null);
      drawnPolygonRef.current = null;
    }
    onClear();
  }, [onClear]);

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
