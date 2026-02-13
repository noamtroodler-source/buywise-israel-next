import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/button';
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

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Link
            to={`/listings?${searchParams.toString()}`}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            See all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Carousel */}
      <div className="-mx-4 md:mx-0">
        <div className="overflow-hidden px-4 md:px-0" ref={emblaRef}>
          <div className="flex -ml-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-0 shrink-0 grow-0 basis-[calc(100%-2rem)] md:basis-1/2 lg:basis-1/4 pl-4">
                  <div className="space-y-3">
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              properties?.map((property) => (
                <div key={property.id} className="min-w-0 shrink-0 grow-0 basis-[calc(100%-2rem)] md:basis-1/2 lg:basis-1/4 pl-4">
                  <PropertyCard
                    property={property}
                    compact
                    showCompareButton={false}
                    maxBadges={1}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
