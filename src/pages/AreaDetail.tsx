import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, TrendingUp, Loader2, BarChart3, Target, Eye, Calculator } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCity } from '@/hooks/useCities';
import { useProperties } from '@/hooks/useProperties';
import { useMarketData } from '@/hooks/useMarketData';
import { useCanonicalMetrics } from '@/hooks/useCanonicalMetrics';
// Market Dashboard Components
import { MarketStatsCards } from '@/components/city/MarketStatsCards';
import { PriceTrendChart } from '@/components/city/PriceTrendChart';
import { MarketRealityTabs } from '@/components/city/MarketRealityTabs';
import { CityCalculators } from '@/components/city/CityCalculators';
import { ListingsCTA } from '@/components/city/ListingsCTA';
import { WorthWatchingGrid, MarketFactor } from '@/components/city/WorthWatchingGrid';

// Worth Watching data per city
const cityMarketFactors: Record<string, MarketFactor[]> = {
  'tel-aviv': [
    {
      title: 'Red Line Light Rail Opening',
      description: 'First metro line will transform transit and boost areas near stations',
      icon: 'transit',
    },
    {
      title: 'Tama 38 Policy Changes',
      description: 'Proposed limits on urban renewal could reduce new supply',
      icon: 'policy',
    },
    {
      title: 'Port Area Redevelopment',
      description: 'New towers and public spaces coming to northern waterfront',
      icon: 'development',
    },
  ],
  'jerusalem': [
    {
      title: 'Blue Line Extension',
      description: 'Light rail expansion connecting more neighborhoods to city center',
      icon: 'transit',
    },
    {
      title: 'Talpiot Industrial Zone',
      description: 'Major rezoning for mixed-use development underway',
      icon: 'zoning',
    },
    {
      title: 'American Embassy Impact',
      description: 'Continued investment in Arnona and surrounding areas',
      icon: 'infrastructure',
    },
  ],
  'haifa': [
    {
      title: 'Tech Hub Expansion',
      description: 'Growing high-tech presence driving demand for housing',
      icon: 'development',
    },
    {
      title: 'Haifa Bay Development',
      description: 'Major waterfront transformation with new residential towers',
      icon: 'infrastructure',
    },
    {
      title: 'Carmelit Renovation',
      description: 'Underground railway modernization improving connectivity',
      icon: 'transit',
    },
  ],
  'herzliya': [
    {
      title: 'Herzliya Pituach Growth',
      description: 'Continued high-tech expansion driving premium housing demand',
      icon: 'development',
    },
    {
      title: 'Marina Development',
      description: 'New luxury residential and commercial projects on waterfront',
      icon: 'infrastructure',
    },
    {
      title: 'Highway 2 Improvements',
      description: 'Better access to Tel Aviv increasing commuter appeal',
      icon: 'transit',
    },
  ],
  'raanana': [
    {
      title: 'Tech Park Expansion',
      description: 'New office towers bringing more high-income residents',
      icon: 'development',
    },
    {
      title: 'Rail Connection Plans',
      description: 'Proposed light rail to Tel Aviv could boost property values',
      icon: 'transit',
    },
    {
      title: 'School District Excellence',
      description: 'Top-rated schools continuing to attract families',
      icon: 'policy',
    },
  ],
};

