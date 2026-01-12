import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, ChevronDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CityHeroGuideProps {
  cityName: string;
  heroImage: string;
  identitySentence: string;
}

export function CityHeroGuide({ 
  cityName, 
  heroImage, 
  identitySentence
}: CityHeroGuideProps) {
  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight * 0.6, behavior: 'smooth' });
  };

  return (
    <section className="relative h-[60vh] min-h-[500px] flex items-end">
      {/* Full-width background image */}
      <img
        src={heroImage}
        alt={cityName}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/50 to-foreground/20" />

      {/* Content */}
      <div className="relative z-10 container pb-16">
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

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-4"
        >
          <Badge variant="secondary" className="bg-primary/90 text-primary-foreground border-0 px-3 py-1">
            <MapPin className="h-3 w-3 mr-1.5" />
            Area Guide
          </Badge>
        </motion.div>

        {/* City Name with Blue Emphasis */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4"
        >
          Living in <span className="text-primary">{cityName}</span>
        </motion.h1>

        {/* Identity Sentence */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-lg sm:text-xl text-white/90 max-w-2xl mb-6 leading-relaxed"
        >
          {identitySentence}
        </motion.p>

        {/* Meta Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 text-sm text-white/70"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            ~5 min read
          </span>
          <span>Updated 2025</span>
        </motion.div>
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
