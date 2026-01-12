import { Link } from 'react-router-dom';
import { Heart, MapPin, Calculator, ArrowRight, Loader2, Bell, BellOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { usePriceDropAlerts } from '@/hooks/usePriceDropAlerts';

const popularCities = ['Tel Aviv', 'Jerusalem', 'Herzliya', 'Ra\'anana', 'Netanya'];

export default function Favorites() {
  const { favorites, favoriteProperties, isLoading } = useFavorites();
  const { togglePriceAlert, isTogglingAlert } = usePriceDropAlerts();

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const alertsEnabledCount = favorites.filter((f: any) => f.price_alert_enabled !== false).length;

  return (
    <Layout>
      {/* Gradient Header - matches Tools/Blog pages */}
      <section className="bg-gradient-to-b from-muted/60 to-background border-b border-border/50">
        <div className="container py-8 md:py-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Saved Properties
            </h1>
            <p className="text-muted-foreground">
              Track your favorites and get notified when prices drop.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-8">
        {favoriteProperties.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 max-w-lg mx-auto"
          >
            {/* Icon */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-primary/5 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart className="h-10 w-10 text-primary/60" />
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
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Bar */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {favoriteProperties.length} saved {favoriteProperties.length === 1 ? 'property' : 'properties'}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bell className="h-4 w-4 text-primary" />
                <span>{alertsEnabledCount} with price alerts</span>
              </div>
            </div>

            {/* Property Grid - 4 columns on XL */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favorites.map((fav: any) => {
                const property = fav.properties;
                if (!property) return null;
                const alertEnabled = fav.price_alert_enabled !== false;
                
                return (
                  <div key={property.id} className="space-y-2">
                    <PropertyCard property={property} />
                    
                    {/* Alert Toggle - Clean bar below card */}
                    <button
                      onClick={() => togglePriceAlert({ propertyId: property.id, enabled: !alertEnabled })}
                      disabled={isTogglingAlert}
                      className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm transition-colors ${
                        alertEnabled 
                          ? 'bg-primary/10 text-primary hover:bg-primary/15' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {alertEnabled ? (
                        <>
                          <Bell className="h-3.5 w-3.5" />
                          <span>Price alerts on</span>
                        </>
                      ) : (
                        <>
                          <BellOff className="h-3.5 w-3.5" />
                          <span>Price alerts off</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
