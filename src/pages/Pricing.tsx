import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Shield, Building2, Lock, RefreshCcw, ArrowRight, Users, Info } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PlanCard } from '@/components/billing/PlanCard';
import { CreditPackageCard } from '@/components/billing/CreditPackageCard';
import { BillingCycleToggle } from '@/components/billing/BillingCycleToggle';
import { PromoCodeInput } from '@/components/billing/PromoCodeInput';
import { FeatureComparisonTable } from '@/components/billing/FeatureComparisonTable';
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

  const { data: packages = [] } = useQuery({
    queryKey: ['credit-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const filteredPlans = plans.filter((p: any) => p.entity_type === entityTab);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate('/auth?tab=signup&redirect=/pricing');
      return;
    }
    setCheckoutLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          plan_id: planId,
          billing_cycle: billingCycle,
          promo_code: promoCode || undefined,
          success_url: `${window.location.origin}/checkout/success?cycle=${billingCycle}`,
          cancel_url: `${window.location.origin}/checkout/cancel`,
        },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      toast.error(err.message || 'Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleBuyCredits = async (packageId: string) => {
    if (!user) {
      navigate('/auth?tab=signup&redirect=/pricing');
      return;
    }
    if (!subscription || subscription.status === 'none') {
      toast.error('You need an active subscription to buy credits');
      return;
    }
    setCheckoutLoading(packageId);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-credit-checkout', {
        body: {
          package_id: packageId,
          entity_type: subscription.entityType,
          entity_id: subscription.entityId,
          success_url: `${window.location.origin}/checkout/success?type=credits`,
          cancel_url: `${window.location.origin}/checkout/cancel`,
        },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      toast.error(err.message || 'Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero */}
        <div className="relative bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
          <div className="container relative py-16 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Plans & Pricing
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                Choose the right plan for your business. All plans include a founding program offer.
              </p>

              {/* Founding Banner */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm mb-8">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-foreground font-medium">Founding Program:</span>
                <span className="text-muted-foreground">Use code <strong className="text-primary">FOUNDING2026</strong> for 60-day free trial + 25% off for 10 months</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <PromoCodeInput value={promoCode} onChange={setPromoCode} onValidated={setPromoResult} />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="container py-12 space-y-16">
          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center"
                >
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Join <strong className="text-foreground">150+</strong> agencies already growing with BuyWise
            </p>
          </motion.div>

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

          {/* Annual billing context banner */}
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
              <span>SSL-encrypted checkout via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Cancel anytime, no lock-in</span>
            </div>
          </div>

          {/* Feature Comparison */}
          <FeatureComparisonTable plans={filteredPlans} />

          {/* Enterprise CTA Section */}
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
              <Button
                size="lg"
                onClick={() => { setCtaEntityType('agency'); setCtaDialogOpen(true); }}
                className="gap-2 w-full sm:w-auto"
              >
                <Building2 className="h-4 w-4" />
                Contact Agency Sales
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => { setCtaEntityType('developer'); setCtaDialogOpen(true); }}
                className="gap-2 w-full sm:w-auto"
              >
                <Building2 className="h-4 w-4" />
                Contact Developer Sales
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Founding Program */}
          <FoundingProgramSection />

          {/* Enterprise Sales Dialog (CTA section) */}
          <EnterpriseSalesDialog
            open={ctaDialogOpen}
            onOpenChange={setCtaDialogOpen}
            entityType={ctaEntityType}
          />

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secure payments powered by Stripe · All prices in ILS (₪)</span>
          </div>

          {/* Credit Packages */}
          <div id="credits" className="scroll-mt-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Credit Packages
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Credits power visibility boosts — homepage features, city-level priority, and more. Buy once, use anytime.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
              {packages.map((pkg: any, i: number) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <CreditPackageCard
                    name={pkg.name}
                    credits={pkg.credits_included}
                    price={pkg.price_ils}
                    bonusPercent={pkg.bonus_percent}
                    onBuy={() => handleBuyCredits(pkg.id)}
                    loading={checkoutLoading === pkg.id}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <PricingFAQ />
        </div>
      </div>
    </Layout>
  );
}
