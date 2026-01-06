import { Link } from 'react-router-dom';
import { ArrowRight, Home, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/property/PropertyCard';
import { useCityFeaturedProperties } from '@/hooks/useProperties';

interface CityFeaturedPropertiesProps {
  cityName: string;
  citySlug: string;
}

export function CityFeaturedProperties({ cityName, citySlug }: CityFeaturedPropertiesProps) {
  const { data: properties, isLoading } = useCityFeaturedProperties(cityName, 8);

  // Don't render if no properties available
  if (!isLoading && (!properties || properties.length === 0)) {
    return null;
  }

  return (
    <div className="bg-muted/40 py-16 md:py-20">
      <div className="container space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Home className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">
              Featured Properties in {cityName}
            </h2>
          </div>
          <p className="text-muted-foreground">
            Explore available homes with full market context
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Property Grid */}
        {!isLoading && properties && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                showCompareButton={true}
                showMonthlyEstimate={true}
              />
            ))}
          </div>
        )}

        {/* View All CTA */}
        {!isLoading && properties && properties.length > 0 && (
          <div className="flex justify-center pt-4">
            <Button asChild size="lg" className="group">
              <Link to={`/listings?city=${encodeURIComponent(cityName)}`}>
                View All {cityName} Properties
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
