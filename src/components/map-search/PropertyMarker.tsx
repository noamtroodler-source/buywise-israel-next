import { memo, useMemo, useCallback } from 'react';
import { GoogleOverlayView } from '@/components/maps/GoogleOverlayView';
import { Property } from '@/types/database';
import { usePreferences } from '@/contexts/PreferencesContext';

interface PropertyMarkerProps {
  map: google.maps.Map;
  property: Property;
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

function getMarkerIndicator(property: Property): 'hot' | 'drop' | null {
  if (property.original_price && property.original_price > property.price) {
    const pct = ((property.original_price - property.price) / property.original_price) * 100;
    if (pct >= 3) return 'drop';
  }
  const days = Math.floor((Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 3) return 'hot';
  return null;
}

export const PropertyMarker = memo(function PropertyMarker({
  map,
  property,
  compact = false,
  isHovered,
  isActive,
  onClick,
  onHover,
}: PropertyMarkerProps) {
  const { currency, exchangeRate } = usePreferences();

  const priceLabel = useMemo(
    () => formatCompactPrice(property.price, currency, exchangeRate, property.currency),
    [property.price, property.currency, currency, exchangeRate]
  );

  const indicator = useMemo(() => compact ? null : getMarkerIndicator(property), [compact, property.original_price, property.price, property.created_at]);

  const handleClick = useCallback(() => onClick(property.id), [onClick, property.id]);
  const handleMouseOver = useCallback(() => onHover(property.id), [onHover, property.id]);
  const handleMouseOut = useCallback(() => onHover(null), [onHover]);

  if (!property.latitude || !property.longitude) return null;

  const zIndex = isActive ? 201 : isHovered ? 200 : 1;

  const pillClass = `property-marker-pill${compact ? ' compact' : ''}${isHovered ? ' marker-hovered' : ''}${isActive ? ' marker-active' : ''}`;

  return (
    <GoogleOverlayView
      map={map}
      lat={property.latitude}
      lng={property.longitude}
      zIndex={zIndex}
      onClick={handleClick}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      <div className={pillClass}>
        {priceLabel}
        {indicator === 'hot' && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
        )}
        {indicator === 'drop' && (
          <span style={{ fontSize: 10, color: '#ef4444', flexShrink: 0 }}>▼</span>
        )}
      </div>
    </GoogleOverlayView>
  );
}, (prev, next) =>
  prev.property.id === next.property.id &&
  prev.compact === next.compact &&
  prev.isHovered === next.isHovered &&
  prev.isActive === next.isActive &&
  prev.property.price === next.property.price &&
  prev.map === next.map
);
