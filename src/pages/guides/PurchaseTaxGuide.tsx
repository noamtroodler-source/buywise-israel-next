import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  AlertCircle,
  Calendar,
  TrendingUp,
  FileText,
  Users,
  BookOpen,
  Calculator,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Scale,
  Landmark,
  ArrowRight,
  Lightbulb,
  Image,
  DollarSign,
  Home,
  Building2,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  { id: 'what-it-is', label: 'What It Is' },
  { id: 'why-confusing', label: 'Why Confusing' },
  { id: 'terms', label: 'Terms' },
  { id: 'price-confusion', label: 'Price' },
  { id: 'buyer-status', label: 'Buyer Status' },
  { id: 'reading-tips', label: 'How to Read' },
  { id: 'assumptions', label: 'Assumptions' },
  { id: 'buywise', label: 'BuyWise' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const whyConfusingReasons = [
  {
    icon: Users,
    title: 'Buyer-Status Dependence',
    description: 'Rates and benefits change depending on whether you are an Israeli resident, a new oleh, a foreign buyer, or an investor.',
  },
  {
    icon: TrendingUp,
    title: 'Frequent Rule Changes',
    description: 'The Tax Authority updates brackets annually for inflation and may freeze or adjust them mid-cycle.',
  },
  {
    icon: AlertCircle,
    title: 'Informal Explanations',
    description: 'Much information circulates through agents, friends and social media, often without context or up-to-date details.',
  },
  {
    icon: Clock,
    title: 'Timing vs Expectation Gap',
    description: 'Liability arises at contract signing, not at closing; payment is due within sixty days.',
  },
  {
    icon: Globe,
    title: 'Language & Translation Gaps',
    description: 'Official guidance is primarily in Hebrew; terms like "single residence" carry specific legal meanings.',
  },
  {
    icon: FileText,
    title: 'Purchase vs Property Taxes',
    description: 'Many confuse Mas Rechisha with Arnona or other recurring charges; these are separate systems.',
  },
  {
    icon: Scale,
    title: 'Complex Benefits & Exceptions',
    description: 'Eligibility for reduced rates depends on declarations and timing, which may not be clear to newcomers.',
  },
];

const termsData = [
  {
    term: 'Mas Rechisha',
    assumption: 'A minor stamp duty',
    reality: 'A graduated purchase tax payable within about sixty days; rates vary by buyer status.',
  },
  {
    term: 'Single Residence',
    assumption: 'Any home you own if you own no other property worldwide',
    reality: 'A classification where you and your spouse/children together own only one residence in Israel.',
  },
  {
    term: 'Investor',
    assumption: 'Someone who buys property professionally',
    reality: 'A buyer who owns more than one residence or is a foreign resident without resident benefits.',
  },
  {
    term: 'Aliyah Benefit',
    assumption: 'Automatic tax break for all Jews',
    reality: 'A reduced rate available to new immigrants within a specific time window and subject to restrictions.',
  },
  {
    term: 'New Construction',
    assumption: 'Newly built home with standard taxes',
    reality: 'Tax is calculated on total value including VAT; payment can be deferred (interest applies).',
  },
  {
    term: 'Transfer Tax',
    assumption: 'Ongoing property tax',
    reality: 'In Israel, Mas Rechisha is a one-time levy; ongoing taxes are separate (Arnona).',
  },
  {
    term: 'Self-Assessment',
    assumption: 'Something handled automatically by lawyers',
    reality: "The buyer's responsibility to file a tax report; attorneys typically assist, but the obligation is yours.",
  },
  {
    term: 'Exemption',
    assumption: "Complete relief from tax if it's your first property",
    reality: 'Exemptions apply only to specific brackets or statuses; they rarely eliminate tax entirely.',
  },
  {
    term: 'Payment Deferral',
    assumption: 'No need to pay tax until delivery',
    reality: 'Only available in new constructions, and interest and inflation adjustments apply.',
  },
];

const readingTips = [
  {
    icon: DollarSign,
    tip: 'When you see a price, remember it excludes tax',
    detail: 'Purchase tax is calculated on the transaction value and paid separately.',
  },
  {
    icon: Building2,
    tip: 'When you see "off-plan" or "new project"',
    detail: 'Anticipate different tax timing. These are taxed on total contract value including VAT.',
  },
  {
    icon: Home,
    tip: 'When an agent calls it a "single residence"',
    detail: 'Verify your existing property holdings. The classification depends on combined ownership.',
  },
  {
    icon: Users,
    tip: 'When you are a new immigrant or planning Aliyah',
    detail: 'Check timing. Benefits apply only if you meet residency conditions within set windows.',
  },
  {
    icon: Globe,
    tip: 'When you are a foreign buyer',
    detail: 'Assume the investor rate schedule. Unless you become a resident, investor brackets apply.',
  },
  {
    icon: TrendingUp,
    tip: 'When looking at price per square meter',
    detail: 'Tax brackets apply to the total purchase price, not area. High cost per sqm = higher brackets.',
  },
  {
    icon: Scale,
    tip: 'When the price straddles bracket thresholds',
    detail: 'Small changes in negotiated price may move you into another band.',
  },
  {
    icon: Calendar,
    tip: 'When you hear different numbers',
    detail: 'Consider the update cycle. Brackets adjust annually; ensure information reflects current thresholds.',
  },
  {
    icon: Calculator,
    tip: 'When budgeting',
    detail: 'Treat purchase tax as a major line item separate from legal fees. Often the largest non-price cost.',
  },
];

const commonAssumptions = [
  'They believe purchase tax is included in the listing price.',
  'They assume tax is due at closing or possession.',
  'They expect one flat rate irrespective of residency or number of properties.',
  'They think they automatically qualify for exemptions as first-time buyers or new immigrants.',
  'They interpret "Mas Rechisha" as annual property tax.',
  'They assume banks or lawyers will handle tax payment without personal involvement.',
  'They believe rates remain constant and do not adjust for inflation.',
  'They think off-plan and resale transactions are taxed the same way.',
  'They consider purchase tax negotiable or waivable.',
  'They underestimate the proportion of total cost purchase tax represents.',
];

export default function PurchaseTaxGuide() {
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
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Sticky Navigation */}
        <AnimatePresence>
          {showStickyNav && (
            <motion.nav
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm"
            >
              <div className="container py-3">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
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
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <section id="overview" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
          <div className="container relative py-16 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge variant="secondary" className="mb-4">
                Essential Guide
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Purchase Tax in Israel
                <span className="block text-primary mt-2">What Foreign Buyers Don't Realize</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                Clarity Before Payment
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  12 sections
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  ~15 min read
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Updated 2025
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Opener Section */}
        <section className="container py-12">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
            {/* Pain Point Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="p-5 border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
                <p className="text-sm text-foreground font-medium">
                  Tax rates depend on who you are, not just what you pay
                </p>
              </Card>
              <Card className="p-5 border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
                <p className="text-sm text-foreground font-medium">
                  Payment is due weeks after signing, not at closing
                </p>
              </Card>
              <Card className="p-5 border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
                <p className="text-sm text-foreground font-medium">
                  Bracket thresholds change annually with inflation
                </p>
              </Card>
            </div>

            {/* CTA Box */}
            <div className="p-8 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <p className="text-lg text-foreground font-medium mb-3">
                For many international buyers, the idea of a tax on buying property in Israel creates anxiety and confusion.
              </p>
              <p className="text-muted-foreground mb-4">
                Mas Rechisha (purchase tax) is not a discretionary fee; it is a predictable state levy tied to the property's value and the buyer's status. This guide does not tell you what to do—but explains what the tax is, when it applies, why it differs from expectations abroad, and where misunderstandings arise.
              </p>
              <p className="text-primary font-semibold">
                Use it to understand the system before engaging professionals.
              </p>
            </div>
          </motion.div>
        </section>

        {/* One-Sentence Reality */}
        <section className="py-12 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-4xl mx-auto">
              <Card className="p-8 bg-background border-2 border-primary/20">
                <div className="flex items-start gap-4">
                  <Lightbulb className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">The One-Sentence Reality</h2>
                    <p className="text-lg text-foreground leading-relaxed">
                      Purchase tax surprises foreigners because it is a <strong>graduated levy</strong>, updated regularly, tied to <strong>buyer status</strong> and property type, and payable <strong>shortly after contract signing</strong>—which is very different from the simple, uniform stamp duties many expect.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* What It Is / What It Is Not */}
        <section id="what-it-is" className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              What Purchase Tax Is (and What It Is Not)
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* What It Is */}
              <Card className="p-6 border-green-200 dark:border-green-900">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-foreground">What It Is</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 mt-1">•</span>
                    <span>A state tax levied when you acquire rights to real estate in Israel</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Must be filed and paid within ~60 days after contract signing</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 mt-1">•</span>
                    <span>A graduated tax—higher portions of price face higher brackets</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Brackets indexed annually to inflation or frozen by policy</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Your status (resident, oleh, foreign, investor) affects which schedule applies</span>
                  </li>
                </ul>
              </Card>

              {/* What It Is Not */}
              <Card className="p-6 border-red-200 dark:border-red-900">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-foreground">What It Is Not</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Not the same as Arnona (annual municipal tax)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Not capital-gains tax on sellers</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Not a negotiable fee</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Not typically financed by a mortgage</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Not paid at closing or possession—it's paid after signing</span>
                  </li>
                </ul>
              </Card>
            </div>
          </motion.div>
        </section>

        {/* Why Purchase Tax Feels Confusing */}
        <section id="why-confusing" className="py-16 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                Why Purchase Tax in Israel Feels Confusing
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {whyConfusingReasons.map((reason, index) => (
                  <Card key={index} className="p-5 hover:border-primary/30 transition-colors">
                    <reason.icon className="h-6 w-6 text-primary mb-3" />
                    <h3 className="font-semibold text-foreground mb-2">{reason.title}</h3>
                    <p className="text-sm text-muted-foreground">{reason.description}</p>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* What Listings Emphasize / Omit */}
        <section className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Emphasize */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  What Listings Typically Emphasize
                </h3>
                <Card className="p-5">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Rooms, outdoor space and views
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Location descriptors and proximity to amenities
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Building features (elevator, parking, MAMAD)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Renovation or project status
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Lifestyle benefits and design quality
                    </li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-4 italic">
                    Local listings assume tax details will be handled later with a lawyer.
                  </p>
                </Card>
              </div>

              {/* Omit */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  What Listings Commonly Omit
                </h3>
                <Card className="p-5">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      Purchase tax information or bracket schedules
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      Net living space vs gross measurements
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      Legal and registration status (Tabu vs Minhal)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      Other costs (legal fees, commissions, currency conversion)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      Eligibility requirements for benefits
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      Timing of tax payment
                    </li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-4 italic">
                    These omissions reflect local norms, not bad faith.
                  </p>
                </Card>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Terms Table */}
        <section id="terms" className="py-16 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                Terms That Don't Translate Cleanly
              </h2>
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px] font-semibold">Term</TableHead>
                      <TableHead className="font-semibold">What internationals often assume</TableHead>
                      <TableHead className="font-semibold">What it commonly means locally</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {termsData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-primary">{item.term}</TableCell>
                        <TableCell className="text-muted-foreground">{item.assumption}</TableCell>
                        <TableCell>{item.reality}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
              <p className="text-xs text-muted-foreground mt-4 text-center italic">
                No definition is absolute; local practice and law determine the precise meaning.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Photos Section */}
        <section className="container py-12">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-4xl mx-auto">
            <Card className="p-6 border-l-4 border-l-primary">
              <div className="flex items-start gap-4">
                <Image className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Why Photos Often Mislead Without Context</h3>
                  <p className="text-sm text-muted-foreground">
                    Listing photographs are designed to showcase a property's appeal, not its tax implications. Wide-angle shots make rooms appear larger; staging emphasizes natural light. None of these visuals reveal whether the property is subject to different tax brackets, qualifies as a single residence, or is off-plan. <strong>Interpret photos as marketing, not as evidence of tax classification.</strong>
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* Price Confusion */}
        <section id="price-confusion" className="py-16 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                Where Price Confusion Comes From
              </h2>
              <Card className="p-8">
                <p className="text-foreground leading-relaxed mb-4">
                  Purchase tax complicates the relationship between asking price and total cost. In Israel, listing prices usually reflect the seller's target price only. The tax is calculated on the purchase price at contract signing and depends on bracket thresholds that change annually.
                </p>
                <p className="text-foreground leading-relaxed mb-4">
                  There are separate schedules for residents, new immigrants and investors, and non-residents are taxed at the investor rates. Because tax brackets are indexed to inflation and sometimes frozen, foreigners may hear different numbers at different times.
                </p>
                <p className="text-foreground leading-relaxed">
                  Unlike some countries where stamp duty is a small flat fee, in Israel <strong>purchase tax can be a significant portion of the overall cost</strong>, and it is rarely included in advertised prices. Price confusion also arises when buyers assume new construction and resale follow the same rules.
                </p>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Buyer Status Reality Check */}
        <section id="buyer-status" className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Buyer Status Reality Check
            </h2>
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <div className="flex items-start gap-4">
                <Landmark className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <p className="text-foreground leading-relaxed mb-4">
                    <strong>BuyWise Reality Check:</strong> The structure of the purchase tax system remains the same for everyone, but the rate schedule depends on who you are.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Israeli residents buying a single residence pay progressive brackets starting at zero.</li>
                    <li>• Foreign buyers, including non-resident citizens, are taxed under the investor schedule.</li>
                    <li>• New immigrants can claim the Aliyah benefit, but only within specific time frames and conditions.</li>
                    <li>• Investors or buyers of additional homes face higher flat rates.</li>
                  </ul>
                  <p className="text-sm text-foreground mt-4 font-medium">
                    Understanding which profile applies to you is critical; the tax law does not adjust automatically based on intentions.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* How to Read a Listing More Accurately */}
        <section id="reading-tips" className="py-16 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                How to Read a Listing More Accurately
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {readingTips.map((item, index) => (
                  <Card key={index} className="p-5 hover:border-primary/30 transition-colors">
                    <item.icon className="h-5 w-5 text-primary mb-3" />
                    <p className="font-medium text-foreground mb-2 text-sm">{item.tip}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Common Assumptions */}
        <section id="assumptions" className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Common Assumptions International Buyers Bring
            </h2>
            <Card className="p-6">
              <div className="grid sm:grid-cols-2 gap-3">
                {commonAssumptions.map((assumption, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <span className="text-primary font-bold text-sm">{index + 1}</span>
                    <p className="text-sm text-foreground">{assumption}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </section>

        {/* How BuyWise Adds Clarity */}
        <section id="buywise" className="py-16 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                How BuyWise Adds Clarity
              </h2>
              <Card className="p-8 border-primary/20">
                <p className="text-foreground leading-relaxed mb-4">
                  BuyWise Israel does not calculate your tax or provide legal advice; instead, it <strong>surfaces context</strong> to help you read listings accurately.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Provides estimated purchase tax ranges based on current bracket schedules</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Adjusts estimates by buyer type—resident, Oleh, foreign buyer, or investor</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Clearly separates verified elements from variables like tax and fees</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Plain-English explanations highlight when off-plan rules or Aliyah benefits might be relevant</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground italic">
                  This contextual overlay helps you grasp the true cost picture before engaging professionals.
                </p>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Calm Reframe */}
        <section className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-4xl mx-auto">
            <div className="p-8 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center">
              <Receipt className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-4">Calm Reframe</h2>
              <p className="text-foreground leading-relaxed mb-4">
                It's natural to feel anxious about purchase tax when you hear conflicting numbers and stories. The reality is that Mas Rechisha is a <strong>structured, rule-based system</strong> tied to your status and the property value.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Once you understand that liability arises at contract signing, that brackets change periodically, and that residency and timing affect which schedule applies, the tax becomes predictable. Confusion often stems from mismatched expectations, not deception; <strong>clarity restores your sense of control</strong>.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Bottom CTAs */}
        <section className="container pb-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <Link to="/tools" className="group">
                <Card className="p-6 h-full hover:border-primary/50 transition-colors">
                  <Calculator className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Purchase Tax Calculator</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Estimate your purchase tax based on property price and buyer status.
                  </p>
                  <span className="text-sm font-medium text-primary group-hover:underline flex items-center gap-1">
                    Calculate Now <ArrowRight className="h-4 w-4" />
                  </span>
                </Card>
              </Link>
              <Link to="/guides" className="group">
                <Card className="p-6 h-full hover:border-primary/50 transition-colors">
                  <BookOpen className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">More Guides</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Explore our complete collection of guides for international buyers.
                  </p>
                  <span className="text-sm font-medium text-primary group-hover:underline flex items-center gap-1">
                    Browse Guides <ArrowRight className="h-4 w-4" />
                  </span>
                </Card>
              </Link>
              <Link to="/glossary" className="group">
                <Card className="p-6 h-full hover:border-primary/50 transition-colors">
                  <HelpCircle className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Full Glossary</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Look up Hebrew terms and real estate jargon in plain English.
                  </p>
                  <span className="text-sm font-medium text-primary group-hover:underline flex items-center gap-1">
                    View Glossary <ArrowRight className="h-4 w-4" />
                  </span>
                </Card>
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </Layout>
  );
}
