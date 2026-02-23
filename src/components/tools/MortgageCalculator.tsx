// Mortgage Calculator - Unified Side-by-Side Layout for BuyWise Israel
import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, RotateCcw, Save, ChevronDown, ArrowRight, Loader2, MapPin, Home, Info, TrendingUp, AlertTriangle, BadgeCheck, HelpCircle, Share2, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { calculateMortgagePayment, stressTestMortgage, estimateMonthlyPaymentRange } from '@/lib/calculations/mortgage';
import { BuyerType } from '@/lib/calculations/purchaseTax';
import { useBuyerProfile, getBuyerTaxCategory } from '@/hooks/useBuyerProfile';
import { useMortgageTracks } from '@/hooks/useMortgageTracks';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSaveCalculatorResult } from '@/hooks/useSavedCalculatorResults';
import { Link } from 'react-router-dom';
import { ToolLayout, ToolDisclaimer, ToolFeedback, InsightCard, ResultRange, formatCurrencyRange, SourceAttribution, ExampleValuesHint, ToolPropertySuggestions, ToolGuidanceHint } from './shared';
import { useFormatPrice, useCurrencySymbol } from '@/contexts/PreferencesContext';
import { toast } from 'sonner';
import { MORTGAGE_RATE_RANGES } from '@/lib/utils/formatRange';

// Buyer types with their max LTV limits and explanations
const BUYER_TYPE_OPTIONS: { 
  value: BuyerType; 
  label: string; 
  maxLtv: number;
  description: string;
}[] = [
  { value: 'first_time', label: 'First-Time Buyer', maxLtv: 75, description: 'Buying your first residential property in Israel' },
  { value: 'upgrader', label: 'Upgrading (Selling Current)', maxLtv: 70, description: 'Selling your current home to buy a new one' },
  { value: 'investor', label: 'Additional Property', maxLtv: 50, description: 'Buying a second property (investment or vacation)' },
  { value: 'oleh', label: 'Oleh Hadash', maxLtv: 75, description: 'New immigrant within 7 years. May qualify for government mortgage at ~3% fixed rate.' },
  { value: 'foreign', label: 'Non-Resident', maxLtv: 50, description: 'Not a resident of Israel. Foreign income discounted 20-30%. May require Israeli guarantor.' },
];

const LOAN_TERMS = [10, 15, 20, 25, 30];

const DEFAULTS = {
  propertyPrice: 2750000,
  downPaymentPercent: 25,
  buyerType: 'first_time' as BuyerType,
  loanTermYears: 25,
  interestRate: 5.25,
};

const STORAGE_KEY = 'mortgage-calculator-saved';

const formatNumber = (num: number): string => num.toLocaleString('en-US');
const parseFormattedNumber = (str: string): number => {
  const cleaned = str.replace(/[^\d.-]/g, '');
  return Number(cleaned) || 0;
};

