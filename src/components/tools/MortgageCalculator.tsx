import { useState, useMemo } from 'react';
import { Calculator, Info, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { calculateMortgagePayment } from '@/lib/calculations/mortgage';
import { calculatePurchaseTax } from '@/lib/calculations/purchaseTax';
import { 
  ToolLayout, 
  CurrencyProvider, 
  useCurrency, 
  ResultCard, 
  CashBreakdownTable, 
  LTVIndicator 
} from './shared';

type BuyerType = 'first_time' | 'upgrader' | 'investor' | 'oleh' | 'foreign' | 'company';

const BUYER_TYPE_OPTIONS: { value: BuyerType; label: string; maxLtv: number }[] = [
  { value: 'first_time', label: 'First-Time Buyer', maxLtv: 75 },
  { value: 'upgrader', label: 'Upgrading (Selling Current)', maxLtv: 70 },
  { value: 'investor', label: 'Additional Property', maxLtv: 50 },
  { value: 'oleh', label: 'Oleh Hadash (within 7 years)', maxLtv: 75 },
  { value: 'foreign', label: 'Non-Resident / Foreign', maxLtv: 50 },
  { value: 'company', label: 'Company Purchase', maxLtv: 50 },
];

const LOAN_TERMS = [5, 10, 15, 20, 25, 30];

function MortgageCalculatorContent() {
  const { formatCurrency } = useCurrency();
  
  // Core inputs
  const [propertyPrice, setPropertyPrice] = useState(2500000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(25);
  const [buyerType, setBuyerType] = useState<BuyerType>('first_time');
  const [loanTermYears, setLoanTermYears] = useState(25);
  const [interestRate, setInterestRate] = useState(4.5);
  
  // Assumptions (hidden by default)
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [includeTaxesInCash, setIncludeTaxesInCash] = useState(true);
  const [legalFeesPercent, setLegalFeesPercent] = useState(0.5);
  const [appraisalFee, setAppraisalFee] = useState(3000);
  const [bufferAmount, setBufferAmount] = useState(0);

  // Get max LTV for current buyer type
  const maxLtv = BUYER_TYPE_OPTIONS.find(b => b.value === buyerType)?.maxLtv || 75;
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

  // Cash needed breakdown
  const legalFees = (propertyPrice * legalFeesPercent) / 100;
  const purchaseTaxAmount = includeTaxesInCash ? purchaseTaxResult.totalTax : 0;
  const totalCashNeeded = downPaymentAmount + purchaseTaxAmount + legalFees + appraisalFee + bufferAmount;

  const cashBreakdownItems = [
    { label: 'Down Payment', value: formatCurrency(downPaymentAmount), percentage: `${effectiveDownPaymentPercent.toFixed(0)}%` },
    ...(includeTaxesInCash ? [{ label: 'Purchase Tax (Mas Rechisha)', value: formatCurrency(purchaseTaxAmount) }] : []),
    { label: 'Legal & Bank Fees', value: formatCurrency(legalFees) },
    { label: 'Appraisal Fee', value: formatCurrency(appraisalFee) },
    ...(bufferAmount > 0 ? [{ label: 'Buffer/Reserve', value: formatCurrency(bufferAmount) }] : []),
    { label: '', value: '', isSeparator: true },
    { label: 'Total Cash Needed', value: formatCurrency(totalCashNeeded), isTotal: true },
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Property Price</Label>
          <span className="text-lg font-semibold">{formatCurrency(propertyPrice)}</span>
        </div>
        <Slider
          value={[propertyPrice]}
          onValueChange={([v]) => setPropertyPrice(v)}
          min={500000}
          max={10000000}
          step={50000}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(500000)}</span>
          <span>{formatCurrency(10000000)}</span>
        </div>
      </div>

      {/* Buyer Type */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label className="text-sm font-medium">Buyer Type</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Your buyer type affects maximum loan-to-value (LTV) ratio and purchase tax rates.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select value={buyerType} onValueChange={handleBuyerTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BUYER_TYPE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Max LTV: {maxLtv}% · Min down payment: {minDownPayment}%
        </p>
      </div>

      {/* Down Payment */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Down Payment</Label>
          <div className="text-right">
            <span className="text-lg font-semibold">{formatCurrency(downPaymentAmount)}</span>
            <span className="text-sm text-muted-foreground ml-2">({effectiveDownPaymentPercent}%)</span>
          </div>
        </div>
        <Slider
          value={[effectiveDownPaymentPercent]}
          onValueChange={([v]) => setDownPaymentPercent(v)}
          min={minDownPayment}
          max={80}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{minDownPayment}%</span>
          <span>80%</span>
        </div>
      </div>

      {/* Loan Term */}
      <div className="space-y-2">
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

      {/* Interest Rate */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Interest Rate</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Blended rate across mortgage tracks. Typical rates range 4-6% depending on track mix.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-lg font-semibold">{interestRate.toFixed(1)}%</span>
        </div>
        <Slider
          value={[interestRate]}
          onValueChange={([v]) => setInterestRate(v)}
          min={3}
          max={8}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>3%</span>
          <span>8%</span>
        </div>
      </div>

      {/* Edit Assumptions */}
      <Collapsible open={showAssumptions} onOpenChange={setShowAssumptions}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
            <span>Edit Assumptions</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showAssumptions ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Include taxes in cash needed</Label>
            <Switch checked={includeTaxesInCash} onCheckedChange={setIncludeTaxesInCash} />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Legal & Bank Fees (%)</Label>
            <Input 
              type="number" 
              value={legalFeesPercent} 
              onChange={(e) => setLegalFeesPercent(Number(e.target.value))}
              step={0.1}
              min={0}
              max={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Appraisal Fee (₪)</Label>
            <Input 
              type="number" 
              value={appraisalFee} 
              onChange={(e) => setAppraisalFee(Number(e.target.value))}
              step={500}
              min={0}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Buffer/Reserve (₪)</Label>
            <Input 
              type="number" 
              value={bufferAmount} 
              onChange={(e) => setBufferAmount(Number(e.target.value))}
              step={5000}
              min={0}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  const rightColumn = (
    <div className="space-y-6">
      {/* Monthly Payment - Hero Result */}
      <ResultCard
        label="Monthly Payment"
        value={formatCurrency(mortgageResult.monthlyPayment)}
        variant="primary"
        size="lg"
      />

      {/* Loan Amount & LTV */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <p className="text-sm text-muted-foreground">Loan Amount</p>
          <p className="text-lg font-semibold">{formatCurrency(loanAmount)}</p>
        </div>
        <LTVIndicator ltv={ltv} maxLTV={maxLtv} />
      </div>

      {/* Total Interest */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Interest Over {loanTermYears} Years</span>
          <span className="font-medium">{formatCurrency(mortgageResult.totalInterest)}</span>
        </div>
      </div>

      {/* Cash Needed Breakdown */}
      <CashBreakdownTable
        title="Total Cash Needed to Close"
        items={cashBreakdownItems}
      />
    </div>
  );

  return (
    <ToolLayout
      title="Mortgage Calculator"
      subtitle="Estimate your monthly payment and cash needed to close"
      icon={<Calculator className="h-6 w-6" />}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      disclaimer="Estimates based on typical Israeli mortgage terms. Actual rates and terms depend on your bank and financial profile."
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
