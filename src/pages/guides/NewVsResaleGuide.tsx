import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { 
  Scale, 
  BookOpen, 
  Clock, 
  ChevronRight,
  Shield,
  FileText,
  Landmark,
  CreditCard,
  Receipt,
  Layout,
  TrendingUp,
  Building,
  Home,
  Users,
  Plane,
  CheckCircle,
  Calculator,
  HardHat,
  Search,
  Eye,
  Paintbrush,
  Calendar,
  Banknote,
  MapPin,
  FileSignature,
  ArrowRight
} from 'lucide-react';
import { Layout as PageLayout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';

const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'comparison', label: 'Side-by-Side' },
  { id: 'costs', label: 'Real Costs' },
  { id: 'choose-new', label: 'Choose New If…' },
  { id: 'choose-resale', label: 'Choose Resale If…' },
  { id: 'buyer-status', label: 'Buyer Status' },
  { id: 'closing', label: 'Bottom Line' },
];

const comparisonRows = [
  {
    category: 'Contract',
    icon: FileSignature,
    newCol: 'Standardized developer contract under Sale Law 1973. Includes a mifrat (technical spec) listing every finish and fixture.',
    resaleCol: 'Bespoke contract negotiated between buyer and seller lawyers. No standard template.',
  },
  {
    category: 'Payment',
    icon: CreditCard,
    newCol: 'Staged payments over 2–4 years tied to construction milestones (foundation, frame, finishes). Typically 10–20% at signing, remainder spread across stages.',
    resaleCol: 'Concentrated: 10–20% deposit at signing, balance at closing (usually 60–90 days later).',
  },
  {
    category: 'What You See',
    icon: Eye,
    newCol: "Floor plans, renderings, and a model apartment. The actual unit doesn't exist yet. Final details may change after permits.",
    resaleCol: 'The actual apartment. You walk through it, check the plumbing, see the neighbors, hear the street noise.',
  },
  {
    category: 'Timeline',
    icon: Calendar,
    newCol: 'Contract to keys: typically 2–4 years. Delays of 6–18 months are common due to permits and construction.',
    resaleCol: 'Contract to keys: typically 60–90 days. Faster if no mortgage needed.',
  },
  {
    category: 'Legal Protections',
    icon: Shield,
    newCol: "The 7% rule: developers cannot collect more than 7% of price without providing a bank guarantee, insurance policy, first mortgage, warning notice (he'arat azhara), or property rights transfer.",
    resaleCol: "No statutory safeguard mechanism. Protection comes from your lawyer's due diligence: title search, lien check, municipal debt verification.",
  },
  {
    category: 'Registration',
    icon: FileText,
    newCol: 'First recorded in a Housing Company ledger. Transfer to Tabu (Land Registry) can take months to years after move-in.',
    resaleCol: 'Registered in Tabu shortly after closing, typically within a few weeks.',
  },
  {
    category: 'Price Adjustments',
    icon: TrendingUp,
    newCol: 'Payments linked to the Construction Input Index (Madad Tsumin). If the index rises 4% on a ₪1.5M remaining balance, you owe an extra ₪60K.',
    resaleCol: 'Price is fixed at contract signing. No index linkage.',
  },
  {
    category: 'Customization',
    icon: Paintbrush,
    newCol: 'Choose flooring, kitchen layout, bathroom tiles, electrical outlet placement—within the developer\'s menu and timelines.',
    resaleCol: 'What you see is what you get. Changes require renovation after purchase.',
  },
];

