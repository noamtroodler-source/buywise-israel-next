import { MapPin, Home, TrendingUp, Calendar, Building2 } from 'lucide-react';
import { useNearbySoldComps } from '@/hooks/useNearbySoldComps';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface RecentNearbySalesProps {
  latitude: number | null;
  longitude: number | null;
  city: string;
  propertyRooms?: number;
  propertyPrice?: number;
  propertySizeSqm?: number;
}

export function RecentNearbySales({
  latitude,
  longitude,
  city,
  propertyRooms,
  propertyPrice,
  propertySizeSqm,
}: RecentNearbySalesProps) {
  const { data: comps, isLoading, error } = useNearbySoldComps(
    latitude,
    longitude,
    city,
    {
      radiusKm: 0.5,
      monthsBack: 24,
      limit: 5,
      // Optionally filter by similar room count
      minRooms: propertyRooms ? propertyRooms - 1 : undefined,
      maxRooms: propertyRooms ? propertyRooms + 1 : undefined,
    }
  );

  // Don't render if we don't have coordinates
  if (!latitude || !longitude) {
    return null;
  }

  // Format price in ILS
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters < 50) return 'Same building';
    if (meters < 1000) return `${Math.round(meters)}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  // Format date
  const formatSoldDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  // Calculate comparison to listing
  const getComparison = (compPriceSqm: number | null) => {
    if (!compPriceSqm || !propertyPrice || !propertySizeSqm) return null;
    const listingPriceSqm = propertyPrice / propertySizeSqm;
    const diff = ((listingPriceSqm - compPriceSqm) / compPriceSqm) * 100;
    return diff;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Recent Nearby Sales</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !comps || comps.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Recent Nearby Sales</h3>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            No recent sales data available for this area yet.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Government transaction data is being added continuously.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Recent Nearby Sales</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          Last 24 months • Within 500m
        </span>
      </div>

      <div className="space-y-3">
        {comps.map((comp) => {
          const comparison = getComparison(comp.price_per_sqm);
          
          return (
            <div
              key={comp.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Home className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">
                    {comp.rooms ? `${comp.rooms}BR` : 'Apartment'}
                    {comp.size_sqm ? `, ${comp.size_sqm}m²` : ''}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    sold for
                  </span>
                  <span className="font-bold text-primary">
                    {formatPrice(comp.sold_price)}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {comp.is_same_building ? (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        Same building
                      </Badge>
                    ) : (
                      formatDistance(comp.distance_meters)
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatSoldDate(comp.sold_date)}
                  </span>
                  {comp.price_per_sqm && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {formatPrice(comp.price_per_sqm)}/m²
                    </span>
                  )}
                </div>

                {comparison !== null && Math.abs(comparison) > 5 && (
                  <div className="mt-2">
                    <Badge 
                      variant={comparison > 0 ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {comparison > 0 
                        ? `Listing is ${comparison.toFixed(0)}% above this sale`
                        : `Listing is ${Math.abs(comparison).toFixed(0)}% below this sale`
                      }
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Data source: Israel Tax Authority & Nadlan.gov.il
      </p>
    </div>
  );
}
