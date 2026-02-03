import { lazy, Suspense } from 'react';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageLoader } from '@/components/shared/PageLoader';

// Lazy load the heavy map components
const MapSearchLayout = lazy(() => import('@/components/map-search/MapSearchLayout'));

export default function MapSearch() {
  return (
    <Layout hideFooter hideMobileNav>
      <SEOHead
        title="Map Search | Find Properties in Israel | BuyWise Israel"
        description="Search properties on an interactive map. Explore neighborhoods, draw custom search areas, and discover homes for sale and rent across Israel."
        canonicalUrl="https://buywiseisrael.com/map"
      />
      <Suspense fallback={<PageLoader />}>
        <MapSearchLayout />
      </Suspense>
    </Layout>
  );
}
