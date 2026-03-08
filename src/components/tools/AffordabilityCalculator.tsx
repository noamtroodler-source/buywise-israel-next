import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, 
  HelpCircle, 
  Wallet, 
  AlertTriangle, 
  BadgeCheck,
  ChevronDown,
  RotateCcw,
  Save,
  Loader2,
  Briefcase,
  Users,
  PiggyBank,
  Percent,
  Clock,
  Building2,
  Lightbulb,
  BookOpen,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { ToolLayout } from './shared/ToolLayout';
import { ToolIntro, TOOL_INTROS } from './shared/ToolIntro';
import { BuyerTypeInfoBanner, BuyerCategory } from './shared/BuyerTypeInfoBanner';
import { InsightCard } from './shared/InsightCard';
import { ToolFeedback } from './shared/ToolFeedback';
import { SaveResultsPrompt } from './shared/SaveResultsPrompt';
import { ToolDisclaimer } from './shared/ToolDisclaimer';
import { ToolPropertySuggestions } from './shared/ToolPropertySuggestions';
import { formatCurrencyRange } from './shared/ResultRange';
import { SourceAttribution } from './shared/SourceAttribution';
import { ExampleValuesHint } from './shared/ExampleValuesHint';
import { useAuth } from '@/hooks/useAuth';
import { useSavePromptTrigger } from '@/hooks/useSavePromptTrigger';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { useSaveCalculatorResult } from '@/hooks/useSavedCalculatorResults';
import { usePreferences } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { MORTGAGE_RATE_RANGES } from '@/lib/utils/formatRange';
import { toolUrl, TOOL_IDS } from '@/lib/routes';

const STORAGE_KEY = 'affordability-calculator-inputs';

type DownPaymentCurrency = 'ILS' | 'USD' | 'EUR' | 'GBP';

const CURRENCY_CONFIG: Record<DownPaymentCurrency, { symbol: string; label: string; toILS: number }> = {
  ILS: { symbol: '₪', label: '₪ ILS', toILS: 1 },
  USD: { symbol: '$', label: '$ USD', toILS: 3.6 },
  EUR: { symbol: '€', label: '€ EUR', toILS: 3.95 },
  GBP: { symbol: '£', label: '£ GBP', toILS: 4.60 },
};


const DEFAULTS = {
  monthlyIncome: 25000,
  spouseIncome: 0,
  monthlyDebts: 2000,
  downPayment: 687500,
  interestRate: 5.25,
  loanTermYears: 25,
  employmentType: 'employed' as const,
  hasForeignIncome: false,
  foreignIncomePercent: 0,
};

const LOAN_TERMS = [15, 20, 25, 30];

const EMPLOYMENT_OPTIONS = [
  { value: 'employed', label: 'Employed (Salaried)', multiplier: 1.0 },
  { value: 'self_employed', label: 'Self-Employed', multiplier: 0.7 },
  { value: 'mixed', label: 'Mixed Income', multiplier: 0.85 },
];

// Bank of Israel Directive 329 v11 - LTV & PTI limits by buyer category
const MAX_PTI = 0.40; // 40% PTI cap for all buyers (BoI Directive 329)
const LTV_BY_CATEGORY: Record<string, number> = {
  first_time: 0.75,
  oleh: 0.75,
  additional: 0.70,  // Upgrader: selling existing to buy new
  upgrader: 0.70,
  investor: 0.50,
  foreign: 0.50,
  non_resident: 0.50,
  company: 0.50,
};

// Maximum realistic property price display ceiling
const MAX_DISPLAY_PROPERTY_PRICE = 99900000; // ₪99.9M

function formatNumber(num: number): string {
  return num.toLocaleString('en-IL');
}

function parseFormattedNumber(str: string): number {
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}

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

function AffordabilityCalculatorContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: buyerProfile } = useBuyerProfile();
  const saveToProfile = useSaveCalculatorResult();
  const { currency } = usePreferences();

  const currencySymbol = currency === 'USD' ? '$' : '₪';
  const exchangeRate = currency === 'USD' ? 3.6 : 1;
  const formatPrice = (value: number) => {
    const converted = Math.round(value / exchangeRate);
    return `${currencySymbol}${formatNumber(converted)}`;
  };

  const [monthlyIncome, setMonthlyIncome] = useState(DEFAULTS.monthlyIncome);
  const [spouseIncome, setSpouseIncome] = useState(DEFAULTS.spouseIncome);
  const [monthlyDebts, setMonthlyDebts] = useState(DEFAULTS.monthlyDebts);
  const [downPayment, setDownPayment] = useState(DEFAULTS.downPayment);
  const [downPaymentCurrency, setDownPaymentCurrency] = useState<DownPaymentCurrency>('USD');
  const [downPaymentInput, setDownPaymentInput] = useState(DEFAULTS.downPayment); // raw input in selected currency
  const [interestRate, setInterestRate] = useState(DEFAULTS.interestRate);
  const [loanTermYears, setLoanTermYears] = useState(DEFAULTS.loanTermYears);
  const [employmentType, setEmploymentType] = useState<string>(DEFAULTS.employmentType);
  const [hasForeignIncome, setHasForeignIncome] = useState(DEFAULTS.hasForeignIncome);
  const [foreignIncomePercent, setForeignIncomePercent] = useState(DEFAULTS.foreignIncomePercent);
  
  const [educationOpen, setEducationOpen] = useState(false);
  
  const [selectedBuyerType, setSelectedBuyerType] = useState<BuyerCategory>('first_time');
  const [olehIsFirstProperty, setOlehIsFirstProperty] = useState(true);
  const { showPrompt: showSavePrompt, dismissPrompt: dismissSavePrompt, trackChange } = useSavePromptTrigger();
  const [hasInteracted, setHasInteracted] = useState(false);

  // Convert down payment input to ILS whenever currency or amount changes
  useEffect(() => {
    const rate = CURRENCY_CONFIG[downPaymentCurrency].toILS;
    setDownPayment(Math.round(downPaymentInput * rate));
  }, [downPaymentInput, downPaymentCurrency]);

  const handleDownPaymentCurrencyChange = (newCurrency: DownPaymentCurrency) => {
    // Convert existing input value to new currency
    const currentILS = downPaymentInput * CURRENCY_CONFIG[downPaymentCurrency].toILS;
    const newRate = CURRENCY_CONFIG[newCurrency].toILS;
    setDownPaymentInput(Math.round(currentILS / newRate));
    setDownPaymentCurrency(newCurrency);
  };

  // Track user interaction
  useEffect(() => {
    if (monthlyIncome !== DEFAULTS.monthlyIncome || downPayment !== DEFAULTS.downPayment) {
      setHasInteracted(true);
      trackChange();
    }
  }, [monthlyIncome, downPayment, trackChange]);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.monthlyIncome) setMonthlyIncome(parsed.monthlyIncome);
        if (parsed.spouseIncome) setSpouseIncome(parsed.spouseIncome);
        if (parsed.monthlyDebts !== undefined) setMonthlyDebts(parsed.monthlyDebts);
        if (parsed.downPaymentInput) setDownPaymentInput(parsed.downPaymentInput);
        if (parsed.downPaymentCurrency) setDownPaymentCurrency(parsed.downPaymentCurrency);
        if (parsed.interestRate) setInterestRate(parsed.interestRate);
        if (parsed.loanTermYears) setLoanTermYears(parsed.loanTermYears);
        if (parsed.employmentType) setEmploymentType(parsed.employmentType);
        if (parsed.hasForeignIncome !== undefined) setHasForeignIncome(parsed.hasForeignIncome);
        if (parsed.foreignIncomePercent !== undefined) setForeignIncomePercent(parsed.foreignIncomePercent);
      } catch (e) {
        console.error('Failed to parse saved inputs', e);
      }
    }
  }, []);

  useEffect(() => {
    const data = {
      monthlyIncome, spouseIncome, monthlyDebts, downPaymentInput, downPaymentCurrency, interestRate,
      loanTermYears, employmentType, hasForeignIncome, foreignIncomePercent,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [monthlyIncome, spouseIncome, monthlyDebts, downPaymentInput, downPaymentCurrency, interestRate, loanTermYears, employmentType, hasForeignIncome, foreignIncomePercent]);

  useEffect(() => {
    if (buyerProfile) {
      if (buyerProfile.residency_status === 'oleh_hadash') setSelectedBuyerType('oleh');
      else if (buyerProfile.residency_status === 'non_resident') setSelectedBuyerType('foreign');
      else if (buyerProfile.is_first_property) setSelectedBuyerType('first_time');
      else if (buyerProfile.purchase_purpose === 'investment') setSelectedBuyerType('investor');
      else setSelectedBuyerType('additional');
    }
  }, [buyerProfile]);

  const calculations = useMemo(() => {
    const empOption = EMPLOYMENT_OPTIONS.find(e => e.value === employmentType);
    const employmentMultiplier = empOption?.multiplier || 1.0;
    let grossIncome = (monthlyIncome + spouseIncome) * employmentMultiplier;
    if (hasForeignIncome && foreignIncomePercent > 0) {
      const foreignPortion = grossIncome * (foreignIncomePercent / 100);
      grossIncome = (grossIncome - foreignPortion) + (foreignPortion * 0.6);
    }
    const effectiveIncome = grossIncome;
    const maxPTI = MAX_PTI;
    const maxLTV = (selectedBuyerType === 'oleh' && !olehIsFirstProperty) 
      ? (LTV_BY_CATEGORY['investor'] ?? 0.50) 
      : (LTV_BY_CATEGORY[selectedBuyerType] ?? 0.75);
    const availableForMortgage = Math.max(0, effectiveIncome * maxPTI - monthlyDebts);
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTermYears * 12;
    let maxLoanAmount = 0;
    if (monthlyRate > 0 && availableForMortgage > 0) {
      maxLoanAmount = availableForMortgage * (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate;
    }
    const maxPropertyFromLTV = downPayment / (1 - maxLTV);
    const maxPropertyFromLoan = maxLoanAmount + downPayment;
    const maxPropertyPrice = Math.min(maxPropertyFromLTV, maxPropertyFromLoan);
    const limitingFactor = maxPropertyFromLTV < maxPropertyFromLoan ? 'LTV' : 'PTI';
    const actualLoanNeeded = Math.max(0, maxPropertyPrice - downPayment);
    let actualMonthlyPayment = 0;
    if (monthlyRate > 0 && actualLoanNeeded > 0) {
      actualMonthlyPayment = actualLoanNeeded * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    }
    
    // Calculate payment range using rate variance
    const lowRateMonthly = monthlyRate > 0 ? actualLoanNeeded * ((MORTGAGE_RATE_RANGES.low / 100 / 12) * Math.pow(1 + MORTGAGE_RATE_RANGES.low / 100 / 12, numPayments)) / (Math.pow(1 + MORTGAGE_RATE_RANGES.low / 100 / 12, numPayments) - 1) : 0;
    const highRateMonthly = monthlyRate > 0 ? actualLoanNeeded * ((MORTGAGE_RATE_RANGES.high / 100 / 12) * Math.pow(1 + MORTGAGE_RATE_RANGES.high / 100 / 12, numPayments)) / (Math.pow(1 + MORTGAGE_RATE_RANGES.high / 100 / 12, numPayments) - 1) : 0;
    
    // Calculate max property range at different rates
    const highRateMonthlyRatio = (MORTGAGE_RATE_RANGES.high / 100 / 12);
    const lowRateMonthlyRatio = (MORTGAGE_RATE_RANGES.low / 100 / 12);
    let maxLoanAtHighRate = 0, maxLoanAtLowRate = 0;
    if (highRateMonthlyRatio > 0 && availableForMortgage > 0) {
      maxLoanAtHighRate = availableForMortgage * (1 - Math.pow(1 + highRateMonthlyRatio, -numPayments)) / highRateMonthlyRatio;
      maxLoanAtLowRate = availableForMortgage * (1 - Math.pow(1 + lowRateMonthlyRatio, -numPayments)) / lowRateMonthlyRatio;
    }
    const maxPropertyAtHighRate = Math.min(maxPropertyFromLTV, maxLoanAtHighRate + downPayment);
    const maxPropertyAtLowRate = Math.min(maxPropertyFromLTV, maxLoanAtLowRate + downPayment);
    
    const stressedRate = (interestRate + 2) / 100 / 12;
    let stressedMaxLoan = 0;
    if (stressedRate > 0 && availableForMortgage > 0) {
      stressedMaxLoan = availableForMortgage * (1 - Math.pow(1 + stressedRate, -numPayments)) / stressedRate;
    }
    const stressedMaxProperty = Math.min(maxPropertyFromLTV, stressedMaxLoan + downPayment);
    const stressedReduction = maxPropertyPrice - stressedMaxProperty;
    const totalBurden = effectiveIncome > 0 ? (monthlyDebts + actualMonthlyPayment) / effectiveIncome : 0;
    let affordabilityScore = 100;
    if (totalBurden > 0.5) affordabilityScore = 20;
    else if (totalBurden > 0.4) affordabilityScore = 40;
    else if (totalBurden > 0.35) affordabilityScore = 60;
    else if (totalBurden > 0.3) affordabilityScore = 80;
    const mortgagePercent = effectiveIncome > 0 ? (actualMonthlyPayment / effectiveIncome) * 100 : 0;
    const debtsPercent = effectiveIncome > 0 ? (monthlyDebts / effectiveIncome) * 100 : 0;
    const remainingPercent = Math.max(0, 100 - mortgagePercent - debtsPercent);
    return {
      effectiveIncome, maxPropertyPrice: Math.round(maxPropertyPrice), maxLoanAmount: Math.round(maxLoanAmount),
      availableForMortgage: Math.round(availableForMortgage), actualMonthlyPayment: Math.round(actualMonthlyPayment),
      maxLTV: maxLTV * 100, limitingFactor, stressedMaxProperty: Math.round(stressedMaxProperty),
      stressedReduction: Math.round(stressedReduction), affordabilityScore, mortgagePercent, debtsPercent,
      remainingPercent, employmentMultiplier,
      // New range fields
      monthlyPaymentLow: Math.round(lowRateMonthly),
      monthlyPaymentHigh: Math.round(highRateMonthly),
      maxPropertyLow: Math.round(Math.min(maxPropertyAtHighRate, MAX_DISPLAY_PROPERTY_PRICE)),
      maxPropertyHigh: Math.round(Math.min(maxPropertyAtLowRate, MAX_DISPLAY_PROPERTY_PRICE)),
    };
  }, [monthlyIncome, spouseIncome, monthlyDebts, downPayment, interestRate, loanTermYears, employmentType, hasForeignIncome, foreignIncomePercent, selectedBuyerType, olehIsFirstProperty]);

  // Track additional field changes for save prompt
  useEffect(() => {
    trackChange();
  }, [spouseIncome, monthlyDebts, interestRate, loanTermYears, employmentType, trackChange]);

  const handleReset = () => {
    setMonthlyIncome(DEFAULTS.monthlyIncome); setSpouseIncome(DEFAULTS.spouseIncome);
    setMonthlyDebts(DEFAULTS.monthlyDebts); setDownPaymentInput(DEFAULTS.downPayment);
    setDownPaymentCurrency('USD');
    setInterestRate(DEFAULTS.interestRate); setLoanTermYears(DEFAULTS.loanTermYears);
    setEmploymentType(DEFAULTS.employmentType); setHasForeignIncome(DEFAULTS.hasForeignIncome);
    setForeignIncomePercent(DEFAULTS.foreignIncomePercent);
    sessionStorage.removeItem(STORAGE_KEY);
    toast.success('Calculator reset to defaults');
  };

  const handleSave = async () => {
    if (!user) { toast.error('Please sign in to save your results'); return; }
    await saveToProfile.mutateAsync({
      calculatorType: 'affordability',
      name: `Affordability - ${formatPrice(calculations.maxPropertyPrice)}`,
      inputs: { monthlyIncome, spouseIncome, monthlyDebts, downPayment, interestRate, loanTermYears, employmentType, hasForeignIncome, foreignIncomePercent, buyerType: selectedBuyerType },
      results: { maxPropertyPrice: calculations.maxPropertyPrice, maxLoanAmount: calculations.maxLoanAmount, monthlyPayment: calculations.actualMonthlyPayment, effectiveIncome: calculations.effectiveIncome, affordabilityScore: calculations.affordabilityScore },
    });
  };

  const insight = useMemo(() => {
    const tips: string[] = [];
    
    // Tone shift based on affordability score
    if (calculations.affordabilityScore <= 40) {
      tips.push(`This is a stretched budget — your total debt burden is above 40% of income. Banks may still approve, but you'll feel the squeeze monthly.`);
    } else if (calculations.affordabilityScore >= 80) {
      tips.push(`Comfortable position — your debt-to-income ratio leaves room for unexpected expenses. You're in a strong negotiating spot with banks.`);
    } else if (calculations.limitingFactor === 'LTV') {
      tips.push(`Your down payment of ${formatPrice(downPayment)} limits your buying power. Saving more could unlock higher-priced properties.`);
    } else {
      tips.push(`Your monthly income is the limiting factor right now.`);
    }
    
    // Specific debt-clearing insight with real numbers
    if (monthlyDebts > 0 && calculations.limitingFactor === 'PTI') {
      const monthlyRate = interestRate / 100 / 12;
      const numPayments = loanTermYears * 12;
      const maxLTV = (selectedBuyerType === 'oleh' && !olehIsFirstProperty) 
        ? (LTV_BY_CATEGORY['investor'] ?? 0.50) 
        : (LTV_BY_CATEGORY[selectedBuyerType] ?? 0.75);
      let extraLoan = 0;
      if (monthlyRate > 0) {
        extraLoan = monthlyDebts * (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate;
      }
      const extraBudget = Math.min(extraLoan + downPayment, extraLoan / maxLTV) - calculations.maxPropertyPrice + calculations.maxPropertyPrice;
      const budgetIncrease = Math.round(extraLoan);
      if (budgetIncrease > 50000) {
        tips.push(`Clearing your ${formatPrice(monthlyDebts)}/month in debts would raise your max property price by ~${formatPrice(budgetIncrease)}.`);
      }
    }
    
    // Rate sensitivity with specific number
    if (calculations.stressedReduction > 50000) {
      tips.push(`If rates rise 2%, your budget drops by ${formatPrice(calculations.stressedReduction)} — consider locking a fixed-rate track for stability.`);
    }
    
    // Employment/foreign income (only if not already at 3 tips)
    if (tips.length < 3 && calculations.employmentMultiplier < 1) {
      tips.push(`As a ${employmentType === 'self_employed' ? 'self-employed' : 'mixed income'} buyer, banks discount your income to ${Math.round(calculations.employmentMultiplier * 100)}% — your actual earning power is higher than what they count.`);
    }
    if (tips.length < 3 && hasForeignIncome && foreignIncomePercent > 30) {
      tips.push(`${foreignIncomePercent}% of your income is foreign — banks discount this 30-40%, significantly reducing your borrowing capacity.`);
    }
    
    return tips.slice(0, 3).join(' ');
  }, [calculations, downPayment, monthlyDebts, interestRate, loanTermYears, selectedBuyerType, employmentType, hasForeignIncome, foreignIncomePercent, formatPrice]);

  const headerActions = (
    <>
      <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
        <RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">Reset</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={handleSave} disabled={saveToProfile.isPending}>
        {saveToProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        <span className="hidden sm:inline ml-1.5">{saveToProfile.isPending ? 'Saving...' : 'Save'}</span>
      </Button>
    </>
  );

  return (
    <>
      <ToolLayout
        title="Affordability Calculator"
        subtitle="Your realistic buying budget — based on income, savings, and bank rules"
        icon={<Calculator className="h-6 w-6" />}
        headerActions={headerActions}
        
        infoBanner={<BuyerTypeInfoBanner selectedType={selectedBuyerType} onTypeChange={setSelectedBuyerType} extended onOlehFirstPropertyChange={setOlehIsFirstProperty} olehIsFirstProperty={olehIsFirstProperty} />}
        leftColumn={
          <div className="space-y-4">
            <ExampleValuesHint />
            <Card>
              <CardHeader className="pb-4"><CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" />Income Details</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center">Employment Type<InfoTooltip content="Self-employed income is discounted 30% by Israeli banks." /></Label>
                  <Select value={employmentType} onValueChange={setEmploymentType}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{EMPLOYMENT_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent></Select>
                  {employmentType !== 'employed' && <p className="text-xs text-muted-foreground">Banks count {Math.round(calculations.employmentMultiplier * 100)}% of your income</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center">Your Monthly Gross Income<InfoTooltip content="Your salary before taxes and deductions. Israeli banks use gross income for debt-to-income (PTI) calculations." /></Label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span><Input type="text" value={formatNumber(monthlyIncome)} onChange={(e) => setMonthlyIncome(parseFormattedNumber(e.target.value))} className="h-11 pl-8" /></div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center">Spouse/Partner Gross Income<InfoTooltip content="Banks evaluate each income separately — if one spouse is self-employed, only that portion gets discounted. Combined gross household income increases buying power." /></Label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span><Input type="text" value={formatNumber(spouseIncome)} onChange={(e) => setSpouseIncome(parseFormattedNumber(e.target.value))} className="h-11 pl-8" /></div>
                </div>
                <div className="space-y-3">
                   <div className="flex items-center justify-between"><Label className="text-sm font-medium flex items-center">Income Earned Abroad<InfoTooltip content="If part of your salary comes from a foreign employer or overseas work, Israeli banks discount it 30-40% because it's harder to verify. This reduces your borrowing power." /></Label><Switch checked={hasForeignIncome} onCheckedChange={setHasForeignIncome} /></div>
                   {hasForeignIncome && <div className="space-y-2"><Label className="text-xs text-muted-foreground">What percentage of your income is from abroad?</Label><Slider value={[foreignIncomePercent]} onValueChange={([v]) => setForeignIncomePercent(v)} min={0} max={100} step={5} /><p className="text-xs text-muted-foreground text-right">{foreignIncomePercent}%</p></div>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-4"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Debts & Savings</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center">Monthly Debt Payments<InfoTooltip content="Include car loans, credit cards, other loans. Banks count these against your borrowing capacity." /></Label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span><Input type="text" value={formatNumber(monthlyDebts)} onChange={(e) => setMonthlyDebts(parseFormattedNumber(e.target.value))} className="h-11 pl-8" /></div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center">Down Payment Available<InfoTooltip content={`Cash you have for down payment. ${selectedBuyerType === 'first_time' || selectedBuyerType === 'oleh' ? 'First-time buyers/Olim need at least 25% down.' : selectedBuyerType === 'additional' || selectedBuyerType === 'upgrader' ? 'Upgraders need at least 30% down.' : 'Investors/foreign buyers need at least 50% down.'}`} /></Label>
                  <div className="flex gap-2">
                    <Select value={downPaymentCurrency} onValueChange={(v) => handleDownPaymentCurrencyChange(v as DownPaymentCurrency)}>
                      <SelectTrigger className="h-11 w-[90px] shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ILS">₪ ILS</SelectItem>
                        <SelectItem value="USD">$ USD</SelectItem>
                        <SelectItem value="EUR">€ EUR</SelectItem>
                        <SelectItem value="GBP">£ GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{CURRENCY_CONFIG[downPaymentCurrency].symbol}</span>
                      <Input type="text" value={formatNumber(downPaymentInput)} onChange={(e) => setDownPaymentInput(parseFormattedNumber(e.target.value))} className="h-11 pl-8" />
                    </div>
                  </div>
                  {downPaymentCurrency !== 'ILS' && (
                    <p className="text-xs text-muted-foreground">
                      ≈ ₪{formatNumber(downPayment)} at today's rate ({CURRENCY_CONFIG[downPaymentCurrency].symbol}1 = ₪{CURRENCY_CONFIG[downPaymentCurrency].toILS})
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-4"><CardTitle className="text-base flex items-center gap-2"><Percent className="h-4 w-4 text-primary" />Loan Assumptions</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center">Interest Rate<InfoTooltip content="Average blended rate across mortgage tracks. Current market is 4.5-6%." /></Label>
                  <Slider value={[interestRate]} onValueChange={([v]) => setInterestRate(v)} min={3} max={8} step={0.1} />
                  <p className="text-sm text-muted-foreground text-right">{interestRate.toFixed(1)}%</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center">Loan Term<InfoTooltip content="Maximum 30 years in Israel. Longer terms mean lower payments but more interest." /></Label>
                  <Select value={loanTermYears.toString()} onValueChange={(v) => setLoanTermYears(parseInt(v))}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{LOAN_TERMS.map((term) => (<SelectItem key={term} value={term.toString()}>{term} years</SelectItem>))}</SelectContent></Select>
                </div>
              </CardContent>
            </Card>
          </div>
        }
        rightColumn={
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader className="pb-2"><CardTitle className="text-lg">Your Maximum Budget</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground mb-2">Based on {MORTGAGE_RATE_RANGES.low}–{MORTGAGE_RATE_RANGES.high}% rates</p>
                <motion.p key={calculations.maxPropertyPrice} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl md:text-5xl font-bold text-primary whitespace-nowrap">
                  {formatCurrencyRange(calculations.maxPropertyLow, calculations.maxPropertyHigh, currencySymbol)}
                </motion.p>
                <p className="text-sm text-muted-foreground mt-2">Maximum property price range</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/60"><p className="text-xs text-muted-foreground">Maximum Loan</p><p className="text-lg font-semibold">{formatPrice(calculations.maxLoanAmount)}</p></div>
                <div className="p-3 rounded-lg bg-muted/60">
                  <p className="text-xs text-muted-foreground">Monthly Payment</p>
                  <p className="text-lg font-semibold">
                    {formatCurrencyRange(calculations.monthlyPaymentLow, calculations.monthlyPaymentHigh, currencySymbol)}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Affordability Score</span><span className={cn("font-medium", calculations.affordabilityScore >= 80 ? "text-semantic-green-foreground" : calculations.affordabilityScore >= 60 ? "text-semantic-amber-foreground" : "text-semantic-red-foreground")}>{calculations.affordabilityScore >= 80 ? 'Comfortable' : calculations.affordabilityScore >= 60 ? 'Stretched' : 'At Limit'}</span></div>
                <Progress value={calculations.affordabilityScore} className={cn("h-2", calculations.affordabilityScore >= 80 ? "[&>div]:bg-semantic-green" : calculations.affordabilityScore >= 60 ? "[&>div]:bg-semantic-amber" : "[&>div]:bg-semantic-red")} />
              </div>
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Income Breakdown</p>
                <div className="h-3 rounded-full overflow-hidden flex">
                  <div style={{ width: `${calculations.mortgagePercent}%` }} className="bg-primary" />
                  <div style={{ width: `${calculations.debtsPercent}%` }} className="bg-muted-foreground/40" />
                  <div style={{ width: `${calculations.remainingPercent}%` }} className="bg-muted" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />Mortgage {calculations.mortgagePercent.toFixed(0)}%</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/40" />Debts {calculations.debtsPercent.toFixed(0)}%</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted border border-border" />Free {calculations.remainingPercent.toFixed(0)}%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-xs text-muted-foreground">
                  <strong>Rate sensitivity:</strong> If rates rise 1%, your max budget drops by ~{formatPrice(Math.round(calculations.stressedReduction / 2))}
                </p>
              </div>
              {calculations.limitingFactor === 'LTV' ? <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20"><AlertTriangle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" /><p className="text-xs text-primary">Your down payment limits your budget. With more cash down, you could afford a higher-priced property.</p></div> : <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20"><BadgeCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" /><p className="text-xs text-primary">Your income is the limiting factor. Paying off existing debts would increase your buying power.</p></div>}
              {hasInteracted && calculations.maxPropertyPrice > 0 && (
                <div
                  className="p-3 rounded-lg bg-muted/50 border border-border/50 cursor-pointer hover:border-primary/30 hover:bg-muted/80 transition-colors group"
                  onClick={() => navigate(toolUrl(TOOL_IDS.TOTAL_COST, { price: calculations.maxPropertyPrice }))}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Receipt className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Next step:</span> See what buying at {formatPrice(calculations.maxPropertyPrice)} actually costs, all-in
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        }
        bottomSection={
          <div className="space-y-6">
            {/* 1. Interpret */}
            {insight && <InsightCard insights={[insight]} />}
            {/* 2. Understand */}
            {hasInteracted && (
            <Collapsible open={educationOpen} onOpenChange={setEducationOpen}>
              <Card><CollapsibleTrigger asChild><CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors"><div className="flex items-center justify-between"><CardTitle className="text-base">How Israeli Banks Calculate Your Budget</CardTitle><ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", educationOpen && "rotate-180")} /></div></CardHeader></CollapsibleTrigger><CollapsibleContent><CardContent className="pt-0 grid md:grid-cols-2 gap-4"><div className="space-y-2"><h4 className="font-medium text-sm">PTI Ratio</h4><p className="text-sm text-muted-foreground">Bank of Israel limits debt payments to {Math.round(MAX_PTI * 100)}% of income for all buyers (Directive 329 v11, April 2025).</p></div><div className="space-y-2"><h4 className="font-medium text-sm">LTV Limits</h4><p className="text-sm text-muted-foreground">First-time buyers/Olim can borrow up to {Math.round(LTV_BY_CATEGORY.first_time * 100)}% ({Math.round((1 - LTV_BY_CATEGORY.first_time) * 100)}% down). Upgraders can borrow up to {Math.round(LTV_BY_CATEGORY.upgrader * 100)}% ({Math.round((1 - LTV_BY_CATEGORY.upgrader) * 100)}% down). Investors and foreign buyers need {Math.round((1 - LTV_BY_CATEGORY.investor) * 100)}% down.</p></div><div className="space-y-2"><h4 className="font-medium text-sm">Self-Employed Discount</h4><p className="text-sm text-muted-foreground">Banks count only 70% of self-employed income. You'll need 2+ years of tax returns.</p></div><div className="space-y-2"><h4 className="font-medium text-sm">Foreign Income Rules</h4><p className="text-sm text-muted-foreground">Income earned abroad is discounted 30-40% and requires extensive documentation.</p></div></CardContent></CollapsibleContent></Card>
            </Collapsible>
            )}
            <SourceAttribution toolType="affordability" />
            {/* 3. Act */}
            <ToolPropertySuggestions
              title="Properties in Your Budget"
              subtitle="Based on your income, savings, and current rates"
              minPrice={Math.round(calculations.maxPropertyPrice * 0.7)}
              maxPrice={calculations.maxPropertyPrice}
              enabled={hasInteracted && calculations.maxPropertyPrice > 0}
            />
            {/* 4. Engage */}
            <ToolFeedback toolName="affordability-calculator" variant="inline" />
            
            {/* 5. Explore (exit points — always last) */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => navigate('/tools?tool=mortgage')}><Calculator className="h-5 w-5 text-primary mb-2" /><h4 className="font-medium text-sm group-hover:text-primary transition-colors">Mortgage Calculator</h4><p className="text-xs text-muted-foreground mt-1">See monthly payments for your max budget</p></Card>
              <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => navigate('/listings')}><Building2 className="h-5 w-5 text-primary mb-2" /><h4 className="font-medium text-sm group-hover:text-primary transition-colors">Browse Properties</h4><p className="text-xs text-muted-foreground mt-1">Find homes in your price range</p></Card>
              <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => navigate('/guides/buying-in-israel')}><BookOpen className="h-5 w-5 text-primary mb-2" /><h4 className="font-medium text-sm group-hover:text-primary transition-colors">Complete Buyer's Guide</h4><p className="text-xs text-muted-foreground mt-1">Everything you need to know</p></Card>
            </div>
          </div>
        }
      />
      <SaveResultsPrompt
        show={showSavePrompt}
        calculatorName="affordability"
        onDismiss={dismissSavePrompt}
        resultSummary={`Max budget: ${formatCurrencyRange(calculations.maxPropertyLow, calculations.maxPropertyHigh, currencySymbol)}`}
      />
    </>
  );
}

export default function AffordabilityCalculator() {
  return <AffordabilityCalculatorContent />;
}
