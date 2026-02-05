import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Scale, 
  BookOpen, 
  Clock, 
  ChevronRight,
  DollarSign,
  Calendar,
  Key,
  Shield,
  AlertTriangle,
  FileCheck,
  Landmark,
  CreditCard,
  Receipt,
  FileText,
  Layout,
  TrendingUp,
  Car,
  ClipboardCheck,
  Building,
  Home,
  Users,
  Plane,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Calculator,
  Lightbulb,
  FileSignature,
  HardHat,
  Search,
  BadgeCheck,
  Wrench
} from 'lucide-react';
import { Layout as PageLayout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'assumptions', label: 'Assumptions' },
  { id: 'new-construction', label: 'New Construction' },
  { id: 'resale', label: 'Resale' },
  { id: 'differences', label: 'Differences' },
  { id: 'buyer-status', label: 'Buyer Status' },
  { id: 'surprises', label: 'Surprises' },
  { id: 'commitments', label: 'Commitments' },
  { id: 'costs', label: 'Costs & Taxes' },
  { id: 'buywise', label: 'BuyWise' },
  { id: 'closing', label: 'Closing' },
];

const assumptions = [
  { icon: DollarSign, text: '"New construction is always cheaper"' },
  { icon: Calendar, text: '"Delivery dates are firm"' },
  { icon: Key, text: '"New means move-in ready"' },
  { icon: Shield, text: '"Quality is perfect in new builds"' },
  { icon: AlertTriangle, text: '"Resale homes have no surprises"' },
  { icon: FileCheck, text: '"Developer warranties cover everything"' },
  { icon: Landmark, text: '"Banks treat new and resale equally"' },
  { icon: CreditCard, text: '"Payment schedules are similar"' },
  { icon: Receipt, text: '"Taxes and fees are identical"' },
  { icon: FileText, text: '"Registration happens automatically"' },
  { icon: Clock, text: '"Resale transactions close faster"' },
  { icon: Layout, text: '"New projects come with fixed layouts"' },
  { icon: TrendingUp, text: '"Resale homes appreciate more slowly"' },
  { icon: Car, text: '"Parking and storage are standard in new builds"' },
  { icon: ClipboardCheck, text: '"Resale purchases involve less paperwork"' },
];

const structuralDifferences = [
  { title: 'Contract Structure', description: 'New construction contracts are standardized by developers with detailed technical specifications (mifrat) and statutory protections. Resale contracts are bespoke agreements negotiated between buyer and seller.', icon: FileSignature },
  { title: 'Payment Timing', description: 'New purchases involve staged payments over months or years tied to construction milestones. Resale transactions concentrate payments around signing and closing.', icon: CreditCard },
  { title: 'Risk Allocation', description: 'New builds carry construction and delivery risk, mitigated by bank guarantees. Resale risks are visible and can be assessed through inspections, but hidden liens may exist.', icon: Shield },
  { title: 'Information Certainty', description: 'Off-plan purchases rely on plans, renderings, and promises—some details undefined until permits are received. Resale buyers see the finished apartment before committing.', icon: Search },
  { title: 'Flexibility vs Predictability', description: 'New buyers may customize layouts and finishes within developer rules, but outcomes can shift. Resale buyers sacrifice customization for immediate clarity.', icon: Layout },
  { title: 'Registration Timeline', description: 'New builds may not be registered until after a housing company transfers rights to the Land Registry. Resale registrations typically complete soon after closing.', icon: FileText },
  { title: 'Post-Contract Obligations', description: 'New construction buyers must monitor bank guarantees, manage payments, select materials, and perform inspections. Resale buyers face fewer post-contract tasks.', icon: ClipboardCheck },
  { title: 'Amenities & Maintenance', description: 'New buildings often include elevators, parking, and modern common areas—but higher maintenance fees. Older buildings may lack amenities but have lower ongoing costs.', icon: Building },
];

