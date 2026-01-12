import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, BookOpen, ChevronRight, AlertTriangle, CheckCircle2,
  MapPin, Home, Building2, Users, Gavel, FileWarning, Globe, HelpCircle,
  Maximize2, Sun, Sparkles, Building, Warehouse, Camera,
  Ruler, Receipt, Landmark, Percent, Banknote, Calendar, Eye,
  Lightbulb, XCircle, Shield
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'why-misleading', label: 'Why Misleading' },
  { id: 'emphasized', label: 'Emphasized' },
  { id: 'omitted', label: 'Omitted' },
  { id: 'terms', label: 'Terms' },
  { id: 'photos', label: 'Photos' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'how-to-read', label: 'How to Read' },
  { id: 'misinterpretations', label: 'Mistakes' },
  { id: 'buywise', label: 'BuyWise' },
];

const whyMisleadingPoints = [
  { icon: MapPin, title: "No single MLS", text: "Israel has no nationwide multiple-listing service; properties appear across agency sites, social media and word-of-mouth." },
  { icon: Home, title: "Different room counting", text: "Israelis count all rooms – the living room and safe room (MAMAD) included – so a '4-room' apartment is usually three bedrooms plus salon." },
  { icon: Building2, title: "Net vs gross measurements", text: "Square meters may be quoted as gross (bruto), which includes common hallways and elevator shafts; you must ask for net (neto) size." },
  { icon: Users, title: "Dual agency and timing", text: "Agents can represent both buyer and seller and are paid when the contract is signed, not at closing. This influences how listings are framed." },
  { icon: Gavel, title: "Marketing vs legal descriptions", text: "Listings highlight attractive features but are not legally binding; legal documents are drafted separately and may differ." },
  { icon: FileWarning, title: "Cultural negotiation norms", text: "Verbal agreements and preliminary documents can become binding, so listings rarely mention contingencies or 'subject to financing.'" },
  { icon: Globe, title: "Language and translation gaps", text: "Terms like 'penthouse,' 'garden,' or 'project' have local meanings that differ from literal translations." },
  { icon: HelpCircle, title: "Assumed local knowledge", text: "Details on land registration, building age, taxes or maintenance fees are assumed to be known and therefore omitted." },
];

const emphasizedPoints = [
  { icon: Home, title: "Total number of rooms", text: "Because room counts include the living room and safe room, this gives a rough sense of size." },
  { icon: Maximize2, title: "Outdoor space", text: "Balconies, gardens and terraces are prized in dense cities; listings highlight these features because they add value." },
  { icon: Sun, title: "Orientation and views", text: "Directions (north/south/east/west) and sea or skyline views are emphasized; local buyers know the climate and light associated with each." },
  { icon: Sparkles, title: "Renovation or 'new' labels", text: "'New' can mean recently renovated, newly built or an off-plan project. Developers and agents use it to signal quality." },
  { icon: Building, title: "Building amenities", text: "Elevators, parking spaces, storage rooms and safe rooms are spotlighted since not all buildings have them." },
  { icon: Warehouse, title: "Project branding", text: "New developments often stress the project name and developer reputation; this is meaningful in a market with many off-plan sales." },
];

const omittedPoints = [
  { icon: Ruler, title: "Net living space", text: "Many listings quote gross square meters; net size (actual interior space) appears only in contracts." },
  { icon: Calendar, title: "Building age and condition", text: "Unless recently renovated, the age and structural condition are rarely highlighted; homes are sold 'AS IS'." },
  { icon: Receipt, title: "Maintenance fees (Va'ad HaBayit)", text: "Monthly fees for cleaning, electricity and elevator maintenance vary widely; listings seldom include them." },
  { icon: Landmark, title: "Land status and registration", text: "Whether the property is freehold (Tabu) or leasehold (Minhal) is not usually stated; these details surface in legal checks." },
  { icon: Percent, title: "Taxes and transaction costs", text: "Purchase tax, betterment levy and attorney fees vary by buyer status and are typically absent from listings." },
  { icon: Banknote, title: "Mortgage feasibility", text: "Listings do not reveal whether the property is mortgageable; banks evaluate this after contract signing." },
  { icon: Clock, title: "Delivery timeline realism", text: "In new projects, advertised completion dates may exclude permitted delays." },
];

const termsTable = [
  { term: "4-room apartment", international: "Four bedrooms", israeli: "Three bedrooms plus living room" },
  { term: "SQM (square meter)", international: "Net interior space", israeli: "May be gross (including common areas)" },
  { term: "New", international: "Brand-new construction", israeli: "Can mean newly renovated, recently built or off-plan" },
  { term: "Project", international: "Completed condominium", israeli: "Often refers to an off-plan development with future delivery" },
  { term: "Garden apartment", international: "Private yard", israeli: "May be a shared garden or small patio" },
  { term: "First floor", international: "Ground level", israeli: "In Israel, 0 is ground; 1 is one flight up" },
  { term: "Penthouse/Mini-penthouse", international: "Entire roof level", israeli: "May simply be a top-floor unit with a terrace" },
  { term: "MAMAD/Safe room", international: "Extra storage", israeli: "Reinforced room counted as a room, sometimes used as bedroom" },
  { term: "Sea view", international: "Unobstructed ocean panorama", israeli: "Any partial view of the sea from a window" },
  { term: "Immediate entry", international: "Ready to move in", israeli: "Could mean after tenants leave or after registration" },
];

