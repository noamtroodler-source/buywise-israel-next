import { useState } from 'react';
import { Check, Sparkles, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EnterpriseSalesDialog } from './EnterpriseSalesDialog';
import { AnnualBillingConfirmDialog } from './AnnualBillingConfirmDialog';

interface PromoResult {
  valid: boolean;
  summary?: string;
  promoId?: string;
  trialDays?: number;
}

interface PlanCardProps {
  name: string;
  tier: string;
  description?: string;
  priceMonthly: number;
  priceAnnual: number;
  billingCycle: 'monthly' | 'annual';
  features: string[];
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  isEnterprise?: boolean;
  entityType?: 'agency' | 'developer';
  onSubscribe: () => void;
  loading?: boolean;
  promoResult?: PromoResult | null;
  ctaLabel?: string;
}

export function PlanCard({
  name,
  tier,
  description,
  priceMonthly,
  priceAnnual,
  billingCycle,
  features,
  isCurrentPlan,
  isPopular,
  isEnterprise,
  entityType = 'agency',
  onSubscribe,
  loading,
  promoResult,
}: PlanCardProps) {
  const [salesDialogOpen, setSalesDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const price = billingCycle === 'annual' ? (priceAnnual ?? 0) : (priceMonthly ?? 0);
  const monthlyEquivalent = billingCycle === 'annual' ? Math.round((priceAnnual ?? 0) / 12) : (priceMonthly ?? 0);
  const annualSaving = billingCycle === 'annual' && !isEnterprise
    ? Math.round((priceMonthly ?? 0) * 12 - (priceAnnual ?? 0))
    : 0;

  const hasTrialPromo = promoResult?.valid && (promoResult.trialDays ?? 0) > 0;
  const trialDays = promoResult?.trialDays ?? 0;

  const MONTHLY_CTA: Record<string, string> = {
    starter: 'Start with Starter',
    growth: 'Scale with Growth',
    pro: 'Go Pro',
  };

  const ANNUAL_CTA: Record<string, string> = {
    starter: 'Get Starter Annual',
    growth: 'Get Growth Annual',
    pro: 'Go Pro Annual',
  };

  const ctaLabel = isCurrentPlan
    ? 'Current Plan'
    : loading
      ? 'Loading...'
      : hasTrialPromo
        ? `Start ${trialDays}-Day Free Trial`
        : billingCycle === 'annual'
          ? (ANNUAL_CTA[tier] ?? 'Get Annual Plan')
          : (MONTHLY_CTA[tier] ?? 'Subscribe');

  const handleSubscribeClick = () => {
    if (billingCycle === 'annual') {
      setConfirmDialogOpen(true);
    } else {
      onSubscribe();
    }
  };

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border p-6 transition-all',
        isEnterprise
          ? 'border-transparent bg-card shadow-lg'
          : isPopular
            ? 'border-primary shadow-lg scale-[1.02] bg-card'
            : 'border-border bg-card hover:border-primary/30',
        isEnterprise && 'bg-gradient-to-br from-primary/5 via-card to-purple-500/5',
        isCurrentPlan && 'ring-2 ring-primary/30'
      )}
      style={isEnterprise ? { border: '2px solid transparent', backgroundClip: 'padding-box', outline: '2px solid hsl(var(--primary) / 0.3)' } : undefined}
    >
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1">
          <Sparkles className="h-3 w-3" />
          Most Popular
        </Badge>
      )}
      {isCurrentPlan && (
        <Badge variant="outline" className="absolute -top-3 right-4 border-primary text-primary">
          Current Plan
        </Badge>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        {description ? (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        ) : (
          <p className="text-xs text-muted-foreground capitalize">{tier} tier</p>
        )}
      </div>

      <div className="mb-6">
        {isEnterprise ? (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">Custom</span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">₪{monthlyEquivalent.toLocaleString()}</span>
              <span className="text-muted-foreground text-sm">/mo</span>
            </div>
            {billingCycle === 'annual' && (
              <p className="text-xs text-muted-foreground mt-1">
                ₪{price.toLocaleString()} billed annually
              </p>
            )}
            {annualSaving > 0 && (
              <p className="text-xs text-primary font-medium mt-0.5">
                Save ₪{annualSaving.toLocaleString()} vs. monthly
              </p>
            )}
            {hasTrialPromo && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
                <Gift className="h-3 w-3 text-primary" />
                <span className="text-xs text-primary font-medium">{trialDays}-day free trial included</span>
              </div>
            )}
          </>
        )}
      </div>

      <ul className="space-y-2.5 mb-6 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {isEnterprise ? (
        <>
          <Button
            onClick={() => setSalesDialogOpen(true)}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground"
          >
            Contact Sales
          </Button>
          <EnterpriseSalesDialog
            open={salesDialogOpen}
            onOpenChange={setSalesDialogOpen}
            entityType={entityType}
          />
        </>
      ) : (
        <>
          <Button
            onClick={handleSubscribeClick}
            disabled={isCurrentPlan || loading}
            variant={isPopular ? 'default' : 'outline'}
            className="w-full rounded-xl"
          >
            {ctaLabel}
          </Button>
          {!isEnterprise && (
            <AnnualBillingConfirmDialog
              open={confirmDialogOpen}
              onOpenChange={setConfirmDialogOpen}
              planName={name}
              tier={tier}
              priceMonthly={priceMonthly}
              priceAnnual={priceAnnual}
              entityType={entityType}
              onConfirm={onSubscribe}
            />
          )}
        </>
      )}
    </div>
  );
}