// City Images (card size)
import telAvivImg from '@/assets/cities/tel-aviv.jpg';
import herzliyaImg from '@/assets/cities/herzliya.jpg';
import netanyaImg from '@/assets/cities/netanya.jpg';
import haifaImg from '@/assets/cities/haifa.jpg';
import jerusalemImg from '@/assets/cities/jerusalem.jpg';
import raananaImg from '@/assets/cities/raanana.jpg';
import kfarSabaImg from '@/assets/cities/kfar-saba.jpg';
import modiiinImg from '@/assets/cities/modiin.jpg';
import ashdodImg from '@/assets/cities/ashdod.jpg';
import ashkelonImg from '@/assets/cities/ashkelon.jpg';
import beerShevaImg from '@/assets/cities/beer-sheva.jpg';
import eilatImg from '@/assets/cities/eilat.jpg';
import ramatGanImg from '@/assets/cities/ramat-gan.jpg';
import givatayimImg from '@/assets/cities/givatayim.jpg';
import petahTikvaImg from '@/assets/cities/petah-tikva.jpg';
import holonImg from '@/assets/cities/holon.jpg';
import batYamImg from '@/assets/cities/bat-yam.jpg';
import roshHaayinImg from '@/assets/cities/rosh-haayin.jpg';
import hodHasharonImg from '@/assets/cities/hod-hasharon.jpg';
import shohamImg from '@/assets/cities/shoham.jpg';
import givatShmuelImg from '@/assets/cities/givat-shmuel.jpg';
import caesareaImg from '@/assets/cities/caesarea.jpg';
import zichronYaakovImg from '@/assets/cities/zichron-yaakov.jpg';
import pardesHannaImg from '@/assets/cities/pardes-hanna.jpg';
import kiryatTivonImg from '@/assets/cities/kiryat-tivon.jpg';
import yokneamImg from '@/assets/cities/yokneam.jpg';
import haderaImg from '@/assets/cities/hadera.jpg';
import nahariyaImg from '@/assets/cities/nahariya.jpg';
import beitShemeshImg from '@/assets/cities/beit-shemesh.jpg';
import mevasseretZionImg from '@/assets/cities/mevaseret-zion.jpg';
import efratImg from '@/assets/cities/efrat.jpg';
import gushEtzionImg from '@/assets/cities/gush-etzion.jpg';
import maaleAdumimImg from '@/assets/cities/maale-adumim.jpg';
import givatZeevImg from '@/assets/cities/givat-zeev.jpg';

// Hero Images (high resolution 1920x800)
import telAvivHeroImg from '@/assets/cities/hero/tel-aviv.jpg';
import herzliyaHeroImg from '@/assets/cities/hero/herzliya.jpg';
import netanyaHeroImg from '@/assets/cities/hero/netanya.jpg';
import haifaHeroImg from '@/assets/cities/hero/haifa.jpg';
import jerusalemHeroImg from '@/assets/cities/hero/jerusalem.jpg';
import raananaHeroImg from '@/assets/cities/hero/raanana.jpg';
import kfarSabaHeroImg from '@/assets/cities/hero/kfar-saba.jpg';
import modiinHeroImg from '@/assets/cities/hero/modiin.jpg';
import ashdodHeroImg from '@/assets/cities/hero/ashdod.jpg';
import ashkelonHeroImg from '@/assets/cities/hero/ashkelon.jpg';
import beerShevaHeroImg from '@/assets/cities/hero/beer-sheva.jpg';
import eilatHeroImg from '@/assets/cities/hero/eilat.jpg';
import ramatGanHeroImg from '@/assets/cities/hero/ramat-gan.jpg';
import givatayimHeroImg from '@/assets/cities/hero/givatayim.jpg';
import petahTikvaHeroImg from '@/assets/cities/hero/petah-tikva.jpg';
import holonHeroImg from '@/assets/cities/hero/holon.jpg';
import batYamHeroImg from '@/assets/cities/hero/bat-yam.jpg';
import roshHaayinHeroImg from '@/assets/cities/hero/rosh-haayin.jpg';
import hodHasharonHeroImg from '@/assets/cities/hero/hod-hasharon.jpg';
import shohamHeroImg from '@/assets/cities/hero/shoham.jpg';
import givatShmuelHeroImg from '@/assets/cities/hero/givat-shmuel.jpg';
import caesareaHeroImg from '@/assets/cities/hero/caesarea.jpg';
import zichronYaakovHeroImg from '@/assets/cities/hero/zichron-yaakov.jpg';
import pardesHannaHeroImg from '@/assets/cities/hero/pardes-hanna.jpg';
import kiryatTivonHeroImg from '@/assets/cities/hero/kiryat-tivon.jpg';
import yokneamHeroImg from '@/assets/cities/hero/yokneam.jpg';
import haderaHeroImg from '@/assets/cities/hero/hadera.jpg';
import nahariyaHeroImg from '@/assets/cities/hero/nahariya.jpg';
import beitShemeshHeroImg from '@/assets/cities/hero/beit-shemesh.jpg';
import mevasseretZionHeroImg from '@/assets/cities/hero/mevaseret-zion.jpg';
import efratHeroImg from '@/assets/cities/hero/efrat.jpg';
import gushEtzionHeroImg from '@/assets/cities/hero/gush-etzion.jpg';
import maaleAdumimHeroImg from '@/assets/cities/hero/maale-adumim.jpg';
import givatZeevHeroImg from '@/assets/cities/hero/givat-zeev.jpg';

