import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bed, Bath, Maximize, MapPin, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/types/database';
import { cn } from '@/lib/utils';
import { FavoriteButton } from './FavoriteButton';
import { CompareButton } from './CompareButton';
import { MonthlyEstimate } from './AffordabilityBadge';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';

interface PropertyCardProps {
  property: Property;
  className?: string;
  showCompareButton?: boolean;
  showMonthlyEstimate?: boolean;
  hideStatusBadge?: boolean;
  compact?: boolean;
}

export function PropertyCard({ property, className, showCompareButton = true, showMonthlyEstimate = true, hideStatusBadge = false, compact = false }: PropertyCardProps) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = property.images?.length ? property.images : [];
  const hasMultipleImages = images.length > 1;
  const placeholderImage = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60';

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'for_sale':
        return 'For Sale';
      case 'for_rent':
        return 'For Rent';
      case 'sold':
        return 'Sold';
      case 'rented':
        return 'Rented';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'for_sale':
        return 'bg-primary text-primary-foreground';
      case 'for_rent':
        return 'bg-success text-success-foreground';
      case 'sold':
      case 'rented':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/property/${property.id}`}>
        <Card className={cn(
          "overflow-hidden hover:shadow-card-hover transition-all duration-300 group cursor-pointer",
          className
        )}>
          {/* Image */}
          <div className={cn("relative overflow-hidden", compact ? "aspect-[5/4]" : "aspect-[4/3]")}>
            <img
              src={images[currentImageIndex] || placeholderImage}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Image Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5 text-foreground" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5 text-foreground" />
                </button>
                
                {/* Image Dots Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.slice(0, 5).map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-colors",
                        index === currentImageIndex ? "bg-background" : "bg-background/50"
                      )}
                    />
                  ))}
                  {images.length > 5 && (
                    <span className="text-[10px] text-background font-medium ml-1">+{images.length - 5}</span>
                  )}
                </div>
              </>
            )}
            
            <div className="absolute top-3 left-3 flex gap-2">
              {!hideStatusBadge && (
                <Badge className={cn("text-xs font-medium", getStatusColor(property.listing_status))}>
                  {getStatusLabel(property.listing_status)}
                </Badge>
              )}
              {property.is_featured && (
                <Badge className="bg-accent text-accent-foreground text-xs font-medium">
                  Featured
                </Badge>
              )}
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              {showCompareButton && <CompareButton propertyId={property.id} />}
              <FavoriteButton propertyId={property.id} />
            </div>
          </div>

          {/* Content */}
          <CardContent className={cn("space-y-1", compact ? "p-2" : "p-4 space-y-3")}>
            {/* Price */}
            <div className="flex items-baseline justify-between">
              <span className={cn("font-bold text-foreground", compact ? "text-lg" : "text-2xl")}>
                {formatPrice(property.price, property.currency || 'ILS')}
                {property.listing_status === 'for_rent' && (
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                )}
              </span>
              {!compact && property.listing_status === 'for_sale' && showMonthlyEstimate && (
                <MonthlyEstimate price={property.price} />
              )}
            </div>

            {/* Compact: specs inline, then location */}
            {compact ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {property.bedrooms} bd | {property.bathrooms} ba{property.size_sqm ? ` | ${formatArea(property.size_sqm)}` : ''}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}
                </p>
              </>
            ) : (
              <>
                {/* Title */}
                <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {property.title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm line-clamp-1">
                    {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}
                  </span>
                </div>

                {/* Features */}
                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Bed className="h-4 w-4" />
                    <span className="text-sm">{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Bath className="h-4 w-4" />
                    <span className="text-sm">{property.bathrooms}</span>
                  </div>
                  {property.size_sqm && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Maximize className="h-4 w-4" />
                      <span className="text-sm">{formatArea(property.size_sqm)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
