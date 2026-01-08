import { useParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useCity } from '@/hooks/useCities';
import { useProperties } from '@/hooks/useProperties';
import { useCanonicalMetrics } from '@/hooks/useCanonicalMetrics';
import { useHistoricalPrices } from '@/hooks/useHistoricalPrices';
import { CityHeroSplit } from '@/components/city/CityHeroSplit';
import { CityQuickStats } from '@/components/city/CityQuickStats';
import { CityMarketStory } from '@/components/city/CityMarketStory';
import { CityNextSteps } from '@/components/city/CityNextSteps';
import { CityFeaturedProperties } from '@/components/city/CityFeaturedProperties';
import type { MarketFactor } from '@/components/city/WorthWatchingGrid';

// Hero images for each city
import telAvivHero from '@/assets/cities/hero/tel-aviv.jpg';
import jerusalemHero from '@/assets/cities/hero/jerusalem.jpg';
import haifaHero from '@/assets/cities/hero/haifa.jpg';
import herzliyaHero from '@/assets/cities/hero/herzliya.jpg';
import netanyaHero from '@/assets/cities/hero/netanya.jpg';
import raananaHero from '@/assets/cities/hero/raanana.jpg';
import modiinHero from '@/assets/cities/hero/modiin.jpg';
import kfarSabaHero from '@/assets/cities/hero/kfar-saba.jpg';
import petahTikvaHero from '@/assets/cities/hero/petah-tikva.jpg';
import ashdodHero from '@/assets/cities/hero/ashdod.jpg';
import beerShevaHero from '@/assets/cities/hero/beer-sheva.jpg';
import eilatHero from '@/assets/cities/hero/eilat.jpg';
import givatayimHero from '@/assets/cities/hero/givatayim.jpg';
import ramatGanHero from '@/assets/cities/hero/ramat-gan.jpg';
import holonHero from '@/assets/cities/hero/holon.jpg';
import batYamHero from '@/assets/cities/hero/bat-yam.jpg';
import ashkelonHero from '@/assets/cities/hero/ashkelon.jpg';
import hodHasharonHero from '@/assets/cities/hero/hod-hasharon.jpg';
import roshHaayinHero from '@/assets/cities/hero/rosh-haayin.jpg';
import shohamHero from '@/assets/cities/hero/shoham.jpg';
import givatShmuelHero from '@/assets/cities/hero/givat-shmuel.jpg';
import haderaHero from '@/assets/cities/hero/hadera.jpg';
import nahariyaHero from '@/assets/cities/hero/nahariya.jpg';
import zichonYaakovHero from '@/assets/cities/hero/zichron-yaakov.jpg';
import caesareaHero from '@/assets/cities/hero/caesarea.jpg';
import kiryatTivonHero from '@/assets/cities/hero/kiryat-tivon.jpg';
import mevaseretZionHero from '@/assets/cities/hero/mevaseret-zion.jpg';
import beitShemeshHero from '@/assets/cities/hero/beit-shemesh.jpg';
import maaleAdumimHero from '@/assets/cities/hero/maale-adumim.jpg';
import efratHero from '@/assets/cities/hero/efrat.jpg';
import givatZeevHero from '@/assets/cities/hero/givat-zeev.jpg';
import gushEtzionHero from '@/assets/cities/hero/gush-etzion.jpg';
import yokneamHero from '@/assets/cities/hero/yokneam.jpg';
import pardesHannaHero from '@/assets/cities/hero/pardes-hanna.jpg';

const cityHeroImages: Record<string, string> = {
  'tel-aviv': telAvivHero,
  'jerusalem': jerusalemHero,
  'haifa': haifaHero,
  'herzliya': herzliyaHero,
  'netanya': netanyaHero,
  'raanana': raananaHero,
  'modiin': modiinHero,
  'kfar-saba': kfarSabaHero,
  'petah-tikva': petahTikvaHero,
  'ashdod': ashdodHero,
  'beer-sheva': beerShevaHero,
  'eilat': eilatHero,
  'givatayim': givatayimHero,
  'ramat-gan': ramatGanHero,
  'holon': holonHero,
  'bat-yam': batYamHero,
  'ashkelon': ashkelonHero,
  'hod-hasharon': hodHasharonHero,
  'rosh-haayin': roshHaayinHero,
  'shoham': shohamHero,
  'givat-shmuel': givatShmuelHero,
  'hadera': haderaHero,
  'nahariya': nahariyaHero,
  'zichron-yaakov': zichonYaakovHero,
  'caesarea': caesareaHero,
  'kiryat-tivon': kiryatTivonHero,
  'mevaseret-zion': mevaseretZionHero,
  'beit-shemesh': beitShemeshHero,
  'maale-adumim': maaleAdumimHero,
  'efrat': efratHero,
  'givat-zeev': givatZeevHero,
  'gush-etzion': gushEtzionHero,
  'yokneam': yokneamHero,
  'pardes-hanna': pardesHannaHero,
};

