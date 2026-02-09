import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { CarouselDots } from '@/components/shared/CarouselDots';
import { useFeaturedSaleProperties, useFeaturedRentalProperties } from '@/hooks/useProperties';
import { useMediaQuery } from '@/hooks/useMediaQuery';

type Tab = 'sale' | 'rent';

export function FeaturedShowcase() {
  const [activeTab, setActiveTab] = useState<Tab>('sale');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    skipSnaps: false,
    containScroll: 'trimSnaps',
  });

  // Only fetch data for the active tab (conditional fetching for performance)
  const { data: saleProperties, isLoading: loadingSale } = useFeaturedSaleProperties({ 
    enabled: activeTab === 'sale' 
  });
  const { data: rentalProperties, isLoading: loadingRent } = useFeaturedRentalProperties({ 
    enabled: activeTab === 'rent' 
  });

  const properties = activeTab === 'sale' ? saleProperties : rentalProperties;
  const isLoading = activeTab === 'sale' ? loadingSale : loadingRent;
  const viewAllLink = activeTab === 'sale' ? '/listings?status=for_sale' : '/listings?status=for_rent';

  // Show 8 cards on both mobile and desktop
  const maxCards = 8;
  const displayProperties = properties?.slice(0, maxCards) || [];
  const totalCount = properties?.length || 0;

  // Handle carousel index changes
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Reset carousel when tab changes
  useEffect(() => {
    if (emblaApi) {
      emblaApi.scrollTo(0);
      setSelectedIndex(0);
    }
  }, [activeTab, emblaApi]);

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  return (
    <section className="py-8 md:py-10 bg-muted/30">
      <div className="container">
        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="animate-fade-in">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              Properties
            </h2>
            <p className="text-base text-muted-foreground mt-1">
              Hand-picked listings updated weekly
            </p>
          </div>

          {/* Tabs - Enhanced touch targets for mobile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="inline-flex rounded-lg bg-background p-1 border border-border">
              <button
                onClick={() => setActiveTab('sale')}
                className={`min-h-[44px] px-4 sm:px-5 py-2.5 text-sm font-medium rounded-md transition-colors active:scale-[0.98] ${
                  activeTab === 'sale'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                For Sale
              </button>
              <button
                onClick={() => setActiveTab('rent')}
                className={`min-h-[44px] px-4 sm:px-5 py-2.5 text-sm font-medium rounded-md transition-colors active:scale-[0.98] ${
                  activeTab === 'rent'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                For Rent
              </button>
            </div>
            <Button variant="default" asChild className="hidden sm:flex gap-2">
              <Link to={viewAllLink}>
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <>
            {/* Mobile/Tablet: Single skeleton */}
            <div className="lg:hidden">
              <Skeleton className="aspect-[4/3] rounded-lg" />
            </div>
            {/* Desktop: Grid of skeletons */}
            <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-[16/10] rounded-lg" />
              ))}
            </div>
          </>
        )}

        {/* Mobile/Tablet: Horizontal Carousel - Edge-to-edge */}
        {!isLoading && !isDesktop && displayProperties.length > 0 && (
          <div className="lg:hidden animate-fade-in -mx-4">
            <div className="overflow-hidden px-4" ref={emblaRef}>
              <div className="flex">
                {displayProperties.map((property, index) => (
                  <div 
                    key={property.id} 
                    className="flex-[0_0_85%] sm:flex-[0_0_48%] min-w-0 pl-4 first:pl-4"
                  >
                    <PropertyCard 
                      property={property} 
                      showShareButton 
                      showCompareButton={false} 
                      maxBadges={1}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Dot Indicators */}
            <div className="px-4">
              <CarouselDots 
                total={displayProperties.length} 
                current={selectedIndex} 
                onDotClick={scrollTo}
                className="mt-4"
              />
            </div>
          </div>
        )}

        {/* Desktop: Property Grid */}
        {!isLoading && isDesktop && displayProperties.length > 0 && (
          <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
            {displayProperties.map((property) => (
              <PropertyCard 
                key={property.id} 
                property={property} 
                showShareButton 
                showCompareButton={false} 
                maxBadges={1}
              />
            ))}
          </div>
        )}
        
        {/* Mobile/Tablet "See All" CTA */}
        {!isLoading && !isDesktop && totalCount > 0 && (
          <div className="mt-4 lg:hidden">
            <Button variant="default" asChild className="w-full gap-2">
              <Link to={viewAllLink}>
                See All {totalCount} Properties
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayProperties.length === 0 && (
          <div className="text-center py-10 bg-background rounded-lg border border-border">
            <p className="text-muted-foreground mb-3">No properties available at the moment.</p>
            <Button size="sm" asChild>
              <Link to="/listings">Browse All Listings</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
