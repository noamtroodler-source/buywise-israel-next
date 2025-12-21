import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { PropertyCard } from '@/components/property/PropertyCard';
import { useProperties } from '@/hooks/useProperties';
import { Skeleton } from '@/components/ui/skeleton';
import { PropertyFilters as PropertyFiltersType, ListingStatus } from '@/types/database';
import { PropertyFilters } from '@/components/filters/PropertyFilters';
import { CreateAlertDialog } from '@/components/filters/CreateAlertDialog';

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAlertDialog, setShowAlertDialog] = useState(false);

  // Get listing status from URL, default to for_sale
  const listingStatus = (searchParams.get('status') as ListingStatus) || 'for_sale';
  const isRentals = listingStatus === 'for_rent';

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

  const { data: properties, isLoading } = useProperties(filters);

  const handleFiltersChange = (newFilters: PropertyFiltersType) => {
    // Always keep the listing_status from URL
    const updatedFilters = { ...newFilters, listing_status: listingStatus };
    setFilters(updatedFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    params.set('status', listingStatus);
    if (updatedFilters.city) params.set('city', updatedFilters.city);
    if (updatedFilters.property_type) params.set('type', updatedFilters.property_type);
    if (updatedFilters.min_price) params.set('min_price', String(updatedFilters.min_price));
    if (updatedFilters.max_price) params.set('max_price', String(updatedFilters.max_price));
    if (updatedFilters.min_rooms) params.set('min_rooms', String(updatedFilters.min_rooms));
    if (updatedFilters.sort_by) params.set('sort', updatedFilters.sort_by);
    setSearchParams(params);
  };

  const pageTitle = isRentals ? 'Long-term Rentals in Israel' : 'Properties for Sale in Israel';
  const pageDescription = isRentals 
    ? 'Find long-term rental apartments and homes across Israel. Search by city, price, rooms, and more.'
    : 'Browse resell properties for sale in Israel. Find apartments, houses, penthouses and more.';

  return (
    <Layout>

      <div className="container py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {isRentals ? 'Long-term Rentals' : 'Properties for Sale'}
          </h1>
          <p className="text-muted-foreground">
            {isRentals 
              ? 'Find your perfect rental home in Israel with our comprehensive listings.'
              : 'Discover resell properties across Israel - from modern apartments to family homes.'
            }
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <PropertyFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            listingType={isRentals ? 'for_rent' : 'for_sale'}
            onCreateAlert={() => setShowAlertDialog(true)}
          />
        </div>

        {/* Results Count */}
        {!isLoading && properties && (
          <p className="text-sm text-muted-foreground mb-4">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
          </p>
        )}

        {/* Property Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-xl" />)}
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => <PropertyCard key={property.id} property={property} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">No properties found matching your criteria.</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or create an alert to be notified when new properties match.
            </p>
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
    </Layout>
  );
}
