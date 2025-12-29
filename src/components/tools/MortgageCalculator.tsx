import { useState, useMemo, useEffect } from 'react';
import { Calculator, Info, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { calculateMortgagePayment } from '@/lib/calculations/mortgage';
import { calculatePurchaseTax, BuyerType } from '@/lib/calculations/purchaseTax';
import { useBuyerProfile, getBuyerTaxCategory } from '@/hooks/useBuyerProfile';
import { 
  ToolLayout, 
  CurrencyProvider, 
  useCurrency, 
  ResultCard, 
  CashBreakdownTable, 
  LTVIndicator,
  ToolDisclaimer,
  InfoBanner,
} from './shared';

// Buyer types with their max LTV limits and descriptions
const BUYER_TYPE_OPTIONS: { 
  value: BuyerType; 
  label: string; 
  maxLtv: number;
  description: string;
}[] = [
  { value: 'first_time', label: 'First-Time Buyer', maxLtv: 75, description: 'Israeli resident purchasing first property' },
  { value: 'upgrader', label: 'Upgrading (Selling Current)', maxLtv: 70, description: 'Selling current home within 18 months' },
  { value: 'investor', label: 'Additional Property', maxLtv: 50, description: 'Keeping existing property' },
  { value: 'oleh', label: 'Oleh Hadash (within 7 years)', maxLtv: 75, description: 'New immigrant with tax benefits' },
  { value: 'foreign', label: 'Non-Resident / Foreign', maxLtv: 50, description: 'Not an Israeli tax resident' },
  { value: 'company', label: 'Company Purchase', maxLtv: 50, description: 'Purchasing through a company' },
];

const LOAN_TERMS = [5, 10, 15, 20, 25, 30];

function MortgageCalculatorContent() {
  const { formatCurrency, formatCurrencyShort } = useCurrency();
  const { data: buyerProfile, isLoading: isProfileLoading } = useBuyerProfile();
  
  // Core inputs
  const [propertyPrice, setPropertyPrice] = useState(3000000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(25);
  const [buyerType, setBuyerType] = useState<BuyerType>('first_time');
  const [loanTermYears, setLoanTermYears] = useState(25);
  const [interestRate, setInterestRate] = useState(5.0);
  
  // Assumptions (hidden by default)
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [includeTaxesInCash, setIncludeTaxesInCash] = useState(true);
  const [legalFeesPercent, setLegalFeesPercent] = useState(0.5);
  const [appraisalFee, setAppraisalFee] = useState(3000);
  const [bufferAmount, setBufferAmount] = useState(0);

  // Set buyer type from profile when loaded
  useEffect(() => {
    if (buyerProfile && !isProfileLoading) {
      const profileCategory = getBuyerTaxCategory(buyerProfile);
      // Map profile category to our buyer types
      const categoryMapping: Record<string, BuyerType> = {
        'first_time': 'first_time',
        'oleh': 'oleh',
        'additional': 'investor',
        'non_resident': 'foreign',
      };
      const mappedType = categoryMapping[profileCategory] || 'first_time';
      setBuyerType(mappedType);
      
      // Adjust down payment if needed
      const newMinDown = 100 - (BUYER_TYPE_OPTIONS.find(b => b.value === mappedType)?.maxLtv || 75);
      if (downPaymentPercent < newMinDown) {
        setDownPaymentPercent(newMinDown);
      }
    }
  }, [buyerProfile, isProfileLoading]);

  // Get max LTV for current buyer type
  const currentBuyerType = BUYER_TYPE_OPTIONS.find(b => b.value === buyerType);
  const maxLtv = currentBuyerType?.maxLtv || 75;
  const minDownPayment = 100 - maxLtv;

  // Ensure down payment respects buyer type limits
  const effectiveDownPaymentPercent = Math.max(downPaymentPercent, minDownPayment);
  
  // Calculate amounts
  const downPaymentAmount = (propertyPrice * effectiveDownPaymentPercent) / 100;
  const loanAmount = propertyPrice - downPaymentAmount;
  const ltv = ((loanAmount / propertyPrice) * 100);

  // Mortgage calculation
  const mortgageResult = useMemo(() => {
    return calculateMortgagePayment(loanAmount, interestRate, loanTermYears);
  }, [loanAmount, interestRate, loanTermYears]);

  // Purchase tax calculation
  const purchaseTaxResult = useMemo(() => {
    return calculatePurchaseTax(propertyPrice, buyerType);
  }, [propertyPrice, buyerType]);

  // Additional fees
  const legalFees = Math.round((propertyPrice * legalFeesPercent) / 100);
  const bankFees = Math.round(loanAmount * 0.004); // ~0.4% of loan amount

  // Cash needed breakdown
  const purchaseTaxAmount = includeTaxesInCash ? purchaseTaxResult.totalTax : 0;
  const totalCashNeeded = downPaymentAmount + purchaseTaxAmount + legalFees + bankFees + appraisalFee + bufferAmount;

  const cashBreakdownItems = [
    { 
      label: 'Down Payment', 
      value: formatCurrency(downPaymentAmount), 
      percentage: `${effectiveDownPaymentPercent.toFixed(0)}%` 
    },
    ...(includeTaxesInCash ? [{ 
      label: 'Purchase Tax (Mas Rechisha)', 
      value: formatCurrency(purchaseTaxAmount),
      tooltip: 'Tax paid to the government on property purchases. Rate varies by buyer type and property value.'
    }] : []),
    { 
      label: 'Legal & Registration Fees', 
      value: formatCurrency(legalFees),
      tooltip: 'Attorney fees for contract review and Land Registry (Tabu) registration.'
    },
    { 
      label: 'Bank Fees', 
      value: formatCurrency(bankFees),
      tooltip: 'Mortgage origination and processing fees charged by the bank (~0.4% of loan).'
    },
    { 
      label: 'Appraisal Fee', 
      value: formatCurrency(appraisalFee),
      tooltip: 'Property valuation required by the bank before mortgage approval.'
    },
    ...(bufferAmount > 0 ? [{ label: 'Reserve Buffer', value: formatCurrency(bufferAmount) }] : []),
    { label: '', value: '', isSeparator: true },
    { label: 'Total Cash Needed', value: formatCurrency(totalCashNeeded), isTotal: true, highlight: 'positive' as const },
  ];

  // Handle buyer type change - adjust down payment if needed
  const handleBuyerTypeChange = (value: BuyerType) => {
    setBuyerType(value);
    const newMinDown = 100 - (BUYER_TYPE_OPTIONS.find(b => b.value === value)?.maxLtv || 75);
    if (downPaymentPercent < newMinDown) {
      setDownPaymentPercent(newMinDown);
    }
  };

  const leftColumn = (
    <div className="space-y-6">
      {/* Property Price */}
      <Card className="p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Property Price</Label>
            <span className="text-lg font-bold text-foreground">{formatCurrencyShort(propertyPrice)}</span>
          </div>
          <Slider
            value={[propertyPrice]}
            onValueChange={([v]) => setPropertyPrice(v)}
            min={500000}
            max={15000000}
            step={50000}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrencyShort(500000)}</span>
            <span>{formatCurrencyShort(15000000)}</span>
          </div>
        </div>
      </Card>

      {/* Buyer Type */}
      <Card className="p-5">
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Buyer Type</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Your buyer type determines maximum loan-to-value ratio (LTV) and purchase tax rates under Israeli regulations.
              </TooltipContent>
            </Tooltip>
          </div>
          <Select value={buyerType} onValueChange={handleBuyerTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUYER_TYPE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col items-start py-1">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-primary font-medium">
            Max LTV: {maxLtv}% · Min down payment: {minDownPayment}%
          </p>
        </div>
      </Card>

      {/* Down Payment */}
      <Card className="p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium">Down Payment</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  The cash you pay upfront. Bank of Israel sets minimum requirements based on buyer type to manage lending risk.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-foreground">{effectiveDownPaymentPercent}%</span>
              <span className="text-sm text-muted-foreground ml-2">({formatCurrencyShort(downPaymentAmount)})</span>
            </div>
          </div>
          <Slider
            value={[effectiveDownPaymentPercent]}
            onValueChange={([v]) => setDownPaymentPercent(v)}
            min={minDownPayment}
            max={80}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{minDownPayment}% (min)</span>
            <span>80%</span>
          </div>
        </div>
      </Card>

      {/* Loan Term */}
      <Card className="p-5">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Loan Term</Label>
          <Select value={loanTermYears.toString()} onValueChange={(v) => setLoanTermYears(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOAN_TERMS.map(term => (
                <SelectItem key={term} value={term.toString()}>
                  {term} years
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Interest Rate */}
      <Card className="p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium">Interest Rate</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Blended rate across mortgage tracks. Israeli mortgages typically combine Prime, Fixed, and CPI-linked tracks with rates ranging 4-6%.
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-lg font-bold text-foreground">{interestRate.toFixed(1)}%</span>
          </div>
          <Slider
            value={[interestRate]}
            onValueChange={([v]) => setInterestRate(v)}
            min={3}
            max={8}
            step={0.1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>3%</span>
            <span>8%</span>
          </div>
        </div>
      </Card>

      {/* Edit Assumptions */}
      <Collapsible open={showAssumptions} onOpenChange={setShowAssumptions}>
        <CollapsibleTrigger asChild>
          <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Advanced Options</span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showAssumptions && "rotate-180")} />
            </div>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="p-5 mt-2 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Include Purchase Tax</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Include Mas Rechisha in total cash needed calculation
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch checked={includeTaxesInCash} onCheckedChange={setIncludeTaxesInCash} />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Legal & Registration Fees</Label>
                <span className="text-sm font-medium">{legalFeesPercent}%</span>
              </div>
              <Slider
                value={[legalFeesPercent]}
                onValueChange={([v]) => setLegalFeesPercent(v)}
                min={0.3}
                max={1}
                step={0.1}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Appraisal Fee</Label>
                <span className="text-sm font-medium">{formatCurrency(appraisalFee)}</span>
              </div>
              <Slider
                value={[appraisalFee]}
                onValueChange={([v]) => setAppraisalFee(v)}
                min={1500}
                max={6000}
                step={500}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Reserve Buffer</Label>
                <span className="text-sm font-medium">{formatCurrency(bufferAmount)}</span>
              </div>
              <Slider
                value={[bufferAmount]}
                onValueChange={([v]) => setBufferAmount(v)}
                min={0}
                max={100000}
                step={5000}
              />
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  const rightColumn = (
    <div className="space-y-4">
      {/* Monthly Payment - Hero Result */}
      <ResultCard
        label="Monthly Payment"
        value={formatCurrency(mortgageResult.monthlyPayment)}
        variant="primary"
        size="lg"
      />

      {/* Loan Amount & LTV */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Loan Amount</span>
          <span className="text-base font-semibold">{formatCurrency(loanAmount)}</span>
        </div>
        <LTVIndicator ltv={ltv} maxLTV={maxLtv} />
      </Card>

      {/* Total Interest */}
      <ResultCard
        label="Total Interest Over Term"
        value={formatCurrency(mortgageResult.totalInterest)}
        sublabel={`${loanTermYears} years · ${interestRate.toFixed(1)}% rate`}
        variant="default"
      />

      {/* Cash Needed Breakdown */}
      <Card className="p-5">
        <CashBreakdownTable
          title="Total Cash Needed to Close"
          items={cashBreakdownItems}
        />
      </Card>
    </div>
  );

  return (
    <ToolLayout
      title="Mortgage Calculator"
      subtitle="Estimate your monthly payment and total cash needed to close"
      icon={<Calculator className="h-6 w-6" />}
      infoBanner={
        buyerProfile ? (
          <InfoBanner variant="info">
            Your buyer profile has been loaded. Calculations reflect your status as a {currentBuyerType?.label.toLowerCase()}.
          </InfoBanner>
        ) : undefined
      }
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      disclaimer={
        <ToolDisclaimer 
          text="This calculator provides estimates based on Israeli mortgage regulations as of 2024. Actual terms depend on your bank, credit profile, and market conditions. Consult a licensed mortgage advisor for personalized advice."
        />
      }
    />
  );
}

export function MortgageCalculator() {
  return (
    <CurrencyProvider>
      <MortgageCalculatorContent />
    </CurrencyProvider>
  );
}
