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
      { name: 'Tel Aviv', slug: 'tel-aviv', image: telAvivImg, description: "Tel Aviv is Israel's most competitive market — limited supply, urban premium, and the benchmark everything else is measured against." },
      { name: 'Herzliya', slug: 'herzliya', image: herzliyaImg, description: "Herzliya is where Israel's tech elite lives — premium coastal real estate driven by Silicon Wadi proximity." },
      { name: 'Netanya', slug: 'netanya', image: netanyaImg, description: "Netanya is Israel's most popular Anglo coastal city — oceanfront living with a wide range of price points and a large English-speaking community." },
      { name: 'Haifa', slug: 'haifa', image: haifaImg, description: "Haifa is Israel's most undervalued major city — world-class tech, top universities, and waterfront living at a fraction of Tel Aviv prices." },
      { name: 'Ramat Gan', slug: 'ramat-gan', image: ramatGanImg, description: "Ramat Gan is Tel Aviv's practical neighbor — the Diamond Exchange district, high-rise renewal, and metro access without the Tel Aviv premium." },
      { name: 'Ashdod', slug: 'ashdod', image: ashdodImg, description: "Ashdod is where affordability meets the Mediterranean — a port city investing heavily in infrastructure, with prices that still leave room for growth." },
    ],
  },
  {
    id: 'central',
    name: 'Central',
    shortName: 'Central',
    subtitle: 'Family suburbs, Jerusalem area & growing communities',
    icon: Building,
    cities: [
      { name: "Ra'anana", slug: 'raanana', image: raananaImg, description: "Ra'anana is the gold standard for Anglo suburban life — top schools, walkable center, and a mature market with premium pricing to match." },
      { name: 'Kfar Saba', slug: 'kfar-saba', image: kfarSabaImg, description: "Kfar Saba offers suburban living at more moderate prices — a family-first city with good schools and a growing commercial center." },
      { name: "Modi'in", slug: 'modiin', image: modiinImg, description: "Modi'in is a planned city between Jerusalem and Tel Aviv — modern infrastructure, young families, and a layout designed from scratch." },
      { name: 'Givat Shmuel', slug: 'givat-shmuel', image: givatShmuelImg, description: "Givat Shmuel is a compact Central District suburb punching above its weight — strong demand driving steady appreciation." },
      { name: 'Hod HaSharon', slug: 'hod-hasharon', image: hodHasharonImg, description: "Hod HaSharon is a suburb families move to and stay in — top schools, good train access, and a track record of steady appreciation." },
      { name: 'Petah Tikva', slug: 'petah-tikva', image: petahTikvaImg, description: "Petah Tikva is Israel's first agricultural colony turned major city — diverse neighborhoods ranging from historic to high-rise renewal." },
      { name: 'Hadera', slug: 'hadera', image: haderaImg, description: "Hadera is a train-connected coastal city offering some of the best value between Tel Aviv and Haifa — still early in its growth story." },
      { name: 'Caesarea', slug: 'caesarea', image: caesareaImg, description: "Caesarea is Israel's most exclusive residential address — a small, gated community with premium pricing and a lifestyle unlike anywhere else." },
      { name: 'Jerusalem', slug: 'jerusalem', image: jerusalemImg, description: "Jerusalem is a city like no other — deeply diverse neighborhoods, strong Anglo communities, and a market driven by significance as much as economics." },
      { name: 'Beit Shemesh', slug: 'beit-shemesh', image: beitShemeshImg, description: "Beit Shemesh is booming between Jerusalem and Tel Aviv — large Anglo and religious communities with some of Israel's biggest new housing projects." },
      { name: 'Efrat', slug: 'efrat', image: efratImg, description: "Efrat is one of Israel's strongest Anglo communities — a close-knit Judean Hills town with excellent schools and English as a daily language." },
      { name: 'Gush Etzion', slug: 'gush-etzion', image: gushEtzionImg, description: "Gush Etzion is a collection of close-knit communities in the Judean Hills — strong Anglo presence, affordable family homes, and a nature-rich lifestyle." },
      { name: "Ma'ale Adumim", slug: 'maale-adumim', image: maaleAdumimImg, description: "Ma'ale Adumim is Jerusalem's largest suburb — established infrastructure, desert views, and significantly lower prices than the capital itself." },
      { name: 'Mevaseret Zion', slug: 'mevaseret-zion', image: mevaseretZionImg, description: "Mevaseret Zion is an upscale green suburb at Jerusalem's western gate — nature access, quality of life, and a short commute to the city." },
    ],
  },
  {
    id: 'north',
    name: 'North',
    shortName: 'North',
    subtitle: 'Lifestyle value & scenic living',
    icon: Trees,
    cities: [
      { name: 'Zichron Yaakov', slug: 'zichron-yaakov', image: zichronYaakovImg, description: "Zichron Yaakov is Israel's wine country gem — a historic hilltop town with boutique character and Carmel coast views." },
      { name: 'Pardes Hanna', slug: 'pardes-hanna', image: pardesHannaImg, description: "Pardes Hanna is a quiet, affordable alternative in the north — a laid-back community attracting young families priced out of the center." },
    ],
  },
  {
    id: 'south',
    name: 'South',
    shortName: 'South',
    subtitle: 'Affordable frontier & resort living',
    icon: Heart,
    cities: [
      { name: 'Ashkelon', slug: 'ashkelon', image: ashkelonImg, description: "Ashkelon offers Israel's best value for beachfront living — a laid-back southern city where your budget stretches further without giving up the coastline." },
      { name: 'Beer Sheva', slug: 'beer-sheva', image: beerShevaImg, description: "Beer Sheva is Israel's most affordable major city — a university-driven tech hub where significant government investment is reshaping the Negev capital." },
      { name: 'Eilat', slug: 'eilat', image: eilatImg, description: "Eilat is a VAT-free resort city at Israel's southern tip — popular with vacation-home buyers and rental investors, but a very different market from the center." },
    ],
  },
];


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
              Know Your Market Before You Buy
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The numbers behind every city, laid out clearly so you can buy with confidence.
            </p>
            
            {/* Search Input */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search cities..."
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
