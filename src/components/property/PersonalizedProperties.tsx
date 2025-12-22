import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { PropertyCard } from './PropertyCard';
import { useAuth } from '@/hooks/useAuth';
import { usePersonalizedProperties } from '@/hooks/usePersonalizedProperties';
import { Property } from '@/types/database';

interface PersonalizedPropertiesProps {
  currentProperty: Property;
}

export function PersonalizedProperties({ currentProperty }: PersonalizedPropertiesProps) {
  const { user } = useAuth();
  const { data: properties, isLoading } = usePersonalizedProperties(currentProperty.id);

  // Show teaser for non-logged-in users
  if (!user) {
    return (
      <section className="mt-12">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Personalized for You</h2>
        </div>
        
        <div className="relative">
          {/* Blurred preview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 blur-sm opacity-60 pointer-events-none select-none">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-[4/3] bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </Card>
            ))}
          </div>
          
          {/* Overlay with CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background via-background/80 to-transparent"
          >
            <div className="text-center p-8 max-w-md">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Get Personalized Recommendations
              </h3>
              <p className="text-muted-foreground mb-6">
                Sign up to see properties tailored to your preferences, based on what you like and search for.
              </p>
              <Button asChild size="lg" className="gap-2">
                <Link to="/auth">
                  <Sparkles className="h-4 w-4" />
                  Sign Up to Unlock
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  // Loading state for logged-in users
  if (isLoading) {
    return (
      <section className="mt-12">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Personalized for You</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-6 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  // No personalized properties found
  if (!properties || properties.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Personalized for You</h2>
        <span className="text-sm text-muted-foreground ml-2">Based on your preferences</span>
      </div>

      <Carousel
        opts={{
          align: 'start',
          loop: properties.length > 3,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {properties.map((property) => (
            <CarouselItem key={property.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <PropertyCard property={property} showCompareButton={false} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {properties.length > 3 && (
          <>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </>
        )}
      </Carousel>
    </section>
  );
}
