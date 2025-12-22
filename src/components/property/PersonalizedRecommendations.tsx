import { useAuth } from '@/hooks/useAuth';
import { usePersonalizedProperties } from '@/hooks/usePersonalizedProperties';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sparkles, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Property } from '@/types/database';

interface PersonalizedRecommendationsProps {
  currentProperty: Property | null | undefined;
}

export function PersonalizedRecommendations({ currentProperty }: PersonalizedRecommendationsProps) {
  const { user } = useAuth();
  const { data: properties, isLoading } = usePersonalizedProperties(currentProperty?.id);
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

  // Guest teaser view
  if (!user) {
    return (
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-12"
      >
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Picks Just For You</h2>
        </div>

        <div className="relative rounded-xl border border-border bg-muted/30 overflow-hidden">
          {/* Blurred preview cards */}
          <div className="flex gap-4 p-6 blur-sm pointer-events-none select-none">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-[0_0_280px] md:flex-[0_0_300px]">
                <div className="bg-card rounded-xl overflow-hidden shadow-sm">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-6 bg-muted rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Overlay with CTA */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <div className="text-center max-w-md px-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Unlock Personalized Recommendations
              </h3>
              <p className="text-muted-foreground mb-6">
                Create a free account to get property suggestions tailored to your preferences and browsing history.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg">
                  <Link to="/auth?mode=signup">Sign Up Free</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/auth">Log In</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    );
  }

  // Logged in but no personalized properties yet
  if (!isLoading && (!properties || properties.length === 0)) {
    return (
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-12"
      >
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Picks Just For You</h2>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Start Saving Properties
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Save properties you like to get personalized recommendations based on your preferences.
          </p>
        </div>
      </motion.section>
    );
  }

  // Logged in with personalized properties
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="mt-12"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Picks Just For You</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Based on your saved properties
            </p>
          </div>
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

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-[0_0_280px] md:flex-[0_0_300px]">
                <Skeleton className="h-[320px] w-full rounded-xl" />
              </div>
            ))
          ) : (
            properties?.map((property) => (
              <div key={property.id} className="flex-[0_0_280px] md:flex-[0_0_300px]">
                <PropertyCard property={property} showCompareButton={false} />
              </div>
            ))
          )}
        </div>
      </div>
    </motion.section>
  );
}
