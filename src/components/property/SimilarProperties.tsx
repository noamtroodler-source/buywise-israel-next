import { useSimilarProperties } from '@/hooks/useSimilarProperties';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Property } from '@/types/database';

interface SimilarPropertiesProps {
  currentProperty: Property | null | undefined;
}

export function SimilarProperties({ currentProperty }: SimilarPropertiesProps) {
  const { data: properties, isLoading } = useSimilarProperties(currentProperty);
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

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  if (!isLoading && (!properties || properties.length === 0)) {
    return null;
  }

  const listingType = currentProperty?.listing_status === 'for_rent' ? 'rent' : 'sale';

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mt-12"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">You Might Also Like</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Similar properties in {currentProperty?.city}
          </p>
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
        </div>
      </div>

      <div className="-mx-4 md:mx-0">
        <div className="overflow-hidden px-4 md:px-0" ref={emblaRef}>
          <div className="flex -ml-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-0 shrink-0 grow-0 basis-[calc(100%-2rem)] md:basis-1/2 lg:basis-1/4 pl-4">
                  <Skeleton className="h-[320px] w-full rounded-xl" />
                </div>
              ))
            ) : (
              properties?.map((property) => (
                <div key={property.id} className="min-w-0 shrink-0 grow-0 basis-[calc(100%-2rem)] md:basis-1/2 lg:basis-1/4 pl-4">
                  <PropertyCard property={property} showCompareButton={false} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Button variant="outline" asChild>
          <Link to={`/listings?city=${currentProperty?.city}&type=${listingType}`}>
            View More in {currentProperty?.city}
          </Link>
        </Button>
      </div>
    </motion.section>
  );
}