const readingTips = [
  { trigger: 'When you see "4 rooms"', tip: "It often means three bedrooms plus a salon. Confirm the actual bedroom count." },
  { trigger: "When a size is quoted", tip: "Ask if it is net or gross. Older listings may default to gross." },
  { trigger: 'When "new" appears', tip: "It can mean renovated, recently built or off-plan. Clarify the year built and occupancy status." },
  { trigger: 'When a listing says "project"', tip: "Assume it may be an off-plan sale. Verify delivery date and index-linking." },
  { trigger: "When a balcony or garden is advertised", tip: "Ask about size and exclusivity. Shared spaces are common." },
  { trigger: "When exposures and views are highlighted", tip: "Remember 'sea view' can be partial. Ask to see the view in person or via video." },
  { trigger: "When the listing mentions parking or storage", tip: "Confirm whether they are registered rights or general use." },
  { trigger: "When reading floor numbers", tip: "Recall that 0 is ground and 1 is the first floor above ground." },
  { trigger: "When the price seems low", tip: "Check if purchase tax, management fees and index adjustments are included." },
  { trigger: 'When you see "penthouse" or "mini-penthouse"', tip: "Verify roof rights and terrace size." },
  { trigger: "When no maintenance fee is stated", tip: "Assume there is a monthly Va'ad HaBayit payment. Ask for the amount." },
];

const misinterpretations = [
  "Thinking a '4-room' listing has four bedrooms.",
  "Taking square meter figures at face value without asking if they are gross or net.",
  "Believing 'new' always means brand-new construction.",
  "Reading floor numbers like in the US or UK, assuming first floor equals ground.",
  "Interpreting photos as accurate representations of size or condition.",
  "Assuming asking price is final or includes all taxes and fees.",
  "Expecting a 'sea view' to be unobstructed.",
  "Assuming agents exclusively represent one side and are paid at closing.",
  "Thinking 'project' refers to a completed building.",
  "Treating listing descriptions as legally binding promises.",
];

