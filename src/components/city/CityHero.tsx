import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CityHeroProps {
  cityName: string;
  heroImage: string;
  marketTagline: string | null;
}

export function CityHero({ cityName, heroImage, marketTagline }: CityHeroProps) {
  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight * 0.5, behavior: 'smooth' });
  };

  return (
    <section className="relative h-[50vh] min-h-[400px] flex items-end">
      {/* Full-width background image */}
      <img
        src={heroImage}
        alt={cityName}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      
      {/* Gradient overlay - lightened to show more image */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/40 to-foreground/10" />

      {/* Content */}
      <div className="relative z-10 container pb-12">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <Button 
            variant="ghost" 
            className="text-white/80 hover:text-white hover:bg-white/10 -ml-3" 
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
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3"
        >
          {cityName}
        </motion.h1>

        {/* Market Tagline */}
        {marketTagline && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-lg text-white/85 max-w-lg"
          >
            {marketTagline}
          </motion.p>
        )}
      </div>

      {/* Scroll Indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={scrollToContent}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 hover:text-white/90 transition-colors"
      >
        <ChevronDown className="h-6 w-6 animate-bounce" />
      </motion.button>
    </section>
  );
}