// Helper component for info tooltips
function InfoTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex items-center justify-center ml-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function MortgageCalculatorContent() {
  const formatCurrency = useFormatPrice();
  const currencySymbol = useCurrencySymbol();
  const { data: buyerProfile, isLoading: isProfileLoading } = useBuyerProfile();
  const { data: mortgageTracks, isLoading: isTracksLoading } = useMortgageTracks();
  const { toast: showToast } = useToast();
  const { user } = useAuth();
  const saveToProfile = useSaveCalculatorResult();
  
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
  
  // UI state
  const [isTracksOpen, setIsTracksOpen] = useState(false);
  const [isStressTestOpen, setIsStressTestOpen] = useState(false);

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

  // Load saved data from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setPropertyPrice(data.propertyPrice || DEFAULTS.propertyPrice);
        setPropertyPriceInput(formatNumber(data.propertyPrice || DEFAULTS.propertyPrice));
        setDownPaymentPercent(data.downPaymentPercent || DEFAULTS.downPaymentPercent);
        setDownPaymentInput((data.downPaymentPercent || DEFAULTS.downPaymentPercent).toString());
        setBuyerType(data.buyerType || DEFAULTS.buyerType);
        setLoanTermYears(data.loanTermYears || DEFAULTS.loanTermYears);
        setInterestRate(data.interestRate || DEFAULTS.interestRate);
        setInterestRateInput((data.interestRate || DEFAULTS.interestRate).toFixed(1));
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

  // Payment range calculation using rate variance
  const paymentRange = useMemo(() => {
    return estimateMonthlyPaymentRange(propertyPrice, buyerType);
  }, [propertyPrice, buyerType]);

  // Interest and total payment ranges based on rate variance
  const interestRange = useMemo(() => {
    const lowRate = MORTGAGE_RATE_RANGES.low;
    const highRate = MORTGAGE_RATE_RANGES.high;
    const lowResult = calculateMortgagePayment(loanAmount, lowRate, loanTermYears);
    const highResult = calculateMortgagePayment(loanAmount, highRate, loanTermYears);
    return {
      interestLow: lowResult.totalInterest,
      interestHigh: highResult.totalInterest,
      totalLow: lowResult.totalPayment,
      totalHigh: highResult.totalPayment,
    };
  }, [loanAmount, loanTermYears]);

  // Stress test calculations
  const stressTest = useMemo(() => {
    const test1 = stressTestMortgage(loanAmount, interestRate, loanTermYears, 1);
    const test2 = stressTestMortgage(loanAmount, interestRate, loanTermYears, 2);
    return { 
      plus1: test1,
      plus2: test2 
    };
  }, [loanAmount, interestRate, loanTermYears]);

  // Calculate principal vs interest breakdown
  const principalPercent = useMemo(() => {
    if (mortgageResult.totalPayment <= 0) return 50;
    return Math.round((loanAmount / mortgageResult.totalPayment) * 100);
  }, [loanAmount, mortgageResult.totalPayment]);
  
  const interestPercent = 100 - principalPercent;

  // Generate personalized insights with Israel-specific context
  const insights = useMemo(() => {
    const messages: string[] = [];
    
    // LTV-based insights
    if (ltv >= maxLtv - 2) {
      messages.push(`At ${ltv.toFixed(0)}% LTV, you're at the Bank of Israel maximum for ${currentBuyerType?.label || 'your buyer type'}. This is common in Israel, but leaves less equity cushion if prices dip.`);
    } else if (ltv <= 50) {
      messages.push(`At ${ltv.toFixed(0)}% LTV, you have significant equity from day one. Israeli banks may offer better rates with this strong position.`);
    }
    
    // Term-based insights
    if (loanTermYears >= 28) {
      messages.push(`Over ${loanTermYears} years, interest adds ${formatCurrency(mortgageResult.totalInterest)} to your cost. In Israel, Prime-track loans allow penalty-free prepayment—consider paying extra when possible.`);
    } else if (loanTermYears <= 15) {
      messages.push(`A ${loanTermYears}-year mortgage is aggressive but builds equity fast. Israeli banks structure mortgages in "tracks"—a shorter term lets you take more risk on Prime rates.`);
    }
    
    // Buyer type specific insights
    if (buyerType === 'foreign') {
      messages.push(`As a non-resident, Israeli banks typically require 50% down. Foreign income may be discounted 20-30% when calculating your borrowing capacity.`);
    } else if (buyerType === 'oleh') {
      messages.push(`As an Oleh, you qualify for the same LTV limits as first-time buyers. Some banks offer special Oleh mortgage packages—worth comparing.`);
    }
    
    return messages;
  }, [ltv, loanTermYears, mortgageResult.totalInterest, formatCurrency, currentBuyerType, maxLtv, buyerType]);

  // Handlers
  const handleBuyerTypeChange = (value: BuyerType) => {
    setBuyerType(value);
    const newMinDown = 100 - (BUYER_TYPE_OPTIONS.find(b => b.value === value)?.maxLtv || 75);
    if (downPaymentPercent < newMinDown) {
      setDownPaymentPercent(newMinDown);
      setDownPaymentInput(newMinDown.toString());
    }
  };

  const handlePropertyPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPropertyPriceInput(e.target.value);
    const parsed = parseFormattedNumber(e.target.value);
    if (!isNaN(parsed)) setPropertyPrice(Math.max(500000, Math.min(50000000, parsed)));
  };

  const handlePropertyPriceBlur = () => {
    let value = parseFormattedNumber(propertyPriceInput);
    value = Math.max(500000, Math.min(50000000, value));
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
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) setInterestRate(Math.max(2, Math.min(12, parsed)));
  };

  const handleInterestRateBlur = () => {
    let value = parseFloat(interestRateInput) || 5.0;
    value = Math.max(2, Math.min(12, value));
    setInterestRate(value);
    setInterestRateInput(value.toFixed(1));
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
    setIsTracksOpen(false);
    setIsStressTestOpen(false);
    toast.success("Reset complete", { description: "All values restored to defaults" });
  };

  const handleSave = () => {
    const savedData = {
      propertyPrice, downPaymentPercent, buyerType, loanTermYears, interestRate,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    
    if (user) {
      saveToProfile.mutate({
        calculatorType: 'mortgage',
        inputs: savedData,
        results: {
          monthlyPayment: mortgageResult.monthlyPayment,
          loanAmount,
          totalInterest: mortgageResult.totalInterest,
          ltv,
        },
      });
    } else {
      toast.success("Calculation saved", { description: "Your inputs have been saved locally. Sign in to save to your profile." });
    }
  };

  // Get risk level badge color
  const getRiskBadgeVariant = (risk: string | null) => {
    switch (risk) {
      case 'low': return 'secondary';
      case 'medium': return 'outline';
      case 'high': return 'default';
      default: return 'outline';
    }
  };

  const getRiskBadgeClass = (risk: string | null) => {
    switch (risk) {
      case 'low': return 'bg-semantic-green text-white border-semantic-green';
      case 'medium': return 'bg-semantic-amber text-white border-semantic-amber';
      case 'high': return 'bg-semantic-red text-white border-semantic-red';
      default: return '';
    }
  };

  // Header Actions
  const headerActions = (
    <>
      <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
        <RotateCcw className="h-4 w-4" />
        <span className="hidden sm:inline">Reset</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={handleSave} disabled={saveToProfile.isPending}>
        {saveToProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        <span className="hidden sm:inline ml-1.5">{saveToProfile.isPending ? 'Saving...' : 'Save'}</span>
      </Button>
    </>
  );

  // Left Column - Inputs
  const leftColumn = (
    <div className="space-y-4">
      <ExampleValuesHint />
      {/* Property Details Card */}
      <Card>
        <CardContent className="p-5 space-y-5">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Property Details</h3>
          
          {/* Property Price */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label className="text-sm font-medium">Property Price</Label>
              <InfoTooltip content="Israeli property prices are typically listed in Shekels (₪). For luxury or investment properties, you may also see USD pricing." />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currencySymbol}</span>
              <Input
                type="text"
                inputMode="numeric"
                value={propertyPriceInput}
                onChange={handlePropertyPriceChange}
                onBlur={handlePropertyPriceBlur}
                className="pl-10 h-11 text-lg"
                placeholder="3,000,000"
              />
            </div>
          </div>

          {/* Down Payment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Label className="text-sm font-medium">Down Payment</Label>
                <InfoTooltip content="Bank of Israel regulates maximum LTV (loan-to-value) by buyer type. First-time buyers and Olim can borrow up to 75%, while investors are limited to 50%." />
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={toggleDownPaymentMode}>
                Switch to {downPaymentMode === 'percent' ? 'amount' : 'percent'}
              </Button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                {downPaymentMode === 'percent' ? '%' : currencySymbol}
              </span>
              <Input
                type="text"
                inputMode="numeric"
                value={downPaymentInput}
                onChange={handleDownPaymentChange}
                onBlur={handleDownPaymentBlur}
                className="pl-10 h-11 text-lg"
                placeholder={downPaymentMode === 'percent' ? '25' : '750,000'}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {downPaymentMode === 'percent' 
                ? `= ${formatCurrency(downPaymentAmount)}`
                : `= ${effectiveDownPaymentPercent.toFixed(0)}% of price`
              }
              {effectiveDownPaymentPercent < downPaymentPercent && 
                ` (Minimum ${minDownPayment}% for ${currentBuyerType?.label})`
              }
            </p>
          </div>

          {/* Buyer Type */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label className="text-sm font-medium">Buyer Type</Label>
              <InfoTooltip content="Your buyer category determines maximum LTV (financing) allowed by Bank of Israel regulations and affects your purchase tax rates." />
            </div>
            <Select value={buyerType} onValueChange={(v) => handleBuyerTypeChange(v as BuyerType)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUYER_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col items-start">
                      <span>{option.label} <span className="text-muted-foreground">• max {option.maxLtv}% LTV</span></span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {currentBuyerType?.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Loan Terms Card */}
      <Card>
        <CardContent className="p-5 space-y-5">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Loan Terms</h3>

          {/* Loan Term */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label className="text-sm font-medium">Loan Term</Label>
              <InfoTooltip content="Israeli mortgages typically range from 15-30 years. Longer terms mean lower payments but significantly more interest. Most buyers choose 20-25 years." />
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

          {/* Interest Rate */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label className="text-sm font-medium">Interest Rate</Label>
              <InfoTooltip content="Israeli mortgages use 'mixed tracks' with different rate types (Prime, Fixed, CPI-linked). This is your estimated blended average rate across all tracks." />
            </div>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                value={interestRateInput}
                onChange={handleInterestRateChange}
                onBlur={handleInterestRateBlur}
                className="pr-10 h-11 text-lg"
                placeholder="5.0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Right Column - Results (Sticky)
  const rightColumn = (
    <Card className="overflow-hidden">
      {/* Hero Result - Now shows range */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-background p-6 text-center border-b border-border">
        <p className="text-sm text-muted-foreground mb-1">Monthly Payment Range</p>
        <motion.p 
          key={`${paymentRange.low}-${paymentRange.high}`}
          initial={{ opacity: 0.5, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-4xl md:text-5xl font-bold text-primary tracking-tight"
        >
          {formatCurrencyRange(paymentRange.low, paymentRange.high, currencySymbol)}
        </motion.p>
        <p className="text-xs text-muted-foreground mt-2">
          Based on {MORTGAGE_RATE_RANGES.low}–{MORTGAGE_RATE_RANGES.high}% rates, {loanTermYears}-year term
        </p>
        {/* Stress test preview */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>If rates rise 2%: up to {formatCurrency(stressTest.plus2.stressedPayment)}/mo (+{stressTest.plus2.increasePercent.toFixed(0)}%)</span>
        </div>
      </div>

      {/* Quick Stats Grid - Now shows ranges for interest & total */}
      <div className="grid grid-cols-2 divide-x divide-y divide-border">
        <div className="p-4">
          <p className="text-xs text-muted-foreground">You'll Borrow</p>
          <p className="text-lg font-semibold mt-0.5">{formatCurrency(loanAmount)}</p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">Financing Ratio</p>
            <InfoTooltip content={`Maximum ${maxLtv}% LTV allowed for ${currentBuyerType?.label || 'your buyer type'} per Bank of Israel regulations.`} />
          </div>
          <p className="text-lg font-semibold mt-0.5">{ltv.toFixed(0)}% LTV</p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">Interest Paid</p>
            <InfoTooltip content={`Range based on ${MORTGAGE_RATE_RANGES.low}–${MORTGAGE_RATE_RANGES.high}% rates. Prepaying (especially on Prime tracks) can significantly reduce this.`} />
          </div>
          <p className="text-lg font-semibold mt-0.5">
            {formatCurrencyRange(interestRange.interestLow, interestRange.interestHigh, currencySymbol)}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground">Total You'll Pay</p>
          <p className="text-lg font-semibold mt-0.5">
            {formatCurrencyRange(interestRange.totalLow, interestRange.totalHigh, currencySymbol)}
          </p>
        </div>
      </div>

      {/* Visual Breakdown Bar */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Principal ({principalPercent}%)</span>
          <span>Interest ({interestPercent}%)</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden flex">
          <motion.div 
            className="bg-primary h-full"
            initial={{ width: 0 }}
            animate={{ width: `${principalPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <div className="bg-muted-foreground/30 h-full flex-1" />
        </div>
        <div className="flex items-center justify-between text-xs mt-1.5">
          <span className="font-medium">{formatCurrency(loanAmount)}</span>
          <span className="font-medium">{formatCurrencyRange(interestRange.interestLow, interestRange.interestHigh, currencySymbol)}</span>
        </div>
      </div>
    </Card>
  );

  // Bottom Section
  const bottomSection = (
    <div className="space-y-6">
      {/* Educational Sections */}
      <div className="space-y-4">
        {/* Israeli Mortgage Tracks Section */}
        <Collapsible open={isTracksOpen} onOpenChange={setIsTracksOpen}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Info className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">How Israeli Mortgages Work</p>
                  <p className="text-xs text-muted-foreground">Understanding the multi-track system (משלבים)</p>
                </div>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isTracksOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Unlike single-rate mortgages elsewhere, Israeli banks require you to split your loan into 2-3 "tracks" (מסלולים) with different rate structures. Bank of Israel limits each track to ~33% of your loan.
                </p>
                
                {isTracksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : mortgageTracks && mortgageTracks.length > 0 ? (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs">Track</TableHead>
                          <TableHead className="text-xs">Rate Range</TableHead>
                          <TableHead className="text-xs">Risk</TableHead>
                          <TableHead className="text-xs hidden md:table-cell">Best For</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mortgageTracks.map((track) => (
                          <TableRow key={track.id}>
                            <TableCell className="py-3">
                              <div>
                                <p className="font-medium text-sm">{track.hebrew_name}</p>
                                <p className="text-xs text-muted-foreground">{track.english_name}</p>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="text-sm font-medium">
                                {track.current_rate_min}% - {track.current_rate_max}%
                              </span>
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge variant="outline" className={cn("text-xs capitalize", getRiskBadgeClass(track.risk_level))}>
                                {track.risk_level}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 hidden md:table-cell">
                              <p className="text-xs text-muted-foreground">{track.best_use_case}</p>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : null}

                {buyerType === 'foreign' && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <AlertTriangle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-foreground/80">
                      <strong>For foreign income earners:</strong> CPI-linked tracks add inflation risk on top of currency risk. Many advisors recommend non-indexed (Fixed Shekel) tracks for USD/EUR earners.
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Stress Test Section */}
        <Collapsible open={isStressTestOpen} onOpenChange={setIsStressTestOpen}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">What If Rates Rise?</p>
                  <p className="text-xs text-muted-foreground">Bank of Israel recommends stress-testing at +2%</p>
                </div>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isStressTestOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <p className="text-xs text-muted-foreground mb-1">At {(interestRate + 1).toFixed(1)}% (+1%)</p>
                    <p className="text-xl font-semibold">{formatCurrency(stressTest.plus1.stressedPayment)}/mo</p>
                    <p className="text-xs text-semantic-amber mt-1">
                      +{formatCurrency(stressTest.plus1.increase)} ({stressTest.plus1.increasePercent.toFixed(1)}% higher)
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <p className="text-xs text-muted-foreground mb-1">At {(interestRate + 2).toFixed(1)}% (+2%)</p>
                    <p className="text-xl font-semibold">{formatCurrency(stressTest.plus2.stressedPayment)}/mo</p>
                    <p className="text-xs text-semantic-red mt-1">
                      +{formatCurrency(stressTest.plus2.increase)} ({stressTest.plus2.increasePercent.toFixed(1)}% higher)
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  If these payments feel risky, consider a larger down payment, shorter term, or allocating more to Fixed tracks which won't change with rates.
                </p>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Insight Card */}
      {insights.length > 0 && (
        <InsightCard insights={insights} />
      )}

      {/* Life Insurance Hint for Non-Israelis */}
      <ToolGuidanceHint
        variant="expert-tip"
        message="Non-Israeli residents are typically required to hold a life insurance policy as a condition of mortgage approval in Israel."
      />

      {/* Calculated for Israel Badge */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
        <BadgeCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium">Calculated for Israel</p>
          <p className="text-xs text-muted-foreground mt-1">
            This calculator reflects Bank of Israel lending regulations including LTV limits by buyer type, PTI constraints, and the multi-track mortgage structure. For personalized advice, consult a licensed mortgage advisor (יועץ משכנתאות).
          </p>
        </div>
      </div>

      {/* Next Steps Grid */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link 
          to="/tools?tool=affordability"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calculator className="h-5 w-5" />
            </div>
            <p className="font-semibold">Affordability</p>
          </div>
          <p className="text-sm text-muted-foreground">
            See how much home you can afford
          </p>
        </Link>

        <Link 
          to={`/listings?max_price=${Math.round(propertyPrice * 1.1)}`}
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Home className="h-5 w-5" />
            </div>
            <p className="font-semibold">Browse Properties</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Find listings in your budget
          </p>
        </Link>

        <Link 
          to="/guides/mortgages"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="font-semibold">Mortgages Guide</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Understand Israeli mortgage rules
          </p>
        </Link>
      </div>

      {/* Feedback */}
      <ToolPropertySuggestions
        title="Homes at This Price Point"
        subtitle="Browse listings that match your mortgage scenario"
        minPrice={Math.round(propertyPrice * 0.8)}
        maxPrice={Math.round(propertyPrice * 1.2)}
        enabled={propertyPrice !== DEFAULTS.propertyPrice}
      />
      <ToolFeedback toolName="mortgage-calculator" variant="inline" />
    </div>
  );

  const disclaimer = (
    <ToolDisclaimer variant="mortgage" />
  );

  return (
    <ToolLayout
      title="Mortgage Calculator"
      subtitle="See what a mortgage in Israel actually costs — before talking to a bank."
      icon={<Calculator className="h-6 w-6" />}
      headerActions={headerActions}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      bottomSection={bottomSection}
      sourceAttribution={<SourceAttribution toolType="mortgage" />}
      disclaimer={disclaimer}
    />
  );
}

export function MortgageCalculator() {
  return <MortgageCalculatorContent />;
}
