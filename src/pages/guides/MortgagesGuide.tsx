import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DualNavigation } from '@/components/shared/DualNavigation';
import {
  Landmark,
  AlertTriangle,
  Calculator,
  BookOpen,
  Users,
  ArrowRight,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GuideCTACard } from '@/components/tools/shared/GuideCTACard';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'hard-numbers', label: 'The Numbers' },
  { id: 'process', label: 'The Process' },
  { id: 'gotchas', label: 'Gotchas' },
  { id: 'broker', label: 'Brokers' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const ltvData = [
  { status: 'First-time Israeli resident', ltv: '75%', note: 'Highest access' },
  { status: 'Oleh Chadash (new immigrant)', ltv: '75%', note: 'Same as first-time resident' },
  { status: 'Upgrader (selling existing)', ltv: '70%', note: 'Must sell within 24 months' },
  { status: 'Investor / second property', ltv: '50%', note: 'Strictest tier' },
  { status: 'Foreign buyer (non-resident)', ltv: '50–70%', note: 'Bank discretion; strong profiles may reach 70%' },
];

const trackData = [
  { track: 'Prime-linked (variable)', rate: 'Prime ± spread', risk: 'Medium', note: 'Moves with Bank of Israel rate' },
  { track: 'Fixed-rate (not CPI-linked)', rate: '4–6%', risk: 'Low', note: 'Locked for full term; prepayment penalties apply' },
  { track: 'CPI-linked fixed', rate: '2–4% + CPI', risk: 'Medium', note: 'Real rate is low but total rises with inflation' },
  { track: 'Foreign-currency (USD/EUR)', rate: 'Benchmark + 1.5–3%', risk: 'High', note: 'Matches foreign income; carries exchange-rate risk' },
];

const processSteps = [
  {
    step: 1,
    title: 'Indicative assessment',
    timing: 'Before or during property search',
    detail: 'Banks give a non-binding estimate of borrowing capacity based on income, assets, and residency status. This is not a pre-approval — no property is evaluated yet.',
  },
  {
    step: 2,
    title: 'Contract signed + deposit paid',
    timing: 'Typically 10–20% of purchase price',
    detail: 'You commit to the purchase before the bank commits to the loan. There is usually no financing contingency in Israeli contracts.',
  },
  {
    step: 3,
    title: 'Appraisal + underwriting',
    timing: '2–6 weeks after contract',
    detail: 'Bank orders a property appraisal (₪2,500–4,000). If the appraisal comes in below purchase price, your loan amount drops — you cover the gap from equity.',
  },
  {
    step: 4,
    title: 'Final approval + lien registration',
    timing: 'Before closing',
    detail: 'Bank issues a binding approval letter. Your lawyer registers a lien (mashkanta) on the property. Funds are released per the payment schedule.',
  },
  {
    step: 5,
    title: 'Repayments begin',
    timing: 'After funds are disbursed',
    detail: 'Monthly payments start on each disbursed tranche. Full ownership registration may continue after key handover.',
  },
];

const gotchas = [
  {
    title: 'Pre-approval is not binding and rates are not locked',
    content: 'An indicative assessment from a bank is just that — indicative. The bank can change terms, reduce the amount, or decline entirely after seeing the contract and appraisal. Interest rates quoted before closing are not locked and can shift.',
  },
  {
    title: 'There is no financing contingency',
    content: 'Israeli purchase contracts rarely include a clause that lets you withdraw if financing falls through. If the bank declines your mortgage after you\'ve signed, you still owe the deposit — typically 10–20% of the property price.',
  },
  {
    title: 'Appraisals can fall short of the purchase price',
    content: 'If the bank\'s appraiser values the property at ₪2.2M but you agreed to pay ₪2.5M, the bank lends against ₪2.2M. At 50% LTV, that\'s ₪1.1M instead of ₪1.25M — a ₪150k gap you need to cover in cash.',
  },
  {
    title: 'Banks treat each profile differently',
    content: 'Two buyers with similar income can get different terms from the same bank. Foreign income, self-employment, non-standard documentation, or lack of Israeli credit history all trigger additional scrutiny or lower LTV.',
  },
  {
    title: 'Documentation is extensive and locally oriented',
    content: 'Expect requests for Israeli bank account statements (even for foreign buyers), translated tax returns, proof of funds origin, and sometimes local guarantors (arev). Gathering and translating everything takes weeks.',
  },
];

export default function MortgagesGuide() {
  useTrackContentVisit('guide');
  const [showNav, setShowNav] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      setShowNav(window.scrollY > 300);

      const sections = navSections.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 150;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navSections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Mortgages in Israel for Foreign Buyers | BuyWise Israel"
        description="LTV limits, multi-track structure, timeline, and what catches foreign buyers off guard about Israeli mortgages."
        canonicalUrl="https://buywiseisrael.com/guides/mortgages"
      />
      <div className="min-h-screen bg-background">
        {/* Sticky Navigation */}
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: showNav ? 0 : -100 }}
          className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm"
        >
          <div className="container py-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {navSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors',
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  )}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/3 to-transparent" />
          <div className="container relative py-12 md:py-16">
            <DualNavigation parentLabel="All Guides" parentPath="/guides" className="mb-4" />
            <motion.div {...fadeInUp} className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4">
                <Landmark className="h-3.5 w-3.5 mr-1.5" />
                Essential Guide
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Mortgages in <span className="text-primary">Israel</span> for Foreign Buyers
              </h1>
              <p className="text-muted-foreground text-lg mb-6">
                LTV limits, multi-track loans, the reversed timeline, and why financing feels opaque.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span>{navSections.length} sections</span>
                <span>•</span>
                <span>~15 min read</span>
                <span>•</span>
                <span>Updated 2026</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 1. Overview */}
        <section id="overview" className="container py-12">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            {/* Reality callout */}
            <div className="p-5 rounded-xl bg-primary/5 border border-primary/10 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">The core difference</h3>
                  <p className="text-muted-foreground">
                    In Israel, you sign the contract and pay a deposit <span className="font-medium text-foreground">before</span> the bank commits to your loan. There is usually no financing contingency. The bank's binding approval comes after the property appraisal — weeks after you've already committed.
                  </p>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-border bg-card">
                <p className="text-3xl font-bold text-primary mb-1">50–70%</p>
                <p className="text-sm font-medium text-foreground">Max LTV for foreign buyers</p>
                <p className="text-xs text-muted-foreground mt-1">75% for first-time Israeli residents · 50% for investors</p>
              </div>
              <div className="p-5 rounded-xl border border-border bg-card">
                <p className="text-3xl font-bold text-primary mb-1">40%</p>
                <p className="text-sm font-medium text-foreground">Max debt-to-income ratio</p>
                <p className="text-xs text-muted-foreground mt-1">Bank of Israel Directive 329 · Applied to net monthly income</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 2. The Hard Numbers */}
        <section id="hard-numbers" className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-2">The Hard Numbers</h2>
            <p className="text-muted-foreground mb-8">
              Bank of Israel regulations set the boundaries. Individual banks decide where within those boundaries you land.
            </p>

            {/* LTV Table */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-foreground mb-3">Maximum LTV by buyer status</h3>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Buyer Status</TableHead>
                      <TableHead>Max LTV</TableHead>
                      <TableHead className="hidden sm:table-cell">Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ltvData.map((row) => (
                      <TableRow key={row.status}>
                        <TableCell className="font-medium">{row.status}</TableCell>
                        <TableCell className="text-primary font-semibold">{row.ltv}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{row.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Costs */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-foreground mb-3">Mortgage-specific costs</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-sm text-muted-foreground mb-1">File-opening fee</p>
                  <p className="text-xl font-bold text-foreground">₪360</p>
                  <p className="text-xs text-muted-foreground">Capped by law</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-sm text-muted-foreground mb-1">Property appraisal</p>
                  <p className="text-xl font-bold text-foreground">₪2,500–4,000</p>
                  <p className="text-xs text-muted-foreground">Ordered by bank after contract</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-sm text-muted-foreground mb-1">Broker fee (optional)</p>
                  <p className="text-xl font-bold text-foreground">0.3–0.5%</p>
                  <p className="text-xs text-muted-foreground">Of loan amount · ₪4k–9k typical</p>
                </div>
              </div>
            </div>

            {/* Olim Zakaut */}
            <div className="p-5 rounded-xl bg-primary/5 border border-primary/10 mb-10">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Olim: Zakaut mortgage</h3>
                  <p className="text-sm text-muted-foreground">
                    New immigrants within 15 years of aliyah may access a government-backed loan at ~3% fixed CPI-linked rate with no prepayment penalty. The eligible amount is limited and varies by family size and aliyah date. Applied through select banks only.
                  </p>
                </div>
              </div>
            </div>

            {/* Multi-track structure */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Multi-track loan structure</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Israeli mortgages combine multiple sub-loans ("tracks"), each with different rate types and risk profiles. This is unusual compared to the single-rate mortgages common in the US/UK.
              </p>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Track</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead className="hidden sm:table-cell">Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trackData.map((row) => (
                      <TableRow key={row.track}>
                        <TableCell className="font-medium">{row.track}</TableCell>
                        <TableCell className="text-sm">{row.rate}</TableCell>
                        <TableCell>
                          <span className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full',
                            row.risk === 'Low' && 'bg-emerald-500/10 text-emerald-600',
                            row.risk === 'Medium' && 'bg-amber-500/10 text-amber-600',
                            row.risk === 'High' && 'bg-red-500/10 text-red-600',
                          )}>
                            {row.risk}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{row.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 3. The Process */}
        <section id="process" className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-2">The Process</h2>
            <p className="text-muted-foreground mb-8">
              Five stages from first bank conversation to monthly payments. Note the reversed sequence: commitment comes before the bank's binding approval.
            </p>

            <div className="space-y-0">
              {processSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="flex gap-4"
                >
                  {/* Timeline line + circle */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {step.step}
                    </div>
                    {index < processSteps.length - 1 && (
                      <div className="w-px flex-1 bg-border my-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn('pb-8', index === processSteps.length - 1 && 'pb-0')}>
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="text-xs text-primary font-medium mb-1">{step.timing}</p>
                    <p className="text-sm text-muted-foreground">{step.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* 4. What Catches Foreign Buyers Off Guard */}
        <section id="gotchas" className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-2">What Catches Foreign Buyers Off Guard</h2>
            <p className="text-muted-foreground mb-6">
              These aren't edge cases — they come up in the majority of foreign-buyer transactions.
            </p>

            <Accordion type="single" collapsible className="w-full">
              {gotchas.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{item.content}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </section>

        {/* 5. Working With a Mortgage Broker */}
        <section id="broker" className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-2">Working With a Mortgage Broker</h2>
            <p className="text-muted-foreground mb-6">
              For foreign buyers, a mortgage broker isn't a luxury — it's the most practical way to navigate a system where terms vary by bank, documentation requirements are opaque, and you're negotiating across languages and time zones.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="p-5 rounded-xl border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-2">What they do</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Compare offers across 3–5 banks simultaneously</li>
                  <li>• Structure the multi-track split to match your risk tolerance</li>
                  <li>• Handle Hebrew documentation and bank communication</li>
                  <li>• Flag appraisal risks before you sign the contract</li>
                </ul>
              </div>
              <div className="p-5 rounded-xl border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-2">What it costs</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Typically 0.3–0.5% of the loan amount. On a ₪1.25M mortgage, that's ₪3,750–6,250.
                </p>
                <h3 className="font-semibold text-foreground mb-2">When to engage</h3>
                <p className="text-sm text-muted-foreground">
                  Before you start viewing properties seriously. An early indicative assessment helps you understand your real budget — not the number you hope for.
                </p>
              </div>
            </div>

            <Link
              to="/professionals"
              className="group flex items-center gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold group-hover:text-primary transition-colors">
                  Browse vetted mortgage brokers
                </p>
                <p className="text-sm text-muted-foreground">
                  Our professionals directory includes brokers who specialize in working with international buyers.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </motion.div>
        </section>

        {/* Bottom CTAs */}
        <section className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-foreground mb-4">Keep going</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                to="/tools/mortgage-calculator"
                className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <p className="font-semibold group-hover:text-primary transition-colors">Mortgage Calculator</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Model monthly payments across different LTV, rate, and track combinations.
                </p>
              </Link>

              <GuideCTACard
                guideSlug="true-cost"
                title="The True Cost of Buying"
                description="All the fees beyond the listing price — taxes, legal, currency conversion, and more."
              />

              <GuideCTACard
                guideSlug="purchase-tax"
                title="Purchase Tax Guide"
                description="How Mas Rechisha brackets work and what foreign buyers actually pay."
              />
            </div>
          </motion.div>
        </section>
      </div>
    </Layout>
  );
}
