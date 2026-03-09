import { useState, useCallback, useEffect } from 'react';
import { MapPin, Home, TrendingUp, Calendar, BarChart3, Building2, ShieldCheck, ChevronDown, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { useNearbySoldComps } from '@/hooks/useNearbySoldComps';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CarouselDots } from '@/components/shared/CarouselDots';
import { format } from 'date-fns';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';

// Types for sold comps
interface SoldComp {
  id: string;
  sold_price: number;
  sold_date: string;
  rooms: number | null;
  size_sqm: number | null;
  property_type: string | null;
  price_per_sqm: number | null;
  distance_meters: number;
  is_same_building: boolean;
}

// Desktop comps list with "Show more" functionality
function DesktopCompsList({
  comps,
  getComparison,
  formatPrice,
  formatDistance,
  formatSoldDate,
}: {
  comps: SoldComp[];
  getComparison: (priceSqm: number | null) => number | null;
  formatPrice: (price: number, currency: string) => string;
  formatDistance: (meters: number) => string;
  formatSoldDate: (date: string) => string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleComps = comps.slice(0, 3);
  const hiddenComps = comps.slice(3);
  const hasMore = hiddenComps.length > 0;

  const renderComp = (comp: SoldComp) => {
    const comparison = getComparison(comp.price_per_sqm);
    
    return (
      <div
        key={comp.id}
        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
      >
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Home className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">
              {comp.rooms ? `${comp.rooms}BR` : 'Apartment'}
              {comp.size_sqm ? `, ${comp.size_sqm}m²` : ''}
            </span>
            <span className="text-sm text-muted-foreground">
              sold for
            </span>
            <span className="font-bold text-primary">
              {formatPrice(comp.sold_price, 'ILS')}
            </span>
          </div>
          
          <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
            {/* Distance with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 cursor-help">
                  <MapPin className="h-3 w-3" />
                  {comp.is_same_building ? (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      Same building
                    </Badge>
                  ) : (
                    <span className="border-b border-dotted border-muted-foreground/50">
                      {formatDistance(comp.distance_meters)}
                    </span>
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-medium mb-1">{comp.is_same_building ? 'Same Building' : 'Nearby Sale'}</p>
                <p className="text-xs text-muted-foreground">
                  {comp.is_same_building 
                    ? 'This sale occurred in the same building. Most relevant for direct price comparison.'
                    : `This property sold ${Math.round(comp.distance_meters)} meters from this listing. Similar location factors should apply.`
                  }
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Date */}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatSoldDate(comp.sold_date)}
            </span>

            {/* Price per sqm with tooltip */}
            {comp.price_per_sqm && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-help border-b border-dotted border-muted-foreground/50">
                    <BarChart3 className="h-3 w-3" />
                    {formatPrice(comp.price_per_sqm, 'ILS')}/m²
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-medium mb-1">Price per Square Meter</p>
                  <p className="text-xs text-muted-foreground">
                    The actual sold price divided by property size. Use this to compare value across different-sized properties.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Comparison badge with tooltip */}
          {comparison !== null && (
            <div className="mt-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "text-xs cursor-help",
                      Math.abs(comparison) <= 2
                        ? "bg-muted text-muted-foreground hover:bg-muted/90"
                        : comparison > 0 
                          ? "bg-semantic-red text-semantic-red-foreground hover:bg-semantic-red/90"
                          : "bg-semantic-green text-semantic-green-foreground hover:bg-semantic-green/90"
                    )}
                  >
                    {Math.abs(comparison) <= 2
                      ? "Similar price per m²"
                      : comparison > 0 
                        ? `Listing is ${comparison.toFixed(0)}% above this sale`
                        : `Listing is ${Math.abs(comparison).toFixed(0)}% below this sale`
                    }
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-medium mb-1">Price per m² Comparison</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.abs(comparison) <= 2
                      ? "This listing's price per sqm is within 2% of this sale—a closely matched comparable."
                      : comparison > 0 
                        ? "This listing's price per sqm is higher than what this nearby property sold for. Could indicate premium features or room for negotiation."
                        : "This listing's price per sqm is below recent comparable sales—potentially good value or motivated seller."
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Always show first 3 */}
      {visibleComps.map(renderComp)}
      
      {/* Collapsible section for remaining items */}
      {hasMore && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-3">
            {hiddenComps.map(renderComp)}
          </CollapsibleContent>
          
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={cn(
                "h-4 w-4 mr-1 transition-transform duration-200",
                isExpanded && "rotate-180"
              )} />
              {isExpanded ? 'Show less' : `Show ${hiddenComps.length} more`}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      )}
    </div>
  );
}