const surprises = [
  { text: 'Assuming delivery dates are fixed', detail: 'Off-plan completion dates are aspirational; delays due to permits or construction are common.' },
  { text: 'Believing "new" means turn-key', detail: 'New apartments require finishing selections and may lack utilities until the occupancy certificate is obtained.' },
  { text: 'Thinking resale has no hidden issues', detail: 'Existing homes can have liens, building code violations, or pending municipal debts.' },
  { text: 'Expecting uniform protections', detail: 'Developer contracts have consumer laws, but enforcement and warranty periods vary; resale relies more on buyer diligence.' },
  { text: 'Confusing "price per meter" comparisons', detail: 'New and resale apartments measure space differently (gross vs net), and common areas distort comparisons.' },
  { text: 'Assuming financing is the same', detail: 'Mortgage terms, down payments, and documentation requirements can differ for new vs resale.' },
  { text: 'Believing registration is immediate', detail: 'In new projects, full registration may occur long after you move in.' },
  { text: 'Expecting identical tax treatments', detail: 'VAT often applies to developer sales, whereas resale deals may not; purchase tax rates vary.' },
  { text: 'Assuming amenities are included', detail: 'Parking, storage, and community facilities in new developments may incur extra cost.' },
  { text: 'Trusting renderings as reality', detail: 'Marketing materials may not reflect final finishes, layouts, or neighborhood development.' },
];

const buyerStatuses = [
  { title: 'Israeli Residents', icon: Home, description: 'Navigate both paths with greater familiarity. May access local financing and understand typical contract terms. For residents, new projects may offer promotions or lotteries.' },
  { title: 'New Olim', icon: Users, description: 'Might benefit from certain incentives on new projects, but still need to manage language and documentation hurdles.' },
  { title: 'Foreign Buyers Abroad', icon: Plane, description: 'Face stricter mortgage conditions and may need a local representative. Being overseas makes supervising construction choices harder.' },
  { title: 'Investors', icon: Building, description: 'Often view new projects for appreciation potential and flexible payment schedules. Resale may provide immediate rental income. Must consider purchase tax rates.' },
];

const buywiseFeatures = [
  { title: 'Distinguishes Listing Types', description: 'Clearly marks whether a listing is resale or off-plan so you know which path you\'re considering.', icon: Search },
  { title: 'Construction Stage Info', description: 'For new projects, highlights construction stage, estimated delivery period, and bank guarantee availability.', icon: HardHat },
  { title: 'Title & Registration Status', description: 'Surfaces title and registration status where possible, helping you understand legal certainty.', icon: FileText },
  { title: 'Buyer-Adjusted Estimates', description: 'Adjusts cost estimates based on your buyer profile, flagging whether VAT or other taxes apply.', icon: Calculator },
];

