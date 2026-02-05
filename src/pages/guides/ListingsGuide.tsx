import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, MapPin, Building2, Users, FileText, Eye, Camera, 
  DollarSign, HelpCircle, CheckCircle, AlertTriangle, Lightbulb,
  ArrowRight, ArrowLeft, Calculator, BookOpen, Search, Ruler, Tag, Clock,
  Shield, Globe, MessageSquare, Scale, Layers, Sparkles, Sun
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Navigation sections for sticky nav
const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'core-mismatch', label: 'Core Mismatch' },
  { id: 'why-confusing', label: 'Why Confusing' },
  { id: 'emphasized', label: 'What They Show' },
  { id: 'omitted', label: 'What They Hide' },
  { id: 'terms', label: 'Terms' },
  { id: 'photos', label: 'Photos' },
  { id: 'reading-tips', label: 'How to Read' },
  { id: 'assumptions', label: 'Assumptions' },
  { id: 'buywise', label: 'BuyWise' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

// Why Confusing Reasons (6 items)
const whyConfusingReasons = [
  {
    icon: Search,
    title: 'Fragmented Market',
    description: 'Israel lacks a single multiple-listing service; properties appear across agency websites, social media groups and offline networks.',
  },
  {
    icon: Ruler,
    title: 'Different Counting and Measuring',
    description: 'Room counts include living spaces beyond bedrooms; advertised sizes often refer to gross area including common corridors.',
  },
  {
    icon: FileText,
    title: 'Marketing vs Legal Roles',
    description: 'Listings are marketing tools; legal due diligence, inspections and contract drafting occur separately, and homes are typically sold "as is".',
  },
  {
    icon: Users,
    title: 'Agent Incentives',
    description: 'Agents may represent both sides and collect commission when the purchase agreement is signed, influencing how information is presented.',
  },
  {
    icon: DollarSign,
    title: 'Price Structures',
    description: 'Asking prices may be linked to construction cost indices and exclude taxes, fees and comparisons, making them hard to interpret.',
  },
  {
    icon: Globe,
    title: 'Language and Cultural Gaps',
    description: 'Terms like "project," "new" or "first floor" have local meanings that differ from direct translations.',
  },
];

// What Listings Emphasize (6 items)
const whatEmphasized = [
  {
    icon: Home,
    title: 'Outdoor Spaces and Views',
    description: 'Balconies, terraces and sea views signal prized access to the outdoors in dense cities.',
  },
  {
    icon: Sun,
    title: 'Orientation and Exposures',
    description: 'North/south or east/west orientation indicates natural light and ventilation, valued in the local climate.',
  },
  {
    icon: Building2,
    title: 'Building Amenities',
    description: 'Elevators, parking spots, storage rooms and safe rooms (MAMAD) are highlighted because older buildings often lack them.',
  },
  {
    icon: Sparkles,
    title: 'Renovation Status',
    description: 'Phrases like "renovated" or "like new" attract buyers looking for modern finishes without specifying age.',
  },
  {
    icon: MapPin,
    title: 'Neighborhood Cues',
    description: 'Proximity to landmarks, beaches or sought-after streets conveys prestige and convenience to locals.',
  },
  {
    icon: Tag,
    title: 'Project Branding',
    description: 'In off-plan developments, the project name and developer reputation reassure buyers.',
  },
];

// What Listings Omit (7 items)
const whatOmitted = [
  {
    icon: Ruler,
    title: 'Net Interior Space',
    description: 'The actual living area (neto) is often absent because gross figures appear more impressive.',
  },
  {
    icon: Clock,
    title: 'Building Age and Infrastructure',
    description: 'Condition of plumbing, electrical systems and structural integrity is rarely detailed; properties are sold "as is".',
  },
  {
    icon: DollarSign,
    title: 'Maintenance and Management Fees',
    description: 'Monthly Va\'ad HaBayit or management fees vary widely and are not usually listed.',
  },
  {
    icon: FileText,
    title: 'Land Tenure and Registration',
    description: 'Whether the property is freehold (Tabu), leasehold (Minhal) or under a housing company is left to lawyers.',
  },
  {
    icon: Scale,
    title: 'Taxes and Transaction Costs',
    description: 'Purchase tax, betterment levies and legal fees depend on buyer status and are seldom mentioned.',
  },
  {
    icon: Building2,
    title: 'Mortgage Suitability',
    description: 'Listings rarely indicate if a property qualifies for bank financing.',
  },
  {
    icon: AlertTriangle,
    title: 'Realistic Delivery Dates',
    description: 'For new developments, allowable delays and index-linked price adjustments are not highlighted.',
  },
];

// Terms That Don't Translate Cleanly
const confusingTerms = [
  { term: '4-room apartment', expectation: 'Four bedrooms', reality: 'Three bedrooms plus the living room.' },
  { term: 'SQM (square meter)', expectation: 'Net interior space', reality: 'Often gross area including shared corridors.' },
  { term: 'New', expectation: 'Newly built', reality: 'May mean renovated, recently built or under construction.' },
  { term: 'Project', expectation: 'Finished condominium', reality: 'Usually an off-plan development awaiting completion.' },
  { term: 'Garden apartment', expectation: 'Private yard', reality: 'Could be a shared or very small garden.' },
  { term: 'First floor', expectation: 'Ground level', reality: 'In Israel, the ground floor is 0; the first floor is one flight up.' },
  { term: 'Penthouse/Mini-penthouse', expectation: 'Entire roof level', reality: 'Often just a top-floor unit with a terrace.' },
  { term: 'MAMAD/Safe room', expectation: 'Storage area', reality: 'A reinforced safe room counted as part of the room total.' },
  { term: 'Sea view', expectation: 'Panoramic vista', reality: 'Any partial glimpse of the sea.' },
  { term: 'Immediate entry', expectation: 'Move-in ready', reality: 'May depend on tenant departure or registration.' },
];

// Reading Tips (10 items with new format)
const readingTips = [
  { when: 'When area is stated in sqm', indicates: 'it often indicates gross area.', action: 'Ask for the net interior measurement.' },
  { when: 'When "new" is used', indicates: 'it often indicates a renovation or an off-plan project.', action: 'Confirm the construction year and occupancy status.' },
  { when: 'When a listing uses the term "project"', indicates: 'it often signals an off-plan sale.', action: 'Inquire about construction stage, delivery timeline and index-linked pricing.' },
  { when: 'When orientation or exposures are emphasized', indicates: 'they often indicate natural light and climate considerations.', action: 'Assess whether north/south or east/west suits your preferences.' },
  { when: 'When a balcony, terrace or garden is highlighted', indicates: 'it often signals prized outdoor space.', action: 'Clarify size and whether it\'s exclusive.' },
  { when: 'When amenities like parking or storage are listed', indicates: 'they often exist but may not be registered.', action: 'Verify ownership or usage rights.' },
  { when: 'When floor numbers are mentioned', indicates: 'they often start at 0 for ground.', action: 'Adjust expectations accordingly.' },
  { when: 'When prices seem low', indicates: 'they often exclude taxes, fees and index adjustments.', action: 'Budget for additional costs based on your status.' },
  { when: 'When a property is described as "penthouse" or "mini-penthouse"', indicates: 'it often refers to a top-floor unit with a terrace.', action: 'Check roof rights and actual terrace size.' },
];

// Common Assumptions (12 items)
const commonAssumptions = [
  '"The number of rooms equals the number of bedrooms."',
  '"Advertised square meters are net living space."',
  '"Asking price is the final price."',
  '"Listings are in a central MLS and directly comparable."',
  '"Photos accurately reflect size and condition."',
  '"New means newly built."',
  '"First floor means ground level."',
  '"Agents represent only buyers and are paid at closing."',
  '"Maintenance fees are trivial or disclosed."',
  '"All properties can be financed easily."',
  '"Sellers provide inspection reports."',
  '"Project completion dates are fixed."',
];

export default function ListingsGuide() {
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
            {/* Back Button */}
            <Link to="/guides">
              <Button variant="ghost" className="gap-2 -ml-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Guides
              </Button>
            </Link>
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
                Why <span className="text-primary">Israel</span> Property Listings
              </h1>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6">
                Feel Misleading to International Buyers
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Decode local norms so you can read listings with calm and confidence.
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
        <motion.section 
          className="container py-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="max-w-4xl mx-auto">
            {/* 3 Pain Point Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="p-4 border-border/50 bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  Rooms are counted differently than you expect
                </p>
              </Card>
              <Card className="p-4 border-border/50 bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  Sizes may include or exclude shared areas
                </p>
              </Card>
              <Card className="p-4 border-border/50 bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  Listings are marketing snapshots, not legal documents
                </p>
              </Card>
            </div>
            
            {/* Gradient CTA Box */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <p className="text-foreground text-center mb-4">
                For international buyers and renters, Israeli property listings can feel like a puzzle. There is no single source of truth.
              </p>
              <p className="text-muted-foreground text-sm text-center">
                This guide does not give personal advice or tell you what to do. Instead, it explains why listings feel confusing, what local conventions drive the format, and how to interpret what you see.
                <span className="font-medium text-foreground"> Use it to read listings with calm and confidence before contacting agents.</span>
              </p>
            </div>
          </div>
        </motion.section>


        {/* Why Confusing Section */}
        <section id="why-confusing" className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Why Israeli Listings Feel Confusing to Internationals
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Six systemic reasons why the same listing reads differently to locals and internationals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {whyConfusingReasons.map((reason, index) => (
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
                These features reflect local priorities around lifestyle, natural light and building functionality.
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
          </div>
        </section>

        {/* What Listings Omit */}
        <section id="omitted" className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              What Israeli Listings Commonly Omit or Understate
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These omissions reflect an assumption that local buyers will investigate through professionals.
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
        </section>

        {/* Terms Table Section */}
        <section id="terms" className="py-16 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Terms That Don't Translate Cleanly
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Context and follow-up questions matter for every term.
              </p>
            </motion.div>

            <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
              <Card className="overflow-hidden bg-background">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-semibold text-foreground">Term</th>
                        <th className="text-left p-4 font-semibold text-foreground">What internationals assume</th>
                        <th className="text-left p-4 font-semibold text-foreground">What it commonly means locally</th>
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
                Why Photos Often Mislead Without Context
              </h2>
            </div>

            <Card className="p-8 bg-gradient-to-br from-muted/50 to-transparent">
              <p className="text-lg text-foreground leading-relaxed mb-4">
                Photos are marketing assets rather than technical documentation. Wide-angle lenses make 
                rooms appear larger; bright lighting emphasises views and exposures. Staging ranges from 
                empty shells to cluttered family homes, obscuring scale.
              </p>
              <p className="text-lg text-foreground leading-relaxed mb-4">
                In off-plan developments, images are digital renderings that illustrate design intent 
                rather than finished reality. Renovation photos can be outdated.
              </p>
              <p className="text-muted-foreground italic">
                Use photos for general atmosphere and layout insight, not as proof of size or condition.
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
                    Israeli asking prices are starting points subject to multiple variables. Without a 
                    central MLS, comparable sale data is scarce. Price per square meter is often calculated 
                    on gross area, making comparisons inconsistent.
                  </p>
                  <p className="leading-relaxed">
                    In new projects, prices are indexed to construction costs, so they rise with inflation. 
                    Advertised prices exclude purchase tax, betterment levy, lawyer fees and agent commission; 
                    these depend on buyer status. Extra charges for upgrades, parking or storage may also apply.
                  </p>
                  <p className="leading-relaxed text-muted-foreground">
                    Together, these factors make asking prices difficult to interpret at face value.
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
                Listings look identical for residents, new olim, foreign buyers and investors, but the 
                financial and bureaucratic consequences differ. Tax brackets, mortgage eligibility and 
                paperwork requirements vary by status, affecting the final cost and timeline even though 
                the advertisement remains unchanged.
              </p>
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
                Practical tips to decode what you're looking at.
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
                        <p className="text-foreground">
                          <span className="font-medium">{tip.when},</span>{' '}
                          <span className="text-muted-foreground">{tip.indicates}</span>
                        </p>
                        <p className="text-sm text-primary flex items-center gap-1 mt-2">
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

        {/* Common Assumptions Section */}
        <section id="assumptions" className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Common Assumptions International Buyers Bring
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These beliefs are understandable but often misaligned with Israeli practices.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {commonAssumptions.map((assumption, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="p-4 h-full flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground italic">{assumption}</p>
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
                    BuyWise Israel enhances listings by providing additional context without altering 
                    the original advertisement. It flags whether square meters refer to gross or net 
                    area and estimates typical Va'ad HaBayit fees based on building type.
                  </p>
                  <p className="leading-relaxed">
                    The platform overlays expected transaction costs—purchase tax, legal fees and agent 
                    commission—based on buyer status. It identifies when a listing refers to an off-plan 
                    project and summarises delivery timelines and index-linking.
                  </p>
                  <p className="leading-relaxed text-muted-foreground">
                    It translates local terms into plain English, clarifies floor numbering and explains 
                    counting conventions. These adjustments help international users interpret listings 
                    accurately while respecting the underlying marketing.
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
                Feeling confused by Israeli listings is a normal reaction to a system built for insiders. 
                Once you know how local norms shape room counts, measurements, pricing and terminology, 
                the confusion gives way to understanding. Recognising these patterns empowers you to read 
                listings calmly and confidently, turning what first seemed opaque into a clear map of options.
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
