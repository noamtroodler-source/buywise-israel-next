// Mortgage Calculator - Reinvented for BuyWise Israel
import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, RotateCcw, Save, ChevronDown, ArrowRight, Loader2, MapPin, Home } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { calculateMortgagePayment } from '@/lib/calculations/mortgage';
import { calculatePurchaseTax, BuyerType } from '@/lib/calculations/purchaseTax';
import { useBuyerProfile, getBuyerTaxCategory } from '@/hooks/useBuyerProfile';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSaveCalculatorResult } from '@/hooks/useSavedCalculatorResults';
import { Link } from 'react-router-dom';
import { ToolDisclaimer, ToolFeedback, InsightCard } from './shared';
import { useFormatPrice, useCurrencySymbol } from '@/contexts/PreferencesContext';

// Buyer types with their max LTV limits
const BUYER_TYPE_OPTIONS: { 
  value: BuyerType; 
  label: string; 
  maxLtv: number;
}[] = [
  { value: 'first_time', label: 'First-Time Buyer', maxLtv: 75 },
  { value: 'upgrader', label: 'Upgrading (Selling Current)', maxLtv: 70 },
  { value: 'investor', label: 'Additional Property', maxLtv: 50 },
  { value: 'oleh', label: 'Oleh Hadash', maxLtv: 75 },
  { value: 'foreign', label: 'Non-Resident', maxLtv: 50 },
];

const LOAN_TERMS = [10, 15, 20, 25, 30];

const DEFAULTS = {
  propertyPrice: 3000000,
  downPaymentPercent: 25,
  buyerType: 'first_time' as BuyerType,
  loanTermYears: 25,
  interestRate: 5.0,
};

const STORAGE_KEY = 'mortgage-calculator-saved';

const formatNumber = (num: number): string => num.toLocaleString('en-US');
const parseFormattedNumber = (str: string): number => {
  const cleaned = str.replace(/[^\d.-]/g, '');
  return Number(cleaned) || 0;
};

