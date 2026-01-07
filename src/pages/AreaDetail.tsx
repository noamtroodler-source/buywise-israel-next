import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, BarChart3 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCity } from '@/hooks/useCities';
import { useProperties } from '@/hooks/useProperties';
import { useMarketData } from '@/hooks/useMarketData';
import { useCanonicalMetrics } from '@/hooks/useCanonicalMetrics';
import { useHistoricalPrices } from '@/hooks/useHistoricalPrices';

// City Page Components
import { CityHeroStats } from '@/components/city/CityHeroStats';
import { CityMarketSnapshot } from '@/components/city/CityMarketSnapshot';
import { CityLivingCosts } from '@/components/city/CityLivingCosts';
import { CityWorthWatching, MarketFactor } from '@/components/city/CityWorthWatching';
import { CityCalculatorsCompact } from '@/components/city/CityCalculatorsCompact';
import { CityListingsCTA } from '@/components/city/CityListingsCTA';
import { PriceTrendChartSimple } from '@/components/city/PriceTrendChartSimple';
import { CityFeaturedProperties } from '@/components/city/CityFeaturedProperties';

// Worth Watching data per city (curated content for major cities)
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

// Slug to card image mapping
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

// Slug to hero image mapping
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
  const { data: properties = [] } = useProperties(city ? { city: city.name } : undefined);
  const { data: marketData = [], isLoading: marketLoading } = useMarketData(city?.name);
  const { data: canonicalMetrics } = useCanonicalMetrics(slug || '');
  const { data: historicalPrices = [] } = useHistoricalPrices(slug || '', 10);

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

  const worthWatching = cityMarketFactors[slug || ''] || [];

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section - Compact with Stats Bar */}
        <div className="relative h-[40vh] min-h-[320px]">
          <img
            src={cityHeroImages[slug || ''] || cityImages[slug || ''] || city.hero_image || 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1920'}
            alt={city.name}
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="container">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 mb-3 -ml-2" asChild>
                <Link to="/areas">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  All Cities
                </Link>
              </Button>
              
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2"
              >
                {city.name}
              </motion.h1>
              
              {/* Highlights badges */}
              {city.highlights && city.highlights.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-wrap gap-2 mb-3"
                >
                  {city.highlights.slice(0, 4).map((highlight, index) => (
                    <Badge key={index} variant="secondary" className="bg-white/15 text-white border-0 backdrop-blur-sm text-xs">
                      {highlight}
                    </Badge>
                  ))}
                </motion.div>
              )}
              
              {/* Stats Pills */}
              <CityHeroStats
                population={city.population}
                averagePriceSqm={canonicalMetrics?.average_price_sqm || city.average_price_sqm}
                yoyChange={canonicalMetrics?.yoy_price_change || city.yoy_price_change}
                investmentScore={city.investment_score}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-0">
          {/* Section 1: Market Snapshot - White */}
          <section className="bg-background py-10">
            <div className="container">
              {marketLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <CityMarketSnapshot
                  marketData={marketData}
                  cityName={city.name}
                  canonicalMetrics={canonicalMetrics}
                  cityData={{
                    average_price_sqm: city.average_price_sqm,
                    median_apartment_price: city.median_apartment_price,
                    yoy_price_change: city.yoy_price_change,
                    rental_3_room_min: city.rental_3_room_min,
                    rental_3_room_max: city.rental_3_room_max,
                  }}
                  historicalPrices={historicalPrices}
                />
              )}
            </div>
          </section>

          {/* Section 2: Price Trend Chart - Muted */}
          {marketData.length > 0 && (
            <section className="bg-muted/40 py-10">
              <div className="container">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Price History</h2>
                </div>
                <PriceTrendChartSimple marketData={marketData} cityName={city.name} />
              </div>
            </section>
          )}

          {/* Section 3: Living Costs - White */}
          {(city.arnona_rate_sqm || city.commute_time_tel_aviv !== null || city.anglo_presence) && (
            <section className="bg-background py-10">
              <div className="container">
                <CityLivingCosts
                  arnonaRateSqm={city.arnona_rate_sqm}
                  commuteTelAviv={city.commute_time_tel_aviv}
                  hasTrainStation={city.has_train_station}
                  angloPresence={city.anglo_presence}
                  cityName={city.name}
                />
              </div>
            </section>
          )}

          {/* Section 4: What to Watch - Muted */}
          <section className="bg-muted/40 py-10">
            <div className="container">
              <CityWorthWatching
                factors={worthWatching}
                cityName={city.name}
                cityData={{
                  yoy_price_change: city.yoy_price_change,
                  investment_score: city.investment_score,
                  has_train_station: city.has_train_station,
                  anglo_presence: city.anglo_presence,
                  gross_yield_percent: city.gross_yield_percent,
                }}
              />
            </div>
          </section>

          {/* Section 5: Run the Numbers - White */}
          <section className="bg-background py-10">
            <div className="container">
              <CityCalculatorsCompact cityName={city.name} averagePrice={city.average_price || undefined} />
            </div>
          </section>

          {/* Section 6: Browse Listings CTA - Muted */}
          <section className="bg-muted/40 py-10">
            <div className="container">
              <CityListingsCTA cityName={city.name} propertiesCount={properties.length} />
            </div>
          </section>

          {/* Section 7: Featured Properties Grid */}
          <CityFeaturedProperties cityName={city.name} citySlug={slug || ''} />
        </div>
      </div>
    </Layout>
  );
}
