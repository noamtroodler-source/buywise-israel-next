import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { 
  Scale, Clock, BookOpen, ChevronRight, Home, DollarSign,
  Building, Calendar, Shield, Handshake, HelpCircle, Wrench,
  Plane, Globe, Briefcase, UserCheck, Calculator, BookMarked, Key
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';

import rentVsBuyHero from '@/assets/guides/rent-vs-buy-hero.jpg';

const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'why-loaded', label: 'Why It Feels Loaded' },
  { id: 'renting', label: 'How Renting Works' },
  { id: 'buying', label: 'How Buying Changes Things' },
  { id: 'buyer-status', label: 'Buyer Status' },
  { id: 'closing', label: 'Closing' },
];

const whyLoadedReasons = [
  {
    icon: Building,
    title: 'Housing Scarcity',
    description: 'In cities like Tel Aviv and Jerusalem, demand consistently outpaces supply. Apartments sell within days, creating FOMO that pushes people to buy before they\'re ready.',
  },
  {
    icon: Home,
    title: 'Cultural Ownership Pressure',
    description: 'Homeownership is deeply tied to status and stability in Israel. Expect questions from family, colleagues, and even acquaintances about when you\'re buying — especially after aliyah. Renting long-term can be seen as "not settled yet."',
  },
  {
    icon: Shield,
    title: 'Weak Rental Protections',
    description: 'No standard inventory process, generally 1-year leases with no renewal guarantee, and landlords can raise rent annually via Madad indexation.',
  },
  {
    icon: Calendar,
    title: 'Lease Culture Gaps',
    description: 'Israeli leases often exclude appliances, light fixtures, and sometimes even kitchen cabinets — tenants are expected to bring or install their own. Early termination clauses, when they exist, typically require 60 days notice from tenants but 90 from landlords. And unlike the US/UK, there\'s no standard move-in inspection — if you don\'t document the apartment\'s condition yourself, disputes at move-out are common.',
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
    description: 'Many Israeli leases include annual rent increases tied to the Consumer Price Index. Budget for 2-5% yearly increases. Verify if your lease is "צמוד למדד" (index-linked).',
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
    description: 'Your mortgage will be in shekels (with CPI-linked tracks). If you earn in USD/EUR/GBP, you\'re taking on exchange rate risk for 15–30 years.',
  },
  {
    icon: Scale,
    title: 'Purchase Tax Hit',
    description: 'Foreign buyers pay 8–10% purchase tax on the full price. That\'s money you won\'t recover if you sell in a few years.',
  },
  {
    icon: Clock,
    title: 'Selling Is Slow and Expensive',
    description: 'Selling takes 3–6 months minimum, involves capital gains tax (Mas Shevach), and lawyer/broker fees. Buying is not easily reversible.',
  },
  {
    icon: Building,
    title: 'Vaad Bayit and Arnona',
    description: 'As an owner, you\'re responsible for building maintenance fees and municipal tax — costs that don\'t exist when renting.',
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
                How to Think About It as a Foreigner
              </p>
              <p className="text-muted-foreground">
                Understanding why this decision carries different meaning in Israel
              </p>
              
              <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  6 sections
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  ~15 min read
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
                  The rent vs buy question often arrives with emotional weight.
                </p>
                <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
                  In Israel, this decision carries different meaning for foreigners. It interacts with identity, 
                  permanence, and uncertainty in ways that may not match your home country experience.
                </p>
                <p className="font-semibold text-primary">
                  This guide explains the differences—without telling you what to choose.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-card border">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  The One-Sentence Reality
                </h3>
                <p className="text-muted-foreground">
                  Rent vs buy feels different for foreigners in Israel because each option carries distinct 
                  implications for legal status, financial anchoring, emotional belonging, and long-term 
                  uncertainty that don't map neatly to US or UK norms.
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
                Structural and cultural factors make this decision carry more weight than many 
                internationals expect.
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
                Buying in Israel comes with concrete financial realities that renters don't face.
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

          {/* Buyer Status Section — condensed */}
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

          {/* Closing Section */}
          <section id="closing" className="mb-16">
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
