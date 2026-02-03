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
    
    let bgColor = 'hsl(213, 94%, 45%)'; // Primary blue for sales
    let textColor = 'white';
    let opacity = '1';
    let scale = 'scale-100';
    let zIndex = 100;
    let shadow = 'shadow-md';
    
    if (isRental) {
      bgColor = 'hsl(var(--muted))';
      textColor = 'hsl(var(--foreground))';
    }
    
    if (isSold) {
      bgColor = 'hsl(var(--muted))';
      textColor = 'hsl(var(--muted-foreground))';
      opacity = '0.7';
    }
    
    if (isHovered || isSelected) {
      scale = 'scale-110';
      zIndex = 1000;
      shadow = 'shadow-lg ring-2 ring-primary';
    }
    
    return { bgColor, textColor, opacity, scale, zIndex, shadow, isRental };
  }, [property.listing_status, isHovered, isSelected]);

  // Create custom icon
  const icon = useMemo(() => {
    const suffix = markerStyle.isRental ? '/mo' : '';
    const selectedClass = (isHovered || isSelected) ? 'ring-2 ring-primary ring-offset-1' : '';
    const scaleClass = (isHovered || isSelected) ? 'scale-110' : 'scale-100';
    
    return L.divIcon({
      html: `
        <div 
          class="property-marker whitespace-nowrap px-2.5 py-1.5 rounded-full font-semibold text-xs cursor-pointer transition-all duration-200 ${scaleClass} ${selectedClass}"
          style="
            background-color: ${markerStyle.bgColor};
            color: ${markerStyle.textColor};
            opacity: ${markerStyle.opacity};
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          "
        >
          ₪${displayPrice}${suffix}
        </div>
      `,
      className: '',
      iconSize: L.point(0, 0),
      iconAnchor: L.point(0, 0),
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
