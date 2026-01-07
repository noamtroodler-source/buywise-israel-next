import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, TrendingUp, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CityHeroSplitProps {
  cityName: string;
  heroImage: string;
  population: number | null;
  averagePrice: number | null;
  highlights: string[] | null;
  marketTagline: string | null;
}

export function CityHeroSplit({ 
  cityName, 
  heroImage, 
  population, 
  averagePrice, 
  highlights,
  marketTagline 
}: CityHeroSplitProps) {
  const formatPrice = (price: number | null) => {
    if (!price) return null;
    if (price >= 1000000) return `₪${(price / 1000000).toFixed(1)}M`;
    return `₪${(price / 1000).toFixed(0)}K`;
  };

  const formatPopulation = (pop: number | null) => {
    if (!pop) return null;
    if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`;
    if (pop >= 1000) return `${(pop / 1000).toFixed(0)}K`;
    return pop.toString();
  };

  return (
    <section className="relative min-h-[60vh] lg:min-h-[70vh] flex">
      {/* Image Side */}
      <div className="hidden lg:block lg:w-[55%] relative">
        <img
          src={heroImage}
          alt={cityName}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/80" />
      </div>

      {/* Mobile Image Background */}
      <div className="lg:hidden absolute inset-0">
        <img
          src={heroImage}
          alt={cityName}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      </div>

      {/* Content Side */}
      <div className="relative z-10 w-full lg:w-[45%] flex items-center">
        <div className="container lg:pl-12 lg:pr-16 py-16 lg:py-0">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground mb-6 -ml-2" 
              asChild
            >
              <Link to="/areas">
                <ArrowLeft className="h-4 w-4 mr-2" />
                All Cities
              </Link>
            </Button>
          </motion.div>

          {/* City Name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4"
          >
            {cityName}
          </motion.h1>

          {/* Market Tagline */}
          {marketTagline && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-muted-foreground mb-8 max-w-md"
            >
              {marketTagline}
            </motion.p>
          )}

          {/* Key Stats Pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-3 mb-8"
          >
            {formatPopulation(population) && (
              <div className="flex items-center gap-2 bg-muted/80 backdrop-blur-sm px-4 py-2 rounded-full">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {formatPopulation(population)} residents
                </span>
              </div>
            )}
            {formatPrice(averagePrice) && (
              <div className="flex items-center gap-2 bg-muted/80 backdrop-blur-sm px-4 py-2 rounded-full">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Avg. {formatPrice(averagePrice)}
                </span>
              </div>
            )}
          </motion.div>

          {/* Highlights */}
          {highlights && highlights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-2"
            >
              {highlights.slice(0, 3).map((highlight, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                >
                  <MapPin className="h-3 w-3 text-primary" />
                  <span>{highlight}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-10"
          >
            <Button size="lg" asChild>
              <Link to={`/listings?city=${encodeURIComponent(cityName)}`}>
                Explore Listings
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
