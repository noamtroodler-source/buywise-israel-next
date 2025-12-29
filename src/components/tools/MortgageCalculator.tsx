import { useState, useMemo, useEffect } from 'react';
import { Calculator, Info, ChevronDown, TrendingUp, Wallet, PiggyBank } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
  CurrencyToggle,
  CashBreakdownTable, 
  LTVIndicator,
  ToolDisclaimer,
  InfoBanner,
  PaymentPieChart,
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

// Format number with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

// Parse formatted number string to number
const parseFormattedNumber = (str: string): number => {
  const cleaned = str.replace(/[^\d.-]/g, '');
  return Number(cleaned) || 0;
};

function MortgageCalculatorContent() {
  const { formatCurrency, formatCurrencyShort } = useCurrency();
  const { data: buyerProfile, isLoading: isProfileLoading } = useBuyerProfile();
  
  // Core inputs
  const [propertyPrice, setPropertyPrice] = useState(3000000);
  const [propertyPriceInput, setPropertyPriceInput] = useState('3,000,000');
  const [downPaymentPercent, setDownPaymentPercent] = useState(25);
  const [downPaymentInput, setDownPaymentInput] = useState('25');
  const [downPaymentMode, setDownPaymentMode] = useState<'percent' | 'amount'>('percent');
  const [buyerType, setBuyerType] = useState<BuyerType>('first_time');
  const [loanTermYears, setLoanTermYears] = useState(25);
  const [interestRate, setInterestRate] = useState(5.0);
  const [interestRateInput, setInterestRateInput] = useState('5.0');
  
  // Assumptions (hidden by default)
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [includeTaxesInCash, setIncludeTaxesInCash] = useState(true);
  const [legalFeesPercent, setLegalFeesPercent] = useState(0.5);
  const [legalFeesInput, setLegalFeesInput] = useState('0.5');
  const [appraisalFee, setAppraisalFee] = useState(3000);
  const [appraisalFeeInput, setAppraisalFeeInput] = useState('3,000');
  const [bufferAmount, setBufferAmount] = useState(0);
  const [bufferAmountInput, setBufferAmountInput] = useState('0');

  // Set buyer type from profile when loaded
  useEffect(() => {
    if (buyerProfile && !isProfileLoading) {
      const profileCategory = getBuyerTaxCategory(buyerProfile);
      const categoryMapping: Record<string, BuyerType> = {
        'first_time': 'first_time',
        'oleh': 'oleh',
        'additional': 'investor',
        'non_resident': 'foreign',
      };
      const mappedType = categoryMapping[profileCategory] || 'first_time';
      setBuyerType(mappedType);
      
      const newMinDown = 100 - (BUYER_TYPE_OPTIONS.find(b => b.value === mappedType)?.maxLtv || 75);
      if (downPaymentPercent < newMinDown) {
        setDownPaymentPercent(newMinDown);
        setDownPaymentInput(newMinDown.toString());
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

  // Monthly principal & interest breakdown
  const monthlyPrincipal = useMemo(() => {
    return mortgageResult.monthlyPayment - (loanAmount * (interestRate / 100 / 12));
  }, [mortgageResult.monthlyPayment, loanAmount, interestRate]);

  const monthlyInterest = mortgageResult.monthlyPayment - monthlyPrincipal;

  // Additional fees
  const legalFees = Math.round((propertyPrice * legalFeesPercent) / 100);
  const bankFees = Math.round(loanAmount * 0.004);

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

  // Handle buyer type change
  const handleBuyerTypeChange = (value: BuyerType) => {
    setBuyerType(value);
    const newMinDown = 100 - (BUYER_TYPE_OPTIONS.find(b => b.value === value)?.maxLtv || 75);
    if (downPaymentPercent < newMinDown) {
      setDownPaymentPercent(newMinDown);
      setDownPaymentInput(newMinDown.toString());
    }
  };

  // Property price handlers
  const handlePropertyPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPropertyPriceInput(e.target.value);
  };

  const handlePropertyPriceBlur = () => {
    let value = parseFormattedNumber(propertyPriceInput);
    value = Math.max(500000, Math.min(15000000, value));
    setPropertyPrice(value);
    setPropertyPriceInput(formatNumber(value));
    
    if (downPaymentMode === 'amount') {
      const newDownAmount = (value * effectiveDownPaymentPercent) / 100;
      setDownPaymentInput(formatNumber(Math.round(newDownAmount)));
    }
  };

  // Down payment handlers
  const handleDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDownPaymentInput(e.target.value);
  };

  const handleDownPaymentBlur = () => {
    if (downPaymentMode === 'percent') {
      let value = parseFloat(downPaymentInput) || minDownPayment;
      value = Math.max(minDownPayment, Math.min(80, value));
      setDownPaymentPercent(value);
      setDownPaymentInput(value.toString());
    } else {
      let amount = parseFormattedNumber(downPaymentInput);
      const minAmount = (propertyPrice * minDownPayment) / 100;
      const maxAmount = propertyPrice * 0.8;
      amount = Math.max(minAmount, Math.min(maxAmount, amount));
      const percent = (amount / propertyPrice) * 100;
      setDownPaymentPercent(percent);
      setDownPaymentInput(formatNumber(Math.round(amount)));
    }
  };

  const toggleDownPaymentMode = () => {
    if (downPaymentMode === 'percent') {
      setDownPaymentMode('amount');
      setDownPaymentInput(formatNumber(Math.round(downPaymentAmount)));
    } else {
      setDownPaymentMode('percent');
      setDownPaymentInput(effectiveDownPaymentPercent.toFixed(0));
    }
  };

  // Interest rate handlers
  const handleInterestRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInterestRateInput(e.target.value);
  };

  const handleInterestRateBlur = () => {
    let value = parseFloat(interestRateInput) || 5.0;
    value = Math.max(3, Math.min(8, value));
    setInterestRate(value);
    setInterestRateInput(value.toFixed(1));
  };

  // Legal fees handlers
  const handleLegalFeesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLegalFeesInput(e.target.value);
  };

  const handleLegalFeesBlur = () => {
    let value = parseFloat(legalFeesInput) || 0.5;
    value = Math.max(0.3, Math.min(1, value));
    setLegalFeesPercent(value);
    setLegalFeesInput(value.toFixed(1));
  };

  // Appraisal fee handlers
  const handleAppraisalFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppraisalFeeInput(e.target.value);
  };

  const handleAppraisalFeeBlur = () => {
    let value = parseFormattedNumber(appraisalFeeInput);
    value = Math.max(1500, Math.min(6000, value));
    setAppraisalFee(value);
    setAppraisalFeeInput(formatNumber(value));
  };

  // Buffer amount handlers
  const handleBufferAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBufferAmountInput(e.target.value);
  };

  const handleBufferAmountBlur = () => {
    let value = parseFormattedNumber(bufferAmountInput);
    value = Math.max(0, Math.min(500000, value));
    setBufferAmount(value);
    setBufferAmountInput(formatNumber(value));
  };

  // Input field component for cleaner code
  const InputField = ({ 
    label, 
    tooltip, 
    prefix, 
    suffix, 
    value, 
    onChange, 
    onBlur, 
    placeholder,
    helperText,
    inputMode = 'numeric'
  }: {
    label: string;
    tooltip?: string;
    prefix?: string;
    suffix?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    placeholder: string;
    helperText?: string;
    inputMode?: 'numeric' | 'decimal' | 'text';
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm">{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{prefix}</span>
        )}
        <Input
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={cn(
            "text-base font-medium h-11 transition-all focus:ring-2 focus:ring-primary/20",
            prefix && "pl-8",
            suffix && "pr-8"
          )}
          placeholder={placeholder}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{suffix}</span>
        )}
      </div>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );

  const leftColumn = (
    <div className="space-y-5">
      {/* Card 1: Property & Financing */}
      <Card className="p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Wallet className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">Property & Financing</h3>
        </div>

        <InputField
          label="Property Price"
          prefix="₪"
          value={propertyPriceInput}
          onChange={handlePropertyPriceChange}
          onBlur={handlePropertyPriceBlur}
          placeholder="3,000,000"
          helperText="₪500K – ₪15M"
        />

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium text-foreground">Buyer Type</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                Your buyer type determines maximum loan-to-value ratio (LTV) and purchase tax rates under Israeli regulations.
              </TooltipContent>
            </Tooltip>
          </div>
          <Select value={buyerType} onValueChange={handleBuyerTypeChange}>
            <SelectTrigger className="h-11 transition-all focus:ring-2 focus:ring-primary/20">
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
            Max LTV: {maxLtv}% · Min down: {minDownPayment}%
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium text-foreground">Down Payment</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                  Cash you pay upfront. Bank of Israel sets minimum requirements based on buyer type.
                </TooltipContent>
              </Tooltip>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10"
              onClick={toggleDownPaymentMode}
            >
              Switch to {downPaymentMode === 'percent' ? '₪' : '%'}
            </Button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              {downPaymentMode === 'percent' ? '%' : '₪'}
            </span>
            <Input
              type="text"
              inputMode="numeric"
              value={downPaymentInput}
              onChange={handleDownPaymentChange}
              onBlur={handleDownPaymentBlur}
              className="pl-8 text-base font-medium h-11 transition-all focus:ring-2 focus:ring-primary/20"
              placeholder={downPaymentMode === 'percent' ? '25' : '750,000'}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {downPaymentMode === 'percent' 
              ? `= ${formatCurrencyShort(downPaymentAmount)} · Min ${minDownPayment}%`
              : `= ${effectiveDownPaymentPercent.toFixed(1)}% of price`
            }
          </p>
        </div>
      </Card>

      {/* Card 2: Loan Terms */}
      <Card className="p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">Loan Terms</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Loan Term</Label>
            <Select value={loanTermYears.toString()} onValueChange={(v) => setLoanTermYears(Number(v))}>
              <SelectTrigger className="h-11 transition-all focus:ring-2 focus:ring-primary/20">
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

          <InputField
            label="Interest Rate"
            tooltip="Blended rate across mortgage tracks. Israeli mortgages typically combine Prime, Fixed, and CPI-linked tracks."
            suffix="%"
            value={interestRateInput}
            onChange={handleInterestRateChange}
            onBlur={handleInterestRateBlur}
            placeholder="5.0"
            inputMode="decimal"
          />
        </div>
        <p className="text-xs text-muted-foreground">Typical rates: 4.0% – 6.0%</p>
      </Card>

      {/* Card 3: Advanced Options */}
      <Collapsible open={showAssumptions} onOpenChange={setShowAssumptions}>
        <CollapsibleTrigger asChild>
          <Card className="p-4 cursor-pointer hover:bg-muted/30 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Advanced Options</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", showAssumptions && "rotate-180")} />
            </div>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="p-6 mt-2 space-y-5 shadow-sm">
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm text-foreground">Include Purchase Tax</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-sm">
                    Include Mas Rechisha in total cash needed calculation
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch checked={includeTaxesInCash} onCheckedChange={setIncludeTaxesInCash} />
            </div>
            
            <InputField
              label="Legal & Registration Fees"
              suffix="%"
              value={legalFeesInput}
              onChange={handleLegalFeesChange}
              onBlur={handleLegalFeesBlur}
              placeholder="0.5"
              helperText="0.3% – 1.0%"
              inputMode="decimal"
            />
            
            <InputField
              label="Appraisal Fee"
              prefix="₪"
              value={appraisalFeeInput}
              onChange={handleAppraisalFeeChange}
              onBlur={handleAppraisalFeeBlur}
              placeholder="3,000"
              helperText="Typical: ₪1,500 – ₪6,000"
            />
            
            <InputField
              label="Reserve Buffer"
              prefix="₪"
              value={bufferAmountInput}
              onChange={handleBufferAmountChange}
              onBlur={handleBufferAmountBlur}
              placeholder="0"
              helperText="Optional emergency fund"
            />
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  const rightColumn = (
    <div className="space-y-4">
      {/* Hero: Monthly Payment */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Payment</p>
        <p className="text-4xl font-bold text-primary tracking-tight">
          {formatCurrency(mortgageResult.monthlyPayment)}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Over {loanTermYears} years at {interestRate.toFixed(1)}% interest
        </p>
      </Card>

      {/* Payment Breakdown Pie Chart */}
      <Card className="p-5 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground mb-2">First Month Breakdown</p>
        <PaymentPieChart
          principal={Math.max(0, monthlyPrincipal)}
          interest={monthlyInterest}
          formatValue={formatCurrency}
        />
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Principal</p>
            <p className="text-base font-semibold">{formatCurrency(Math.max(0, monthlyPrincipal))}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Interest</p>
            <p className="text-base font-semibold">{formatCurrency(monthlyInterest)}</p>
          </div>
        </div>
      </Card>

      {/* Loan Amount & LTV */}
      <Card className="p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Loan Amount</span>
          <span className="text-lg font-bold">{formatCurrency(loanAmount)}</span>
        </div>
        <LTVIndicator ltv={ltv} maxLTV={maxLtv} />
      </Card>

      {/* Total Interest */}
      <Card className="p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Interest Paid</p>
            <p className="text-xs text-muted-foreground mt-0.5">Over {loanTermYears} years</p>
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(mortgageResult.totalInterest)}</p>
        </div>
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Repayment</span>
            <span className="font-semibold">{formatCurrency(mortgageResult.totalPayment)}</span>
          </div>
        </div>
      </Card>

      {/* Cash Needed Breakdown */}
      <Card className="p-5 shadow-sm">
        <CashBreakdownTable
          title="Cash Needed to Close"
          items={cashBreakdownItems}
        />
      </Card>
    </div>
  );

  return (
    <ToolLayout
      title="Mortgage Calculator"
      subtitle="Estimate your monthly payment and total cash needed"
      icon={<Calculator className="h-6 w-6" />}
      headerActions={<CurrencyToggle />}
      infoBanner={
        buyerProfile ? (
          <InfoBanner variant="info">
            Calculations reflect your profile as a <strong>{currentBuyerType?.label.toLowerCase()}</strong>.
          </InfoBanner>
        ) : undefined
      }
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      disclaimer={
        <ToolDisclaimer 
          text="Estimates based on Israeli mortgage regulations (2024). Actual terms depend on your bank, credit profile, and market conditions. Consult a licensed mortgage advisor for personalized advice."
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
