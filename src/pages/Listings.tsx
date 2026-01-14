import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { PropertyCard } from '@/components/property/PropertyCard';
import { useProperties } from '@/hooks/useProperties';
import { Skeleton } from '@/components/ui/skeleton';
import { PropertyFilters as PropertyFiltersType, ListingStatus } from '@/types/database';
import { PropertyFilters } from '@/components/filters/PropertyFilters';
import { CreateAlertDialog } from '@/components/filters/CreateAlertDialog';
import { CompareBar } from '@/components/property/CompareBar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { History, Search, Bell, MapPin, RotateCcw, BookOpen, Home, Compass, Calculator, Lightbulb } from 'lucide-react';
import { ListingsGrid } from '@/components/listings/ListingsGrid';

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAlertDialog, setShowAlertDialog] = useState(false);

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
  }, [listingStatus]);

  // Extract isFetching for loading overlay during filter changes
  const { data: properties, isLoading, isFetching } = useProperties(filters);

  const handleFiltersChange = (newFilters: PropertyFiltersType) => {
    // Always keep the listing_status from URL
    const updatedFilters = { ...newFilters, listing_status: listingStatus };
    setFilters(updatedFilters);
    
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

  return (
    <Layout>
      {/* Page Header */}
      <div className="bg-gradient-to-b from-muted/60 to-background border-b border-border/50">
        <div className="container py-8 md:py-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{pageContent.title}</h1>
          <p className="text-muted-foreground">{pageContent.subtitle}</p>
          <Link 
            to="/guides/understanding-listings" 
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-3"
          >
            <BookOpen className="h-4 w-4" />
            New to Israeli listings? Learn what to look for
          </Link>
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

        {/* Filters */}
        <div className="mb-8">
          <PropertyFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            listingType={isRentals ? 'for_rent' : 'for_sale'}
            onCreateAlert={() => setShowAlertDialog(true)}
            showSoldToggle={!isRentals}
            isSoldView={isSoldView}
            onSoldToggle={handleSoldToggle}
          />
        </div>

        {/* Results Count */}
        {!isLoading && properties && (
          <p className="text-sm text-muted-foreground mb-4">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
          </p>
        )}

        {/* Property Grid with loading overlay */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-xl" />)}
          </div>
        ) : properties && properties.length > 0 ? (
          <ListingsGrid isFetching={isFetching && !isLoading}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => <PropertyCard key={property.id} property={property} />)}
            </div>
          </ListingsGrid>
        ) : (
          <div className="text-center py-16 max-w-lg mx-auto">
            {/* Icon */}
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-muted rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-foreground mb-2">
              No properties found
            </h2>
            <p className="text-muted-foreground mb-6">
              We couldn't find any properties matching your current filters. Here are some suggestions:
            </p>

            {/* Suggestions */}
            <div className="bg-muted/50 rounded-xl p-5 text-left space-y-3 mb-6">
              <ul className="text-sm text-muted-foreground space-y-2">
                {filters.city && (
                  <li className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    Try expanding your search to nearby cities or remove the location filter
                  </li>
                )}
                {(filters.min_price || filters.max_price) && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary flex-shrink-0">₪</span>
                    Consider widening your price range — Israeli property prices vary significantly by city
                  </li>
                )}
                {filters.min_rooms && (
                  <li className="flex items-start gap-2">
                    <Home className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    In Israel, "rooms" include living areas — a 3-room apartment typically has 2 bedrooms
                  </li>
                )}
                {!filters.city && !filters.min_price && !filters.max_price && !filters.min_rooms && (
                  <li className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    New listings are added regularly — create an alert to get notified
                  </li>
                )}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={() => handleFiltersChange({ listing_status: listingStatus })}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
              <Button onClick={() => setShowAlertDialog(true)}>
                <Bell className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </div>

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
          </div>
        )}
      </div>

      {/* Create Alert Dialog */}
      <CreateAlertDialog
        open={showAlertDialog}
        onOpenChange={setShowAlertDialog}
        filters={filters}
        listingType={isRentals ? 'for_rent' : 'for_sale'}
      />

      {/* Compare Bar */}
      <CompareBar />
    </Layout>
  );
}
