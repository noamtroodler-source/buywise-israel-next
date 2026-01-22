import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedSaleProperties, useFeaturedRentalProperties } from '@/hooks/useProperties';

type Tab = 'sale' | 'rent';

export function FeaturedShowcase() {
  const [activeTab, setActiveTab] = useState<Tab>('sale');
  
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

  // Take 8 properties for the grid
  const displayProperties = properties?.slice(0, 8) || [];

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

          {/* Tabs */}
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg bg-background p-1 border border-border">
              <button
                onClick={() => setActiveTab('sale')}
                className={`px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'sale'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                For Sale
              </button>
              <button
                onClick={() => setActiveTab('rent')}
                className={`px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-[16/10] rounded-lg" />
            ))}
          </div>
        )}

        {/* Property Grid - 4-column layout */}
        {!isLoading && displayProperties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
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

        {/* Empty State */}
        {!isLoading && displayProperties.length === 0 && (
          <div className="text-center py-10 bg-background rounded-lg border border-border">
            <p className="text-muted-foreground mb-3">No properties available at the moment.</p>
            <Button size="sm" asChild>
              <Link to="/listings">Browse All Listings</Link>
            </Button>
          </div>
        )}

        {/* Mobile View All */}
        <div className="mt-8 sm:hidden">
          <Button variant="default" asChild className="w-full gap-2">
            <Link to={viewAllLink}>
              View All Properties
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
