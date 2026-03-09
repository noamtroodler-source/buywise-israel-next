import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { 
  Shield, 
  Clock, 
  Heart, 
  Eye,
  ArrowRight,
  Check,
  X,
  Users,
  Calculator,
  BookOpen,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const weAreItems = [
  'A neutral, English-first entry point to Israeli real estate',
  'A clarity layer — market data, pricing context, tax transparency, and process guidance in one place',
  'Pro-agent and pro-professional — we prepare buyers, not replace experts',
  'Independent and unbiased — we don\'t profit from transactions',
];

const weAreNotItems = [
  'A brokerage or agency',
  'Commission-based or transaction-driven',
  'A replacement for lawyers, mortgage brokers, or agents',
  'A listings portal competing with agencies for supply',
];

const principles = [
  {
    icon: Heart,
    title: 'Trust Before Conversion',
    description: 'You should understand the market before you speak to anyone. Our job is to get you there.',
  },
  {
    icon: Clock,
    title: 'Your Timeline, Not Ours',
    description: "We'd rather you take six months to feel ready than rush into something you'll regret.",
  },
  {
    icon: Shield,
    title: 'Honest Ranges, Not False Precision',
    description: 'Real estate is messy. We show ranges and explain why — because false certainty leads to regret.',
  },
  {
    icon: Eye,
    title: 'Transparency as a Feature',
    description: "We tell you what we know, what we estimate, where data comes from — and what we don't claim to know.",
  },
];

const stats = [
  { value: '7', label: 'In-Depth Guides', icon: BookOpen },
  { value: '6', label: 'Financial Calculators', icon: Calculator },
  { value: '15+', label: 'Cities Covered', icon: Building2 },
];

export default function Principles() {
  return (
    <Layout>
      <SEOHead
        title="About BuyWise Israel | Clarity Before Commitment"
        description="BuyWise Israel is the trusted, neutral starting point for international buyers navigating Israeli real estate — with market data, cost transparency, and process guidance."
        canonicalUrl="https://buywiseisrael.com/about"
      />
      <div className="min-h-screen">
        {/* Hero — Lead with the Problem */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20 md:py-28">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                The Market Needed a
                <span className="text-primary block mt-2">Neutral Starting Point.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Every international buyer interested in Israeli property faces the same problem: the only way in is through an agency. There's no trusted platform that orients you to the market, explains the process, and helps you understand what you're looking at — before you're already inside a sales relationship.
              </p>
            </motion.div>
          </div>
        </section>

        {/* The Problem We Solve */}
        <section className="py-14 md:py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
                We're Building That Entry Point
              </h2>
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-6 md:p-8 border border-primary/20">
                <p className="text-base md:text-lg text-foreground leading-relaxed">
                  BuyWise Israel takes on the full responsibility of illuminating the Israeli real estate market for the international buyer — bringing together market data, pricing context, tax and cost transparency, process guidance, and vetted professionals into one clear, personalized, and genuinely useful experience.
                </p>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed mt-4">
                  We do the lifting so agencies don't have to change how they operate — enhancing their listings, elevating their presentation, and ensuring the buyers who reach them arrive informed, serious, and ready.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* We Are / We Are Not */}
        <section className="py-14 md:py-20 bg-muted/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                What BuyWise Is — and Isn't
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-10 max-w-4xl mx-auto">
              {/* We Are */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="font-semibold text-foreground mb-4 text-lg flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  What We Are
                </h3>
                <ul className="space-y-3">
                  {weAreItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-primary mt-1 shrink-0" />
                      <span className="text-muted-foreground text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* We Are Not */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="font-semibold text-foreground mb-4 text-lg flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-destructive/10">
                    <X className="h-4 w-4 text-destructive" />
                  </div>
                  What We're Not
                </h3>
                <ul className="space-y-3">
                  {weAreNotItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <X className="h-4 w-4 text-destructive/70 mt-1 shrink-0" />
                      <span className="text-muted-foreground text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Core Principles */}
        <section className="py-14 md:py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                What We Believe
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These aren't marketing slogans. They're principles built into every feature.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {principles.map((principle, index) => (
                <motion.div
                  key={principle.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                          <principle.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">
                            {principle.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {principle.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof Stats */}
        <section className="py-10 border-y border-border/50">
          <div className="container">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex flex-wrap justify-center gap-8 md:gap-16"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 text-center">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Pro-Agent Section */}
        <section className="py-14 md:py-20 bg-muted/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-6">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Pro-Agent. Pro-Professional. Anti-Pressure.
              </h2>
              <div className="space-y-4 text-left md:text-center">
                <p className="text-muted-foreground leading-relaxed">
                  Agents and professionals are essential — at the right moment. Our role isn't to replace them. It's to <span className="text-foreground font-medium">prepare you for them</span>.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We enhance their listings, elevate their presentation, and ensure the buyers who reach them arrive with better questions, clearer expectations, and less anxiety. That leads to better conversations and better outcomes for everyone.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Explore at your own pace.
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Start with a guide, run the numbers, or browse areas.
                <br />
                No account required. No pressure applied.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg">
                  <Link to="/guides" className="gap-2">
                    Read a Guide
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/tools" className="gap-2">
                    Explore Tools
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/areas" className="gap-2">
                    Browse Areas
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
