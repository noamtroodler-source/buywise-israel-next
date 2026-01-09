import { Link } from 'react-router-dom';
import { Heart, MapPin, Calculator, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';

const popularCities = ['Tel Aviv', 'Jerusalem', 'Herzliya', 'Ra\'anana', 'Netanya'];

export default function Favorites() {
  const { favoriteProperties, isLoading } = useFavorites();

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-destructive" />
            <h1 className="text-3xl font-bold text-foreground">Saved Properties</h1>
          </div>

          {favoriteProperties.length === 0 ? (
            <div className="text-center py-16 max-w-lg mx-auto">
              {/* Icon */}
              <div className="relative mx-auto w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-destructive/10 rounded-full animate-pulse" />
                <div className="absolute inset-2 bg-destructive/5 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Heart className="h-10 w-10 text-destructive/60" />
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No saved properties yet
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Start exploring and save properties you love! Click the heart icon on any listing to save it here for easy comparison.
              </p>

              {/* Suggestions */}
              <div className="bg-muted/50 rounded-xl p-5 text-left space-y-4 mb-8">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  Start by exploring popular cities
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularCities.map((city) => (
                    <Link
                      key={city}
                      to={`/listings?status=for_sale&city=${encodeURIComponent(city)}`}
                      className="px-3 py-1.5 rounded-full bg-background border border-border text-sm hover:border-primary hover:text-primary transition-colors"
                    >
                      {city}
                    </Link>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg">
                  <Link to="/listings?status=for_sale">
                    Browse Properties
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/areas">
                    <MapPin className="h-4 w-4 mr-2" />
                    Explore Areas
                  </Link>
                </Button>
              </div>

              {/* Tools Suggestion */}
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Not sure what you can afford?
                </p>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/tools?tool=affordability" className="text-primary">
                    <Calculator className="h-4 w-4 mr-2" />
                    Try our Affordability Calculator
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">
                {favoriteProperties.length} saved {favoriteProperties.length === 1 ? 'property' : 'properties'}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
