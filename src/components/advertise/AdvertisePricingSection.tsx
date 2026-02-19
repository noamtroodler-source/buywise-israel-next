import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Star, Building2, ArrowRight, Shield, RefreshCcw, Lock, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { EnterpriseSalesDialog } from "@/components/billing/EnterpriseSalesDialog";

type EntityTab = "agency" | "developer";

const PLAN_DESCRIPTIONS: Record<string, string> = {
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
  else features.push(`${plan.max_blogs_per_month} blog posts/mo`);
  if (plan.tier === "growth" || plan.tier === "pro") features.push("Priority search placement");
  if (plan.tier === "pro" || plan.tier === "enterprise") features.push("Priority support");
  if (plan.tier === "enterprise") features.push("Dedicated account manager");
  return features;
}

function PricingPlanCard({
  plan,
  billingCycle,
  entityType,
  isPopular,
  isEnterprise,
  onGetStarted,
}: {
  plan: any;
  billingCycle: "monthly" | "annual";
  entityType: EntityTab;
  isPopular: boolean;
  isEnterprise: boolean;
  onGetStarted: () => void;
}) {
  const displayPrice =
    billingCycle === "annual" && plan.price_annual_ils
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
          {plan.tier === "starter"
            ? "Starter"
            : plan.tier === "growth"
            ? "Growth"
            : plan.tier === "pro"
            ? "Pro"
            : "Enterprise"}
        </p>
        <p className="text-sm text-muted-foreground leading-snug">
          {PLAN_DESCRIPTIONS[plan.tier] || ""}
        </p>
      </div>

      <div className="mb-6">
        {isEnterprise ? (
          <div>
            <p className="text-3xl font-bold text-foreground">Custom</p>
            <p className="text-sm text-muted-foreground mt-1">Contact us for pricing</p>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-muted-foreground">₪</span>
              <span className="text-4xl font-bold text-foreground">{displayPrice?.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
            {billingCycle === "annual" && plan.price_annual_ils && (
              <p className="text-xs text-primary mt-1">
                Billed ₪{plan.price_annual_ils.toLocaleString()}/year · Save 20%
              </p>
            )}
            {billingCycle === "monthly" && (
              <p className="text-xs text-muted-foreground mt-1">Billed monthly, cancel anytime</p>
            )}
          </div>
        )}
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
        variant={isPopular ? "default" : isEnterprise ? "outline" : "outline"}
        onClick={onGetStarted}
      >
        {isEnterprise ? "Contact Sales" : "Get Started — it's free"}
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>

      {!isEnterprise && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          No credit card required to register
        </p>
      )}
    </div>
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

  const handleGetStarted = (plan: any) => {
    if (plan.tier === "enterprise") {
      setEnterpriseDialogOpen(true);
      return;
    }
    // Store intent in sessionStorage for post-approval flow
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

        {/* Plan cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto mb-12"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-6 animate-pulse h-80" />
              ))
            : filteredPlans.map((plan: any) => (
                <PricingPlanCard
                  key={plan.id}
                  plan={plan}
                  billingCycle={billingCycle}
                  entityType={entityTab}
                  isPopular={plan.tier === "growth"}
                  isEnterprise={plan.tier === "enterprise"}
                  onGetStarted={() => handleGetStarted(plan)}
                />
              ))}
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mb-12"
        >
          <div className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 text-primary" />
            <span>30-day satisfaction guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <span>Secure SSL-encrypted checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Cancel anytime, no lock-in</span>
          </div>
        </motion.div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-background p-8 text-center max-w-3xl mx-auto"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Need a Custom Solution?
          </h3>
          <p className="text-muted-foreground mb-6 text-sm max-w-lg mx-auto">
            Large portfolio, volume listings, white-label options, or a dedicated account manager? Our enterprise plans are fully custom-quoted.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => { setEntityTab("agency"); setEnterpriseDialogOpen(true); }}
              className="gap-2 w-full sm:w-auto"
            >
              <Building2 className="h-4 w-4" />
              Agency Enterprise
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => { setEntityTab("developer"); setEnterpriseDialogOpen(true); }}
              className="gap-2 w-full sm:w-auto"
            >
              <Building2 className="h-4 w-4" />
              Developer Enterprise
              <ArrowRight className="h-4 w-4" />
            </Button>
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