export default function NewVsResaleGuide() {
  useTrackContentVisit('guide');
  const [activeSection, setActiveSection] = useState('overview');
  const [showStickyNav, setShowStickyNav] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyNav(window.scrollY > 300);
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
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-12 md:py-16">
            <DualNavigation parentLabel="All Guides" parentPath="/guides" className="mb-4" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4"><Scale className="h-3 w-3 mr-1" />Essential Guide</Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                New Construction vs Resale in <span className="text-primary">Israel</span>
                <span className="block mt-2">What's Really Different</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-6">Two different buying processes, not just two ages of apartment</p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />7 sections</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />~12 min read</span>
                <span>Updated 2026</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Sticky Nav */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showStickyNav ? 1 : 0, y: showStickyNav ? 0 : -20 }}
          className={cn("fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b transition-all", !showStickyNav && "pointer-events-none")}
        >
          <div className="container py-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {navSections.map((section) => (
                <button key={section.id} onClick={() => scrollToSection(section.id)} className={cn("px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors", activeSection === section.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </motion.nav>

        {/* Content */}
        <div className="container py-12">
          <div className="max-w-4xl mx-auto space-y-16">

            {/* 1. Overview */}
            <section id="overview" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
                  <p className="text-lg font-medium text-foreground mb-3">
                    In Israel, "new construction" and "resale" aren't just about the age of the building. They're two entirely different buying processes—different contracts, different payment structures, different legal protections, and different risk profiles.
                  </p>
                  <p className="text-muted-foreground">
                    A new-build purchase is governed by the Sale Law (1973) with standardized developer contracts and staged payments over years. A resale purchase is a private transaction with negotiated terms and a 60–90 day close. This guide breaks down the concrete differences so you can decide which process fits your situation.
                  </p>
                </div>
              </motion.div>
            </section>

            {/* 2. Side-by-Side Comparison */}
            <section id="comparison" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Side-by-Side Comparison</h2>
                  <p className="text-muted-foreground">Eight categories where new and resale diverge in practice.</p>
                </div>
                <div className="space-y-4">
                  {comparisonRows.map((row, i) => (
                    <motion.div
                      key={row.category}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-xl border bg-card overflow-hidden"
                    >
                      <div className="flex items-center gap-2 px-5 py-3 bg-muted/50 border-b">
                        <row.icon className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-foreground text-sm">{row.category}</h3>
                      </div>
                      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                        <div className="p-4">
                          <span className="text-xs font-medium text-primary uppercase tracking-wide">New Construction</span>
                          <p className="text-sm text-muted-foreground mt-1.5">{row.newCol}</p>
                        </div>
                        <div className="p-4">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resale</span>
                          <p className="text-sm text-muted-foreground mt-1.5">{row.resaleCol}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* 3. Real Costs */}
            <section id="costs" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Real Costs: ₪2.5M Reference Apartment</h2>
                  <p className="text-muted-foreground">Concrete numbers so you can compare apples to apples.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* New Construction Column */}
                  <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="px-5 py-3 bg-primary/10 border-b">
                      <div className="flex items-center gap-2">
                        <HardHat className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-foreground">New Construction</h3>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      {[
                        { label: 'Listed price', value: '₪2,500,000', note: 'Includes VAT' },
                        { label: 'VAT embedded in price', value: '₪382,000', note: '18% already built into the listed price' },
                        { label: 'Lawyer (developer\'s)', value: '₪25,000–50,000', note: '1–2% + VAT, paid to developer\'s attorney' },
                        { label: 'Your lawyer', value: '₪12,500–25,000', note: '0.5–1% + VAT' },
                        { label: 'Index linkage risk', value: '₪0–60,000+', note: 'If Construction Input Index rises 4% on ₪1.5M balance = ₪60K extra' },
                        { label: 'Lost rental income', value: '~₪252,000', note: '₪7K/mo × 36 months while waiting for construction' },
                        { label: 'Finishing extras', value: '₪20,000–80,000', note: 'Upgrades beyond base mifrat (closets, A/C, blinds)' },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.note}</p>
                          </div>
                          <span className="text-sm font-semibold text-foreground whitespace-nowrap">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resale Column */}
                  <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="px-5 py-3 bg-muted/50 border-b">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-foreground">Resale</h3>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      {[
                        { label: 'Listed price', value: '₪2,500,000', note: 'No VAT on private sales' },
                        { label: 'Your lawyer', value: '₪12,500–25,000', note: '0.5–1% + VAT' },
                        { label: 'Agent fee', value: '₪44,250–73,750', note: '1.5–2.5% + VAT (negotiable, often buyer pays)' },
                        { label: 'Renovation budget', value: '₪80,000–250,000', note: 'Kitchen ₪40–80K, bathroom ₪25–30K each, varies heavily by condition' },
                        { label: 'Appraisal', value: '₪1,500–3,500', note: 'Required by bank for mortgage' },
                        { label: 'Index linkage risk', value: '₪0', note: 'Price locked at signing' },
                        { label: 'Rental income (if investing)', value: 'Immediate', note: 'Can rent out within weeks of closing' },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.note}</p>
                          </div>
                          <span className="text-sm font-semibold text-foreground whitespace-nowrap">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> Purchase tax (mas rechisha) applies to both paths. Rates depend on buyer status—see the Buyer Status section below. These figures use 2025/2026 rates and are estimates for illustration.
                  </p>
                </div>
              </motion.div>
            </section>

            {/* 4. Choose New If… */}
            <section id="choose-new" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Choose New Construction If…</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      icon: Calendar,
                      title: 'You\'re not in a rush',
                      desc: 'You have 2–4 years before you need to move in, and you\'re okay with potential delays. You have stable housing in the meantime.',
                    },
                    {
                      icon: Banknote,
                      title: 'Staged payments help your cash flow',
                      desc: 'Spreading payments over construction milestones means you don\'t need the full amount upfront. Useful if you\'re selling another asset or accumulating savings.',
                    },
                    {
                      icon: Paintbrush,
                      title: 'Finishes matter to you',
                      desc: 'You want to pick your flooring, kitchen layout, and bathroom tiles rather than renovating after purchase. The mifrat lets you choose within the developer\'s menu.',
                    },
                    {
                      icon: Building,
                      title: 'You want modern building standards',
                      desc: 'New builds comply with Teken 413 (insulation standard), have elevators, structured parking, and mamad (safe room). Older buildings often lack these.',
                    },
                  ].map((card, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <card.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
                          <p className="text-sm text-muted-foreground">{card.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* 5. Choose Resale If… */}
            <section id="choose-resale" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Choose Resale If…</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      icon: Eye,
                      title: 'You want to see what you\'re buying',
                      desc: 'Walk through the apartment, check water pressure, hear the street noise, meet the neighbors. No surprises about what the finished product looks like.',
                    },
                    {
                      icon: Clock,
                      title: 'You need to move in soon',
                      desc: 'Closing in 60–90 days means you can plan around a real date. No construction delays, no waiting for Tofes 4 (occupancy certificate).',
                    },
                    {
                      icon: MapPin,
                      title: 'Location in an established neighborhood',
                      desc: 'Schools, shops, transit, and community are already there. New developments are sometimes in areas that are still being built up around you.',
                    },
                    {
                      icon: Receipt,
                      title: 'You want immediate rental income',
                      desc: 'If you\'re buying as an investment, a resale apartment can be rented out within weeks. A new build sits empty for 2–4 years during construction.',
                    },
                  ].map((card, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted shrink-0">
                          <card.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
                          <p className="text-sm text-muted-foreground">{card.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* 6. Buyer Status */}
            <section id="buyer-status" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">How Your Buyer Status Changes the Equation</h2>
                  <p className="text-muted-foreground">The same apartment at the same price costs different amounts depending on who you are.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      icon: Home,
                      title: 'Israeli Residents (First Apartment)',
                      points: [
                        'Purchase tax: 0% on first ₪1.978M, then 3.5–5% on remainder',
                        'LTV: up to 75% mortgage',
                        'May access Mechir L\'Mishtaken (gov\'t price-capped lotteries) for new projects',
                        'Language advantage for navigating developer contracts and municipal offices',
                      ],
                    },
                    {
                      icon: Users,
                      title: 'Olim (New Immigrants)',
                      points: [
                        'Same tax brackets as first-time buyers if buying sole property',
                        'LTV: up to 75%',
                        'Zakaut eligibility: various benefits within first 15 years of aliyah',
                        'Contracts and mifrat are in Hebrew—budget for translation or bilingual lawyer',
                      ],
                    },
                    {
                      icon: Plane,
                      title: 'Foreign Buyers (Non-Residents)',
                      points: [
                        'Purchase tax: 8% from first shekel, 10% above ~₪6M',
                        'LTV: typically capped at 50%',
                        'New construction: need Power of Attorney (POA) for someone in Israel to manage milestone inspections and payment confirmations',
                        'Can\'t access Mechir L\'Mishtaken lotteries',
                      ],
                    },
                    {
                      icon: Building,
                      title: 'Investors (Own Another Property)',
                      points: [
                        'Purchase tax: 8% from first shekel (same as foreign buyers)',
                        'LTV: up to 50% for investment property',
                        'New construction: appreciation potential but no rental income for years',
                        'Resale: immediate rental income, typically ₪5–8K/mo for a 3-room in central areas',
                      ],
                    },
                  ].map((status, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="p-5 rounded-xl bg-card border"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <status.icon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">{status.title}</h3>
                      </div>
                      <div className="space-y-2">
                        {status.points.map((point, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0 mt-1" />
                            <p className="text-sm text-muted-foreground">{point}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* 7. Bottom Line */}
            <section id="closing" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
                  <Scale className="h-8 w-8 text-primary mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-4">Bottom Line</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      <strong className="text-foreground">New construction</strong> trades time and certainty for staged payments, customization, and modern standards. You're committing to a process that takes years, carries index-linkage and delay risk, and won't produce rental income until it's done.
                    </p>
                    <p>
                      <strong className="text-foreground">Resale</strong> trades customization for immediacy and visibility. You see exactly what you're buying, close in months, and can generate income right away—but you may need to renovate, and you lose the staged-payment flexibility.
                    </p>
                    <p className="font-medium text-foreground">
                      Neither is inherently better. The right choice depends on your timeline, cash flow, tolerance for uncertainty, and whether you need the apartment now or in three years.
                    </p>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* CTA Footer */}
            <section className="pt-8 border-t">
              <div className="grid md:grid-cols-3 gap-4">
                <Link to="/tools" className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors group">
                  <Calculator className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">True Cost Calculator</h3>
                  <p className="text-sm text-muted-foreground">Estimate total costs for new or resale purchases</p>
                  <ChevronRight className="h-4 w-4 text-primary mt-2" />
                </Link>
                <Link to="/guides" className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors group">
                  <BookOpen className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">More Guides</h3>
                  <p className="text-sm text-muted-foreground">Explore our complete guide collection</p>
                  <ChevronRight className="h-4 w-4 text-primary mt-2" />
                </Link>
                <Link to="/guides/mortgages" className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors group">
                  <Landmark className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">Mortgages Guide</h3>
                  <p className="text-sm text-muted-foreground">Understand financing for either path</p>
                  <ChevronRight className="h-4 w-4 text-primary mt-2" />
                </Link>
              </div>
            </section>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}
