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
  Lightbulb
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
import { useAuth } from '@/hooks/useAuth';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { useSaveCalculatorResult } from '@/hooks/useSavedCalculatorResults';
import { usePreferences } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const STORAGE_KEY = 'affordability-calculator-inputs';

const DEFAULTS = {
  monthlyIncome: 25000,
  spouseIncome: 0,
  monthlyDebts: 2000,
  downPayment: 500000,
  interestRate: 5.5,
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

const MAX_PTI_FIRST_HOME = 0.40;
const MAX_PTI_ADDITIONAL = 0.35;
const MAX_LTV_FIRST_HOME = 0.75;
const MAX_LTV_ADDITIONAL = 0.50;

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
  const [interestRate, setInterestRate] = useState(DEFAULTS.interestRate);
  const [loanTermYears, setLoanTermYears] = useState(DEFAULTS.loanTermYears);
  const [employmentType, setEmploymentType] = useState<string>(DEFAULTS.employmentType);
  const [hasForeignIncome, setHasForeignIncome] = useState(DEFAULTS.hasForeignIncome);
  const [foreignIncomePercent, setForeignIncomePercent] = useState(DEFAULTS.foreignIncomePercent);
  
  const [educationOpen, setEducationOpen] = useState(false);
  const [stressTestOpen, setStressTestOpen] = useState(false);
  const [selectedBuyerType, setSelectedBuyerType] = useState<BuyerCategory>('first_time');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.monthlyIncome) setMonthlyIncome(parsed.monthlyIncome);
        if (parsed.spouseIncome) setSpouseIncome(parsed.spouseIncome);
        if (parsed.monthlyDebts !== undefined) setMonthlyDebts(parsed.monthlyDebts);
        if (parsed.downPayment) setDownPayment(parsed.downPayment);
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
      monthlyIncome, spouseIncome, monthlyDebts, downPayment, interestRate,
      loanTermYears, employmentType, hasForeignIncome, foreignIncomePercent,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [monthlyIncome, spouseIncome, monthlyDebts, downPayment, interestRate, loanTermYears, employmentType, hasForeignIncome, foreignIncomePercent]);

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
    const isFirstHome = selectedBuyerType === 'first_time' || selectedBuyerType === 'oleh';
    const maxPTI = isFirstHome ? MAX_PTI_FIRST_HOME : MAX_PTI_ADDITIONAL;
    const maxLTV = isFirstHome ? MAX_LTV_FIRST_HOME : MAX_LTV_ADDITIONAL;
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
    };
  }, [monthlyIncome, spouseIncome, monthlyDebts, downPayment, interestRate, loanTermYears, employmentType, hasForeignIncome, foreignIncomePercent, selectedBuyerType]);

  const handleReset = () => {
    setMonthlyIncome(DEFAULTS.monthlyIncome); setSpouseIncome(DEFAULTS.spouseIncome);
    setMonthlyDebts(DEFAULTS.monthlyDebts); setDownPayment(DEFAULTS.downPayment);
    setInterestRate(DEFAULTS.interestRate); setLoanTermYears(DEFAULTS.loanTermYears);
    setEmploymentType(DEFAULTS.employmentType); setHasForeignIncome(DEFAULTS.hasForeignIncome);
    setForeignIncomePercent(DEFAULTS.foreignIncomePercent);
    localStorage.removeItem(STORAGE_KEY);
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
    if (calculations.limitingFactor === 'LTV') tips.push(`Your down payment of ${formatPrice(downPayment)} limits your buying power. Saving more could unlock higher-priced properties.`);
    else tips.push(`Your monthly income is the limiting factor. Reducing existing debts would increase your maximum property price.`);
    if (calculations.employmentMultiplier < 1) tips.push(`As a ${employmentType === 'self_employed' ? 'self-employed' : 'mixed income'} buyer, banks discount your income.`);
    if (hasForeignIncome && foreignIncomePercent > 30) tips.push(`Foreign income is typically discounted 30-40% by Israeli banks.`);
    return tips.slice(0, 2).join(' ');
  }, [calculations, downPayment, employmentType, hasForeignIncome, foreignIncomePercent, formatPrice]);

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
    <ToolLayout
      title="Affordability Calculator"
      subtitle="See how much you can actually borrow — using real Israeli bank limits"
      icon={<Calculator className="h-6 w-6" />}
      headerActions={headerActions}
      intro={<ToolIntro {...TOOL_INTROS.affordability} />}
      infoBanner={<BuyerTypeInfoBanner selectedType={selectedBuyerType} onTypeChange={setSelectedBuyerType} extended />}
      leftColumn={
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" />Income Details</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">Employment Type<InfoTooltip content="Self-employed income is discounted 30% by Israeli banks." /></Label>
                <Select value={employmentType} onValueChange={setEmploymentType}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{EMPLOYMENT_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent></Select>
                {employmentType !== 'employed' && <p className="text-xs text-muted-foreground">Banks count {Math.round(calculations.employmentMultiplier * 100)}% of your income</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">Your Monthly Net Income<InfoTooltip content="Your take-home pay after taxes." /></Label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span><Input type="text" value={formatNumber(monthlyIncome)} onChange={(e) => setMonthlyIncome(parseFormattedNumber(e.target.value))} className="h-11 pl-8" /></div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center"><Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />Spouse/Partner Income<InfoTooltip content="Include partner's income if applying jointly." /></Label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span><Input type="text" value={formatNumber(spouseIncome)} onChange={(e) => setSpouseIncome(parseFormattedNumber(e.target.value))} className="h-11 pl-8" /></div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between"><Label className="text-sm font-medium flex items-center">Include Foreign Income<InfoTooltip content="Foreign income is discounted 30-40% by banks." /></Label><Switch checked={hasForeignIncome} onCheckedChange={setHasForeignIncome} /></div>
                {hasForeignIncome && (<div className="mt-4 space-y-2"><Label className="text-sm text-muted-foreground">What % is from abroad?</Label><div className="flex items-center gap-4"><Slider value={[foreignIncomePercent]} onValueChange={([val]) => setForeignIncomePercent(val)} min={0} max={100} step={5} className="flex-1" /><span className="text-sm font-medium w-12 text-right">{foreignIncomePercent}%</span></div></div>)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" />Financial Position</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">Existing Monthly Debts<InfoTooltip content="Car loans, credit cards, etc." /></Label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span><Input type="text" value={formatNumber(monthlyDebts)} onChange={(e) => setMonthlyDebts(parseFormattedNumber(e.target.value))} className="h-11 pl-8" /></div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center"><PiggyBank className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />Down Payment Saved<InfoTooltip content="First-time buyers need 25% down. Investors need 50%." /></Label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span><Input type="text" value={formatNumber(downPayment)} onChange={(e) => setDownPayment(parseFormattedNumber(e.target.value))} className="h-11 pl-8" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base flex items-center gap-2"><Percent className="h-4 w-4 text-primary" />Loan Assumptions</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">Interest Rate<InfoTooltip content="Current rates range 4.5-6.5%." /></Label>
                <div className="relative"><Input type="number" value={interestRate} onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)} step={0.1} min={1} max={15} className="h-11 pr-8" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span></div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center"><Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />Loan Term<InfoTooltip content="Typically 20-30 years in Israel." /></Label>
                <Select value={loanTermYears.toString()} onValueChange={(v) => setLoanTermYears(parseInt(v))}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{LOAN_TERMS.map((term) => (<SelectItem key={term} value={term.toString()}>{term} years</SelectItem>))}</SelectContent></Select>
              </div>
            </CardContent>
          </Card>
        </div>
      }
      rightColumn={
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Max Property Price</p>
            <motion.p key={calculations.maxPropertyPrice} initial={{ opacity: 0.5, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">{formatPrice(calculations.maxPropertyPrice)}</motion.p>
            <p className="text-sm text-muted-foreground mt-2">based on Bank of Israel {calculations.limitingFactor} limits</p>
            {calculations.stressedReduction > 0 && (<div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium"><AlertTriangle className="h-3 w-3" />If rates rise 2%: {formatPrice(calculations.stressedMaxProperty)}</div>)}
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-border">
            <div className="p-4 text-center"><p className="text-xs text-muted-foreground mb-0.5">Safe Monthly Payment</p><p className="text-lg font-semibold">{formatPrice(calculations.availableForMortgage)}</p></div>
            <div className="p-4 text-center"><p className="text-xs text-muted-foreground mb-0.5">Effective Income</p><p className="text-lg font-semibold">{formatPrice(calculations.effectiveIncome)}</p></div>
            <div className="p-4 text-center"><p className="text-xs text-muted-foreground mb-0.5">Max Loan Amount</p><p className="text-lg font-semibold">{formatPrice(calculations.maxLoanAmount)}</p></div>
            <div className="p-4 text-center"><p className="text-xs text-muted-foreground mb-0.5">Your LTV Limit</p><p className="text-lg font-semibold">{calculations.maxLTV}%</p></div>
          </div>
          <div className="p-4 border-t">
            <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium">Affordability Score</span><span className={cn("text-sm font-semibold", calculations.affordabilityScore >= 80 ? "text-green-600" : calculations.affordabilityScore >= 60 ? "text-amber-600" : "text-red-600")}>{calculations.affordabilityScore >= 80 ? "Comfortable" : calculations.affordabilityScore >= 60 ? "Moderate" : calculations.affordabilityScore >= 40 ? "Stretched" : "At Limit"}</span></div>
            <Progress value={calculations.affordabilityScore} className="h-2" />
          </div>
          <div className="p-4 border-t">
            <p className="text-sm font-medium mb-3">Income Allocation</p>
            <div className="flex h-3 rounded-full overflow-hidden bg-muted"><div className="bg-primary transition-all" style={{ width: `${calculations.mortgagePercent}%` }} /><div className="bg-amber-500 transition-all" style={{ width: `${calculations.debtsPercent}%` }} /><div className="bg-green-500 transition-all" style={{ width: `${calculations.remainingPercent}%` }} /></div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />Mortgage {Math.round(calculations.mortgagePercent)}%</span><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Debts {Math.round(calculations.debtsPercent)}%</span><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Buffer {Math.round(calculations.remainingPercent)}%</span></div>
          </div>
          <div className="p-4 border-t bg-muted/30"><div className="flex gap-2"><AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /><p className="text-sm text-muted-foreground">{calculations.limitingFactor === 'LTV' ? `Your down payment sets the limit.` : `Your income-to-debt ratio sets the limit.`}</p></div></div>
        </Card>
      }
      bottomSection={
        <div className="space-y-6">
          <Collapsible open={educationOpen} onOpenChange={setEducationOpen}>
            <Card><CollapsibleTrigger asChild><CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors"><div className="flex items-center justify-between"><CardTitle className="text-base">How Israeli Banks Calculate Your Budget</CardTitle><ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", educationOpen && "rotate-180")} /></div></CardHeader></CollapsibleTrigger><CollapsibleContent><CardContent className="pt-0 grid md:grid-cols-2 gap-4"><div className="space-y-2"><h4 className="font-medium text-sm">PTI Ratio</h4><p className="text-sm text-muted-foreground">Bank of Israel limits debt payments to 40% of income for first homes, 35% for additional properties.</p></div><div className="space-y-2"><h4 className="font-medium text-sm">LTV Limits</h4><p className="text-sm text-muted-foreground">First-time buyers can borrow up to 75% (25% down). Investors need 50% down.</p></div><div className="space-y-2"><h4 className="font-medium text-sm">Self-Employed Discount</h4><p className="text-sm text-muted-foreground">Banks count only 70% of self-employed income. You'll need 2+ years of tax returns.</p></div><div className="space-y-2"><h4 className="font-medium text-sm">Foreign Income Rules</h4><p className="text-sm text-muted-foreground">Income earned abroad is discounted 30-40% and requires extensive documentation.</p></div></CardContent></CollapsibleContent></Card>
          </Collapsible>
          <Collapsible open={stressTestOpen} onOpenChange={setStressTestOpen}>
            <Card><CollapsibleTrigger asChild><CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors"><div className="flex items-center justify-between"><CardTitle className="text-base">What If Rates Rise?</CardTitle><ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", stressTestOpen && "rotate-180")} /></div></CardHeader></CollapsibleTrigger><CollapsibleContent><CardContent className="pt-0"><div className="grid sm:grid-cols-2 gap-4"><div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20"><p className="text-sm font-medium text-amber-600 dark:text-amber-400">+1% Rate Increase</p><p className="text-2xl font-bold mt-1">{formatPrice(Math.round(calculations.maxPropertyPrice - (calculations.stressedReduction / 2)))}</p></div><div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20"><p className="text-sm font-medium text-red-600 dark:text-red-400">+2% Rate Increase</p><p className="text-2xl font-bold mt-1">{formatPrice(calculations.stressedMaxProperty)}</p></div></div></CardContent></CollapsibleContent></Card>
          </Collapsible>
          {insight && <InsightCard insights={[insight]} />}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2"><BadgeCheck className="h-4 w-4 text-primary" /><span>Calculated for Israel — using Bank of Israel regulations</span></div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => navigate('/tools/mortgage')}><Calculator className="h-5 w-5 text-primary mb-2" /><h4 className="font-medium text-sm group-hover:text-primary transition-colors">Mortgage Calculator</h4><p className="text-xs text-muted-foreground mt-1">See monthly payments for your max budget</p></Card>
            <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => navigate('/tools/true-cost')}><Wallet className="h-5 w-5 text-primary mb-2" /><h4 className="font-medium text-sm group-hover:text-primary transition-colors">True Cost Calculator</h4><p className="text-xs text-muted-foreground mt-1">Calculate total cash needed to close</p></Card>
            <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => navigate('/listings')}><Building2 className="h-5 w-5 text-primary mb-2" /><h4 className="font-medium text-sm group-hover:text-primary transition-colors">Browse Properties</h4><p className="text-xs text-muted-foreground mt-1">Find homes in your price range</p></Card>
          </div>
          <ToolFeedback toolName="affordability-calculator" variant="inline" />
        </div>
      }
    />
  );
}

export default function AffordabilityCalculator() {
  return <AffordabilityCalculatorContent />;
}