// Slug to card image mapping (for smaller uses)
const cityImages: Record<string, string> = {
  'tel-aviv': telAvivImg,
  'herzliya': herzliyaImg,
  'netanya': netanyaImg,
  'haifa': haifaImg,
  'jerusalem': jerusalemImg,
  'raanana': raananaImg,
  'kfar-saba': kfarSabaImg,
  'modiin': modiiinImg,
  'ashdod': ashdodImg,
  'ashkelon': ashkelonImg,
  'beer-sheva': beerShevaImg,
  'eilat': eilatImg,
  'ramat-gan': ramatGanImg,
  'givatayim': givatayimImg,
  'petah-tikva': petahTikvaImg,
  'holon': holonImg,
  'bat-yam': batYamImg,
  'rosh-haayin': roshHaayinImg,
  'hod-hasharon': hodHasharonImg,
  'shoham': shohamImg,
  'givat-shmuel': givatShmuelImg,
  'caesarea': caesareaImg,
  'zichron-yaakov': zichronYaakovImg,
  'pardes-hanna': pardesHannaImg,
  'kiryat-tivon': kiryatTivonImg,
  'yokneam': yokneamImg,
  'hadera': haderaImg,
  'nahariya': nahariyaImg,
  'beit-shemesh': beitShemeshImg,
  'mevaseret-zion': mevasseretZionImg,
  'efrat': efratImg,
  'gush-etzion': gushEtzionImg,
  'maale-adumim': maaleAdumimImg,
  'givat-zeev': givatZeevImg,
};

// Slug to hero image mapping (high resolution for hero banners)
const cityHeroImages: Record<string, string> = {
  'tel-aviv': telAvivHeroImg,
  'herzliya': herzliyaHeroImg,
  'netanya': netanyaHeroImg,
  'haifa': haifaHeroImg,
  'jerusalem': jerusalemHeroImg,
  'raanana': raananaHeroImg,
  'kfar-saba': kfarSabaHeroImg,
  'modiin': modiinHeroImg,
  'ashdod': ashdodHeroImg,
  'ashkelon': ashkelonHeroImg,
  'beer-sheva': beerShevaHeroImg,
  'eilat': eilatHeroImg,
  'ramat-gan': ramatGanHeroImg,
  'givatayim': givatayimHeroImg,
  'petah-tikva': petahTikvaHeroImg,
  'holon': holonHeroImg,
  'bat-yam': batYamHeroImg,
  'rosh-haayin': roshHaayinHeroImg,
  'hod-hasharon': hodHasharonHeroImg,
  'shoham': shohamHeroImg,
  'givat-shmuel': givatShmuelHeroImg,
  'caesarea': caesareaHeroImg,
  'zichron-yaakov': zichronYaakovHeroImg,
  'pardes-hanna': pardesHannaHeroImg,
  'kiryat-tivon': kiryatTivonHeroImg,
  'yokneam': yokneamHeroImg,
  'hadera': haderaHeroImg,
  'nahariya': nahariyaHeroImg,
  'beit-shemesh': beitShemeshHeroImg,
  'mevaseret-zion': mevasseretZionHeroImg,
  'efrat': efratHeroImg,
  'gush-etzion': gushEtzionHeroImg,
  'maale-adumim': maaleAdumimHeroImg,
  'givat-zeev': givatZeevHeroImg,
};

