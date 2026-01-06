import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bed, Bath, Maximize, MapPin, ChevronLeft, ChevronRight, Wallet, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/types/database';
import { cn } from '@/lib/utils';
import { FavoriteButton } from './FavoriteButton';
import { CompareButton } from './CompareButton';
import { ShareButton } from './ShareButton';
import { MonthlyEstimate } from './AffordabilityBadge';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';
import { differenceInDays } from 'date-fns';

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
  const [imageLoaded, setImageLoaded] = useState(true);
  const [imageError, setImageError] = useState(false);

  const images = property.images?.length ? property.images : [];
  const hasMultipleImages = images.length > 1;
  const placeholderImage = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60';

  // Check if property is new (listed within last 7 days)
  const isNewListing = property.created_at 
    ? differenceInDays(new Date(), new Date(property.created_at)) <= 7 
    : false;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageLoaded(false);
    setImageError(false);
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageLoaded(false);
    setImageError(false);
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // NOTE: Avoid clearing imageError inside onLoad.
  // If a listing image 404s, the placeholder loads successfully, and onLoad would
  // flip imageError back to false -> causing an endless flicker loop.
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
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

  const currentImage = imageError ? placeholderImage : (images[currentImageIndex] || placeholderImage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/property/${property.id}`}>
        <Card className={cn(
          "overflow-hidden transition-all duration-300 group cursor-pointer",
          "border border-border/60 shadow-sm",
          "hover:shadow-lg hover:-translate-y-1 hover:border-primary/30",
          className
        )}>
        {compact ? (
            /* Compact Mode: Fully Square Card with Overlay */
            <div className="relative aspect-square overflow-hidden">
              {/* Loading skeleton */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
              )}
              <img
                src={currentImage}
                alt={property.title}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover select-none group-hover:scale-105 transition-all duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />

              {/* Progress Bar - At top of image, hover-only */}
              {hasMultipleImages && (
                <div className="absolute top-2 left-2 right-2 flex gap-0.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      className={cn(
                        "flex-1 h-1 rounded-full transition-colors duration-200",
                        index === currentImageIndex 
                          ? "bg-white" 
                          : "bg-white/30"
                      )}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
              
              {/* Image Navigation Arrows */}
              {hasMultipleImages && (
                <>
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4 text-foreground" />
                  </button>
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4 text-foreground" />
                  </button>
                </>
              )}

              {/* Status Badge - Top Left (moved below progress bar) */}
              <div className="absolute top-6 left-2 flex gap-1.5 z-10">
                {!hideStatusBadge && (
                  <Badge className={cn("text-xs font-medium", getStatusColor(property.listing_status))}>
                    {getStatusLabel(property.listing_status)}
                  </Badge>
                )}
                {isNewListing && (
                  <Badge className="bg-accent text-accent-foreground text-xs font-medium animate-pulse">
                    <Sparkles className="h-3 w-3 mr-1" />
                    New
                  </Badge>
                )}
                {property.is_featured && !isNewListing && (
                  <Badge className="bg-accent text-accent-foreground text-xs font-medium">
                    Featured
                  </Badge>
                )}
              </div>

              {/* Action Buttons - Top Right */}
              <div className="absolute top-6 right-2 flex items-center gap-1 z-10">
                {showCompareButton && <CompareButton propertyId={property.id} />}
                <FavoriteButton propertyId={property.id} />
              </div>

              {/* Bottom Overlay with Content - NO progress bar here */}
              <div className="absolute bottom-0 left-0 right-0 bg-white p-2.5">
                <p className="font-bold text-foreground text-lg">
                  {formatPrice(property.price, property.currency || 'ILS')}
                  {property.listing_status === 'for_rent' && (
                    <span className="text-xs font-normal text-muted-foreground">/mo</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {property.bedrooms} bd | {property.bathrooms} ba{property.size_sqm ? ` | ${formatArea(property.size_sqm)}` : ''}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}
                </p>
              </div>
            </div>
          ) : (
            /* Non-Compact Mode: Standard Layout */
            <>
              <div className="relative aspect-[4/3] overflow-hidden">
                {/* Loading skeleton */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-muted animate-pulse" />
                )}
                 <img
                   src={currentImage}
                   alt={property.title}
                   draggable={false}
                   onDragStart={(e) => e.preventDefault()}
                   className={cn(
                     "w-full h-full object-cover select-none group-hover:scale-105 transition-all duration-300",
                     imageLoaded ? "opacity-100" : "opacity-0"
                   )}
                   onLoad={handleImageLoad}
                   onError={handleImageError}
                 />
                
                {/* Image Navigation Arrows */}
                {hasMultipleImages && (
                  <>
                     <button
                       onPointerDown={(e) => {
                         e.preventDefault();
                         e.stopPropagation();
                       }}
                       onClick={handlePrevImage}
                       className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                       aria-label="Previous image"
                     >
                       <ChevronLeft className="h-5 w-5 text-foreground" />
                     </button>
                     <button
                       onPointerDown={(e) => {
                         e.preventDefault();
                         e.stopPropagation();
                       }}
                       onClick={handleNextImage}
                       className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                       aria-label="Next image"
                     >
                       <ChevronRight className="h-5 w-5 text-foreground" />
                     </button>
                    
                    {/* Progress Bar Indicator - hover-only */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 flex z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentImageIndex(index);
                          }}
                          className={cn(
                            "flex-1 h-full transition-colors duration-200",
                            index === currentImageIndex 
                              ? "bg-white" 
                              : "bg-white/30"
                          )}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
                
                <div className="absolute top-3 left-3 flex gap-2">
                  {!hideStatusBadge && (
                    <Badge className={cn("text-xs font-medium", getStatusColor(property.listing_status))}>
                      {getStatusLabel(property.listing_status)}
                    </Badge>
                  )}
                  {isNewListing && (
                    <Badge className="bg-accent text-accent-foreground text-xs font-medium animate-pulse">
                      <Sparkles className="h-3 w-3 mr-1" />
                      New
                    </Badge>
                  )}
                  {property.is_featured && !isNewListing && (
                    <Badge className="bg-accent text-accent-foreground text-xs font-medium">
                      Featured
                    </Badge>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <ShareButton propertyId={property.id} propertyTitle={property.title} />
                  {showCompareButton && <CompareButton propertyId={property.id} />}
                  <FavoriteButton propertyId={property.id} />
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                {/* Price */}
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-foreground text-2xl">
                    {formatPrice(property.price, property.currency || 'ILS')}
                    {property.listing_status === 'for_rent' && (
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    )}
                  </span>
                  {property.listing_status === 'for_sale' && showMonthlyEstimate && (
                    <MonthlyEstimate price={property.price} />
                  )}
                </div>

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
              </CardContent>
            </>
          )}
        </Card>
      </Link>
    </motion.div>
  );
}
