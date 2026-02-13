import { Link } from 'react-router-dom';
import { Popup } from 'react-leaflet';
import { Property } from '@/types/database';
import { PropertyThumbnail } from '@/components/shared/PropertyThumbnail';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';

interface MapPropertyPopupProps {
  property: Property;
  onClose: () => void;
}

export function MapPropertyPopup({ property, onClose }: MapPropertyPopupProps) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();

  const stats = [
    property.bedrooms > 0 ? `${property.bedrooms}bd` : null,
    property.bathrooms > 0 ? `${property.bathrooms}ba` : null,
    property.size_sqm ? formatArea(property.size_sqm) : null,
  ].filter(Boolean).join(' · ');

  const location = [property.neighborhood, property.city].filter(Boolean).join(', ');

  return (
    <Popup
      position={[property.latitude!, property.longitude!]}
      autoPan={false}
      closeButton={false}
      className="property-popup"
      eventHandlers={{ remove: onClose }}
    >
      <Link
        to={`/property/${property.id}`}
        className="flex gap-2 w-[260px] no-underline text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-[90px] h-[68px] shrink-0 rounded overflow-hidden bg-muted">
          <PropertyThumbnail
            src={property.images?.[0]}
            alt={property.title}
            className="w-full h-full"
          />
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-sm font-bold truncate">
            {formatPrice(property.price, property.currency)}
          </p>
          {stats && <p className="text-xs text-muted-foreground">{stats}</p>}
          <p className="text-xs text-muted-foreground truncate">{location}</p>
        </div>
      </Link>
    </Popup>
  );
}
