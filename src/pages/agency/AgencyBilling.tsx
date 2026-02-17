import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { BillingSection } from '@/components/billing/BillingSection';
import { UsageMeters } from '@/components/billing/UsageMeters';
import { TrialCountdownBanner } from '@/components/billing/TrialCountdownBanner';
import { UpgradePromptCard } from '@/components/billing/UpgradePromptCard';
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

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-6">
            <BillingSection />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <UsageMeters entityType="agency" authorType="agency" profileId={agency?.id} />
            <UpgradePromptCard entityType="agency" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
