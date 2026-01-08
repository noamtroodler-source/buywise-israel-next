import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// City personality taglines - each city gets a unique character
const cityTaglines: Record<string, string> = {
  'tel-aviv': 'Where Mediterranean lifestyle meets global ambition',
  'jerusalem': 'Ancient roots, modern opportunity',
  'herzliya': "Israel's premium coastal address",
  'raanana': 'Family-first living in the heart of the Sharon',
  'modiin': 'Purpose-built for modern families',
  'haifa': 'Tech meets tradition on the Carmel',
  'netanya': 'Beachfront living within reach',
  'kfar-saba': 'Suburban charm with urban convenience',
  'petah-tikva': 'Central location, growing potential',
  'ashdod': 'Southern gateway to opportunity',
  'beer-sheva': "The Negev's rising star",
  'eilat': 'Resort living at the Red Sea',
  'givatayim': 'Tel Aviv vibes, quieter streets',
  'ramat-gan': 'Diamond district meets family neighborhoods',
  'holon': 'Culture and community south of Tel Aviv',
  'bat-yam': 'Beachfront value on the coast',
  'ashkelon': 'Mediterranean charm, southern value',
  'hod-hasharon': 'Sharon region family favorite',
  'rosh-haayin': 'Hilltop community near the center',
  'shoham': 'Premium suburban living',
  'givat-shmuel': 'Compact city, big convenience',
  'hadera': 'Northern gateway with room to grow',
  'nahariya': 'Coastal calm near the border',
  'zichron-yaakov': 'Wine country living with views',
  'caesarea': 'Exclusive living by ancient shores',
  'kiryat-tivon': 'Carmel tranquility near Haifa',
  'mevaseret-zion': 'Jerusalem views, suburban peace',
  'beit-shemesh': 'Growing community west of Jerusalem',
  'maale-adumim': 'Judean desert doorstep',
  'efrat': 'Gush Etzion family community',
  'givat-zeev': 'North Jerusalem suburbs',
  'gush-etzion': 'Historic hills, modern living',
  'yokneam': 'Tech hub in the Jezreel Valley',
  'pardes-hanna': 'Sharon region value option',
};

interface CityHeroSplitProps {
  cityName: string;
  citySlug?: string;
  heroImage: string;
  population?: number | null;
  averagePrice?: number | null;
  highlights?: string[] | null;
}

export function CityHeroSplit({ 
  cityName, 
  citySlug,
  heroImage, 
}: CityHeroSplitProps) {
  const tagline = citySlug ? cityTaglines[citySlug] : null;

  return (
    <section className="relative min-h-[50vh] flex items-center">
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
      <div className="relative z-10 container py-12 lg:py-10">
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
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4"
          >
            {cityName}
          </motion.h1>

          {/* Personality Tagline */}
          {tagline && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-lg sm:text-xl text-white/85 mb-8 max-w-md font-light"
            >
              {tagline}
            </motion.p>
          )}

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
