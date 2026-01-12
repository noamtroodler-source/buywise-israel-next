import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, MapPin, Building2, Users, FileText, Eye, Camera, 
  DollarSign, HelpCircle, CheckCircle, AlertTriangle, Lightbulb,
  ArrowRight, Calculator, BookOpen, Search, Ruler, Tag, Clock,
  Shield, Globe, MessageSquare, Scale, Layers, Sparkles
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Navigation sections for sticky nav
const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'core-problem', label: 'Core Problem' },
  { id: 'why-misleading', label: 'Why Misleading' },
  { id: 'emphasized', label: 'What They Show' },
  { id: 'omitted', label: 'What They Hide' },
  { id: 'terms', label: 'Terms' },
  { id: 'photos', label: 'Photos' },
  { id: 'reading-tips', label: 'How to Read' },
  { id: 'mistakes', label: 'Common Mistakes' },
  { id: 'buywise', label: 'BuyWise' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

// Why Misleading Reasons
const whyMisleadingReasons = [
  {
    icon: Search,
    title: 'No Single MLS',
    description: 'Israel has no nationwide multiple-listing service; properties appear across agency sites, social media and word-of-mouth.',
  },
  {
    icon: Layers,
    title: 'Different Room Counting',
    description: 'Israelis count all rooms – the living room and safe room (MAMAD) included – so a "4-room" apartment is usually three bedrooms plus salon.',
  },
  {
    icon: Ruler,
    title: 'Net vs Gross Measurements',
    description: 'Square meters may be quoted as gross (bruto), which includes common hallways and elevator shafts; you must ask for net (neto) size.',
  },
  {
    icon: FileText,
    title: 'Marketing vs Legal Descriptions',
    description: 'Listings highlight attractive features but are not legally binding; legal documents are drafted separately and may differ.',
  },
  {
    icon: Users,
    title: 'Dual Agency and Timing',
    description: 'Agents can represent both buyer and seller and are paid when the contract is signed, not at closing. This influences how listings are framed.',
  },
  {
    icon: MessageSquare,
    title: 'Cultural Negotiation Norms',
    description: 'Verbal agreements and preliminary documents can become binding, so listings rarely mention contingencies or "subject to financing."',
  },
  {
    icon: Globe,
    title: 'Language and Translation Gaps',
    description: 'Terms like "penthouse," "garden," or "project" have local meanings that differ from literal translations.',
  },
  {
    icon: HelpCircle,
    title: 'Assumed Local Knowledge',
    description: 'Details on land registration, building age, taxes or maintenance fees are assumed to be known and therefore omitted.',
  },
];

// What Listings Emphasize
const whatEmphasized = [
  {
    icon: Layers,
    title: 'Total Number of Rooms',
    description: 'Room counts include the living room and safe room, giving a rough sense of size.',
  },
  {
    icon: Home,
    title: 'Outdoor Space',
    description: 'Balconies, gardens and terraces are prized in dense cities; listings highlight these because they add value.',
  },
  {
    icon: Eye,
    title: 'Orientation and Views',
    description: 'Directions (north/south/east/west) and sea or skyline views are emphasized; local buyers know the climate and light.',
  },
  {
    icon: Sparkles,
    title: 'Renovation or "New" Labels',
    description: '"New" can mean recently renovated, newly built or an off-plan project. Developers use it to signal quality.',
  },
  {
    icon: Building2,
    title: 'Building Amenities',
    description: 'Elevators, parking spaces, storage rooms and safe rooms are spotlighted since not all buildings have them.',
  },
  {
    icon: Tag,
    title: 'Project Branding',
    description: 'New developments stress the project name and developer reputation; meaningful in a market with many off-plan sales.',
  },
];

// What Listings Omit
const whatOmitted = [
  {
    icon: Ruler,
    title: 'Net Living Space',
    description: 'Many listings quote gross square meters; net size (actual interior space) appears only in contracts.',
  },
  {
    icon: Clock,
    title: 'Building Age and Condition',
    description: 'Unless recently renovated, the age and structural condition are rarely highlighted; homes are sold "AS IS".',
  },
  {
    icon: DollarSign,
    title: 'Maintenance Fees (Va\'ad HaBayit)',
    description: 'Monthly fees for cleaning, electricity and elevator maintenance vary widely; listings seldom include them.',
  },
  {
    icon: FileText,
    title: 'Land Status and Registration',
    description: 'Whether the property is freehold (Tabu) or leasehold (Minhal) is not usually stated; details surface in legal checks.',
  },
  {
    icon: Scale,
    title: 'Taxes and Transaction Costs',
    description: 'Purchase tax, betterment levy and attorney fees vary by buyer status and are typically absent from listings.',
  },
  {
    icon: Building2,
    title: 'Mortgage Feasibility',
    description: 'Listings do not reveal whether the property is mortgageable; banks evaluate this after contract signing.',
  },
  {
    icon: AlertTriangle,
    title: 'Delivery Timeline Realism',
    description: 'In new projects, advertised completion dates may exclude permitted delays.',
  },
];

// Terms That Don't Mean What You Think
const confusingTerms = [
  { term: '4-room apartment', expectation: 'Four bedrooms', reality: 'Three bedrooms plus living room' },
  { term: 'SQM (square meter)', expectation: 'Net interior space', reality: 'May be gross (including common areas)' },
  { term: 'New', expectation: 'Brand-new construction', reality: 'Can mean renovated, recently built or off-plan' },
  { term: 'Project', expectation: 'Completed condominium', reality: 'Often refers to an off-plan development' },
  { term: 'Garden apartment', expectation: 'Private yard', reality: 'May be a shared garden or small patio' },
  { term: 'First floor', expectation: 'Ground level', reality: 'In Israel, 0 is ground; 1 is one flight up' },
  { term: 'Penthouse/Mini-penthouse', expectation: 'Entire roof level', reality: 'May simply be a top-floor unit with terrace' },
  { term: 'MAMAD/Safe room', expectation: 'Extra storage', reality: 'Reinforced room counted as a room' },
  { term: 'Sea view', expectation: 'Unobstructed ocean panorama', reality: 'Any partial view of the sea from a window' },
  { term: 'Immediate entry', expectation: 'Ready to move in', reality: 'Could mean after tenants leave or registration' },
];

// Reading Tips
const readingTips = [
  { trigger: 'When you see "4 rooms"', meaning: 'It often means three bedrooms plus a salon', action: 'Confirm the actual bedroom count' },
  { trigger: 'When a size is quoted', meaning: 'It might be gross, not net', action: 'Ask if it is net or gross' },
  { trigger: 'When "new" appears', meaning: 'It can mean renovated, recently built or off-plan', action: 'Clarify the year built and occupancy status' },
  { trigger: 'When a listing says "project"', meaning: 'It may be an off-plan sale', action: 'Verify delivery date and index-linking' },
  { trigger: 'When a balcony or garden is advertised', meaning: 'Shared spaces are common', action: 'Ask about size and exclusivity' },
  { trigger: 'When exposures and views are highlighted', meaning: '"Sea view" can be partial', action: 'Ask to see the view in person or via video' },
  { trigger: 'When the listing mentions parking or storage', meaning: 'They may not be registered rights', action: 'Confirm whether they are registered or general use' },
  { trigger: 'When reading floor numbers', meaning: '0 is ground in Israel', action: 'Recall that 1 is the first floor above ground' },
  { trigger: 'When the price seems low', meaning: 'Costs may be excluded', action: 'Check if purchase tax, management fees and index adjustments are included' },
  { trigger: 'When you see "penthouse"', meaning: 'It may not be the entire roof', action: 'Verify roof rights and terrace size' },
  { trigger: 'When no maintenance fee is stated', meaning: 'There is likely a monthly fee', action: 'Ask for the Va\'ad HaBayit amount' },
];

// Common Misinterpretations
const commonMistakes = [
  'Thinking a "4-room" listing has four bedrooms',
  'Taking square meter figures at face value without asking if they are gross or net',
  'Believing "new" always means brand-new construction',
  'Reading floor numbers like in the US or UK, assuming first floor equals ground',
  'Interpreting photos as accurate representations of size or condition',
  'Assuming asking price is final or includes all taxes and fees',
  'Expecting a "sea view" to be unobstructed',
  'Assuming agents exclusively represent one side and are paid at closing',
  'Thinking "project" refers to a completed building',
  'Treating listing descriptions as legally binding promises',
];

export default function ListingsGuide() {
  const [activeSection, setActiveSection] = useState('overview');
  const [showStickyNav, setShowStickyNav] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyNav(window.scrollY > 300);

      // Update active section based on scroll position
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
      {/* Sticky Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: showStickyNav ? 0 : -100 }}
        className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm"
      >
        <div className="container py-3">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
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

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section id="overview" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container relative py-16 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge variant="secondary" className="mb-4">
                <Eye className="h-3 w-3 mr-1" />
                Listings Guide
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2">
                Why Israeli Property Listings
              </h1>
              <h2 className="text-2xl md:text-4xl font-bold text-primary mb-6">
                Feel Misleading to International Buyers
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Calm clarity, not suspicion. Learn how to read Israeli listings with confidence.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  13 sections
                </span>
                <span>•</span>
                <span>20 min read</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Opener Section */}
        <section className="container py-12">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-4xl mx-auto">
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
              <p className="text-lg text-foreground leading-relaxed">
                International buyers and renters often browse Israeli property listings and feel perplexed. 
                They expect standardized room counts, reliable measurements and complete cost disclosures – 
                norms they know from US or UK real estate. Israeli listings aren't "wrong" or deceptive; 
                they are built for a local audience that knows how to interpret them. This guide explains 
                why the system feels confusing to outsiders and teaches you how to read listings calmly, 
                without panic or suspicion.
              </p>
            </Card>
          </motion.div>
        </section>

        {/* Core Problem Section */}
        <section id="core-problem" className="py-16 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                The Core Problem in One Sentence
              </h2>
              <Card className="p-8 bg-background border-2 border-primary/20">
                <p className="text-xl md:text-2xl text-foreground font-medium leading-relaxed">
                  Israeli property listings use local counting methods, marketing conventions and fragmented 
                  platforms that make sense to Israelis but clash with international expectations of uniform 
                  measurements, clear pricing and standardized disclosures.
                </p>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Why Misleading Section */}
        <section id="why-misleading" className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Why Israeli Listings Feel Misleading
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Eight systemic reasons why the same listing reads differently to locals and internationals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {whyMisleadingReasons.map((reason, index) => (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 h-full hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <reason.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{reason.title}</h3>
                  <p className="text-sm text-muted-foreground">{reason.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* What Listings Emphasize */}
        <section id="emphasized" className="py-16 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                What Israeli Listings Typically Emphasize
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These elements appeal to local priorities like lifestyle quality, natural light and outdoor space.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {whatEmphasized.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-6 h-full bg-background">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.p 
              {...fadeInUp} 
              viewport={{ once: true }}
              className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto"
            >
              <strong>Why emphasized:</strong> Israelis rely on professionals for legal and financial details later.
            </motion.p>
          </div>
        </section>

        {/* What Listings Omit */}
        <section id="omitted" className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              What Israeli Listings Commonly Omit
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Local buyers assume they will investigate these issues through lawyers and bankers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {whatOmitted.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 h-full border-dashed">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.p 
            {...fadeInUp} 
            viewport={{ once: true }}
            className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto"
          >
            <strong>Why omitted:</strong> Including them would require constant updates and might deter interest.
          </motion.p>
        </section>

        {/* Terms Table Section */}
        <section id="terms" className="py-16 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Terms That Don't Mean What You Think
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                No definition is absolute; context and follow-up questions matter.
              </p>
            </motion.div>

            <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
              <Card className="overflow-hidden bg-background">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-semibold text-foreground">Term</th>
                        <th className="text-left p-4 font-semibold text-foreground">International Assumption</th>
                        <th className="text-left p-4 font-semibold text-foreground">What It Often Means in Israel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confusingTerms.map((item, index) => (
                        <tr key={item.term} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                          <td className="p-4 font-medium text-foreground">{item.term}</td>
                          <td className="p-4 text-muted-foreground">{item.expectation}</td>
                          <td className="p-4 text-foreground">{item.reality}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Photos Section */}
        <section id="photos" className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Why Photos Can Be Especially Misleading
              </h2>
            </div>

            <Card className="p-8 bg-gradient-to-br from-muted/50 to-transparent">
              <p className="text-lg text-foreground leading-relaxed mb-4">
                Photos in Israeli listings are intended to capture interest, not to document precise dimensions. 
                Wide-angle lenses make small spaces seem larger, while bright lighting emphasizes natural light 
                and views. Staging ranges from empty rooms to cluttered family homes – both can obscure actual size.
              </p>
              <p className="text-lg text-foreground leading-relaxed mb-4">
                In off-plan projects, the "photos" are digital renderings that reflect design intent rather 
                than actual finishes. Renovations depicted in photos may be years old.
              </p>
              <p className="text-muted-foreground italic">
                Use photos for atmosphere and layout clues, not for exact measurements.
              </p>
            </Card>
          </motion.div>
        </section>

        {/* Price Confusion Section */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Where Price Confusion Comes From
                </h2>
              </div>

              <Card className="p-8 bg-background">
                <div className="space-y-4 text-foreground">
                  <p className="leading-relaxed">
                    Israeli asking prices are starting points and often exclude key costs. With no central MLS, 
                    comparable sales data is limited; price per square meter may be calculated on gross size, 
                    leading to inconsistent comparisons.
                  </p>
                  <p className="leading-relaxed">
                    In new projects, prices are linked to the Construction Inputs Index (Madad), which can 
                    increase the price during construction. Listings rarely include purchase tax, lawyer fees, 
                    agent commission or betterment levy, all of which depend on buyer status.
                  </p>
                  <p className="leading-relaxed text-muted-foreground">
                    Exchange rates and international transfer fees further complicate pricing for foreigners. 
                    Local buyers expect to negotiate and factor these in later.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Buyer Status Section */}
        <section className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-4xl mx-auto">
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Buyer Status Reality Check</h2>
              </div>
              <p className="text-foreground leading-relaxed">
                Listings read differently depending on whether you are an Israeli resident, new oleh, foreign 
                buyer or investor. Differences show up in taxes, mortgage eligibility and documentation – not 
                in the structure of the listing. Your status influences the final cost and bureaucratic friction 
                but the way listings are written remains the same.
              </p>
              <p className="text-sm text-muted-foreground mt-4 italic">[VARIES BY STATUS]</p>
            </Card>
          </motion.div>
        </section>

        {/* Reading Tips Section */}
        <section id="reading-tips" className="py-16 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                How to Read a Listing More Accurately
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                11 practical tips to decode what you're actually looking at.
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto space-y-4">
              {readingTips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="p-5 bg-background">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground mb-1">{tip.trigger}</p>
                        <p className="text-sm text-muted-foreground mb-2">{tip.meaning}</p>
                        <p className="text-sm text-primary flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {tip.action}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Common Mistakes Section */}
        <section id="mistakes" className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Common Misinterpretations International Buyers Make
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Awareness is the first step to avoiding these traps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {commonMistakes.map((mistake, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="p-4 h-full flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{mistake}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* BuyWise Section */}
        <section id="buywise" className="py-16 bg-primary/5">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-4xl mx-auto">
              <Card className="p-8 md:p-12 bg-background border-primary/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    How BuyWise Changes the Listing Experience
                  </h2>
                </div>

                <div className="space-y-4 text-foreground">
                  <p className="text-lg leading-relaxed">
                    BuyWise Israel enhances listings by adding context and standardization. The platform 
                    indicates whether size figures are net or gross and provides typical ranges for Va'ad 
                    HaBayit fees.
                  </p>
                  <p className="leading-relaxed">
                    It overlays estimated transaction costs (purchase tax, lawyer fees, agent commission) 
                    based on buyer status. It flags when a listing refers to an off-plan project and 
                    summarizes delivery timelines.
                  </p>
                  <p className="leading-relaxed">
                    BuyWise adjusts its presentation depending on whether you are a resident, new oleh, 
                    foreign buyer or investor, showing how taxes and financing requirements differ.
                  </p>
                  <p className="leading-relaxed text-muted-foreground">
                    It also provides translations and explanations of local terms (e.g., MAMAD, Tabu, Arnona) 
                    so you can read Hebrew-origin listings in plain English. These enhancements help you 
                    interpret the listing without replacing professional advice.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Closing Section */}
        <section className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
              <Lightbulb className="h-10 w-10 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-4">Calm Reframe</h2>
              <p className="text-lg text-foreground leading-relaxed">
                Feeling uncertain when reading Israeli listings is normal. The system evolved around local 
                norms, not to mislead you. Once you know that room counts include the living room and safe 
                room, that square meters might be gross, and that agents are paid at contract signing, the 
                confusion fades. Listings emphasise lifestyle features and assume you will investigate 
                technical details later. By understanding how to interpret what is said and what is left 
                unsaid, you restore control and can browse properties on BuyWise Israel with confidence.
              </p>
            </Card>
          </motion.div>
        </section>

        {/* Bottom CTAs */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/listings" className="group">
                  <Card className="p-6 h-full text-center hover:shadow-md transition-all hover:border-primary/30">
                    <Search className="h-8 w-8 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Browse Listings</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Apply what you learned to real properties
                    </p>
                    <span className="text-primary text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      View Properties <ArrowRight className="h-4 w-4" />
                    </span>
                  </Card>
                </Link>

                <Link to="/tools" className="group">
                  <Card className="p-6 h-full text-center hover:shadow-md transition-all hover:border-primary/30">
                    <Calculator className="h-8 w-8 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Run the Numbers</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Calculate true costs for any listing
                    </p>
                    <span className="text-primary text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Open Calculators <ArrowRight className="h-4 w-4" />
                    </span>
                  </Card>
                </Link>

                <Link to="/guides/buying-in-israel" className="group">
                  <Card className="p-6 h-full text-center hover:shadow-md transition-all hover:border-primary/30">
                    <BookOpen className="h-8 w-8 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Complete Buying Guide</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ready to buy? Learn the full process
                    </p>
                    <span className="text-primary text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read Guide <ArrowRight className="h-4 w-4" />
                    </span>
                  </Card>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
