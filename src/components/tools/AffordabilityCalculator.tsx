// Affordability Calculator Component
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Wallet, Info, ChevronDown, RotateCcw, Save, ExternalLink, ArrowRight, Calculator, Building2, AlertTriangle, TrendingUp, Users, PiggyBank, CreditCard, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { 
  getMaxLTV,
  calculateForeignIncomeDiscount 
} from '@/lib/calculations/mortgage';
import type { BuyerType } from '@/lib/calculations/purchaseTax';
import { useBuyerProfile, getBuyerTaxCategory } from '@/hooks/useBuyerProfile';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSaveCalculatorResult } from '@/hooks/useSavedCalculatorResults';
import { Link } from 'react-router-dom';
import { 
  ToolLayout, 
  LTVIndicator,
  ToolDisclaimer,
  ToolFeedback,
  InsightCard,
  BuyerTypeInfoBanner,
  type BuyerCategory,
} from './shared';
import { ToolIntro, TOOL_INTROS } from './shared/ToolIntro';
import { useFormatPrice, useCurrencySymbol } from '@/contexts/PreferencesContext';

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

type EmploymentType = 'salaried' | 'self_employed' | 'mixed';

const LOAN_TERMS = [5, 10, 15, 20, 25, 30];

const DEFAULTS = {
  buyerType: 'first_time' as BuyerType,
  employmentType: 'salaried' as EmploymentType,
  monthlyIncome: 25000,
  spouseIncome: 0,
  selfEmployedIncome: 0,
  selfEmployedYears: 2,
  hasForeignIncome: false,
  foreignIncomeAmount: 0,
  foreignCurrency: 'USD' as 'USD' | 'EUR' | 'GBP',
  existingDebts: 0,
  downPaymentSaved: 400000,
  interestRate: 5.0,
  loanTerm: 25,
};

const PTI_LIMIT = 0.40; // Bank of Israel 40% limit
const STORAGE_KEY = 'affordability-calculator-saved';

const formatNumber = (num: number): string => num.toLocaleString('en-US');
const parseFormattedNumber = (str: string): number => {
  const cleaned = str.replace(/[^\d.-]/g, '');
  return Number(cleaned) || 0;
};

