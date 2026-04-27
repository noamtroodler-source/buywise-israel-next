import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Receipt, Star, ShieldAlert, Building2 } from 'lucide-react';
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
      <div className="container py-8 pb-24 md:pb-8 space-y-6 max-w-6xl">
        <FoundingMemberBanner />
        <TrialCountdownBanner />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10">
            <Link to="/agency">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Billing</h1>
              <p className="text-sm text-muted-foreground">Plan, featured placement, and invoices</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-primary/20 hover:bg-primary/5">
            <Link to="/agency">
              <Building2 className="h-4 w-4 mr-2" />
              Agency Portal
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
          <span className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold text-foreground">{featuredListings.length}</span>
            <span className="text-muted-foreground">featured active</span>
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold text-foreground">₪{monthlyCost.toLocaleString()}/mo</span>
            <span className="text-muted-foreground">featured spend</span>
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold text-foreground">3</span>
            <span className="text-muted-foreground">free founding slots</span>
          </span>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="rounded-2xl bg-muted/60 p-1">
            <TabsTrigger value="overview" className="rounded-xl gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <CreditCard className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="invoices" className="rounded-xl gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Receipt className="h-3.5 w-3.5" />
              Invoices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-5">
                <BillingSection />
              </div>
              <div className="space-y-5">
                <UsageMeters entityType="agency" authorType="agency" profileId={agency?.id} />
                <UpgradePromptCard entityType="agency" />

                <Card className="rounded-2xl border-border/50 bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Star className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-foreground">Featured Listings</h2>
                          <p className="text-sm text-muted-foreground">Premium placement usage</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
                        <p className="text-2xl font-bold text-foreground">{featuredListings.length}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
                        <p className="text-2xl font-bold text-foreground">₪{monthlyCost.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Monthly cost</p>
                      </div>
                    </div>
                    <UiButton variant="outline" size="sm" asChild className="rounded-xl border-primary/20 hover:bg-primary/5">
                      <Link to="/agency/featured">Manage Featured</Link>
                    </UiButton>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-0 space-y-6">
            <InvoiceHistoryTable />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
