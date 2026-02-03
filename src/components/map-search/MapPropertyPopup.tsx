import { useMemo } from 'react';
import { Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { Property } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FavoriteButton } from '@/components/property/FavoriteButton';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';
import { CommuteInfo } from './CommuteLines';
import { SavedLocation } from '@/types/savedLocation';
import { Bed, Bath, Maximize, X } from 'lucide-react';

interface MapPropertyPopupProps {
  propertyId: string;
  properties: Property[];
  onClose: () => void;
  savedLocations?: SavedLocation[];
}

export function MapPropertyPopup({ propertyId, properties, onClose, savedLocations }: MapPropertyPopupProps) {
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
      maxWidth={280}
      minWidth={280}
    >
      <div className="bg-card text-card-foreground overflow-hidden">
        {/* Image Header */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={image}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          
          {/* Close button - top right */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-md transition-colors"
            aria-label="Close popup"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
          
          {/* Status badge - top left */}
          <div className="absolute top-2 left-2">
            <Badge 
              variant={isRental ? "secondary" : "default"}
              className={isRental ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'}
            >
              {isRental ? 'For Rent' : 'For Sale'}
            </Badge>
          </div>
          
          {/* Favorite button - bottom right of image */}
          <div className="absolute bottom-2 right-2">
            <FavoriteButton propertyId={property.id} propertyPrice={property.price} size="sm" />
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Price */}
          <p className="font-bold text-lg text-foreground">
            {formatPrice(property.price, property.currency || 'ILS')}
            {isRental && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
          </p>
          
          {/* Stats */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" />
              {property.bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {property.bathrooms}
            </span>
            {property.size_sqm && (
              <span className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5" />
                {formatArea(property.size_sqm)}
              </span>
            )}
          </div>
          
          {/* Address */}
          <p className="text-sm text-muted-foreground truncate">
            {property.address || `${property.neighborhood ? property.neighborhood + ', ' : ''}${property.city}`}
          </p>
          
          {/* View Details Button */}
          <Button asChild className="w-full" size="sm">
            <Link to={`/property/${property.id}`}>
              View Details
            </Link>
          </Button>

          {/* Commute Info (if user has saved locations) */}
          {savedLocations && savedLocations.length > 0 && (
            <CommuteInfo property={property} savedLocations={savedLocations} />
          )}
        </div>
      </div>
    </Popup>
  );
}