interface RecentNearbySalesProps {
  latitude: number | null;
  longitude: number | null;
  city: string;
  propertyRooms?: number;
  propertyPrice?: number;
  propertySizeSqm?: number;
  /** When true, skip the section header (used when embedded in MarketIntelligence) */
  hideHeader?: boolean;
  /** When true, skip the verdict badge (parent renders it) */
  hideVerdict?: boolean;
  /** Callback to expose the computed average comparison to parent */
  onVerdictComputed?: (avgComparison: number | null, compsCount: number) => void;
}

export function RecentNearbySales({
  latitude,
  longitude,
  city,
  propertyRooms,
  propertyPrice,
  propertySizeSqm,
  hideHeader = false,
  hideVerdict = false,
  onVerdictComputed,
}: RecentNearbySalesProps) {
  const formatPrice = useFormatPrice();
  const isMobile = useIsMobile();
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Embla carousel setup for mobile
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    skipSnaps: false,
    containScroll: 'trimSnaps',
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (!emblaApi) return;
    emblaApi.scrollTo(index);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const { data: comps, isLoading, error } = useNearbySoldComps(
    latitude,
    longitude,
    city,
    {
      radiusKm: 0.5,
      monthsBack: 24,
      limit: 5,
      // Optionally filter by similar room count
      minRooms: propertyRooms ? propertyRooms - 1 : undefined,
      maxRooms: propertyRooms ? propertyRooms + 1 : undefined,
      propertyPrice,
      propertySizeSqm,
      propertyRooms,
    }
  );

  // Generate city slug for links
  const citySlug = city?.toLowerCase().replace(/['']/g, '').replace(/\s+/g, '-') || '';

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters < 50) return 'Same building';
    if (meters < 1000) return `${Math.round(meters)}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  // Format date
  const formatSoldDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  // Calculate comparison to listing
  const getComparison = (compPriceSqm: number | null) => {
    if (!compPriceSqm || !propertyPrice || !propertySizeSqm) return null;
    const listingPriceSqm = propertyPrice / propertySizeSqm;
    const diff = ((listingPriceSqm - compPriceSqm) / compPriceSqm) * 100;
    return diff;
  };

  // Calculate average comparison across all comps for the verdict
  const calculateAverageComparison = (): number | null => {
    if (!propertyPrice || !propertySizeSqm || !comps || comps.length === 0) return null;
    
    const listingPriceSqm = propertyPrice / propertySizeSqm;
    const comparisons = comps
      .filter(c => c.price_per_sqm)
      .map(c => ((listingPriceSqm - c.price_per_sqm!) / c.price_per_sqm!) * 100);
    
    if (comparisons.length === 0) return null;
    return comparisons.reduce((a, b) => a + b, 0) / comparisons.length;
  };

  const avgComparison = calculateAverageComparison();

  // Expose verdict data to parent (must be before early returns)
  useEffect(() => {
    if (onVerdictComputed) {
      onVerdictComputed(avgComparison, comps?.length ?? 0);
    }
  }, [avgComparison, comps?.length, onVerdictComputed]);

  // Don't render if we don't have coordinates
  if (!latitude || !longitude) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {!hideHeader && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Recent Nearby Sales</h3>
          </div>
        )}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !comps || comps.length === 0) {
    return (
      <TooltipProvider>
        <div className="space-y-4">
          {!hideHeader && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="text-lg font-semibold text-foreground cursor-help border-b border-dotted border-muted-foreground/30">
                    Recent Nearby Sales
                  </h3>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <p className="font-medium mb-1">Government Transaction Data</p>
                  <p className="text-xs text-muted-foreground">
                    Official sold prices from Israel Tax Authority & Nadlan.gov.il. 
                    These are actual recorded transactions—not listing prices.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              No nearby sales data yet
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Government transaction data is added continuously. Check back later or explore the city's market overview.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/areas/${citySlug}`}>
                View {city} Market Data
              </Link>
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header with educational tooltips */}
        {!hideHeader && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="text-lg font-semibold text-foreground cursor-help border-b border-dotted border-muted-foreground/30">
                    Recent Nearby Sales
                  </h3>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <p className="font-medium mb-1">Government Transaction Data</p>
                  <p className="text-xs text-muted-foreground">
                    Official sold prices from Israel Tax Authority & Nadlan.gov.il. 
                    These are actual recorded transactions—not listing prices.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/30">
                  Last 24 months • Within 500m
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs">
                  Shows properties sold within 500 meters of this listing in the past 24 months. Closer matches appear first.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Compact Market Verdict - inline badge */}
        {!hideVerdict && avgComparison !== null && (
          <div className="flex items-center gap-2">
            {avgComparison >= -5 && avgComparison <= 10 ? (
              <Badge className="bg-semantic-green text-semantic-green-foreground border-semantic-green">
                Priced in line with recent sales
              </Badge>
            ) : avgComparison > 10 && avgComparison <= 20 ? (
              <Badge className="bg-semantic-amber text-semantic-amber-foreground border-semantic-amber">
                Above average for this area (+{avgComparison.toFixed(0)}%)
              </Badge>
            ) : avgComparison > 20 ? (
              <Badge className="bg-semantic-red text-semantic-red-foreground border-semantic-red">
                Significantly above market (+{avgComparison.toFixed(0)}%)
              </Badge>
            ) : avgComparison < -5 ? (
              <Badge className="bg-semantic-green text-semantic-green-foreground border-semantic-green">
                Below average — potential value ({avgComparison.toFixed(0)}%)
              </Badge>
            ) : null}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">
                  Based on {comps.length} nearby sale{comps.length > 1 ? 's' : ''} comparing price/m².
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Comp cards - Mobile Carousel */}
        {isMobile ? (
          <div className="space-y-3">
            <div className="overflow-hidden -mx-4" ref={emblaRef}>
              <div className="flex px-4">
                {comps.map((comp) => {
                  const comparison = getComparison(comp.price_per_sqm);
                  
                  return (
                    <div 
                      key={comp.id} 
                      className="flex-[0_0_calc(100%-2rem)] min-w-0 pl-4 first:pl-0"
                    >
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Home className="h-5 w-5 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">
                              {comp.rooms ? `${comp.rooms}BR` : 'Apartment'}
                              {comp.size_sqm ? `, ${comp.size_sqm}m²` : ''}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              sold for
                            </span>
                            <span className="font-bold text-primary">
                              {formatPrice(comp.sold_price, 'ILS')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {comp.is_same_building ? (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                  Same building
                                </Badge>
                              ) : (
                                <span>{formatDistance(comp.distance_meters)}</span>
                              )}
                            </span>

                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatSoldDate(comp.sold_date)}
                            </span>

                            {comp.price_per_sqm && (
                              <span className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                {formatPrice(comp.price_per_sqm, 'ILS')}/m²
                              </span>
                            )}
                          </div>

                          {comparison !== null && (
                            <div className="mt-2">
                              <Badge 
                                variant="secondary"
                                className={cn(
                                  "text-xs",
                                  Math.abs(comparison) <= 2
                                    ? "bg-muted text-muted-foreground"
                                    : comparison > 0 
                                      ? "bg-semantic-red text-semantic-red-foreground"
                                      : "bg-semantic-green text-semantic-green-foreground"
                                )}
                              >
                                {Math.abs(comparison) <= 2
                                  ? "Similar price per m²"
                                  : comparison > 0 
                                    ? `Listing is ${comparison.toFixed(0)}% above this sale`
                                    : `Listing is ${Math.abs(comparison).toFixed(0)}% below this sale`
                                }
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Carousel dots */}
            <CarouselDots 
              total={comps.length} 
              current={selectedIndex} 
              onDotClick={scrollTo}
            />
          </div>
        ) : (
          /* Desktop - vertical stacked cards, show 3 by default */
          <DesktopCompsList 
            comps={comps} 
            getComparison={getComparison} 
            formatPrice={formatPrice}
            formatDistance={formatDistance}
            formatSoldDate={formatSoldDate}
          />
        )}

        {/* Source attribution footer */}
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-border/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="border-b border-dotted border-muted-foreground/30">
                  Government verified data
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="font-medium mb-1">Official Transaction Records</p>
              <p className="text-xs text-muted-foreground">
                Sourced from Israel Tax Authority and Nadlan.gov.il. 
                These are legally recorded sale prices—more reliable than listing or asking prices.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