// Market factors worth watching for each city
const cityMarketFactors: Record<string, MarketFactor[]> = {
  'tel-aviv': [
    { title: 'Red Line Opening', description: 'Light rail completion in 2026 will transform property values near stations', icon: 'transit' },
    { title: 'Tech Sector Growth', description: 'Continued high-tech expansion driving demand for premium housing', icon: 'development' },
  ],
  'jerusalem': [
    { title: 'Light Rail Expansion', description: 'New lines opening up previously underserved neighborhoods', icon: 'transit' },
    { title: 'Urban Renewal', description: 'Major redevelopment projects transforming older areas', icon: 'development' },
  ],
  'herzliya': [
    { title: 'Herzliya Marina', description: 'Luxury waterfront development attracting international buyers', icon: 'development' },
    { title: 'Tech Park Growth', description: 'High-tech hub expansion driving premium residential demand', icon: 'infrastructure' },
  ],
  'haifa': [
    { title: 'Haifa Bay Development', description: 'Major waterfront regeneration project underway', icon: 'development' },
    { title: 'Tech Sector Expansion', description: 'Growing tech presence creating new employment centers', icon: 'infrastructure' },
  ],
  'netanya': [
    { title: 'Beachfront Development', description: 'New luxury projects along the coastline', icon: 'development' },
    { title: 'Train Frequency Increase', description: 'Improved rail connections to Tel Aviv', icon: 'transit' },
  ],
  'raanana': [
    { title: 'Commercial Hub Growth', description: 'New business centers attracting companies from Tel Aviv', icon: 'development' },
  ],
  'modiin': [
    { title: 'Fast Train Line', description: 'Direct high-speed connection to Jerusalem and Tel Aviv', icon: 'transit' },
    { title: 'City Expansion', description: 'New neighborhoods with modern infrastructure', icon: 'development' },
  ],
};

export default function CityDetail() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: city, isLoading: cityLoading, error: cityError } = useCity(slug || '');
  const { data: properties } = useProperties({ city: city?.name });
  const { data: canonicalMetrics } = useCanonicalMetrics(slug || '');
  const { data: historicalPrices } = useHistoricalPrices(slug || '', 15);

  // Loading state
  if (cityLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Error state
  if (cityError || !city) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">City not found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find information for this city.
          </p>
          <Button asChild>
            <Link to="/areas">Browse All Cities</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const heroImage = cityHeroImages[slug || ''] || telAvivHero;
  const marketFactors = cityMarketFactors[slug || ''] || [];
  
  // Get price data from canonical metrics or city data
  const pricePerSqm = canonicalMetrics?.average_price_sqm || city.average_price_sqm;
  const medianPrice = canonicalMetrics?.median_apartment_price || city.median_apartment_price;
  const yoyChange = canonicalMetrics?.yoy_price_change ?? city.yoy_price_change;
  const grossYield = canonicalMetrics?.gross_yield_percent ?? city.gross_yield_percent;
  
  // Rental range
  const rentalRange = canonicalMetrics?.rental_3_room_min && canonicalMetrics?.rental_3_room_max
    ? { min: canonicalMetrics.rental_3_room_min, max: canonicalMetrics.rental_3_room_max }
    : city.rental_3_room_min && city.rental_3_room_max
    ? { min: city.rental_3_room_min, max: city.rental_3_room_max }
    : undefined;

  return (
    <Layout>
      {/* 1. Immersive Hero */}
      <CityHeroSplit
        cityName={city.name}
        citySlug={slug}
        heroImage={heroImage}
      />

      {/* 2. Quick Stats Bar */}
      <CityQuickStats
        pricePerSqm={pricePerSqm || undefined}
        medianPrice={medianPrice || undefined}
        rentalRange={rentalRange}
        yoyChange={yoyChange || undefined}
        highlights={city.highlights || undefined}
        hasTrainStation={city.has_train_station || undefined}
        angloPresence={city.anglo_presence || undefined}
      />

      {/* 3. Featured Properties */}
      <CityFeaturedProperties
        cityName={city.name}
        citySlug={slug || ''}
      />

      {/* 4. Market Story */}
      <CityMarketStory
        cityName={city.name}
        historicalPrices={historicalPrices || []}
        yoyChange={yoyChange}
        grossYield={grossYield}
        marketFactors={marketFactors}
      />

      {/* 5. Next Steps */}
      <CityNextSteps
        cityName={city.name}
        propertiesCount={properties?.length}
      />
    </Layout>
  );
}
