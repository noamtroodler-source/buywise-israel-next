import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { useFormatPrice } from '@/contexts/PreferencesContext';

export function SavedPropertiesPreview() {
  const { favoriteProperties, isLoading } = useFavorites();
  const formatPrice = useFormatPrice();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-3 md:p-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const displayedProperties = favoriteProperties.slice(0, 3);
  const totalCount = favoriteProperties.length;

  return (
    <div className="rounded-xl border border-border bg-card p-3 md:p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Saved Properties</span>
        </div>
        {totalCount > 0 && (
          <span className="text-xs text-muted-foreground">{totalCount} saved</span>
        )}
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-4">
          <div className="w-10 h-10 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center">
            <Home className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mb-2">No saved properties yet</p>
          <Button asChild variant="outline" size="sm" className="h-7 text-xs">
            <Link to="/listings?status=for_sale">
              Browse Listings
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            {displayedProperties.map((property) => (
              <Link
                key={property.id}
                to={`/property/${property.id}`}
                className="relative group flex-1 min-w-0"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  {property.images?.[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium mt-1 truncate">
                  {formatPrice(property.price, property.currency || 'ILS')}
                </p>
              </Link>
            ))}
            {/* Show placeholder slots if less than 3 */}
            {displayedProperties.length < 3 && Array.from({ length: 3 - displayedProperties.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex-1 aspect-square rounded-lg border-2 border-dashed border-border" />
            ))}
          </div>

          {totalCount > 3 && (
            <Button asChild variant="ghost" size="sm" className="w-full mt-3 h-8 text-xs text-primary">
              <Link to="/favorites">
                View all {totalCount} properties
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          )}
        </>
      )}
    </div>
  );
}
