import { useState, memo, useMemo, useCallback, forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bed, Bath, Maximize, MapPin, ChevronLeft, ChevronRight, Wallet, Sparkles, Clock, TrendingDown, TrendingUp, Flame, Zap, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/types/database';
import { cn } from '@/lib/utils';
import { FavoriteButton } from './FavoriteButton';
import { PromotedBadge } from '@/components/shared/PromotedBadge';
import { CompareButton } from './CompareButton';
import { CompareCheckbox } from './CompareCheckbox';
import { ShareButton } from './ShareButton';

import { MonthlyEstimate } from './AffordabilityBadge';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { differenceInDays } from 'date-fns';
import { useEventTracking } from '@/hooks/useEventTracking';
import { useTouchSwipe } from '@/hooks/useTouchSwipe';

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
  /** Always show a compare checkbox (for Favorites page) */
  alwaysShowCompare?: boolean;
}

const PropertyCardComponent = memo(forwardRef<HTMLAnchorElement, PropertyCardProps>(function PropertyCard({ property, className, showCompareButton = false, showShareButton = true, showMonthlyEstimate = false, hideStatusBadge = false, compact = false, maxBadges = 2, showCategoryBadge = false, hideFeaturedBadge = false, compareCategory, alwaysShowCompare = false }, ref) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { trackClick } = useEventTracking();

  // Track card click for analytics
  const handleCardClick = useCallback(() => {
    trackClick('property_card', 'PropertyCard', {
      property_id: property.id,
      property_city: property.city,
      property_price: property.price,
      listing_status: property.listing_status,
    });
  }, [trackClick, property.id, property.city, property.price, property.listing_status]);

  const images = property.images?.length ? property.images : [];
  const hasMultipleImages = images.length > 1;
  const placeholderImage = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60';

  // Freshness tier for "Days on Market" prominence
  type FreshnessTier = 'hot' | 'fresh' | 'standard' | 'stale';
  
  // Memoize expensive calculations - only recompute when property data changes
  const { daysOnMarket, isNewListing, daysLabel, freshnessTier, hasPriceDrop, priceDropPercent, hasPriceIncrease } = useMemo(() => {
    const days = property.created_at 
      ? differenceInDays(new Date(), new Date(property.created_at)) 
      : null;
    
    const isNew = days !== null && days <= 14;
    
    // Determine freshness tier
    let tier: FreshnessTier = 'standard';
    if (days !== null) {
      if (days <= 3) tier = 'hot';
      else if (days <= 14) tier = 'fresh';
      else if (days <= 30) tier = 'standard';
      else tier = 'stale';
    }
    
    const hasDrop = property.original_price && property.original_price > property.price;
    const dropPercent = hasDrop 
      ? Math.round(((property.original_price! - property.price) / property.original_price!) * 100)
      : 0;
    
    const hasIncrease = !!(property.original_price && property.original_price < property.price);
    
    // Clearer labeling
    let label: string | null = null;
    if (days !== null) {
      if (days === 0) label = 'Listed today';
      else if (days === 1) label = 'Listed 1 day';
      else if (days > 90) label = '90+ days on market';
      else label = `Listed ${days} days`;
    }
    
    return { daysOnMarket: days, isNewListing: isNew, daysLabel: label, freshnessTier: tier, hasPriceDrop: hasDrop, priceDropPercent: dropPercent, hasPriceIncrease: hasIncrease };
  }, [property.created_at, property.original_price, property.price]);

  // Check if this is a rental (for more prominent freshness treatment)
  const isRental = property.listing_status === 'for_rent';

  const goToPrevImage = useCallback(() => {
    setImageLoaded(false);
    setImageError(false);
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNextImage = useCallback(() => {
    setImageLoaded(false);
    setImageError(false);
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goToPrevImage();
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goToNextImage();
  };

  // Touch swipe support for mobile
  const touchHandlers = useTouchSwipe({
    onSwipeLeft: hasMultipleImages ? goToNextImage : undefined,
    onSwipeRight: hasMultipleImages ? goToPrevImage : undefined,
    threshold: 30,
  });

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
    <>
      <Link ref={ref} to={`/property/${property.id}`} onClick={handleCardClick}>
        <Card className={cn(
          "overflow-hidden transition-all duration-300 group cursor-pointer rounded-xl",
          "border border-border/50 bg-white ring-1 ring-black/5 shadow-sm",
          "hover:shadow-md hover:-translate-y-1 hover:border-primary/30",
          className
        )}>
        {compact ? (
            /* Compact Mode: Stacked Layout - Image + Content Below (Zillow-style) */
            <>
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl" {...touchHandlers}>
                {/* Loading skeleton */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-muted animate-pulse" />
                )}
                <img
                  src={currentImage}
                  srcSet={currentImage.includes('unsplash.com') 
                    ? `${currentImage.replace('w=800', 'w=400')} 400w, ${currentImage.replace('w=800', 'w=600')} 600w, ${currentImage} 800w`
                    : undefined}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  alt={property.title}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover select-none group-hover:scale-105 transition-all duration-300",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />

                {/* Progress Bar - Bottom of image, always visible on mobile */}
                {hasMultipleImages && (
                  <div className="absolute bottom-2 left-2 right-2 flex gap-0.5 z-10 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
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

                {/* Always-visible Compare Checkbox - Top Left (before badges) */}
                {alwaysShowCompare && compareCategory && (
                  <div className="absolute top-2 left-2 z-20">
                    <CompareCheckbox propertyId={property.id} category={compareCategory} />
                  </div>
                )}

                {/* Status Badge - Top Left (offset if checkbox present) */}
                <div className={cn("absolute top-2 flex gap-1.5 z-10", alwaysShowCompare && compareCategory ? "left-10" : "left-2")}>
                  {(() => {
                    const badges: React.ReactNode[] = [];

                    // Promoted badge for boosted listings
                    if ((property as any)._isBoosted) {
                      badges.push(<PromotedBadge key="promoted" compact />);
                    }
                    if (showCategoryBadge && !hideStatusBadge) {
                      badges.push(
                        <Badge key="category" className={cn("text-xs font-medium", getStatusColor(property.listing_status))}>
                          {getStatusLabel(property.listing_status)}
                        </Badge>
                      );
                    }
                    
                    // Freshness badge - more prominent for hot/fresh listings (especially rentals)
                    if (freshnessTier === 'hot') {
                      badges.push(
                        <Badge key="fresh" className="bg-semantic-teal text-semantic-teal-foreground text-xs font-medium">
                          <Flame className="h-3 w-3 mr-1" />
                          {isRental ? 'Just Available' : 'Just Listed'}
                        </Badge>
                      );
                    } else if (freshnessTier === 'fresh') {
                      badges.push(
                        <Badge key="new" className="bg-semantic-teal text-semantic-teal-foreground text-xs font-medium">
                          <Sparkles className="h-3 w-3 mr-1" />
                          New
                        </Badge>
                      );
                    }
                    
                    if (hasPriceDrop && priceDropPercent >= 1) {
                      badges.push(
                        <Badge key="price-drop" className="bg-semantic-green text-semantic-green-foreground text-xs font-medium">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Price Drop
                        </Badge>
                      );
                    }
                    
                    if (hasPriceIncrease) {
                      badges.push(
                      <Badge key="price-up" className="bg-semantic-amber text-semantic-amber-foreground text-xs font-medium">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Price Up
                        </Badge>
                      );
                    }
                    
                    return badges.slice(0, maxBadges);
                  })()}
                </div>

                {/* Action Buttons - Top Right */}
                <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                  {showShareButton && (
                    <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                      <ShareButton propertyId={property.id} propertyTitle={property.title} />
                    </div>
                  )}
                  {showCompareButton && !showShareButton && compareCategory && (
                    <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                      <CompareButton propertyId={property.id} category={compareCategory} />
                    </div>
                  )}
                  <FavoriteButton propertyId={property.id} propertyPrice={property.price} />
                </div>

              </div>

              {/* Content Section BELOW Image - Clean White Area */}
              <div className="p-3 pt-2.5 pb-3 bg-white border-t border-black/5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <p className="font-bold text-foreground text-lg">
                      {formatPrice(property.price, property.currency || 'ILS')}
                      {property.listing_status === 'for_rent' && (
                        <span className="text-xs font-normal text-muted-foreground">/mo</span>
                      )}
                    </p>
                    {hasPriceDrop && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(property.original_price!, property.currency || 'ILS')}
                      </span>
                    )}
                    {hasPriceIncrease && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(property.original_price!, property.currency || 'ILS')}
                      </span>
                    )}
                  </div>
                  {property.agent?.agency?.logo_url && (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (property.agent?.agency) {
                                navigate(`/agencies/${property.agent.agency.name.toLowerCase().replace(/\s+/g, '-')}`);
                              }
                            }}
                            className="flex-shrink-0"
                          >
                            <Avatar className="h-7 w-7 border border-border/50 shadow-sm">
                              <AvatarImage src={property.agent.agency.logo_url} alt={property.agent.agency.name} />
                              <AvatarFallback className="bg-muted"><Building2 className="h-3 w-3 text-muted-foreground" /></AvatarFallback>
                            </Avatar>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">{property.agent.agency.name}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {property.bedrooms} bd{(property as any).additional_rooms ? ` + ${(property as any).additional_rooms}` : ''} · {property.bathrooms} ba{property.size_sqm ? ` · ${formatArea(property.size_sqm)}` : ''}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}
                </p>
                {daysLabel && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs pt-0.5",
                    freshnessTier === 'hot' ? "text-semantic-teal font-medium" :
                    freshnessTier === 'fresh' ? "text-semantic-teal font-medium" :
                    "text-muted-foreground"
                  )}>
                    {freshnessTier === 'hot' ? <Flame className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    <span>{daysLabel}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Non-Compact Mode: Standard Layout */
            <>
              <div className="relative aspect-[16/10] overflow-hidden" {...touchHandlers}>
                {/* Loading skeleton */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-muted animate-pulse" />
                )}
                 <img
                   src={currentImage}
                   srcSet={currentImage.includes('unsplash.com') 
                     ? `${currentImage.replace('w=800', 'w=400')} 400w, ${currentImage.replace('w=800', 'w=600')} 600w, ${currentImage} 800w`
                     : undefined}
                   sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                   alt={property.title}
                   loading="lazy"
                   decoding="async"
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
                    
                    {/* Progress Bar Indicator - always visible on mobile */}
                    <div className="absolute bottom-2 left-2 right-2 flex gap-0.5 z-10 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
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
                
                {/* Always-visible Compare Checkbox - Top Left (before badges) */}
                {alwaysShowCompare && compareCategory && (
                  <div className="absolute top-3 left-3 z-20">
                    <CompareCheckbox propertyId={property.id} category={compareCategory} />
                  </div>
                )}
                
                <div className={cn("absolute top-3 flex gap-2", alwaysShowCompare && compareCategory ? "left-11" : "left-3")}>
                  {(() => {
                    const badges: React.ReactNode[] = [];

                    // Promoted badge for boosted listings
                    if ((property as any)._isBoosted) {
                      badges.push(<PromotedBadge key="promoted" compact />);
                    }
                    if (showCategoryBadge && !hideStatusBadge) {
                      badges.push(
                        <Badge key="category" className={cn("text-xs font-medium", getStatusColor(property.listing_status))}>
                          {getStatusLabel(property.listing_status)}
                        </Badge>
                      );
                    }
                    
                    // Freshness badge - more prominent for hot/fresh listings (especially rentals)
                    if (freshnessTier === 'hot') {
                      badges.push(
                        <Badge key="fresh" className="bg-semantic-teal text-semantic-teal-foreground text-xs font-medium">
                          <Flame className="h-3 w-3 mr-1" />
                          {isRental ? 'Just Available' : 'Just Listed'}
                        </Badge>
                      );
                    } else if (freshnessTier === 'fresh') {
                      badges.push(
                        <Badge key="new" className="bg-semantic-teal text-semantic-teal-foreground text-xs font-medium">
                          <Sparkles className="h-3 w-3 mr-1" />
                          New
                        </Badge>
                      );
                    }
                    
                    if (hasPriceDrop && priceDropPercent >= 1) {
                      badges.push(
                        <Badge key="price-drop" className="bg-semantic-green text-semantic-green-foreground text-xs font-medium">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Price Drop
                        </Badge>
                      );
                    }
                    
                    if (hasPriceIncrease) {
                      badges.push(
                      <Badge key="price-up" className="bg-semantic-amber text-semantic-amber-foreground text-xs font-medium">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Price Up
                        </Badge>
                      );
                    }
                    
                    return badges.slice(0, maxBadges);
                  })()}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {showShareButton && (
                    <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                      <ShareButton propertyId={property.id} propertyTitle={property.title} />
                    </div>
                  )}
                  {showCompareButton && !showShareButton && compareCategory && (
                    <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                      <CompareButton propertyId={property.id} category={compareCategory} />
                    </div>
                  )}
                  <FavoriteButton propertyId={property.id} propertyPrice={property.price} />
                </div>

              </div>

              <CardContent className="p-3 space-y-1.5">
                {/* Price */}
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-foreground text-lg">
                      {formatPrice(property.price, property.currency || 'ILS')}
                      {property.listing_status === 'for_rent' && (
                        <span className="text-xs font-normal text-muted-foreground">/mo</span>
                      )}
                    </span>
                    {hasPriceDrop && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(property.original_price!, property.currency || 'ILS')}
                      </span>
                    )}
                    {hasPriceIncrease && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(property.original_price!, property.currency || 'ILS')}
                      </span>
                    )}
                  </div>
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
                    <span className="text-xs">{property.bedrooms}{(property as any).additional_rooms ? ` + ${(property as any).additional_rooms}` : ''}</span>
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
                  {/* Days on Market - standalone for standard mode */}
                  {daysLabel && freshnessTier !== 'hot' && freshnessTier !== 'fresh' && (
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
    </>
  );
}));

export const PropertyCard = PropertyCardComponent;
