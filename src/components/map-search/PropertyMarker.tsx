import { useMemo, useCallback, useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Property } from '@/types/database';
import { usePreferences } from '@/contexts/PreferencesContext';
import { differenceInDays } from 'date-fns';

interface PropertyMarkerProps {
  property: Property;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string | null) => void;
}

export function PropertyMarker({
  property,
  isHovered,
  isSelected,
  onHover,
  onClick,
}: PropertyMarkerProps) {
  const { currency, exchangeRate } = usePreferences();
  
  // Calculate price drop info
  const priceDropInfo = useMemo(() => {
    if (!property.original_price || property.original_price <= property.price) {
      return { hasDrop: false, dropPercent: 0 };
    }
    const dropPercent = Math.round(
      ((property.original_price - property.price) / property.original_price) * 100
    );
    return { hasDrop: dropPercent >= 3, dropPercent };
  }, [property.original_price, property.price]);

  // Calculate if property is "hot" (less than 3 days old)
  const isHot = useMemo(() => {
    if (!property.created_at) return false;
    const daysOld = differenceInDays(new Date(), new Date(property.created_at));
    return daysOld <= 3;
  }, [property.created_at]);
  
  // Format price for marker with currency preference
  const displayPrice = useMemo(() => {
    let price = property.price;
    let symbol = '₪';
    
    if (currency === 'USD') {
      price = price / exchangeRate;
      symbol = '$';
    }
    
    if (price >= 1000000) {
      return `${symbol}${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${symbol}${Math.round(price / 1000)}K`;
    }
    return `${symbol}${price}`;
  }, [property.price, currency, exchangeRate]);

  // Determine marker style based on listing status only (no hover/selected)
  const markerStyle = useMemo(() => {
    const isRental = property.listing_status === 'for_rent';
    const isSold = property.listing_status === 'sold' || property.listing_status === 'rented';
    
    let bgColor = 'white';
    let textColor = 'hsl(220, 10%, 40%)';
    let borderColor = 'hsl(220, 13%, 85%)';
    let opacity = '1';
    
    if (isSold) {
      bgColor = 'hsl(220, 13%, 95%)';
      textColor = 'hsl(220, 10%, 55%)';
      borderColor = 'hsl(220, 13%, 80%)';
      opacity = '0.7';
    }
    
    return { bgColor, textColor, borderColor, opacity, isRental };
  }, [property.listing_status]);

  // Create custom icon - NO hover/selected deps, purely static
  const icon = useMemo(() => {
    const suffix = markerStyle.isRental ? '/mo' : '';
    
    const dropIndicator = priceDropInfo.hasDrop
      ? `<span class="marker-badge marker-badge-drop" title="Price reduced ${priceDropInfo.dropPercent}%">
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
            <path d="M6 2L6 10M6 10L3 7M6 10L9 7" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </span>`
      : '';
    
    const hotIndicator = isHot && !priceDropInfo.hasDrop
      ? `<span class="marker-badge marker-badge-hot" title="New listing">
          <span style="font-size: 8px; line-height: 1;">🔥</span>
        </span>`
      : '';
    
    return L.divIcon({
      html: `
        <div 
          class="property-marker-wrapper"
          style="
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: transform 200ms ease;
          "
        >
          ${dropIndicator}
          ${hotIndicator}
          <div 
            class="property-marker-pill"
            style="
              background-color: ${markerStyle.bgColor};
              color: ${markerStyle.textColor};
              border: 1px solid ${markerStyle.borderColor};
              padding: 4px 8px;
              border-radius: 6px;
              font-weight: 600;
              font-size: 11px;
              white-space: nowrap;
              box-shadow: 0 1px 4px rgba(0,0,0,0.12);
              opacity: ${markerStyle.opacity};
              cursor: pointer;
              transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
            "
          >
            ${displayPrice}${suffix}
          </div>
          <div 
            class="property-marker-pointer"
            style="
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 5px solid ${markerStyle.borderColor};
              margin-top: -1px;
              transition: border-top-color 200ms ease;
            "
          ></div>
          <div 
            class="property-marker-pointer-inner"
            style="
              position: absolute;
              bottom: 0;
              width: 0;
              height: 0;
              border-left: 4px solid transparent;
              border-right: 4px solid transparent;
              border-top: 4px solid ${markerStyle.bgColor};
              margin-top: -2px;
              transition: border-top-color 200ms ease;
            "
          ></div>
        </div>
      `,
      className: '',
      iconSize: L.point(0, 0),
      iconAnchor: L.point(0, 32),
    });
  }, [displayPrice, markerStyle, priceDropInfo, isHot]);

  // Toggle CSS class for hover/selected — no icon rebuild
  const markerRef = useRef<L.Marker | null>(null);
  
  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (!el) return;
    
    if (isHovered || isSelected) {
      el.classList.add('marker-active');
      el.style.zIndex = '200';
    } else {
      el.classList.remove('marker-active');
      el.style.zIndex = '100';
    }
  }, [isHovered, isSelected]);

  const handleMouseEnter = useCallback(() => {
    onHover(property.id);
  }, [property.id, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  const handleClick = useCallback(() => {
    onClick(property.id);
  }, [property.id, onClick]);

  if (!property.latitude || !property.longitude) return null;

  return (
    <Marker
      ref={markerRef}
      position={[property.latitude, property.longitude]}
      icon={icon}
      zIndexOffset={100}
      eventHandlers={{
        mouseover: handleMouseEnter,
        mouseout: handleMouseLeave,
        click: handleClick,
      }}
    />
  );
}
