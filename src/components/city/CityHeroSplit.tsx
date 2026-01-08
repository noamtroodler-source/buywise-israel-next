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
    <section className="relative min-h-[40vh] flex items-center">
      {/* Full-width background image */}
      <img
        src={heroImage}
        alt={cityName}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      
      {/* Gradient overlay - dark on left, transparent on right */}
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/60 to-transparent" />
      
      {/* Mobile gradient - from bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent lg:hidden" />

      {/* Content */}
      <div className="relative z-10 container py-10 lg:py-8">
        <div className="max-w-xl">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Button 
              variant="ghost" 
              className="text-white/80 hover:text-white hover:bg-white/10 mb-4 -ml-2" 
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
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3"
          >
            {cityName}
          </motion.h1>

          {/* Market Tagline */}
          {marketTagline && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-base text-white/80 mb-6 max-w-md"
            >
              {marketTagline}
            </motion.p>
          )}

          {/* Key Stats Pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3 mb-6"
          >
            {formatPopulation(population) && (
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Users className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">
                  {formatPopulation(population)} residents
                </span>
              </div>
            )}
            {formatPrice(averagePrice) && (
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <TrendingUp className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">
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
              transition={{ delay: 0.25 }}
              className="flex flex-wrap gap-x-4 gap-y-2 mb-6"
            >
              {highlights.slice(0, 3).map((highlight, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 text-sm text-white/70"
                >
                  <MapPin className="h-3 w-3" />
                  <span>{highlight}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button size="lg" className="bg-white text-foreground hover:bg-white/90" asChild>
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
