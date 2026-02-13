import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';

export default function MapSearch() {
  return (
    <Layout>
      <SEOHead
        title="Map Search | BuyWise Israel"
        description="Search properties on an interactive map across Israel."
        canonicalUrl="https://buywiseisrael.com/map"
      />
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-lg">Map search — coming soon</p>
      </div>
    </Layout>
  );
}
