import { useState, useMemo, useEffect, useCallback } from 'react';
import { Calculator, Info, ChevronDown, TrendingUp, Wallet, PiggyBank, RotateCcw, Share2, Save, ExternalLink, ArrowRight } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
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

// Default values for reset
const DEFAULTS = {
  propertyPrice: 3000000,
  downPaymentPercent: 25,
  buyerType: 'first_time' as BuyerType,
  loanTermYears: 25,
  interestRate: 5.0,
  legalFeesPercent: 0.5,
  appraisalFee: 3000,
  bufferAmount: 0,
  includeTaxesInCash: true,
};

// Median Israeli household income (monthly) for context
const MEDIAN_HOUSEHOLD_INCOME = 18000;

// Format number with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

// Parse formatted number string to number
const parseFormattedNumber = (str: string): number => {
  const cleaned = str.replace(/[^\d.-]/g, '');
  return Number(cleaned) || 0;
};

// Storage key for saved calculations
const STORAGE_KEY = 'mortgage-calculator-saved';

function MortgageCalculatorContent() {
  const { formatCurrency, formatCurrencyShort } = useCurrency();
  const { data: buyerProfile, isLoading: isProfileLoading } = useBuyerProfile();
  const { toast } = useToast();
  
  // Core inputs
  const [propertyPrice, setPropertyPrice] = useState(DEFAULTS.propertyPrice);
  const [propertyPriceInput, setPropertyPriceInput] = useState(formatNumber(DEFAULTS.propertyPrice));
  const [downPaymentPercent, setDownPaymentPercent] = useState(DEFAULTS.downPaymentPercent);
  const [downPaymentInput, setDownPaymentInput] = useState(DEFAULTS.downPaymentPercent.toString());
  const [downPaymentMode, setDownPaymentMode] = useState<'percent' | 'amount'>('percent');
  const [buyerType, setBuyerType] = useState<BuyerType>(DEFAULTS.buyerType);
  const [loanTermYears, setLoanTermYears] = useState(DEFAULTS.loanTermYears);
  const [interestRate, setInterestRate] = useState(DEFAULTS.interestRate);
  const [interestRateInput, setInterestRateInput] = useState(DEFAULTS.interestRate.toFixed(1));
  
  // Assumptions (hidden by default)
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [includeTaxesInCash, setIncludeTaxesInCash] = useState(DEFAULTS.includeTaxesInCash);
  const [legalFeesPercent, setLegalFeesPercent] = useState(DEFAULTS.legalFeesPercent);
  const [legalFeesInput, setLegalFeesInput] = useState(DEFAULTS.legalFeesPercent.toFixed(1));
  const [appraisalFee, setAppraisalFee] = useState(DEFAULTS.appraisalFee);
  const [appraisalFeeInput, setAppraisalFeeInput] = useState(formatNumber(DEFAULTS.appraisalFee));
  const [bufferAmount, setBufferAmount] = useState(DEFAULTS.bufferAmount);
  const [bufferAmountInput, setBufferAmountInput] = useState(formatNumber(DEFAULTS.bufferAmount));

  // Validation states
  const [validationStates, setValidationStates] = useState<Record<string, boolean>>({});

  // Update validation state helper
  const updateValidation = useCallback((field: string, isValid: boolean) => {
    setValidationStates(prev => ({ ...prev, [field]: isValid }));
  }, []);

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

  // Payment as percentage of median income (for context)
  const paymentToIncomePercent = Math.round((mortgageResult.monthlyPayment / MEDIAN_HOUSEHOLD_INCOME) * 100);

  // What-if scenarios for down payment
  const whatIfScenarios = useMemo(() => {
    const scenarios = [
      { label: '+5%', addPercent: 5 },
      { label: '+10%', addPercent: 10 },
      { label: 'Max', addPercent: 80 - effectiveDownPaymentPercent },
    ].filter(s => effectiveDownPaymentPercent + s.addPercent <= 80);

    return scenarios.map(scenario => {
      const newPercent = Math.min(80, effectiveDownPaymentPercent + scenario.addPercent);
      const newDown = (propertyPrice * newPercent) / 100;
      const newLoan = propertyPrice - newDown;
      const result = calculateMortgagePayment(newLoan, interestRate, loanTermYears);
      const diff = mortgageResult.monthlyPayment - result.monthlyPayment;
      return {
        label: scenario.label === 'Max' ? `Max (${Math.round(newPercent)}%)` : scenario.label,
        newPercent,
        monthlyPayment: result.monthlyPayment,
        savings: diff,
        extraCash: newDown - downPaymentAmount,
      };
    });
  }, [propertyPrice, effectiveDownPaymentPercent, interestRate, loanTermYears, mortgageResult.monthlyPayment, downPaymentAmount]);

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

  // Live update helper - update value immediately as user types
  const handleLiveUpdate = useCallback((
    value: string,
    setter: (v: number) => void,
    min: number,
    max: number,
    isFormatted: boolean = false
  ) => {
    const parsed = isFormatted ? parseFormattedNumber(value) : parseFloat(value);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      setter(clamped);
    }
  }, []);

  // Property price handlers
  const handlePropertyPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPropertyPriceInput(value);
    handleLiveUpdate(value, setPropertyPrice, 500000, 15000000, true);
    updateValidation('propertyPrice', parseFormattedNumber(value) >= 500000 && parseFormattedNumber(value) <= 15000000);
  };

  const handlePropertyPriceBlur = () => {
    let value = parseFormattedNumber(propertyPriceInput);
    value = Math.max(500000, Math.min(15000000, value));
    setPropertyPrice(value);
    setPropertyPriceInput(formatNumber(value));
    updateValidation('propertyPrice', true);
    
    if (downPaymentMode === 'amount') {
      const newDownAmount = (value * effectiveDownPaymentPercent) / 100;
      setDownPaymentInput(formatNumber(Math.round(newDownAmount)));
    }
  };

  // Down payment handlers
  const handleDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDownPaymentInput(value);
    if (downPaymentMode === 'percent') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        setDownPaymentPercent(Math.max(minDownPayment, Math.min(80, parsed)));
        updateValidation('downPayment', parsed >= minDownPayment && parsed <= 80);
      }
    } else {
      const parsed = parseFormattedNumber(value);
      if (!isNaN(parsed)) {
        const percent = (parsed / propertyPrice) * 100;
        setDownPaymentPercent(Math.max(minDownPayment, Math.min(80, percent)));
        updateValidation('downPayment', percent >= minDownPayment && percent <= 80);
      }
    }
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
    updateValidation('downPayment', true);
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

  // Apply what-if scenario
  const applyWhatIfScenario = (newPercent: number) => {
    setDownPaymentPercent(newPercent);
    setDownPaymentInput(downPaymentMode === 'percent' 
      ? newPercent.toString() 
      : formatNumber(Math.round((propertyPrice * newPercent) / 100))
    );
    toast({
      title: "Down payment updated",
      description: `Set to ${newPercent.toFixed(0)}%`,
    });
  };

  // Interest rate handlers
  const handleInterestRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInterestRateInput(value);
    handleLiveUpdate(value, setInterestRate, 3, 8, false);
    const parsed = parseFloat(value);
    updateValidation('interestRate', !isNaN(parsed) && parsed >= 3 && parsed <= 8);
  };

  const handleInterestRateBlur = () => {
    let value = parseFloat(interestRateInput) || 5.0;
    value = Math.max(3, Math.min(8, value));
    setInterestRate(value);
    setInterestRateInput(value.toFixed(1));
    updateValidation('interestRate', true);
  };

  // Legal fees handlers
  const handleLegalFeesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLegalFeesInput(value);
    handleLiveUpdate(value, setLegalFeesPercent, 0.3, 1, false);
  };

  const handleLegalFeesBlur = () => {
    let value = parseFloat(legalFeesInput) || 0.5;
    value = Math.max(0.3, Math.min(1, value));
    setLegalFeesPercent(value);
    setLegalFeesInput(value.toFixed(1));
  };

  // Appraisal fee handlers
  const handleAppraisalFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAppraisalFeeInput(value);
    handleLiveUpdate(value, setAppraisalFee, 1500, 6000, true);
  };

  const handleAppraisalFeeBlur = () => {
    let value = parseFormattedNumber(appraisalFeeInput);
    value = Math.max(1500, Math.min(6000, value));
    setAppraisalFee(value);
    setAppraisalFeeInput(formatNumber(value));
  };

  // Buffer amount handlers
  const handleBufferAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBufferAmountInput(value);
    handleLiveUpdate(value, setBufferAmount, 0, 500000, true);
  };

  const handleBufferAmountBlur = () => {
    let value = parseFormattedNumber(bufferAmountInput);
    value = Math.max(0, Math.min(500000, value));
    setBufferAmount(value);
    setBufferAmountInput(formatNumber(value));
  };

  // Reset to defaults
  const handleReset = () => {
    setPropertyPrice(DEFAULTS.propertyPrice);
    setPropertyPriceInput(formatNumber(DEFAULTS.propertyPrice));
    setDownPaymentPercent(DEFAULTS.downPaymentPercent);
    setDownPaymentInput(DEFAULTS.downPaymentPercent.toString());
    setDownPaymentMode('percent');
    setBuyerType(DEFAULTS.buyerType);
    setLoanTermYears(DEFAULTS.loanTermYears);
    setInterestRate(DEFAULTS.interestRate);
    setInterestRateInput(DEFAULTS.interestRate.toFixed(1));
    setLegalFeesPercent(DEFAULTS.legalFeesPercent);
    setLegalFeesInput(DEFAULTS.legalFeesPercent.toFixed(1));
    setAppraisalFee(DEFAULTS.appraisalFee);
    setAppraisalFeeInput(formatNumber(DEFAULTS.appraisalFee));
    setBufferAmount(DEFAULTS.bufferAmount);
    setBufferAmountInput(formatNumber(DEFAULTS.bufferAmount));
    setIncludeTaxesInCash(DEFAULTS.includeTaxesInCash);
    setShowAssumptions(false);
    setValidationStates({});
    toast({
      title: "Reset complete",
      description: "All values restored to defaults",
    });
  };

  // Save calculation to localStorage
  const handleSave = () => {
    const savedData = {
      propertyPrice,
      downPaymentPercent,
      buyerType,
      loanTermYears,
      interestRate,
      legalFeesPercent,
      appraisalFee,
      bufferAmount,
      includeTaxesInCash,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    toast({
      title: "Calculation saved",
      description: "Your inputs have been saved locally",
    });
  };

  // Load saved calculation
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        // Only auto-load if saved recently (within 7 days)
        const savedAt = new Date(data.savedAt);
        const daysSinceSave = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSave < 7) {
          setPropertyPrice(data.propertyPrice || DEFAULTS.propertyPrice);
          setPropertyPriceInput(formatNumber(data.propertyPrice || DEFAULTS.propertyPrice));
          setDownPaymentPercent(data.downPaymentPercent || DEFAULTS.downPaymentPercent);
          setDownPaymentInput((data.downPaymentPercent || DEFAULTS.downPaymentPercent).toString());
          setBuyerType(data.buyerType || DEFAULTS.buyerType);
          setLoanTermYears(data.loanTermYears || DEFAULTS.loanTermYears);
          setInterestRate(data.interestRate || DEFAULTS.interestRate);
          setInterestRateInput((data.interestRate || DEFAULTS.interestRate).toFixed(1));
          setLegalFeesPercent(data.legalFeesPercent || DEFAULTS.legalFeesPercent);
          setLegalFeesInput((data.legalFeesPercent || DEFAULTS.legalFeesPercent).toFixed(1));
          setAppraisalFee(data.appraisalFee || DEFAULTS.appraisalFee);
          setAppraisalFeeInput(formatNumber(data.appraisalFee || DEFAULTS.appraisalFee));
          setBufferAmount(data.bufferAmount || DEFAULTS.bufferAmount);
          setBufferAmountInput(formatNumber(data.bufferAmount || DEFAULTS.bufferAmount));
          setIncludeTaxesInCash(data.includeTaxesInCash ?? DEFAULTS.includeTaxesInCash);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Share calculation via URL
  const handleShare = async () => {
    const params = new URLSearchParams({
      price: propertyPrice.toString(),
      down: downPaymentPercent.toString(),
      buyer: buyerType,
      term: loanTermYears.toString(),
      rate: interestRate.toString(),
    });
    const url = `${window.location.origin}/tools?tool=mortgage&${params.toString()}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mortgage Calculation - BuyWise Israel',
          text: `Monthly Payment: ${formatCurrency(mortgageResult.monthlyPayment)}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied",
          description: "Share this link with others to show your calculation",
        });
      }
    } catch (e) {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Share this link with others to show your calculation",
      });
    }
  };

  // Input field component with validation styling
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
    inputMode = 'numeric',
    fieldKey,
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
    fieldKey?: string;
  }) => {
    const isValid = fieldKey ? validationStates[fieldKey] : undefined;
    
    return (
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
              suffix && "pr-8",
              isValid === true && "border-green-500/50 focus:border-green-500",
              isValid === false && "border-destructive/50 focus:border-destructive"
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
  };

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
          fieldKey="propertyPrice"
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
              className={cn(
                "pl-8 text-base font-medium h-11 transition-all focus:ring-2 focus:ring-primary/20",
                validationStates['downPayment'] === true && "border-green-500/50",
                validationStates['downPayment'] === false && "border-destructive/50"
              )}
              placeholder={downPaymentMode === 'percent' ? '25' : '750,000'}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {downPaymentMode === 'percent' 
              ? `= ${formatCurrencyShort(downPaymentAmount)} · Min ${minDownPayment}%`
              : `= ${effectiveDownPaymentPercent.toFixed(1)}% of price`
            }
          </p>

          {/* What-If Scenario Buttons */}
          {whatIfScenarios.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">What if:</span>
              {whatIfScenarios.map((scenario, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => applyWhatIfScenario(scenario.newPercent)}
                >
                  {scenario.label}
                  <span className="ml-1 text-green-600">-{formatCurrencyShort(scenario.savings)}/mo</span>
                </Button>
              ))}
            </div>
          )}
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
            fieldKey="interestRate"
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

      {/* Reset Button */}
      <div className="flex justify-center pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={handleReset}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset to defaults
        </Button>
      </div>
    </div>
  );

  const rightColumn = (
    <div className="space-y-4">
      {/* Save/Share Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save className="h-3.5 w-3.5 mr-1.5" />
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-3.5 w-3.5 mr-1.5" />
          Share
        </Button>
      </div>

      {/* Hero: Monthly Payment */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Payment</p>
        <p className="text-4xl font-bold text-primary tracking-tight">
          {formatCurrency(mortgageResult.monthlyPayment)}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Over {loanTermYears} years at {interestRate.toFixed(1)}% interest
        </p>
        {/* Context for international buyers */}
        <div className="mt-3 pt-3 border-t border-primary/10">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Context:</span> This is ~{paymentToIncomePercent}% of median Israeli household income (₪{formatNumber(MEDIAN_HOUSEHOLD_INCOME)}/mo). 
            Banks typically approve up to 35-40%.
          </p>
        </div>
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

      {/* Next Steps CTAs */}
      <Card className="p-5 shadow-sm bg-muted/30">
        <p className="text-sm font-medium text-foreground mb-3">Continue Your Research</p>
        <div className="space-y-2">
          <Link 
            to="/tools?tool=total-cost"
            className="flex items-center justify-between p-3 rounded-md bg-background hover:bg-muted/50 transition-colors border border-border"
          >
            <div>
              <p className="text-sm font-medium text-foreground">Total Cost Calculator</p>
              <p className="text-xs text-muted-foreground">See all purchase costs including taxes and fees</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link 
            to="/tools?tool=affordability"
            className="flex items-center justify-between p-3 rounded-md bg-background hover:bg-muted/50 transition-colors border border-border"
          >
            <div>
              <p className="text-sm font-medium text-foreground">Affordability Calculator</p>
              <p className="text-xs text-muted-foreground">Find out how much you can borrow</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link 
            to={`/listings?max_price=${Math.round(propertyPrice * 1.1)}`}
            className="flex items-center justify-between p-3 rounded-md bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/20"
          >
            <div>
              <p className="text-sm font-medium text-primary">Browse Properties</p>
              <p className="text-xs text-muted-foreground">Explore listings in your budget</p>
            </div>
            <ExternalLink className="h-4 w-4 text-primary" />
          </Link>
        </div>
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
