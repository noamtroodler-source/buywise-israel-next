import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Scale, Clock, BookOpen, ChevronRight, Home, DollarSign,
  TrendingUp, Users, Shield, FileText, Calendar, Key, Heart,
  ArrowRightLeft, CheckCircle, Plane, Receipt, AlertCircle,
  Building, Handshake, MapPin, Globe, Briefcase, UserCheck,
  HelpCircle, Lightbulb, Calculator, BookMarked
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

import rentVsBuyHero from '@/assets/guides/rent-vs-buy-hero.jpg';

const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'assumptions', label: 'Assumptions' },
  { id: 'why-loaded', label: 'Why It Feels Loaded' },
  { id: 'renting', label: 'How Renting Works' },
  { id: 'buying', label: 'How Buying Changes Things' },
  { id: 'buyer-status', label: 'Buyer Status' },
  { id: 'surprises', label: 'Surprises' },
  { id: 'not-about', label: "What This Isn't About" },
  { id: 'buywise', label: 'BuyWise' },
  { id: 'closing', label: 'Closing' },
];

const commonAssumptions = [
  { icon: DollarSign, text: '"Renting is throwing money away"' },
  { icon: Home, text: '"Buying always builds wealth"' },
  { icon: Clock, text: '"The sooner you buy, the better"' },
  { icon: TrendingUp, text: '"Israeli property only goes up"' },
  { icon: Users, text: '"Everyone in Israel owns"' },
  { icon: Shield, text: '"Buying provides security"' },
  { icon: FileText, text: '"Renting prepares you legally for buying"' },
  { icon: Calendar, text: '"Leases work like in the US/UK"' },
  { icon: Key, text: '"Buying simplifies life immediately"' },
  { icon: Heart, text: '"Buying signals commitment to Israel"' },
  { icon: ArrowRightLeft, text: '"Rent vs buy is purely financial"' },
  { icon: CheckCircle, text: '"Once you buy, uncertainty ends"' },
  { icon: Plane, text: '"Foreign buyers can rent first easily"' },
  { icon: Receipt, text: '"Renting is low-commitment everywhere"' },
];

const whyLoadedReasons = [
  {
    icon: Building,
    title: 'Housing Scarcity and Competition',
    description: 'Limited supply in desirable areas creates urgency and competition that can feel overwhelming.',
  },
  {
    icon: Users,
    title: 'Cultural Norms Around Ownership',
    description: 'Israeli society often views homeownership as a milestone, which can create implicit pressure.',
  },
  {
    icon: Heart,
    title: 'Identity and Permanence Signals',
    description: 'Buying is often perceived as "putting down roots," while renting may feel temporary.',
  },
  {
    icon: Calendar,
    title: 'Long-Term Leasing Culture Differences',
    description: 'Israeli rental norms differ significantly from US/UK expectations around lease length and stability.',
  },
  {
    icon: Shield,
    title: 'Limited Rental Market Protections',
    description: 'Tenant protections are less formalized than in some Western countries.',
  },
  {
    icon: Users,
    title: 'Social Expectations',
    description: 'Family and community may have opinions about when and whether you should buy.',
  },
  {
    icon: Clock,
    title: 'Market Timing Anxiety',
    description: 'Fear of missing out or buying at the wrong time adds emotional weight to the decision.',
  },
];

