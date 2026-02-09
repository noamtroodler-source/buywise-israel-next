import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { 
  Landmark, 
  CheckCircle, 
  FileText, 
  Users, 
  Percent, 
  TrendingUp, 
  Clock, 
  Shield, 
  Building, 
  ArrowRightLeft, 
  Home, 
  Plane, 
  MessageSquare, 
  Calendar, 
  Handshake,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Calculator,
  DollarSign,
  Scale,
  Briefcase,
  CircleDot,
  HelpCircle
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';
import { Button } from '@/components/ui/button';

const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'assumptions', label: 'Assumptions' },
  { id: 'differences', label: 'Differences' },
  { id: 'buyer-status', label: 'Buyer Status' },
  { id: 'process', label: 'The Process' },
  { id: 'evaluation', label: 'Evaluation' },
  { id: 'surprises', label: 'Surprises' },
  { id: 'non-committal', label: 'Why Non-Committal' },
  { id: 'interactions', label: 'Interactions' },
  { id: 'buywise', label: 'BuyWise' },
  { id: 'closing', label: 'Closing' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const commonAssumptions = [
  { icon: CheckCircle, text: 'Pre-approval is binding' },
  { icon: FileText, text: 'Financing is secured before contract' },
  { icon: Users, text: 'Foreign income treated like local income' },
  { icon: Percent, text: 'LTV ratios mirror home country' },
  { icon: TrendingUp, text: 'Interest rates are uniform across banks' },
  { icon: Clock, text: 'Mortgage approval is quick' },
  { icon: Shield, text: 'Financing contingencies protect buyers' },
  { icon: Building, text: 'One bank is enough' },
  { icon: ArrowRightLeft, text: 'Currency and exchange rates irrelevant' },
  { icon: Home, text: 'Any property qualifies' },
  { icon: Plane, text: 'Residency status doesn\'t matter' },
  { icon: Users, text: 'Local guarantors aren\'t needed' },
  { icon: MessageSquare, text: 'Banks communicate with lawyers seamlessly' },
  { icon: Calendar, text: 'Mortgage offers stay valid for months' },
  { icon: Handshake, text: 'Brokers work like in US/UK' },
  { icon: Clock, text: 'Mortgage offers stay valid indefinitely' },
];

const howMortgagesDiffer = [
  {
    title: 'Pre-approval is indicative, not final',
    description: 'Israeli banks may offer a preliminary assessment of financing capacity, but it does not guarantee that a loan will be granted; the bank\'s final decision comes after the purchase contract is signed and the property has been appraised.',
  },
  {
    title: 'Financing follows the contract',
    description: 'In contrast to systems where mortgage approval precedes a binding agreement, in Israel buyers sign the contract and pay a significant deposit before securing their mortgage; there is usually no financing contingency built into the agreement.',
  },
  {
    title: 'Buyer status determines LTV limits',
    description: 'Bank of Israel regulations set maximum loan-to-value ratios: 75% for first-time Israeli buyers and Olim, 70% for upgraders, 50% for investors and foreign buyers. Some lenders offer up to 70% for strong foreign profiles with substantial assets or dual residency.',
  },
  {
    title: 'Appraisals may fall short of purchase price',
    description: 'Banks will not necessarily appraise the property at the full purchase price. This means your actual loan amount may be lower than expected. Get a realistic appraisal estimate before signing a sales contract to avoid a financing gap.',
    badge: 'CRITICAL',
  },
  {
    title: 'Work with a mortgage broker',
    description: 'Mortgage products in Israel vary greatly from other countries. A qualified broker can navigate the Israeli banking system, compare offers across multiple banks, and negotiate terms that suit your specific profile and income source.',
  },
  {
    title: 'Debt-to-income limits apply',
    description: 'The Bank of Israel caps mortgage payments at 33-40% of net monthly income. For example, if your joint net income is ₪30,000, monthly payments cannot exceed ₪10,000-12,000.',
  },
  {
    title: 'Property characteristics influence eligibility',
    description: 'Banks evaluate the property\'s land tenure (freehold vs leasehold), location, and condition before approving a loan; some properties in development or with complex registration may not qualify for financing.',
  },
  {
    title: 'Currency and income source complicate matters',
    description: 'Foreign currency income and assets introduce exchange-rate risk; banks may adjust terms or require proof of stable local income. Foreign buyers may need Israeli guarantors (arev) or additional collateral.',
  },
  {
    title: 'Documentation is extensive and locally oriented',
    description: 'Borrowers must supply Israeli bank account statements, tax returns, legal identification, and sometimes local guarantors; foreign documentation often requires translation and verification.',
  },
  {
    title: 'Pre-payment penalties vary by loan type',
    description: 'Variable-rate loans generally have no pre-payment penalties. Fixed-rate loans (available up to 20 years) may incur significant penalties if market rates drop below your contracted rate.',
    badge: 'VARIES BY LOAN TYPE',
  },
  {
    title: 'Olim may access government mortgage (Zakaut)',
    description: 'New immigrants may be eligible for a government-backed Zakaut mortgage within 15 years of aliyah — typically a fixed inflation-linked rate (~3%) with no prepayment penalty, on a limited amount.',
    badge: 'OLIM BENEFIT',
  },
  {
    title: 'Mortgage sub-loan flexibility',
    description: 'Israeli mortgages can combine multiple sub-loans (prime-linked, CPI-linked, fixed, foreign-currency), each with different terms and risk profiles. This flexibility is uncommon in the US/UK and allows tailored structuring.',
  },
  {
    title: 'No rate locks',
    description: 'Israeli mortgage lenders rarely offer rate locks. Interest rates can change between pre-approval and closing, so borrowers should plan for fluctuations and avoid assuming quoted rates are final.',
  },
  {
    title: 'Foreign-currency loans',
    description: 'Loans denominated in USD or EUR are available, with interest based on LIBOR + premium. These match foreign income currency but carry exchange-rate risk — a weakening shekel increases repayments in real terms.',
  },
];

const buyerStatuses = [
  {
    icon: Home,
    title: 'Israeli Residents',
    description: 'Often have the broadest access to financing; banks view local income and credit history as more predictable and may offer higher loan-to-value ratios and quicker processing.',
  },
  {
    icon: Users,
    title: 'New Olim',
    description: 'May be eligible for certain benefits or reduced requirements, but they still need to provide proof of integration and local income; some banks ask for an Israeli guarantor despite immigrant incentives.',
  },
  {
    icon: Plane,
    title: 'Foreign Buyers Living Abroad',
    description: 'Usually face stricter conditions: lower loan-to-value ratios, more extensive documentation, and longer approval times; banks may require local guarantors or collateral in Israel.',
  },
  {
    icon: Building,
    title: 'Investors with Multiple Properties',
    description: 'Considered higher risk and typically face higher down payment requirements and stricter evaluations.',
  },
];

const processSteps = [
  {
    stage: 'After accepted offer',
    action: 'Consult banks or mortgage brokers',
    detail: 'Banks provide non-binding indications based on income and assets. Foreigners generally need 50% down and should gather: passport, proof of income, credit report, bank statements, and signed purchase agreement.',
  },
  {
    stage: 'At contract signing',
    action: 'Pay 10-20% deposit without mortgage',
    detail: 'Legal checks and title verification are handled by the lawyer at this stage.',
  },
  {
    stage: 'After contract signed',
    action: 'Bank orders appraisal + formal underwriting',
    detail: 'This phase can take several weeks. Buyers supply additional documentation and may negotiate terms with multiple banks.',
  },
  {
    stage: 'Near closing',
    action: 'Final approval + lien registration',
    detail: 'The bank issues final approval and coordinates with the buyer\'s lawyer to register a lien on the property. Mortgage funds are released according to the payment schedule.',
  },
  {
    stage: 'Post-closing',
    action: 'Monthly repayments begin',
    detail: 'Registration of ownership and mortgage registration may continue after key handover.',
  },
];

const evaluationCategories = [
  {
    icon: Users,
    title: 'Borrower profile',
    description: 'Age, marital status, family size, existing debt, and credit history (where available) inform risk assessments.',
  },
  {
    icon: DollarSign,
    title: 'Income source',
    description: 'Banks review salary or business income, including whether it is earned in Israel or abroad, stability, and currency; foreign income often triggers additional scrutiny.',
  },
  {
    icon: Home,
    title: 'Property characteristics',
    description: 'The property\'s size, location, registration status, and land tenure influence the bank\'s willingness to lend. Off-plan projects, leasehold land, or irregular registration may reduce eligibility.',
  },
  {
    icon: Scale,
    title: 'Equity and collateral',
    description: 'The size of your down payment and availability of additional collateral affect loan terms; banks may require a greater equity contribution from non-residents.',
  },
  {
    icon: ArrowRightLeft,
    title: 'Currency exposure',
    description: 'When income and mortgage repayments occur in different currencies, banks evaluate exchange-rate risk and may adjust loan structure accordingly.',
  },
];

const surprises = [
  'Assuming pre-approval is final — Buyers think a letter from one bank guarantees financing, when it is only an initial indication.',
  'Expecting mortgage contingency clauses — Many are surprised that purchase contracts rarely allow withdrawal if financing falls through.',
  'Underestimating documentation complexity — They are caught off-guard by requests for Israeli bank statements, translations of foreign tax returns, and local guarantors.',
  'Believing foreign income is treated consistently — Different banks interpret foreign earnings differently; some may cap loan amounts or require currency hedging.',
  'Thinking one bank is enough — Buyers assume that all banks will offer similar terms and overlook the benefits of exploring multiple options.',
  'Assuming mortgage comes before commitment — They expect to know final terms before signing, but in Israel financing typically follows the contract.',
  'Confusing mortgage payments with ownership — Some believe that once they obtain a mortgage and pay installments they are fully registered owners; in reality, registration continues after key handover.',
  'Expecting unlimited loan-to-value — Foreign buyers may plan for high leverage similar to home countries and find that banks require larger down payments.',
  'Assuming bank rules are transparent and uniform — Buyers often believe lending criteria are published and consistent; in practice policies differ and can change.',
  'Thinking banks coordinate with sellers and lawyers seamlessly — They may assume the bank, lawyer, and seller communicate automatically; instead, coordination often falls to the buyer.',
];

const buywiseHelps = [
  {
    icon: BookOpen,
    title: 'Explains fixed vs variable parts',
    description: 'Clarifies which parts of the mortgage process are consistent and which vary by bank and buyer profile.',
  },
  {
    icon: FileText,
    title: 'Surfaces documentation requirements',
    description: 'Shows typical documentation needs and timelines based on buyer status.',
  },
  {
    icon: Users,
    title: 'Flags buyer status eligibility',
    description: 'Highlights where your residency status and income source influence what banks may offer.',
  },
  {
    icon: HelpCircle,
    title: 'Separates known from unknown',
    description: 'Distinguishes between verified information and variables that depend on individual circumstances.',
  },
];

export default function MortgagesGuide() {
  useTrackContentVisit('guide');
  const [showNav, setShowNav] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

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
                  className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Landmark className="h-4 w-4" />
                Essential Guide
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
                Mortgages in <span className="text-primary">Israel</span> for Foreign Buyers
              </h1>
              <p className="text-xl md:text-2xl text-primary font-medium mb-4">
                How It Actually Works
              </p>
              <p className="text-muted-foreground text-lg mb-6">
                Why financing feels opaque and how to navigate the system
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span>{navSections.length} sections</span>
                <span>•</span>
                <span>~20 min read</span>
                <span>•</span>
                <span>Updated 2025</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Overview Section */}
        <section id="overview" className="container py-12">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            {/* Three Pain Point Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="p-5 rounded-xl bg-muted/50 border">
                <p className="text-sm text-muted-foreground">
                  You typically know your budget upfront in your home country
                </p>
              </div>
              <div className="p-5 rounded-xl bg-muted/50 border">
                <p className="text-sm text-muted-foreground">
                  In Israel, financing uncertainty is part of the journey
                </p>
              </div>
              <div className="p-5 rounded-xl bg-muted/50 border">
                <p className="text-sm text-muted-foreground">
                  Banks evaluate each buyer and property according to local rules
                </p>
              </div>
            </div>

            {/* Gradient CTA Box */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 text-center">
              <p className="text-lg font-medium text-foreground mb-3">
                For many international buyers, securing a mortgage in Israel can feel opaque and unnerving.
              </p>
              <p className="text-muted-foreground mb-4">
                In countries like the United States or the United Kingdom, you typically know your budget upfront and obtain a firm pre-approval before making an offer. In Israel, the process is different: financing uncertainty is part of the journey, and banks evaluate each buyer and property according to local rules. The result can feel unpredictable—but it is a structured system rather than a personal roadblock.
              </p>
              <p className="font-semibold text-foreground">
                Use this guide to understand the system before speaking with banks.
              </p>
            </div>

            {/* One-Sentence Reality */}
            <div className="mt-8 p-6 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">The One-Sentence Reality</h3>
                  <p className="text-muted-foreground">
                    Mortgages in Israel feel opaque to foreign buyers because banks rarely issue binding approvals before a contract is signed, and lending criteria vary by buyer status, income source, property type, and bank.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Common Assumptions Section */}
        <section id="assumptions" className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Common Assumptions Foreign Buyers Make
            </h2>
            <p className="text-muted-foreground mb-8">
              International buyers often arrive with expectations shaped by mortgage systems in their home countries. Here are some common assumptions:
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {commonAssumptions.map((assumption, index) => (
                <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border">
                  <assumption.icon className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">{assumption.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* How Mortgages Differ Section */}
        <section id="differences" className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              How Mortgages in Israel Differ From What Foreign Buyers Expect
            </h2>
            <p className="text-muted-foreground mb-8">
              Understanding these key differences will help you navigate the Israeli mortgage landscape.
            </p>
            <div className="space-y-4">
              {howMortgagesDiffer.map((item, index) => (
                <div key={index} className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-primary/10 text-primary whitespace-nowrap">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Buyer Status Section */}
        <section id="buyer-status" className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Buyer Status Reality Check
            </h2>
            <p className="text-muted-foreground mb-8">
              Mortgage treatments vary substantially depending on who you are. These distinctions determine how banks view your financial profile, documentation, and capacity to repay.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {buyerStatuses.map((status, index) => (
                <div key={index} className="p-5 rounded-xl bg-muted/30 border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <status.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{status.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{status.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Process Section */}
        <section id="process" className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              How the Mortgage Process Fits Into a Purchase
            </h2>
            <p className="text-muted-foreground mb-8">
              In Israel, the mortgage process is interwoven with the property transaction rather than preceding it. This sequence means financing clarity arrives only after contractual commitments are made.
            </p>
            <div className="space-y-4">
              {processSteps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {index + 1}
                    </div>
                    {index < processSteps.length - 1 && (
                      <div className="w-0.5 h-full bg-primary/20 my-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="text-sm text-primary font-medium mb-1">{step.stage}</div>
                    <h3 className="font-semibold text-foreground mb-2">{step.action}</h3>
                    <p className="text-sm text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Evaluation Section */}
        <section id="evaluation" className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              What Banks Evaluate
            </h2>
            <p className="text-muted-foreground mb-8">
              Israeli banks consider several broad categories when assessing a mortgage application. These categories form a risk profile that each bank interprets according to its own criteria.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {evaluationCategories.map((category, index) => (
                <div key={index} className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <category.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{category.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground text-center">
                <span className="font-medium text-foreground">Note:</span> There is no single rule or formula — each bank interprets these factors differently.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Surprises Section */}
        <section id="surprises" className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Where International Buyers Get Surprised
            </h2>
            <p className="text-muted-foreground mb-8">
              These common surprises often catch foreign buyers off guard during the mortgage process.
            </p>
            <div className="space-y-3">
              {surprises.map((surprise, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border">
                  <CircleDot className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                  <p className="text-sm text-foreground">{surprise}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Why Non-Committal Section */}
        <section id="non-committal" className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Why Mortgage Conversations Often Feel Non-Committal
            </h2>
            <div className="p-6 rounded-xl bg-muted/30 border">
              <p className="text-muted-foreground mb-4">
                Banks in Israel manage risk by avoiding early commitments. Because property values, currency exposure, and borrower documentation can change during the transaction period, banks refrain from issuing binding approvals before a contract is signed and an appraisal is complete.
              </p>
              <p className="text-muted-foreground mb-4">
                Loan officers may offer verbal assurances or indicative ranges, but they are careful not to guarantee terms that could later be amended. This cautious stance is not an attempt to frustrate buyers—it reflects regulatory requirements and the bank's need to hedge against market fluctuations.
              </p>
              <p className="text-foreground font-medium">
                As a result, mortgage discussions may feel vague until late in the process.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Interactions Section */}
        <section id="interactions" className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              How Mortgages Interact With Price, Timing, and Commitment
            </h2>
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-card border">
                <h3 className="font-semibold text-foreground mb-2">Uncertainty affects negotiation</h3>
                <p className="text-sm text-muted-foreground">
                  Buyers often negotiate price and sign a contract without knowing their final interest rate or loan amount; this can create emotional stress and requires trust that financing will be secured.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-card border">
                <h3 className="font-semibold text-foreground mb-2">Timing mismatches cause tension</h3>
                <p className="text-sm text-muted-foreground">
                  Because mortgage funds are disbursed according to a payment schedule, timing mismatches between bank approvals and contractual payment dates can cause tension.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-card border">
                <h3 className="font-semibold text-foreground mb-2">Mortgage size affects liquidity</h3>
                <p className="text-sm text-muted-foreground">
                  The size of the mortgage relative to the purchase price affects the buyer's liquidity and ability to commit to subsequent payments. This explains why sellers prioritise buyers who demonstrate financing capacity and why payments are structured in stages.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* BuyWise Section */}
        <section id="buywise" className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              How BuyWise Adds Mortgage Clarity
            </h2>
            <p className="text-muted-foreground mb-8">
              BuyWise helps international buyers navigate mortgage complexity by providing context rather than advice. By separating known factors from unknowns, BuyWise empowers users to anticipate uncertainty without feeling lost.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {buywiseHelps.map((help, index) => (
                <div key={index} className="p-5 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <help.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{help.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{help.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Closing Section */}
        <section id="closing" className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Calm Closing Reframe
            </h2>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
              <p className="text-lg text-foreground mb-4">
                Feeling uncertain about mortgages in Israel is normal.
              </p>
              <p className="text-muted-foreground mb-4">
                The system evolved differently from those in North America or Europe, and pre-approval does not carry the same weight. Once you understand that financing decisions follow the contract, that banks evaluate both you and the property, and that buyer status and currency exposure shape outcomes, the process becomes less mysterious.
              </p>
              <p className="text-muted-foreground mb-4">
                Mortgage opacity is not a sign of dysfunction—it is a feature of a risk-managed lending environment.
              </p>
              <p className="font-semibold text-foreground">
                With clarity about the system, you can approach conversations with banks and brokers calmly, recognizing that uncertainty is part of the path to ownership.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Bottom CTAs */}
        <section className="container py-12 border-t">
          <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-4">
              <Link
                to="/tools"
                className="p-6 rounded-xl bg-card border hover:border-primary/30 transition-colors group"
              >
                <Calculator className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  Mortgage Calculator
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Estimate monthly payments based on Israeli mortgage structures.
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                  Open Calculator <ArrowRight className="h-4 w-4" />
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
                  Explore our complete library of guides for international buyers.
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                  View All Guides <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link
                to="/guides/true-cost"
                className="p-6 rounded-xl bg-card border hover:border-primary/30 transition-colors group"
              >
                <Briefcase className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  True Cost Guide
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Understand all the costs beyond the listing price.
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                  Read Guide <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </Layout>
  );
}
