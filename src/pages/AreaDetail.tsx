import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Eye } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCity } from '@/hooks/useCities';
import { useCityPropertyCount } from '@/hooks/useCityPropertyCount';
import { useCityMarketFactors } from '@/hooks/useCityMarketFactors';
import { useCityNeighborhoods } from '@/hooks/useCityNeighborhoods';
import { getDistrictForCity } from '@/lib/utils/districtMapping';
import { useNeighborhoodPriceTable } from '@/hooks/useNeighborhoodPriceTable';
import { isAngloNeighborhood } from '@/lib/angloNeighborhoodTags';
// New guide-style components
import { CityHeroGuide } from '@/components/city/CityHeroGuide';
import { CitySourceAttribution } from '@/components/city/CitySourceAttribution';
import { CityNeighborhoods, UnifiedNeighborhood } from '@/components/city/CityNeighborhoods';
// Existing components (kept)
import { CityQuickStats } from '@/components/city/CityQuickStats';
import { MarketOverviewCards } from '@/components/city/MarketOverviewCards';
import { CityWorthWatchingNew, MarketFactor } from '@/components/city/CityWorthWatchingNew';
import { CityResourcesCTA } from '@/components/city/CityResourcesCTA';
import { CityFeaturedProperties } from '@/components/city/CityFeaturedProperties';
import { HistoricalPriceChart } from '@/components/city/HistoricalPriceChart';
import { PriceByApartmentSize } from '@/components/city/PriceByApartmentSize';
import { useCityDetails } from '@/hooks/useCityDetails';
import { SEOHead } from '@/components/seo/SEOHead';
import { generateCityMeta, generateCityJsonLd, SITE_CONFIG } from '@/lib/seo';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';

import { cityHeroImages } from '@/lib/cityHeroImages';

export default function CityDetail() {
  useTrackContentVisit('area');
  const { slug } = useParams<{ slug: string }>();
  const { data: city, isLoading: cityLoading, error } = useCity(slug || '');
  const { data: cityDetails } = useCityDetails(slug || '');
  const { data: dbMarketFactors = [] } = useCityMarketFactors(slug || '');
  const { data: neighborhoods = [] } = useCityNeighborhoods(slug || '');
  const { data: propertyCount = 0 } = useCityPropertyCount(city?.name);
  const { data: priceTableRows = [] } = useNeighborhoodPriceTable(slug || '', city?.name);
  const districtName = city ? getDistrictForCity(city.name) : null;

  // Merge featured neighborhoods + CBS price table into unified list
  const unifiedNeighborhoods: UnifiedNeighborhood[] = useMemo(() => {
    const seen = new Set<string>();
    const result: UnifiedNeighborhood[] = [];

    // Featured first (sorted by sort_order)
    for (const n of neighborhoods) {
      const priceRow = priceTableRows.find(r => r.name === n.name);
      seen.add(n.name);
      result.push({
        name: n.name,
        name_he: n.name_he,
        vibe: n.vibe,
        description: n.description,
        price_tier: n.price_tier,
        avg_price: priceRow?.avg_price ?? n.avg_price ?? null,
        yoy_change_percent: priceRow?.yoy_change_percent ?? n.yoy_change_percent ?? null,
        is_featured: true,
        sort_order: n.sort_order,
        anglo_tag: isAngloNeighborhood(slug || '', n.name),
      });
    }

    // CBS-only neighborhoods (not featured), sorted by price desc
    const cbsOnly = priceTableRows
      .filter(r => !seen.has(r.name))
      .sort((a, b) => b.avg_price - a.avg_price);

    for (const r of cbsOnly) {
      result.push({
        name: r.name,
        price_tier: r.price_tier,
        avg_price: r.avg_price,
        yoy_change_percent: r.yoy_change_percent,
        is_featured: false,
      });
    }

    return result;
  }, [neighborhoods, priceTableRows]);

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
  
  const allFactors = tama38Factor 
    ? [...staticFactors.filter(f => !f.title.toLowerCase().includes('tama')), tama38Factor]
    : staticFactors;

  const worthWatching = allFactors.slice(0, 6);
    
  const heroImage = cityHeroImages[slug || ''] || city.hero_image || 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1920';
  const identitySentence = city.identity_sentence || city.description || `${city.name} is a city in Israel with its own unique character and real estate market.`;

  const seoMeta = generateCityMeta(city, propertyCount);
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
          lastUpdated={city.updated_at}
        />

        {/* 2. Quick Stats Strip */}
        <CityQuickStats
          citySlug={slug}
          cityData={{
            average_price_sqm: city.average_price_sqm,
            average_price_sqm_min: city.average_price_sqm_min,
            average_price_sqm_max: city.average_price_sqm_max,
            median_apartment_price: city.median_apartment_price,
            rental_3_room_min: city.rental_3_room_min,
            rental_3_room_max: city.rental_3_room_max,
            rental_4_room_min: city.rental_4_room_min,
            rental_4_room_max: city.rental_4_room_max,
            rental_5_room_min: city.rental_5_room_min,
            rental_5_room_max: city.rental_5_room_max,
            gross_yield_percent: city.gross_yield_percent,
            gross_yield_percent_min: city.gross_yield_percent_min,
            gross_yield_percent_max: city.gross_yield_percent_max,
          }}
          dataSources={city.data_sources as Record<string, string> | undefined}
          lastVerified={city.updated_at}
        />

        {/* 2.5. Unified Neighborhood Explorer */}
        {unifiedNeighborhoods.length > 0 && (
          <CityNeighborhoods 
            cityName={city.name}
            neighborhoods={unifiedNeighborhoods}
          />
        )}

        {/* 3. Market Overview */}
        <MarketOverviewCards
          cityName={city.name}
          arnonaRateSqm={city.arnona_rate_sqm}
          dataSources={city.data_sources as Record<string, string> | undefined}
          lastVerified={city.updated_at}
          cityData={{ average_price_sqm: city.average_price_sqm }}
        />

        {/* 4. Price History */}
        <HistoricalPriceChart citySlug={slug || ''} cityName={city.name} />

        {/* 5. Price by Apartment Size */}
        <PriceByApartmentSize citySlug={slug || ''} cityName={city.name} />

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

        {/* 7. Helpful Resources */}
        <section id="resources">
          <CityResourcesCTA cityName={city.name} />
        </section>

        {/* 8. Featured Properties */}
        <CityFeaturedProperties cityName={city.name} citySlug={slug || ''} />

        {/* 9. Source Attribution */}
        <CitySourceAttribution 
          sources={city.data_sources as Record<string, string> | undefined} 
          lastVerified={city.updated_at}
          cityName={city.name}
          districtName={districtName}
        />
      </div>
    </Layout>
  );
}
