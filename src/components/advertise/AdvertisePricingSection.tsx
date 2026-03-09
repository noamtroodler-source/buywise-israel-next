import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Star, Building2, ArrowRight, Shield, RefreshCcw, Lock, Zap, Clock, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { EnterpriseSalesDialog } from "@/components/billing/EnterpriseSalesDialog";
import { useFoundingSpots } from "@/hooks/useFoundingSpots";

type EntityTab = "agency" | "developer";

const PLAN_DESCRIPTIONS: Record<string, string> = {
  free: "Try BuyWise with no commitment",
  starter: "Perfect for getting started with the Anglo market",
  growth: "For growing teams ready to scale",
  pro: "For established operations at full capacity",
  enterprise: "Custom solutions for large organizations",
};

function buildFeatures(plan: any, entityType: EntityTab): string[] {
  const features: string[] = [];
  if (plan.max_listings === null) features.push("Unlimited listings");
  else features.push(`Up to ${plan.max_listings} ${entityType === "developer" ? "projects" : "listings"}`);
  if (plan.max_seats === null || plan.max_seats === undefined) features.push("Unlimited team seats");
  else if (plan.max_seats === 1) features.push("1 team seat");
  else features.push(`${plan.max_seats} team seats`);
  if (plan.max_blogs_per_month === null || plan.max_blogs_per_month === undefined)
    features.push("Unlimited blog posts/mo");
  else features.push(`${plan.max_blogs_per_month} blog post${plan.max_blogs_per_month === 1 ? "" : "s"}/mo`);
  if (plan.tier === "starter" || plan.tier === "growth" || plan.tier === "pro") features.push("Analytics dashboard");
  if (plan.tier === "growth" || plan.tier === "pro") features.push("Priority search placement");
  if (plan.tier === "pro") features.push("Priority support");
  return features;
}

function PricingPlanCard({
  plan,
  billingCycle,
  entityType,
  isPopular,
  isFree,
  onGetStarted,
}: {
  plan: any;
  billingCycle: "monthly" | "annual";
  entityType: EntityTab;
  isPopular: boolean;
  isFree: boolean;
  onGetStarted: () => void;
}) {
  const displayPrice =
    isFree
      ? 0
      : billingCycle === "annual" && plan.price_annual_ils
      ? Math.round(plan.price_annual_ils / 12)
      : plan.price_monthly_ils;
  const features = buildFeatures(plan, entityType);

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-200",
        isPopular
          ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
          : "border-border hover:border-primary/40 hover:shadow-md"
      )}
    >
      {isPopular && (
        <div className="absolute -top-3.5 inset-x-0 flex justify-center">
          <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            Most Popular
          </Badge>
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-1">
          {plan.tier === "free"
            ? "Free"
            : plan.tier === "starter"
            ? "Starter"
            : plan.tier === "growth"
            ? "Growth"
            : "Pro"}
        </p>
        <p className="text-sm text-muted-foreground leading-snug">
          {PLAN_DESCRIPTIONS[plan.tier] || ""}
        </p>
      </div>

      <div className="mb-6">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-muted-foreground">₪</span>
            <span className="text-4xl font-bold text-foreground">{displayPrice?.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">/mo</span>
          </div>
          {isFree ? (
            <p className="text-xs text-muted-foreground mt-1">Forever free, no credit card</p>
          ) : billingCycle === "annual" && plan.price_annual_ils ? (
            <p className="text-xs text-primary mt-1">
              Billed ₪{plan.price_annual_ils.toLocaleString()}/year · Save 20%
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">Billed monthly, cancel anytime</p>
          )}
        </div>
      </div>

      <ul className="space-y-2.5 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{f}</span>
          </li>
        ))}
      </ul>

      <Button
        className="w-full"
        variant={isPopular ? "default" : "outline"}
        onClick={onGetStarted}
      >
        {isFree ? "Start for Free" : "Get Started"}
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>

      {!isFree && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          No credit card required to register
        </p>
      )}
    </div>
  );
}