export default function CityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: city, isLoading: cityLoading, error } = useCity(slug || '');
  const { data: properties = [], isLoading: propertiesLoading } = useProperties(
    city ? { city: city.name } : undefined
  );
  const { data: marketData = [], isLoading: marketLoading } = useMarketData(city?.name);
  const { data: canonicalMetrics } = useCanonicalMetrics(slug || '');

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatPopulation = (pop: number | null) => {
    if (!pop) return 'N/A';
    if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)} million`;
    if (pop >= 1000) return `${(pop / 1000).toFixed(0)}K`;
    return pop.toString();
  };

  const getWorthWatching = (): MarketFactor[] => {
    return cityMarketFactors[slug || ''] || [];
  };

  const getMarketTagline = () => {
    if (marketData.length === 0) return null;
    const latestPrice = marketData[0]?.average_price_sqm || 0;
    const nationalAvg = 32000;
    const percentAbove = ((latestPrice - nationalAvg) / nationalAvg) * 100;
    
    if (percentAbove > 50) return `${percentAbove.toFixed(0)}% above national average — Israel's premium market`;
    if (percentAbove > 20) return `${percentAbove.toFixed(0)}% above national average — Strong market`;
    if (percentAbove > 0) return `${percentAbove.toFixed(0)}% above national average`;
    if (percentAbove > -20) return 'Competitive pricing — Great value market';
    return 'Affordable market — Below national average';
  };

  if (cityLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !city) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">City not found</h1>
          <p className="text-muted-foreground mb-6">
            The city you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link to="/areas">Browse All Cities</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const worthWatching = getWorthWatching();
  const marketTagline = getMarketTagline();

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative h-[45vh] min-h-[350px]">
          <img
            src={cityHeroImages[slug || ''] || cityImages[slug || ''] || city.hero_image || 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1920'}
            alt={city.name}
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 mb-4" asChild>
                <Link to="/areas">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  All Cities
                </Link>
              </Button>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">{city.name}</h1>
              
              {/* Market Tagline */}
              {marketTagline && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg text-white/90 font-medium mb-4"
                >
                  {marketTagline}
                </motion.p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-white/80">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">{formatPopulation(city.population)}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Avg. {formatPrice(city.average_price)}</span>
                </div>
                {city.highlights && city.highlights.length > 0 && (
                  <div className="hidden sm:flex items-center gap-2">
                    {city.highlights.slice(0, 3).map((highlight, index) => (
                      <Badge key={index} variant="secondary" className="bg-white/10 text-white border-0 backdrop-blur-sm">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Interactive Dashboard */}
        <div className="space-y-0">
          {/* Section 1: Market Stats - White background */}
          <div className="bg-background py-10">
            <div className="container">
              {marketLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <MarketStatsCards 
                  marketData={marketData} 
                  cityName={city.name}
                  citySlug={slug}
                  canonicalMetrics={canonicalMetrics}
                  cityData={{
                    average_price_sqm: city.average_price_sqm,
                    median_apartment_price: city.median_apartment_price,
                    yoy_price_change: city.yoy_price_change,
                    rental_3_room_min: city.rental_3_room_min,
                    rental_3_room_max: city.rental_3_room_max,
                    rental_4_room_min: city.rental_4_room_min,
                    rental_4_room_max: city.rental_4_room_max,
                  }}
                />
              )}
            </div>
          </div>

          {/* Section 2: Price History & Market Reality - Two column on desktop, muted background */}
          {marketData.length > 0 && (
            <div className="bg-muted/40 py-10">
              <div className="container">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* Price History - Takes 3/5 on large screens */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold text-foreground">Price History & Trends</h2>
                    </div>
                    <PriceTrendChart marketData={marketData} cityName={city.name} />
                  </div>

                  {/* Market Reality - Takes 2/5 on large screens */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold text-foreground">Market Reality</h2>
                    </div>
                    <MarketRealityTabs 
                      marketData={marketData} 
                      cityName={city.name}
                      citySlug={slug}
                      arnonaRateSqm={city.arnona_rate_sqm}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Worth Watching - White background */}
          {worthWatching.length > 0 && (
            <div className="bg-background py-10">
              <div className="container space-y-4">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">What to Watch in {city.name}</h2>
                </div>
                <WorthWatchingGrid factors={worthWatching} cityName={city.name} />
              </div>
            </div>
          )}

          {/* Section 4: Run the Numbers - Muted background */}
          <div className="bg-muted/40 py-10">
            <div className="container space-y-4">
              <div className="flex items-center gap-3">
                <Calculator className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Run the Numbers</h2>
              </div>
              <CityCalculators cityName={city.name} averagePrice={city.average_price || undefined} />
            </div>
          </div>

          {/* Section 5: Browse Listings CTA - White background */}
          <div className="bg-background py-10">
            <div className="container">
              <ListingsCTA cityName={city.name} propertiesCount={properties.length} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
