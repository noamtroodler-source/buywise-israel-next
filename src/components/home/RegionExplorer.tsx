import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Waves, Building, Mountain, Sun } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { CarouselDots } from '@/components/shared/CarouselDots';
import { useIsMobile } from '@/hooks/use-mobile';

// Import city images
import telAvivImg from '@/assets/cities/tel-aviv.jpg';
import herzliyaImg from '@/assets/cities/herzliya.jpg';
import netanyaImg from '@/assets/cities/netanya.jpg';
import ramatGanImg from '@/assets/cities/ramat-gan.jpg';
import jerusalemImg from '@/assets/cities/jerusalem.jpg';
import modiinImg from '@/assets/cities/modiin.jpg';
import raananaImg from '@/assets/cities/raanana.jpg';
import kfarSabaImg from '@/assets/cities/kfar-saba.jpg';
import haifaImg from '@/assets/cities/haifa.jpg';
import zichronYaakovImg from '@/assets/cities/zichron-yaakov.jpg';
import beerShevaImg from '@/assets/cities/beer-sheva.jpg';
import eilatImg from '@/assets/cities/eilat.jpg';
import ashkelonImg from '@/assets/cities/ashkelon.jpg';

type Region = 'coastal' | 'central' | 'north' | 'south';

interface City {
  name: string;
  slug: string;
  image: string;
}

const regions: Record<Region, { label: string; icon: React.ElementType; cities: City[] }> = {
  coastal: {
    label: 'Coastal',
    icon: Waves,
    cities: [
      { name: 'Tel Aviv', slug: 'tel-aviv', image: telAvivImg },
      { name: 'Herzliya', slug: 'herzliya', image: herzliyaImg },
      { name: 'Netanya', slug: 'netanya', image: netanyaImg },
      { name: 'Ramat Gan', slug: 'ramat-gan', image: ramatGanImg },
    ],
  },
  central: {
    label: 'Central',
    icon: Building,
    cities: [
      { name: 'Jerusalem', slug: 'jerusalem', image: jerusalemImg },
      { name: "Ra'anana", slug: 'raanana', image: raananaImg },
      { name: "Modi'in", slug: 'modiin', image: modiinImg },
      { name: 'Kfar Saba', slug: 'kfar-saba', image: kfarSabaImg },
    ],
  },
  north: {
    label: 'North',
    icon: Mountain,
    cities: [
      { name: 'Haifa', slug: 'haifa', image: haifaImg },
      { name: 'Zichron Yaakov', slug: 'zichron-yaakov', image: zichronYaakovImg },
    ],
  },
  south: {
    label: 'South',
    icon: Sun,
    cities: [
      { name: 'Beer Sheva', slug: 'beer-sheva', image: beerShevaImg },
      { name: 'Eilat', slug: 'eilat', image: eilatImg },
      { name: 'Ashkelon', slug: 'ashkelon', image: ashkelonImg },
    ],
  },
};

export function RegionExplorer() {
  const [activeRegion, setActiveRegion] = useState<Region>('coastal');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isMobile = useIsMobile();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    skipSnaps: false,
    containScroll: 'trimSnaps',
  });

  const cities = regions[activeRegion].cities;

  // Handle carousel index changes
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
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

  // Reset carousel when region changes
  useEffect(() => {
    if (emblaApi) {
      emblaApi.scrollTo(0);
      setSelectedIndex(0);
    }
  }, [activeRegion, emblaApi]);

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  return (
    <section className="py-8 md:py-14 bg-muted/30">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6"
        >
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              Explore Market Environments
            </h2>
            <p className="text-base text-muted-foreground mt-1">
              Market context and buyer-focused insights for each city.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/areas" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Region Tabs - Enhanced touch targets */}
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
          {(Object.keys(regions) as Region[]).map((region) => {
            const { label, icon: Icon } = regions[region];
            const isActive = activeRegion === region;
            return (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`flex-shrink-0 flex items-center gap-1.5 sm:gap-2 min-h-[44px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all active:scale-[0.98] ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-background text-muted-foreground hover:text-foreground hover:bg-background/80 border border-border'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Mobile: Horizontal Carousel - Edge-to-edge */}
        {isMobile && (
          <div className="sm:hidden -mx-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeRegion}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="overflow-hidden px-4" ref={emblaRef}>
                  <div className="flex">
                    {cities.map((city, index) => (
                      <div 
                        key={city.slug} 
                        className="flex-[0_0_85%] min-w-0 pl-4 first:pl-4"
                      >
                        <Link
                          to={`/areas/${city.slug}`}
                          className="group block relative overflow-hidden rounded-lg aspect-[3/2] bg-card shadow-card hover:shadow-card-hover transition-all duration-300"
                        >
                          <img
                            src={city.image}
                            alt={city.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="text-lg font-bold text-white">
                              {city.name}
                            </h3>
                            <p className="text-sm text-white/80">
                              Explore properties
                            </p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-4">
                  <CarouselDots 
                    total={cities.length} 
                    current={selectedIndex} 
                    onDotClick={scrollTo}
                    className="mt-4"
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Desktop: Cities Grid */}
        {!isMobile && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRegion}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="hidden sm:grid sm:grid-cols-4 gap-3"
            >
              {cities.map((city, index) => (
                <motion.div
                  key={city.slug}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Link
                    to={`/areas/${city.slug}`}
                    className="group block relative overflow-hidden rounded-lg aspect-[3/2] bg-card shadow-card hover:shadow-card-hover transition-all duration-300"
                  >
                    <img
                      src={city.image}
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-lg font-bold text-white">
                        {city.name}
                      </h3>
                      <p className="text-sm text-white/80">
                        Explore properties
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
