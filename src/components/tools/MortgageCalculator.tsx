// Mortgage Calculator Component
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Calculator, Info, ChevronDown, RotateCcw, Save, ExternalLink, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { calculateMortgagePayment } from '@/lib/calculations/mortgage';
import { calculatePurchaseTax, BuyerType } from '@/lib/calculations/purchaseTax';
import { useBuyerProfile, getBuyerTaxCategory } from '@/hooks/useBuyerProfile';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { 
  ToolLayout, 
  CashBreakdownTable, 
  LTVIndicator,
  ToolDisclaimer,
  PaymentPieChart,
  ToolFeedback,
  InsightCard,
  BuyerTypeInfoBanner,
  type BuyerCategory,
} from './shared';
import { useFormatPrice } from '@/contexts/PreferencesContext';

// Buyer types with their max LTV limits
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

const MEDIAN_HOUSEHOLD_INCOME = 18000;
const STORAGE_KEY = 'mortgage-calculator-saved';

const formatNumber = (num: number): string => num.toLocaleString('en-US');
const parseFormattedNumber = (str: string): number => {
  const cleaned = str.replace(/[^\d.-]/g, '');
  return Number(cleaned) || 0;
};

function MortgageCalculatorContent() {
  const formatCurrency = useFormatPrice();
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
  
  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [includeTaxesInCash, setIncludeTaxesInCash] = useState(DEFAULTS.includeTaxesInCash);
  const [legalFeesPercent, setLegalFeesPercent] = useState(DEFAULTS.legalFeesPercent);
  const [legalFeesInput, setLegalFeesInput] = useState(DEFAULTS.legalFeesPercent.toFixed(1));
  const [appraisalFee, setAppraisalFee] = useState(DEFAULTS.appraisalFee);
  const [appraisalFeeInput, setAppraisalFeeInput] = useState(formatNumber(DEFAULTS.appraisalFee));
  const [bufferAmount, setBufferAmount] = useState(DEFAULTS.bufferAmount);
  const [bufferAmountInput, setBufferAmountInput] = useState(formatNumber(DEFAULTS.bufferAmount));

  // Set buyer type from profile
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

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
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
        }
      } catch (e) {}
    }
  }, []);

  const currentBuyerType = BUYER_TYPE_OPTIONS.find(b => b.value === buyerType);
  const maxLtv = currentBuyerType?.maxLtv || 75;
  const minDownPayment = 100 - maxLtv;
  const effectiveDownPaymentPercent = Math.max(downPaymentPercent, minDownPayment);
  
  const downPaymentAmount = (propertyPrice * effectiveDownPaymentPercent) / 100;
  const loanAmount = propertyPrice - downPaymentAmount;
  const ltv = ((loanAmount / propertyPrice) * 100);

  const mortgageResult = useMemo(() => {
    return calculateMortgagePayment(loanAmount, interestRate, loanTermYears);
  }, [loanAmount, interestRate, loanTermYears]);

  const purchaseTaxResult = useMemo(() => {
    return calculatePurchaseTax(propertyPrice, buyerType);
  }, [propertyPrice, buyerType]);

  const monthlyPrincipal = useMemo(() => {
    return mortgageResult.monthlyPayment - (loanAmount * (interestRate / 100 / 12));
  }, [mortgageResult.monthlyPayment, loanAmount, interestRate]);

  const monthlyInterest = mortgageResult.monthlyPayment - monthlyPrincipal;

  const legalFees = Math.round((propertyPrice * legalFeesPercent) / 100);
  const bankFees = Math.round(loanAmount * 0.004);
  const purchaseTaxAmount = includeTaxesInCash ? purchaseTaxResult.totalTax : 0;
  const totalCashNeeded = downPaymentAmount + purchaseTaxAmount + legalFees + bankFees + appraisalFee + bufferAmount;
  const paymentToIncomePercent = Math.round((mortgageResult.monthlyPayment / MEDIAN_HOUSEHOLD_INCOME) * 100);

  // Generate personalized insights
  const insights = useMemo(() => {
    const messages: string[] = [];
    const pti = paymentToIncomePercent;
    const totalInterestPercent = Math.round((mortgageResult.totalInterest / propertyPrice) * 100);
    
    // PTI-based insights
    if (pti > 45) {
      messages.push(`This payment takes about ${pti}% of the median household income—that's on the higher end. Consider a smaller loan or longer term if you want more breathing room.`);
    } else if (pti > 35) {
      messages.push(`At ${pti}% of median income, this is manageable but tight. Make sure you've budgeted for unexpected expenses before committing.`);
    } else if (pti <= 25) {
      messages.push(`This payment is very comfortable relative to typical incomes. You'll have solid breathing room for other expenses and savings.`);
    }
    
    // LTV insights
    if (ltv >= 70) {
      messages.push(`With ${ltv.toFixed(0)}% financing, you're borrowing close to the maximum. Less equity means less flexibility if you need to sell early—but it lets you keep more cash on hand.`);
    }
    
    // Term and interest insights
    if (loanTermYears >= 28 && totalInterestPercent > 80) {
      messages.push(`Over ${loanTermYears} years, you'll pay ${formatCurrency(mortgageResult.totalInterest)} in interest—about ${totalInterestPercent}% of the property price. If your income grows, consider prepaying to save significantly.`);
    }
    
    return messages;
  }, [paymentToIncomePercent, ltv, loanTermYears, mortgageResult.totalInterest, propertyPrice, formatCurrency]);

  const cashBreakdownItems = [
    { label: 'Down Payment', value: formatCurrency(downPaymentAmount), percentage: `${effectiveDownPaymentPercent.toFixed(0)}%` },
    ...(includeTaxesInCash ? [{ label: 'Purchase Tax', value: formatCurrency(purchaseTaxAmount) }] : []),
    { label: 'Legal Fees', value: formatCurrency(legalFees) },
    { label: 'Bank Fees', value: formatCurrency(bankFees) },
    { label: 'Appraisal', value: formatCurrency(appraisalFee) },
    ...(bufferAmount > 0 ? [{ label: 'Buffer', value: formatCurrency(bufferAmount) }] : []),
    { label: '', value: '', isSeparator: true },
    { label: 'Total Cash Needed', value: formatCurrency(totalCashNeeded), isTotal: true, highlight: 'positive' as const },
  ];

  // Handlers
  const handleBuyerTypeChange = (value: BuyerType) => {
    setBuyerType(value);
    const newMinDown = 100 - (BUYER_TYPE_OPTIONS.find(b => b.value === value)?.maxLtv || 75);
    if (downPaymentPercent < newMinDown) {
      setDownPaymentPercent(newMinDown);
      setDownPaymentInput(newMinDown.toString());
    }
  };

  const handleLiveUpdate = useCallback((
    value: string, setter: (v: number) => void, min: number, max: number, isFormatted = false
  ) => {
    const parsed = isFormatted ? parseFormattedNumber(value) : parseFloat(value);
    if (!isNaN(parsed)) setter(Math.max(min, Math.min(max, parsed)));
  }, []);

  const handlePropertyPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPropertyPriceInput(e.target.value);
    handleLiveUpdate(e.target.value, setPropertyPrice, 500000, 15000000, true);
  };

  const handlePropertyPriceBlur = () => {
    let value = parseFormattedNumber(propertyPriceInput);
    value = Math.max(500000, Math.min(15000000, value));
    setPropertyPrice(value);
    setPropertyPriceInput(formatNumber(value));
    if (downPaymentMode === 'amount') {
      setDownPaymentInput(formatNumber(Math.round((value * effectiveDownPaymentPercent) / 100)));
    }
  };

  const handleDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDownPaymentInput(e.target.value);
    if (downPaymentMode === 'percent') {
      const parsed = parseFloat(e.target.value);
      if (!isNaN(parsed)) setDownPaymentPercent(Math.max(minDownPayment, Math.min(80, parsed)));
    } else {
      const parsed = parseFormattedNumber(e.target.value);
      if (!isNaN(parsed)) setDownPaymentPercent(Math.max(minDownPayment, Math.min(80, (parsed / propertyPrice) * 100)));
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
      setDownPaymentPercent((amount / propertyPrice) * 100);
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

  const handleInterestRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInterestRateInput(e.target.value);
    handleLiveUpdate(e.target.value, setInterestRate, 3, 8, false);
  };

  const handleInterestRateBlur = () => {
    let value = parseFloat(interestRateInput) || 5.0;
    value = Math.max(3, Math.min(8, value));
    setInterestRate(value);
    setInterestRateInput(value.toFixed(1));
  };

  const handleLegalFeesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLegalFeesInput(e.target.value);
    handleLiveUpdate(e.target.value, setLegalFeesPercent, 0.3, 1, false);
  };

  const handleLegalFeesBlur = () => {
    let value = parseFloat(legalFeesInput) || 0.5;
    value = Math.max(0.3, Math.min(1, value));
    setLegalFeesPercent(value);
    setLegalFeesInput(value.toFixed(1));
  };

  const handleAppraisalFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppraisalFeeInput(e.target.value);
    handleLiveUpdate(e.target.value, setAppraisalFee, 1500, 6000, true);
  };

  const handleAppraisalFeeBlur = () => {
    let value = parseFormattedNumber(appraisalFeeInput);
    value = Math.max(1500, Math.min(6000, value));
    setAppraisalFee(value);
    setAppraisalFeeInput(formatNumber(value));
  };

  const handleBufferAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBufferAmountInput(e.target.value);
    handleLiveUpdate(e.target.value, setBufferAmount, 0, 500000, true);
  };

  const handleBufferAmountBlur = () => {
    let value = parseFormattedNumber(bufferAmountInput);
    value = Math.max(0, Math.min(500000, value));
    setBufferAmount(value);
    setBufferAmountInput(formatNumber(value));
  };

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
    setShowAdvanced(false);
    toast({ title: "Reset complete", description: "All values restored to defaults" });
  };

  const handleSave = () => {
    const savedData = {
      propertyPrice, downPaymentPercent, buyerType, loanTermYears, interestRate,
      legalFeesPercent, appraisalFee, bufferAmount, includeTaxesInCash,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    toast({ title: "Calculation saved", description: "Your inputs have been saved locally" });
  };

  // Left column - single consolidated inputs card
  const leftColumn = (
    <Card className="p-6 shadow-sm lg:mt-6">
      <div className="space-y-6">
        {/* Property Price */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Property Price</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                The full purchase price in Israeli Shekels. Average apartment prices range from ₪1.5M in peripheral areas to ₪4M+ in Tel Aviv.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span>
            <Input
              type="text"
              inputMode="numeric"
              value={propertyPriceInput}
              onChange={handlePropertyPriceChange}
              onBlur={handlePropertyPriceBlur}
              className="pl-8 h-11"
              placeholder="3,000,000"
            />
          </div>
        </div>

        {/* Buyer Type */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Buyer Type</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                <p className="font-medium mb-1">Bank of Israel regulations set different LTV limits:</p>
                <ul className="text-xs space-y-0.5">
                  <li>• First-time buyers: up to 75% financing</li>
                  <li>• Upgraders (selling current): up to 70%</li>
                  <li>• Investors/Foreign: up to 50%</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select value={buyerType} onValueChange={handleBuyerTypeChange}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUYER_TYPE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="font-medium">{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Max LTV: {maxLtv}% · Min down payment: {minDownPayment}%
          </p>
        </div>

        {/* Down Payment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium">Down Payment</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                  Israeli banks require minimum down payments based on buyer type. Higher down payments reduce your monthly costs and total interest paid.
                </TooltipContent>
              </Tooltip>
            </div>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={toggleDownPaymentMode}>
              Switch to {downPaymentMode === 'percent' ? '₪' : '%'}
            </Button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {downPaymentMode === 'percent' ? '%' : '₪'}
            </span>
            <Input
              type="text"
              inputMode="numeric"
              value={downPaymentInput}
              onChange={handleDownPaymentChange}
              onBlur={handleDownPaymentBlur}
              className="pl-8 h-11"
              placeholder={downPaymentMode === 'percent' ? '25' : '750,000'}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {downPaymentMode === 'percent' 
              ? `= ${formatCurrency(downPaymentAmount)}`
              : `= ${effectiveDownPaymentPercent.toFixed(1)}% of price`
            }
          </p>
        </div>

        <Separator />

        {/* Loan Terms - Inline */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium">Loan Term</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                  Most Israeli mortgages are 20-30 years. Shorter terms mean higher payments but less total interest. Max term is typically 30 years.
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={loanTermYears.toString()} onValueChange={(v) => setLoanTermYears(Number(v))}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOAN_TERMS.map(term => (
                  <SelectItem key={term} value={term.toString()}>{term} years</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium">Interest Rate</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                  Israeli mortgages typically use a mix of fixed and variable rate "tracks". This calculator uses a blended average rate for simplicity.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                value={interestRateInput}
                onChange={handleInterestRateChange}
                onBlur={handleInterestRateBlur}
                className="pr-8 h-11"
                placeholder="5.0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        {/* Advanced Options - Collapsible */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span>Advanced Options</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Include Purchase Tax</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-sm">
                    Mas Rechisha (Purchase Tax) is paid to the Tax Authority within 50 days of signing. Rates vary by buyer type and property value.
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch checked={includeTaxesInCash} onCheckedChange={setIncludeTaxesInCash} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Legal Fees (%)</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-sm">
                      Attorney fees (Orech Din) typically range 0.5-1% + VAT. Covers contract review, due diligence, and Land Registry (Tabu) registration.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={legalFeesInput}
                    onChange={handleLegalFeesChange}
                    onBlur={handleLegalFeesBlur}
                    className="pr-6 h-9 text-sm"
                    placeholder="0.5"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Appraisal Fee</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-sm">
                      Shuman (Property Appraisal) is required by the bank to confirm property value. Cost varies by property size and location.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₪</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={appraisalFeeInput}
                    onChange={handleAppraisalFeeChange}
                    onBlur={handleAppraisalFeeBlur}
                    className="pl-6 h-9 text-sm"
                    placeholder="3,000"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Reserve Buffer (optional)</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-sm">
                    Extra cash reserve for unexpected costs like minor repairs, furniture, or moving expenses. Recommended: ₪30,000-50,000.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₪</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={bufferAmountInput}
                  onChange={handleBufferAmountChange}
                  onBlur={handleBufferAmountBlur}
                  className="pl-6 h-9 text-sm"
                  placeholder="0"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Reset */}
        <div className="flex justify-center pt-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to defaults
          </Button>
        </div>
      </div>
    </Card>
  );

  // Right column - single combined results card
  const rightColumn = (
    <Card className="p-6 shadow-sm h-full flex flex-col">
      {/* Hero Monthly Payment */}
      <div className="text-center pb-5 border-b border-border">
        <p className="text-sm text-muted-foreground mb-1">Monthly Payment</p>
        <p className="text-5xl font-bold text-primary tracking-tight">
          {formatCurrency(mortgageResult.monthlyPayment)}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {loanTermYears} years at {interestRate.toFixed(1)}%
        </p>
      </div>

      {/* Pie Chart */}
      <div className="py-5 border-b border-border">
        <PaymentPieChart
          principal={Math.max(0, monthlyPrincipal)}
          interest={monthlyInterest}
          formatValue={formatCurrency}
        />
      </div>

      {/* Summary Stats */}
      <div className="pt-5 space-y-3 flex-1 flex flex-col">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Loan Amount</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                The amount you're borrowing from the bank (property price minus your down payment).
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="font-semibold">{formatCurrency(loanAmount)}</span>
        </div>
        
        <LTVIndicator ltv={ltv} maxLTV={maxLtv} />
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Total Interest</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                The total interest you'll pay over the life of the loan. Increasing your down payment or shortening the term reduces this significantly.
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="font-semibold">{formatCurrency(mortgageResult.totalInterest)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Repayment</span>
          <span className="font-semibold">{formatCurrency(mortgageResult.totalPayment)}</span>
        </div>

        <div className="flex-1" />
        
        <Separator className="my-3" />
        
        <p className="text-xs text-muted-foreground text-center">
          ~{paymentToIncomePercent}% of median Israeli household income (₪{formatNumber(MEDIAN_HOUSEHOLD_INCOME)}/mo)
        </p>
      </div>
      
    </Card>
  );

  // Bottom section - full width
  const bottomSection = (
    <div className="space-y-6">
      {/* Insight Card - Full Width */}
      {insights.length > 0 && (
        <InsightCard insights={insights} />
      )}
      
      {/* Cash Needed Breakdown */}
      <CashBreakdownTable title="Cash Needed to Close" items={cashBreakdownItems} />

      {/* Next Steps Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Affordability Calculator */}
        <Link 
          to="/tools?tool=affordability"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calculator className="h-5 w-5" />
            </div>
            <p className="font-semibold">Affordability Calculator</p>
          </div>
          <p className="text-sm text-muted-foreground">
            See how much home you can afford based on your income
          </p>
        </Link>

        {/* Browse Properties */}
        <Link 
          to={`/listings?max_price=${Math.round(propertyPrice * 1.1)}`}
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ExternalLink className="h-5 w-5" />
            </div>
            <p className="font-semibold">Browse Properties</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Find listings in your budget range
          </p>
        </Link>

        {/* Explore Areas */}
        <Link 
          to="/areas"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ArrowRight className="h-5 w-5" />
            </div>
            <p className="font-semibold">Explore Areas</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Discover neighborhoods and market trends
          </p>
        </Link>
      </div>

      {/* Feedback Section */}
      <ToolFeedback toolName="mortgage-calculator" variant="inline" />
    </div>
  );

  return (
    <ToolLayout
      title="Mortgage Calculator"
      subtitle="Estimate your monthly payment and total cash needed"
      icon={<Calculator className="h-6 w-6" />}
      headerActions={
        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save className="h-3.5 w-3.5 mr-1.5" />
          Save
        </Button>
      }
      infoBanner={
        <BuyerTypeInfoBanner
          selectedType={
            buyerType === 'investor' ? 'additional' :
            buyerType === 'foreign' ? 'non_resident' :
            buyerType === 'upgrader' ? 'additional' :
            buyerType === 'company' ? 'non_resident' :
            buyerType as BuyerCategory
          }
          onTypeChange={(type) => {
            const mapping: Record<BuyerCategory, BuyerType> = {
              'first_time': 'first_time',
              'oleh': 'oleh',
              'additional': 'investor',
              'non_resident': 'foreign',
            };
            handleBuyerTypeChange(mapping[type]);
          }}
          profileType={buyerProfile ? (
            getBuyerTaxCategory(buyerProfile) as BuyerCategory
          ) : undefined}
        />
      }
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      bottomSection={bottomSection}
      disclaimer={
        <ToolDisclaimer 
          text="Estimates based on Israeli mortgage regulations (2024). Consult a licensed mortgage advisor for personalized advice."
        />
      }
    />
  );
}

export function MortgageCalculator() {
  return <MortgageCalculatorContent />;
}
