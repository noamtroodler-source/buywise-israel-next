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
import { Bed, Bath, Maximize, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface MapPropertyPopupProps {
  propertyId: string;
  properties: Property[];
  onClose: () => void;
  savedLocations?: SavedLocation[];
  onNavigate?: (direction: 'prev' | 'next') => void;
  onFindInList?: (propertyId: string) => void;
}

export function MapPropertyPopup({ propertyId, properties, onClose, savedLocations, onNavigate, onFindInList }: MapPropertyPopupProps) {
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
      maxWidth={260}
      minWidth={260}
      autoPan={false}
      offset={[0, -8]}
    >
      <div className="bg-card text-card-foreground rounded-xl overflow-hidden shadow-lg">
        {/* Image Header with carousel */}
        <div className="relative h-32 overflow-hidden">
          <img
            src={images[imageIndex]}
            alt={property.title}
            className="w-full h-full object-cover transition-opacity duration-200"
          />
          
          {/* Close button - top right */}
          <button
            onClick={onClose}
            className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-sm transition-colors"
            aria-label="Close popup"
          >
            <X className="h-3.5 w-3.5 text-foreground" />
          </button>

          {/* Image carousel arrows (only if multiple images) */}
          {images.length > 1 && (
            <>
              <button
                onClick={handleImagePrev}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-sm transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-foreground" />
              </button>
              <button
                onClick={handleImageNext}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-sm transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="h-3.5 w-3.5 text-foreground" />
              </button>
              {/* Dot indicators */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10 flex gap-1">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imageIndex ? 'bg-background' : 'bg-background/50'}`}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Status badge - top left */}
          <Badge 
            variant={isRental ? "secondary" : "default"}
            className={`absolute top-1.5 left-1.5 text-xs px-2 py-0.5 ${isRental ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'}`}
          >
            {isRental ? 'Rent' : 'Sale'}
          </Badge>
          
          {/* Favorite button - bottom right of image */}
          <div className="absolute bottom-1.5 right-1.5">
            <FavoriteButton propertyId={property.id} propertyPrice={property.price} size="sm" />
          </div>
        </div>
        
        {/* Content - compact spacing */}
        <div className="p-2.5 space-y-1.5">
          {/* Price */}
          <p className="font-bold text-base text-foreground leading-tight">
            {formatPrice(property.price, property.currency || 'ILS')}
            {isRental && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
          </p>
          
          {/* Stats - inline with address */}
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
          
          {/* Address */}
          <p className="text-xs text-muted-foreground truncate">
            {property.address || `${property.neighborhood ? property.neighborhood + ', ' : ''}${property.city}`}
          </p>
          
          {/* Property navigation + View Details */}
          <div className="flex items-center gap-1.5">
            {onNavigate && (
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
                className="w-8 h-8 rounded-md border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
                aria-label="Previous property"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            )}
            <Button asChild className="flex-1 h-8 text-xs" size="sm">
              <Link to={`/property/${property.id}`}>
                View Details
              </Link>
            </Button>
            {onNavigate && (
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
                className="w-8 h-8 rounded-md border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
                aria-label="Next property"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Find in list */}
          {onFindInList && (
            <button
              onClick={(e) => { e.stopPropagation(); onFindInList(propertyId); }}
              className="text-xs text-primary hover:underline w-full text-center"
            >
              Find in list
            </button>
          )}

          {/* Commute Info (if user has saved locations) */}
          {savedLocations && savedLocations.length > 0 && (
            <CommuteInfo property={property} savedLocations={savedLocations} />
          )}
        </div>
      </div>
    </Popup>
  );
}