export default function NewVsResaleGuide() {
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
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-background">
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-12 md:py-16">
            {/* Back Button */}
            <Link to="/guides">
              <Button variant="ghost" className="gap-2 -ml-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Guides
              </Button>
            </Link>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4"><Scale className="h-3 w-3 mr-1" />Essential Guide</Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">New Construction vs Resale in <span className="text-primary">Israel</span><span className="block mt-2">What's Really Different</span></h1>
              <p className="text-lg text-muted-foreground mb-6">Distinct paths with their own timelines, obligations, and uncertainties</p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />11 sections</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />~18 min read</span>
                <span>Updated January 2025</span>
              </div>
            </motion.div>
          </div>
        </section>

        <motion.nav initial={{ opacity: 0, y: -20 }} animate={{ opacity: showStickyNav ? 1 : 0, y: showStickyNav ? 0 : -20 }} className={cn("fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b transition-all", !showStickyNav && "pointer-events-none")}>
          <div className="container py-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {navSections.map((section) => (
                <button key={section.id} onClick={() => scrollToSection(section.id)} className={cn("px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors", activeSection === section.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>{section.label}</button>
              ))}
            </div>
          </div>
        </motion.nav>

        <div className="container py-12">
          <div className="max-w-4xl mx-auto space-y-16">
            <section id="overview" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-8">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-xl bg-muted/50 border"><p className="text-sm text-muted-foreground">Choosing between new and resale feels like stepping into two different worlds</p></div>
                  <div className="p-5 rounded-xl bg-muted/50 border"><p className="text-sm text-muted-foreground">"New" and "resale" involve distinct legal structures, payment schedules, and information certainty</p></div>
                  <div className="p-5 rounded-xl bg-muted/50 border"><p className="text-sm text-muted-foreground">In Israel these differences are sharper than many foreigners expect</p></div>
                </div>
                <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 text-center">
                  <p className="text-lg font-medium text-foreground mb-3">Choosing between a new development and a resale property in Israel often feels like stepping into two different worlds.</p>
                  <p className="text-muted-foreground mb-4">International buyers hear mixed stories: glossy brochures promise modern comforts, while friends rave about character-filled second-hand flats. In truth, "new" and "resale" involve distinct legal structures, payment schedules, and information certainty.</p>
                  <p className="font-semibold text-primary">Use this guide to understand which path fits your situation.</p>
                </div>
                <div className="p-6 rounded-xl bg-card border-l-4 border-l-primary">
                  <p className="text-lg font-medium text-foreground">The choice between buying a new development and buying a resale property in Israel feels confusing to internationals because each path operates under different contracts, timelines, and risk allocations that do not match familiar US or UK norms.</p>
                </div>
              </motion.div>
            </section>

            <section id="assumptions" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div><h2 className="text-2xl font-bold text-foreground mb-2">Common Assumptions About New vs Resale</h2><p className="text-muted-foreground">Many international buyers approach the Israeli market with preconceived ideas about "new" and "resale" homes.</p></div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {assumptions.map((a, i) => (<div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-card border hover:border-primary/20 transition-colors"><a.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" /><p className="text-sm text-muted-foreground">{a.text}</p></div>))}
                </div>
              </motion.div>
            </section>

            <section id="new-construction" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div><h2 className="text-2xl font-bold text-foreground mb-2">What "New Construction" Means in Israel</h2><p className="text-muted-foreground">"New construction" typically refers to purchasing an apartment off-plan—before or during construction.</p></div>
                <div className="p-6 rounded-xl bg-muted/30 border space-y-4">
                  {[{ icon: HardHat, title: 'Developer-Issued Contract', desc: 'Buyers sign a standardized contract that includes a technical specification (mifrat) detailing promised finishes and fixtures, as required by law.' },
                    { icon: CreditCard, title: 'Staged Payments', desc: 'Payments are made in stages tied to construction milestones or time intervals, not concentrated at closing.' },
                    { icon: Shield, title: 'Bank Guarantee Protection', desc: 'Once more than a small portion of the price is paid, the developer must provide a bank guarantee to protect the buyer\'s funds.' },
                    { icon: Layout, title: 'Customization Options', desc: 'Buyers may have options to choose materials or request design changes during construction, within developer rules.' },
                    { icon: FileCheck, title: 'Tofes 4 Required', desc: 'Possession is only possible after the project receives a certificate of occupancy (Tofes 4).' },
                    { icon: Clock, title: 'Delayed Registration', desc: 'Ownership registration can occur months or years after key handover, first recorded in a housing company ledger before migrating to the Land Registry.' }
                  ].map((item, i) => (<div key={i} className="flex items-start gap-3"><item.icon className="h-5 w-5 text-primary shrink-0 mt-1" /><div><p className="font-medium text-foreground">{item.title}</p><p className="text-sm text-muted-foreground">{item.desc}</p></div></div>))}
                </div>
              </motion.div>
            </section>

            <section id="resale" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div><h2 className="text-2xl font-bold text-foreground mb-2">What "Resale" Means in Israel</h2><p className="text-muted-foreground">"Resale" refers to purchasing an existing apartment from a private seller.</p></div>
                <div className="p-6 rounded-xl bg-muted/30 border space-y-4">
                  {[{ icon: Search, title: 'Physical Inspection Possible', desc: 'The property physically exists—buyers can inspect its condition and layout before committing.' },
                    { icon: FileSignature, title: 'Bespoke Contracts', desc: 'Contracts are negotiated between buyer and seller with the help of their lawyers, not standardized by developers.' },
                    { icon: CreditCard, title: 'Concentrated Payments', desc: 'Payment is typically split between a down payment at contract signing and a final payment at closing.' },
                    { icon: BadgeCheck, title: 'Less Uncertainty', desc: 'Less uncertainty about the physical product or the surrounding neighborhood since it\'s already built.' },
                    { icon: FileText, title: 'Due Diligence Focus', desc: 'Legal checks focus on verifying title, checking for liens, and ensuring municipal taxes and maintenance fees are current.' },
                    { icon: CheckCircle, title: 'Faster Registration', desc: 'Registration of ownership in the Land Registry usually occurs shortly after closing, barring any encumbrances.' }
                  ].map((item, i) => (<div key={i} className="flex items-start gap-3"><item.icon className="h-5 w-5 text-primary shrink-0 mt-1" /><div><p className="font-medium text-foreground">{item.title}</p><p className="text-sm text-muted-foreground">{item.desc}</p></div></div>))}
                </div>
              </motion.div>
            </section>

            <section id="differences" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div><h2 className="text-2xl font-bold text-foreground mb-2">The Structural Differences That Matter</h2><p className="text-muted-foreground">These are not minor variations—they fundamentally shape your experience and obligations.</p></div>
                <div className="grid md:grid-cols-2 gap-4">
                  {structuralDifferences.map((d, i) => (<div key={i} className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors"><div className="flex items-start gap-3"><d.icon className="h-5 w-5 text-primary shrink-0 mt-1" /><div><h3 className="font-semibold text-foreground mb-1">{d.title}</h3><p className="text-sm text-muted-foreground">{d.description}</p></div></div></div>))}
                </div>
              </motion.div>
            </section>

            <section id="buyer-status" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div><h2 className="text-2xl font-bold text-foreground mb-2">Buyer Status Reality Check</h2><p className="text-muted-foreground">The experience differs substantially based on who you are.</p></div>
                <div className="grid md:grid-cols-2 gap-4">
                  {buyerStatuses.map((s, i) => (<div key={i} className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors"><div className="flex items-start gap-3"><div className="p-2 rounded-lg bg-primary/10"><s.icon className="h-5 w-5 text-primary" /></div><div><h3 className="font-semibold text-foreground mb-1">{s.title}</h3><p className="text-sm text-muted-foreground">{s.description}</p></div></div></div>))}
                </div>
              </motion.div>
            </section>

            <section id="surprises" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div><h2 className="text-2xl font-bold text-foreground mb-2">Where International Buyers Get Surprised</h2><p className="text-muted-foreground">These common surprises catch buyers off guard regardless of which path they choose.</p></div>
                <div className="space-y-3">
                  {surprises.map((s, i) => (<div key={i} className="p-4 rounded-xl bg-card border hover:border-primary/20 transition-colors"><div className="flex items-start gap-3"><AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" /><div><p className="font-medium text-foreground">{s.text}</p><p className="text-sm text-muted-foreground mt-1">{s.detail}</p></div></div></div>))}
                </div>
              </motion.div>
            </section>

            <section id="commitments" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div><h2 className="text-2xl font-bold text-foreground mb-2">When Commitments and Risks Appear</h2><p className="text-muted-foreground">Understanding when you're committed—and exposed—helps you prepare for each path.</p></div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-muted/30 border">
                    <div className="flex items-center gap-2 mb-4"><HardHat className="h-5 w-5 text-primary" /><h3 className="font-semibold text-foreground">New Construction</h3></div>
                    <div className="space-y-3">
                      {['Commitment begins at contract signing with initial payment', 'Significant payments due over construction milestones', 'Risk exists until construction complete, Tofes 4 issued, and property registered', 'Must track bank guarantees and ensure each payment is secured', 'Developer can pass some risks (like inflation-linked adjustments) to buyer'].map((t, i) => (<div key={i} className="flex items-start gap-2"><ArrowRight className="h-4 w-4 text-primary shrink-0 mt-1" /><p className="text-sm text-muted-foreground">{t}</p></div>))}
                    </div>
                  </div>
                  <div className="p-6 rounded-xl bg-muted/30 border">
                    <div className="flex items-center gap-2 mb-4"><Home className="h-5 w-5 text-primary" /><h3 className="font-semibold text-foreground">Resale</h3></div>
                    <div className="space-y-3">
                      {['Commitment starts at contract signing with down payment and firm closing date', 'Risk centers on legal state (liens, encumbrances) and physical condition', 'These risks addressed through due diligence and inspections', 'After closing, risk mostly shifts to you as owner', 'Registration usually completes relatively quickly after closing'].map((t, i) => (<div key={i} className="flex items-start gap-2"><ArrowRight className="h-4 w-4 text-primary shrink-0 mt-1" /><p className="text-sm text-muted-foreground">{t}</p></div>))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>

            <section id="costs" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div><h2 className="text-2xl font-bold text-foreground mb-2">How This Choice Affects Costs, Taxes, and Financing</h2><p className="text-muted-foreground">The choice between new and resale affects several cost components in ways that may surprise you.</p></div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-5 rounded-xl bg-card border"><Receipt className="h-5 w-5 text-primary mb-3" /><h3 className="font-semibold text-foreground mb-1">VAT Differences</h3><p className="text-sm text-muted-foreground">New construction prices often include VAT, while resale transactions typically do not.</p></div>
                  <div className="p-5 rounded-xl bg-card border"><TrendingUp className="h-5 w-5 text-primary mb-3" /><h3 className="font-semibold text-foreground mb-1">Index Linkage</h3><p className="text-sm text-muted-foreground">Developer contracts link payments to the building cost index, which can lead to price adjustments during construction.</p></div>
                  <div className="p-5 rounded-xl bg-card border"><Landmark className="h-5 w-5 text-primary mb-3" /><h3 className="font-semibold text-foreground mb-1">Financing Conditions</h3><p className="text-sm text-muted-foreground">Banks may treat off-plan as higher risk, require larger down payments, or limit loan amounts until construction progresses.</p></div>
                  <div className="p-5 rounded-xl bg-card border"><div className="flex items-center gap-2 mb-3"><DollarSign className="h-5 w-5 text-primary" /><Badge variant="outline" className="text-xs">VARIES</Badge></div><h3 className="font-semibold text-foreground mb-1">Purchase Tax Rates</h3><p className="text-sm text-muted-foreground">Rates vary by buyer status and whether the property is new or second-hand.</p></div>
                  <div className="p-5 rounded-xl bg-card border"><Building className="h-5 w-5 text-primary mb-3" /><h3 className="font-semibold text-foreground mb-1">Ongoing Costs</h3><p className="text-sm text-muted-foreground">Maintenance fees and HOA dues can be higher in new buildings with extensive amenities.</p></div>
                  <div className="p-5 rounded-xl bg-card border"><Wrench className="h-5 w-5 text-primary mb-3" /><h3 className="font-semibold text-foreground mb-1">Additional Expenses</h3><p className="text-sm text-muted-foreground">Resale buyers may face renovation costs, while new buyers may incur finishing expenses not in the spec.</p></div>
                </div>
              </motion.div>
            </section>

            <section id="buywise" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div><h2 className="text-2xl font-bold text-foreground mb-2">How BuyWise Adds Clarity</h2><p className="text-muted-foreground">BuyWise helps you understand differences without suggesting one option is superior.</p></div>
                <div className="grid md:grid-cols-2 gap-4">
                  {buywiseFeatures.map((f, i) => (<div key={i} className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors"><div className="flex items-start gap-3"><div className="p-2 rounded-lg bg-primary/10"><f.icon className="h-5 w-5 text-primary" /></div><div><h3 className="font-semibold text-foreground mb-1">{f.title}</h3><p className="text-sm text-muted-foreground">{f.description}</p></div></div></div>))}
                </div>
              </motion.div>
            </section>

            <section id="closing" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
                  <Lightbulb className="h-8 w-8 text-primary mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-4">Calm Reframe</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>New construction and resale properties in Israel are not two versions of the same process; they are distinct paths with their own timelines, obligations, and uncertainties.</p>
                    <p>Once you understand that off-plan purchases involve staged commitments, evolving specifications, and delayed registration, while resale purchases offer immediate physical certainty but still require thorough legal checks, the choice becomes a matter of personal fit rather than guesswork.</p>
                    <p className="font-medium text-foreground">Neither option is inherently better; each carries its own set of expectations and adjustments. With clarity and context, you can approach either path with calm confidence instead of confusion.</p>
                  </div>
                </div>
              </motion.div>
            </section>

            <section className="pt-8 border-t">
              <div className="grid md:grid-cols-3 gap-4">
                <Link to="/tools" className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors group"><Calculator className="h-5 w-5 text-primary mb-3" /><h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">True Cost Calculator</h3><p className="text-sm text-muted-foreground">Estimate total costs for new or resale purchases</p><ChevronRight className="h-4 w-4 text-primary mt-2" /></Link>
                <Link to="/guides" className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors group"><BookOpen className="h-5 w-5 text-primary mb-3" /><h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">More Guides</h3><p className="text-sm text-muted-foreground">Explore our complete guide collection</p><ChevronRight className="h-4 w-4 text-primary mt-2" /></Link>
                <Link to="/guides/mortgages" className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors group"><Landmark className="h-5 w-5 text-primary mb-3" /><h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">Mortgages Guide</h3><p className="text-sm text-muted-foreground">Understand financing for either path</p><ChevronRight className="h-4 w-4 text-primary mt-2" /></Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
