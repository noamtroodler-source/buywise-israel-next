import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { 
  Scale, Clock, BookOpen, ChevronRight, Home, DollarSign,
  Building, Calendar, Shield, Handshake, HelpCircle, Wrench,
  Plane, Globe, Briefcase, UserCheck, Calculator, BookMarked, Key,
  TrendingUp, MapPin, Baby, Search, CheckCircle, Wallet, Timer,
  ArrowRightLeft
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';

import rentVsBuyHero from '@/assets/guides/rent-vs-buy-hero.jpg';

const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'why-loaded', label: 'Why It Feels Loaded' },
  { id: 'the-numbers', label: 'The Numbers' },
  { id: 'why-rent-first', label: 'Why Rent First' },
  { id: 'renting', label: 'How Renting Works' },
  { id: 'when-to-buy', label: 'When to Buy' },
  { id: 'buying', label: 'How Buying Changes Things' },
  { id: 'buyer-status', label: 'Buyer Status' },
];

const whyLoadedReasons = [
  {
    icon: Building,
    title: 'Housing Scarcity',
    description: 'In cities like Tel Aviv and Jerusalem, demand consistently outpaces supply. Apartments sell within days, creating FOMO that pushes people to buy before they\'re ready. The fear of "prices will only go up" is real — but so is the risk of overpaying under pressure.',
  },
  {
    icon: Home,
    title: 'Cultural Ownership Pressure',
    description: 'Homeownership is deeply tied to status and stability in Israel. Expect questions from family, colleagues, and even acquaintances about when you\'re buying — especially after aliyah. Renting long-term is often seen as "not settled yet," even when it\'s the smarter financial move.',
  },
];

const rentFirstReasons = [
  {
    icon: ArrowRightLeft,
    title: 'More Space for Your Budget',
    description: 'A ₪2.5M purchase in Tel Aviv buys roughly 60sqm — a small 2-bedroom. That same budget as rent (₪7,000–9,000/month) gets you 80–90sqm in the same area, or 100+ sqm one neighborhood over. Renters consistently get more living space per shekel.',
  },
  {
    icon: MapPin,
    title: 'Learn Your City Before Committing',
    description: 'Neighborhoods change character block by block. What feels right on a pilot trip may not match daily life — the noise level, parking situation, school proximity, and community vibe only reveal themselves after months. Moving between rentals costs ₪5,000–10,000. Buying the wrong neighborhood costs ₪100,000+ in taxes and fees to undo.',
  },
  {
    icon: Baby,
    title: 'Aliyah Adjustment Buffer',
    description: 'Job changes, ulpan schedules, kids\' school placement, social circles — your first 1–2 years involve major life variables that are nearly impossible to predict. A mortgage adds ₪10,000+/month in fixed obligations during the most uncertain period of your transition.',
  },
  {
    icon: Search,
    title: 'Test Before You Commit',
    description: 'A full year of rent in a good apartment costs ₪85,000–110,000. The purchase tax alone on a ₪2.5M apartment ranges from ₪20,000 (first-time buyer) to ₪200,000 (foreign buyer). Renting for a year to confirm you\'re in the right place is one of the cheapest forms of insurance in Israeli real estate.',
  },
];

const whenToBuyReasons = [
  {
    icon: CheckCircle,
    title: 'You\'ve Lived Here 2+ Years and Know Your Area',
    description: 'You\'ve experienced the neighborhood in summer and winter, know the school options, understand the commute, and aren\'t guessing about what daily life looks like. Location confidence is the single biggest factor in a successful purchase.',
  },
  {
    icon: DollarSign,
    title: 'You Understand Your Currency Exposure',
    description: 'Many buyers successfully carry Israeli mortgages on foreign income — remote workers, retirees, investors. But mortgages are in shekels, so a 10% shekel appreciation means your payment costs 10% more in your home currency. This is manageable: convert in bulk when rates are favorable, budget for variance, or build a shekel reserve. The risk isn\'t earning abroad — it\'s not planning for the fluctuation.',
  },
  {
    icon: Wallet,
    title: 'You Can Cover All Upfront Costs Without Draining Reserves',
    description: 'Down payment + purchase tax + lawyer + moving/renovation. On a ₪2.5M apartment, this totals ₪700,000–900,000+ depending on your buyer status. If covering this requires emptying your savings, you\'re one emergency away from financial stress.',
  },
  {
    icon: Timer,
    title: 'You Plan to Stay at Least 7 Years',
    description: 'Purchase tax + selling costs (broker, lawyer, capital gains) + the time-cost of selling means you typically need 5–7 years of ownership just to break even vs renting. Below that horizon, you\'re likely losing money compared to staying liquid.',
  },
];

