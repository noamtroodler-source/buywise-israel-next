import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';

const MapSearchLayout = lazy(() => import('@/components/map-search/MapSearchLayout'));

function buildTitle(status?: string | null, city?: string | null): string {
  const parts: string[] = [];
  if (status === 'for_rent') parts.push('Rentals');
  else if (status === 'projects') parts.push('New Projects');
  else parts.push('Properties for Sale');
  if (city) parts.push(`in ${city}`);
  parts.push('| BuyWise Israel');
  return parts.join(' ');
}

export default function MapSearch() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const city = searchParams.get('city');

  return (
    <Layout hideFooter hideMobileNav>
      <SEOHead
        title={buildTitle(status, city)}
        description="Search properties on an interactive map across Israel."
        canonicalUrl="https://buywiseisrael.com/map"
      />
      <Suspense fallback={<div className="h-[calc(100vh-64px)] bg-muted animate-pulse" />}>
        <MapSearchLayout />
      </Suspense>
    </Layout>
  );
}
