import { useMemo } from 'react';
import { Popup } from 'react-leaflet';
import { Property } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';
import { Bed, Bath, Maximize } from 'lucide-react';

interface MapHoverPopupProps {
  property: Property;
}

export function MapHoverPopup({ property }: MapHoverPopupProps) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();

  const image = useMemo(
    () =>
      property.images?.[0] ||
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&auto=format&fit=crop&q=60',
    [property.images],
  );

  const isRental = property.listing_status === 'for_rent';

  if (!property.latitude || !property.longitude) return null;

  return (
    <Popup
      position={[property.latitude, property.longitude]}
      closeButton={false}
      className="hover-popup"
      maxWidth={260}
      minWidth={240}
      autoPan={false}
      offset={[0, -36]}
    >
      <div className="bg-card text-card-foreground rounded-xl overflow-hidden shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Image */}
        <div className="relative h-28 overflow-hidden">
          <img
            src={image}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <Badge
            variant={isRental ? 'secondary' : 'default'}
            className={`absolute top-1.5 left-1.5 text-xs px-2 py-0.5 ${
              isRental
                ? 'bg-muted text-foreground'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            {isRental ? 'Rent' : 'Sale'}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-2.5 space-y-1">
          <p className="font-bold text-sm text-foreground leading-tight">
            {formatPrice(property.price, property.currency || 'ILS')}
            {isRental && (
              <span className="text-xs font-normal text-muted-foreground">
                /mo
              </span>
            )}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Bed className="h-3 w-3" />
              {property.bedrooms}
            </span>
            <span className="flex items-center gap-0.5">
              <Bath className="h-3 w-3" />
              {property.bathrooms}
            </span>
            {property.size_sqm && (
              <span className="flex items-center gap-0.5">
                <Maximize className="h-3 w-3" />
                {formatArea(property.size_sqm)}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground truncate">
            {property.address ||
              `${property.neighborhood ? property.neighborhood + ', ' : ''}${property.city}`}
          </p>
        </div>
      </div>
    </Popup>
  );
}
