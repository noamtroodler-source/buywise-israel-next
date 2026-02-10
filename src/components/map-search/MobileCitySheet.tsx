import { useEffect, useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MapPin, Navigation, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import { findNearestCity } from '@/lib/utils/findNearestCity';
import { useCities } from '@/hooks/useCities';
import { cn } from '@/lib/utils';

interface MobileCitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCitySelect: (cityName: string | undefined) => void;
  currentCity?: string;
  listingStatus: string;
}

export function MobileCitySheet({ open, onOpenChange, onCitySelect, currentCity, listingStatus }: MobileCitySheetProps) {
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { data: allCities } = useCities();
  const { getLocation, isLoading: isLocating, coordinates, error: geoError } = useGeolocation();

  // Fetch city counts when opened
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase.rpc('get_city_property_counts', { p_listing_status: listingStatus })
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        data?.forEach((row: { city: string; count: number }) => {
          counts[row.city] = Number(row.count);
        });
        setCityCounts(counts);
        setLoading(false);
      });
  }, [open, listingStatus]);

  // Handle geolocation result
  useEffect(() => {
    if (!coordinates || !allCities) return;
    const nearest = findNearestCity(coordinates, allCities);
    if (nearest) {
      onCitySelect(nearest.name);
      onOpenChange(false);
    }
  }, [coordinates, allCities]);

  const sortedCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-base">Select City</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-2 space-y-2">
          {/* Use my location */}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => getLocation()}
            disabled={isLocating}
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            {isLocating ? 'Locating...' : 'Use my location'}
          </Button>
          {geoError && (
            <p className="text-xs text-destructive">{geoError}</p>
          )}

          {/* Clear filter */}
          {currentCity && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={() => { onCitySelect(undefined); onOpenChange(false); }}
            >
              <X className="h-4 w-4" />
              Clear city filter
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 max-h-[50vh]">
          <div className="px-4 pb-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-0.5">
                {sortedCities.map(([city, count]) => (
                  <button
                    key={city}
                    onClick={() => { onCitySelect(city); onOpenChange(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                      currentCity === city
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {city}
                    </span>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
