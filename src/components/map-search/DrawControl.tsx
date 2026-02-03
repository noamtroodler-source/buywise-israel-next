import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { latLngsToPolygon, type Polygon } from '@/lib/utils/geometry';

export type DrawMode = 'rectangle' | 'polygon' | 'circle' | null;

interface DrawControlProps {
  drawMode: DrawMode;
  onDrawComplete: (polygon: Polygon, radiusMeters?: number) => void;
  onDrawCancel: () => void;
}

export function DrawControl({ drawMode, onDrawComplete, onDrawCancel }: DrawControlProps) {
  const map = useMap();
  const drawnLayerRef = useRef<L.Layer | null>(null);
  const prevModeRef = useRef<DrawMode>(null);

  // Clear existing drawn layer
  const clearDrawnLayer = useCallback(() => {
    if (drawnLayerRef.current) {
      map.removeLayer(drawnLayerRef.current);
      drawnLayerRef.current = null;
    }
  }, [map]);

  // Initialize Geoman
  useEffect(() => {
    if (!map.pm) return;

    // Configure Geoman options
    map.pm.setGlobalOptions({
      allowSelfIntersection: false,
      snappable: false,
    });

    // Style for drawn shapes
    map.pm.setPathOptions({
      color: 'hsl(213, 94%, 45%)',
      fillColor: 'hsl(213, 94%, 45%)',
      fillOpacity: 0.15,
      weight: 2,
    });

    // Hide the default toolbar - we use our own
    map.pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawPolygon: false,
      drawCircle: false,
      drawText: false,
      editMode: false,
      dragMode: false,
      cutPolygon: false,
      removalMode: false,
      rotateMode: false,
    });
  }, [map]);

  // Handle draw mode changes
  useEffect(() => {
    if (!map.pm) return;

    // If mode changed, disable previous mode
    if (prevModeRef.current !== drawMode) {
      map.pm.disableDraw();
      prevModeRef.current = drawMode;
    }

    if (!drawMode) {
      return;
    }

    // Clear previous drawn layer when starting new drawing
    clearDrawnLayer();

    // Enable the appropriate drawing mode
    switch (drawMode) {
      case 'rectangle':
        map.pm.enableDraw('Rectangle');
        break;
      case 'polygon':
        map.pm.enableDraw('Polygon');
        break;
      case 'circle':
        map.pm.enableDraw('Circle');
        break;
    }
  }, [drawMode, map, clearDrawnLayer]);

  // Handle draw create event
  useEffect(() => {
    if (!map.pm) return;

    const handleCreate = (e: any) => {
      const layer = e.layer;
      
      // Store reference for later clearing
      drawnLayerRef.current = layer;
      
      // Extract coordinates based on shape type
      if (e.shape === 'Circle') {
        const center = layer.getLatLng();
        const radius = layer.getRadius();
        // For circles, we create a rough polygon approximation
        const numPoints = 32;
        const polygon: [number, number][] = [];
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * 2 * Math.PI;
          // Rough approximation - meters to degrees
          const latOffset = (radius / 111320) * Math.cos(angle);
          const lngOffset = (radius / (111320 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle);
          polygon.push([center.lng + lngOffset, center.lat + latOffset]);
        }
        onDrawComplete(polygon, radius);
      } else {
        // Rectangle or Polygon
        const latLngs = layer.getLatLngs()[0];
        const polygon = latLngsToPolygon(latLngs);
        onDrawComplete(polygon);
      }

      // Disable draw mode after completion
      map.pm.disableDraw();
    };

    map.on('pm:create', handleCreate);

    return () => {
      map.off('pm:create', handleCreate);
    };
  }, [map, onDrawComplete]);

  // Handle keyboard escape to cancel
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawMode) {
        map.pm?.disableDraw();
        onDrawCancel();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [drawMode, map, onDrawCancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearDrawnLayer();
      map.pm?.disableDraw();
    };
  }, [map, clearDrawnLayer]);

  return null;
}

// Component to display an existing drawn polygon
interface DrawnPolygonProps {
  polygon: Polygon;
  onClear: () => void;
}

export function DrawnPolygon({ polygon, onClear }: DrawnPolygonProps) {
  const map = useMap();
  const layerRef = useRef<L.Polygon | null>(null);

  useEffect(() => {
    if (!polygon || polygon.length === 0) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    // Convert [lng, lat] to Leaflet [lat, lng]
    const latLngs = polygon.map(([lng, lat]) => [lat, lng] as [number, number]);
    
    const layer = L.polygon(latLngs, {
      color: 'hsl(213, 94%, 45%)',
      fillColor: 'hsl(213, 94%, 45%)',
      fillOpacity: 0.15,
      weight: 2,
    });

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, polygon]);

  return null;
}
