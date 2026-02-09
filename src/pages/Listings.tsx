import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { PropertyCard } from '@/components/property/PropertyCard';
import { usePaginatedProperties } from '@/hooks/usePaginatedProperties';
import { PropertyFilters as PropertyFiltersType, ListingStatus } from '@/types/database';
import { PropertyFilters } from '@/components/filters/PropertyFilters';
import { QuickFilterChips } from '@/components/filters/QuickFilterChips';
import { CreateAlertDialog } from '@/components/filters/CreateAlertDialog';
import { ViewToggle } from '@/components/filters/ViewToggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { History, Search, Bell, MapPin, RotateCcw, BookOpen, Home, Compass, Calculator, Lightbulb, Loader2 } from 'lucide-react';
import { ListingsGrid } from '@/components/listings/ListingsGrid';
import { BackToTopButton } from '@/components/shared/BackToTopButton';
import { SupportFooter } from '@/components/shared/SupportFooter';
import { PullToRefresh } from '@/components/shared/PullToRefresh';
import { MobileListingsSkeletonGrid } from '@/components/shared/MobilePropertySkeleton';
import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

import { useSearchTracking } from '@/hooks/useSearchTracking';
import { useEventTracking } from '@/hooks/useEventTracking';

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const showStickyFilters = !isDesktop; // sticky on mobile + tablet

  // Get listing status from URL, default to for_sale
  const urlStatus = searchParams.get('status') || 'for_sale';
  const isRentals = urlStatus === 'for_rent';
  const isSoldView = urlStatus === 'sold';
  
  // Determine the actual listing_status for the query
  const listingStatus: ListingStatus = isSoldView ? 'sold' : (urlStatus as ListingStatus);

  const [filters, setFilters] = useState<PropertyFiltersType>(() => {
    const initialFilters: PropertyFiltersType = {
      listing_status: listingStatus,
    };
    
    // Parse URL params into filters
    const city = searchParams.get('city');
    if (city) initialFilters.city = city;
    
    const type = searchParams.get('type');
    if (type) initialFilters.property_type = type as any;
    
    const minPrice = searchParams.get('min_price');
    if (minPrice) initialFilters.min_price = Number(minPrice);
    
    const maxPrice = searchParams.get('max_price');
    if (maxPrice) initialFilters.max_price = Number(maxPrice);
    
    const minRooms = searchParams.get('min_rooms');
    if (minRooms) initialFilters.min_rooms = Number(minRooms);
    
    const sortBy = searchParams.get('sort');
    if (sortBy) initialFilters.sort_by = sortBy as any;

    return initialFilters;
  });

  // Keep listing_status in sync with URL
  useEffect(() => {
    if (filters.listing_status !== listingStatus) {
      setFilters(prev => ({ ...prev, listing_status: listingStatus }));
    }
  }, [listingStatus, filters.listing_status]);

  // Use paginated properties hook
  const { 
    properties, 
    totalCount, 
    isLoading, 
    isFetching, 
    hasNextPage, 
    loadMore,
    reset 
  } = usePaginatedProperties(filters);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    reset();
    // Small delay to show the refresh animation
    await new Promise(resolve => setTimeout(resolve, 500));
  }, [reset]);

  // Search tracking
  const { trackSearchStart, trackSearch } = useSearchTracking();
  const { trackEvent } = useEventTracking();
  const hasTrackedInitialSearch = useRef(false);

  // Track search start on mount
  useEffect(() => {
    if (!hasTrackedInitialSearch.current) {
      trackSearchStart();
      hasTrackedInitialSearch.current = true;
    }
  }, [trackSearchStart]);

  // Track search results when data changes
  useEffect(() => {
    if (!isLoading && properties) {
      trackSearch({
        listingType: listingStatus === 'sold' ? 'for_sale' : listingStatus as 'for_sale' | 'for_rent',
        filters: filters,
        resultsCount: totalCount,
        resultsShown: properties.length,
        sortOption: filters.sort_by,
        pageNumber: 1,
      });
    }
  }, [isLoading, properties, filters, totalCount, listingStatus, trackSearch]);


  // Sticky filter bar detection
  useEffect(() => {
    if (isDesktop) return;
    
    const handleScroll = () => {
      if (filterBarRef.current) {
        const rect = filterBarRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= 64); // 64px is header height
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDesktop]);

  const handleFiltersChange = (newFilters: PropertyFiltersType) => {
    // Always keep the listing_status from URL
    const updatedFilters = { ...newFilters, listing_status: listingStatus };
    setFilters(updatedFilters);
    
    // Track filter application
    trackEvent('filter', 'filter_apply', 'search', {
      component: 'PropertyFilters',
      properties: updatedFilters,
    });
    
    
    // Update URL params - use replace: true to preserve scroll position
    const params = new URLSearchParams();
    params.set('status', urlStatus);
    if (updatedFilters.city) params.set('city', updatedFilters.city);
    if (updatedFilters.property_type) params.set('type', updatedFilters.property_type);
    if (updatedFilters.min_price) params.set('min_price', String(updatedFilters.min_price));
    if (updatedFilters.max_price) params.set('max_price', String(updatedFilters.max_price));
    if (updatedFilters.min_rooms) params.set('min_rooms', String(updatedFilters.min_rooms));
    if (updatedFilters.sort_by) params.set('sort', updatedFilters.sort_by);
    setSearchParams(params, { replace: true });
  };

  const handleSoldToggle = (showSold: boolean) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', showSold ? 'sold' : 'for_sale');
    setSearchParams(params, { replace: true });
  };

  const getPageContent = () => {
    if (isRentals) {
      return {
        title: <>Long-term Rentals in <span className="text-primary">Israel</span></>,
        subtitle: 'Long-term rentals in Israel — easier to understand, easier to plan.',
      };
    }
    if (isSoldView) {
      return {
        title: <>Recently <span className="text-primary">Sold</span> Properties</>,
        subtitle: 'Research past sales to understand market prices and what\'s realistic in your target areas.',
      };
    }
    return {
      title: <>Properties for Sale in <span className="text-primary">Israel</span></>,
      subtitle: 'Explore resale homes across Israel — from modern apartments to family-friendly houses.',
    };
  };

  const pageContent = getPageContent();

  // SEO metadata based on listing type
  const getSeoData = () => {
    if (isRentals) {
      return {
        title: 'Long-term Rentals in Israel | BuyWise Israel',
        description: 'Find long-term rental apartments and houses in Israel. Browse rentals in Tel Aviv, Jerusalem, Herzliya, and more with transparent pricing.',
      };
    }
    if (isSoldView) {
      return {
        title: 'Recently Sold Properties in Israel | BuyWise Israel',
        description: 'Research recently sold properties in Israel to understand market prices and realistic valuations in your target areas.',
      };
    }
    return {
      title: 'Properties for Sale in Israel | BuyWise Israel',
      description: 'Search apartments, houses, and penthouses for sale in Israel. Find properties in Tel Aviv, Jerusalem, Herzliya, and more with honest pricing.',
    };
  };

  const seoData = getSeoData();

  return (
    <Layout>
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        canonicalUrl="https://buywiseisrael.com/listings"
      />
      
      {/* Page Header */}
      <div className="bg-gradient-to-b from-muted/60 to-background border-b border-border/50">
        <div className="container py-4 md:py-10">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">{pageContent.title}</h1>
          <p className="text-muted-foreground hidden md:block">{pageContent.subtitle}</p>
        </div>
      </div>

      <div className="container py-6">

        {/* Sold View Info Banner */}
        {isSoldView && (
          <Alert className="mb-6 border-muted bg-muted/30">
            <History className="h-4 w-4" />
            <AlertDescription>
              Viewing recently sold properties. Prices shown are final sale prices — use this to research realistic market values.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters - Sticky on mobile */}
        <div 
          ref={filterBarRef}
          className={cn(
            "mb-6 md:mb-8 transition-all duration-200",
            isMobile && "sticky top-16 z-40 -mx-4 px-4 py-3 bg-background",
            isMobile && isSticky && "shadow-md backdrop-blur-sm bg-background/95 border-b border-border/50",
            !isMobile && showStickyFilters && "sticky top-16 z-40 py-3 bg-background",
            !isMobile && showStickyFilters && isSticky && "shadow-md backdrop-blur-sm bg-background/95 border-b border-border/50"
          )}
        >
          <PropertyFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            listingType={isRentals ? 'for_rent' : 'for_sale'}
            onCreateAlert={() => setShowAlertDialog(true)}
            showSoldToggle={!isRentals}
            isSoldView={isSoldView}
            onSoldToggle={handleSoldToggle}
            previewCount={totalCount}
            isCountLoading={isFetching}
          />
          
           {/* Quick Filter Chips - Mobile only, hidden when sticky */}
          {!isSticky && (
            <QuickFilterChips
              filters={filters}
              onFiltersChange={handleFiltersChange}
              listingType={isRentals ? 'for_rent' : 'for_sale'}
            />
          )}
        </div>

        {/* Results Count Row - with View Toggle on desktop */}
        <div className="flex items-center justify-between mb-4">
          {!isLoading ? (
            <p className="text-sm text-muted-foreground">
              Showing {properties.length} of {totalCount} {totalCount === 1 ? 'property' : 'properties'}
            </p>
          ) : (
            <div className="h-5 w-40 bg-muted/50 rounded animate-pulse" />
          )}
          {isDesktop && (
            <ViewToggle activeView="grid" size="sm" />
          )}
        </div>

        {/* Property Grid with loading overlay - wrapped in PullToRefresh on mobile */}
        {isLoading ? (
          <MobileListingsSkeletonGrid count={isMobile ? 4 : 6} />
        ) : properties && properties.length > 0 ? (
          <>
            <PullToRefresh onRefresh={handleRefresh} disabled={!isMobile}>
              <ListingsGrid isFetching={isFetching && !isLoading}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in">
                  {properties.map((property) => <PropertyCard key={property.id} property={property} />)}
                </div>
              </ListingsGrid>
            </PullToRefresh>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={loadMore} 
                  disabled={isFetching}
                  variant="outline"
                  size="lg"
                  className="w-full md:w-auto"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>Load More Properties</>
                  )}
                </Button>
              </div>
            )}

          </>
        ) : (
          <EnhancedEmptyState
            icon={Search}
            title="No properties found"
            description="We couldn't find any properties matching your current filters. Try adjusting your search criteria."
            primaryAction={{
              label: 'Reset Filters',
              onClick: () => handleFiltersChange({ listing_status: listingStatus }),
              icon: RotateCcw,
            }}
            secondaryAction={{
              label: 'Create Alert',
              onClick: () => setShowAlertDialog(true),
              icon: Bell,
            }}
            suggestions={[
              ...(filters.city ? [{
                icon: MapPin,
                text: 'Try expanding your search to nearby cities or remove the location filter',
              }] : []),
              ...((filters.min_price || filters.max_price) ? [{
                icon: undefined,
                text: 'Consider widening your price range — Israeli property prices vary significantly by city',
              }] : []),
              ...(filters.min_rooms ? [{
                icon: Home,
                text: 'Try lowering your bedroom requirement to see more options',
              }] : []),
              ...(!filters.city && !filters.min_price && !filters.max_price && !filters.min_rooms ? [{
                icon: Lightbulb,
                text: 'New listings are added regularly — create an alert to get notified',
              }] : []),
            ]}
          >
            {/* Explore More Links */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Not sure where to look?
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/areas" className="text-primary">
                    <Compass className="h-4 w-4 mr-2" />
                    Explore Areas
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/guides" className="text-primary">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Read Guides
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/tools" className="text-primary">
                    <Calculator className="h-4 w-4 mr-2" />
                    Use Tools
                  </Link>
                </Button>
              </div>
            </div>

            {/* Support Footer */}
            <SupportFooter 
              message="Can't find what you're looking for? [Tell us] what you need — we might know of something coming soon."
              linkText="Tell us"
              variant="subtle"
              className="mt-6"
            />
          </EnhancedEmptyState>
        )}
      </div>

      {/* Back to Top Button */}
      <BackToTopButton />

      {/* Create Alert Dialog */}
      <CreateAlertDialog
        open={showAlertDialog}
        onOpenChange={setShowAlertDialog}
        filters={filters}
        listingType={isRentals ? 'for_rent' : 'for_sale'}
      />
    </Layout>
  );
}
