import { Link } from 'react-router-dom';
import { ArrowRight, Home, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/property/PropertyCard';
import { useCityFeaturedProperties } from '@/hooks/useProperties';
import useEmblaCarousel from 'embla-carousel-react';
import { useState, useEffect, useCallback } from 'react';

interface CityFeaturedPropertiesProps {
  cityName: string;
  citySlug: string;
}

export function CityFeaturedProperties({ cityName, citySlug }: CityFeaturedPropertiesProps) {
  const { data: properties, isLoading } = useCityFeaturedProperties(cityName, 8);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: false, dragFree: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Don't render if no properties available
  if (!isLoading && (!properties || properties.length === 0)) {
    return null;
  }

  return (
    <div className="bg-muted/40 py-16 md:py-20">
      <div className="container space-y-8">
        {/* Header with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
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

          {/* Navigation Controls */}
          {!isLoading && properties && properties.length > 4 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={scrollNext}
                disabled={!canScrollNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button asChild className="ml-2 group">
                <Link to={`/listings?city=${encodeURIComponent(cityName)}`}>
                  View All
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Property Carousel */}
        {!isLoading && properties && properties.length > 0 && (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-6">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 lg:basis-1/4 pl-6"
                >
                  <PropertyCard
                    property={property}
                    showCompareButton={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile View All CTA */}
        {!isLoading && properties && properties.length > 0 && properties.length <= 4 && (
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