function MortgageCalculatorContent() {
  const formatCurrency = useFormatPrice();
  const currencySymbol = useCurrencySymbol();
  const { data: buyerProfile, isLoading: isProfileLoading } = useBuyerProfile();
  const { toast } = useToast();
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
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

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

  // Calculate principal vs interest breakdown
  const principalPercent = useMemo(() => {
    if (mortgageResult.totalPayment <= 0) return 50;
    return Math.round((loanAmount / mortgageResult.totalPayment) * 100);
  }, [loanAmount, mortgageResult.totalPayment]);
  
  const interestPercent = 100 - principalPercent;

  // Generate personalized insights
  const insights = useMemo(() => {
    const messages: string[] = [];
    const totalInterestPercent = Math.round((mortgageResult.totalInterest / propertyPrice) * 100);
    
    if (ltv >= 70) {
      messages.push(`With ${ltv.toFixed(0)}% financing, you're borrowing close to the maximum. Less equity means less flexibility if you need to sell early—but it lets you keep more cash on hand.`);
    } else if (ltv <= 50) {
      messages.push(`At ${ltv.toFixed(0)}% LTV, you have significant equity from day one. This gives you flexibility and may help negotiate better rates.`);
    }
    
    if (loanTermYears >= 28 && totalInterestPercent > 80) {
      messages.push(`Over ${loanTermYears} years, you'll pay ${formatCurrency(mortgageResult.totalInterest)} in interest. If your income grows, consider prepaying to save significantly.`);
    } else if (loanTermYears <= 15) {
      messages.push(`A ${loanTermYears}-year term means higher payments but much less interest overall. You'll own your home outright relatively quickly.`);
    }
    
    return messages;
  }, [ltv, loanTermYears, mortgageResult.totalInterest, propertyPrice, formatCurrency]);

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
    setIsAdvancedOpen(false);
    toast({ title: "Reset complete", description: "All values restored to defaults" });
  };

  const handleSave = () => {
    const savedData = {
      propertyPrice, downPaymentPercent, buyerType, loanTermYears, interestRate,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    
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
      toast({ title: "Calculation saved", description: "Your inputs have been saved locally. Sign in to save to your profile." });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mortgage Calculator</h1>
          <p className="text-muted-foreground mt-1">See what a mortgage in Israel actually costs — before talking to a bank.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSave} disabled={saveToProfile.isPending}>
            {saveToProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline ml-1.5">{saveToProfile.isPending ? 'Saving...' : 'Save'}</span>
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card className="overflow-hidden">
        {/* Hero Result */}
        <div className="bg-gradient-to-br from-primary/5 via-background to-background p-8 text-center border-b border-border">
          <p className="text-sm text-muted-foreground mb-2">Your Monthly Payment</p>
          <motion.p 
            key={mortgageResult.monthlyPayment}
            initial={{ opacity: 0.5, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl md:text-6xl font-bold text-primary tracking-tight"
          >
            {formatCurrency(mortgageResult.monthlyPayment)}
          </motion.p>
          <p className="text-sm text-muted-foreground mt-3">
            Over {loanTermYears} years at {interestRate.toFixed(1)}% interest
          </p>
        </div>

        {/* Essential Inputs */}
        <div className="p-6 space-y-6">
          {/* Property Price */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Property Price</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currencySymbol}</span>
              <Input
                type="text"
                inputMode="numeric"
                value={propertyPriceInput}
                onChange={handlePropertyPriceChange}
                onBlur={handlePropertyPriceBlur}
                className="pl-10 h-12 text-lg"
                placeholder="3,000,000"
              />
            </div>
          </div>

          {/* Down Payment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Down Payment</Label>
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
                className="pl-10 h-12 text-lg"
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

          {/* Loan Term */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Loan Term</Label>
            <Select value={loanTermYears.toString()} onValueChange={(v) => setLoanTermYears(Number(v))}>
              <SelectTrigger className="h-12 text-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOAN_TERMS.map(term => (
                  <SelectItem key={term} value={term.toString()}>{term} years</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Options Collapsible */}
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-auto py-3 px-0 hover:bg-transparent">
                <span className="text-sm text-muted-foreground">Customize your scenario</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isAdvancedOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              {/* Interest Rate */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Interest Rate</Label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={interestRateInput}
                    onChange={handleInterestRateChange}
                    onBlur={handleInterestRateBlur}
                    className="pr-10 h-12 text-lg"
                    placeholder="5.0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Israeli mortgages use mixed tracks. This is a blended average rate.
                </p>
              </div>

              {/* Buyer Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Buyer Type</Label>
                <Select value={buyerType} onValueChange={(v) => handleBuyerTypeChange(v as BuyerType)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUYER_TYPE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} (max {option.maxLtv}% LTV)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Buyer type affects maximum financing allowed.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Visual Breakdown Bar */}
        <div className="px-6 pb-6">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Principal ({principalPercent}%)</span>
              <span>Interest ({interestPercent}%)</span>
            </div>
            <div className="h-3 bg-muted-foreground/20 rounded-full overflow-hidden flex">
              <motion.div 
                className="bg-primary h-full"
                initial={{ width: 0 }}
                animate={{ width: `${principalPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              <div className="bg-muted-foreground/40 h-full flex-1" />
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="font-medium">{formatCurrency(loanAmount)}</span>
              <span className="font-medium">{formatCurrency(mortgageResult.totalInterest)}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-border">
          <div className="p-4 border-r border-b lg:border-b-0 border-border">
            <p className="text-xs text-muted-foreground">You'll Borrow</p>
            <p className="text-lg font-semibold mt-0.5">{formatCurrency(loanAmount)}</p>
          </div>
          <div className="p-4 border-b lg:border-b-0 lg:border-r border-border">
            <p className="text-xs text-muted-foreground">Financing Ratio</p>
            <p className="text-lg font-semibold mt-0.5">{ltv.toFixed(0)}% LTV</p>
          </div>
          <div className="p-4 border-r border-border">
            <p className="text-xs text-muted-foreground">Interest Over Time</p>
            <p className="text-lg font-semibold mt-0.5">{formatCurrency(mortgageResult.totalInterest)}</p>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground">Total You'll Pay</p>
            <p className="text-lg font-semibold mt-0.5">{formatCurrency(mortgageResult.totalPayment)}</p>
          </div>
        </div>
      </Card>

      {/* Bottom Section */}
      <div className="mt-8 space-y-6">
        {/* Insight Card */}
        {insights.length > 0 && (
          <InsightCard insights={insights} />
        )}

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
            to="/areas"
            className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <p className="font-semibold">Explore Areas</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Discover neighborhoods and trends
            </p>
          </Link>
        </div>

        {/* Feedback */}
        <ToolFeedback toolName="mortgage-calculator" variant="inline" />

        {/* Disclaimer */}
        <ToolDisclaimer 
          text="Estimates based on Israeli mortgage regulations (2024). Consult a licensed mortgage advisor for personalized advice."
        />
      </div>
    </div>
  );
}

export function MortgageCalculator() {
  return <MortgageCalculatorContent />;
}
