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
  CheckCircle2,
  Home,
  Users,
  Landmark,
  Wallet,
  Wrench,
  ArrowRightLeft,
  ArrowLeft,
  Truck,
  PaintBucket,
  ClipboardList,
  HelpCircle,
  Eye,
  Scale,
  Building,
  CreditCard
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'why-outside', label: 'Why Outside' },
  { id: 'cost-categories', label: 'Categories' },
  { id: 'buyer-status', label: 'Buyer Status' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'surprises', label: 'Surprises' },
  { id: 'hidden-costs', label: 'Hidden Costs' },
  { id: 'interpretation', label: 'Interpretation' },
  { id: 'buywise', label: 'BuyWise' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const whyOutsideReasons = [
  {
    icon: Home,
    title: 'Listings target local norms',
    description: 'Israeli advertisements focus on property features and location, assuming buyers know that taxes and professional fees will be handled separately.'
  },
  {
    icon: Users,
    title: 'Variable obligations by buyer status',
    description: 'The amount you pay for purchase tax, legal services and financing depends on whether you are an Israeli resident, new oleh, foreign buyer or investor.'
  },
  {
    icon: Clock,
    title: 'Timing differences',
    description: 'Some costs are triggered at contract signing, others at loan approval, and others after possession. Sellers cannot predict your payment schedule.'
  },
  {
    icon: Scale,
    title: 'Reliance on professionals',
    description: 'Israeli transactions are lawyer-driven; attorneys calculate taxes, register title and draft contracts. Each professional charges separately.'
  },
  {
    icon: ArrowRightLeft,
    title: 'Separate currency and financing flows',
    description: 'International buyers often transfer funds from abroad, incurring conversion fees and fluctuating exchange rates based on personal circumstances.'
  },
  {
    icon: Building,
    title: 'Property type and condition',
    description: 'Costs differ between new construction and resale. Off-plan purchases may involve developer fees and index-linked payments.'
  },
  {
    icon: FileText,
    title: 'Disclosure norms',
    description: 'Local practice is to disclose core property details, not an itemized estimate of closing costs; these are assumed to be addressed with professionals.'
  }
];

const costCategories = [
  {
    icon: Landmark,
    title: 'Purchase Tax (Mas Rechisha)',
    description: 'A state tax on property acquisition, payable shortly after signing; brackets depend on buyer status and property value.'
  },
  {
    icon: FileText,
    title: 'Legal Fees',
    description: 'Israeli lawyers handle due diligence, contract drafting, title registration and tax filing. Typically a percentage of the purchase price.'
  },
  {
    icon: Users,
    title: 'Agent Commissions',
    description: 'Both buyers and sellers generally pay their own agents, calculated as a percentage of the purchase price.'
  },
  {
    icon: CreditCard,
    title: 'Mortgage-Related Costs',
    description: 'Banks charge file-opening fees, require property appraisals, and may charge administrative and broker fees.'
  },
  {
    icon: ClipboardList,
    title: 'Engineering / Inspections',
    description: 'Buyers often hire an engineer or surveyor to inspect a property before signing (resale) or before possession (new construction).'
  },
  {
    icon: Landmark,
    title: 'Registration & Administrative',
    description: 'Expenses for power of attorney, notarizing documents, registering at Tabu or Israel Land Authority, and obtaining extracts.'
  },
  {
    icon: ArrowRightLeft,
    title: 'Currency Conversion & Transfers',
    description: 'When purchasing with foreign currency, banks and transfer services charge conversion fees and apply exchange-rate spreads.'
  },
  {
    icon: Truck,
    title: 'Moving & Setup Costs',
    description: 'Utility connections (Arnona, water, electricity), moving services, and overlapping rent or mortgage payments.'
  },
  {
    icon: PaintBucket,
    title: 'Renovation or Fit-out',
    description: 'Upgrading kitchens, bathrooms, air conditioning, wardrobes or furnishing a property is common in second-hand purchases.'
  }
];

const timelineStages = [
  {
    stage: 'Pre-offer & Discovery',
    costs: 'Market research tools and initial consultations with agents or lawyers; usually modest or free.'
  },
  {
    stage: 'Offer to Contract',
    costs: "Legal and negotiation work begins. Lawyer's retainer and, in new projects, a reservation fee may be due."
  },
  {
    stage: 'Contract Signing',
    costs: "Purchase tax liability calculated and payable within statutory window. Lawyer's fees, partial agent commissions."
  },
  {
    stage: 'Mortgage Process',
    costs: 'Appraisal fees, file-opening fees and broker fees incurred before final approval.'
  },
  {
    stage: 'Prior to Possession',
    costs: 'In new construction, payments may be staged and index-linked. Engineering inspections conducted.'
  },
  {
    stage: 'Closing & Key Handover',
    costs: 'Remaining agent commissions, deferred legal fees, final tax adjustments, registration filings.'
  },
  {
    stage: 'Post-Closing',
    costs: 'Utility transfers, Arnona registration, movers, overlap payments, renovation or furnishing costs.'
  }
];

const surprises = [
  'Believing costs are optional when they are standard and often critical',
  'Assuming all costs are included in the listing price',
  'Discovering fees after agreeing on the purchase price',
  'Underestimating non-purchase expenses like currency conversions and renovations',
  'Thinking agent commissions are unnecessary or paid by seller only',
  'Expecting mortgage fees to be minimal',
  'Assuming new construction has fewer costs than resale',
  'Confusing purchase tax with annual Arnona property tax',
  'Believing Olim benefits or single-residence benefits apply automatically',
  'Overlooking registration and administrative fees'
];

export default function TrueCostGuide() {
  useTrackContentVisit('guide');
  const [showNav, setShowNav] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      setShowNav(window.scrollY > 300);
      
      // Find active section
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
          {/* Dual Navigation */}
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
              What the advertised price doesn't include—and why
            </p>
            
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                11 sections
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                ~18 min read
              </span>
              <span>Updated 2025</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Opener Section */}
      <section id="overview" className="container py-16">
        <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
          {/* Pain Point Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="p-5 rounded-xl bg-muted/50 border">
              <AlertCircle className="h-5 w-5 text-primary mb-3" />
              <p className="text-sm text-muted-foreground">
                The listing price reflects only the negotiated sum for the property itself
              </p>
            </div>
            <div className="p-5 rounded-xl bg-muted/50 border">
              <AlertCircle className="h-5 w-5 text-primary mb-3" />
              <p className="text-sm text-muted-foreground">
                Taxes, professional fees, and financing costs are all separate
              </p>
            </div>
            <div className="p-5 rounded-xl bg-muted/50 border">
              <AlertCircle className="h-5 w-5 text-primary mb-3" />
              <p className="text-sm text-muted-foreground">
                Additional costs vary by buyer status and transaction type
              </p>
            </div>
          </div>

          {/* CTA Box */}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
            <p className="text-lg font-medium text-foreground mb-3 text-center">
              If you've browsed Israeli property listings and wondered why the advertised price feels incomplete, you're not imagining it.
            </p>
            <p className="text-muted-foreground text-center mb-4">
              Understanding this structure upfront helps you interpret prices calmly and reduces the fear of unexpected fees. This guide explains what costs exist, when they appear, and why they sit outside the listing price.
            </p>
            <p className="text-center font-semibold text-foreground">
              Use it to budget realistically before engaging professionals.
            </p>
          </div>
        </motion.div>
      </section>

      {/* One-Sentence Reality */}
      <section className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-3xl mx-auto">
          <div className="p-6 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex gap-4">
              <Eye className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">The One-Sentence Reality</h3>
                <p className="text-muted-foreground">
                  The listing price in Israel does not include taxes, professional fees, financing costs or post-purchase expenses, and these additional costs vary by buyer status and transaction type, which is why the true cost often exceeds the advertised number.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Why Costs Sit Outside */}
      <section id="why-outside" className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
            Why So Many Costs Sit Outside the Listing Price
          </h2>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            Understanding the structure helps explain why the advertised price is just the starting point
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {whyOutsideReasons.map((reason, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors"
              >
                <reason.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2 text-sm">{reason.title}</h3>
                <p className="text-sm text-muted-foreground">{reason.description}</p>
              </motion.div>
            ))}
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
            A conceptual overview of what sits outside the listing price
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
                  <div className="p-2 rounded-lg bg-primary/10">
                    <category.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1 text-sm">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Buyer Status Reality Check */}
      <section id="buyer-status" className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
            Buyer Status Reality Check
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            The total cost of buying property depends heavily on who you are and what you own
          </p>
          
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-card border">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Home className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Israeli Residents (Single Home)</h3>
                  <p className="text-sm text-muted-foreground">Typically pay lower purchase tax brackets and may face less scrutiny on mortgage documentation.</p>
                </div>
              </div>
            </div>
            
            <div className="p-5 rounded-xl bg-card border">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">New Olim (New Immigrants)</h3>
                  <p className="text-sm text-muted-foreground">May qualify for certain tax reductions or benefits within defined time frames; these benefits require meeting residency conditions.</p>
                </div>
              </div>
            </div>
            
            <div className="p-5 rounded-xl bg-card border">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Foreign Buyers</h3>
                  <p className="text-sm text-muted-foreground">Generally taxed under the investor schedule with additional documentation requirements; often pay higher purchase tax rates.</p>
                </div>
              </div>
            </div>
            
            <div className="p-5 rounded-xl bg-card border">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Investors / Additional-Home Buyers</h3>
                  <p className="text-sm text-muted-foreground">Pay higher purchase tax rates and may be subject to different mortgage policies.</p>
                </div>
              </div>
            </div>
            
            <div className="p-5 rounded-xl bg-card border">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Financed vs Cash Buyers</h3>
                  <p className="text-sm text-muted-foreground">Those taking a mortgage incur bank fees, appraisals and broker costs, whereas cash buyers avoid some of these but still pay legal and registration fees.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Timeline */}
      <section id="timeline" className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
            When These Costs Typically Appear
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Understanding the sequence of costs helps manage expectations
          </p>
          
          <div className="relative">
            {/* Timeline line */}
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
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute top-2 w-3 h-3 rounded-full bg-primary border-2 border-background",
                    "left-2.5 md:left-auto",
                    index % 2 === 0 ? "md:right-[-6px]" : "md:left-[-6px]"
                  )} />
                  
                  <div className="p-4 rounded-xl bg-card border">
                    <h3 className="font-semibold text-foreground mb-1 text-sm">{item.stage}</h3>
                    <p className="text-sm text-muted-foreground">{item.costs}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Surprises */}
      <section id="surprises" className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
            Where International Buyers Get Surprised
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Common assumptions that lead to unexpected costs
          </p>
          
          <div className="grid md:grid-cols-2 gap-3">
            {surprises.map((surprise, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className="flex items-start gap-3 p-4 rounded-lg bg-muted/30"
              >
                <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{surprise}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Hidden Costs */}
      <section id="hidden-costs" className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            What Costs Often Feel "Hidden" — and Why They're Not
          </h2>
          
          <div className="p-6 rounded-xl bg-muted/30 border">
            <p className="text-muted-foreground mb-4">
              Foreign buyers sometimes talk about "hidden fees," but most of these costs are part of Israel's standard property buying structure. They feel hidden because they arise later in the timeline, depend on buyer status and property type, and are handled by professionals rather than disclosed by sellers.
            </p>
            <p className="text-muted-foreground mb-4">
              For example, you will not see agent commission or legal fees in a listing because their amounts vary by price and complexity. Purchase tax is calculated after the price is set and depends on buyer classification. Registration and administrative fees appear after the contract is signed.
            </p>
            <p className="text-foreground font-medium">
              These costs are structural, not arbitrary, and understanding them early prevents them from feeling like surprises.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Interpretation */}
      <section id="interpretation" className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            How the True Cost Changes How Prices Should Be Interpreted
          </h2>
          
          <div className="p-6 rounded-xl bg-primary/5 border border-primary/10">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                When comparing properties, focusing solely on the listing price can mislead. A lower asking price may sit in a higher purchase tax bracket or require substantial renovations, while a higher price may come with fewer additional costs.
              </p>
              <p className="text-muted-foreground">
                Mortgage-related fees can differ based on loan size and terms. Currency fluctuations can change the effective cost for foreign buyers.
              </p>
              <p className="text-foreground font-medium">
                The key is to view the price as one component of a broader cost equation, not the final figure.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* BuyWise Section */}
      <section id="buywise" className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            How BuyWise Adds Cost Clarity
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-card border">
              <CheckCircle2 className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Cost Categories Surfaced</h3>
              <p className="text-sm text-muted-foreground">
                The platform surfaces typical cost categories alongside each listing, so you know what to consider beyond the price.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-card border">
              <CheckCircle2 className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Status-Adjusted Estimates</h3>
              <p className="text-sm text-muted-foreground">
                Cost ranges are adjusted based on whether you are an Israeli resident, new oleh, foreign buyer or investor.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-card border">
              <CheckCircle2 className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Verified vs Variable</h3>
              <p className="text-sm text-muted-foreground">
                Items are separated into verified elements (e.g., purchase price) and variable estimates (e.g., taxes and currency fees).
              </p>
            </div>
            <div className="p-5 rounded-xl bg-card border">
              <CheckCircle2 className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Plain-English Explanations</h3>
              <p className="text-sm text-muted-foreground">
                Explanations accompany estimates, helping you understand the nature of each cost and when it arises.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Calm Reframe */}
      <section className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-3xl mx-auto">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 text-center">
            <HelpCircle className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Clarity Before Commitment
            </h3>
            <p className="text-muted-foreground mb-4">
              Feeling unsure about hidden costs is normal when entering a new market. In Israel, the listing price is just the starting point; the full cost includes taxes, professional services, financing and post-purchase expenses.
            </p>
            <p className="text-muted-foreground mb-4">
              These aren't tricks or traps; they reflect a system where buyers and their representatives handle costs that are personal and variable.
            </p>
            <p className="text-foreground font-medium">
              By learning the categories and timing of expenses and understanding how your status affects them, you gain confidence and can plan accordingly.
            </p>
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
              to="/guides"
              className="p-6 rounded-xl bg-card border hover:border-primary/30 transition-colors group"
            >
              <BookOpen className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                More Guides
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Explore our collection of buyer education resources.
              </p>
              <span className="text-sm font-medium text-primary flex items-center gap-1">
                Browse Guides <ChevronRight className="h-4 w-4" />
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
