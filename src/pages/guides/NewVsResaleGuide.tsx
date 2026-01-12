import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Building2, Clock, ChevronDown, ChevronUp,
  Hammer, Home, Scale, CreditCard, Calendar,
  CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

function ComparisonTable() {
  const comparisons = [
    { aspect: 'Price', new: 'Often 10-20% premium', resale: 'Market price, negotiable' },
    { aspect: 'Immediate Occupancy', new: 'No - 2-4 year wait', resale: 'Yes - within months' },
    { aspect: 'Customization', new: 'Choose finishes, layout', resale: 'Limited, renovation needed' },
    { aspect: 'VAT', new: 'Included in price (17%)', resale: 'No VAT applicable' },
    { aspect: 'Warranty', new: 'Developer warranty (1-10 yrs)', resale: 'None' },
    { aspect: 'Mortgage Timing', new: 'Progressive payments', resale: 'Full at closing' },
    { aspect: 'Location', new: 'Often peripheral', resale: 'Established neighborhoods' },
    { aspect: 'Building Quality', new: 'Modern standards', resale: 'Varies widely' },
    { aspect: 'Risk', new: 'Developer delays, changes', resale: 'What you see is what you get' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-semibold">Aspect</th>
            <th className="text-left py-3 px-4 font-semibold text-primary">New Construction</th>
            <th className="text-left py-3 px-4 font-semibold text-accent-foreground">Resale</th>
          </tr>
        </thead>
        <tbody>
          {comparisons.map((row, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="py-3 px-4 font-medium">{row.aspect}</td>
              <td className="py-3 px-4 text-muted-foreground">{row.new}</td>
              <td className="py-3 px-4 text-muted-foreground">{row.resale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function NewVsResaleGuide() {
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
      title: '1. Quick Comparison Overview',
      icon: Scale,
      content: (
        <div className="space-y-4">
          <p>
            Choosing between new construction and resale is one of the biggest decisions you'll make. 
            Each has distinct advantages and trade-offs.
          </p>
          <ComparisonTable />
        </div>
      ),
    },
    {
      id: 'new-construction',
      title: '2. New Construction Deep Dive',
      icon: Building2,
      content: (
        <div className="space-y-4">
          <Tabs defaultValue="pros" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="pros" className="flex-1">Pros</TabsTrigger>
              <TabsTrigger value="cons" className="flex-1">Cons</TabsTrigger>
            </TabsList>
            <TabsContent value="pros" className="mt-4">
              <ul className="space-y-2">
                {[
                  'Modern building standards and earthquake codes',
                  'Choose your finishes, flooring, kitchen',
                  'Developer warranty (1 year full, up to 10 years structural)',
                  'Energy-efficient systems (lower Arnona, utilities)',
                  'Underground parking, modern amenities',
                  'No immediate renovation costs',
                  'Staged payments reduce initial outlay'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="cons" className="mt-4">
              <ul className="space-y-2">
                {[
                  'Premium pricing (10-20% above comparable resale)',
                  'Wait 2-4 years for completion',
                  'Developer delays are common (6-12 months typical)',
                  'Can\'t see the actual finished product',
                  'Location often in less established areas',
                  'Quality variations between developers',
                  'Risk of developer financial issues',
                  'Changes to plans/finishes during construction'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
          
          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>💡 Pro Tip:</strong> Research the developer thoroughly. Check their track record, 
              visit completed projects, and read the contract carefully with a lawyer.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'resale',
      title: '3. Resale Properties Deep Dive',
      icon: Home,
      content: (
        <div className="space-y-4">
          <Tabs defaultValue="pros" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="pros" className="flex-1">Pros</TabsTrigger>
              <TabsTrigger value="cons" className="flex-1">Cons</TabsTrigger>
            </TabsList>
            <TabsContent value="pros" className="mt-4">
              <ul className="space-y-2">
                {[
                  'What you see is what you get',
                  'Immediate availability (move in within months)',
                  'Established neighborhoods with amenities',
                  'Often better locations (central areas)',
                  'Negotiable pricing',
                  'Can assess building management quality',
                  'Know the actual neighbors and community',
                  'No VAT (savings vs. new in some cases)'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="cons" className="mt-4">
              <ul className="space-y-2">
                {[
                  'May need renovation (add ₪100-300k budget)',
                  'Older building systems and standards',
                  'No warranty - you inherit all issues',
                  'Less parking, smaller storage',
                  'Higher maintenance in older buildings',
                  'May not meet current earthquake standards',
                  'Potential for hidden problems',
                  'Full payment required at closing'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>

          <div className="bg-warning/10 p-4 rounded-lg border border-warning/20 mt-4">
            <p className="text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-foreground mt-0.5 flex-shrink-0" />
              <span>Always hire an engineer to inspect older properties. Hidden issues like 
              water damage, structural problems, or illegal construction can be costly.</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'payment',
      title: '4. Payment Structures',
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold">New Construction Payments:</h4>
          <p>Payments are typically staged according to construction progress:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Contract signing:</strong> 10-15%</li>
            <li><strong>Foundation:</strong> 10-15%</li>
            <li><strong>Skeleton:</strong> 15-20%</li>
            <li><strong>Enclosure:</strong> 15-20%</li>
            <li><strong>Interior work:</strong> 15-20%</li>
            <li><strong>Key handover:</strong> Final balance (10-15%)</li>
          </ul>
          
          <div className="bg-primary/5 p-4 rounded-lg my-4">
            <p className="text-sm">
              <strong>Advantage:</strong> You may not need full mortgage from day one. 
              Some banks offer "construction mortgages" that align with payment milestones.
            </p>
          </div>

          <h4 className="font-semibold mt-4">Resale Payments:</h4>
          <p>Typical structure:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Contract signing:</strong> 10% deposit</li>
            <li><strong>Within 30-60 days:</strong> Balance (90%), usually with mortgage</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            You'll need your mortgage fully approved and ready before closing.
          </p>
        </div>
      ),
    },
    {
      id: 'costs',
      title: '5. True Cost Comparison',
      icon: Hammer,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold">New Construction Hidden Costs:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Upgrades:</strong> ₪50-150k for better finishes</li>
            <li><strong>Attorney fees:</strong> Often higher for developer contracts</li>
            <li><strong>Closing costs:</strong> Connection fees for utilities</li>
            <li><strong>Temporary housing:</strong> If current lease ends before completion</li>
            <li><strong>Index linkage:</strong> Some contracts link price to construction index</li>
          </ul>

          <h4 className="font-semibold mt-4">Resale Hidden Costs:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Renovation:</strong> ₪100-300k+ depending on scope</li>
            <li><strong>Immediate repairs:</strong> Items discovered after purchase</li>
            <li><strong>Furniture/appliances:</strong> Often need replacement</li>
            <li><strong>Building fund:</strong> May need to catch up on <GlossaryTooltip term="ועד בית">Vaad Bayit</GlossaryTooltip> reserves</li>
          </ul>

          <div className="flex gap-3 mt-4">
            <Link to="/tools?tool=totalcost">
              <Button variant="outline" size="sm" className="gap-2">
                Total Cost Calculator
              </Button>
            </Link>
            <Link to="/tools?tool=renovation">
              <Button variant="outline" size="sm" className="gap-2">
                Renovation Estimator
              </Button>
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: 'timeline',
      title: '6. Timeline Comparison',
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold">New Construction Timeline:</h4>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Search & sign contract</span>
                <span className="text-muted-foreground">2-4 months</span>
              </div>
              <div className="flex justify-between">
                <span>Construction period</span>
                <span className="text-muted-foreground">24-48 months</span>
              </div>
              <div className="flex justify-between">
                <span>Delays (typical)</span>
                <span className="text-muted-foreground">6-12 months</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total</span>
                <span className="text-primary">3-5+ years</span>
              </div>
            </div>
          </div>

          <h4 className="font-semibold mt-4">Resale Timeline:</h4>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Search for property</span>
                <span className="text-muted-foreground">1-6 months</span>
              </div>
              <div className="flex justify-between">
                <span>Due diligence & contract</span>
                <span className="text-muted-foreground">2-4 weeks</span>
              </div>
              <div className="flex justify-between">
                <span>Mortgage & closing</span>
                <span className="text-muted-foreground">1-2 months</span>
              </div>
              <div className="flex justify-between">
                <span>Renovation (if needed)</span>
                <span className="text-muted-foreground">2-6 months</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total</span>
                <span className="text-accent-foreground">3-12 months</span>
              </div>
            </div>
          </div>
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
                <Building2 className="h-4 w-4" />
                <span>Comparison Guide</span>
                <span>•</span>
                <Clock className="h-4 w-4" />
                <span>15 min read</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                New Construction vs Resale
              </h1>
              
              <p className="text-lg text-muted-foreground">
                A comprehensive comparison to help you decide between buying from a developer 
                or purchasing an existing property in Israel.
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

            {/* Quick Decision Helper */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Choose New Construction If...
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• You can wait 2-4 years</li>
                  <li>• Modern standards are important</li>
                  <li>• You want to customize finishes</li>
                  <li>• You prefer peripheral areas</li>
                </ul>
              </div>
              <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Home className="h-4 w-4 text-primary" />
                  Choose Resale If...
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• You need to move soon</li>
                  <li>• Location is top priority</li>
                  <li>• You want established neighborhood</li>
                  <li>• You're comfortable renovating</li>
                </ul>
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
                  <p className="text-sm text-muted-foreground mt-1">The full buying process explained</p>
                </Link>
                <Link to="/projects" className="p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors">
                  <h4 className="font-medium text-foreground">Browse New Projects</h4>
                  <p className="text-sm text-muted-foreground mt-1">See available new construction</p>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
