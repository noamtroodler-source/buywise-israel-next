import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { 
  ArrowLeft, MapPin, Clock, ChevronDown, ChevronUp,
  Gift, Landmark, FileText, Calendar, Heart,
  CheckCircle2, AlertTriangle, Calculator, Plane,
  Users, Building2, Globe, Shield, BadgeCheck, BookOpen
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GlossaryTooltip } from '@/components/shared/GlossaryTooltip';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';

interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

function CollapsibleSection({ section, isOpen, onToggle }: { 
  section: Section; 
  isOpen: boolean; 
  onToggle: () => void;
}) {
  const Icon = section.icon;
  
  return (
    <div id={section.id} className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <span className="font-semibold text-foreground">{section.title}</span>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>
      
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-6 bg-background border-t border-border prose prose-sm max-w-none"
        >
          {section.content}
        </motion.div>
      )}
    </div>
  );
}

export default function OlehBuyerGuide() {
  useTrackContentVisit('guide');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['timeline']));
  const [readSections, setReadSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    const newOpen = new Set(openSections);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
      setReadSections(prev => new Set(prev).add(id));
    }
    setOpenSections(newOpen);
  };

  // Back button is already at the top of the guide - see render below
  const sections: Section[] = [
    {
      id: 'timeline',
      title: '1. Aliyah-to-Purchase Timeline',
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <p>
            Your property purchase journey should align with your Aliyah timeline. Here's how the 
            stages typically unfold and what to prioritize at each point.
          </p>
          
          <h4 className="font-semibold text-primary">Phase 1: Pre-Aliyah (6-12 months before)</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Research areas:</strong> Use our city guides to understand neighborhoods while still abroad</li>
            <li><strong>Open Israeli bank account:</strong> Some banks allow this before arrival—ask your Aliyah organization</li>
            <li><strong>Gather documents:</strong> Tax returns, bank statements, employment records from your home country</li>
            <li><strong>Don't rush to buy:</strong> Wait until you understand where you want to live</li>
          </ul>

          <h4 className="font-semibold text-primary mt-4">Phase 2: First Year (0-12 months)</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Rent first:</strong> Get to know different areas before committing</li>
            <li><strong>Establish income:</strong> Banks want to see Israeli income history</li>
            <li><strong>Build credit presence:</strong> Use your Israeli bank account actively</li>
            <li><strong>Explore casually:</strong> Attend open houses, learn the market rhythm</li>
          </ul>

          <h4 className="font-semibold text-primary mt-4">Phase 3: Year 1-3 (Ideal buying window)</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Stable income established:</strong> Banks have 12+ months of data</li>
            <li><strong>Market understanding:</strong> You know what you want and where</li>
            <li><strong>Still eligible:</strong> Full Oleh tax benefits apply (7-year window)</li>
            <li><strong>Language improved:</strong> Can navigate more independently</li>
          </ul>

          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>💡 Reality Check:</strong> Most successful Oleh buyers purchase between year 1-3. 
              The first year is for learning; years 7+ you lose tax benefits. Find your window.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'tax-benefits',
      title: '2. Oleh Tax Benefits Explained',
      icon: Gift,
      content: (
        <div className="space-y-4">
          <p>
            As an Oleh, you receive significant tax advantages. Here's exactly what you get and 
            how to prove your eligibility.
          </p>
          
          <h4 className="font-semibold">The Oleh Purchase Tax Advantage:</h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">First ~₪1,978,745</p>
                <p className="text-sm text-muted-foreground">Tax rate: 0%</p>
              </div>
              <span className="text-primary font-bold">₪0</span>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">₪1,978,745 – ₪6,055,070</p>
                <p className="text-sm text-muted-foreground">Tax rate: 0.5% (vs 3.5-5% for non-Olim)</p>
              </div>
              <span className="text-success font-bold">Special Rate</span>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">Above ₪6,055,070</p>
                <p className="text-sm text-muted-foreground">Standard rates apply</p>
              </div>
              <span className="text-muted-foreground font-bold">8-10%</span>
            </div>
          </div>

          <h4 className="font-semibold mt-4">Concrete Example:</h4>
          <div className="bg-success/10 p-4 rounded-lg border border-success/20">
            <p className="font-medium mb-2">For a ₪2,500,000 apartment:</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Oleh pays:</p>
                <p className="text-2xl font-bold text-success">~₪2,600</p>
              </div>
              <div>
                <p className="text-muted-foreground">First-time Israeli pays:</p>
                <p className="text-2xl font-bold text-foreground">~₪25,000</p>
              </div>
            </div>
            <p className="text-sm text-success mt-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <strong>Your savings: ~₪22,400</strong>
            </p>
          </div>

          <h4 className="font-semibold mt-4">How to Prove Oleh Status:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Teudat Oleh:</strong> Your official Oleh certificate from the Ministry of Absorption</li>
            <li><strong>Teudat Zehut:</strong> Israeli ID showing Aliyah date</li>
            <li><strong>Declaration form:</strong> Signed statement that this is your first Israeli property</li>
          </ul>

          <div className="bg-warning/10 p-4 rounded-lg border border-warning/20 mt-4">
            <p className="text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-foreground mt-0.5 flex-shrink-0" />
              <span><strong>7-Year Window:</strong> Oleh benefits expire 7 years after your Aliyah date. 
              If you made Aliyah in 2020, benefits end in 2027. Plan accordingly.</span>
            </p>
          </div>

          <Link to="/tools?tool=purchasetax">
            <Button variant="outline" size="sm" className="gap-2 mt-4">
              <Calculator className="h-4 w-4" />
              Calculate Your Oleh Tax Savings
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: 'mortgage-realities',
      title: '3. Oleh Mortgage Realities',
      icon: Landmark,
      content: (
        <div className="space-y-4">
          <p>
            Banks treat Olim differently than established Israelis. Here's what to actually expect—not 
            the marketing materials, but the reality.
          </p>

          <h4 className="font-semibold">What Banks Look For:</h4>
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-card border">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="font-medium">Israeli Income (Ideal)</p>
                  <p className="text-sm text-muted-foreground">12+ months of pay slips from an Israeli employer is gold. Banks trust this most.</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-card border">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Foreign Income (Discounted)</p>
                  <p className="text-sm text-muted-foreground">Banks typically discount foreign income by 20-30%. If you earn $10,000/month abroad, they may calculate as if you earn $7,000-8,000.</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-card border">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Remote Work for Foreign Company</p>
                  <p className="text-sm text-muted-foreground">Treated somewhere between Israeli and foreign income. Employment contract and salary stability matter.</p>
                </div>
              </div>
            </div>
          </div>

          <h4 className="font-semibold mt-4">Documentation You'll Need:</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium">From Your Home Country:</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• 2-3 years tax returns</li>
                <li>• 6-12 months bank statements</li>
                <li>• Credit report (if available)</li>
                <li>• Employment verification letter</li>
              </ul>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium">From Israel:</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• Teudat Zehut (ID)</li>
                <li>• Teudat Oleh</li>
                <li>• Israeli bank statements</li>
                <li>• Israeli employment contract (if any)</li>
              </ul>
            </div>
          </div>

          <h4 className="font-semibold mt-4">The Pre-Approval Reality:</h4>
          <div className="bg-warning/10 p-4 rounded-lg border border-warning/20">
            <p className="text-sm">
              <strong>Expect 4-8 weeks</strong> for pre-approval as an Oleh vs 2-3 weeks for established Israelis. 
              Banks require more verification of foreign documents. Start the process early—before you find 
              your dream apartment.
            </p>
          </div>

          <Link to="/tools?tool=mortgage">
            <Button variant="outline" size="sm" className="gap-2 mt-4">
              <Calculator className="h-4 w-4" />
              Mortgage Calculator
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: 'common-mistakes',
      title: '4. Mistakes Olim Make (And How to Avoid Them)',
      icon: AlertTriangle,
      content: (
        <div className="space-y-4">
          <p>
            After helping many Olim through the process, these are the patterns we see repeatedly. 
            Learn from others' experiences.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <h4 className="font-semibold text-destructive flex items-center gap-2">
                <span className="text-lg">❌</span> Buying Too Fast
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Many Olim buy within 6 months, before understanding neighborhood dynamics. 
                What feels "Anglo-friendly" on paper may not match your lifestyle.
              </p>
              <p className="text-sm font-medium text-primary mt-2">
                ✓ Fix: Rent in 2 different areas before buying. It's worth the extra year.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <h4 className="font-semibold text-destructive flex items-center gap-2">
                <span className="text-lg">❌</span> Assuming US/UK Rules Apply
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                "I'll get pre-approved, then make an offer with a financing contingency." 
                This isn't how Israel works. You commit before the mortgage is final.
              </p>
              <p className="text-sm font-medium text-primary mt-2">
                ✓ Fix: Read our Mortgage Guide before starting. Understand the sequence.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <h4 className="font-semibold text-destructive flex items-center gap-2">
                <span className="text-lg">❌</span> Letting Benefits Expire
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Some Olim wait until year 6-7 to start looking, then feel rushed as the 
                tax benefit window closes.
              </p>
              <p className="text-sm font-medium text-primary mt-2">
                ✓ Fix: Know your expiry date. Start serious searching by year 4-5 latest.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <h4 className="font-semibold text-destructive flex items-center gap-2">
                <span className="text-lg">❌</span> Not Leveraging the Anglo Network
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Going it alone when there are English-speaking lawyers, mortgage advisors, 
                and agents who specialize in Olim.
              </p>
              <p className="text-sm font-medium text-primary mt-2">
                ✓ Fix: Use the Anglo network. It's not a crutch—it's a resource.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <h4 className="font-semibold text-destructive flex items-center gap-2">
                <span className="text-lg">❌</span> Selling Foreign Property First
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Selling your property abroad before securing Israeli financing, then 
                being stuck with cash but no loan approval.
              </p>
              <p className="text-sm font-medium text-primary mt-2">
                ✓ Fix: Get mortgage pre-approval first. Coordinate the timing with your lawyer.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'anglo-areas',
      title: '5. Anglo Communities Deep Dive',
      icon: MapPin,
      content: (
        <div className="space-y-4">
          <p>
            Beyond "high Anglo presence," here's what each major Oleh destination actually offers 
            and who it's best suited for.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-card border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-foreground">Ra'anana</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    The "American suburb." Excellent Anglo infrastructure—English-speaking doctors, 
                    dentists, schools. Modern apartments, safe, clean streets. Excellent for families 
                    wanting a soft landing.
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Avg Price</p>
                  <p className="font-bold text-primary">₪3.5-5M</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Families</span>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Soft Landing</span>
                <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">$$$</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-foreground">Modi'in</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Planned city, family-oriented, better value than Ra'anana. Growing Anglo community 
                    but more integrated than Ra'anana. Good schools, modern infrastructure. Between 
                    Tel Aviv and Jerusalem.
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Avg Price</p>
                  <p className="font-bold text-primary">₪2.5-4M</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Families</span>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Value</span>
                <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">$$</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-foreground">Jerusalem (Katamon, Baka, German Colony)</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Historic, walkable, diverse Anglo community (religious and secular). Urban feel 
                    with neighborhood character. Older buildings often. Cultural richness, but can 
                    feel intense.
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Avg Price</p>
                  <p className="font-bold text-primary">₪3-6M</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Singles</span>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Couples</span>
                <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">$$$</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-foreground">Beit Shemesh (RBS)</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Strong religious Anglo community. Separate neighborhoods for different observance 
                    levels. Best prices for Anglo communities. Growing infrastructure. Can feel 
                    insular.
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Avg Price</p>
                  <p className="font-bold text-primary">₪2-3.5M</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Religious</span>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Large Families</span>
                <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">$</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-foreground">Netanya</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Beach city with French and Anglo communities. More affordable coastal option. 
                    Mixed quality by neighborhood—beachfront expensive, eastern areas cheaper. 
                    Growing tech presence.
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Avg Price</p>
                  <p className="font-bold text-primary">₪1.8-3.5M</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Beach</span>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Retirees</span>
                <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">$$</span>
              </div>
            </div>
          </div>

          <Link to="/areas">
            <Button variant="outline" size="sm" className="gap-2 mt-4">
              <MapPin className="h-4 w-4" />
              Explore All Cities with Market Data
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: 'documents',
      title: '6. Oleh-Specific Document Checklist',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>
            Beyond standard documents, Olim need specific paperwork. Here's everything organized 
            by when you'll need it.
          </p>

          <h4 className="font-semibold">For Mortgage Application:</h4>
          <div className="bg-muted/30 p-4 rounded-lg">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span><strong>Teudat Oleh</strong> — Your Aliyah certificate from Ministry of Absorption</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span><strong>Teudat Zehut</strong> — Israeli ID card</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span><strong>Passport</strong> — Foreign passport showing entry stamps</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span><strong>Foreign tax returns</strong> — Last 2-3 years, translated to Hebrew by certified translator</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span><strong>Foreign bank statements</strong> — 6-12 months showing savings source</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span><strong>Employment verification</strong> — From Israeli or foreign employer</span>
              </li>
            </ul>
          </div>

          <h4 className="font-semibold mt-4">For Tax Authority (Oleh Benefits):</h4>
          <div className="bg-muted/30 p-4 rounded-lg">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span><strong>Teudat Oleh copy</strong> — Showing Aliyah date within 7 years</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span><strong>Declaration form</strong> — Signed statement that you own no other Israeli property</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span><strong>Spouse documentation</strong> — If married, spouse's status also matters</span>
              </li>
            </ul>
          </div>

          <h4 className="font-semibold mt-4">Translation Requirements:</h4>
          <div className="bg-primary/5 p-4 rounded-lg">
            <p className="text-sm">
              Foreign documents must be translated by a certified translator (מתרגם מוסמך). 
              Banks and the Tax Authority won't accept unofficial translations. 
              Budget ₪200-500 per document for translation.
            </p>
          </div>

          <Link to="/tools?tool=documents">
            <Button variant="outline" size="sm" className="gap-2 mt-4">
              <FileText className="h-4 w-4" />
              Full Document Checklist Tool
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const progress = (readSections.size / sections.length) * 100;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container py-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Dual Navigation */}
            <DualNavigation
              parentLabel="All Guides"
              parentPath="/guides"
            />

            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Plane className="h-4 w-4" />
                <span>Oleh Guide</span>
                <span>•</span>
                <Clock className="h-4 w-4" />
                <span>22 min read</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Oleh First-Time Buyer Guide
              </h1>
              
              <p className="text-lg text-muted-foreground">
                From Aliyah to apartment: timeline, tax benefits, mortgage realities, and the 
                mistakes other Olim have made so you don't have to.
              </p>

              {/* Progress */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Reading progress</span>
                  <span className="font-medium">{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>

            {/* Quick Stats - Oleh-specific */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-success/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-success">7 yrs</div>
                <div className="text-xs text-muted-foreground">Tax benefit window</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">0.5%</div>
                <div className="text-xs text-muted-foreground">Special Oleh tax rate</div>
              </div>
              <div className="bg-warning/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-warning-foreground">75%</div>
                <div className="text-xs text-muted-foreground">Max LTV first home</div>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-foreground">1-3 yrs</div>
                <div className="text-xs text-muted-foreground">Ideal buy window</div>
              </div>
            </div>

            {/* Reality Check Box */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">The Oleh Reality</h3>
                  <p className="text-sm text-muted-foreground">
                    You have significant advantages: lower taxes, a 7-year benefit window, and often 
                    access to Anglo-friendly professionals. But you also face challenges: building 
                    Israeli credit, proving foreign income, and learning a new system. This guide 
                    addresses both sides.
                  </p>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {sections.map((section) => (
                <CollapsibleSection
                  key={section.id}
                  section={section}
                  isOpen={openSections.has(section.id)}
                  onToggle={() => toggleSection(section.id)}
                />
              ))}
            </div>

            {/* Related Guides */}
            <div className="border-t border-border pt-8 mt-8">
              <h3 className="font-semibold text-foreground mb-4">Continue Learning</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link to="/guides/mortgages" className="p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors">
                  <h4 className="font-medium text-foreground">Mortgage Guide</h4>
                  <p className="text-sm text-muted-foreground mt-1">Deep dive into Israeli financing</p>
                </Link>
                <Link to="/guides/purchase-tax" className="p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors">
                  <h4 className="font-medium text-foreground">Purchase Tax Guide</h4>
                  <p className="text-sm text-muted-foreground mt-1">Understand your tax obligations</p>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
