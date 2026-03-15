import { useParams, Link } from 'react-router-dom';
import { Loader2, Eye } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCity } from '@/hooks/useCities';
import { useProperties } from '@/hooks/useProperties';
import { useMarketData } from '@/hooks/useMarketData';
import { useCanonicalMetrics } from '@/hooks/useCanonicalMetrics';
import { useCityMarketFactors } from '@/hooks/useCityMarketFactors';
import { useCityNeighborhoods } from '@/hooks/useCityNeighborhoods';
import { getDistrictForCity } from '@/lib/utils/districtMapping';
// New guide-style components
import { CityHeroGuide } from '@/components/city/CityHeroGuide';
import { CitySourceAttribution } from '@/components/city/CitySourceAttribution';
import { CityNeighborhoodHighlights } from '@/components/city/CityNeighborhoodHighlights';
// Existing components (kept)
import { CityQuickStats } from '@/components/city/CityQuickStats';
import { MarketOverviewCards } from '@/components/city/MarketOverviewCards';
import { PriceTrendsSection } from '@/components/city/PriceTrendsSection';
import { CityWorthWatchingNew, MarketFactor } from '@/components/city/CityWorthWatchingNew';
import { CityExploreListings } from '@/components/city/CityExploreListings';
import { CityFeaturedProperties } from '@/components/city/CityFeaturedProperties';
import { HistoricalPriceChart } from '@/components/city/HistoricalPriceChart';
import { useCityDetails } from '@/hooks/useCityDetails';
import { SEOHead } from '@/components/seo/SEOHead';
import { generateCityMeta, generateCityJsonLd, SITE_CONFIG } from '@/lib/seo';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';

