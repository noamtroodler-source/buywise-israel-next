import { useParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCity } from '@/hooks/useCities';
import { useProperties } from '@/hooks/useProperties';
import { useMarketData } from '@/hooks/useMarketData';
import { useCanonicalMetrics } from '@/hooks/useCanonicalMetrics';
import { useHistoricalPrices } from '@/hooks/useHistoricalPrices';

// Redesigned components
import { CityHero } from '@/components/city/CityHero';
import { CityQuickStats } from '@/components/city/CityQuickStats';
import { CityStory } from '@/components/city/CityStory';
import { MarketRealityTabs } from '@/components/city/MarketRealityTabs';
import { CityMarketReality } from '@/components/city/CityMarketReality';
import { CityWorthWatchingNew, MarketFactor } from '@/components/city/CityWorthWatchingNew';
import { CityCalculatorTeaser } from '@/components/city/CityCalculatorTeaser';
import { CityExploreListings } from '@/components/city/CityExploreListings';
import { CityFeaturedProperties } from '@/components/city/CityFeaturedProperties';

// Worth Watching data per city
const cityMarketFactors: Record<string, MarketFactor[]> = {
  'tel-aviv': [
    {
      title: 'Red Line Light Rail Opening',
      description: 'First metro line will transform transit and boost areas near stations',
      icon: 'transit',
      timing: '2025',
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
      timing: 'In Progress',
    },
  ],
  'jerusalem': [
    {
      title: 'Blue Line Extension',
      description: 'Light rail expansion connecting more neighborhoods to city center',
      icon: 'transit',
      timing: '2026',
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
      timing: 'In Progress',
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
      timing: 'In Progress',
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
      timing: 'Proposed',
    },
    {
      title: 'School District Excellence',
      description: 'Top-rated schools continuing to attract families',
      icon: 'policy',
    },
  ],
};

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

  const getMarketTagline = () => {
    if (!city) return null;
    
    const pricePerSqm = canonicalMetrics?.average_price_sqm ?? city.average_price_sqm ?? (marketData[0]?.average_price_sqm || 0);
    if (!pricePerSqm) return city.description || null;
    
    const nationalAvg = 22800;
    const percentAbove = ((pricePerSqm - nationalAvg) / nationalAvg) * 100;
    
    if (percentAbove > 50) return `Premium market — ${Math.round(percentAbove)}% above national average`;
    if (percentAbove > 20) return `Strong market — ${Math.round(percentAbove)}% above national average`;
    if (percentAbove > 0) return `Established market — ${Math.round(percentAbove)}% above average`;
    if (percentAbove > -20) return `Great value — ${Math.abs(Math.round(percentAbove))}% below average`;
    return `Affordable market — Below national average`;
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

  const worthWatching = cityMarketFactors[slug || ''] || [];
  const heroImage = cityHeroImages[slug || ''] || city.hero_image || 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1920';
  const pricePerSqm = canonicalMetrics?.average_price_sqm ?? city.average_price_sqm ?? null;
  const medianPrice = canonicalMetrics?.median_apartment_price ?? city.median_apartment_price ?? null;
  const grossYield = canonicalMetrics?.gross_yield_percent ?? city.gross_yield_percent ?? null;

  return (
    <Layout>
      <div className="min-h-screen">
        {/* 1. Cinematic Hero */}
        <CityHero
          cityName={city.name}
          heroImage={heroImage}
          marketTagline={getMarketTagline()}
        />

        {/* 2. Quick Stats Strip */}
        {!marketLoading && (
          <CityQuickStats
            marketData={marketData}
            canonicalMetrics={canonicalMetrics}
            cityData={{
              average_price_sqm: city.average_price_sqm,
              median_apartment_price: city.median_apartment_price,
              rental_3_room_min: city.rental_3_room_min,
              rental_3_room_max: city.rental_3_room_max,
              rental_4_room_min: city.rental_4_room_min,
              rental_4_room_max: city.rental_4_room_max,
            }}
          />
        )}

        {/* 3. City Story - Full Width Standalone */}
        <section className="py-16 bg-muted/40">
          <div className="container">
            <CityStory
              cityName={city.name}
              description={city.description}
              highlights={city.highlights}
              angloPresence={city.anglo_presence}
              hasTrainStation={city.has_train_station}
              commuteTimeTelAviv={city.commute_time_tel_aviv}
            />
          </div>
        </section>

        {/* 4. Market Reality - Full Width Standalone */}
        <section className="py-16 bg-background">
          <div className="container">
            <MarketRealityTabs
              marketData={marketData}
              cityName={city.name}
              citySlug={slug}
              arnonaRateSqm={canonicalMetrics?.arnona_rate_sqm ?? city.arnona_rate_sqm}
            />
          </div>
        </section>

        {/* 4. Price Trend Chart - Full Width */}
        {marketData.length > 0 && (
          <CityMarketReality
            marketData={marketData}
            cityName={city.name}
            canonicalMetrics={canonicalMetrics}
            historicalPrices={historicalPrices}
            yoyChange={city.yoy_price_change}
          />
        )}

        {/* 5. Worth Watching */}
        {worthWatching.length > 0 && (
          <CityWorthWatchingNew factors={worthWatching} cityName={city.name} />
        )}

        {/* 6. Run the Numbers - Calculator Teaser */}
        <CityCalculatorTeaser 
          cityName={city.name} 
          medianPrice={medianPrice}
          grossYield={grossYield}
        />

        {/* 7. Explore Listings CTA */}
        <CityExploreListings 
          cityName={city.name} 
          propertiesCount={properties.length} 
        />

        {/* 8. Featured Properties - At the bottom */}
        <CityFeaturedProperties cityName={city.name} citySlug={slug || ''} />
      </div>
    </Layout>
  );
}
