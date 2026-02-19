import { Link } from 'react-router-dom';
import { ArrowLeft, Coins } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { CreditWallet } from '@/components/billing/CreditWallet';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';

export default function DeveloperCredits() {
  const { data: developerProfile } = useDeveloperProfile();

  return (
    <Layout>
      <div className="container py-8 space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10">
            <Link to="/developer">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Credit Wallet</h1>
              <p className="text-sm text-muted-foreground">Manage your credits, view history, and boost projects</p>
            </div>
          </div>
        </div>

        <CreditWallet
          entityType="developer"
          entityId={developerProfile?.id}
          entityName={developerProfile?.name ?? 'Your Company'}
        />
      </div>
    </Layout>
  );
}
