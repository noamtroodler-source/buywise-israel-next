import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Clock, ChevronDown, ChevronUp,
  Gift, Landmark, FileText, Calendar, Heart,
  CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GlossaryTooltip } from '@/components/shared/GlossaryTooltip';

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
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['benefits']));
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

  const sections: Section[] = [
    {
      id: 'benefits',
      title: '1. Special Benefits for Olim',
      icon: Gift,
      content: (
        <div className="space-y-4">
          <p>
            As a new immigrant (Oleh Chadash), you're entitled to significant benefits when purchasing 
            your first home in Israel. These benefits can save you tens of thousands of shekels.
          </p>
          <h4 className="font-semibold text-success">Tax Benefits:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Reduced <GlossaryTooltip term="מס רכישה">Purchase Tax</GlossaryTooltip>:</strong> 
              As a first-time buyer, you pay 0% on the first ~1.9M ₪, with reduced rates after
            </li>
            <li>
              <strong>Extended Eligibility:</strong> You're considered a "first-time buyer" for 7 years 
              after making Aliyah, even if you owned property abroad
            </li>
            <li>
              <strong>No Capital Gains on Foreign Sale:</strong> If you sell property abroad to buy in 
              Israel, certain exemptions may apply
            </li>
          </ul>
          <div className="bg-success/10 p-4 rounded-lg border border-success/20">
            <p className="text-sm flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span><strong>Potential Savings:</strong> An Oleh buying a 2.5M ₪ property pays approximately 
              ₪17,000 in purchase tax, vs. ₪200,000+ for an investment buyer.</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'mortgage',
      title: '2. Mortgage Considerations for Olim',
      icon: Landmark,
      content: (
        <div className="space-y-4">
          <p>
            Getting a mortgage as a new Oleh has unique considerations. Banks have specific requirements 
            and may offer special programs.
          </p>
          <h4 className="font-semibold">LTV (Loan-to-Value) Limits:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>First property (resident):</strong> Up to 75% LTV</li>
            <li><strong>First 10 years after Aliyah:</strong> Some leniency on documentation</li>
            <li><strong>Foreign income:</strong> Banks accept income from abroad, but may discount it 20-30%</li>
          </ul>
          <h4 className="font-semibold mt-4">Documentation Challenges:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>Credit history from abroad may not transfer</li>
            <li>Need to establish Israeli bank account and credit history</li>
            <li>Employment contracts or business documentation required</li>
            <li>Tax returns from previous country helpful</li>
          </ul>
          <div className="bg-warning/10 p-4 rounded-lg border border-warning/20 mt-4">
            <p className="text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-foreground mt-0.5 flex-shrink-0" />
              <span>Start the mortgage pre-approval process early – it often takes longer for Olim due 
              to additional documentation requirements.</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'timing',
      title: '3. When to Buy After Aliyah',
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <p>
            While there's pressure to buy quickly, timing your purchase strategically can save money 
            and reduce stress.
          </p>
          <h4 className="font-semibold">Recommended Timeline:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>First 6-12 months:</strong> Rent and explore. Get to know different areas, 
              understand the market, establish income
            </li>
            <li>
              <strong>Year 1-2:</strong> Ideal time to start seriously looking. You'll have Israeli 
              income history and better market understanding
            </li>
            <li>
              <strong>Years 2-7:</strong> Still benefit from first-time buyer status
            </li>
          </ul>
          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>💡 Pro Tip:</strong> Don't rush! The first-time buyer tax benefits last 7 years. 
              Use the first year to truly understand where you want to live.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'documents',
      title: '4. Essential Documents for Olim',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold">Documents from Your Previous Country:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Bank statements (6-12 months)</li>
            <li>Tax returns (2-3 years)</li>
            <li>Employment verification / pay stubs</li>
            <li>Credit report (if available)</li>
            <li>Proof of funds / savings</li>
          </ul>
          <h4 className="font-semibold mt-4">Israeli Documents Needed:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Teudat Zehut (ID card)</li>
            <li>Teudat Oleh (Oleh certificate)</li>
            <li>Israeli bank account statements</li>
            <li>Employment contract (if employed in Israel)</li>
            <li>Rental history in Israel</li>
          </ul>
          <Link to="/tools?tool=documents">
            <Button variant="outline" size="sm" className="gap-2 mt-4">
              <FileText className="h-4 w-4" />
              View Full Document Checklist
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: 'neighborhoods',
      title: '5. Popular Areas for Anglo Olim',
      icon: Heart,
      content: (
        <div className="space-y-4">
          <p>
            Certain areas have established English-speaking communities, making integration easier:
          </p>
          <h4 className="font-semibold">High Anglo Presence:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Ra'anana:</strong> Large Anglo community, excellent schools, suburban feel</li>
            <li><strong>Modi'in:</strong> Planned city, family-friendly, good value</li>
            <li><strong>Beit Shemesh (RBS):</strong> Strong religious Anglo community</li>
            <li><strong>Jerusalem (Katamon, Baka):</strong> Historic, central, diverse community</li>
            <li><strong>Netanya:</strong> Coastal living, more affordable</li>
          </ul>
          <h4 className="font-semibold mt-4">Growing Communities:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Tel Aviv suburbs:</strong> Herzliya, Kfar Saba, Hod HaSharon</li>
            <li><strong>Gush Etzion:</strong> For religious families seeking community</li>
          </ul>
          <Link to="/areas">
            <Button variant="outline" size="sm" className="gap-2 mt-4">
              <MapPin className="h-4 w-4" />
              Explore All Areas
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
            {/* Back Button */}
            <Link to="/guides">
              <Button variant="ghost" className="gap-2 -ml-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Guides
              </Button>
            </Link>

            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Oleh Guide</span>
                <span>•</span>
                <Clock className="h-4 w-4" />
                <span>20 min read</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                <span className="text-primary">Oleh</span> First-Time Buyer Guide
              </h1>
              
              <p className="text-lg text-muted-foreground">
                Special considerations, benefits, and step-by-step guidance for new immigrants 
                buying their first home in Israel.
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

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-success/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-success">7 yrs</div>
                <div className="text-xs text-muted-foreground">Tax benefit window</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">75%</div>
                <div className="text-xs text-muted-foreground">Max LTV for first home</div>
              </div>
              <div className="bg-warning/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-warning-foreground">0%</div>
                <div className="text-xs text-muted-foreground">Tax on first ~1.9M ₪</div>
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
                <Link to="/guides/buying-in-israel" className="p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors">
                  <h4 className="font-medium text-foreground">Complete Guide to Buying in Israel</h4>
                  <p className="text-sm text-muted-foreground mt-1">Full overview of the buying process</p>
                </Link>
                <Link to="/guides/investment-property" className="p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors">
                  <h4 className="font-medium text-foreground">Investment Property Guide</h4>
                  <p className="text-sm text-muted-foreground mt-1">If you're considering investment</p>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