export default function ListingsGuide() {
  const [activeSection, setActiveSection] = useState('overview');
  const [showNav, setShowNav] = useState(false);

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
      <div className="min-h-screen bg-background">
        {/* Sticky Navigation */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: showNav ? 0 : -100 }}
          className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm"
        >
          <div className="container py-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
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

        {/* Hero Section */}
        <section id="overview" className="relative py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
          <div className="container mx-auto px-4">
            <motion.div
              {...fadeInUp}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                Guide for International Buyers
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                Why Israeli Listings Feel Misleading
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Israeli property listings aren't deceptive — they're built for locals who know how to read them. 
                This guide teaches you to interpret listings calmly, without panic or suspicion.
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  18 min read
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  10 sections
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Core Problem */}
        <section className="py-12 bg-muted/30">
          <div className="container">
            <motion.div 
              {...fadeInUp}
              className="max-w-3xl mx-auto p-6 rounded-xl bg-primary/5 border border-primary/20"
            >
              <div className="flex gap-4">
                <AlertTriangle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-foreground mb-2">The Core Problem in One Sentence</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Israeli property listings use local counting methods, marketing conventions and fragmented 
                    platforms that make sense to Israelis but clash with international expectations of uniform 
                    measurements, clear pricing and standardized disclosures.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why Misleading */}
        <section id="why-misleading" className="bg-muted/30 py-16">
          <div className="container">
            <motion.div {...fadeInUp} className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Why Israeli Listings Feel Misleading
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                8 key differences that confuse international buyers
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {whyMisleadingPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 rounded-xl bg-background border hover:shadow-md transition-shadow"
                >
                  <point.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">{point.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{point.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What's Emphasized */}
        <section id="emphasized" className="py-16">
          <div className="container">
            <motion.div {...fadeInUp} className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                What Israeli Listings Typically Emphasize
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These elements appeal to local priorities like lifestyle quality, natural light and outdoor space
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {emphasizedPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 rounded-xl bg-background border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <point.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{point.title}</h3>
                      <p className="text-sm text-muted-foreground">{point.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What's Omitted */}
        <section id="omitted" className="bg-muted/30 py-16">
          <div className="container">
            <motion.div {...fadeInUp} className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                What Israeli Listings Commonly Omit
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Local buyers assume they will investigate these issues through their lawyers and bankers
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {omittedPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 rounded-xl bg-muted/50 border"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <point.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{point.title}</h3>
                      <p className="text-sm text-muted-foreground">{point.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Terms Table */}
        <section id="terms" className="py-16">
          <div className="container">
            <motion.div {...fadeInUp} className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Terms That Don't Mean What You Think
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                No definition is absolute; context and follow-up questions matter
              </p>
            </motion.div>
            <motion.div 
              {...fadeInUp}
              className="max-w-4xl mx-auto rounded-xl border overflow-hidden"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Term</TableHead>
                    <TableHead className="font-semibold">International Assumption</TableHead>
                    <TableHead className="font-semibold">What It Often Means in Israel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {termsTable.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.term}</TableCell>
                      <TableCell className="text-muted-foreground">{row.international}</TableCell>
                      <TableCell>{row.israeli}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          </div>
        </section>

        {/* Photos Warning */}
        <section id="photos" className="bg-muted/30 py-16">
          <div className="container">
            <motion.div {...fadeInUp} className="max-w-3xl mx-auto">
              <div className="flex items-start gap-4 p-6 rounded-xl bg-background border">
                <Camera className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-3">
                    Why Photos Can Be Especially Misleading
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Photos in Israeli listings are intended to capture interest, not to document precise dimensions. 
                    Wide-angle lenses make small spaces seem larger, while bright lighting emphasizes natural light and views.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Staging ranges from empty rooms to cluttered family homes – both can obscure actual size. 
                    In off-plan projects, the "photos" are digital renderings that reflect design intent rather than actual finishes. 
                    Renovations depicted in photos may be years old.
                  </p>
                  <p className="text-sm font-medium text-primary">
                    Use photos for atmosphere and layout clues, not for exact measurements.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Price Confusion */}
        <section id="pricing" className="py-16">
          <div className="container">
            <motion.div {...fadeInUp} className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Where Price Confusion Comes From
                </h2>
              </div>
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-background border">
                  <p className="text-muted-foreground leading-relaxed">
                    Israeli asking prices are starting points and often exclude key costs. With no central MLS, 
                    comparable sales data is limited; price per square meter may be calculated on gross size, 
                    leading to inconsistent comparisons.
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-background border">
                  <p className="text-muted-foreground leading-relaxed">
                    In new projects, prices are linked to the <span className="font-medium text-foreground">Construction Inputs Index (Madad)</span>, 
                    which can increase the price during construction. Listings rarely include purchase tax, lawyer fees, 
                    agent commission or betterment levy, all of which depend on buyer status.
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-background border">
                  <p className="text-muted-foreground leading-relaxed">
                    Exchange rates and international transfer fees further complicate pricing for foreigners. 
                    Local buyers expect to negotiate and factor these in later.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How to Read */}
        <section id="how-to-read" className="bg-muted/30 py-16">
          <div className="container">
            <motion.div {...fadeInUp} className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                How to Read a Listing More Accurately
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                11 practical tips for interpreting Israeli property listings
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {readingTips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-5 rounded-xl bg-background border"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">{tip.trigger}</p>
                      <p className="text-sm text-muted-foreground">{tip.tip}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Common Misinterpretations */}
        <section id="misinterpretations" className="py-16">
          <div className="container">
            <motion.div {...fadeInUp} className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Common Misinterpretations
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                10 mistakes international buyers frequently make
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
              {misinterpretations.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border"
                >
                  <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* BuyWise Section */}
        <section id="buywise" className="bg-primary/5 py-16">
          <div className="container">
            <motion.div {...fadeInUp} className="max-w-3xl mx-auto text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                How BuyWise Changes the Listing Experience
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                BuyWise Israel enhances listings by adding context and standardization that international buyers need.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {[
                  "Indicates whether size figures are net or gross",
                  "Provides typical ranges for Va'ad HaBayit fees",
                  "Overlays estimated transaction costs based on buyer status",
                  "Flags when a listing refers to an off-plan project",
                  "Summarizes delivery timelines for new developments",
                  "Shows how taxes and financing differ by buyer type",
                  "Translates Hebrew-origin terms in plain English",
                  "Explains local concepts like MAMAD, Tabu, and Arnona",
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-background border">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">{feature}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Closing */}
        <section className="py-16">
          <div className="container">
            <motion.div {...fadeInUp} className="max-w-3xl mx-auto text-center">
              <Lightbulb className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-4">
                A Calm Reframe
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Feeling uncertain when reading Israeli listings is normal. The system evolved around local norms, 
                not to mislead you. Once you know that room counts include the living room and safe room, 
                that square meters might be gross, and that agents are paid at contract signing, the confusion fades.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Listings emphasize lifestyle features and assume you will investigate technical details later. 
                By understanding how to interpret what is said and what is left unsaid, you restore control 
                and can browse properties on BuyWise Israel with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/guides/buying-in-israel"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Complete Buying Guide
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/listings"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border bg-background font-medium hover:bg-muted transition-colors"
                >
                  Browse Listings
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