// Generic fallback for cities without identity_sentence in database

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
  useTrackContentVisit('area');
  const { slug } = useParams<{ slug: string }>();
  const { data: city, isLoading: cityLoading, error } = useCity(slug || '');
  const { data: cityDetails } = useCityDetails(slug || '');
  const { data: dbMarketFactors = [] } = useCityMarketFactors(slug || '');
  const { data: neighborhoods = [] } = useCityNeighborhoods(slug || '');
  const { data: properties = [] } = useProperties(city ? { city: city.name } : undefined);
  const { data: marketData = [], isLoading: marketLoading } = useMarketData(city?.name);
  const { data: canonicalMetrics } = useCanonicalMetrics(slug || '');
  const districtName = city ? getDistrictForCity(city.name) : null;
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

  // Convert database market factors to the expected format
  const staticFactors: MarketFactor[] = dbMarketFactors.map(f => ({
    title: f.title,
    description: f.description,
    icon: f.icon as 'transit' | 'development' | 'policy' | 'infrastructure' | 'zoning',
    timing: f.timing || undefined,
  }));
  
  // Add dynamic TAMA 38 factor based on city data
  const tama38Factor: MarketFactor | null = (() => {
    const status = cityDetails?.tama38_status;
    if (!status) return null;
    
    if (status === 'expired') {
      return {
        title: 'TAMA 38 Program Expired',
        description: 'Urban renewal program ended Aug 2024. New seismic retrofitting projects require alternative frameworks.',
        icon: 'policy' as const,
      };
    } else if (status === 'active' || status === 'extended') {
      const expiryDate = cityDetails?.tama38_expiry_date;
      const expiryText = expiryDate ? ` until ${new Date(expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : '';
      return {
        title: 'TAMA 38 Still Active',
        description: `Urban renewal program available${expiryText}. Tax benefits for qualifying pre-1980 buildings.`,
        icon: 'policy' as const,
        timing: expiryDate ? `Until ${new Date(expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 'Active',
      };
    }
    return null;
  })();
  
  // Combine database factors and dynamic TAMA 38 factor
  const allFactors = tama38Factor 
    ? [...staticFactors.filter(f => !f.title.toLowerCase().includes('tama')), tama38Factor]
    : staticFactors;

  // Limit to maximum 6 items (already sorted by sort_order from database)
  const worthWatching = allFactors.slice(0, 6);
    
  const heroImage = cityHeroImages[slug || ''] || city.hero_image || 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1920';
  const medianPrice = canonicalMetrics?.median_apartment_price ?? city.median_apartment_price ?? null;
  const grossYield = canonicalMetrics?.gross_yield_percent ?? city.gross_yield_percent ?? null;
  // Priority: database identity_sentence > description > generic fallback
  const identitySentence = (city as any).identity_sentence || city.description || `${city.name} is a city in Israel with its own unique character and real estate market.`;
  const yoyChange = canonicalMetrics?.yoy_price_change ?? city.yoy_price_change ?? undefined;

  // Generate SEO meta and JSON-LD
  const seoMeta = generateCityMeta(city, properties.length);
  const jsonLd = generateCityJsonLd({
    ...city,
    hero_image: heroImage,
  });

  return (
    <Layout>
      <SEOHead 
        title={seoMeta.title}
        description={seoMeta.description}
        image={heroImage}
        canonicalUrl={`${SITE_CONFIG.siteUrl}/areas/${slug}`}
        jsonLd={jsonLd}
      />
      <div className="min-h-screen">
        {/* 1. Guide-Style Hero */}
        <CityHeroGuide
          cityName={city.name}
          heroImage={heroImage}
          identitySentence={identitySentence}
        />

        {/* 2. Quick Stats Strip */}
        {!marketLoading && (
          <CityQuickStats
            marketData={marketData}
            canonicalMetrics={canonicalMetrics}
            cityData={{
              average_price_sqm: city.average_price_sqm,
              average_price_sqm_min: (city as any).average_price_sqm_min,
              average_price_sqm_max: (city as any).average_price_sqm_max,
              median_apartment_price: city.median_apartment_price,
              rental_3_room_min: city.rental_3_room_min,
              rental_3_room_max: city.rental_3_room_max,
              rental_4_room_min: city.rental_4_room_min,
              rental_4_room_max: city.rental_4_room_max,
              rental_5_room_min: (city as any).rental_5_room_min,
              rental_5_room_max: (city as any).rental_5_room_max,
              gross_yield_percent: city.gross_yield_percent,
              gross_yield_percent_min: (city as any).gross_yield_percent_min,
              gross_yield_percent_max: (city as any).gross_yield_percent_max,
            }}
            dataSources={(city as any).data_sources}
            lastVerified={canonicalMetrics?.updated_at}
          />
        )}

        {/* 2.5. Neighborhood Highlights */}
        {neighborhoods.length > 0 && (
          <CityNeighborhoodHighlights 
            cityName={city.name}
            neighborhoods={neighborhoods}
          />
        )}

        {/* 3. Market Overview - 3 Card Grid */}
        <section id="market">
          <MarketOverviewCards
            marketData={marketData}
            cityName={city.name}
            arnonaRateSqm={canonicalMetrics?.arnona_rate_sqm ?? city.arnona_rate_sqm}
            propertyTypes={canonicalMetrics ? [
              { name: 'Resale', value: canonicalMetrics.resale_percent || 55 },
              { name: 'New Projects', value: canonicalMetrics.new_projects_percent || 30 },
              { name: 'Rentals', value: canonicalMetrics.rentals_percent || 15 },
            ] : undefined}
            dataSources={(city as any).data_sources}
            lastVerified={canonicalMetrics?.updated_at}
            canonicalMetrics={canonicalMetrics}
            cityData={{
              average_price_sqm: city.average_price_sqm,
            }}
          />
        </section>

        {/* 5. Price Trends Chart */}
        {districtName && (
          <section id="trends">
            <PriceTrendsSection
              cityName={city.name}
              districtName={districtName}
              dataSources={(city as any).data_sources}
              lastVerified={canonicalMetrics?.updated_at}
            />
          </section>
        )}


        {/* 6. Worth Watching */}
        <section id="watching">
          {worthWatching.length > 0 ? (
            <CityWorthWatchingNew factors={worthWatching} cityName={city.name} />
          ) : (
            <div className="py-12 bg-muted/30">
              <div className="container">
                <div className="text-center py-8">
                  <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Worth Watching in {city.name}</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Market factors and developments for {city.name} are being researched. 
                    Check back soon for insights on what's shaping this market.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>


        {/* 8. Explore Listings CTA */}
        <section id="listings">
          <CityExploreListings 
            cityName={city.name} 
            propertiesCount={properties.length} 
          />
        </section>

        {/* 9. Featured Properties - At the bottom */}
        <CityFeaturedProperties cityName={city.name} citySlug={slug || ''} />

        {/* 10. Source Attribution */}
        <CitySourceAttribution 
          sources={(city as any).data_sources} 
          lastVerified={canonicalMetrics?.updated_at}
          cityName={city.name}
          districtName={districtName}
        />
      </div>
    </Layout>
  );
}
