import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ArrowLeft, CheckCircle2, Receipt,
  Calculator, Home, Landmark, Users, FileText, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { GlossaryTooltip } from '@/components/shared/GlossaryTooltip';
import { usePurchaseTaxBrackets } from '@/hooks/usePurchaseTaxBrackets';

interface CostBreakdown {
  purchaseTax: number;
  lawyerFees: number;
  agentFees: number;
  mortgageFees: number;
  registrationFees: number;
  totalOneTime: number;
}

export function TrueCostWalkthrough() {
  const [currentStep, setCurrentStep] = useState(0);
  const [propertyPrice, setPropertyPrice] = useState(2500000);
  const [buyerType, setBuyerType] = useState<'first_time' | 'additional' | 'foreign'>('first_time');
  const [usesAgent, setUsesAgent] = useState(true);
  const [showResults, setShowResults] = useState(false);

  const { data: taxBrackets = [] } = usePurchaseTaxBrackets(buyerType);

  const calculatePurchaseTax = useMemo(() => {
    return (price: number): number => {
      if (!taxBrackets.length) {
        // Fallback estimates when no brackets loaded
        if (buyerType === 'first_time') {
          if (price <= 1919155) return 0;
          return Math.round(price * 0.035);
        }
        return Math.round(price * 0.08);
      }
      
      let tax = 0;
      let remainingPrice = price;
      
      for (const bracket of taxBrackets) {
        const bracketMax = bracket.bracket_max ?? Infinity;
        const bracketMin = bracket.bracket_min;
        const bracketSize = bracketMax - bracketMin;
        const amountInBracket = Math.min(Math.max(remainingPrice - bracketMin, 0), bracketSize);
        
        if (amountInBracket > 0) {
          tax += amountInBracket * (bracket.rate_percent / 100);
        }
      }
      
      return Math.round(tax);
    };
  }, [taxBrackets, buyerType]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(amount);
  };

  const calculateCosts = (): CostBreakdown => {
    const purchaseTax = calculatePurchaseTax(propertyPrice);
    const lawyerFees = Math.max(propertyPrice * 0.01, 15000) * 1.18; // 1% + VAT (18%), min 15k
    const agentFees = usesAgent ? propertyPrice * 0.02 * 1.18 : 0; // 2% + VAT (18%)
    const mortgageFees = 5000; // Approximate: appraisal + opening fees
    const registrationFees = 2000; // Tabu registration

    return {
      purchaseTax,
      lawyerFees,
      agentFees,
      mortgageFees,
      registrationFees,
      totalOneTime: purchaseTax + lawyerFees + agentFees + mortgageFees + registrationFees,
    };
  };

  const steps = [
    {
      id: 'price',
      title: 'Property Price',
      icon: Home,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Let's start with the property price. This is the foundation for calculating all your costs.
          </p>
          <div className="space-y-2">
            <Label htmlFor="price">Property Price (₪)</Label>
            <Input
              id="price"
              type="number"
              value={propertyPrice}
              onChange={(e) => setPropertyPrice(Number(e.target.value))}
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Enter the agreed purchase price
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'buyer-type',
      title: 'Buyer Profile',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Your buyer status significantly affects the <GlossaryTooltip term="מס רכישה">purchase tax</GlossaryTooltip> you'll pay.
          </p>
          <RadioGroup 
            value={buyerType} 
            onValueChange={(v) => setBuyerType(v as typeof buyerType)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="first_time" id="first" />
              <Label htmlFor="first" className="flex-1 cursor-pointer">
                <span className="font-medium">First-Time Buyer / Only Property</span>
                <p className="text-xs text-muted-foreground">
                  Israeli resident buying their only residential property
                </p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="additional" id="additional" />
              <Label htmlFor="additional" className="flex-1 cursor-pointer">
                <span className="font-medium">Additional Property</span>
                <p className="text-xs text-muted-foreground">
                  Already own residential property in Israel
                </p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="foreign" id="foreign" />
              <Label htmlFor="foreign" className="flex-1 cursor-pointer">
                <span className="font-medium">Foreign Resident</span>
                <p className="text-xs text-muted-foreground">
                  Not an Israeli resident for tax purposes
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>
      ),
    },
    {
      id: 'tax',
      title: 'Purchase Tax Explained',
      icon: Receipt,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            <GlossaryTooltip term="מס רכישה">Purchase tax (Mas Rechisha)</GlossaryTooltip> is Israel's 
            property transfer tax, paid to the tax authority within 50 days of signing.
          </p>
          
          <div className="bg-primary/5 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Your Estimated Purchase Tax</h4>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(calculatePurchaseTax(propertyPrice))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {((calculatePurchaseTax(propertyPrice) / propertyPrice) * 100).toFixed(2)}% of property price
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How it's calculated:</p>
            <p>Tax is applied in progressive brackets - similar to income tax. 
              Lower portions of the price are taxed at lower rates.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'professionals',
      title: 'Professional Fees',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            You'll need professional services to complete the purchase.
          </p>

          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-sm">
                    <GlossaryTooltip term="עורך דין">Lawyer (Orech Din)</GlossaryTooltip>
                  </h4>
                  <p className="text-xs text-muted-foreground">0.5-1.5% + VAT, minimum ~₪15,000</p>
                </div>
                <span className="font-semibold text-primary">
                  {formatCurrency(Math.max(propertyPrice * 0.01, 15000) * 1.18)}
                </span>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-sm">Real Estate Agent</h4>
                  <p className="text-xs text-muted-foreground">Typically 2% + VAT</p>
                </div>
                <div className="text-right">
                  <RadioGroup 
                    value={usesAgent ? 'yes' : 'no'} 
                    onValueChange={(v) => setUsesAgent(v === 'yes')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="agent-yes" />
                      <Label htmlFor="agent-yes" className="text-xs">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="agent-no" />
                      <Label htmlFor="agent-no" className="text-xs">No</Label>
                    </div>
                  </RadioGroup>
                  {usesAgent && (
                    <span className="text-sm font-semibold text-primary">
                      {formatCurrency(propertyPrice * 0.02 * 1.18)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'other',
      title: 'Other Costs',
      icon: Landmark,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Additional costs to budget for:
          </p>

          <div className="space-y-3">
            <div className="p-4 border rounded-lg flex justify-between">
              <div>
                <h4 className="font-semibold text-sm">Mortgage Fees</h4>
                <p className="text-xs text-muted-foreground">Appraisal, opening fees, etc.</p>
              </div>
              <span className="font-semibold">~₪5,000</span>
            </div>

            <div className="p-4 border rounded-lg flex justify-between">
              <div>
                <h4 className="font-semibold text-sm">
                  <GlossaryTooltip term="טאבו">Tabu</GlossaryTooltip> Registration
                </h4>
                <p className="text-xs text-muted-foreground">Land registry fees</p>
              </div>
              <span className="font-semibold">~₪2,000</span>
            </div>

            <div className="p-4 border rounded-lg flex justify-between bg-muted/50">
              <div>
                <h4 className="font-semibold text-sm">Moving & Setup</h4>
                <p className="text-xs text-muted-foreground">Moving, cleaning, minor fixes</p>
              </div>
              <span className="font-semibold text-muted-foreground">₪5,000-15,000</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: Renovation costs, if needed, are separate and can range from ₪50,000 to ₪300,000+
          </p>
        </div>
      ),
    },
  ];

  const costs = calculateCosts();
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (showResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Your Total Purchase Costs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/5 rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total One-Time Costs</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(costs.totalOneTime)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {((costs.totalOneTime / propertyPrice) * 100).toFixed(1)}% of property price
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Cost Breakdown:</h4>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span>Purchase Tax</span>
                <span className="font-medium">{formatCurrency(costs.purchaseTax)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Lawyer Fees</span>
                <span className="font-medium">{formatCurrency(costs.lawyerFees)}</span>
              </div>
              {costs.agentFees > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span>Agent Fees</span>
                  <span className="font-medium">{formatCurrency(costs.agentFees)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
                <span>Mortgage Fees</span>
                <span className="font-medium">{formatCurrency(costs.mortgageFees)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Registration Fees</span>
                <span className="font-medium">{formatCurrency(costs.registrationFees)}</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">Total Cash Needed</h4>
            <p className="text-muted-foreground text-sm">
              Property price + costs: <strong>{formatCurrency(propertyPrice + costs.totalOneTime)}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              (Before considering mortgage - you'll need at least 25-50% as down payment)
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => { setShowResults(false); setCurrentStep(0); }}>
              Recalculate
            </Button>
            <Link to="/tools?tool=totalcost">
              <Button variant="outline" className="gap-2">
                <Calculator className="h-4 w-4" />
                Detailed Calculator
              </Button>
            </Link>
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Download className="h-4 w-4" />
              Print Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CurrentIcon = steps[currentStep].icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CurrentIcon className="h-5 w-5 text-primary" />
            Calculate Your True Costs
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[280px]"
          >
            <h3 className="text-lg font-semibold mb-4">{steps[currentStep].title}</h3>
            {steps[currentStep].content}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          {currentStep === steps.length - 1 ? (
            <Button 
              onClick={() => setShowResults(true)}
              className="gap-2"
            >
              See Total Costs
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