function EnterpriseBanner({
  plan,
  entityType,
  onContactSales,
}: {
  plan: any;
  entityType: EntityTab;
  onContactSales: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-6xl mx-auto">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Enterprise — fully custom-quoted</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Volume pricing, custom SLAs, dedicated account manager, and white-glove onboarding for large {entityType === "developer" ? "development" : "agency"} operations.
          </p>
        </div>
      </div>
      <Button variant="outline" className="shrink-0" onClick={onContactSales}>
        Contact Sales
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}

function FoundingProgramCallout() {
  const { data, isLoading } = useFoundingSpots();
  const remaining = data?.remaining ?? 0;
  const navigate = useNavigate();

  if (isLoading || remaining <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="max-w-3xl mx-auto mb-10"
    >
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-800/40 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-amber-600 fill-amber-500" />
              <h3 className="font-bold text-foreground">Founding Partner Program</h3>
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 text-[10px]">
                {remaining} of 15 spots left
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Be one of our first 15 launch partners and get exclusive benefits.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                <Clock className="h-3 w-3" /> 60-day free trial
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                <Home className="h-3 w-3" /> 3 free featured listings/mo
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                <Sparkles className="h-3 w-3" /> Featured case study
              </span>
            </div>
          </div>
          <Button
            onClick={() => navigate("/auth?tab=signup&role=agency&promo=FOUNDING2026")}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
          >
            Claim Your Spot
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function AdvertisePricingSection() {
  const [entityTab, setEntityTab] = useState<EntityTab>("agency");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [enterpriseDialogOpen, setEnterpriseDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["membership-plans-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const filteredPlans = plans.filter((p: any) => p.entity_type === entityTab);
  const mainPlans = filteredPlans.filter((p: any) => p.tier !== "enterprise");
  const enterprisePlan = filteredPlans.find((p: any) => p.tier === "enterprise");

  const handleGetStarted = (plan: any) => {
    if (plan.tier === "enterprise") {
      setEnterpriseDialogOpen(true);
      return;
    }
    sessionStorage.setItem("intended_plan_tier", plan.tier);
    sessionStorage.setItem("intended_plan_entity", entityTab);
    navigate(`/auth?tab=signup&role=${entityTab}`);
  };

  return (
    <section id="pricing" className="py-20 bg-muted/30 scroll-mt-20">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">
            <Zap className="h-3 w-3 mr-1.5" />
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Plans That Grow With You
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Start free, upgrade when you're ready. No hidden fees, no surprises — just straightforward pricing for the Anglo market.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          {/* Entity type toggle */}
          <div className="inline-flex items-center rounded-xl bg-muted p-1 gap-1">
            <button
              onClick={() => setEntityTab("agency")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                entityTab === "agency"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Agency Plans
              </span>
            </button>
            <button
              onClick={() => setEntityTab("developer")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                entityTab === "developer"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Developer Plans
              </span>
            </button>
          </div>

          {/* Billing cycle toggle */}
          <div className="inline-flex items-center rounded-xl bg-muted p-1 gap-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                billingCycle === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                billingCycle === "annual"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Annual
              <Badge className="ml-1.5 text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">
                Save 20%
              </Badge>
            </button>
          </div>
        </motion.div>

        {/* Annual notice */}
        {billingCycle === "annual" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-center text-foreground">
              Annual plans are billed as a single payment for the full year — you save 20% vs. monthly.
            </div>
          </motion.div>
        )}

        {/* Plan cards — Free, Starter, Growth, Pro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto mb-6"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-6 animate-pulse h-80" />
              ))
            : mainPlans.map((plan: any) => (
                <PricingPlanCard
                  key={plan.id}
                  plan={plan}
                  billingCycle={billingCycle}
                  entityType={entityTab}
                  isPopular={plan.tier === "growth"}
                  isFree={plan.tier === "free"}
                  onGetStarted={() => handleGetStarted(plan)}
                />
              ))}
        </motion.div>

        {/* Enterprise banner */}
        {(enterprisePlan || !isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-12"
          >
            <EnterpriseBanner
              plan={enterprisePlan}
              entityType={entityTab}
              onContactSales={() => setEnterpriseDialogOpen(true)}
            />
          </motion.div>
        )}

        {/* Founding Program Callout */}
        <FoundingProgramCallout />

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
        >
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
        </motion.div>
      </div>

      <EnterpriseSalesDialog
        open={enterpriseDialogOpen}
        onOpenChange={setEnterpriseDialogOpen}
        entityType={entityTab}
      />
    </section>
  );
}
