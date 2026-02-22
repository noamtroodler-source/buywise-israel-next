import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useMyAgency } from '@/hooks/useAgencyManagement';
import { FeaturedListingsManager } from '@/components/billing/FeaturedListingsManager';

export default function AgencyFeatured() {
  const { data: agency, isLoading } = useMyAgency();

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!agency) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">No agency found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10">
            <Link to="/agency">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Featured Listings</h1>
          </div>
        </div>

        <FeaturedListingsManager agencyId={agency.id} />
      </div>
    </Layout>
  );
}
