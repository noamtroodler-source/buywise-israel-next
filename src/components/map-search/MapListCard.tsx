import { memo, useCallback, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bed, Bath, Maximize, MapPin, TrendingDown, Flame, Sparkles } from 'lucide-react';
import { Property } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { FavoriteButton } from '@/components/property/FavoriteButton';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface MapListCardProps {
  property: Property;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
}

export const MapListCard = memo(function MapListCard({
  property,
  isHovered,
  onHover,
  onSelect,
}: MapListCardProps) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  const [imageIndex, setImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const placeholderImage = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&auto=format&fit=crop&q=60';
  const images = property.images?.length
    ? property.images.slice(0, 5)
    : [placeholderImage];
  const currentImage = imageError ? placeholderImage : images[imageIndex];

  const daysOnMarket = property.created_at
    ? differenceInDays(new Date(), new Date(property.created_at))
    : null;

  const isHot = daysOnMarket !== null && daysOnMarket <= 3;
  const isNew = daysOnMarket !== null && daysOnMarket <= 14;
  const hasPriceDrop = property.original_price && property.original_price > property.price;
  const isRental = property.listing_status === 'for_rent';

  const handleMouseEnter = useCallback(() => {
    onHover(property.id);
    // Start cycling images on hover
    if (images.length > 1) {
      hoverTimerRef.current = setInterval(() => {
        setImageIndex(prev => (prev + 1) % images.length);
      }, 1500);
    }
  }, [property.id, onHover, images.length]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
    if (hoverTimerRef.current) {
      clearInterval(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setImageIndex(0);
  }, [onHover]);

  return (
    <Link
      to={`/property/${property.id}`}
      className={cn(
        "block rounded-xl overflow-hidden bg-card border transition-all duration-200 group",
        isHovered
          ? "border-primary shadow-lg -translate-y-0.5"
          : "border-border hover:shadow-md hover:-translate-y-0.5"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <img
          src={currentImage}
          alt={property.title}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            imageLoaded ? "opacity-100" : "opacity-0",
          )}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />

        {/* Status badges - top left */}
        <div className="absolute top-2 left-2 flex gap-1">
          {isHot && (
            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 shadow-sm">
              <Flame className="h-2.5 w-2.5 mr-0.5" />
              {isRental ? 'Just Available' : 'Just Listed'}
            </Badge>
          )}
          {!isHot && isNew && (
            <Badge className="bg-semantic-teal text-semantic-teal-foreground text-[10px] px-1.5 py-0.5 shadow-sm">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
              New
            </Badge>
          )}
          {hasPriceDrop && (
            <Badge className="bg-semantic-green text-semantic-green-foreground text-[10px] px-1.5 py-0.5 shadow-sm">
              <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
              Price Drop
            </Badge>
          )}
        </div>

        {/* Favorite - top right */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <FavoriteButton
            propertyId={property.id}
            propertyPrice={property.price}
            size="sm"
          />
        </div>

        {/* Image dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  i === imageIndex ? "bg-white" : "bg-white/50"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Price */}
        <div className="flex items-baseline gap-2">
          <p className="font-bold text-base text-foreground">
            {formatPrice(property.price, property.currency || 'ILS')}
            {isRental && (
              <span className="text-xs font-normal text-muted-foreground">/mo</span>
            )}
          </p>
          {hasPriceDrop && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(property.original_price!, property.currency || 'ILS')}
            </span>
          )}
        </div>

        {/* Stats - pipe separated */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
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
        <p className="text-xs text-muted-foreground mt-1.5 truncate flex items-center gap-1">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}
        </p>
      </div>
    </Link>
  );
});
