import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Property } from '@/types/database';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';

interface PropertyCarouselProps {
  title: string;
  description: string;
  properties: Property[] | undefined;
  isLoading: boolean;
  viewAllLink: string;
  viewAllText?: string;
  hideStatusBadge?: boolean;
}

export function PropertyCarousel({
  title,
  description,
  properties,
  isLoading,
  viewAllLink,
  viewAllText = 'View All',
  hideStatusBadge = false,
}: PropertyCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    skipSnaps: false,
    dragFree: true,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

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

  return (
    <section className="py-14">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6"
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {title}
            </h2>
            <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="h-10 w-10 rounded-full border-border bg-background shadow-sm hover:bg-muted disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="h-10 w-10 rounded-full border-border bg-background shadow-sm hover:bg-muted disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button asChild className="ml-4 px-5">
              <Link to={viewAllLink} className="gap-2 font-medium">
                {viewAllText}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-8">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="min-w-0 shrink-0 grow-0 basis-1/2 md:basis-1/3 lg:basis-1/3 pl-8"
                >
                  <PropertyCard property={property} showCompareButton={false} hideStatusBadge={hideStatusBadge} compact />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-xl">
            <p className="text-muted-foreground">
              No properties available at the moment.
            </p>
            <Button asChild className="mt-4">
              <Link to={viewAllLink}>Browse All Properties</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
