import { useMemo } from 'react';
import { Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { Property } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FavoriteButton } from '@/components/property/FavoriteButton';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';
import { Bed, Bath, Maximize, ExternalLink, X } from 'lucide-react';

interface MapPropertyPopupProps {
  propertyId: string;
  properties: Property[];
  onClose: () => void;
}

export function MapPropertyPopup({ propertyId, properties, onClose }: MapPropertyPopupProps) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  
  const property = useMemo(() => 
    properties.find(p => p.id === propertyId),
    [properties, propertyId]
  );

  if (!property || !property.latitude || !property.longitude) return null;

  const image = property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&auto=format&fit=crop&q=60';
  const isRental = property.listing_status === 'for_rent';

  return (
    <Popup
      position={[property.latitude, property.longitude]}
      closeButton={false}
      className="property-popup"
      maxWidth={320}
      minWidth={280}
    >
      <div className="relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow"
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* Image */}
        <div className="relative h-32 -mx-3 -mt-3 mb-3 overflow-hidden rounded-t-lg">
          <img
            src={image}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2">
            <Badge className={isRental ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'}>
              {isRental ? 'For Rent' : 'For Sale'}
            </Badge>
          </div>
          <div className="absolute top-2 right-10">
            <FavoriteButton propertyId={property.id} propertyPrice={property.price} size="sm" />
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          {/* Price */}
          <p className="font-bold text-lg">
            {formatPrice(property.price, property.currency || 'ILS')}
            {isRental && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
          </p>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              {property.bedrooms} bd
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {property.bathrooms} ba
            </span>
            {property.size_sqm && (
              <span className="flex items-center gap-1">
                <Maximize className="h-4 w-4" />
                {formatArea(property.size_sqm)}
              </span>
            )}
          </div>
          
          {/* Address */}
          <p className="text-sm text-muted-foreground truncate">
            {property.address || `${property.neighborhood ? property.neighborhood + ', ' : ''}${property.city}`}
          </p>
          
          {/* View Details Button */}
          <Button asChild className="w-full mt-3" size="sm">
            <Link to={`/property/${property.id}`}>
              View Details
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </Popup>
  );
}
