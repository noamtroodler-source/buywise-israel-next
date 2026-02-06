import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Search, Building, Star, Heart, Trees, Sun, MapPin } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useRef, useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { cityMatchesQuery } from '@/lib/utils/cityMatcher';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';

// City images
import telAvivImg from '@/assets/cities/tel-aviv.jpg';
import herzliyaImg from '@/assets/cities/herzliya.jpg';
import netanyaImg from '@/assets/cities/netanya.jpg';
import haifaImg from '@/assets/cities/haifa.jpg';
import ramatGanImg from '@/assets/cities/ramat-gan.jpg';
import ashdodImg from '@/assets/cities/ashdod.jpg';
import raananaImg from '@/assets/cities/raanana.jpg';
import kfarSabaImg from '@/assets/cities/kfar-saba.jpg';
import modiinImg from '@/assets/cities/modiin.jpg';
import givatShmuelImg from '@/assets/cities/givat-shmuel.jpg';
import hodHasharonImg from '@/assets/cities/hod-hasharon.jpg';
import petahTikvaImg from '@/assets/cities/petah-tikva.jpg';
import haderaImg from '@/assets/cities/hadera.jpg';
import caesareaImg from '@/assets/cities/caesarea.jpg';
import jerusalemImg from '@/assets/cities/jerusalem.jpg';
import beitShemeshImg from '@/assets/cities/beit-shemesh.jpg';
import efratImg from '@/assets/cities/efrat.jpg';
import gushEtzionImg from '@/assets/cities/gush-etzion.jpg';
import maaleAdumimImg from '@/assets/cities/maale-adumim.jpg';
import mevaseretZionImg from '@/assets/cities/mevaseret-zion.jpg';
import zichronYaakovImg from '@/assets/cities/zichron-yaakov.jpg';
import pardesHannaImg from '@/assets/cities/pardes-hanna.jpg';
import ashkelonImg from '@/assets/cities/ashkelon.jpg';
import beerShevaImg from '@/assets/cities/beer-sheva.jpg';
import eilatImg from '@/assets/cities/eilat.jpg';

interface City {
  name: string;
  slug: string;
  image: string;
  description: string;
  tags: string[];
}

interface Region {
  id: string;
  name: string;
  shortName: string;
  subtitle: string;
  icon: typeof Building;
  cities: City[];
}

