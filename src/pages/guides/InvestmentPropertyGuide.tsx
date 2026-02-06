import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { 
  ArrowLeft, TrendingUp, Clock, ChevronDown, ChevronUp,
  Calculator, PieChart, MapPin, AlertTriangle, Target,
  CheckCircle2, Percent, Building2, Wallet, Users,
  Home, DollarSign, Key, Scale, BookOpen
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

export default function InvestmentPropertyGuide() {
  useTrackContentVisit('guide');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['real-numbers']));
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
      id: 'real-numbers',
      title: '1. Real Numbers: Rental Income Examples',
      icon: DollarSign,
      content: (
        <div className="space-y-4">
          <p>
            Forget vague "yield ranges." Here are actual rental income examples from recent 
            market data to ground your expectations.
          </p>
          
          <h4 className="font-semibold">Tel Aviv - 3 Room Apartment (~70 sqm)</h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purchase Price:</span>
              <span className="font-medium">₪3,200,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Rent:</span>
              <span className="font-medium">₪7,000 - 8,500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Yield:</span>
              <span className="font-bold text-primary">2.6% - 3.2%</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">After Expenses (Net):</span>
              <span className="font-bold text-foreground">1.8% - 2.4%</span>
            </div>
          </div>

          <h4 className="font-semibold mt-4">Haifa (Carmel) - 4 Room Apartment (~100 sqm)</h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purchase Price:</span>
              <span className="font-medium">₪1,800,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Rent:</span>
              <span className="font-medium">₪5,500 - 6,500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Yield:</span>
              <span className="font-bold text-primary">3.7% - 4.3%</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">After Expenses (Net):</span>
              <span className="font-bold text-foreground">2.8% - 3.4%</span>
            </div>
          </div>

          <h4 className="font-semibold mt-4">Beer Sheva - 3 Room Apartment (~80 sqm)</h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purchase Price:</span>
              <span className="font-medium">₪950,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Rent:</span>
              <span className="font-medium">₪3,800 - 4,500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Yield:</span>
              <span className="font-bold text-primary">4.8% - 5.7%</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">After Expenses (Net):</span>
              <span className="font-bold text-foreground">3.8% - 4.6%</span>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>💡 The Yield Reality:</strong> Higher yields in periphery come with trade-offs: 
              lower appreciation, tenant turnover, less liquidity. Tel Aviv's low yield is offset by 
              consistent 5-8% annual appreciation historically.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'total-cost',
      title: '2. The True Cost of Investment Properties',
      icon: Wallet,
      content: (
        <div className="space-y-4">
          <p>
            Investment property taxes are significantly higher. Here's the exact breakdown 
            so you can budget accurately.
          </p>

          <h4 className="font-semibold">Purchase Tax (Investor Rate):</h4>
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>First ₪6,055,070:</span>
                <span className="font-bold">8%</span>
              </div>
              <div className="flex justify-between">
                <span>Above ₪6,055,070:</span>
                <span className="font-bold">10%</span>
              </div>
            </div>
          </div>

          <h4 className="font-semibold mt-4">Example: ₪2,000,000 Investment Property</h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purchase Tax (8%):</span>
              <span className="font-medium">₪160,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lawyer Fees (1%):</span>
              <span className="font-medium">₪23,400</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mortgage Fees:</span>
              <span className="font-medium">₪8,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Renovation Budget:</span>
              <span className="font-medium">₪50,000</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg">
              <span className="font-semibold">Total Additional Costs:</span>
              <span className="font-bold text-primary">₪241,400 (12%+)</span>
            </div>
          </div>

          <h4 className="font-semibold mt-4">Ongoing Costs (Annual):</h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Arnona (varies by city):</span>
              <span className="font-medium">₪4,000 - 12,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vaad Bayit:</span>
              <span className="font-medium">₪2,400 - 6,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Insurance:</span>
              <span className="font-medium">₪800 - 1,500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maintenance Reserve (5%):</span>
              <span className="font-medium">₪3,000 - 5,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vacancy (1 month/year avg):</span>
              <span className="font-medium">₪5,000 - 8,000</span>
            </div>
          </div>

          <div className="bg-warning/10 p-4 rounded-lg border border-warning/20 mt-4">
            <p className="text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-foreground mt-0.5 flex-shrink-0" />
              <span><strong>Cash Flow Reality:</strong> With 50% down and current interest rates, 
              most Israeli investment properties are cash-flow negative or break-even. The strategy 
              relies on appreciation + principal paydown.</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'property-management',
      title: '3. Property Management Options',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p>
            Managing rental property from abroad adds complexity. Here are your options with 
            actual costs and trade-offs.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-card border">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Option 1: Self-Management</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Handle tenant finding, rent collection, and maintenance coordination yourself.
                  </p>
                </div>
                <span className="text-success font-bold">₪0</span>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-success">✓ No management fees</p>
                <p className="text-destructive">✗ Requires Hebrew fluency</p>
                <p className="text-destructive">✗ Time zone challenges from abroad</p>
                <p className="text-destructive">✗ Emergency repairs at 2am your time</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card border">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Option 2: Full Property Management</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Professional company handles everything: tenant search, rent collection, 
                    maintenance, legal issues.
                  </p>
                </div>
                <span className="text-primary font-bold">8-12% of rent</span>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-success">✓ Completely hands-off</p>
                <p className="text-success">✓ Local expertise and language</p>
                <p className="text-destructive">✗ Reduces yield by ~1%</p>
                <p className="text-destructive">✗ Quality varies significantly</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card border">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Option 3: Family/Friend Arrangement</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Trusted local contact handles day-to-day, you handle major decisions.
                  </p>
                </div>
                <span className="text-muted-foreground font-bold">Varies</span>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-success">✓ Trust and communication</p>
                <p className="text-success">✓ Flexible compensation</p>
                <p className="text-warning-foreground">⚠ Can strain relationships</p>
                <p className="text-destructive">✗ Not always reliable long-term</p>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>💡 Pro Tip:</strong> For foreign investors, professional management is often 
              worth the cost—especially for first properties. The ₪4,000-8,000/year fee prevents 
              much larger losses from tenant problems or maintenance neglect.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'short-term',
      title: '4. Short-Term Rental Regulations',
      icon: Key,
      content: (
        <div className="space-y-4">
          <p>
            Airbnb and short-term rentals are increasingly regulated in Israel. Here's what you 
            need to know before planning a vacation rental strategy.
          </p>

          <h4 className="font-semibold">Tel Aviv Regulations:</h4>
          <div className="bg-warning/10 p-4 rounded-lg border border-warning/20">
            <ul className="text-sm space-y-2">
              <li><strong>License Required:</strong> Business license from municipality</li>
              <li><strong>Rental Limit:</strong> Maximum 90 days per year without license</li>
              <li><strong>Enforcement:</strong> Active enforcement with ₪50,000+ fines</li>
              <li><strong>Arnona:</strong> Higher commercial rate applies</li>
            </ul>
          </div>

          <h4 className="font-semibold mt-4">Jerusalem:</h4>
          <div className="bg-muted/50 p-4 rounded-lg">
            <ul className="text-sm space-y-2">
              <li><strong>Less strict:</strong> Enforcement is lighter than Tel Aviv</li>
              <li><strong>Seasonal demand:</strong> High during holidays, lower otherwise</li>
              <li><strong>Neighborhoods vary:</strong> Old City area very regulated</li>
            </ul>
          </div>

          <h4 className="font-semibold mt-4">Eilat:</h4>
          <div className="bg-success/10 p-4 rounded-lg border border-success/20">
            <ul className="text-sm space-y-2">
              <li><strong>Tourist-friendly:</strong> More permissive regulations</li>
              <li><strong>No VAT zone:</strong> Different tax treatment</li>
              <li><strong>Seasonal:</strong> Winter peak, summer slow</li>
            </ul>
          </div>

          <h4 className="font-semibold mt-4">Financial Reality:</h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Potential Gross Yield:</span>
              <span className="font-medium">6-10%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Fees (Airbnb):</span>
              <span className="font-medium">-3%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cleaning/Turnover:</span>
              <span className="font-medium">-15-20%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vacancy (off-season):</span>
              <span className="font-medium">-20-30%</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Realistic Net Yield:</span>
              <span className="font-bold text-foreground">3-5%</span>
            </div>
          </div>

          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 mt-4">
            <p className="text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <span><strong>Warning:</strong> Many buildings prohibit short-term rentals in their 
              bylaws. Verify before purchase—violating building rules can result in legal action 
              from neighbors.</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'exit-strategy',
      title: '5. Exit Strategy & Selling Costs',
      icon: Target,
      content: (
        <div className="space-y-4">
          <p>
            Investment properties are illiquid. Plan your exit before you buy.
          </p>

          <h4 className="font-semibold">Selling Timeline:</h4>
          <div className="bg-muted/50 rounded-lg p-4">
            <ul className="text-sm space-y-2">
              <li><strong>Listing to Offer:</strong> 1-6 months (market dependent)</li>
              <li><strong>Contract to Closing:</strong> 2-4 months</li>
              <li><strong>Total Timeline:</strong> 3-10 months is realistic</li>
            </ul>
          </div>

          <h4 className="font-semibold mt-4">Selling Costs:</h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agent Commission:</span>
              <span className="font-medium">1-2% + VAT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Capital Gains Tax:</span>
              <span className="font-medium">25% on real gains</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lawyer Fees:</span>
              <span className="font-medium">0.5% + VAT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mortgage Prepayment (if any):</span>
              <span className="font-medium">Varies by track</span>
            </div>
          </div>

          <h4 className="font-semibold mt-4">Capital Gains Example:</h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span>Purchase Price (2020):</span>
              <span>₪1,800,000</span>
            </div>
            <div className="flex justify-between">
              <span>Sale Price (2025):</span>
              <span>₪2,400,000</span>
            </div>
            <div className="flex justify-between">
              <span>Nominal Gain:</span>
              <span>₪600,000</span>
            </div>
            <div className="flex justify-between">
              <span>Inflation Adjustment:</span>
              <span className="text-success">-₪150,000</span>
            </div>
            <div className="flex justify-between">
              <span>"Real" Gain:</span>
              <span>₪450,000</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-destructive">
              <span className="font-semibold">Capital Gains Tax (25%):</span>
              <span className="font-bold">₪112,500</span>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>💡 Planning Tip:</strong> Hold for 5+ years to maximize appreciation and 
              reduce the tax rate effective impact. Quick flips are heavily taxed.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'risks',
      title: '6. Risk Assessment Framework',
      icon: AlertTriangle,
      content: (
        <div className="space-y-4">
          <p>
            Every investment has risks. Here's a framework to evaluate them for your situation.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-warning/20 bg-warning/5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📈</span>
                <div>
                  <h4 className="font-semibold">Interest Rate Risk</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    If rates rise 2%, your monthly payment could increase ₪1,500-3,000. 
                    Fixed-rate portions protect you; variable portions expose you.
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Mitigation:</strong> Lock 50%+ in fixed tracks; stress-test at +3% rates
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-warning/20 bg-warning/5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏠</span>
                <div>
                  <h4 className="font-semibold">Vacancy Risk</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    1-2 months vacancy per year is normal. In peripheral areas, 
                    it can be 2-4 months during market downturns.
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Mitigation:</strong> Budget for 2 months vacancy; maintain property well; 
                    price competitively
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-warning/20 bg-warning/5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <h4 className="font-semibold">Tenant Risk</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Israeli tenant protections are strong. Eviction can take 6-12 months 
                    for non-paying tenants.
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Mitigation:</strong> Thorough screening; require bank guarantee or 
                    guarantors; use standard rental contracts
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-warning/20 bg-warning/5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💱</span>
                <div>
                  <h4 className="font-semibold">Currency Risk (Foreign Investors)</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    NIS/USD can swing 10-15% in a year. Your property might appreciate 5% 
                    in NIS but lose 10% in USD.
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Mitigation:</strong> Think long-term (10+ years); consider NIS income 
                    to service NIS mortgage
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-warning/20 bg-warning/5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏛️</span>
                <div>
                  <h4 className="font-semibold">Regulatory Risk</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Government could increase investor taxes, implement rent control, 
                    or change short-term rental rules.
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Mitigation:</strong> Diversify holdings; don't over-leverage; 
                    stay informed on policy changes
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>💡 Stress Test:</strong> Before buying, ask: "Can I hold this property 
              for 5 years if rates rise 3%, I have 3 months vacancy, and the market drops 15%?" 
              If no, reconsider the investment.
            </p>
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
            {/* Dual Navigation */}
            <DualNavigation
              parentLabel="All Guides"
              parentPath="/guides"
            />

            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Investment Guide</span>
                <span>•</span>
                <Clock className="h-4 w-4" />
                <span>25 min read</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Investment Property Guide
              </h1>
              
              <p className="text-lg text-muted-foreground">
                Real rental income numbers, actual costs, property management options, 
                and honest risk assessment for Israeli investment properties.
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-destructive/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-destructive">8%</div>
                <div className="text-xs text-muted-foreground">Min purchase tax</div>
              </div>
              <div className="bg-warning/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-warning-foreground">50%</div>
                <div className="text-xs text-muted-foreground">Max LTV</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">3-5%</div>
                <div className="text-xs text-muted-foreground">Typical net yield</div>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-foreground">25%</div>
                <div className="text-xs text-muted-foreground">Capital gains tax</div>
              </div>
            </div>

            {/* Investment Reality Box */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <div className="flex items-start gap-3">
                <Scale className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">The Investment Reality</h3>
                  <p className="text-sm text-muted-foreground">
                    Israeli investment properties typically don't cash-flow positively with financing. 
                    The strategy is: (1) appreciation over time, (2) principal paydown, and (3) eventual 
                    positive cash flow as rents rise and mortgage shrinks. This is a 7-15 year play, 
                    not a quick return.
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

            {/* Related Tools */}
            <div className="border-t border-border pt-8 mt-8">
              <h3 className="font-semibold text-foreground mb-4">Investment Calculators</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link to="/tools?tool=investment" className="p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    Investment Returns Calculator
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">Model your specific investment scenario</p>
                </Link>
                <Link to="/tools?tool=purchasetax" className="p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    Purchase Tax Calculator
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">Calculate investor tax rates</p>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
