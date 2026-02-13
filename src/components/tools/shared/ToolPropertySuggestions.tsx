import { Link } from 'react-router-dom';
import { ArrowRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useToolPropertySuggestions } from '@/hooks/useToolPropertySuggestions';

interface ToolPropertySuggestionsProps {
  title: string;
  subtitle?: string;
  minPrice: number;
  maxPrice: number;
  listingStatus?: 'for_sale' | 'for_rent';
  enabled?: boolean;
}

export function ToolPropertySuggestions({
  title,
  subtitle,
  minPrice,
  maxPrice,
  listingStatus = 'for_sale',
  enabled = true,
}: ToolPropertySuggestionsProps) {
  const { data: properties, isLoading } = useToolPropertySuggestions({
    minPrice,
    maxPrice,
    listingStatus,
    enabled,
  });

  if (!enabled) return null;
  if (!isLoading && (!properties || properties.length === 0)) return null;

  const searchParams = new URLSearchParams();
  searchParams.set('min_price', String(Math.round(minPrice)));
  searchParams.set('max_price', String(Math.round(maxPrice)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <Link
          to={`/listings?${searchParams.toString()}`}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          See all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {properties?.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              compact
              showCompareButton={false}
              maxBadges={1}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