const regions: Region[] = [
  {
    id: 'coastal',
    name: 'Coastal',
    shortName: 'Coastal',
    subtitle: 'Beach life, urban energy & metro convenience',
    icon: Sun,
    cities: [
      { name: 'Tel Aviv', slug: 'tel-aviv', image: telAvivImg, description: "Israel's most expensive and competitive real estate market with urban premium...", tags: ['Urban premium', 'Limited supply'] },
      { name: 'Herzliya', slug: 'herzliya', image: herzliyaImg, description: 'Herzliya is a premium coastal market with distinct neighborhoods...', tags: ['Coastal premium', 'High demand'] },
      { name: 'Netanya', slug: 'netanya', image: netanyaImg, description: 'Netanya offers coastal living with more varied price points...', tags: ['Coastal variety', 'Range of price points'] },
      { name: 'Haifa', slug: 'haifa', image: haifaImg, description: 'Haifa offers urban living at significantly lower prices...', tags: ['Northern metro', 'Value positioning'] },
      { name: 'Ramat Gan', slug: 'ramat-gan', image: ramatGanImg, description: 'Diamond exchange district with high-rise living...', tags: ['Business hub', 'High-rise living'] },
      { name: 'Ashdod', slug: 'ashdod', image: ashdodImg, description: 'Major port city with beaches and affordable housing...', tags: ['Port city', 'Beach access'] },
    ],
  },
  {
    id: 'central',
    name: 'Central',
    shortName: 'Central',
    subtitle: 'Family suburbs, Jerusalem area & growing communities',
    icon: Building,
    cities: [
      { name: "Ra'anana", slug: 'raanana', image: raananaImg, description: "Ra'anana is an established suburban city with premium pricing...", tags: ['Established suburban', 'Premium pricing'] },
      { name: 'Kfar Saba', slug: 'kfar-saba', image: kfarSabaImg, description: 'Kfar Saba offers suburban living at more moderate prices...', tags: ['Suburban value', 'Family-oriented'] },
      { name: "Modi'in", slug: 'modiin', image: modiinImg, description: "Modi'in is a planned city built primarily since the 1990s...", tags: ['Planned city', 'Central location'] },
      { name: 'Givat Shmuel', slug: 'givat-shmuel', image: givatShmuelImg, description: 'Givat Shmuel is a small city with significant development...', tags: ['Compact city', 'Developing market'] },
      { name: 'Hod HaSharon', slug: 'hod-hasharon', image: hodHasharonImg, description: 'Growing suburb with excellent schools and parks...', tags: ['Quality schools', 'Green spaces'] },
      { name: 'Petah Tikva', slug: 'petah-tikva', image: petahTikvaImg, description: 'Historic city with diverse neighborhoods and pricing...', tags: ['Historic city', 'Diverse options'] },
      { name: 'Hadera', slug: 'hadera', image: haderaImg, description: 'Affordable option with improving infrastructure...', tags: ['Affordable', 'Improving area'] },
      { name: 'Caesarea', slug: 'caesarea', image: caesareaImg, description: 'Exclusive community with luxury properties...', tags: ['Luxury market', 'Exclusive area'] },
      { name: 'Jerusalem', slug: 'jerusalem', image: jerusalemImg, description: "Jerusalem's real estate market is characterized by high demand and varied neighborhoods...", tags: ['High demand', 'Varied neighborhoods'] },
      { name: 'Beit Shemesh', slug: 'beit-shemesh', image: beitShemeshImg, description: 'Beit Shemesh has experienced rapid expansion with new construction...', tags: ['Rapid growth', 'New construction'] },
      { name: 'Efrat', slug: 'efrat', image: efratImg, description: 'Efrat is a mid-sized community with a relatively established market...', tags: ['Established community', 'Limited inventory'] },
      { name: 'Gush Etzion', slug: 'gush-etzion', image: gushEtzionImg, description: 'Gush Etzion encompasses multiple distinct communities...', tags: ['Multiple communities', 'Varied options'] },
      { name: "Ma'ale Adumim", slug: 'maale-adumim', image: maaleAdumimImg, description: 'Large suburban city east of Jerusalem with established infrastructure...', tags: ['Established suburb', 'Jerusalem access'] },
      { name: 'Mevaseret Zion', slug: 'mevaseret-zion', image: mevaseretZionImg, description: 'Upscale suburb on the outskirts of Jerusalem...', tags: ['Upscale suburb', 'Nature access'] },
    ],
  },
  {
    id: 'north',
    name: 'North',
    shortName: 'North',
    subtitle: 'Lifestyle value & scenic living',
    icon: Trees,
    cities: [
      { name: 'Zichron Yaakov', slug: 'zichron-yaakov', image: zichronYaakovImg, description: 'Zichron Yaakov is a historic town on the Carmel coast...', tags: ['Wine country', 'Historic charm'] },
      { name: 'Pardes Hanna', slug: 'pardes-hanna', image: pardesHannaImg, description: 'Pardes Hanna offers quiet, affordable living in the north...', tags: ['Quiet living', 'Value north'] },
    ],
  },
  {
    id: 'south',
    name: 'South',
    shortName: 'South',
    subtitle: 'Affordable frontier & resort living',
    icon: Heart,
    cities: [
      { name: 'Ashkelon', slug: 'ashkelon', image: ashkelonImg, description: 'Coastal city with beaches and affordable housing options...', tags: ['Coastal affordable', 'Beach lifestyle'] },
      { name: 'Beer Sheva', slug: 'beer-sheva', image: beerShevaImg, description: 'Capital of the Negev with university and tech growth...', tags: ['Negev capital', 'Tech growth'] },
      { name: 'Eilat', slug: 'eilat', image: eilatImg, description: 'Resort city on the Red Sea with unique lifestyle...', tags: ['Resort living', 'Tax benefits'] },
    ],
  },
];

// Tag color mapping
const tagColors: Record<string, string> = {
  'Urban premium': 'bg-primary/10 text-primary',
  'Limited supply': 'bg-destructive/10 text-destructive',
  'Coastal premium': 'bg-primary/10 text-primary',
  'High demand': 'bg-warning/20 text-warning-foreground',
  'Affordable': 'bg-success/10 text-success',
  'Affordable coast': 'bg-success/10 text-success',
  'Family city': 'bg-accent/20 text-accent-foreground',
  'Family-oriented': 'bg-accent/20 text-accent-foreground',
  'Growing community': 'bg-success/10 text-success',
  'Rapid growth': 'bg-success/10 text-success',
  'Luxury market': 'bg-primary/10 text-primary',
  'Tech hub north': 'bg-primary/10 text-primary',
  'Tech growth': 'bg-primary/10 text-primary',
  'Resort living': 'bg-accent/20 text-accent-foreground',
  'Wine country': 'bg-accent/20 text-accent-foreground',
};

