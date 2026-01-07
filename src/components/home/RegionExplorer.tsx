import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Waves, Building, Mountain, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import city images
import telAvivImg from '@/assets/cities/tel-aviv.jpg';
import herzliyaImg from '@/assets/cities/herzliya.jpg';
import netanyaImg from '@/assets/cities/netanya.jpg';
import jerusalemImg from '@/assets/cities/jerusalem.jpg';
import modiinImg from '@/assets/cities/modiin.jpg';
import raananaImg from '@/assets/cities/raanana.jpg';
import haifaImg from '@/assets/cities/haifa.jpg';
import nahariyaImg from '@/assets/cities/nahariya.jpg';
import beerShevaImg from '@/assets/cities/beer-sheva.jpg';
import eilatImg from '@/assets/cities/eilat.jpg';

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
    ],
  },
  central: {
    label: 'Central Israel',
    icon: Building,
    cities: [
      { name: 'Jerusalem', slug: 'jerusalem', image: jerusalemImg, propertyCount: 120 },
      { name: "Modi'in", slug: 'modiin', image: modiinImg, propertyCount: 70 },
      { name: "Ra'anana", slug: 'raanana', image: raananaImg, propertyCount: 55 },
    ],
  },
  north: {
    label: 'North',
    icon: Mountain,
    cities: [
      { name: 'Haifa', slug: 'haifa', image: haifaImg, propertyCount: 90 },
      { name: 'Nahariya', slug: 'nahariya', image: nahariyaImg, propertyCount: 35 },
    ],
  },
  south: {
    label: 'South',
    icon: Sun,
    cities: [
      { name: 'Beer Sheva', slug: 'beer-sheva', image: beerShevaImg, propertyCount: 45 },
      { name: 'Eilat', slug: 'eilat', image: eilatImg, propertyCount: 40 },
    ],
  },
};

export function RegionExplorer() {
  const [activeRegion, setActiveRegion] = useState<Region>('coastal');

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Explore by Region
            </h2>
            <p className="text-muted-foreground mt-2">
              Discover neighborhoods across Israel's diverse regions
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/areas" className="gap-2">
              View All Areas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Region Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(Object.keys(regions) as Region[]).map((region) => {
            const { label, icon: Icon } = regions[region];
            const isActive = activeRegion === region;
            return (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
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
          <motion.div
            key={activeRegion}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {regions[activeRegion].cities.map((city, index) => (
              <motion.div
                key={city.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link
                  to={`/areas/${city.slug}`}
                  className="group block relative overflow-hidden rounded-xl aspect-[16/10] bg-card shadow-card hover:shadow-card-hover transition-all duration-300"
                >
                  <img
                    src={city.image}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-xl font-bold text-white mb-1">
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
        </AnimatePresence>
      </div>
    </section>
  );
}
