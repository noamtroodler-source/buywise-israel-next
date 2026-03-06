import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DualNavigation } from '@/components/shared/DualNavigation';
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
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';
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
  { id: 'tax-brackets', label: '2025/26 Rates' },
  { id: 'worked-example', label: 'Cost Examples' },
  { id: 'why-confusing', label: 'Why Complex' },
  { id: 'timeline', label: 'Payment Timeline' },
  { id: 'terms', label: 'Key Terms' },
  { id: 'buyer-status', label: 'Buyer Status' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const whyConfusingReasons = [
  {
    icon: Users,
    title: 'Your status changes the rate',
    description: 'Israeli resident, oleh, foreign buyer, investor — each has a different bracket schedule. Two people buying the same apartment can pay wildly different tax.',
  },
  {
    icon: Clock,
    title: 'Tax is due after signing, not closing',
    description: 'You owe tax within 60 days of contract signing. Not at key handover, not at Tabu registration — at signing. Many buyers aren\'t financially ready for this.',
  },
  {
    icon: TrendingUp,
    title: 'Brackets shift every January',
    description: 'Thresholds are indexed to the consumer price index and updated annually. Numbers you found online 6 months ago may already be wrong.',
  },
  {
    icon: Globe,
    title: 'Official guidance is in Hebrew',
    description: 'The Tax Authority website, Form 1345, and bracket tables are all in Hebrew. English summaries online are often outdated or oversimplified.',
  },
];

const termsData = [
  {
    term: 'Mas Rechisha',
    assumption: 'A minor stamp duty',
    reality: 'A graduated purchase tax payable within ~60 days of signing. Rates range from 0% to 10% depending on buyer status.',
  },
  {
    term: 'Single Residence (Dira Yechida)',
    assumption: 'Any home if you own no other',
    reality: 'You and your spouse/children together own only one residence in Israel. Worldwide holdings may also matter.',
  },
  {
    term: 'Investor Rate',
    assumption: 'Only for professional investors',
    reality: 'Applies to anyone buying a second (or additional) property, or any foreign resident. Starts at 8%.',
  },
  {
    term: 'Oleh Benefit',
    assumption: 'Automatic lifetime tax break',
    reality: 'Reduced 0.5% rate up to ₪6M, but only within 7 years of aliyah date. Must be actively claimed.',
  },
  {
    term: 'Form 1345 (Hatzharat Rochesh)',
    assumption: 'Something the lawyer handles automatically',
    reality: 'The buyer\'s declaration filed within 40 days of signing. Your lawyer files it, but you\'re legally responsible.',
  },
  {
    term: 'Payment Deferral',
    assumption: 'Delay payment until delivery',
    reality: 'Only for new construction. Interest + CPI linkage apply during deferral — it\'s not free.',
  },
  {
    term: 'Self-Assessment',
    assumption: 'Tax Authority sends you a bill',
    reality: 'You calculate and declare your own tax. The Authority may accept or challenge your assessment.',
  },
  {
    term: 'Late Payment Interest',
    assumption: 'Small penalty',
    reality: 'Significant interest + CPI linkage accrues from day 61. Can add tens of thousands on expensive properties.',
  },
];

const singleResidenceBrackets = [
  { range: 'Up to ₪1,978,745', rate: '0%' },
  { range: '₪1,978,745 – ₪2,347,040', rate: '3.5%' },
  { range: '₪2,347,040 – ₪6,055,070', rate: '5%' },
  { range: '₪6,055,070 – ₪20,183,565', rate: '8%' },
  { range: 'Above ₪20,183,565', rate: '10%' },
];

const investorBrackets = [
  { range: 'Up to ₪6,055,070', rate: '8%' },
  { range: 'Above ₪6,055,070', rate: '10%' },
];

const olehBrackets = [
  { range: 'Up to ₪1,978,745', rate: '0%' },
  { range: '₪1,978,745 – ₪6,055,070', rate: '0.5%' },
  { range: '₪6,055,070 – ₪20,183,565', rate: '8%' },
  { range: 'Above ₪20,183,565', rate: '10%' },
];

const workedExamples = [
  {
    label: 'First-Time Buyer (Single Residence)',
    price: '₪2,500,000',
    calculation: '₪0 on first ₪1.98M + 3.5% on ₪368K + 5% on ₪153K',
    tax: '₪20,530',
    effectiveRate: '0.82%',
    color: 'text-primary',
  },
  {
    label: 'Oleh Hadash (within 7 years)',
    price: '₪2,500,000',
    calculation: '₪0 on first ₪1.98M + 0.5% on ₪521K',
    tax: '₪2,606',
    effectiveRate: '0.10%',
    color: 'text-emerald-600',
  },
  {
    label: 'Investor / Foreign Buyer',
    price: '₪2,500,000',
    calculation: '8% on entire ₪2.5M',
    tax: '₪200,000',
    effectiveRate: '8.00%',
    color: 'text-destructive',
  },
];

const timelineSteps = [
  {
    step: '1',
    title: 'Sign Purchase Contract',
    description: 'Tax liability begins at contract signing. The clock starts now.',
    deadline: 'Day 0',
    icon: FileText,
  },
  {
    step: '2',
    title: 'File Form 1345',
    description: 'Buyer\'s declaration of purchase (Hatzharat Rochesh). Filed by your lawyer with the Tax Authority.',
    deadline: 'Within 40 days',
    icon: Receipt,
  },
  {
    step: '3',
    title: 'Pay Purchase Tax',
    description: 'Full payment due. After this deadline, interest + CPI linkage accrues automatically.',
    deadline: 'Within 60 days',
    icon: Calculator,
  },
];

export default function PurchaseTaxGuide() {
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
            <DualNavigation
              parentLabel="All Guides"
              parentPath="/guides"
              className="mb-4"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge variant="secondary" className="mb-4">
                Essential Guide
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Purchase Tax in <span className="text-primary">Israel</span>
                <span className="block mt-2">What Foreign Buyers Don't Realize</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                The actual numbers, brackets, and deadlines — not the buzzwords
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  8 sections
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  ~8 min read
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Updated 2026
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Opener */}
        <section className="container py-12">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="p-4 border-border/50 bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  Tax rates depend on who you are, not just what you pay
                </p>
              </Card>
              <Card className="p-4 border-border/50 bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  Payment is due weeks after signing, not at closing
                </p>
              </Card>
              <Card className="p-4 border-border/50 bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  Same apartment, different buyer = ₪180K+ difference in tax
                </p>
              </Card>
            </div>

            <div className="p-8 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <p className="text-lg text-foreground font-medium mb-3">
                Mas Rechisha (purchase tax) is a state levy on every property transaction in Israel. It's not optional, not negotiable, and not included in the listing price.
              </p>
              <p className="text-muted-foreground">
                This guide covers the actual bracket tables, a worked calculation, payment deadlines, and the specific points where international buyers get tripped up. No buzzwords — just the mechanics.
              </p>
            </div>
          </motion.div>
        </section>

        {/* What It Is / What It Is Not */}
        <section id="what-it-is" className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              What Purchase Tax Is (and What It Is Not)
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6 border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">What It Is</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    'A state tax on acquiring real estate rights in Israel',
                    'Graduated — higher portions of price hit higher brackets',
                    'Due within 60 days of contract signing',
                    'Brackets updated annually for inflation (CPI-linked)',
                    'Your status (resident, oleh, foreign, investor) determines which rate table applies',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6 border-border bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="h-6 w-6 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">What It Is Not</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    'Not Arnona (that\'s annual municipal property tax)',
                    'Not capital-gains tax (that\'s the seller\'s problem)',
                    'Not negotiable or waivable',
                    'Not typically financed by a mortgage',
                    'Not paid at closing or key handover — it\'s paid after signing',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </motion.div>
        </section>

        {/* Tax Brackets */}
        <section id="tax-brackets" className="py-16 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
                2025/26 Tax Brackets
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-8">
                Thresholds updated January 2025. These shift annually with the CPI.
              </p>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Single Residence */}
                <Card className="p-5 border-primary/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="default" className="text-xs">Lowest Rates</Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-3">Single Residence (First-Time)</h3>
                  <div className="space-y-2">
                    {singleResidenceBrackets.map((b, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{b.range}</span>
                        <span className="font-medium text-foreground">{b.rate}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Also applies to upgraders selling within 18 months.
                  </p>
                </Card>

                {/* Investor / Foreign */}
                <Card className="p-5 border-destructive/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="destructive" className="text-xs">Highest Rates</Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-3">Investor / Foreign / Company</h3>
                  <div className="space-y-2">
                    {investorBrackets.map((b, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{b.range}</span>
                        <span className="font-medium text-foreground">{b.rate}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    All foreign residents pay this regardless of whether it's their first property.
                  </p>
                </Card>

                {/* Oleh */}
                <Card className="p-5 border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="text-xs bg-emerald-600 hover:bg-emerald-700">Oleh Benefit</Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-3">New Immigrant (within 7 years)</h3>
                  <div className="space-y-2">
                    {olehBrackets.map((b, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{b.range}</span>
                        <span className="font-medium text-foreground">{b.rate}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    7-year window from aliyah date. Applies to first AND additional properties.
                  </p>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Worked Example */}
        <section id="worked-example" className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
              Same Apartment, Different Tax
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Purchase price: ₪2,500,000 — here's how buyer status changes the bill
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {workedExamples.map((ex, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="p-6 h-full flex flex-col">
                    <h3 className="font-semibold text-foreground mb-1 text-sm">{ex.label}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{ex.calculation}</p>
                    <div className="mt-auto">
                      <p className={`text-3xl font-bold ${ex.color}`}>{ex.tax}</p>
                      <p className="text-sm text-muted-foreground">Effective rate: {ex.effectiveRate}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="mt-6 p-4 bg-muted/50 border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                These are illustrative calculations based on 2025 brackets. Your lawyer will file the exact assessment. The gap between first-time buyer and investor on a ₪2.5M property is <strong>₪179,470</strong>.
              </p>
            </Card>
          </motion.div>
        </section>

        {/* Why It's Complex */}
        <section id="why-confusing" className="py-16 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                Why This Trips Up International Buyers
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {whyConfusingReasons.map((reason, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    viewport={{ once: true }}
                  >
                    <Card className="p-5 h-full hover:border-primary/30 transition-colors">
                      <reason.icon className="h-6 w-6 text-primary mb-3" />
                      <h3 className="font-semibold text-foreground mb-2">{reason.title}</h3>
                      <p className="text-sm text-muted-foreground">{reason.description}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Payment Timeline */}
        <section id="timeline" className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Payment Timeline
            </h2>

            <div className="space-y-4">
              {timelineSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.12 }}
                  viewport={{ once: true }}
                >
                  <Card className="p-5 flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground">{step.title}</h3>
                        <Badge variant="outline" className="text-xs">{step.deadline}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="mt-6 p-4 border-destructive/20 bg-destructive/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Late payment is expensive</p>
                  <p className="text-xs text-muted-foreground">
                    After 60 days, interest + CPI linkage accrues automatically. On a ₪200K tax bill, even a few months' delay can add ₪10K+. The Tax Authority does not send reminders.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* Key Terms */}
        <section id="terms" className="py-16 bg-muted/30">
          <div className="container">
            <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                Key Terms
              </h2>
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px] font-semibold">Term</TableHead>
                      <TableHead className="font-semibold">What people assume</TableHead>
                      <TableHead className="font-semibold">What it actually means</TableHead>
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
            </motion.div>
          </div>
        </section>

        {/* Buyer Status */}
        <section id="buyer-status" className="container py-16">
          <motion.div {...fadeInUp} viewport={{ once: true }} className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              How Your Status Changes Everything
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Landmark className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Israeli Resident — Single Residence</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Progressive brackets starting at 0%. First ₪1.98M is tax-free. Effective rate on a ₪2.5M purchase: ~0.8%.
                </p>
                <p className="text-xs text-muted-foreground">Must own only one residence (you + spouse combined).</p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Foreign Buyer / Non-Resident</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Investor rate: 8% from the first shekel. On a ₪2.5M property, that's ₪200,000 in tax alone.
                </p>
                <p className="text-xs text-muted-foreground">Applies even if it's your only property worldwide.</p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Oleh Hadash (New Immigrant)</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Special 0.5% rate on ₪1.98M–₪6M bracket. On a ₪2.5M purchase: ~₪2,600 total tax.
                </p>
                <p className="text-xs text-muted-foreground">7-year window from aliyah date. Applies to all properties, not just the first.</p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Investor / Additional Property</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Same 8%+ rate as foreign buyers. Already owning one apartment in Israel triggers this rate on the second.
                </p>
                <p className="text-xs text-muted-foreground">Upgraders selling within 18 months can claim single-residence rates retroactively.</p>
              </Card>
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
                    Run your own numbers with current brackets and buyer status.
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
                    Buying process, new vs resale, costs breakdown, and more.
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
                    Hebrew terms and real estate jargon in plain English.
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
