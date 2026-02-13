import { memo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Popup } from 'react-leaflet';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Property } from '@/types/database';
import { PropertyThumbnail } from '@/components/shared/PropertyThumbnail';
import { FavoriteButton } from '@/components/property/FavoriteButton';
import { CarouselDots } from '@/components/shared/CarouselDots';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useFormatPrice, useFormatArea, useFormatPricePerArea } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';

interface MapPropertyPopupProps {
  property: Property;
  onClose: () => void;
}

function getStatusBadge(property: Property) {
  const createdAt = new Date(property.created_at);
  const now = new Date();
  const daysSinceListed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const isRental = property.listing_status === 'for_rent';

  if (property.is_featured) {
    return { label: 'Featured', variant: 'default' as const, icon: Sparkles };
  }

  if (property.original_price && property.original_price > property.price) {
    const dropPct = Math.round(((property.original_price - property.price) / property.original_price) * 100);
    return { label: `Price Drop ${dropPct}%`, variant: 'destructive' as const, icon: null };
  }

  if (daysSinceListed <= 3) {
    return { label: isRental ? 'Just Available' : 'Just Listed', variant: 'default' as const, icon: null };
  }

  if (daysSinceListed <= 14) {
    return { label: 'New', variant: 'outline' as const, icon: null };
  }

  return null;
}

export const MapPropertyPopup = memo(function MapPropertyPopup({ property, onClose }: MapPropertyPopupProps) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  const formatPricePerArea = useFormatPricePerArea();
  const [imageIndex, setImageIndex] = useState(0);

  const images = property.images?.length ? property.images : [null];
  const totalImages = images.length;

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex(i => (i - 1 + totalImages) % totalImages);
  }, [totalImages]);

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex(i => (i + 1) % totalImages);
  }, [totalImages]);

  const badge = getStatusBadge(property);

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

  const pricePerArea = property.size_sqm
    ? formatPricePerArea(property.price / property.size_sqm, property.currency)
    : null;

  const agent = property.agent;

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
        className="block w-[260px] no-underline text-foreground group"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image carousel – horizontal sliding strip like Zillow */}
        <div className="relative w-full h-[140px] overflow-hidden rounded-t-lg bg-muted">
          <div
            className="flex h-full transition-transform duration-300 ease-out will-change-transform"
            style={{ transform: `translateX(-${imageIndex * 100}%)` }}
          >
            {images.map((img, i) => (
              <div key={i} className="w-full h-full flex-shrink-0">
                <PropertyThumbnail
                  src={img}
                  alt={`${property.title} ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Favorite */}
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton propertyId={property.id} propertyPrice={property.price} />
          </div>

          {/* Badge */}
          {badge && (
            <div className="absolute top-2 left-2 z-10">
              <Badge
                variant={badge.variant}
                className={cn(
                  "text-xs gap-1 backdrop-blur-sm",
                  badge.label === 'New' && "bg-emerald-500/90 text-white border-emerald-500/90"
                )}
              >
                {badge.icon && <badge.icon className="h-3 w-3" />}
                {badge.label}
              </Badge>
            </div>
          )}

          {/* Carousel arrows — always mounted, visibility via CSS to prevent layout shifts */}
          {totalImages > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-foreground" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                aria-label="Next image"
              >
                <ChevronRight className="h-3.5 w-3.5 text-foreground" />
              </button>
            </>
          )}

          {/* Dots */}
          {totalImages > 1 && (
            <div className="absolute bottom-2 left-0 right-0 z-10">
              <CarouselDots
                total={Math.min(totalImages, 5)}
                current={imageIndex % Math.min(totalImages, 5)}
              />
            </div>
          )}

          {/* Agent avatar chip */}
          {agent?.avatar_url && (
            <div className="absolute bottom-2 right-2 z-10">
              <Avatar className="h-6 w-6 ring-2 ring-background">
                <AvatarImage src={agent.avatar_url} alt={agent.name} />
                <AvatarFallback className="text-[10px]">
                  {agent.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-2.5 space-y-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-foreground leading-tight">
              {formatPrice(property.price, property.currency)}
            </span>
            {pricePerArea && (
              <span className="text-xs text-muted-foreground">
                {pricePerArea}
              </span>
            )}
          </div>
          {stats && (
            <p className="text-sm text-muted-foreground">
              {stats}
              {listingLabel ? ` — ${listingLabel}` : ''}
            </p>
          )}
          <p className="text-sm text-muted-foreground truncate">{location}</p>
        </div>
      </Link>
    </Popup>
  );
});
