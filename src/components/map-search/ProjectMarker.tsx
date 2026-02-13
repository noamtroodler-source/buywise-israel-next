import { memo, useMemo, useCallback, useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Project } from '@/types/projects';
import { usePreferences } from '@/contexts/PreferencesContext';

interface ProjectMarkerProps {
  project: Project;
  isHovered: boolean;
  isActive: boolean;
  onClick: (id: string) => void;
  onHover: (id: string | null) => void;
  displayMode: 'dot' | 'pill';
}

function formatCompactPrice(amount: number, currency: 'ILS' | 'USD', exchangeRate: number, originalCurrency: string = 'ILS'): string {
  let amountInILS = originalCurrency === 'USD' ? amount * exchangeRate : amount;
  const value = currency === 'USD' ? amountInILS / exchangeRate : amountInILS;
  const symbol = currency === 'USD' ? '$' : '₪';

  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${symbol}${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${symbol}${Math.round(value / 1_000)}K`;
  }
  return `${symbol}${Math.round(value)}`;
}

function createProjectPillHtml(priceLabel: string): string {
  return `<div class="property-marker-pill project-marker-pill"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="project-pill-icon"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="9" width="7" height="12" rx="1"/><path d="M14 9V4a1 1 0 0 1 1-1h5"/></svg><span class="project-pill-label">From ${priceLabel}</span></div>`;
}

function estimatePillWidth(priceLabel: string): number {
  const text = `From ${priceLabel}`;
  return Math.ceil(text.length * 7 + 38);
}

function createDotHtml(): string {
  return '<div class="property-marker-dot project-marker-dot"></div>';
}

export const ProjectMarker = memo(function ProjectMarker({
  project,
  isHovered,
  isActive,
  onClick,
  onHover,
  displayMode,
}: ProjectMarkerProps) {
  const { currency, exchangeRate } = usePreferences();
  const markerRef = useRef<L.Marker>(null);

  const markerId = `project-${project.id}`;

  const priceLabel = useMemo(
    () => project.price_from
      ? formatCompactPrice(project.price_from, currency, exchangeRate, project.currency)
      : '?',
    [project.price_from, project.currency, currency, exchangeRate]
  );

  const icon = useMemo(() => {
    if (displayMode === 'dot') {
      return L.divIcon({
        html: createDotHtml(),
        className: 'property-marker-container',
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });
    }
    const w = estimatePillWidth(priceLabel);
    const h = 28;
    return L.divIcon({
      html: createProjectPillHtml(priceLabel),
      className: 'property-marker-container',
      iconSize: [w, h],
      iconAnchor: [w / 2, h / 2],
    });
  }, [priceLabel, displayMode]);

  // Toggle CSS classes
  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (!el) return;

    if (displayMode === 'dot') {
      const dot = el.querySelector('.property-marker-dot') as HTMLElement | null;
      if (!dot) return;
      dot.classList.toggle('marker-hovered', isHovered);
      dot.classList.toggle('marker-active', isActive);
    } else {
      const pill = el.querySelector('.property-marker-pill') as HTMLElement | null;
      if (!pill) return;
      pill.classList.toggle('marker-hovered', isHovered);
      pill.classList.toggle('marker-active', isActive);
    }

    if (isActive) el.style.zIndex = '201';
    else if (isHovered) el.style.zIndex = '200';
    else el.style.zIndex = '';
  }, [isHovered, isActive, displayMode]);

  const handleClick = useCallback(() => onClick(markerId), [onClick, markerId]);
  const handleMouseOver = useCallback(() => onHover(markerId), [onHover, markerId]);
  const handleMouseOut = useCallback(() => onHover(null), [onHover]);

  if (!project.latitude || !project.longitude) return null;

  return (
    <Marker
      ref={markerRef}
      position={[project.latitude, project.longitude]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
        mouseover: handleMouseOver,
        mouseout: handleMouseOut,
      }}
    />
  );
}, (prev, next) =>
  prev.project.id === next.project.id &&
  prev.isHovered === next.isHovered &&
  prev.isActive === next.isActive &&
  prev.project.price_from === next.project.price_from &&
  prev.displayMode === next.displayMode
);