function RegionQuickNav({ 
  regions, 
  activeRegion, 
  onRegionClick 
}: { 
  regions: Region[]; 
  activeRegion: string; 
  onRegionClick: (id: string) => void;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background/95 backdrop-blur-md border-b border-border py-4"
    >
      <div className="container">
        <div className="flex items-center justify-center gap-3 md:gap-6 overflow-x-auto scrollbar-hide pb-1">
          {regions.map((region) => {
            const Icon = region.icon;
            const isActive = activeRegion === region.id;
            
            return (
              <button
                key={region.id}
                onClick={() => onRegionClick(region.id)}
                className={`flex flex-col items-center gap-2 min-w-[80px] transition-all duration-200 group ${
                  isActive ? 'scale-105' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                }`}>
                  <Icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <span className={`text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }`}>
                  {region.shortName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function CityCard({ city, index }: { city: City; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/areas/${city.slug}`}
        className="flex-shrink-0 w-[300px] group block"
      >
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50">
          {/* Image */}
          <div className="aspect-[16/10] overflow-hidden relative">
            <img
              src={city.image}
              alt={city.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {city.name}
              </h3>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
              {city.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {city.tags.map((tag) => (
                <span 
                  key={tag} 
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    tagColors[tag] || 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function RegionCarousel({ region, index }: { region: Region; index: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isScrollable, setIsScrollable] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      setIsScrollable(maxScroll > 10);
      setScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < maxScroll - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  const Icon = region.icon;

  return (
    <motion.section
      id={region.id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="scroll-mt-36"
    >
      <div className="bg-gradient-to-br from-muted/50 via-muted/30 to-transparent rounded-3xl p-6 md:p-10">
        {/* Region Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {region.name}
            </h2>
            <p className="text-muted-foreground">{region.subtitle}</p>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Left Arrow */}
          {isScrollable && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: canScrollLeft ? 1 : 0.4, scale: 1 }}
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-background rounded-full shadow-xl flex items-center justify-center transition-all -ml-4 border border-border ${
                canScrollLeft ? 'hover:bg-primary hover:text-primary-foreground cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="h-6 w-6" />
            </motion.button>
          )}

          {/* Right Arrow */}
          {isScrollable && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: canScrollRight ? 1 : 0.4, scale: 1 }}
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-background rounded-full shadow-xl flex items-center justify-center transition-all -mr-4 border border-border ${
                canScrollRight ? 'hover:bg-primary hover:text-primary-foreground cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              <ChevronRight className="h-6 w-6" />
            </motion.button>
          )}

          {/* Cities */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {region.cities.map((city, cityIndex) => (
              <div key={city.slug} className="snap-start">
                <CityCard city={city} index={cityIndex} />
              </div>
            ))}
          </div>

          {/* Progress Indicator - only show when scrollable */}
          {isScrollable && (
            <div className="mt-4 flex justify-center">
              <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.max(20, scrollProgress * 100)}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

export default function Areas() {
  useTrackContentVisit('area');
  const [activeRegion, setActiveRegion] = useState(regions[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter cities based on search with fuzzy matching
  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) return regions;
    
    const query = searchQuery.toLowerCase();
    return regions.map(region => ({
      ...region,
      cities: region.cities.filter(city => 
        cityMatchesQuery(city.name, searchQuery) ||
        city.tags.some(tag => tag.toLowerCase().includes(query))
      )
    })).filter(region => region.cities.length > 0);
  }, [searchQuery]);

  // Update active region on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = regions.map(r => document.getElementById(r.id));
      const scrollPos = window.scrollY + 200;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPos) {
          setActiveRegion(regions[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRegionClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveRegion(id);
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Explore Cities & Neighborhoods in Israel | BuyWise Israel"
        description="Discover Israel's cities and neighborhoods. Compare prices, learn about communities, and find the perfect area for your property search."
        canonicalUrl="https://buywiseisrael.com/areas"
      />
      
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-primary/5 via-primary/5 to-transparent">
        <div className="container pt-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Explore Market Environments
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Understand the buying landscape before you search. Each city page breaks down pricing, yields, and market dynamics.
            </p>
            
            {/* Search Input */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search cities or neighborhoods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 rounded-full border-border/50 bg-background shadow-sm"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Nav */}
      <RegionQuickNav 
        regions={regions} 
        activeRegion={activeRegion} 
        onRegionClick={handleRegionClick} 
      />

      {/* Region Sections */}
      <div className="container py-8 space-y-10">
        <AnimatePresence mode="wait">
          {filteredRegions.length > 0 ? (
            filteredRegions.map((region, index) => (
              <RegionCarousel key={region.id} region={region} index={index} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <p className="text-muted-foreground text-lg">No cities found matching "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 text-primary hover:underline"
              >
                Clear search
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
