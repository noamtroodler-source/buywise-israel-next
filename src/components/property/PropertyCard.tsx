import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bed, Bath, Maximize, MapPin, ChevronLeft, ChevronRight, Wallet, Sparkles, Clock } from 'lucide-react';
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
  showShareButton?: boolean;
  showMonthlyEstimate?: boolean;
  hideStatusBadge?: boolean;
  compact?: boolean;
  maxBadges?: 1 | 2 | 3;
  showCategoryBadge?: boolean;
  hideFeaturedBadge?: boolean;
  compareCategory?: 'buy' | 'rent';
}

export function PropertyCard({ property, className, showCompareButton = false, showShareButton = true, showMonthlyEstimate = true, hideStatusBadge = false, compact = false, maxBadges = 2, showCategoryBadge = false, hideFeaturedBadge = false, compareCategory }: PropertyCardProps) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(true);
  const [imageError, setImageError] = useState(false);

  const images = property.images?.length ? property.images : [];
  const hasMultipleImages = images.length > 1;
  const placeholderImage = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60';

  // Calculate days on market
  const daysOnMarket = property.created_at 
    ? differenceInDays(new Date(), new Date(property.created_at)) 
    : null;

  // Check if property is new (listed within last 7 days)
  const isNewListing = daysOnMarket !== null && daysOnMarket <= 7;

  // Format days on market label
  const getDaysOnMarketLabel = () => {
    if (daysOnMarket === null) return null;
    if (daysOnMarket === 0) return 'Listed today';
    if (daysOnMarket === 1) return '1 day ago';
    if (daysOnMarket > 90) return '90+ days';
    return `${daysOnMarket} days ago`;
  };

  const daysLabel = getDaysOnMarketLabel();

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
        return 'bg-muted text-foreground';
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
          "overflow-hidden transition-all duration-300 group cursor-pointer rounded-xl",
          "border border-border/50 bg-white ring-1 ring-black/5 shadow-md",
          "hover:shadow-xl hover:-translate-y-1 hover:border-primary/30",
          className
        )}>
        {compact ? (
            /* Compact Mode: Stacked Layout - Image + Content Below (Zillow-style) */
            <>
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
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

                {/* Progress Bar - Bottom of image, above white content, hover-only */}
                {hasMultipleImages && (
                  <div className="absolute bottom-2 left-2 right-2 flex gap-0.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

                {/* Status Badge - Top Left */}
                <div className="absolute top-2 left-2 flex gap-1.5 z-10">
                  {(() => {
                    const badges: React.ReactNode[] = [];
                    
                    if (showCategoryBadge && !hideStatusBadge) {
                      badges.push(
                        <Badge key="category" className={cn("text-xs font-medium", getStatusColor(property.listing_status))}>
                          {getStatusLabel(property.listing_status)}
                        </Badge>
                      );
                    }
                    
                    
                    if (isNewListing) {
                      badges.push(
                        <Badge key="new" className="bg-project text-project-foreground text-xs font-medium">
                          <Sparkles className="h-3 w-3 mr-1" />
                          New
                        </Badge>
                      );
                    }
                    
                    return badges.slice(0, maxBadges);
                  })()}
                </div>

                {/* Action Buttons - Top Right */}
                <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                  {showShareButton && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <ShareButton propertyId={property.id} propertyTitle={property.title} size="sm" />
                    </div>
                  )}
                  {showCompareButton && !showShareButton && compareCategory && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <CompareButton propertyId={property.id} category={compareCategory} />
                    </div>
                  )}
                  <FavoriteButton propertyId={property.id} propertyPrice={property.price} />
                </div>
              </div>

              {/* Content Section BELOW Image - Clean White Area */}
              <div className="p-3 bg-white border-t border-black/5">
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
                {daysLabel && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
                    <Clock className="h-3 w-3" />
                    {daysLabel}
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Non-Compact Mode: Standard Layout */
            <>
              <div className="relative aspect-[16/10] overflow-hidden">
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
                    
                    {/* Progress Bar Indicator - Bottom of image, above white content, hover-only */}
                    <div className="absolute bottom-2 left-2 right-2 flex gap-0.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                  </>
                )}
                
                <div className="absolute top-3 left-3 flex gap-2">
                  {(() => {
                    const badges: React.ReactNode[] = [];
                    
                    if (showCategoryBadge && !hideStatusBadge) {
                      badges.push(
                        <Badge key="category" className={cn("text-xs font-medium", getStatusColor(property.listing_status))}>
                          {getStatusLabel(property.listing_status)}
                        </Badge>
                      );
                    }
                    
                    
                    if (isNewListing) {
                      badges.push(
                        <Badge key="new" className="bg-project text-project-foreground text-xs font-medium">
                          <Sparkles className="h-3 w-3 mr-1" />
                          New
                        </Badge>
                      );
                    }
                    
                    return badges.slice(0, maxBadges);
                  })()}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {showShareButton && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <ShareButton propertyId={property.id} propertyTitle={property.title} />
                    </div>
                  )}
                  {showCompareButton && !showShareButton && compareCategory && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <CompareButton propertyId={property.id} category={compareCategory} />
                    </div>
                  )}
                  <FavoriteButton propertyId={property.id} propertyPrice={property.price} />
                </div>
              </div>

              <CardContent className="p-3 space-y-1.5">
                {/* Price */}
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-foreground text-lg">
                    {formatPrice(property.price, property.currency || 'ILS')}
                    {property.listing_status === 'for_rent' && (
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    )}
                  </span>
                  {property.listing_status === 'for_sale' && showMonthlyEstimate && (
                    <MonthlyEstimate price={property.price} />
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-xs line-clamp-1">
                    {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}
                  </span>
                </div>

                {/* Features */}
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Bed className="h-3.5 w-3.5" />
                    <span className="text-xs">{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5" />
                    <span className="text-xs">{property.bathrooms}</span>
                  </div>
                  {property.size_sqm && (
                    <div className="flex items-center gap-1">
                      <Maximize className="h-3.5 w-3.5" />
                      <span className="text-xs">{formatArea(property.size_sqm)}</span>
                    </div>
                  )}
                  {daysLabel && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs">{daysLabel}</span>
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