const rentingAspects = [
  {
    icon: Calendar,
    title: 'Lease Norms',
    description: 'Typically 1-year contracts with limited renewal certainty. Early termination clauses (if they exist) usually require 60 days notice from tenant, 90 days from landlord. Israeli leases often include only the bare apartment — appliances, lighting fixtures, and furnishings are usually excluded unless explicitly listed in the contract.',
  },
  {
    icon: DollarSign,
    title: 'Security Deposits and Guarantees',
    description: 'Security deposits cannot exceed 3 months rent by law. Deposits must be returned within 60 days of lease end; they can be cash, post-dated cheques, or bank guarantees. Bank guarantees are common for higher-end rentals.',
  },
  {
    icon: Shield,
    title: 'Tenant Protections',
    description: 'Less formal than US/UK. No standard inventory process — document everything with photos at move-in. Verbal agreements are hard to enforce.',
  },
  {
    icon: Handshake,
    title: 'Rent Indexation (Madad)',
    description: 'Many Israeli leases include annual rent increases tied to the Consumer Price Index. Budget for 2–5% yearly increases. Verify if your lease is "צמוד למדד" (index-linked).',
  },
  {
    icon: HelpCircle,
    title: 'Moving Out Essentials',
    description: 'Document meter readings, transfer Arnona to your name, get signed confirmation of key return. Missing these steps can lead to disputes months later.',
  },
  {
    icon: Building,
    title: 'Dirat Le\'haskara Programme',
    description: 'Government long-term rental programme in some areas offers more tenant protections and stability than private market rentals.',
  },
  {
    icon: Wrench,
    title: 'Landlord Repair Obligations',
    description: 'Landlords must fix structural issues (leaks, mold, safety hazards) within a reasonable time, not later than 30 days from written notification. Tenants must repair damages caused by unreasonable use.',
  },
  {
    icon: Key,
    title: 'Brokerage Agreements',
    description: 'Brokers may ask tenants to sign a brokerage agreement before viewing an apartment. Once signed, the fee is due if the tenant proceeds with that property. Clarify who pays the fee before signing anything.',
  },
];

const buyingChanges = [
  {
    icon: DollarSign,
    title: 'Currency & CPI Risk',
    description: 'Your mortgage will be in shekels, often with CPI-linked tracks. If you earn in USD/EUR/GBP, you\'re taking on exchange rate risk for 15–30 years. A CPI-linked mortgage track that starts at ₪5,000/month can rise to ₪6,500/month over 10 years if inflation averages 3%.',
  },
  {
    icon: Scale,
    title: 'Purchase Tax Hit',
    description: 'On a ₪2.5M apartment: a first-time Israeli buyer pays roughly ₪20,000. A foreign buyer pays roughly ₪200,000. That\'s a ₪180,000 difference — money you won\'t recover if you sell in a few years.',
  },
  {
    icon: Clock,
    title: 'Selling Is Slow and Expensive',
    description: 'Budget 3–6 months to sell, plus approximately 2–3% of the sale price in broker, lawyer, and capital gains tax (Mas Shevach) costs. On a ₪3M sale, that\'s ₪60,000–90,000 in exit costs alone. Buying is not easily reversible.',
  },
  {
    icon: Building,
    title: 'Vaad Bayit and Arnona',
    description: 'As an owner, you\'re responsible for building maintenance fees (Vaad Bayit: typically ₪200–800/month depending on building age and amenities) and municipal tax (Arnona: ₪3,000–8,000/year depending on city and apartment size). These are ongoing costs that renters don\'t carry directly.',
  },
];

