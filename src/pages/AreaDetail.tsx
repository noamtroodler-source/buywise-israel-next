import { useParams, Link } from 'react-router-dom';
import { Loader2, Eye } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCity } from '@/hooks/useCities';
import { useProperties } from '@/hooks/useProperties';
import { useMarketData } from '@/hooks/useMarketData';
import { useCanonicalMetrics } from '@/hooks/useCanonicalMetrics';
import { useHistoricalPrices } from '@/hooks/useHistoricalPrices';

// New guide-style components
import { CityHeroGuide } from '@/components/city/CityHeroGuide';
import { CityOpener } from '@/components/city/CityOpener';

// Existing components (kept)
import { CityQuickStats } from '@/components/city/CityQuickStats';
import { MarketOverviewCards } from '@/components/city/MarketOverviewCards';
import { PriceTrendsSection } from '@/components/city/PriceTrendsSection';
import { CityWorthWatchingNew, MarketFactor } from '@/components/city/CityWorthWatchingNew';
import { CityCalculatorTeaser } from '@/components/city/CityCalculatorTeaser';
import { CityExploreListings } from '@/components/city/CityExploreListings';
import { CityFeaturedProperties } from '@/components/city/CityFeaturedProperties';
import { useCityDetails } from '@/hooks/useCityDetails';

