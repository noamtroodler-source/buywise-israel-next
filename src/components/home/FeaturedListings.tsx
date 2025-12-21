import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/property/PropertyCard';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { Skeleton } from '@/components/ui/skeleton';

export function FeaturedListings() {
  const { data: properties, isLoading } = useFeaturedProperties();

  return (
    <section className="py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10"
        >
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Featured Properties
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Handpicked properties that match quality, value, and location
            </p>
          </div>
          <Button variant="outline" asChild className="self-start md:self-auto">
            <Link to="/listings" className="gap-2">
              View All Properties
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No featured properties available at the moment.
            </p>
            <Button asChild className="mt-4">
              <Link to="/listings">Browse All Properties</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}