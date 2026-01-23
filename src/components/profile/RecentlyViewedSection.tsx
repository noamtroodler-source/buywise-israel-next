import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Home, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';

export function RecentlyViewedSection() {
  const { recentProperties, isLoading, clearRecentlyViewed } = useRecentlyViewed();
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recently Viewed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentProperties.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recently Viewed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
              <Home className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              No properties viewed yet
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/listings?status=for_sale">
                Start Browsing
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedProperties = recentProperties.slice(0, 6);

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recently Viewed
        </CardTitle>
        {recentProperties.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-destructive"
            onClick={clearRecentlyViewed}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {displayedProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Link
                to={`/property/${property.id}`}
                className="block group rounded-lg border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  {property.images?.[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{property.city}</p>
                  <p className="text-xs text-primary font-semibold">
                    {formatPrice(property.price, property.currency || 'ILS')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {property.bedrooms} rooms · {formatArea(property.size_sqm || 0)}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {recentProperties.length > 6 && (
          <div className="text-center pt-2">
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link to="/favorites">
                View all {recentProperties.length} viewed properties
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
