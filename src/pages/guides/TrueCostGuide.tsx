import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { 
  BadgeDollarSign, 
  Clock, 
  FileText, 
  Calculator, 
  BookOpen, 
  ChevronRight,
  AlertCircle,
  Landmark,
  Users,
  Wallet,
  Wrench,
  ArrowRightLeft,
  Truck,
  PaintBucket,
  ClipboardList,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'cost-categories', label: 'Categories' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'mistakes', label: 'Mistakes' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const costCategories = [
  {
    icon: Landmark,
    title: 'Purchase Tax (Mas Rechisha)',
    description: 'Brackets depend on buyer status: ~3.5% effective for a first-home local buyer on a ₪2.5M property, up to 8–10% for foreign/investor buyers.',
    range: 'Varies by status',
    note: 'See our Purchase Tax Guide for exact brackets →',
    link: '/guides/purchase-tax',
  },
  {
    icon: FileText,
    title: 'Legal Fees',
    description: 'Your lawyer handles due diligence, contract drafting, title registration and tax filing.',
    range: '0.5–1.5% + VAT',
    example: '₪15k–44k on a ₪2.5M property',
  },
  {
    icon: Users,
    title: 'Agent Commission',
    description: 'Buyer pays their own agent. Seller pays theirs. Not included in the listing price.',
    range: '1–2% + VAT',
    example: '₪29k–59k on a ₪2.5M property',
  },
  {
    icon: CreditCard,
    title: 'Mortgage Costs',
    description: 'File-opening fee is capped by law at ₪360. Appraisal is required before approval. Broker fees are optional but common.',
    range: 'Appraisal ₪2,500–4,000 · Origination ₪360',
    example: 'Total ₪3k–5k before broker',
  },
  {
    icon: ClipboardList,
    title: 'Engineering / Inspections',
    description: 'Pre-purchase structural inspection (resale) or pre-possession check (new construction). Strongly recommended.',
    range: '₪2,000–5,000',
  },
  {
    icon: Landmark,
    title: 'Registration & Administrative',
    description: 'Tabu registration, caveat (הערת אזהרה), power of attorney notarization, and document extracts.',
    range: '₪500–1,500 total',
  },
  {
    icon: ArrowRightLeft,
    title: 'Currency Conversion',
    description: 'Bank spreads on foreign-currency transfers are typically 0.3–1.5%. Specialist services (e.g., Wise, OFX) often beat bank rates.',
    range: '0.3–1.5% spread',
    example: '₪7k–37k on a $690k transfer',
  },
  {
    icon: Truck,
    title: 'Moving & Setup',
    description: 'Utility connections (Arnona, water, electricity), movers, overlapping rent/mortgage during the transition.',
    range: '₪3,000–8,000',
  },
  {
    icon: PaintBucket,
    title: 'Renovation / Fit-out',
    description: 'Common in resale. Repainting ~₪4k, flooring ~₪15–22k, full bathroom ~₪25–30k each.',
    range: '5–10% of purchase price',
    example: '₪125k–250k on a ₪2.5M property',
  },
];

const timelineStages = [
  {
    stage: 'Research & Discovery on BuyWise Israel',
    costs: 'Browse listings, compare cities, use calculators to understand true costs, and tools to connect with vetted professionals and agencies when you\'re ready.',
    amount: '₪0 (free on BuyWise Israel)',
  },
  {
    stage: 'Offer to Contract',
    costs: 'Lawyer retainer begins. New construction may require a reservation deposit (usually refundable).',
    amount: '₪3,000–5,000',
  },
  {
    stage: 'Contract Signing',
    costs: 'Purchase tax due within 50 days. Lawyer fees, partial agent commission.',
    amount: '₪70k–200k+ (tax-dependent)',
  },
  {
    stage: 'Mortgage Process',
    costs: 'Appraisal, file-opening fee, optional broker fee.',
    amount: '₪3,000–10,000',
  },
  {
    stage: 'Prior to Possession',
    costs: 'New construction: staged index-linked payments. Engineering inspection.',
    amount: '₪2,000–5,000 (inspection)',
  },
  {
    stage: 'Closing & Key Handover',
    costs: 'Remaining agent commission, deferred legal fees, registration filings.',
    amount: '₪5,000–15,000',
  },
  {
    stage: 'Post-Closing',
    costs: 'Arnona registration, movers, overlap payments, renovation.',
    amount: '₪3,000–200,000+',
  },
];

const commonMistakes = [
  'Assuming the listing price is the total cost — it never is',
  'Confusing purchase tax (one-time, Mas Rechisha) with annual property tax (Arnona)',
  'Thinking Olim or first-home tax benefits apply automatically — they require filing and proof',
  'Ignoring currency-conversion costs, which can exceed ₪20k on a typical purchase',
  'Skipping the engineering inspection to save ₪3k — then discovering ₪50k+ in problems',
  'Assuming new construction is cheaper than resale — developer lawyer fees, index linkage, and bank guarantees add up',
];

export default function TrueCostGuide() {
  useTrackContentVisit('guide');
  const [showNav, setShowNav] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      setShowNav(window.scrollY > 300);
      
      const sections = navSections.map(s => document.getElementById(s.id));
      const scrollPos = window.scrollY + 150;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPos) {
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
      const top = element.offsetTop - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <Layout>
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
                  "px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/3 to-transparent" />
        <div className="container relative py-12 md:py-16">
          <DualNavigation
            parentLabel="All Guides"
            parentPath="/guides"
            className="mb-4"
          />
          <motion.div {...fadeInUp} className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <BadgeDollarSign className="h-3 w-3 mr-1" />
              Essential Guide
            </Badge>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
              The True Cost of Buying Property in <span className="text-primary">Israel</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-primary font-medium mb-4">
              Beyond the Listing Price
            </p>
            
            <p className="text-muted-foreground text-lg mb-6">
              Every cost outside the listing price, with real numbers
            </p>
            
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                4 sections
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                ~8 min read
              </span>
              <span>Updated 2026</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Overview / Bottom Line */}
      <section id="overview" className="container py-16">
        <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
          {/* Cost Benchmark */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="p-5 rounded-xl bg-card border text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">Local Buyer (on ~₪2.5M property)</p>
              <p className="text-3xl font-bold text-primary mb-1">~6.5%</p>
              <p className="text-xs text-muted-foreground">above purchase price</p>
              <p className="text-xs text-muted-foreground mt-2">~₪162,000 in additional costs</p>
            </div>
            <div className="p-5 rounded-xl bg-card border text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">Foreign Buyer (on ~₪2.5M property)</p>
              <p className="text-3xl font-bold text-primary mb-1">~12%</p>
              <p className="text-xs text-muted-foreground">above purchase price</p>
              <p className="text-xs text-muted-foreground mt-2">~₪300,000 in additional costs</p>
            </div>
          </div>

          {/* Intro */}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
            <p className="text-lg font-medium text-foreground mb-3 text-center">
              The listing price in Israel covers only the property itself.
            </p>
            <p className="text-muted-foreground text-center mb-4">
              Taxes, lawyer fees, agent commission, mortgage costs, and setup expenses are all separate — and they vary by your buyer status, financing, and property type. This guide breaks down every category with specific ranges so you can budget accurately before talking to professionals.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              All examples below use a <strong className="text-foreground">₪2,500,000</strong> (~$690k) property as reference.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Cost Categories */}
      <section id="cost-categories" className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
            The Major Cost Categories
          </h2>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            What sits outside the listing price — with typical ranges
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {costCategories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="p-5 rounded-xl bg-muted/30 border"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <category.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground mb-1 text-sm">{category.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                    <p className="text-xs font-semibold text-primary">{category.range}</p>
                    {category.example && (
                      <p className="text-xs text-muted-foreground mt-0.5">{category.example}</p>
                    )}
                    {category.link && (
                      <Link to={category.link} className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
                        {category.note} <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Timeline */}
      <section id="timeline" className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
            When These Costs Appear
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Typical sequence for a ₪2.5M property purchase
          </p>
          
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-px" />
            
            <div className="space-y-6">
              {timelineStages.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "relative pl-12 md:pl-0 md:w-1/2",
                    index % 2 === 0 ? "md:pr-8 md:text-right" : "md:ml-auto md:pl-8"
                  )}
                >
                  <div className={cn(
                    "absolute top-2 w-3 h-3 rounded-full bg-primary border-2 border-background",
                    "left-2.5 md:left-auto",
                    index % 2 === 0 ? "md:right-[-6px]" : "md:left-[-6px]"
                  )} />
                  
                  <div className="p-4 rounded-xl bg-card border">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <h3 className="font-semibold text-foreground text-sm">{item.stage}</h3>
                      <span className="text-xs font-semibold text-primary whitespace-nowrap">{item.amount}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.costs}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Common Mistakes */}
      <section id="mistakes" className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
            Common Mistakes
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Assumptions that cost buyers real money
          </p>
          
          <div className="grid md:grid-cols-2 gap-3">
            {commonMistakes.map((mistake, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-4 rounded-lg bg-muted/30"
              >
                <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{mistake}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Bottom CTAs */}
      <section className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            <Link 
              to="/tools"
              className="p-6 rounded-xl bg-card border hover:border-primary/30 transition-colors group"
            >
              <Calculator className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                True Cost Calculator
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Estimate your total purchase costs based on your buyer profile.
              </p>
              <span className="text-sm font-medium text-primary flex items-center gap-1">
                Calculate Now <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
            
            <Link 
              to="/guides/purchase-tax"
              className="p-6 rounded-xl bg-card border hover:border-primary/30 transition-colors group"
            >
              <Landmark className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                Purchase Tax Guide
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Exact brackets by buyer status, with worked examples.
              </p>
              <span className="text-sm font-medium text-primary flex items-center gap-1">
                View Guide <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
            
            <Link 
              to="/glossary"
              className="p-6 rounded-xl bg-card border hover:border-primary/30 transition-colors group"
            >
              <FileText className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                Full Glossary
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Look up any Hebrew real estate term in plain English.
              </p>
              <span className="text-sm font-medium text-primary flex items-center gap-1">
                View Glossary <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
}