const rentingAspects = [
  {
    icon: Calendar,
    title: 'Lease Norms',
    description: 'Typically 1-year contracts with limited renewal certainty. Early termination clauses (if they exist) usually require 60 days notice from tenant, 90 days from landlord.',
  },
  {
    icon: DollarSign,
    title: 'Security Deposits and Guarantees',
    description: 'Security deposits cannot exceed 3 months rent by law. Landlords may hold deposit up to 60 days after lease ends for damage inspection. Bank guarantees are common for higher-end rentals.',
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
];

const buyingChanges = [
  {
    icon: FileText,
    title: 'Legal Commitment',
    description: 'Contractual and financial obligations that bind you to specific terms over extended periods.',
  },
  {
    icon: MapPin,
    title: 'Financial Anchoring',
    description: 'Tied to a specific currency, market, and location in ways that renting does not require.',
  },
  {
    icon: Heart,
    title: 'Emotional Signal',
    description: 'Often perceived as "putting down roots" and signaling long-term commitment to place.',
  },
  {
    icon: Building,
    title: 'Structural Permanence',
    description: 'Harder to reverse than renting. Selling involves its own timeline, costs, and uncertainties.',
  },
];

const buyerStatuses = [
  {
    icon: Plane,
    title: 'New Olim',
    description: 'Balancing integration with major financial decisions. Still learning the system while facing pressure to commit.',
  },
  {
    icon: Globe,
    title: 'Foreign Residents Abroad',
    description: 'Distance adds complexity to both options. Managing property or leases remotely creates friction.',
  },
  {
    icon: Briefcase,
    title: 'Investors',
    description: 'Different considerations around rental income versus capital appreciation. Tax implications vary.',
  },
  {
    icon: UserCheck,
    title: 'Long-term Residents',
    description: 'Accumulated context and relationships, but ongoing uncertainty about permanence may persist.',
  },
];

const surprises = [
  'Assuming renting prepares you legally for buying — the processes are distinct',
  'Assuming leases resemble US/UK norms — Israeli rental culture differs significantly',
  'Assuming buying simplifies life immediately — ownership brings new complexities',
  'Underestimating emotional weight of either decision',
  'Expecting rental market stability that may not exist',
  'Believing ownership automatically brings belonging',
  'Thinking the decision is purely financial when identity and lifestyle are involved',
  'Assuming "waiting" means "losing" when it may mean "learning"',
  'Expecting similar landlord-tenant dynamics to home country',
  'Underestimating currency exposure implications in both scenarios',
];

const notAboutItems = [
  { icon: Calculator, text: 'ROI math and breakeven analysis' },
  { icon: TrendingUp, text: 'Market timing predictions' },
  { icon: DollarSign, text: 'Interest rate comparisons' },
  { icon: Lightbulb, text: 'Investment optimization strategies' },
  { icon: Scale, text: 'Legal or financial advice' },
];

const buywiseHelps = [
  {
    icon: Scale,
    title: 'Separates Pressure from Facts',
    description: 'Distinguishes emotional urgency from system realities so you can think clearly.',
  },
  {
    icon: FileText,
    title: 'Clarifies Costs and Commitments',
    description: 'Explains what each option involves without pushing you toward a decision.',
  },
  {
    icon: Clock,
    title: 'Helps Understand Timing',
    description: 'Provides context on readiness factors without prescribing when you should act.',
  },
  {
    icon: BookOpen,
    title: 'Presents Context, Not Recommendations',
    description: 'Our role is to inform and clarify, not to tell you what to choose.',
  },
];

export default function RentVsBuyGuide() {
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
                  10 sections
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  ~15 min read
                </span>
                <span>Updated 2025</span>
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
              {/* Pain Point Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-muted/30 border border-border/50">
                  <AlertCircle className="h-5 w-5 text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">
                    You may feel pressure—social, emotional, or financial—to buy quickly
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-muted/30 border border-border/50">
                  <ArrowRightLeft className="h-5 w-5 text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Renting and buying mean different things in Israel than they do abroad
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-muted/30 border border-border/50">
                  <Heart className="h-5 w-5 text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">
                    The decision is loaded with identity, belonging, and commitment
                  </p>
                </div>
              </div>

              {/* Gradient CTA Box */}
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

              {/* One-Sentence Reality */}
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

          {/* Assumptions Section */}
          <section id="assumptions" className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Common Assumptions Foreigners Bring
              </h2>
              <p className="text-muted-foreground mb-6">
                These beliefs often shape how internationals approach the rent vs buy decision—but 
                they may not hold in the Israeli context.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-3">
                {commonAssumptions.map((assumption, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <assumption.icon className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm text-muted-foreground">{assumption.text}</span>
                  </div>
                ))}
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
                How Buying Changes the Relationship to Place
              </h2>
              <p className="text-muted-foreground mb-6">
                Purchasing property in Israel shifts your relationship to the country in ways that 
                extend beyond finances.
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
                Buyer Status Reality Check
              </h2>
              <p className="text-muted-foreground mb-6">
                How rent vs buy considerations differ based on your situation and relationship to Israel.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {buyerStatuses.map((status, index) => (
                  <div 
                    key={index}
                    className="p-5 rounded-xl bg-card border"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <status.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{status.title}</h3>
                        <p className="text-sm text-muted-foreground">{status.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Surprises Section */}
          <section id="surprises" className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Where Foreigners Get Surprised
              </h2>
              <p className="text-muted-foreground mb-6">
                Expectation gaps that commonly catch international buyers and renters off guard.
              </p>
              
              <div className="space-y-3">
                {surprises.map((surprise, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{surprise}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* What This Isn't About Section */}
          <section id="not-about" className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                What This Decision Is NOT About
              </h2>
              <p className="text-muted-foreground mb-6">
                This guide intentionally does not cover the following topics, which are addressed 
                in other resources or require professional guidance.
              </p>
              
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {notAboutItems.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-4 rounded-xl bg-muted/20 border border-border/30"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-sm text-muted-foreground">
                  For financial calculations and cost breakdowns, explore our{' '}
                  <Link to="/tools" className="text-primary hover:underline">
                    calculators and tools
                  </Link>
                  . For tax specifics, see the{' '}
                  <Link to="/guides/purchase-tax" className="text-primary hover:underline">
                    Purchase Tax Guide
                  </Link>
                  .
                </p>
              </div>
            </motion.div>
          </section>

          {/* BuyWise Section */}
          <section id="buywise" className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                How BuyWise Helps You Think Clearly
              </h2>
              <p className="text-muted-foreground mb-6">
                Our role is to provide clarity and context—not to push you toward any particular decision.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {buywiseHelps.map((help, index) => (
                  <div 
                    key={index}
                    className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <help.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{help.title}</h3>
                        <p className="text-sm text-muted-foreground">{help.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
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
              <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
                <h2 className="text-2xl font-bold text-foreground mb-4 text-center">
                  Calm Reframe
                </h2>
                <div className="space-y-4 text-center max-w-2xl mx-auto">
                  <p className="text-muted-foreground">
                    Clarity comes before commitment. Renting is not failing to buy—it can be a thoughtful, 
                    strategic choice while you orient yourself. Buying is not an escape from uncertainty—it 
                    creates new commitments.
                  </p>
                  <p className="text-muted-foreground">
                    Neither option is inherently better; each carries its own implications. With clarity and 
                    context, you can approach this decision calmly, without the pressure of external expectations.
                  </p>
                  <p className="font-semibold text-primary mt-6">
                    Take your time. Understand the system. Then decide.
                  </p>
                </div>
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
                to="/guides"
                className="p-5 rounded-xl bg-card border hover:border-primary/30 transition-colors group"
              >
                <BookMarked className="h-6 w-6 text-primary mb-3" />
                <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  More Guides
                </h4>
                <p className="text-sm text-muted-foreground">
                  Deep dives on specific topics
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
