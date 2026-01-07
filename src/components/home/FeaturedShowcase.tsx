import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedSaleProperties, useFeaturedRentalProperties } from '@/hooks/useProperties';

type Tab = 'sale' | 'rent';

export function FeaturedShowcase() {
  const [activeTab, setActiveTab] = useState<Tab>('sale');
  
  const { data: saleProperties, isLoading: loadingSale } = useFeaturedSaleProperties();
  const { data: rentalProperties, isLoading: loadingRent } = useFeaturedRentalProperties();

  const properties = activeTab === 'sale' ? saleProperties : rentalProperties;
  const isLoading = activeTab === 'sale' ? loadingSale : loadingRent;
  const viewAllLink = activeTab === 'sale' ? '/listings?status=for_sale' : '/listings?status=for_rent';

  // Take first 5 properties for the showcase
  const displayProperties = properties?.slice(0, 5) || [];
  const featuredProperty = displayProperties[0];
  const gridProperties = displayProperties.slice(1, 5);

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Properties Worth Exploring
            </h2>
          </motion.div>

          {/* Tabs */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg bg-background p-1 border border-border">
              <button
                onClick={() => setActiveTab('sale')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'sale'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                For Sale
              </button>
              <button
                onClick={() => setActiveTab('rent')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'rent'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                For Rent
              </button>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex">
              <Link to={viewAllLink} className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="aspect-[4/3] rounded-xl" />
            <div className="grid sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Property Grid */}
        {!isLoading && displayProperties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-6"
          >
            {/* Featured Large Card */}
            {featuredProperty && (
              <div className="lg:row-span-2">
                <PropertyCard property={featuredProperty} className="h-full" />
              </div>
            )}

            {/* Grid of smaller cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {gridProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && displayProperties.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No properties available at the moment.</p>
            <Button asChild>
              <Link to="/listings">Browse All Listings</Link>
            </Button>
          </div>
        )}

        {/* Mobile View All */}
        <div className="mt-8 sm:hidden">
          <Button variant="outline" asChild className="w-full">
            <Link to={viewAllLink} className="gap-2">
              View All Properties
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
