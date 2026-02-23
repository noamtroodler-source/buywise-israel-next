import { useEffect, useRef, useMemo, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface GoogleOverlayViewProps {
  map: google.maps.Map;
  lat: number;
  lng: number;
  children: ReactNode;
  zIndex?: number;
  onClick?: () => void;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
}

// Lazily create the OverlayView subclass to avoid referencing `google` at module load time
let OverlayViewClass: any = null;

function getOverlayViewClass() {
  if (OverlayViewClass) return OverlayViewClass;

  OverlayViewClass = class extends google.maps.OverlayView {
    container: HTMLDivElement;
    position: google.maps.LatLng;

    constructor(container: HTMLDivElement, position: google.maps.LatLng, map: google.maps.Map) {
      super();
      this.container = container;
      this.position = position;
      this.setMap(map);
    }

    onAdd() {
      const panes = this.getPanes();
      panes?.overlayMouseTarget.appendChild(this.container);
    }

    draw() {
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(this.position);
      if (point) {
        this.container.style.left = `${point.x}px`;
        this.container.style.top = `${point.y}px`;
      }
    }

    onRemove() {
      this.container.parentNode?.removeChild(this.container);
    }

    updatePosition(position: google.maps.LatLng) {
      this.position = position;
      this.draw();
    }
  };

  return OverlayViewClass;
}

export function GoogleOverlayView({
  map,
  lat,
  lng,
  children,
  zIndex,
  onClick,
  onMouseOver,
  onMouseOut,
}: GoogleOverlayViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<any>(null);

  const container = useMemo(() => {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.cursor = 'pointer';
    return div;
  }, []);

  useEffect(() => {
    containerRef.current = container;
    if (zIndex != null) container.style.zIndex = String(zIndex);

    const OVClass = getOverlayViewClass();
    const position = new google.maps.LatLng(lat, lng);
    const overlay = new OVClass(container, position, map);
    overlayRef.current = overlay;

    return () => {
      overlay.setMap(null);
    };
  }, [map]); // Only recreate on map change

  // Update position when lat/lng changes
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.updatePosition(new google.maps.LatLng(lat, lng));
    }
  }, [lat, lng]);

  // Update zIndex
  useEffect(() => {
    if (containerRef.current && zIndex != null) {
      containerRef.current.style.zIndex = String(zIndex);
    }
  }, [zIndex]);

  // Event handlers
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleClick = () => onClick?.();
    const handleOver = () => onMouseOver?.();
    const handleOut = () => onMouseOut?.();
    el.addEventListener('click', handleClick);
    el.addEventListener('mouseover', handleOver);
    el.addEventListener('mouseout', handleOut);
    return () => {
      el.removeEventListener('click', handleClick);
      el.removeEventListener('mouseover', handleOver);
      el.removeEventListener('mouseout', handleOut);
    };
  }, [onClick, onMouseOver, onMouseOut]);

  return createPortal(children, container);
}
