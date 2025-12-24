import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, TrendingUp, Loader2, BarChart3, Target, Eye, Calculator, Info } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCity } from '@/hooks/useCities';
import { useProperties } from '@/hooks/useProperties';
import { useMarketData } from '@/hooks/useMarketData';
// Market Dashboard Components
import { MarketStatsCards } from '@/components/city/MarketStatsCards';
import { PriceTrendChart } from '@/components/city/PriceTrendChart';
import { MarketRealityTabs } from '@/components/city/MarketRealityTabs';
import { CityCalculators } from '@/components/city/CityCalculators';
import { ListingsCTA } from '@/components/city/ListingsCTA';
import { WorthWatchingGrid, MarketFactor } from '@/components/city/WorthWatchingGrid';
import { CollapsibleSection } from '@/components/property/CollapsibleSection';
// New City Info Components
import { CityArnonaCard } from '@/components/city/CityArnonaCard';
import { CityTransportInfo } from '@/components/city/CityTransportInfo';

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

// City Images
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

// Slug to image mapping
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

export default function CityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: city, isLoading: cityLoading, error } = useCity(slug || '');
  const { data: properties = [], isLoading: propertiesLoading } = useProperties(
    city ? { city: city.name } : undefined
  );
  const { data: marketData = [], isLoading: marketLoading } = useMarketData(city?.name);

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
            src={cityImages[slug || ''] || city.hero_image || 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1920'}
            alt={city.name}
            className="w-full h-full object-cover"
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
        <div className="container py-8 space-y-6">
          {/* Market Stats Cards - Always visible */}
          {marketLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <MarketStatsCards 
              marketData={marketData} 
              cityName={city.name}
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

          {/* Price History & Trends - Collapsible, default open */}
          {marketData.length > 0 && (
            <CollapsibleSection 
              title="Price History & Trends" 
              icon={<BarChart3 className="h-5 w-5" />}
              defaultOpen={true}
            >
              <PriceTrendChart marketData={marketData} cityName={city.name} />
            </CollapsibleSection>
          )}

          {/* Market Reality - Collapsible, default open */}
          {marketData.length > 0 && (
            <CollapsibleSection 
              title="Market Reality Check" 
              icon={<Target className="h-5 w-5" />}
              defaultOpen={true}
            >
              <MarketRealityTabs 
                marketData={marketData} 
                cityName={city.name}
                propertiesCount={properties.length}
                grossYieldPercent={city.gross_yield_percent}
                netYieldPercent={city.net_yield_percent}
                investmentScore={city.investment_score}
              />
            </CollapsibleSection>
          )}

          {/* City Info Cards Row */}
          <CollapsibleSection 
            title="City Living Info" 
            icon={<Info className="h-5 w-5" />}
            defaultOpen={true}
          >
            <div className="grid md:grid-cols-2 gap-4">
              <CityArnonaCard 
                arnonaRateSqm={city.arnona_rate_sqm}
                arnonaMonthlyAvg={city.arnona_monthly_avg}
                cityName={city.name}
              />
              <CityTransportInfo 
                commuteTimeTelAviv={city.commute_time_tel_aviv}
                hasTrainStation={city.has_train_station}
                cityName={city.name}
              />
            </div>
          </CollapsibleSection>

          {/* Worth Watching - Collapsible, default open */}
          {worthWatching.length > 0 && (
            <CollapsibleSection 
              title={`What to Watch in ${city.name}`}
              icon={<Eye className="h-5 w-5" />}
              defaultOpen={true}
            >
              <WorthWatchingGrid factors={worthWatching} cityName={city.name} />
            </CollapsibleSection>
          )}

          {/* Run the Numbers - Collapsible, default open */}
          <CollapsibleSection 
            title="Run the Numbers" 
            icon={<Calculator className="h-5 w-5" />}
            defaultOpen={true}
          >
            <CityCalculators cityName={city.name} averagePrice={city.average_price || undefined} />
          </CollapsibleSection>

          {/* Browse Listings CTA - Always visible */}
          <ListingsCTA cityName={city.name} propertiesCount={properties.length} />
        </div>
      </div>
    </Layout>
  );
}
