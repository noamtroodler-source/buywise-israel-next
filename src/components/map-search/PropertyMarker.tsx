import { useMemo, useCallback } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Property } from '@/types/database';
import { useFormatPrice } from '@/contexts/PreferencesContext';

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
  const formatPrice = useFormatPrice();
  
  // Format price for marker
  const displayPrice = useMemo(() => {
    const price = property.price;
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${Math.round(price / 1000)}K`;
    }
    return String(price);
  }, [property.price]);

  // Determine marker style based on listing status and state
  const markerStyle = useMemo(() => {
    const isRental = property.listing_status === 'for_rent';
    const isSold = property.listing_status === 'sold' || property.listing_status === 'rented';
    
    // Default: neutral white/gray
    let bgColor = 'white';
    let textColor = 'hsl(220, 10%, 40%)';
    let borderColor = 'hsl(220, 13%, 85%)';
    let opacity = '1';
    let zIndex = 100;
    
    // Sold/rented: more muted
    if (isSold) {
      bgColor = 'hsl(220, 13%, 95%)';
      textColor = 'hsl(220, 10%, 55%)';
      borderColor = 'hsl(220, 13%, 80%)';
      opacity = '0.7';
    }
    
    // Hover or selected: primary blue
    if (isHovered || isSelected) {
      bgColor = 'hsl(213, 94%, 45%)';
      textColor = 'white';
      borderColor = 'white';
      zIndex = 200;
    }
    
    return { bgColor, textColor, borderColor, opacity, zIndex, isRental };
  }, [property.listing_status, isHovered, isSelected]);

  // Create custom icon with callout shape
  const icon = useMemo(() => {
    const suffix = markerStyle.isRental ? '/mo' : '';
    const scaleStyle = (isHovered || isSelected) ? 'transform: scale(1.1);' : '';
    
    return L.divIcon({
      html: `
        <div 
          class="property-marker-wrapper"
          style="
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            ${scaleStyle}
            transition: transform 200ms ease;
          "
        >
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
              transition: all 200ms ease;
            "
          >
            ₪${displayPrice}${suffix}
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
            "
          ></div>
        </div>
      `,
      className: '',
      iconSize: L.point(0, 0),
      iconAnchor: L.point(0, 32),
    });
  }, [displayPrice, markerStyle, isHovered, isSelected]);

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
      position={[property.latitude, property.longitude]}
      icon={icon}
      zIndexOffset={markerStyle.zIndex}
      eventHandlers={{
        mouseover: handleMouseEnter,
        mouseout: handleMouseLeave,
        click: handleClick,
      }}
    />
  );
}
