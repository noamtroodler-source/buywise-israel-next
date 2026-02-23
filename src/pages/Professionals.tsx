import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { SupportFooter } from '@/components/shared/SupportFooter';
import { PageLoader } from '@/components/shared/PageLoader';
import { ProfessionalCard } from '@/components/professionals/ProfessionalCard';
import { useTrustedProfessionals, getCategoryPluralLabel } from '@/hooks/useTrustedProfessionals';
import { Shield, Scale, Landmark, Info } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/seo';

const CATEGORY_ORDER = ['lawyer', 'mortgage_broker', 'accountant'] as const;

const CATEGORY_META: Record<string, { icon: typeof Scale; subtitle: string }> = {
  lawyer: {
    icon: Scale,
    subtitle: 'Navigate contracts, due diligence, and title registration',
  },
  mortgage_broker: {
    icon: Landmark,
    subtitle: 'Understand financing options and secure the right terms',
  },
  accountant: {
    icon: Shield,
    subtitle: 'Plan for purchase tax, capital gains, and cross-border obligations',
  },
};

export default function Professionals() {
  const { data: professionals, isLoading } = useTrustedProfessionals();

  if (isLoading) return <PageLoader />;

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: (professionals || []).filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <Layout>
      <SEOHead
        title="Trusted Professionals | BuyWise Israel"
        description="Vetted lawyers, mortgage brokers, and accountants who work with international buyers in Israel. Find the right expert for your purchase."
        canonicalUrl={`${SITE_CONFIG.siteUrl}/professionals`}
      />
      <div className="min-h-screen">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20 md:py-28">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                Trusted Professionals
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Buying in Israel requires multiple experts. Language, law, banking, and taxes work differently here. These are professionals that international buyers have successfully worked with.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Category Sections */}
        {grouped.map(({ category, items }) => {
          const meta = CATEGORY_META[category];
          const Icon = meta?.icon || Scale;
          return (
            <section key={category} className="py-12 md:py-16 even:bg-muted/30">
              <div className="container">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="mb-8"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">
                      {getCategoryPluralLabel(category)}
                    </h2>
                  </div>
                  {meta?.subtitle && (
                    <p className="text-muted-foreground ml-12">{meta.subtitle}</p>
                  )}
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((professional, index) => (
                    <ProfessionalCard
                      key={professional.id}
                      professional={professional}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        {/* Empty state */}
        {grouped.length === 0 && !isLoading && (
          <section className="py-20">
            <div className="container text-center">
              <p className="text-muted-foreground text-lg">
                Our directory is being prepared. Check back soon.
              </p>
            </div>
          </section>
        )}

        {/* Trust Disclaimer */}
        <section className="py-12">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-primary/5 rounded-xl p-6 md:p-8 border border-primary/15">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Professionals are selected by BuyWise Israel based on their experience with international buyers. We may receive compensation from listed professionals. We cannot guarantee specific outcomes — the decision to engage is yours alone.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-16">
          <div className="container max-w-xl mx-auto">
            <SupportFooter
              message="Looking for a specific type of professional? [Contact us] and we'll help you find the right expert."
              linkText="Contact us"
              variant="card"
            />
          </div>
        </section>
      </div>
    </Layout>
  );
}