export default function RentVsBuyGuide() {
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
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({ top: elementPosition, behavior: 'smooth' });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={rentVsBuyHero} 
              alt="Rent vs Buy in Israel" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
          
          <div className="container relative h-full flex flex-col justify-end pb-12">
            <div className="absolute top-6 left-0">
              <DualNavigation
                parentLabel="All Guides"
                parentPath="/guides"
                variant="overlay"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5" />
                  Essential Guide
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
                Rent vs Buy in <span className="text-primary">Israel</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-2">
                The Financial and Life Decision — Honestly Compared
              </p>
              <p className="text-muted-foreground">
                Real numbers, real trade-offs, and the questions that actually matter
              </p>
              
              <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  8 sections
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  ~12 min read
                </span>
                <span>Updated 2026</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Sticky Navigation */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: showStickyNav ? 0 : -100 }}
          className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm"
        >
          <div className="container">
            <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
              {navSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </motion.nav>

        {/* Content */}
        <div className="container py-12 max-w-4xl">
          {/* Overview Section */}
          <section id="overview" className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 text-center">
                <p className="text-lg font-medium text-foreground mb-3">
                  This is both a financial decision and a life decision.
                </p>
                <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
                  The numbers matter — but so do your timeline, your risk tolerance, and how well you 
                  know the place you're considering calling home. This guide walks through both sides honestly.
                </p>
                <p className="font-semibold text-primary">
                  No agenda. Just the trade-offs, with real numbers attached.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-card border">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  The One-Sentence Reality
                </h3>
                <p className="text-muted-foreground">
                  Neither renting nor buying is inherently better in Israel — but the right choice depends on 
                  how long you're staying, where your income comes from, how well you know your city, 
                  and whether you can absorb ₪700K+ in upfront costs without financial stress.
                </p>
              </div>
            </motion.div>
          </section>

          {/* Why It Feels Loaded Section */}
          <section id="why-loaded" className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Why the Rent vs Buy Question Feels Loaded in Israel
              </h2>
              <p className="text-muted-foreground mb-6">
                Two forces make this decision carry more emotional weight than the numbers alone justify.
              </p>
              
              <div className="space-y-4">
                {whyLoadedReasons.map((reason, index) => (
                  <div 
                    key={index}
                    className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <reason.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{reason.title}</h3>
                        <p className="text-sm text-muted-foreground">{reason.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* The Numbers Section */}
          <section id="the-numbers" className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                The Numbers: What Renting vs Buying Actually Costs
              </h2>
              <p className="text-muted-foreground mb-6">
                A side-by-side comparison using a ₪2.5M apartment in central Israel — the type 
                many international buyers consider.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Buying Column */}
                <div className="p-6 rounded-xl border-2 border-primary/20 bg-card">
                  <div className="flex items-center gap-2 mb-4">
                    <Home className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-foreground text-lg">Buying</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Down payment (25%)</span>
                      <span className="font-semibold text-foreground">₪625,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mortgage (₪1.875M, 5.25%, 25yr)</span>
                      <span className="font-semibold text-foreground">~₪10,500/mo</span>
                    </div>
                    <hr className="border-border/50" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purchase tax (first-time)</span>
                      <span className="font-semibold text-foreground">~₪20,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purchase tax (foreign)</span>
                      <span className="font-semibold text-destructive">~₪200,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lawyer</span>
                      <span className="font-semibold text-foreground">₪15,000–25,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Renovation / appliances</span>
                      <span className="font-semibold text-foreground">₪25,000–50,000</span>
                    </div>
                    <hr className="border-border/50" />
                    <div className="flex justify-between font-bold">
                      <span className="text-foreground">Year-one total outlay</span>
                      <span className="text-foreground">₪700K–900K+</span>
                    </div>
                  </div>
                </div>

                {/* Renting Column */}
                <div className="p-6 rounded-xl border-2 border-muted bg-card">
                  <div className="flex items-center gap-2 mb-4">
                    <Key className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-foreground text-lg">Renting</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly rent (same apartment)</span>
                      <span className="font-semibold text-foreground">₪7,000–9,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Year-one rent</span>
                      <span className="font-semibold text-foreground">₪84,000–108,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Security deposit</span>
                      <span className="font-semibold text-foreground">₪14,000–27,000</span>
                    </div>
                    <hr className="border-border/50" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capital preserved</span>
                      <span className="font-semibold text-foreground">₪625,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Conservative return on capital</span>
                      <span className="font-semibold text-foreground">₪25,000–35,000/yr</span>
                    </div>
                    <hr className="border-border/50" />
                    <div className="flex justify-between font-bold">
                      <span className="text-foreground">Year-one total outlay</span>
                      <span className="text-foreground">₪85K–110K</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key insight */}
              <div className="p-5 rounded-xl bg-primary/5 border border-primary/15">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Key Insight</h4>
                    <p className="text-sm text-muted-foreground">
                      Renting the same apartment you'd buy typically costs 30–40% less per month than the 
                      mortgage payment — and you keep your capital liquid. Buying builds equity over time, but 
                      the break-even point is typically 5–7 years when you factor in all transaction costs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-muted/20 border border-border/30">
                <p className="text-sm text-muted-foreground italic">
                  These are illustrative ranges based on 2025–2026 market conditions, not guarantees. 
                  Mortgage rates, rental prices, and tax brackets change. Use our{' '}
                  <Link to="/tools" className="text-primary hover:underline">calculators</Link>{' '}
                  for your specific situation.
                </p>
              </div>
            </motion.div>
          </section>

          {/* Why Rent First Section */}
          <section id="why-rent-first" className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                The Practical Case for Renting First
              </h2>
              <p className="text-muted-foreground mb-6">
                Even if you plan to buy eventually, renting first is often the financially 
                and practically smarter sequence — especially for new arrivals.
              </p>
              
              <div className="space-y-4">
                {rentFirstReasons.map((reason, index) => (
                  <div 
                    key={index}
                    className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <reason.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{reason.title}</h3>
                        <p className="text-sm text-muted-foreground">{reason.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* How Renting Works Section */}
          <section id="renting" className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                How Renting Typically Works in Israel
              </h2>
              <p className="text-muted-foreground mb-6">
                Understanding Israeli rental norms helps explain why the experience may differ from 
                what you're used to.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {rentingAspects.map((aspect, index) => (
                  <div 
                    key={index}
                    className="p-5 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <aspect.icon className="h-5 w-5 text-primary mb-3" />
                    <h3 className="font-semibold text-foreground mb-1">{aspect.title}</h3>
                    <p className="text-sm text-muted-foreground">{aspect.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 rounded-xl bg-muted/20 border border-border/30">
                <p className="text-sm text-muted-foreground italic">
                  Note: This is a conceptual overview of rental norms, not legal guidance. 
                  Specific terms vary by contract and landlord.
                </p>
              </div>
            </motion.div>
          </section>

          {/* When to Buy Section */}
          <section id="when-to-buy" className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                When Buying Starts to Make Sense
              </h2>
              <p className="text-muted-foreground mb-6">
                Buying isn't wrong — it's about timing. These four conditions, when they align, 
                suggest the math and life factors are working in your favor.
              </p>
              
              <div className="space-y-4">
                {whenToBuyReasons.map((reason, index) => (
                  <div 
                    key={index}
                    className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <reason.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{reason.title}</h3>
                        <p className="text-sm text-muted-foreground">{reason.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* How Buying Changes Things Section */}
          <section id="buying" className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                How Buying Changes Things
              </h2>
              <p className="text-muted-foreground mb-6">
                Once you buy, these financial realities become part of your life. None are deal-breakers — 
                but all should be factored in before committing.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {buyingChanges.map((change, index) => (
                  <div 
                    key={index}
                    className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <change.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{change.title}</h3>
                        <p className="text-sm text-muted-foreground">{change.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Buyer Status Section */}
          <section id="buyer-status" className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                How Your Status Changes the Equation
              </h2>
              <p className="text-muted-foreground mb-6">
                The rent vs buy calculus shifts depending on who you are.
              </p>
              
              <div className="p-6 rounded-xl bg-card border space-y-4">
                <div className="flex items-start gap-3">
                  <Plane className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">New Olim</span>
                    <span className="text-muted-foreground"> — Still learning the system while facing social pressure to buy. Tax benefits exist but have time limits. Rent first to learn your city.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Foreign Residents Abroad</span>
                    <span className="text-muted-foreground"> — Managing property remotely adds friction. Higher purchase tax (8–10%). Mortgage options are limited without Israeli income.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Investors</span>
                    <span className="text-muted-foreground"> — No first-apartment tax benefit. Rental yields in Israel are low (2–4%). Factor in vacancy, Arnona, and management costs.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <UserCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Long-term Residents</span>
                    <span className="text-muted-foreground"> — You know the market. The question is whether your life plans are stable enough to justify the financial commitment.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Closing */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="p-6 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-muted-foreground">
                  Renting is not failing to buy. Buying is not escaping uncertainty. Each option carries real trade-offs 
                  in the Israeli context — financial, legal, and personal. Understand them, then decide.
                </p>
              </div>
            </motion.div>
          </section>

          {/* Bottom CTAs */}
          <section className="border-t pt-12">
            <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
              Continue Your Research
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Link 
                to="/tools"
                className="p-5 rounded-xl bg-card border hover:border-primary/30 transition-colors group"
              >
                <Calculator className="h-6 w-6 text-primary mb-3" />
                <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Explore Calculators
                </h4>
                <p className="text-sm text-muted-foreground">
                  Run the numbers with Israel-specific tools
                </p>
                <ChevronRight className="h-4 w-4 text-primary mt-3" />
              </Link>
              
              <Link 
                to="/guides/purchase-tax"
                className="p-5 rounded-xl bg-card border hover:border-primary/30 transition-colors group"
              >
                <BookMarked className="h-6 w-6 text-primary mb-3" />
                <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Purchase Tax Guide
                </h4>
                <p className="text-sm text-muted-foreground">
                  Understand Mas Rechisha before you buy
                </p>
                <ChevronRight className="h-4 w-4 text-primary mt-3" />
              </Link>
              
              <Link 
                to="/guides/mortgages"
                className="p-5 rounded-xl bg-card border hover:border-primary/30 transition-colors group"
              >
                <Home className="h-6 w-6 text-primary mb-3" />
                <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Mortgages Guide
                </h4>
                <p className="text-sm text-muted-foreground">
                  How Israeli mortgages work for foreigners
                </p>
                <ChevronRight className="h-4 w-4 text-primary mt-3" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