function AffordabilityCalculatorContent() {
  const formatCurrency = useFormatPrice();
  const currencySymbol = useCurrencySymbol();
  const { data: buyerProfile, isLoading: isProfileLoading } = useBuyerProfile();
  const { toast } = useToast();
  const { user } = useAuth();
  const saveToProfile = useSaveCalculatorResult();
  
  // Core inputs
  const [buyerType, setBuyerType] = useState<BuyerType>(DEFAULTS.buyerType);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(DEFAULTS.employmentType);
  
  // Income
  const [monthlyIncome, setMonthlyIncome] = useState(DEFAULTS.monthlyIncome);
  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState(formatNumber(DEFAULTS.monthlyIncome));
  const [spouseIncome, setSpouseIncome] = useState(DEFAULTS.spouseIncome);
  const [spouseIncomeInput, setSpouseIncomeInput] = useState(formatNumber(DEFAULTS.spouseIncome));
  
  // Self-employed
  const [selfEmployedIncome, setSelfEmployedIncome] = useState(DEFAULTS.selfEmployedIncome);
  const [selfEmployedIncomeInput, setSelfEmployedIncomeInput] = useState(formatNumber(DEFAULTS.selfEmployedIncome));
  const [selfEmployedYears, setSelfEmployedYears] = useState(DEFAULTS.selfEmployedYears);
  
  // Foreign income
  const [hasForeignIncome, setHasForeignIncome] = useState(DEFAULTS.hasForeignIncome);
  const [foreignIncomeAmount, setForeignIncomeAmount] = useState(DEFAULTS.foreignIncomeAmount);
  const [foreignIncomeInput, setForeignIncomeInput] = useState(formatNumber(DEFAULTS.foreignIncomeAmount));
  const [foreignCurrency, setForeignCurrency] = useState<'USD' | 'EUR' | 'GBP'>(DEFAULTS.foreignCurrency);
  
  // Debts & Expenses
  const [existingDebts, setExistingDebts] = useState(DEFAULTS.existingDebts);
  const [existingDebtsInput, setExistingDebtsInput] = useState(formatNumber(DEFAULTS.existingDebts));
  const [downPaymentSaved, setDownPaymentSaved] = useState(DEFAULTS.downPaymentSaved);
  const [downPaymentInput, setDownPaymentInput] = useState(formatNumber(DEFAULTS.downPaymentSaved));
  
  // Loan params
  const [interestRate, setInterestRate] = useState(DEFAULTS.interestRate);
  const [interestRateInput, setInterestRateInput] = useState(DEFAULTS.interestRate.toFixed(1));
  const [loanTerm, setLoanTerm] = useState(DEFAULTS.loanTerm);
  
  // Advanced
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get current buyer type info
  const currentBuyerType = BUYER_TYPE_OPTIONS.find(b => b.value === buyerType);
  const maxLTV = currentBuyerType?.maxLtv || 75;
  const minDownPaymentPercent = 100 - maxLTV;

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
          if (data.buyerType) setBuyerType(data.buyerType);
          if (data.employmentType) setEmploymentType(data.employmentType);
          if (data.monthlyIncome) {
            setMonthlyIncome(data.monthlyIncome);
            setMonthlyIncomeInput(formatNumber(data.monthlyIncome));
          }
          if (data.spouseIncome) {
            setSpouseIncome(data.spouseIncome);
            setSpouseIncomeInput(formatNumber(data.spouseIncome));
          }
          if (data.downPaymentSaved) {
            setDownPaymentSaved(data.downPaymentSaved);
            setDownPaymentInput(formatNumber(data.downPaymentSaved));
          }
          if (data.existingDebts) {
            setExistingDebts(data.existingDebts);
            setExistingDebtsInput(formatNumber(data.existingDebts));
          }
          if (data.interestRate) {
            setInterestRate(data.interestRate);
            setInterestRateInput(data.interestRate.toFixed(1));
          }
          if (data.loanTerm) setLoanTerm(data.loanTerm);
        }
      } catch (e) {}
    }
  }, []);

  // Calculations
  const calculations = useMemo(() => {
    // Calculate effective income
    let effectiveMonthlyIncome = monthlyIncome + spouseIncome;
    
    // Self-employed income (banks typically count 70-80% and require 2+ years of tax returns)
    let selfEmployedMultiplier = 100;
    if (employmentType === 'self_employed' || employmentType === 'mixed') {
      selfEmployedMultiplier = selfEmployedYears >= 3 ? 80 : selfEmployedYears >= 2 ? 70 : 50;
      effectiveMonthlyIncome += selfEmployedIncome * (selfEmployedMultiplier / 100);
    }
    
    // Foreign income discount
    let foreignIncomeContribution = 0;
    let foreignDiscountInfo = null;
    if (hasForeignIncome && foreignIncomeAmount > 0) {
      const exchangeRates: Record<string, number> = { USD: 3.6, EUR: 3.9, GBP: 4.5 };
      const ilsAmount = foreignIncomeAmount * exchangeRates[foreignCurrency];
      foreignDiscountInfo = calculateForeignIncomeDiscount(ilsAmount, foreignCurrency);
      foreignIncomeContribution = foreignDiscountInfo.effectiveIncome;
      effectiveMonthlyIncome += foreignIncomeContribution;
    }

    // Calculate max mortgage payment based on PTI
    const availableForPayment = (effectiveMonthlyIncome - existingDebts) * PTI_LIMIT;
    const safePayment = Math.max(0, availableForPayment);
    
    // Calculate max loan using reverse mortgage formula
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;
    
    const maxLoanByPTI = safePayment > 0 && monthlyRate > 0
      ? (safePayment * (Math.pow(1 + monthlyRate, numPayments) - 1)) / 
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments))
      : 0;
    
    // Calculate max property based on LTV limit
    const maxPropertyByLoan = maxLoanByPTI / (maxLTV / 100);
    const maxPropertyByDownPayment = downPaymentSaved / ((100 - maxLTV) / 100);
    
    // The limiting factor
    const maxPropertyPrice = Math.max(downPaymentSaved, Math.min(maxPropertyByLoan, maxPropertyByDownPayment));
    const limitingFactor = maxPropertyByLoan < maxPropertyByDownPayment ? 'income' : 'down_payment';
    
    // Actual loan needed for max property
    const requiredLoan = maxPropertyPrice * (maxLTV / 100);
    
    // Current PTI ratio
    const currentPTI = effectiveMonthlyIncome > 0 
      ? ((existingDebts + safePayment) / effectiveMonthlyIncome) * 100 
      : 0;

    // STRESS TEST: Calculate affordability if rates rise 2%
    const stressedRate = interestRate + 2;
    const stressedMonthlyRate = stressedRate / 100 / 12;
    const stressedMaxLoan = safePayment > 0 && stressedMonthlyRate > 0
      ? (safePayment * (Math.pow(1 + stressedMonthlyRate, numPayments) - 1)) / 
        (stressedMonthlyRate * Math.pow(1 + stressedMonthlyRate, numPayments))
      : 0;
    const stressedMaxPropertyByLoan = stressedMaxLoan / (maxLTV / 100);
    const stressedMaxPropertyPrice = Math.max(downPaymentSaved, Math.min(stressedMaxPropertyByLoan, maxPropertyByDownPayment));

    // FULL PURCHASE COSTS: Calculate total cash to close (not just down payment)
    // Estimate purchase tax based on buyer type
    const estimatedPurchaseTax = (() => {
      const price = maxPropertyPrice;
      if (buyerType === 'first_time' || buyerType === 'oleh') {
        // First-time/Oleh: 0% up to ~1.8M, then graduated
        if (price <= 1805545) return 0;
        if (price <= 2141605) return (price - 1805545) * 0.035;
        return (2141605 - 1805545) * 0.035 + (price - 2141605) * 0.05;
      } else {
        // Additional/Foreign: 8% up to ~6M, then 10%
        if (price <= 5872725) return price * 0.08;
        return 5872725 * 0.08 + (price - 5872725) * 0.10;
      }
    })();
    const lawyerFees = Math.max(5000, maxPropertyPrice * 0.005) * 1.17; // 0.5% + VAT
    const agentFees = maxPropertyPrice * 0.02 * 1.17; // 2% + VAT (resale)
    const otherFees = 5000; // Appraisal, registration, etc.
    const totalCashToClose = downPaymentSaved + estimatedPurchaseTax + lawyerFees + agentFees + otherFees;
    
    // Affordability score (0-100)
    const affordabilityScore = Math.min(100, Math.max(0, 
      100 - (currentPTI * 1.5) + (downPaymentSaved / Math.max(maxPropertyPrice, 1) * 20)
    ));
    
    // Calculate how much more down payment would help
    const additionalDownPaymentNeeded = limitingFactor === 'down_payment' 
      ? Math.max(0, (maxPropertyByLoan - maxPropertyByDownPayment) * ((100 - maxLTV) / 100))
      : 0;

    // Income breakdown for visualization
    const totalStatedIncome = monthlyIncome + spouseIncome + selfEmployedIncome + 
      (hasForeignIncome ? foreignIncomeAmount * ({ USD: 3.6, EUR: 3.9, GBP: 4.5 }[foreignCurrency] || 3.6) : 0);
    
    const incomeBreakdown: Record<string, { stated: number; effective: number; label: string; discountReason?: string }> = {
      salary: { stated: monthlyIncome, effective: monthlyIncome, label: 'Primary Salary' },
      spouse: { stated: spouseIncome, effective: spouseIncome, label: 'Spouse Income' },
      selfEmployed: { 
        stated: selfEmployedIncome, 
        effective: selfEmployedIncome * (selfEmployedMultiplier / 100), 
        label: 'Self-Employment',
        discountReason: selfEmployedIncome > 0 ? `Banks count ${selfEmployedMultiplier}%` : undefined
      },
      foreign: { 
        stated: hasForeignIncome ? foreignIncomeAmount * ({ USD: 3.6, EUR: 3.9, GBP: 4.5 }[foreignCurrency] || 3.6) : 0, 
        effective: foreignIncomeContribution, 
        label: 'Foreign Income',
        discountReason: foreignDiscountInfo ? `Banks count ${Math.round(foreignDiscountInfo.discountRate * 100)}%` : undefined
      },
    };

    // Calculate improvement suggestions
    const improvements = [];
    
    // Suggestion: Add spouse income
    if (spouseIncome === 0) {
      const additionalSpouseIncome = 15000;
      const newEffective = effectiveMonthlyIncome + additionalSpouseIncome;
      const newMaxPayment = Math.max(0, (newEffective - existingDebts) * PTI_LIMIT);
      const newMaxLoan = newMaxPayment > 0 && monthlyRate > 0
        ? (newMaxPayment * (Math.pow(1 + monthlyRate, numPayments) - 1)) / 
          (monthlyRate * Math.pow(1 + monthlyRate, numPayments))
        : 0;
      const newMaxProperty = Math.min(newMaxLoan / (maxLTV / 100), (downPaymentSaved + additionalSpouseIncome * 12) / ((100 - maxLTV) / 100));
      const increase = newMaxProperty - maxPropertyPrice;
      if (increase > 50000) {
        improvements.push({
          icon: Users,
          title: 'Add a co-borrower',
          description: `Joint application with ₪${formatNumber(additionalSpouseIncome)}/mo income`,
          impact: `+${formatNumber(Math.round(increase))} max budget`,
          impactType: 'positive' as const
        });
      }
    }

    // Suggestion: Pay off debts
    if (existingDebts > 0) {
      const newMaxPayment = Math.max(0, effectiveMonthlyIncome * PTI_LIMIT);
      const newMaxLoan = newMaxPayment > 0 && monthlyRate > 0
        ? (newMaxPayment * (Math.pow(1 + monthlyRate, numPayments) - 1)) / 
          (monthlyRate * Math.pow(1 + monthlyRate, numPayments))
        : 0;
      const newMaxProperty = Math.min(newMaxLoan / (maxLTV / 100), downPaymentSaved / ((100 - maxLTV) / 100));
      const increase = newMaxProperty - maxPropertyPrice;
      if (increase > 30000) {
        improvements.push({
          icon: CreditCard,
          title: 'Pay off existing debts',
          description: `Eliminate ₪${formatNumber(existingDebts)}/mo in monthly payments`,
          impact: `+${formatNumber(Math.round(increase))} max budget`,
          impactType: 'positive' as const
        });
      }
    }

    // Suggestion: Save more for down payment (if down payment limited)
    if (limitingFactor === 'down_payment' && additionalDownPaymentNeeded > 0) {
      improvements.push({
        icon: PiggyBank,
        title: 'Increase down payment',
        description: `Save ₪${formatNumber(Math.round(additionalDownPaymentNeeded))} more`,
        impact: `Unlock ₪${formatNumber(Math.round(additionalDownPaymentNeeded / ((100 - maxLTV) / 100)))} property`,
        impactType: 'positive' as const
      });
    }

    // Suggestion: Extend loan term (if not already at 30)
    if (loanTerm < 30 && limitingFactor === 'income') {
      const newNumPayments = 30 * 12;
      const newMaxPayment = safePayment;
      const newMaxLoan = newMaxPayment > 0 && monthlyRate > 0
        ? (newMaxPayment * (Math.pow(1 + monthlyRate, newNumPayments) - 1)) / 
          (monthlyRate * Math.pow(1 + monthlyRate, newNumPayments))
        : 0;
      const newMaxProperty = Math.min(newMaxLoan / (maxLTV / 100), downPaymentSaved / ((100 - maxLTV) / 100));
      const increase = newMaxProperty - maxPropertyPrice;
      if (increase > 50000) {
        improvements.push({
          icon: TrendingUp,
          title: 'Extend loan to 30 years',
          description: 'Lower monthly payments, more buying power',
          impact: `+${formatNumber(Math.round(increase))} max budget`,
          impactType: 'positive' as const
        });
      }
    }

    return {
      effectiveMonthlyIncome,
      safePayment,
      maxLoanByPTI,
      maxPropertyPrice,
      maxPropertyByLoan,
      maxPropertyByDownPayment,
      requiredLoan,
      currentPTI,
      affordabilityScore,
      limitingFactor,
      additionalDownPaymentNeeded,
      foreignDiscountInfo,
      selfEmployedMultiplier,
      incomeBreakdown,
      totalStatedIncome,
      improvements,
      // New stress test and cash-to-close
      stressedMaxPropertyPrice,
      stressedReduction: maxPropertyPrice - stressedMaxPropertyPrice,
      totalCashToClose,
      estimatedPurchaseTax,
      lawyerFees,
      agentFees,
    };
  }, [monthlyIncome, spouseIncome, selfEmployedIncome, selfEmployedYears, 
      existingDebts, downPaymentSaved, interestRate, loanTerm, maxLTV,
      hasForeignIncome, foreignIncomeAmount, foreignCurrency, employmentType, buyerType]);

  // Generate personalized insights
  const insights = useMemo(() => {
    const messages: string[] = [];
    const score = calculations.affordabilityScore;
    const limitingFactor = calculations.limitingFactor;
    
    if (score >= 70) {
      messages.push(`You're in a strong position. Banks will likely compete for your business—don't settle for the first mortgage offer you get.`);
    } else if (score >= 50) {
      messages.push(`Solid foundation. You can comfortably shop in your range, though you might want a small buffer for bidding flexibility.`);
    } else if (score >= 30) {
      messages.push(`This is doable but tight. Consider waiting 6-12 months to save more or increase income before committing.`);
    } else {
      messages.push(`The numbers are challenging right now. Focus on reducing debts or increasing savings before jumping in.`);
    }
    
    if (limitingFactor === 'income') {
      messages.push(`Your income is the bottleneck, not your savings. If you expect salary growth or can add a co-borrower, your budget expands significantly.`);
    } else if (limitingFactor === 'down_payment' && calculations.additionalDownPaymentNeeded > 0) {
      const additionalNeeded = Math.round(calculations.additionalDownPaymentNeeded / 1000) * 1000;
      messages.push(`You've got the income—you just need more cash upfront. Every ₪100K more you save unlocks roughly ₪400K in property value.`);
    }
    
    return messages;
  }, [calculations]);

  // Score helpers
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 30) return 'Fair';
    return 'Challenging';
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Handlers
  const handleLiveUpdate = useCallback((
    value: string, setter: (v: number) => void, min: number, max: number, isFormatted = false
  ) => {
    const parsed = isFormatted ? parseFormattedNumber(value) : parseFloat(value);
    if (!isNaN(parsed)) setter(Math.max(min, Math.min(max, parsed)));
  }, []);

  const handleMonthlyIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMonthlyIncomeInput(e.target.value);
    handleLiveUpdate(e.target.value, setMonthlyIncome, 0, 500000, true);
  };

  const handleMonthlyIncomeBlur = () => {
    let value = parseFormattedNumber(monthlyIncomeInput);
    value = Math.max(0, Math.min(500000, value));
    setMonthlyIncome(value);
    setMonthlyIncomeInput(formatNumber(value));
  };

  const handleSpouseIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpouseIncomeInput(e.target.value);
    handleLiveUpdate(e.target.value, setSpouseIncome, 0, 500000, true);
  };

  const handleSpouseIncomeBlur = () => {
    let value = parseFormattedNumber(spouseIncomeInput);
    value = Math.max(0, Math.min(500000, value));
    setSpouseIncome(value);
    setSpouseIncomeInput(formatNumber(value));
  };

  const handleSelfEmployedIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelfEmployedIncomeInput(e.target.value);
    handleLiveUpdate(e.target.value, setSelfEmployedIncome, 0, 500000, true);
  };

  const handleSelfEmployedIncomeBlur = () => {
    let value = parseFormattedNumber(selfEmployedIncomeInput);
    value = Math.max(0, Math.min(500000, value));
    setSelfEmployedIncome(value);
    setSelfEmployedIncomeInput(formatNumber(value));
  };

  const handleForeignIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForeignIncomeInput(e.target.value);
    handleLiveUpdate(e.target.value, setForeignIncomeAmount, 0, 100000, true);
  };

  const handleForeignIncomeBlur = () => {
    let value = parseFormattedNumber(foreignIncomeInput);
    value = Math.max(0, Math.min(100000, value));
    setForeignIncomeAmount(value);
    setForeignIncomeInput(formatNumber(value));
  };

  const handleExistingDebtsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExistingDebtsInput(e.target.value);
    handleLiveUpdate(e.target.value, setExistingDebts, 0, 100000, true);
  };

  const handleExistingDebtsBlur = () => {
    let value = parseFormattedNumber(existingDebtsInput);
    value = Math.max(0, Math.min(100000, value));
    setExistingDebts(value);
    setExistingDebtsInput(formatNumber(value));
  };

  const handleDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDownPaymentInput(e.target.value);
    handleLiveUpdate(e.target.value, setDownPaymentSaved, 0, 10000000, true);
  };

  const handleDownPaymentBlur = () => {
    let value = parseFormattedNumber(downPaymentInput);
    value = Math.max(0, Math.min(10000000, value));
    setDownPaymentSaved(value);
    setDownPaymentInput(formatNumber(value));
  };

  const handleInterestRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInterestRateInput(e.target.value);
    handleLiveUpdate(e.target.value, setInterestRate, 2, 10, false);
  };

  const handleInterestRateBlur = () => {
    let value = parseFloat(interestRateInput) || 5.0;
    value = Math.max(2, Math.min(10, value));
    setInterestRate(value);
    setInterestRateInput(value.toFixed(1));
  };

  const handleReset = () => {
    setBuyerType(DEFAULTS.buyerType);
    setEmploymentType(DEFAULTS.employmentType);
    setMonthlyIncome(DEFAULTS.monthlyIncome);
    setMonthlyIncomeInput(formatNumber(DEFAULTS.monthlyIncome));
    setSpouseIncome(DEFAULTS.spouseIncome);
    setSpouseIncomeInput(formatNumber(DEFAULTS.spouseIncome));
    setSelfEmployedIncome(DEFAULTS.selfEmployedIncome);
    setSelfEmployedIncomeInput(formatNumber(DEFAULTS.selfEmployedIncome));
    setSelfEmployedYears(DEFAULTS.selfEmployedYears);
    setHasForeignIncome(DEFAULTS.hasForeignIncome);
    setForeignIncomeAmount(DEFAULTS.foreignIncomeAmount);
    setForeignIncomeInput(formatNumber(DEFAULTS.foreignIncomeAmount));
    setForeignCurrency(DEFAULTS.foreignCurrency);
    setExistingDebts(DEFAULTS.existingDebts);
    setExistingDebtsInput(formatNumber(DEFAULTS.existingDebts));
    setDownPaymentSaved(DEFAULTS.downPaymentSaved);
    setDownPaymentInput(formatNumber(DEFAULTS.downPaymentSaved));
    setInterestRate(DEFAULTS.interestRate);
    setInterestRateInput(DEFAULTS.interestRate.toFixed(1));
    setLoanTerm(DEFAULTS.loanTerm);
    setShowAdvanced(false);
    toast({ title: "Reset complete", description: "All values restored to defaults" });
  };

  const handleSave = () => {
    const savedData = {
      buyerType, employmentType, monthlyIncome, spouseIncome, 
      selfEmployedIncome, selfEmployedYears, hasForeignIncome, 
      foreignIncomeAmount, foreignCurrency, existingDebts, 
      downPaymentSaved, interestRate, loanTerm,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    
    // If logged in, also save to profile
    if (user) {
      saveToProfile.mutate({
        calculatorType: 'affordability',
        inputs: savedData,
        results: {
          maxPropertyPrice: calculations.maxPropertyPrice,
          maxLoanByPTI: calculations.maxLoanByPTI,
          affordabilityScore: calculations.affordabilityScore,
          safePayment: calculations.safePayment,
          totalCashToClose: calculations.totalCashToClose,
          limitingFactor: calculations.limitingFactor,
        },
      });
    } else {
      toast({ title: "Calculation saved", description: "Your inputs have been saved locally. Sign in to save to your profile." });
    }
  };

  // Left column - single consolidated inputs card
  const leftColumn = (
    <Card className="p-6 shadow-sm">
      <div className="space-y-6">
        {/* Employment Type */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Employment Type</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                Banks treat income differently based on employment type. Self-employed income is typically discounted based on years of tax history.
              </TooltipContent>
            </Tooltip>
          </div>
          <Select value={employmentType} onValueChange={(v) => setEmploymentType(v as EmploymentType)}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="salaried">Salaried Employee (שכיר)</SelectItem>
              <SelectItem value="self_employed">Self-Employed (עצמאי)</SelectItem>
              <SelectItem value="mixed">Mixed Income</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Monthly Net Income */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Monthly Net Income</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                Your take-home pay after taxes (הכנסה נטו). This is the primary income used for mortgage approval calculations.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
            <Input
              type="text"
              inputMode="numeric"
              value={monthlyIncomeInput}
              onChange={handleMonthlyIncomeChange}
              onBlur={handleMonthlyIncomeBlur}
              className="pl-8 h-11"
              placeholder="25,000"
            />
          </div>
        </div>

        {/* Spouse Income */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Spouse/Partner Income</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                If applying jointly, include your partner's monthly net income. Joint applications can significantly increase borrowing power.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
            <Input
              type="text"
              inputMode="numeric"
              value={spouseIncomeInput}
              onChange={handleSpouseIncomeChange}
              onBlur={handleSpouseIncomeBlur}
              className="pl-8 h-11"
              placeholder="0"
            />
          </div>
        </div>

        {/* Self-Employed Section */}
        {(employmentType === 'self_employed' || employmentType === 'mixed') && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <Label className="font-semibold">Self-Employment Details</Label>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Monthly Self-Employed Income</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={selfEmployedIncomeInput}
                  onChange={handleSelfEmployedIncomeChange}
                  onBlur={handleSelfEmployedIncomeBlur}
                  className="pl-8 h-11"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Years of Tax Returns</Label>
              <Select value={selfEmployedYears.toString()} onValueChange={(v) => setSelfEmployedYears(Number(v))}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year} years</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Alert variant="default" className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
                Banks count only {calculations.selfEmployedMultiplier}% of self-employed income
                ({selfEmployedYears < 2 ? 'need 2+ years of tax returns' : 'based on your tax history'})
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Foreign Income Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Foreign Income</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                Israeli banks typically discount foreign income by 20-30% due to currency risk and verification challenges. (הכנסה מחו"ל)
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch checked={hasForeignIncome} onCheckedChange={setHasForeignIncome} />
        </div>

        {hasForeignIncome && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/50">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Monthly Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={foreignIncomeInput}
                    onChange={handleForeignIncomeChange}
                    onBlur={handleForeignIncomeBlur}
                    className="pl-7 h-11"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Currency</Label>
                <Select value={foreignCurrency} onValueChange={(v) => setForeignCurrency(v as typeof foreignCurrency)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {calculations.foreignDiscountInfo && (
              <p className="text-xs text-muted-foreground">
                Banks count {Math.round(calculations.foreignDiscountInfo.discountRate * 100)}% of your {foreignCurrency} income = {formatCurrency(calculations.foreignDiscountInfo.effectiveIncome)}/month effective
              </p>
            )}
          </div>
        )}

        <Separator />

        {/* Existing Debts */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Existing Monthly Debts</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                <p className="font-medium mb-1">התחייבויות קיימות - Existing Obligations</p>
                <p>Include: car loans, credit card minimums, student loans, child support, other mortgages. Banks check all debts when calculating your 40% PTI limit.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
            <Input
              type="text"
              inputMode="numeric"
              value={existingDebtsInput}
              onChange={handleExistingDebtsChange}
              onBlur={handleExistingDebtsBlur}
              className="pl-8 h-11"
              placeholder="0"
            />
          </div>
        </div>

        {/* Down Payment Saved */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Down Payment Saved</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                <p className="font-medium mb-1">הון עצמי (Hon Atzmi) - Equity/Down Payment</p>
                <p>Banks accept: savings, gifts from family, inheritance, or proceeds from selling another property. Gift letters may be required for family contributions.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
            <Input
              type="text"
              inputMode="numeric"
              value={downPaymentInput}
              onChange={handleDownPaymentChange}
              onBlur={handleDownPaymentBlur}
              className="pl-8 h-11"
              placeholder="400,000"
            />
          </div>
        </div>

        {/* Advanced Options - Collapsible */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span>Loan Assumptions</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Interest Rate</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-sm">
                      Assumed blended interest rate for calculation. Actual rates depend on your mortgage track mix.
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

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Loan Term</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-sm">
                      Longer terms mean lower monthly payments but higher total interest paid.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={loanTerm.toString()} onValueChange={(v) => setLoanTerm(Number(v))}>
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
            </div>
          </CollapsibleContent>
        </Collapsible>

      </div>
    </Card>
  );

  // Right column - single combined results card
  const rightColumn = (
    <Card className="p-6 shadow-sm border-t-4 border-t-primary">
      {/* Hero Max Property Price */}
      <div className="text-center pb-5 border-b border-border">
        <p className="text-sm text-muted-foreground mb-1">Max Property Price</p>
        <p className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent tracking-tight">
          {formatCurrency(calculations.maxPropertyPrice)}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          based on Bank of Israel PTI limits
        </p>
        
        {/* Stress Test Warning */}
        {calculations.stressedReduction > 50000 && (
          <div className="mt-3 p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>If rates rise 2%: {formatCurrency(calculations.stressedMaxPropertyPrice)}</span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                  Bank of Israel recommends stress-testing against a 2% rate increase. This shows your max budget if rates rise.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>

      {/* Affordability Score */}
      <div className="py-5 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Affordability Score</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                Combines your PTI ratio and down payment cushion. Higher scores indicate more financial flexibility and easier mortgage approval.
              </TooltipContent>
            </Tooltip>
          </div>
          <span className={cn("text-lg font-bold", getScoreColor(calculations.affordabilityScore))}>
            {getScoreLabel(calculations.affordabilityScore)}
          </span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
          <div 
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              getScoreProgressColor(calculations.affordabilityScore)
            )}
            style={{ width: `${calculations.affordabilityScore}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">Challenging</span>
          <span className="text-xs text-muted-foreground">Excellent</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="pt-5 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Safe Monthly Payment</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                <p className="font-medium mb-1">יחס החזר (Yachas Hechzer) - Payment-to-Income Ratio</p>
                <p>Bank of Israel limits total debt payments to 40% of net income. This is your maximum safe mortgage payment within that limit.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="font-semibold">{formatCurrency(calculations.safePayment)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Effective Income</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                Your total qualifying income after bank adjustments for self-employment and foreign income discounts.
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="font-semibold">{formatCurrency(calculations.effectiveMonthlyIncome)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Max Loan Amount</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                Maximum mortgage you can qualify for based on your income and the PTI limit.
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="font-semibold">{formatCurrency(calculations.maxLoanByPTI)}</span>
        </div>

        <LTVIndicator ltv={maxLTV} maxLTV={maxLTV} />

        <Separator className="my-3" />

        {/* PTI Ratio */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Your PTI Ratio</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                Payment-to-Income ratio. Bank of Israel limits this to 40% of net income.
              </TooltipContent>
            </Tooltip>
          </div>
          <span className={cn("font-semibold", calculations.currentPTI > 40 && "text-destructive")}>
            {calculations.currentPTI.toFixed(1)}% / 40%
          </span>
        </div>
      </div>

      {/* Limiting Factor Alert */}
      <Alert className={cn(
        "mt-5",
        calculations.limitingFactor === 'income' 
          ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
          : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
      )}>
        <Info className={cn(
          "h-4 w-4",
          calculations.limitingFactor === 'income' ? "text-amber-600" : "text-blue-600"
        )} />
        <AlertDescription className="text-sm">
          {calculations.limitingFactor === 'income' ? (
            <>Your <strong>income</strong> is the limiting factor. Banks calculate your max mortgage based on the 40% PTI rule.</>
          ) : (
            <>Your <strong>down payment</strong> is the limiting factor. 
              {calculations.additionalDownPaymentNeeded > 0 && (
                <> Save {formatCurrency(calculations.additionalDownPaymentNeeded)} more to maximize your purchasing power.</>
              )}
            </>
          )}
        </AlertDescription>
      </Alert>


    </Card>
  );

  // Bottom section - full width
  const bottomSection = (
    <div className="space-y-6">
      {/* Insight Card - Full Width */}
      {insights.length > 0 && (
        <InsightCard insights={insights} />
      )}
      

      {/* Next Steps Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Mortgage Calculator */}
        <Link 
          to="/tools?tool=mortgage"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calculator className="h-5 w-5" />
            </div>
            <p className="font-semibold">Mortgage Calculator</p>
          </div>
          <p className="text-sm text-muted-foreground">
            See your monthly payment breakdown
          </p>
        </Link>

        {/* Browse Properties */}
        <Link 
          to={`/listings?max_price=${Math.round(calculations.maxPropertyPrice)}`}
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ExternalLink className="h-5 w-5" />
            </div>
            <p className="font-semibold">Browse Properties</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Find listings in your budget
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
      <ToolFeedback toolName="affordability-calculator" variant="inline" />
    </div>
  );

  return (
    <ToolLayout
      title="Affordability Calculator"
      subtitle="Calculate your maximum affordable property based on Bank of Israel PTI limits"
      icon={<Wallet className="h-6 w-6" />}
      intro={<ToolIntro {...TOOL_INTROS.affordability} />}
      headerActions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saveToProfile.isPending}>
            {saveToProfile.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            {saveToProfile.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
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
            const mapping: Partial<Record<BuyerCategory, BuyerType>> = {
              'first_time': 'first_time',
              'oleh': 'oleh',
              'additional': 'investor',
              'non_resident': 'foreign',
              'upgrader': 'upgrader',
              'investor': 'investor',
              'foreign': 'foreign',
              'company': 'company',
            };
            setBuyerType(mapping[type] || 'first_time');
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

export function AffordabilityCalculator() {
  return <AffordabilityCalculatorContent />;
}
