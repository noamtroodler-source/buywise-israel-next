import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, BookOpen, Clock, ChevronDown, ChevronUp,
  Calculator, FileText, Shield, Building2, Landmark, 
  CreditCard, AlertTriangle, CheckCircle2, HelpCircle,
  Wallet, Calendar, Scale
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

export default function NewConstructionGuide() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['why-new']));
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
      id: 'why-new',
      title: '1. Why Buy New Construction?',
      icon: Building2,
      content: (
        <div className="space-y-4">
          <p>
            New construction in Israel offers unique advantages for international buyers, including modern 
            amenities, warranty protections, and the opportunity to customize your home.
          </p>
          <h4 className="font-semibold">Key Advantages:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Modern Standards:</strong> Built to current earthquake codes, energy efficiency requirements, and includes mandatory safe rooms (Mamad)</li>
            <li><strong>Warranty Protection:</strong> One-year full warranty plus extended structural warranty</li>
            <li><strong>Customization:</strong> Often ability to choose finishes, flooring, and kitchen specifications</li>
            <li><strong>Payment Flexibility:</strong> Staged payments over construction period reduces upfront cash needs</li>
            <li><strong>No Renovation Needed:</strong> Move-in ready with new appliances and systems</li>
          </ul>
          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>💡 For International Buyers:</strong> New construction is often preferred because you can manage much of 
              the process remotely, and you won't need to deal with renovation contractors or unexpected repair issues.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'bank-guarantee',
      title: '2. Bank Guarantees & Buyer Protection',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p>
            Israeli law provides strong protections for buyers of new construction through mandatory bank guarantees.
            This is one of the safest ways to buy property.
          </p>
          <h4 className="font-semibold">How Bank Guarantees Work:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Legal Requirement:</strong> Developers must provide bank guarantees for every payment you make</li>
            <li><strong>Your Protection:</strong> If the developer defaults, the bank returns your money</li>
            <li><strong>Held Until Registration:</strong> Guarantees remain valid until property is registered in your name</li>
          </ul>
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20 mt-4">
            <p className="text-sm flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Key Insight:</strong> The bank guarantee system means buying new construction in Israel is 
              generally safer than buying resale, where you transfer full payment before receiving keys.</span>
            </p>
          </div>
          <h4 className="font-semibold mt-4">Important Documents to Receive:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><GlossaryTooltip term="ערבות בנקאית">Bank Guarantee (Aravut Bankit)</GlossaryTooltip> for each payment</li>
            <li>Insurance Policy Certificate</li>
            <li>Building Permit Copy</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'payment-schedule',
      title: '3. Payment Schedule & Milestones',
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <p>
            Unlike resale purchases where you pay 100% at closing, new construction uses staged payments 
            tied to construction milestones. This is a major advantage for managing your cash flow.
          </p>
          <h4 className="font-semibold">Typical Payment Schedule:</h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Contract Signing</span>
              <span className="text-primary font-bold">10%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Foundation Complete</span>
              <span className="text-primary font-bold">15%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Structure Complete</span>
              <span className="text-primary font-bold">25%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Key Delivery</span>
              <span className="text-primary font-bold">50%</span>
            </div>
          </div>
          <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20 mt-4">
            <p className="text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <span><strong>Important:</strong> Payment schedules can vary by developer. Some require larger early 
              payments. Always negotiate and review the schedule carefully with your lawyer before signing.</span>
            </p>
          </div>
          <h4 className="font-semibold mt-4">CPI Linkage (Hatzamada):</h4>
          <p>
            Most new construction contracts include CPI (Consumer Price Index) linkage. This means your remaining 
            payments may increase based on inflation. Budget for 2-4% annual increases on unpaid amounts.
          </p>
        </div>
      ),
    },
    {
      id: 'developer-lawyer',
      title: '4. Developer Lawyer Fees',
      icon: Scale,
      content: (
        <div className="space-y-4">
          <p>
            When buying new construction, you'll pay for the developer's lawyer in addition to your own lawyer.
            This is standard practice in Israel and covers registration and documentation.
          </p>
          <h4 className="font-semibold">What Developer Lawyer Fees Cover:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>Preparation of the purchase contract</li>
            <li>Registration of the property in the Land Registry (Tabu)</li>
            <li>Handling bank guarantee documentation</li>
            <li>Building completion and occupancy documentation</li>
          </ul>
          <h4 className="font-semibold mt-4">Typical Costs:</h4>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-lg font-semibold text-primary mb-2">1.5% - 2% + VAT</p>
            <p className="text-sm text-muted-foreground">
              For a ₪2,000,000 property, expect ₪35,000-50,000 for developer lawyer fees
            </p>
          </div>
          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>💡 Pro Tip:</strong> You still need YOUR OWN lawyer (0.5-1% + VAT) to review the contract 
              and protect your interests. Never rely solely on the developer's lawyer.
            </p>
          </div>
          <Link to="/tools?tool=totalcost">
            <Button variant="outline" size="sm" className="gap-2 mt-4">
              <Calculator className="h-4 w-4" />
              Calculate Total Purchase Costs
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: 'construction-stages',
      title: '5. Understanding Construction Stages',
      icon: Building2,
      content: (
        <div className="space-y-4">
          <p>
            New construction projects go through several stages. Understanding these helps you track progress 
            and know when payments are due.
          </p>
          <h4 className="font-semibold">Project Stages:</h4>
          <ol className="list-decimal pl-5 space-y-3">
            <li>
              <strong>Planning Stage:</strong> Project approved, permits pending. Typically no sales yet.
            </li>
            <li>
              <strong>Pre-Sale:</strong> Marketing begins, early buyers may get discounts. Construction hasn't started.
            </li>
            <li>
              <strong>Under Construction:</strong> Active building. Payment milestones begin.
            </li>
            <li>
              <strong>Completed:</strong> Building finished, occupancy permit (Tofes 4) issued.
            </li>
          </ol>
          <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20 mt-4">
            <p className="text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <span><strong>Delays Are Common:</strong> Israeli construction projects often experience delays. 
              Plan for your move-in date to be 6-12 months later than promised. Your contract should include 
              delay compensation clauses.</span>
            </p>
          </div>
          <h4 className="font-semibold mt-4">What to Verify:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Valid building permit (<GlossaryTooltip term="היתר בנייה">Heiter Bniya</GlossaryTooltip>)</li>
            <li>Developer's track record with previous projects</li>
            <li>Bank providing the guarantees</li>
            <li>Insurance policies in place</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'taxes-fees',
      title: '6. Taxes & Additional Fees',
      icon: Wallet,
      content: (
        <div className="space-y-4">
          <p>
            New construction purchases involve the same purchase tax as resale, plus some additional 
            new-construction-specific costs.
          </p>
          <h4 className="font-semibold">Purchase Tax (Mas Rechisha):</h4>
          <p>Same progressive tax brackets apply as resale purchases:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>First-time Israeli buyers:</strong> 0% on first ~₪1.9M, then graduated rates</li>
            <li><strong>Investment/Additional property:</strong> 8% on first ~₪6M, then 10%</li>
            <li><strong>Foreign buyers:</strong> Higher rates apply</li>
          </ul>
          <h4 className="font-semibold mt-4">Additional New Construction Costs:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Developer Lawyer:</strong> 1.5-2% + VAT</li>
            <li><strong>Your Lawyer:</strong> 0.5-1% + VAT</li>
            <li><strong>VAT (on new properties):</strong> Usually included in advertised price</li>
            <li><strong>Connection Fees:</strong> Electricity, water, gas hookups</li>
            <li><strong>Upgrades:</strong> Any customizations beyond standard spec</li>
          </ul>
          <div className="flex gap-3 mt-4">
            <Link to="/tools?tool=purchasetax">
              <Button variant="outline" size="sm" className="gap-2">
                <Calculator className="h-4 w-4" />
                Purchase Tax Calculator
              </Button>
            </Link>
            <Link to="/tools?tool=totalcost">
              <Button variant="outline" size="sm" className="gap-2">
                <Calculator className="h-4 w-4" />
                Total Cost Calculator
              </Button>
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: 'checklist',
      title: '7. Your New Construction Checklist',
      icon: CheckCircle2,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold">Before Signing:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>✓ Research developer's track record and financial stability</li>
            <li>✓ Verify building permit is valid and current</li>
            <li>✓ Review technical specifications and included finishes</li>
            <li>✓ Understand payment schedule and CPI linkage terms</li>
            <li>✓ Hire your own independent lawyer</li>
            <li>✓ Get mortgage pre-approval if financing</li>
          </ul>
          <h4 className="font-semibold mt-4">During Construction:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>✓ Keep all bank guarantee documents safe</li>
            <li>✓ Track construction progress against milestones</li>
            <li>✓ Visit site periodically (or have representative visit)</li>
            <li>✓ Document any concerns or deviations from plan</li>
          </ul>
          <h4 className="font-semibold mt-4">At Delivery:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>✓ Conduct thorough inspection before accepting keys</li>
            <li>✓ Document all defects (you have time to report issues)</li>
            <li>✓ Verify all specifications match contract</li>
            <li>✓ Obtain all warranty documentation</li>
            <li>✓ Ensure property registration process begins</li>
          </ul>
          <Link to="/tools?tool=documents" className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline mt-4">
            <FileText className="h-4 w-4" />
            View Full Document Checklist
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
                <BookOpen className="h-4 w-4" />
                <span>Comprehensive Guide</span>
                <span>•</span>
                <Clock className="h-4 w-4" />
                <span>20 min read</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Buying New Construction in Israel
              </h1>
              
              <p className="text-lg text-muted-foreground">
                Everything you need to know about buying from developers, including bank guarantees, 
                payment schedules, and buyer protections.
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

            {/* Key Takeaways Banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Key Takeaways for International Buyers
              </h3>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Bank guarantees protect 100% of your payments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Staged payments (10/15/25/50) ease cash flow</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Always hire your own independent lawyer</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Plan for delays—add 6-12 months to timeline</span>
                </li>
              </ul>
            </div>

            {/* Table of Contents */}
            <div className="bg-muted/50 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-3">In This Guide</h3>
              <nav className="grid sm:grid-cols-2 gap-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSection(section.id);
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    {readSections.has(section.id) && <CheckCircle2 className="h-3 w-3 text-primary" />}
                    {section.title}
                  </a>
                ))}
              </nav>
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

            {/* CTA */}
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <h3 className="font-semibold text-foreground mb-2">Ready to Explore New Projects?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Browse new construction developments across Israel
              </p>
              <Link to="/projects">
                <Button size="lg" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  View New Projects
                </Button>
              </Link>
            </div>

            {/* Related Guides */}
            <div className="border-t border-border pt-8 mt-8">
              <h3 className="font-semibold text-foreground mb-4">Continue Learning</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link to="/guides/buying-in-israel" className="p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors">
                  <h4 className="font-medium text-foreground">Complete Buying Guide</h4>
                  <p className="text-sm text-muted-foreground mt-1">Full overview of the Israeli property purchase process</p>
                </Link>
                <Link to="/guides/new-vs-resale" className="p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors">
                  <h4 className="font-medium text-foreground">New vs Resale Comparison</h4>
                  <p className="text-sm text-muted-foreground mt-1">Detailed comparison to help you decide</p>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
