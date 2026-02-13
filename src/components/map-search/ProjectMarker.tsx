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
  const buildingSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="hsl(160,84%,39%)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;display:block"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`;
  return `<div class="property-marker-pill project-marker-pill">${buildingSvg}<span style="margin-left:3px">From ${priceLabel}</span></div>`;
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
