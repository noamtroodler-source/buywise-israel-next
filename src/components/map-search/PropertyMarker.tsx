import { memo, useMemo, useCallback, useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Property } from '@/types/database';
import { usePreferences } from '@/contexts/PreferencesContext';

interface PropertyMarkerProps {
  property: Property;
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

function createMarkerHtml(priceLabel: string, indicator: 'hot' | 'drop' | null): string {
  let indicatorHtml = '';
  if (indicator === 'hot') {
    indicatorHtml = '<span style="width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0;"></span>';
  } else if (indicator === 'drop') {
    indicatorHtml = '<span style="font-size:10px;color:#ef4444;flex-shrink:0;">▼</span>';
  }

  return `<div class="property-marker-pill">${priceLabel}${indicatorHtml}</div>`;
}

export const PropertyMarker = memo(function PropertyMarker({
  property,
  isHovered,
  isActive,
  onClick,
  onHover,
}: PropertyMarkerProps) {
  const { currency, exchangeRate } = usePreferences();
  const markerRef = useRef<L.Marker>(null);

  const priceLabel = useMemo(
    () => formatCompactPrice(property.price, currency, exchangeRate, property.currency),
    [property.price, property.currency, currency, exchangeRate]
  );

  const indicator = useMemo(() => getMarkerIndicator(property), [property.original_price, property.price, property.created_at]);

  const icon = useMemo(() => {
    return L.divIcon({
      html: createMarkerHtml(priceLabel, indicator),
      className: 'property-marker-container',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }, [priceLabel, indicator]);

  // Toggle CSS classes for hover/active instead of re-creating icon
  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (!el) return;
    const pill = el.querySelector('.property-marker-pill') as HTMLElement | null;
    if (!pill) return;

    pill.classList.toggle('marker-hovered', isHovered);
    pill.classList.toggle('marker-active', isActive);

    // Z-index
    if (isActive) {
      el.style.zIndex = '201';
    } else if (isHovered) {
      el.style.zIndex = '200';
    } else {
      el.style.zIndex = '';
    }
  }, [isHovered, isActive]);

  const handleClick = useCallback(() => onClick(property.id), [onClick, property.id]);
  const handleMouseOver = useCallback(() => onHover(property.id), [onHover, property.id]);
  const handleMouseOut = useCallback(() => onHover(null), [onHover]);

  if (!property.latitude || !property.longitude) return null;

  return (
    <Marker
      ref={markerRef}
      position={[property.latitude, property.longitude]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
        mouseover: handleMouseOver,
        mouseout: handleMouseOut,
      }}
    />
  );
}, (prev, next) =>
  prev.property.id === next.property.id &&
  prev.isHovered === next.isHovered &&
  prev.isActive === next.isActive &&
  prev.property.price === next.property.price
);