// City Identity Sentences - universally true, one-liner descriptions
const cityIdentities: Record<string, string> = {
  'tel-aviv': "Tel Aviv is Israel's cultural and economic capital — a Mediterranean metropolis known for its beaches, nightlife, and startup ecosystem.",
  'herzliya': "Herzliya is a coastal tech hub north of Tel Aviv, home to Israel's \"Silicon Wadi\" and luxury beachfront living.",
  'jerusalem': "Jerusalem is Israel's capital and spiritual center — a city of historical significance, diverse neighborhoods, and strong community ties.",
  'haifa': "Haifa is a port city on Mount Carmel, known for its multicultural atmosphere, tech sector, and Mediterranean views.",
  'raanana': "Ra'anana is a family-friendly suburb with excellent schools, a strong Anglo community, and proximity to Tel Aviv.",
  'netanya': "Netanya is a coastal city known for its cliff-side beaches, affordable housing, and growing French-speaking community.",
  'modiin': "Modi'in is a planned city between Tel Aviv and Jerusalem, designed for families with modern infrastructure and green spaces.",
  'beer-sheva': "Beer Sheva is the capital of the Negev, home to Ben-Gurion University and emerging as a tech and innovation hub.",
  'ashdod': "Ashdod is a port city with affordable coastal living, a growing population, and strong industrial base.",
  'ashkelon': "Ashkelon is a southern coastal city known for archaeological sites, beaches, and affordable housing.",
  'eilat': "Eilat is Israel's Red Sea resort city — tax-free, tourism-focused, with year-round warm weather.",
  'ramat-gan': "Ramat Gan is an urban center adjacent to Tel Aviv, known for the Diamond Exchange and growing residential demand.",
  'petah-tikva': "Petah Tikva is one of Israel's oldest cities, now a commercial hub with strong transport links.",
  'givatayim': "Givatayim is a small, walkable city bordering Tel Aviv — urban living with a neighborhood feel.",
  'holon': "Holon is a family-oriented city south of Tel Aviv, known for the Design Museum and affordable housing.",
  'bat-yam': "Bat Yam is a beachfront city south of Tel Aviv, undergoing urban renewal with improving infrastructure.",
  'kfar-saba': "Kfar Saba is a Sharon region suburb with good schools, parks, and proximity to Highway 6.",
  'hod-hasharon': "Hod HaSharon is a growing residential town in the Sharon region, popular with young families.",
  'rosh-haayin': "Rosh HaAyin is a hilltop city east of Tel Aviv, known for its diverse population and train connectivity.",
  'shoham': "Shoham is a small planned community between Tel Aviv and Jerusalem, known for quiet suburban living.",
  'givat-shmuel': "Givat Shmuel is one of Israel's smallest cities, bordering Ramat Gan, with strong residential demand.",
  'caesarea': "Caesarea is an exclusive coastal community with archaeological sites, a golf course, and luxury villas.",
  'zichron-yaakov': "Zichron Yaakov is a wine country town on Mount Carmel, known for historic architecture and boutique living.",
  'pardes-hanna': "Pardes Hanna-Karkur is a rural community in the Sharon region, offering quiet living near nature.",
  'kiryat-tivon': "Kiryat Tivon is a green suburban town near Haifa, popular with families seeking a quieter lifestyle.",
  'yokneam': "Yokneam is a Jezreel Valley town with a growing tech park, near Haifa and the Galilee.",
  'hadera': "Hadera is a central coastal city with improving infrastructure and affordable housing options.",
  'nahariya': "Nahariya is Israel's northernmost coastal city, known for its beaches, German heritage, and relaxed atmosphere.",
  'beit-shemesh': "Beit Shemesh is a growing city west of Jerusalem, with distinct secular and religious neighborhoods.",
  'mevaseret-zion': "Mevaseret Zion is a suburban town overlooking Jerusalem, known for its mountain views and family atmosphere.",
  'efrat': "Efrat is a community in the Judean Hills, south of Jerusalem, with a strong English-speaking presence.",
  'gush-etzion': "Gush Etzion is a bloc of communities in the Judean Hills, known for its historical significance and scenic landscapes.",
  'maale-adumim': "Ma'ale Adumim is a city east of Jerusalem, offering suburban living with mountain views.",
  'givat-zeev': "Givat Ze'ev is a residential town north of Jerusalem, popular with families seeking affordable housing.",
};

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
  const { data: cityDetails } = useCityDetails(slug || '');
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

  // Build worth watching factors, including TAMA 38 status from database
  const staticFactors = cityMarketFactors[slug || ''] || [];
  
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
  
  // Combine static and dynamic factors
  const worthWatching = tama38Factor 
    ? [...staticFactors.filter(f => !f.title.toLowerCase().includes('tama')), tama38Factor]
    : staticFactors;
    
  const heroImage = cityHeroImages[slug || ''] || city.hero_image || 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1920';
  const medianPrice = canonicalMetrics?.median_apartment_price ?? city.median_apartment_price ?? null;
  const grossYield = canonicalMetrics?.gross_yield_percent ?? city.gross_yield_percent ?? null;
  const identitySentence = cityIdentities[slug || ''] || city.description || `${city.name} is a city in Israel with a unique character and real estate market.`;
  const yoyChange = canonicalMetrics?.yoy_price_change ?? city.yoy_price_change ?? undefined;

  return (
    <Layout>
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
              median_apartment_price: city.median_apartment_price,
              rental_3_room_min: city.rental_3_room_min,
              rental_3_room_max: city.rental_3_room_max,
              rental_4_room_min: city.rental_4_room_min,
              rental_4_room_max: city.rental_4_room_max,
            }}
          />
        )}

        {/* 3. Opener Section - Overview */}
        <CityOpener
          cityName={city.name}
          identitySentence={identitySentence}
          hasTrainStation={city.has_train_station}
          angloPresence={city.anglo_presence}
          yoyPriceChange={yoyChange}
        />

        {/* 4. Market Overview - 3 Card Grid */}
        <section id="market">
          <MarketOverviewCards
            marketData={marketData}
            cityName={city.name}
            arnonaRateSqm={canonicalMetrics?.arnona_rate_sqm ?? city.arnona_rate_sqm}
          />
        </section>

        {/* 5. Price Trends Chart */}
        {marketData.length > 0 && (
          <section id="trends">
            <PriceTrendsSection
              marketData={marketData}
              cityName={city.name}
              canonicalMetrics={canonicalMetrics}
              historicalPrices={historicalPrices}
              yoyChange={city.yoy_price_change}
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

        {/* 7. Run the Numbers - Calculator Teaser */}
        <section id="tools">
          <CityCalculatorTeaser 
            cityName={city.name} 
            medianPrice={medianPrice}
            grossYield={grossYield}
          />
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
      </div>
    </Layout>
  );
}
