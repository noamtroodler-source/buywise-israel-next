import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, TrendingUp, Clock, ChevronDown, ChevronUp,
  Calculator, PieChart, MapPin, AlertTriangle, Target,
  CheckCircle2, Percent
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

export default function InvestmentPropertyGuide() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['yields']));
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
      id: 'yields',
      title: '1. Understanding Israeli Rental Yields',
      icon: Percent,
      content: (
        <div className="space-y-4">
          <p>
            Israeli rental yields are generally lower than many other markets, but capital appreciation 
            has historically been strong.
          </p>
          <h4 className="font-semibold">Typical Gross Yields by Area:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Tel Aviv center:</strong> 2-3% gross yield</li>
            <li><strong>Jerusalem:</strong> 2.5-3.5% gross yield</li>
            <li><strong>Haifa:</strong> 3.5-4.5% gross yield</li>
            <li><strong>Peripheral cities:</strong> 4-5.5% gross yield</li>
            <li><strong>Development towns:</strong> 5-7% gross yield</li>
          </ul>
          <h4 className="font-semibold mt-4">Net vs Gross Yield:</h4>
          <p>After accounting for expenses, net yields are typically 1-1.5% lower:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><GlossaryTooltip term="ארנונה">Arnona</GlossaryTooltip> (if landlord pays)</li>
            <li><GlossaryTooltip term="ועד בית">Vaad Bayit</GlossaryTooltip> fees</li>
            <li>Maintenance and repairs</li>
            <li>Property management (if applicable)</li>
            <li>Vacancy periods</li>
          </ul>
          <Link to="/tools?tool=investment">
            <Button variant="outline" size="sm" className="gap-2 mt-4">
              <Calculator className="h-4 w-4" />
              Calculate Investment Returns
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: 'taxes',
      title: '2. Investment Property Taxes',
      icon: Calculator,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">Higher Purchase Tax:</h4>
          <p>
            Investment properties (second+ property) face significantly higher 
            <GlossaryTooltip term="מס רכישה"> purchase tax</GlossaryTooltip>:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>8%</strong> on amount up to ~6,000,000 ₪</li>
            <li><strong>10%</strong> on amount above ~6,000,000 ₪</li>
          </ul>
          <div className="bg-muted p-4 rounded-lg border border-border my-4">
            <p className="text-sm">
              <strong>Example:</strong> A 3M ₪ investment property incurs ~₪240,000 in purchase tax alone.
            </p>
          </div>
          
          <h4 className="font-semibold mt-4">Rental Income Tax:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Exempt up to ~5,470 ₪/month</strong> (for residential, 2024)</li>
            <li><strong>10% flat rate option</strong> on gross rental income (no deductions)</li>
            <li><strong>Marginal rate option</strong> with expense deductions</li>
          </ul>

          <h4 className="font-semibold mt-4">Capital Gains Tax:</h4>
          <p>When selling investment property:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>25% on real (inflation-adjusted) gains</li>
            <li>No exemption for investment properties</li>
            <li>Depreciation recapture may apply</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'financing',
      title: '3. Financing Investment Properties',
      icon: PieChart,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold">LTV Limits for Investment:</h4>
          <p>Bank of Israel regulations restrict leverage for investment properties:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Maximum 50% LTV</strong> for second property</li>
            <li><strong>Maximum 50% LTV</strong> for foreign residents</li>
            <li>Stricter income verification requirements</li>
          </ul>
          
          <div className="bg-muted p-4 rounded-lg border border-border my-4">
            <p className="text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span>You'll need at least 50% down payment for investment properties. 
              Plan your capital allocation carefully.</span>
            </p>
          </div>

          <h4 className="font-semibold mt-4">Cash Flow Considerations:</h4>
          <p>With 50% financing and current interest rates:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Monthly mortgage payment often exceeds rental income</li>
            <li>Negative cash flow common in prime areas</li>
            <li>Strategy relies on appreciation + principal paydown</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'locations',
      title: '4. Best Areas for Investment',
      icon: MapPin,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold">High Yield Strategy (Cash Flow Focus):</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Haifa (lower city, Hadar):</strong> 4-5% yields, improving area</li>
            <li><strong>Beer Sheva:</strong> Strong rental demand from university, tech hub</li>
            <li><strong>Ashdod:</strong> Port city, growing population</li>
            <li><strong>Netanya (eastern neighborhoods):</strong> More affordable, decent yields</li>
          </ul>
          
          <h4 className="font-semibold mt-4">Appreciation Strategy (Capital Gains Focus):</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Tel Aviv:</strong> Limited supply, global city, lower yields but strong appreciation</li>
            <li><strong>Areas with new infrastructure:</strong> Light rail expansion, new highways</li>
            <li><strong>Up-and-coming neighborhoods:</strong> Jaffa, South Tel Aviv, Florentine</li>
          </ul>

          <h4 className="font-semibold mt-4">Balanced Approach:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Modi'in:</strong> Strong demand, family-oriented, stable appreciation</li>
            <li><strong>Petah Tikva:</strong> Close to tech hubs, improving infrastructure</li>
            <li><strong>Ra'anana (older buildings):</strong> Premium location, renovation potential</li>
          </ul>
          <Link to="/areas">
            <Button variant="outline" size="sm" className="gap-2 mt-4">
              <MapPin className="h-4 w-4" />
              Compare City Data
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: 'strategy',
      title: '5. Investment Strategies',
      icon: Target,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold">Strategy 1: Buy and Hold</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Long-term appreciation play</li>
            <li>Accept lower/negative cash flow</li>
            <li>Best in prime locations</li>
            <li>Requires patient capital</li>
          </ul>

          <h4 className="font-semibold mt-4">Strategy 2: Value-Add</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Buy undervalued properties needing renovation</li>
            <li>Improve and increase rent/value</li>
            <li>Higher returns but more work</li>
            <li>Consider TAMA 38 buildings</li>
          </ul>

          <h4 className="font-semibold mt-4">Strategy 3: New Construction</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Buy off-plan at developer prices</li>
            <li>Sell/rent upon completion at market prices</li>
            <li>No immediate rental income</li>
            <li>Developer risk considerations</li>
          </ul>

          <h4 className="font-semibold mt-4">Strategy 4: Short-Term Rentals</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Higher yields in tourist areas</li>
            <li>More management intensive</li>
            <li>Municipal regulations apply</li>
            <li>Tel Aviv, Jerusalem, Eilat</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'risks',
      title: '6. Risks & Considerations',
      icon: AlertTriangle,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">Key Risks:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Interest Rate Risk:</strong> Rising rates impact both mortgage payments 
              and property values
            </li>
            <li>
              <strong>Vacancy Risk:</strong> Periods without tenants, especially in 
              less desirable areas
            </li>
            <li>
              <strong>Tenant Risk:</strong> Israeli tenant protection laws are strong; 
              eviction can be lengthy
            </li>
            <li>
              <strong>Regulatory Risk:</strong> Government policies on housing, rent control discussions
            </li>
            <li>
              <strong>Currency Risk:</strong> For foreign investors, NIS/USD fluctuations
            </li>
            <li>
              <strong>Liquidity Risk:</strong> Real estate is not quickly convertible to cash
            </li>
          </ul>

          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <p className="text-sm">
              <strong>💡 Pro Tip:</strong> Always stress-test your investment at higher interest rates 
              and with a few months of vacancy built in.
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
                <TrendingUp className="h-4 w-4" />
                <span>Investment Guide</span>
                <span>•</span>
                <Clock className="h-4 w-4" />
                <span>22 min read</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Investment Property Guide
              </h1>
              
              <p className="text-lg text-muted-foreground">
                Maximize returns on Israeli real estate investments. Learn about yields, 
                tax implications, financing, and market analysis.
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
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-foreground">8%</div>
                <div className="text-xs text-muted-foreground">Min purchase tax</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">50%</div>
                <div className="text-xs text-muted-foreground">Max LTV</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">3-5%</div>
                <div className="text-xs text-muted-foreground">Typical yield range</div>
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
                  <p className="text-sm text-muted-foreground mt-1">The fundamentals of Israeli real estate</p>
                </Link>
                <Link to="/guides/new-vs-resale" className="p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors">
                  <h4 className="font-medium text-foreground">New Construction vs Resale</h4>
                  <p className="text-sm text-muted-foreground mt-1">Compare investment property types</p>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
