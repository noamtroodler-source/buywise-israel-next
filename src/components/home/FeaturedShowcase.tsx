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

  // Take 6 properties: 2 spotlight + 4 standard
  const displayProperties = properties?.slice(0, 6) || [];
  const spotlightProperties = displayProperties.slice(0, 2);
  const standardProperties = displayProperties.slice(2, 6);

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
              Featured Properties
            </h2>
            <p className="text-muted-foreground mt-2">
              Hand-picked listings updated daily
            </p>
          </motion.div>

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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="aspect-[4/3] rounded-2xl" />
              <Skeleton className="aspect-[4/3] rounded-2xl" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Property Display */}
        {!isLoading && displayProperties.length > 0 && (
          <div className="space-y-6">
            {/* Spotlight Row - 2 Larger Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {spotlightProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </div>

            {/* Standard Row - 4 Compact Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {standardProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <PropertyCard property={property} compact />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayProperties.length === 0 && (
          <div className="text-center py-16 bg-background rounded-2xl border border-border">
            <p className="text-muted-foreground mb-4">No properties available at the moment.</p>
            <Button asChild>
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
