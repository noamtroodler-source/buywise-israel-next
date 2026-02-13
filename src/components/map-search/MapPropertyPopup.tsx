import { useMemo, useState, useCallback, useEffect } from 'react';
import { Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { Property } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FavoriteButton } from '@/components/property/FavoriteButton';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';
import { CommuteInfo } from './CommuteLines';
import { SavedLocation } from '@/types/savedLocation';
import { Bed, Bath, Maximize, X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

interface MapPropertyPopupProps {
  propertyId: string;
  properties: Property[];
  onClose: () => void;
  savedLocations?: SavedLocation[];
}

export function MapPropertyPopup({ propertyId, properties, onClose, savedLocations }: MapPropertyPopupProps) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  const [imageIndex, setImageIndex] = useState(0);
  
  const property = useMemo(() => 
    properties.find(p => p.id === propertyId),
    [properties, propertyId]
  );

  const images = useMemo(() => {
    if (!property?.images?.length) return ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&auto=format&fit=crop&q=60'];
    return property.images.slice(0, 5);
  }, [property?.images]);

  // Reset image index when property changes
  useEffect(() => {
    setImageIndex(0);
  }, [propertyId]);

  const handleImagePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleImageNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  if (!property || !property.latitude || !property.longitude) return null;

  const isRental = property.listing_status === 'for_rent';

  return (
    <Popup
      position={[property.latitude, property.longitude]}
      closeButton={false}
      className="property-popup"
      maxWidth={300}
      minWidth={300}
      autoPan={false}
      offset={[0, -12]}
    >
      <div className="bg-card text-card-foreground rounded-xl overflow-hidden shadow-xl">
        {/* Image - taller */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={images[imageIndex]}
            alt={property.title}
            className="w-full h-full object-cover transition-opacity duration-200"
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-sm transition-colors"
            aria-label="Close popup"
          >
            <X className="h-3.5 w-3.5 text-foreground" />
          </button>

          {/* Image carousel arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handleImagePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-sm transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-foreground" />
              </button>
              <button
                onClick={handleImageNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-sm transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="h-3.5 w-3.5 text-foreground" />
              </button>
              {/* Dot indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imageIndex ? 'bg-background' : 'bg-background/50'}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Favorite - top left */}
          <div className="absolute top-2 left-2">
            <FavoriteButton propertyId={property.id} propertyPrice={property.price} size="sm" />
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Price */}
          <p className="font-bold text-lg text-foreground leading-tight">
            {formatPrice(property.price, property.currency || 'ILS')}
            {isRental && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
          </p>

          {/* Stats - pipe separated */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Bed className="h-3.5 w-3.5" />
              {property.bedrooms} bd
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-0.5">
              <Bath className="h-3.5 w-3.5" />
              {property.bathrooms} ba
            </span>
            {property.size_sqm && (
              <>
                <span className="text-border">|</span>
                <span className="flex items-center gap-0.5">
                  <Maximize className="h-3.5 w-3.5" />
                  {formatArea(property.size_sqm)}
                </span>
              </>
            )}
          </div>

          {/* Address */}
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {property.address || `${property.neighborhood ? property.neighborhood + ', ' : ''}${property.city}`}
          </p>

          {/* Commute Info */}
          {savedLocations && savedLocations.length > 0 && (
            <CommuteInfo property={property} savedLocations={savedLocations} />
          )}

          {/* View Details - full width */}
          <Button asChild className="w-full h-9 text-sm" size="sm">
            <Link to={`/property/${property.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </div>
    </Popup>
  );
}
