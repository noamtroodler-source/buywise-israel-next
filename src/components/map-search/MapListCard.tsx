import { memo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Property } from '@/types/database';
import { PropertyThumbnail } from '@/components/shared/PropertyThumbnail';
import { FavoriteButton } from '@/components/property/FavoriteButton';
import { CarouselDots } from '@/components/shared/CarouselDots';
import { Badge } from '@/components/ui/badge';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';
import { PROPERTY_TYPE_LABELS } from '@/lib/seo/constants';
import { cn } from '@/lib/utils';

interface MapListCardProps {
  property: Property;
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

  return null;
}

export const MapListCard = memo(function MapListCard({ property }: MapListCardProps) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  const [imageIndex, setImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

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
  const hasOriginalPrice = property.original_price && property.original_price > property.price;

  const stats = [
    property.bedrooms > 0 ? `${property.bedrooms} bds` : null,
    property.bathrooms > 0 ? `${property.bathrooms} ba` : null,
    property.size_sqm ? formatArea(property.size_sqm) : null,
  ].filter(Boolean).join(' | ');

  const location = [property.neighborhood, property.city].filter(Boolean).join(', ');
  const typeLabel = PROPERTY_TYPE_LABELS[property.property_type] || property.property_type;

  return (
    <Link
      to={`/property/${property.id}`}
      className="group block rounded-lg border border-border bg-card overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image section */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <PropertyThumbnail
          src={images[imageIndex]}
          alt={property.title}
          className="w-full h-full"
        />

        {/* Favorite */}
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton propertyId={property.id} propertyPrice={property.price} />
        </div>

        {/* Badge */}
        {badge && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant={badge.variant} className="text-xs gap-1 backdrop-blur-sm">
              {badge.icon && <badge.icon className="h-3 w-3" />}
              {badge.label}
            </Badge>
          </div>
        )}

        {/* Carousel arrows */}
        {totalImages > 1 && isHovered && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
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
      </div>

      {/* Info section */}
      <div className="p-3 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">
            {formatPrice(property.price, property.currency)}
          </span>
          {hasOriginalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(property.original_price!, property.currency)}
            </span>
          )}
        </div>

        {stats && (
          <p className="text-sm text-muted-foreground">{stats}</p>
        )}

        <p className="text-sm text-foreground truncate">{location}</p>

        <p className="text-xs text-muted-foreground capitalize">{typeLabel}</p>
      </div>
    </Link>
  );
});
