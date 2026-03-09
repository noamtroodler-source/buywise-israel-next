import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Building2, Lock, RefreshCcw, ArrowRight, Users, Info } from 'lucide-react';

import { Layout } from '@/components/layout/Layout';
import { PlanCard } from '@/components/billing/PlanCard';
import { BillingCycleToggle } from '@/components/billing/BillingCycleToggle';
import { PromoCodeInput } from '@/components/billing/PromoCodeInput';
import { PricingFAQ } from '@/components/billing/PricingFAQ';
import { FoundingProgramSection } from '@/components/billing/FoundingProgramSection';
import { EnterpriseSalesDialog } from '@/components/billing/EnterpriseSalesDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type EntityTab = 'agency' | 'developer';

interface PromoResult {
  valid: boolean;
  summary?: string;
  promoId?: string;
  trialDays?: number;
}

const PLAN_DESCRIPTIONS: Record<string, string> = {
  starter: 'Perfect for solo agents getting started',
  growth: 'For growing teams ready to scale',
  pro: 'For established agencies at full capacity',
  enterprise: 'Custom solutions for large organizations',
};

function buildFeatures(plan: any): string[] {
  const features: string[] = [];
  if (plan.max_listings === null) features.push('Unlimited listings');
  else features.push(`Up to ${plan.max_listings} listings`);
  if (plan.max_seats === null || plan.max_seats === undefined) features.push('Unlimited team seats');
  else features.push(`${plan.max_seats} team seat${plan.max_seats === 1 ? '' : 's'}`);
  if (plan.max_blogs_per_month === null || plan.max_blogs_per_month === undefined) features.push('Unlimited blog posts/mo');
  else features.push(`${plan.max_blogs_per_month} blog posts/mo`);
  if (plan.tier === 'pro' || plan.tier === 'enterprise') features.push('Priority support');
  if (plan.tier === 'enterprise') features.push('Dedicated account manager');
  return features;
}

export default function Pricing() {
  const [entityTab, setEntityTab] = useState<EntityTab>('agency');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [ctaDialogOpen, setCtaDialogOpen] = useState(false);
  const [ctaEntityType, setCtaEntityType] = useState<EntityTab>('agency');
  const { user } = useAuth();
  const { isDeveloper } = useUserRole();
  const { data: subscription } = useSubscription();
  const navigate = useNavigate();

  const isFoundingCode = promoCode.toUpperCase() === 'FOUNDING2026' && promoResult?.valid;

  useEffect(() => {
    if (user === null) {
      navigate('/advertise#pricing', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isDeveloper) setEntityTab('developer');
  }, [isDeveloper]);

  const { data: plans = [] } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const filteredPlans = plans.filter((p: any) => p.entity_type === entityTab);

  const handleFoundingEnroll = async (planId: string) => {
    if (!user) {
      navigate('/auth?tab=signup&redirect=/pricing');
      return;
    }
    setCheckoutLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke('enroll-founding-partner', {
        body: { plan_id: planId, billing_cycle: billingCycle },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Welcome to the Founding Partner Program!');
      navigate(`/checkout/success?founding=true&trial_end=${encodeURIComponent(data.trial_end)}`);
    } catch (err: any) {
      toast.error(err.message || 'Enrollment failed');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (isFoundingCode) {
      return handleFoundingEnroll(planId);
    }

    if (!user) {
      navigate('/auth?tab=signup&redirect=/pricing');
      return;
    }
    setCheckoutLoading(planId);
    try {
      // PayPlus checkout — placeholder until PayPlus API keys are configured
      toast.info('Payment processing is coming soon. Use the Founding Partner code FOUNDING2026 to start your free trial today!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="relative bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
          <div className="container relative py-16 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Manage Your Plan
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                Upgrade, downgrade, or apply a promo code. Changes take effect immediately or at your next renewal.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <PromoCodeInput value={promoCode} onChange={setPromoCode} onValidated={setPromoResult} />
              </div>
              {isFoundingCode && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2">
                  <span className="text-sm font-medium text-primary">
                    🎉 Founding Partner code active — select a plan to start your 60-day free trial
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <div className="container py-12 space-y-16">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="inline-flex items-center rounded-xl bg-muted p-1 gap-1">
              <button
                onClick={() => setEntityTab('agency')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  entityTab === 'agency' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Agency Plans
              </button>
              <button
                onClick={() => setEntityTab('developer')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  entityTab === 'developer' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Developer Plans
              </button>
            </div>
            <BillingCycleToggle cycle={billingCycle} onChange={setBillingCycle} />
          </div>

          {billingCycle === 'annual' && (
            <Alert className="max-w-2xl mx-auto border-warning/30 bg-warning/5 [&>svg]:text-warning">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-warning-foreground">
                Annual plans are billed as a single payment for the full year. You save 20% vs. paying month-to-month, and the plan renews automatically after 12 months.
              </AlertDescription>
            </Alert>
          )}

          {/* Plan Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {filteredPlans.map((plan: any, i: number) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <PlanCard
                  name={plan.name}
                  tier={plan.tier}
                  description={PLAN_DESCRIPTIONS[plan.tier]}
                  priceMonthly={plan.price_monthly_ils}
                  priceAnnual={plan.price_annual_ils}
                  billingCycle={billingCycle}
                  features={buildFeatures(plan)}
                  isCurrentPlan={subscription?.tier === plan.tier && subscription?.entityType === entityTab}
                  isPopular={plan.tier === 'growth'}
                  isEnterprise={plan.tier === 'enterprise'}
                  entityType={entityTab}
                  onSubscribe={() => handleSubscribe(plan.id)}
                  loading={checkoutLoading === plan.id}
                  promoResult={promoResult}
                  ctaLabel={isFoundingCode ? 'Activate Founding Program' : undefined}
                />
              </motion.div>
            ))}
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 text-primary" />
              <span>30-day satisfaction guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span>Secure ILS checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Cancel anytime, no lock-in</span>
            </div>
          </div>

          {/* Founding Program Section */}
          <FoundingProgramSection />

          {/* Enterprise CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/[0.03] to-background p-8 text-center"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Need More Than What's Listed?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Our enterprise plans are fully custom — more listings, dedicated support, white-label options, and volume pricing. Let's talk.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => { setCtaEntityType('agency'); setCtaDialogOpen(true); }} className="gap-2 w-full sm:w-auto">
                <Building2 className="h-4 w-4" /> Contact Agency Sales <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => { setCtaEntityType('developer'); setCtaDialogOpen(true); }} className="gap-2 w-full sm:w-auto">
                <Building2 className="h-4 w-4" /> Contact Developer Sales <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          <EnterpriseSalesDialog open={ctaDialogOpen} onOpenChange={setCtaDialogOpen} entityType={ctaEntityType} />

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secure payments · All prices in ILS (₪)</span>
          </div>

          <PricingFAQ />
        </div>
      </div>
    </Layout>
  );
}
