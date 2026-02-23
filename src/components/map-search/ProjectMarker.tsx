import { memo, useMemo, useCallback } from 'react';
import { GoogleOverlayView } from '@/components/maps/GoogleOverlayView';
import { Project } from '@/types/projects';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Building2 } from 'lucide-react';

interface ProjectMarkerProps {
  map: google.maps.Map;
  project: Project;
  compact?: boolean;
  isHovered: boolean;
  isActive: boolean;
  onClick: (id: string) => void;
  onHover: (id: string | null) => void;
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

export const ProjectMarker = memo(function ProjectMarker({
  map,
  project,
  compact = false,
  isHovered,
  isActive,
  onClick,
  onHover,
}: ProjectMarkerProps) {
  const { currency, exchangeRate } = usePreferences();
  const markerId = `project-${project.id}`;

  const priceLabel = useMemo(
    () => project.price_from
      ? formatCompactPrice(project.price_from, currency, exchangeRate, project.currency)
      : '?',
    [project.price_from, project.currency, currency, exchangeRate]
  );

  const handleClick = useCallback(() => onClick(markerId), [onClick, markerId]);
  const handleMouseOver = useCallback(() => onHover(markerId), [onHover, markerId]);
  const handleMouseOut = useCallback(() => onHover(null), [onHover]);

  if (!project.latitude || !project.longitude) return null;

  const zIndex = isActive ? 201 : isHovered ? 200 : 1;

  const pillClass = `property-marker-pill project-marker-pill${compact ? ' compact' : ''}${isHovered ? ' marker-hovered' : ''}${isActive ? ' marker-active' : ''}`;

  return (
    <GoogleOverlayView
      map={map}
      lat={project.latitude}
      lng={project.longitude}
      zIndex={zIndex}
      onClick={handleClick}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      <div className={pillClass}>
        {!compact && <Building2 size={11} style={{ flexShrink: 0, color: 'hsl(213,94%,45%)' }} strokeWidth={2.5} />}
        <span style={{ marginLeft: compact ? 0 : 3 }}>From {priceLabel}</span>
      </div>
    </GoogleOverlayView>
  );
}, (prev, next) =>
  prev.project.id === next.project.id &&
  prev.compact === next.compact &&
  prev.isHovered === next.isHovered &&
  prev.isActive === next.isActive &&
  prev.project.price_from === next.project.price_from &&
  prev.map === next.map
);
