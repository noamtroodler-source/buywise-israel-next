import { Link } from 'react-router-dom';
import { Popup } from 'react-leaflet';
import { Property } from '@/types/database';
import { PropertyThumbnail } from '@/components/shared/PropertyThumbnail';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';
import { Heart } from 'lucide-react';

interface MapPropertyPopupProps {
  property: Property;
  onClose: () => void;
}

export function MapPropertyPopup({ property, onClose }: MapPropertyPopupProps) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();

  const stats = [
    property.bedrooms > 0 ? `${property.bedrooms} bd` : null,
    property.bathrooms > 0 ? `${property.bathrooms} ba` : null,
    property.size_sqm ? formatArea(property.size_sqm) : null,
  ].filter(Boolean).join(' | ');

  const location = [property.neighborhood, property.city].filter(Boolean).join(', ');

  const propertyType = property.property_type
    ? property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)
    : null;

  const listingLabel = [
    propertyType,
    property.listing_status === 'for_rent' ? 'for rent' : 'for sale',
  ].filter(Boolean).join(' ');

  return (
    <Popup
      position={[property.latitude!, property.longitude!]}
      autoPan={false}
      closeButton={false}
      className="property-popup property-popup-zillow"
      eventHandlers={{ remove: onClose }}
    >
      <Link
        to={`/property/${property.id}`}
        className="block w-[280px] no-underline text-foreground group"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative w-full h-[160px] overflow-hidden rounded-t-lg bg-muted">
          <PropertyThumbnail
            src={property.images?.[0]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-foreground" />
          </div>
        </div>

        {/* Details */}
        <div className="p-3">
          <p className="text-base font-bold text-foreground leading-tight">
            {formatPrice(property.price, property.currency)}
          </p>
          {stats && (
            <p className="text-sm text-muted-foreground mt-1">
              {stats}
              {listingLabel ? ` - ${listingLabel}` : ''}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{location}</p>
        </div>
      </Link>
    </Popup>
  );
}
