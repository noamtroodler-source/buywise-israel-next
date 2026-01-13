import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Waves, Building, Mountain, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  propertyCount: number;
}

const regions: Record<Region, { label: string; icon: React.ElementType; cities: City[] }> = {
  coastal: {
    label: 'Coastal & Tel Aviv',
    icon: Waves,
    cities: [
      { name: 'Tel Aviv', slug: 'tel-aviv', image: telAvivImg, propertyCount: 150 },
      { name: 'Herzliya', slug: 'herzliya', image: herzliyaImg, propertyCount: 85 },
      { name: 'Netanya', slug: 'netanya', image: netanyaImg, propertyCount: 65 },
      { name: 'Ramat Gan', slug: 'ramat-gan', image: ramatGanImg, propertyCount: 72 },
    ],
  },
  central: {
    label: 'Central Israel',
    icon: Building,
    cities: [
      { name: 'Jerusalem', slug: 'jerusalem', image: jerusalemImg, propertyCount: 120 },
      { name: "Ra'anana", slug: 'raanana', image: raananaImg, propertyCount: 55 },
      { name: "Modi'in", slug: 'modiin', image: modiinImg, propertyCount: 70 },
      { name: 'Kfar Saba', slug: 'kfar-saba', image: kfarSabaImg, propertyCount: 48 },
    ],
  },
  north: {
    label: 'North',
    icon: Mountain,
    cities: [
      { name: 'Haifa', slug: 'haifa', image: haifaImg, propertyCount: 90 },
      { name: 'Zichron Yaakov', slug: 'zichron-yaakov', image: zichronYaakovImg, propertyCount: 28 },
    ],
  },
  south: {
    label: 'South',
    icon: Sun,
    cities: [
      { name: 'Beer Sheva', slug: 'beer-sheva', image: beerShevaImg, propertyCount: 45 },
      { name: 'Eilat', slug: 'eilat', image: eilatImg, propertyCount: 40 },
      { name: 'Ashkelon', slug: 'ashkelon', image: ashkelonImg, propertyCount: 38 },
    ],
  },
};

export function RegionExplorer() {
  const [activeRegion, setActiveRegion] = useState<Region>('coastal');

  return (
    <section className="py-10 md:py-14 bg-muted/30">
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
              Explore by Region
            </h2>
            <p className="text-base text-muted-foreground mt-1">
              Discover cities across Israel
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/areas" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Region Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {(Object.keys(regions) as Region[]).map((region) => {
            const { label, icon: Icon } = regions[region];
            const isActive = activeRegion === region;
            return (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-background text-muted-foreground hover:text-foreground hover:bg-background/80 border border-border'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Cities Grid */}
        <AnimatePresence mode="wait">
          {(() => {
            const gridClasses = "grid-cols-2 sm:grid-cols-4";
            
            return (
              <motion.div
                key={activeRegion}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`grid gap-3 ${gridClasses}`}
              >
            {regions[activeRegion].cities.map((city, index) => (
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
                      {city.propertyCount} properties
                    </p>
                  </div>
                </Link>
              </motion.div>
              ))}
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </section>
  );
}
