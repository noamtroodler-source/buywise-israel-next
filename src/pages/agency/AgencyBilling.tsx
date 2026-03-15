import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Receipt, Star, ShieldAlert } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BillingSection } from '@/components/billing/BillingSection';
import { UsageMeters } from '@/components/billing/UsageMeters';
import { TrialCountdownBanner } from '@/components/billing/TrialCountdownBanner';
import { FoundingMemberBanner } from '@/components/billing/FoundingMemberBanner';
import { UpgradePromptCard } from '@/components/billing/UpgradePromptCard';
import { InvoiceHistoryTable } from '@/components/billing/InvoiceHistoryTable';
import { useMyAgency } from '@/hooks/useAgencyManagement';
import { useFeaturedListings } from '@/hooks/useFeaturedListings';
import { Card, CardContent } from '@/components/ui/card';
import { Button as UiButton } from '@/components/ui/button';
import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';

export default function AgencyBilling() {
  const { data: agency, isAgencyAdmin } = useMyAgency();
  const { data: featuredListings = [] } = useFeaturedListings(agency?.id);
  const paidCount = featuredListings.filter(fl => !fl.is_free_credit).length;
  const monthlyCost = paidCount * 299;

  if (agency && !isAgencyAdmin) {
    return (
      <Layout>
        <div className="container py-16 max-w-lg">
          <EnhancedEmptyState
            icon={ShieldAlert}
            title="Admin access required"
            description="Only the agency admin can manage billing settings."
            primaryAction={{ label: 'Back to Dashboard', href: '/agency' }}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 space-y-6 max-w-5xl">
        <FoundingMemberBanner />
        <TrialCountdownBanner />

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10">
            <Link to="/agency">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Billing</h1>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="invoices" className="rounded-lg gap-1.5">
              <Receipt className="h-3.5 w-3.5" />
              Invoices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <BillingSection />
              </div>
              <div className="space-y-6">
                <UsageMeters entityType="agency" authorType="agency" profileId={agency?.id} />
                <UpgradePromptCard entityType="agency" />

                {/* Featured Listings Summary */}
                <Card className="rounded-2xl border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Featured Listings</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xl font-bold">{featuredListings.length}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">₪{monthlyCost.toLocaleString()}/mo</p>
                        <p className="text-xs text-muted-foreground">Monthly cost</p>
                      </div>
                    </div>
                    <UiButton variant="outline" size="sm" asChild className="rounded-xl border-primary/20">
                      <Link to="/agency/featured">Manage Featured</Link>
                    </UiButton>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-6 space-y-6">
            <InvoiceHistoryTable />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
