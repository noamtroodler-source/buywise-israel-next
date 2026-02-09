import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { 
  ArrowLeft, BookOpen, Clock, ChevronDown, ChevronUp,
  Calculator, FileText, Scale, Building2, Landmark, 
  Users, AlertTriangle, CheckCircle2
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

export default function BuyingInIsraelGuide() {
  useTrackContentVisit('guide');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['overview']));
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
      id: 'overview',
      title: '1. Overview of the Israeli Property Market',
      icon: Building2,
      content: (
        <div className="space-y-4">
          <p>
            Israel's real estate market is unique, influenced by limited land, strong demand, and a growing population. 
            Understanding the market dynamics is crucial before making any purchase decisions.
          </p>
          <h4 className="font-semibold">Key Market Characteristics:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>High Demand:</strong> Limited land and immigration drive consistent demand</li>
            <li><strong>Regional Variations:</strong> Tel Aviv and Jerusalem command premium prices, while peripheral areas offer better value</li>
            <li><strong>New Construction:</strong> Government initiatives for new housing developments</li>
            <li><strong>Foreign Investment:</strong> Significant interest from overseas buyers</li>
          </ul>
          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>💡 Pro Tip:</strong> Research specific neighborhoods thoroughly. 
              Prices can vary dramatically between adjacent areas.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'legal',
      title: '2. Legal Framework & Property Types',
      icon: Scale,
      content: (
        <div className="space-y-4">
          <p>
            Understanding Israeli property law is essential. The ownership structure differs from many Western countries.
          </p>
          <h4 className="font-semibold">Property Ownership Types:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong><GlossaryTooltip term="טאבו">Tabu (Full Ownership)</GlossaryTooltip>:</strong> Complete private ownership registered 
              with the Land Registry
            </li>
            <li>
              <strong>Minhal (Leasehold):</strong> Long-term lease from the Israel Land Authority, typically 49-98 years
            </li>
            <li>
              <strong>Cooperative Housing:</strong> Ownership of shares in a housing company
            </li>
          </ul>
          <div className="bg-warning/10 p-4 rounded-lg border border-warning/20">
            <p className="text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-foreground mt-0.5 flex-shrink-0" />
              <span>Always verify the property's registration status before making any commitments. 
              Request a <GlossaryTooltip term="נסח טאבו">Nesach Tabu</GlossaryTooltip> (land registry extract).</span>
            </p>
          </div>
          <Link to="/tools?tool=documents" className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline mt-2">
            <FileText className="h-4 w-4" />
            View Document Checklist
          </Link>
        </div>
      ),
    },
    {
      id: 'financing',
      title: '3. Financing Your Purchase',
      icon: Landmark,
      content: (
        <div className="space-y-4">
          <p>
            Israeli mortgages (<GlossaryTooltip term="משכנתא">Mashkanta</GlossaryTooltip>) have specific regulations 
            set by the Bank of Israel that affect how much you can borrow.
          </p>
          <div className="bg-warning/10 p-4 rounded-lg border border-warning/20">
            <p className="text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-foreground mt-0.5 flex-shrink-0" />
              <span><strong>Important:</strong> Banks will not necessarily appraise the property at the full purchase price. 
              Get a realistic appraisal estimate before signing a sales contract to avoid a shortfall in financing.</span>
            </p>
          </div>
          <h4 className="font-semibold">Key Mortgage Rules:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>First-time buyers:</strong> Up to 75% LTV (Loan-to-Value)</li>
            <li><strong>Additional properties:</strong> Up to 50% LTV</li>
            <li><strong>Foreign residents:</strong> Up to 50% LTV with additional requirements</li>
          </ul>
          <h4 className="font-semibold mt-4">Mortgage Track Types:</h4>
          <p>Israeli mortgages are typically split into multiple "tracks" with different interest rate structures:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Prime-linked (variable)</li>
            <li>Fixed rate (non-linked)</li>
            <li>CPI-linked (inflation-indexed)</li>
          </ul>
          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>💡 Pro Tip:</strong> Work with a mortgage broker who specializes in Israeli banking. 
              Mortgage products in Israel vary greatly from other countries, and a broker can navigate 
              multiple banks to find the best terms for your profile.
            </p>
          </div>
          <div className="flex gap-3 mt-4">
            <Link to="/tools?tool=mortgage">
              <Button variant="outline" size="sm" className="gap-2">
                <Calculator className="h-4 w-4" />
                Mortgage Calculator
              </Button>
            </Link>
            <Link to="/tools?tool=affordability">
              <Button variant="outline" size="sm" className="gap-2">
                <Calculator className="h-4 w-4" />
                Affordability Calculator
              </Button>
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: 'taxes',
      title: '4. Taxes & Purchase Costs',
      icon: Calculator,
      content: (
        <div className="space-y-4">
          <p>
            Understanding the full cost of purchasing property is crucial. Beyond the purchase price, 
            expect to pay 8-12% in additional costs.
          </p>
          <h4 className="font-semibold"><GlossaryTooltip term="מס רכישה">Purchase Tax (Mas Rechisha)</GlossaryTooltip>:</h4>
          <p>Progressive tax based on property value and buyer status:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>First-time Israeli buyers:</strong> 0% on first ~1.9M ₪, then graduated rates</li>
            <li><strong>Additional property:</strong> 8% on first ~6M ₪, then 10%</li>
            <li><strong>Foreign buyers:</strong> Higher rates apply</li>
          </ul>
          <h4 className="font-semibold mt-4">Other Costs:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Lawyer fees:</strong> 0.5-1.5% + VAT</li>
            <li><strong>Agent fees:</strong> 1-2% + VAT (if applicable)</li>
            <li><strong>Mortgage fees:</strong> Appraisal, opening fees</li>
          </ul>
          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <h4 className="font-semibold text-sm mb-2">📊 Quick Benchmark (on a ~$1M USD property):</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-background p-3 rounded-lg border">
                <p className="text-sm font-medium text-foreground">Local Buyer</p>
                <p className="text-2xl font-bold text-primary">~6.5%</p>
                <p className="text-xs text-muted-foreground">2.5% tax + 2% agent + 1% lawyer + 1% other</p>
              </div>
              <div className="bg-background p-3 rounded-lg border">
                <p className="text-sm font-medium text-foreground">Foreign Buyer</p>
                <p className="text-2xl font-bold text-primary">~12%</p>
                <p className="text-xs text-muted-foreground">8% tax + 2% agent + 1% lawyer + 1% other</p>
              </div>
            </div>
          </div>
          <Link to="/tools?tool=totalcost">
            <Button variant="outline" size="sm" className="gap-2 mt-4">
              <Calculator className="h-4 w-4" />
              Calculate Total Costs
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: 'process',
      title: '5. The Purchase Process Step-by-Step',
      icon: CheckCircle2,
      content: (
        <div className="space-y-4">
          <ol className="list-decimal pl-5 space-y-4">
            <li>
              <strong>Pre-Approval:</strong> Get mortgage pre-approval to understand your budget
            </li>
            <li>
              <strong>Property Search:</strong> Work with agents, browse listings, visit properties
            </li>
            <li>
              <strong>Due Diligence:</strong> Hire a lawyer to verify ownership, liens, and building permits
            </li>
            <li>
              <strong>Negotiation:</strong> Make an offer, negotiate price and terms
            </li>
            <li>
              <strong>Contract Signing:</strong> Sign purchase agreement, pay initial deposit (typically 10%)
            </li>
            <li>
              <strong><GlossaryTooltip term="הערת אזהרה">Hearat Azhara</GlossaryTooltip>:</strong> Register warning note to protect your rights
            </li>
            <li>
              <strong>Mortgage Finalization:</strong> Complete mortgage application and approval
            </li>
            <li>
              <strong>Final Payment & Transfer:</strong> Pay remaining balance, register ownership
            </li>
          </ol>
          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>⏱️ Timeline:</strong> The entire process typically takes 2-4 months from offer to closing.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'professionals',
      title: '6. Working with Professionals',
      icon: Users,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold">Essential Professionals:</h4>
          <ul className="list-disc pl-5 space-y-3">
            <li>
              <strong><GlossaryTooltip term="עורך דין">Real Estate Lawyer (Orech Din)</GlossaryTooltip>:</strong> 
              Mandatory for property transactions. Handles due diligence, contracts, and registration.
            </li>
            <li>
              <strong>Mortgage Advisor:</strong> Helps navigate the complex Israeli mortgage market and 
              negotiate better terms with banks.
            </li>
            <li>
              <strong>Real Estate Agent:</strong> Can help find properties, but not required. 
              Understand who pays the commission.
            </li>
            <li>
              <strong>Property Appraiser:</strong> Required by the bank for mortgage approval.
            </li>
          </ul>
          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>💡 Pro Tip:</strong> Always hire your own lawyer, separate from the seller's lawyer. 
              It's worth the investment for independent representation.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'inspections',
      title: '7. Home Inspections',
      icon: CheckCircle2,
      content: (
        <div className="space-y-4">
          <p>
            In Israel, it is the <strong>buyer's responsibility</strong> to check the condition of the property, 
            and the <strong>seller's responsibility</strong> to declare known issues. A thorough inspection 
            protects you from costly surprises after closing.
          </p>
          <h4 className="font-semibold">Inspection Checklist:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Structural integrity:</strong> Foundation, walls, load-bearing elements</li>
            <li><strong>Current condition:</strong> General wear and tear, age-related deterioration</li>
            <li><strong>Quality of build:</strong> Construction materials and workmanship</li>
            <li><strong>Dampness:</strong> Current moisture issues and susceptibility to future dampness</li>
            <li><strong>Plumbing status:</strong> Water pressure, pipe condition, leaks</li>
            <li><strong>Electrical level:</strong> Wiring, panel capacity, safety compliance</li>
            <li><strong>Drainage:</strong> Interior and exterior water drainage systems</li>
            <li><strong>Appliances:</strong> Condition and functionality of included appliances</li>
          </ul>
          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>💡 Pro Tip:</strong> Hire a licensed engineer who specializes in home inspections. 
              This is typically done after both sides agree on a price but before signing the final contract.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'offers',
      title: '8. Making an Offer',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>
            Before making an offer on a property, consider these factors that can significantly 
            affect your negotiating position and the final price.
          </p>
          <h4 className="font-semibold">Factors to Consider:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Seller motivation:</strong> Why is the owner selling? Urgency can affect flexibility</li>
            <li><strong>Time on market:</strong> How long has the property been listed?</li>
            <li><strong>Registration type:</strong> Is it Tabu (private ownership), Minhal (leasehold), or a church lease? Each carries different implications</li>
            <li><strong>Building infractions:</strong> Are there any unpermitted additions or modifications?</li>
            <li><strong>Structural issues:</strong> Any known defects from the inspection?</li>
            <li><strong>Mortgage & payment terms:</strong> What payment schedule works for both parties?</li>
            <li><strong>Competing offers:</strong> Are there other buyers interested?</li>
            <li><strong>Carrying costs:</strong> Ongoing expenses like Arnona, Vaad Bayit</li>
            <li><strong>Date of occupancy:</strong> When can you actually move in?</li>
            <li><strong>Property restrictions:</strong> Any building or usage restrictions?</li>
          </ul>
          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>💡 Pro Tip:</strong> Cross-reference comparable sales from the Israeli Tax Authority 
              website to validate your offer price. Your agent or lawyer can help interpret these records.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'walkthrough',
      title: '9. The Walk-Through',
      icon: CheckCircle2,
      content: (
        <div className="space-y-4">
          <p>
            On the date of the last payment or occupancy, schedule a final walk-through 
            with your agent and the seller to ensure everything is in order.
          </p>
          <h4 className="font-semibold">Walk-Through Checklist:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>Verify the property is in the agreed-upon condition</li>
            <li>Check that all items included in the sale are present</li>
            <li>Confirm any agreed-upon repairs have been completed</li>
            <li>Document the state of the property (photos/video)</li>
            <li>Take final meter readings for utilities</li>
          </ul>
          <h4 className="font-semibold mt-4">Post Walk-Through Tasks:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>Transfer electricity, water, and gas accounts into your name</li>
            <li>Register for Arnona (municipal property tax) at the local municipality</li>
            <li>Update the Vaad Bayit (building committee) with your details</li>
            <li>Collect all keys, remotes, and access codes</li>
          </ul>
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
                <BookOpen className="h-4 w-4" />
                <span>Comprehensive Guide</span>
                <span>•</span>
                <Clock className="h-4 w-4" />
                <span>25 min read</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Complete Guide to Buying Property in <span className="text-primary">Israel</span>
              </h1>
              
              <p className="text-lg text-muted-foreground">
                Everything you need to know about purchasing property in Israel, from understanding 
                the market to closing your dream home.
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

            {/* Related Guides */}
            <div className="border-t border-border pt-8 mt-8">
              <h3 className="font-semibold text-foreground mb-4">Continue Learning</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link to="/guides/oleh-buyer" className="p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors">
                  <h4 className="font-medium text-foreground">Oleh First-Time Buyer Guide</h4>
                  <p className="text-sm text-muted-foreground mt-1">Special benefits and considerations for new immigrants</p>
                </Link>
                <Link to="/guides/new-vs-resale" className="p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors">
                  <h4 className="font-medium text-foreground">New Construction vs Resale</h4>
                  <p className="text-sm text-muted-foreground mt-1">Compare your property options</p>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
