import { lazy, Suspense, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageLoader } from '@/components/shared/PageLoader';

// Lazy load the heavy map components
const MapSearchLayout = lazy(() => import('@/components/map-search/MapSearchLayout'));

export default function MapSearch() {
  const [searchParams] = useSearchParams();
  const city = searchParams.get('city');
  const status = searchParams.get('status') || 'for_sale';

  const { title, description } = useMemo(() => {
    const isRent = status === 'for_rent';
    const type = isRent ? 'Rentals' : 'Properties';
    
    if (city) {
      return {
        title: `${type} in ${city} | BuyWise Israel`,
        description: `Browse ${type.toLowerCase()} for ${isRent ? 'rent' : 'sale'} in ${city}. Explore neighborhoods on an interactive map and find your next home in Israel.`,
      };
    }
    return {
      title: `Map Search | Find ${type} in Israel | BuyWise Israel`,
      description: `Search ${type.toLowerCase()} on an interactive map. Explore neighborhoods, draw custom search areas, and discover homes for ${isRent ? 'rent' : 'sale'} across Israel.`,
    };
  }, [city, status]);

  return (
    <Layout hideFooter hideMobileNav>
      <SEOHead
        title={title}
        description={description}
        canonicalUrl="https://buywiseisrael.com/map"
      />
      <Suspense fallback={<PageLoader />}>
        <MapSearchLayout />
      </Suspense>
    </Layout>
  );
}
