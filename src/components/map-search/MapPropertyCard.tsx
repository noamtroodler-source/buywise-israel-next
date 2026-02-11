import { memo, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bed, Bath, Maximize, MapPin, TrendingDown, Sparkles, Flame, Clock } from 'lucide-react';
import { Property } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { FavoriteButton } from '@/components/property/FavoriteButton';
import { ShareButton } from '@/components/property/ShareButton';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface MapPropertyCardProps {
  property: Property;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
}

export const MapPropertyCard = memo(function MapPropertyCard({
  property,
  isHovered,
  onHover,
  onSelect,
}: MapPropertyCardProps) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const placeholderImage = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&auto=format&fit=crop&q=60';
  const image = imageError 
    ? placeholderImage 
    : (property.images?.[0] || placeholderImage);

  // Calculate days on market
  const daysOnMarket = property.created_at 
    ? differenceInDays(new Date(), new Date(property.created_at)) 
    : null;
  
  const isHot = daysOnMarket !== null && daysOnMarket <= 3;
  const isNew = daysOnMarket !== null && daysOnMarket <= 14;
  
  const hasPriceDrop = property.original_price && property.original_price > property.price;

  const handleMouseEnter = useCallback(() => {
    onHover(property.id);
  }, [property.id, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  return (
    <Link
      to={`/property/${property.id}`}
      className={cn(
        "flex gap-3 p-3 rounded-lg border bg-card transition-all duration-200 group",
        isHovered 
          ? "border-primary shadow-md ring-1 ring-primary/20" 
          : "border-border hover:border-primary/50 hover:shadow-sm"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image */}
      <div className="relative w-28 h-24 rounded-md overflow-hidden flex-shrink-0">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <img
          src={image}
          alt={property.title}
          className={cn(
            "w-full h-full object-cover transition-all duration-300",
            imageLoaded ? "opacity-100" : "opacity-0",
            "group-hover:scale-105"
          )}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
        
        {/* Status badges overlay */}
        <div className="absolute top-1 left-1 flex gap-1">
          {isHot && (
            <Badge className="bg-semantic-teal text-semantic-teal-foreground text-[10px] px-1.5 py-0.5">
              <Flame className="h-2.5 w-2.5 mr-0.5" />
              Just Listed
            </Badge>
          )}
          {!isHot && isNew && (
            <Badge className="bg-semantic-teal text-semantic-teal-foreground text-[10px] px-1.5 py-0.5">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
              New
            </Badge>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <p className="font-bold text-foreground">
              {formatPrice(property.price, property.currency || 'ILS')}
              {property.listing_status === 'for_rent' && (
                <span className="text-xs font-normal text-muted-foreground">/mo</span>
              )}
            </p>
            {hasPriceDrop && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(property.original_price!, property.currency || 'ILS')}
              </span>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
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
          
          {/* Location */}
          <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}
          </p>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between mt-1">
          {daysOnMarket !== null && (
            <span className={cn(
              "text-xs flex items-center gap-1",
              isHot ? "text-primary font-medium" : "text-muted-foreground"
            )}>
              <Clock className="h-3 w-3" />
              {daysOnMarket === 0 ? 'Today' : `${daysOnMarket}d`}
            </span>
          )}
          
          {hasPriceDrop && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
              <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
              Price Drop
            </Badge>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex-shrink-0 self-start flex flex-col gap-1">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ShareButton 
            propertyId={property.id} 
            propertyTitle={property.title}
            className="h-7 w-7"
          />
        </div>
        <FavoriteButton 
          propertyId={property.id} 
          propertyPrice={property.price}
          size="sm"
        />
      </div>
    </Link>
  );
});
