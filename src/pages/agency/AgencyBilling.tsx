import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, BarChart2, Receipt } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BillingSection } from '@/components/billing/BillingSection';
import { UsageMeters } from '@/components/billing/UsageMeters';
import { TrialCountdownBanner } from '@/components/billing/TrialCountdownBanner';
import { UpgradePromptCard } from '@/components/billing/UpgradePromptCard';
import { InvoiceHistoryTable } from '@/components/billing/InvoiceHistoryTable';
import { BoostAnalyticsPanel } from '@/components/billing/BoostAnalyticsPanel';
import { useMyAgency } from '@/hooks/useAgencyManagement';

export default function AgencyBilling() {
  const { data: agency } = useMyAgency();

  return (
    <Layout>
      <div className="container py-8 space-y-6 max-w-5xl">
        {/* Trial Banner */}
        <TrialCountdownBanner />

        {/* Header */}
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

        {/* Tabbed layout */}
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
            <TabsTrigger value="boost" className="rounded-lg gap-1.5">
              <BarChart2 className="h-3.5 w-3.5" />
              Boost ROI
            </TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <BillingSection />
              </div>
              <div className="space-y-6">
                <UsageMeters entityType="agency" authorType="agency" profileId={agency?.id} />
                <UpgradePromptCard entityType="agency" />
              </div>
            </div>
          </TabsContent>

          {/* Invoices tab */}
          <TabsContent value="invoices" className="mt-6">
            <InvoiceHistoryTable />
          </TabsContent>

          {/* Boost ROI tab */}
          <TabsContent value="boost" className="mt-6">
            <BoostAnalyticsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
