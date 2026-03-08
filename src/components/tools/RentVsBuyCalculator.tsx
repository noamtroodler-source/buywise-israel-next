import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSavePromptTrigger } from '@/hooks/useSavePromptTrigger';
import { 
  Scale, 
  Home, 
  TrendingUp, 
  Info, 
  Save, 
  MapPin,
  RotateCcw,
  Wallet,
  Building2,
  Clock,
  Calculator,
  CheckCircle2,
  
  Users,
  Shield,
  Paintbrush,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Target,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useSaveCalculatorResult } from '@/hooks/useSavedCalculatorResults';
import { motion } from 'framer-motion';
import { 
  ToolLayout,
  ToolDisclaimer, 
  ToolFeedback, 
  InfoBanner,
  InsightCard,
  BuyerTypeInfoBanner,
  SourceAttribution,
  ExampleValuesHint,
  ToolPropertySuggestions,
  SaveResultsPrompt,
  type BuyerCategory as SharedBuyerCategory,
} from './shared';
import { BookOpen } from 'lucide-react';

import { getBuyerCategoryLabel, getBuyerTaxCategory, useBuyerProfile } from '@/hooks/useBuyerProfile';
import { calculateTaxAmount, BuyerType } from '@/lib/calculations/purchaseTax';

// Map BuyerCategory to BuyerType for tax calculations
function mapCategoryToBuyerType(category: SharedBuyerCategory): BuyerType {
  const mapping: Record<SharedBuyerCategory, BuyerType> = {
    'first_time': 'first_time',
    'oleh': 'oleh',
    'upgrader': 'upgrader',
    'investor': 'investor',
    'foreign': 'foreign',
    'company': 'company',
    'additional': 'investor',
    'non_resident': 'foreign',
  };
  return mapping[category] || 'first_time';
}
import { useCities } from '@/hooks/useCities';
import { useCanonicalMetrics, getRentalRange } from '@/hooks/useCanonicalMetrics';
import { usePreferences, useFormatPrice, useFormatArea, useCurrencySymbol } from '@/contexts/PreferencesContext';
import { calculateMasShevach } from '@/lib/calculations/capitalGains';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'buywise_rent_vs_buy_inputs';

type BuyerCategory = 'first_time' | 'oleh' | 'additional' | 'non_resident';

// Fee estimates
const FEES = {
  lawyerRate: 0.005, // 0.5% of price
  lawyerMinimum: 5000,
  agentRate: 0.02, // 2% + VAT
  vatRate: 0.18, // Updated to 18% as of Jan 2025
  arnonaDefault: 400, // Monthly estimate when city data not available
  vaadBayitDefault: 350, // Monthly building maintenance
  homeInsurance: 150, // Monthly
  maintenanceRate: 0.005, // 0.5% of property value annually
};

// Time horizon options
const TIME_HORIZONS = [5, 10, 15, 20, 25];

// Mortgage term options (years)
const MORTGAGE_TERM_OPTIONS = [
  { value: '15', label: '15 years' },
  { value: '20', label: '20 years' },
  { value: '25', label: '25 years' },
  { value: '30', label: '30 years' },
];

// Room options for rental matching
const ROOM_OPTIONS = [
  { value: '2', label: '2 Bedrooms' },
  { value: '3', label: '3 Bedrooms' },
  { value: '4', label: '4 Bedrooms' },
  { value: '5', label: '5+ Bedrooms' },
];

// Estimated sqm per room count
const SQM_BY_ROOMS: Record<string, number> = {
  '2': 50,
  '3': 75,
  '4': 100,
  '5': 130,
};

function formatNumber(num: number): string {
  return num.toLocaleString('en-IL');
}

function parseFormattedNumber(str: string): number {
  return Number(str.replace(/,/g, '')) || 0;
}

function InfoTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help ml-1 inline-block" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Pros and Cons data - qualitative benefits
const BUYING_PROS = [
  { icon: TrendingUp, text: 'Build equity over time', detail: 'Every payment increases ownership stake' },
  { icon: Shield, text: 'Protection from rising rents', detail: 'Lock in housing costs with fixed mortgage' },
  { icon: Paintbrush, text: 'Freedom to renovate', detail: 'Customize your home as you wish' },
  { icon: Home, text: 'Long-term stability', detail: 'Create roots and community connections' },
];

const RENTING_PROS = [
  { icon: RefreshCw, text: 'Flexibility to relocate', detail: 'Move easily for career or lifestyle changes' },
  { icon: Wallet, text: 'Lower upfront capital', detail: 'No down payment or purchase costs' },
  { icon: Users, text: 'Landlord handles repairs', detail: 'Major maintenance is not your responsibility' },
  { icon: Building2, text: 'Try neighborhoods first', detail: 'Explore different areas before committing' },
];

// Minimum down payment requirements by buyer type
const MIN_DOWN_PAYMENT: Record<BuyerCategory, number> = {
  first_time: 25,
  oleh: 25,
  additional: 30,
  non_resident: 50,
};

// Default values for immediate results on load
const DEFAULTS = {
  propertyPrice: 2750000,
  monthlyRent: 7000,
  rooms: '3',
  downPaymentPercent: '25',
  interestRate: '5.25',
  mortgageTerm: '25',
  timeHorizon: 10,
  appreciation: '3.0',
  rentIncrease: '3.0',
  investmentReturn: '5.0',
};

export function RentVsBuyCalculator() {
  const { data: buyerProfile } = useBuyerProfile();
  const { data: cities } = useCities();
  const { areaUnit } = usePreferences();
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  const currencySymbol = useCurrencySymbol();
  const { user } = useAuth();
  const saveToProfile = useSaveCalculatorResult();
  const { showPrompt: showSavePrompt, dismissPrompt: dismissSavePrompt, trackChange } = useSavePromptTrigger();
  
  // Form state - initialized with defaults for immediate results
  const [selectedCity, setSelectedCity] = useState('');
  const [rooms, setRooms] = useState(DEFAULTS.rooms);
  const [propertyPrice, setPropertyPrice] = useState(formatNumber(DEFAULTS.propertyPrice));
  const [monthlyRent, setMonthlyRent] = useState(formatNumber(DEFAULTS.monthlyRent));
  const [buyerType, setBuyerType] = useState<BuyerCategory>('first_time');
  const [olehIsFirstProperty, setOlehIsFirstProperty] = useState(true);
  const [downPaymentPercent, setDownPaymentPercent] = useState(DEFAULTS.downPaymentPercent);
  const [interestRate, setInterestRate] = useState(DEFAULTS.interestRate);
  const [mortgageTerm, setMortgageTerm] = useState(DEFAULTS.mortgageTerm);
  const [timeHorizon, setTimeHorizon] = useState(DEFAULTS.timeHorizon);
  const [appreciation, setAppreciation] = useState(DEFAULTS.appreciation);
  const [rentIncrease, setRentIncrease] = useState(DEFAULTS.rentIncrease);
  const [investmentReturn, setInvestmentReturn] = useState(DEFAULTS.investmentReturn);

  // Track input changes for save prompt
  useEffect(() => {
    trackChange();
  }, [propertyPrice, monthlyRent, downPaymentPercent, timeHorizon, buyerType, trackChange]);

  // Get canonical metrics for selected city
  const { data: cityMetrics } = useCanonicalMetrics(selectedCity);
  
  // Auto-populate buyer type from profile
  useEffect(() => {
    if (buyerProfile) {
      if (buyerProfile.residency_status === 'non_resident') {
        setBuyerType('non_resident');
      } else if (buyerProfile.residency_status === 'oleh_hadash' && buyerProfile.aliyah_year) {
        const yearsInIsrael = new Date().getFullYear() - buyerProfile.aliyah_year;
        if (yearsInIsrael <= 7) {
          setBuyerType('oleh');
        } else if (buyerProfile.is_first_property) {
          setBuyerType('first_time');
        } else {
          setBuyerType('additional');
        }
      } else if (buyerProfile.is_first_property) {
        setBuyerType('first_time');
      } else {
        setBuyerType('additional');
      }
    }
  }, [buyerProfile]);
  
  // Auto-suggest appreciation from city data
  useEffect(() => {
    if (cityMetrics?.yoy_price_change) {
      // Cap at 4% to keep projections moderate — city's actual rate shown in tooltip for context
      const moderateRate = Math.min(cityMetrics.yoy_price_change, 4.0);
      setAppreciation(moderateRate.toFixed(1));
    }
  }, [cityMetrics]);
  
  // Load saved inputs from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.selectedCity) setSelectedCity(data.selectedCity);
        if (data.rooms) setRooms(data.rooms);
        if (data.propertyPrice) setPropertyPrice(data.propertyPrice);
        if (data.monthlyRent) setMonthlyRent(data.monthlyRent);
        if (data.buyerType) setBuyerType(data.buyerType);
        if (data.downPaymentPercent) setDownPaymentPercent(data.downPaymentPercent);
        if (data.interestRate) setInterestRate(data.interestRate);
        if (data.mortgageTerm) setMortgageTerm(data.mortgageTerm);
        if (data.timeHorizon) setTimeHorizon(data.timeHorizon);
        if (data.appreciation) setAppreciation(data.appreciation);
        if (data.rentIncrease) setRentIncrease(data.rentIncrease);
        if (data.investmentReturn) setInvestmentReturn(data.investmentReturn);
      }
    } catch (e) {
      console.error('Error loading saved inputs:', e);
    }
  }, []);
  
  // Get suggested values from city metrics
  const suggestedRent = useMemo(() => {
    if (!cityMetrics) return null;
    const range = getRentalRange(cityMetrics, parseInt(rooms));
    if (range.min && range.max) {
      return Math.round((range.min + range.max) / 2);
    }
    return null;
  }, [cityMetrics, rooms]);
  
  const suggestedPrice = useMemo(() => {
    if (!cityMetrics?.average_price_sqm) return null;
    const estimatedSize = SQM_BY_ROOMS[rooms] || 75;
    return Math.round(cityMetrics.average_price_sqm * estimatedSize);
  }, [cityMetrics, rooms]);
  
  // Handle city-based suggestions
  const handleUseSuggestedRent = () => {
    if (suggestedRent) {
      setMonthlyRent(formatNumber(suggestedRent));
    }
  };
  
  const handleUseSuggestedPrice = () => {
    if (suggestedPrice) {
      setPropertyPrice(formatNumber(suggestedPrice));
    }
  };
  
  // Reset inputs
  const handleReset = useCallback(() => {
    setSelectedCity('');
    setRooms(DEFAULTS.rooms);
    setPropertyPrice(formatNumber(DEFAULTS.propertyPrice));
    setMonthlyRent(formatNumber(DEFAULTS.monthlyRent));
    setBuyerType('first_time');
    setDownPaymentPercent(DEFAULTS.downPaymentPercent);
    setInterestRate(DEFAULTS.interestRate);
    setMortgageTerm(DEFAULTS.mortgageTerm);
    setTimeHorizon(DEFAULTS.timeHorizon);
    setAppreciation(DEFAULTS.appreciation);
    setRentIncrease(DEFAULTS.rentIncrease);
    setInvestmentReturn(DEFAULTS.investmentReturn);
    sessionStorage.removeItem(STORAGE_KEY);
    toast.success('Reset to defaults');
  }, []);
  
  // Main calculations
  const calculations = useMemo(() => {
    const price = parseFormattedNumber(propertyPrice);
    const rent = parseFormattedNumber(monthlyRent);
    const downPaymentPct = parseFloat(downPaymentPercent) || 25;
    const rate = parseFloat(interestRate) || 5.0;
    const years = timeHorizon; // comparison snapshot period
    const mortgageTermYears = parseInt(mortgageTerm) || 25; // actual loan term
    const appreciationRate = parseFloat(appreciation) || 3.0;
    const rentIncreaseRate = parseFloat(rentIncrease) || 3.0;
    const investmentReturnRate = parseFloat(investmentReturn) || 5.0;
    
    if (price <= 0 || rent <= 0) return null;
    
    // Buying calculations
    const downPayment = price * (downPaymentPct / 100);
    const loanAmount = price - downPayment;
    const monthlyRate = rate / 100 / 12;
    const totalMortgagePayments_count = mortgageTermYears * 12; // mortgage term, NOT time horizon
    
    // Monthly mortgage payment (P&I) based on actual mortgage term
    const monthlyMortgage = monthlyRate > 0
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMortgagePayments_count)) / 
        (Math.pow(1 + monthlyRate, totalMortgagePayments_count) - 1)
      : loanAmount / totalMortgagePayments_count;
    
    // One-time purchase costs
    const purchaseTax = calculateTaxAmount(price, mapCategoryToBuyerType(buyerType));
    const lawyerFee = Math.max(price * FEES.lawyerRate * (1 + FEES.vatRate), FEES.lawyerMinimum);
    const agentFee = price * FEES.agentRate * (1 + FEES.vatRate);
    const totalPurchaseCosts = purchaseTax + lawyerFee + agentFee;
    
    // Monthly ownership costs (beyond mortgage) — at purchase time
    const monthlyArnona = cityMetrics?.arnona_monthly_avg || FEES.arnonaDefault;
    const monthlyVaadBayit = FEES.vaadBayitDefault;
    const monthlyInsurance = FEES.homeInsurance;
    const monthlyMaintenanceYear0 = (price * FEES.maintenanceRate) / 12;
    
    // Shared costs: paid by BOTH renters and buyers — excluded from comparison
    const monthlySharedCosts = monthlyArnona + monthlyVaadBayit;
    
    // Owner-only costs: insurance + maintenance (maintenance grows with appreciation)
    const getOwnerOnlyCost = (year: number) => {
      const maintenanceAtYear = monthlyMaintenanceYear0 * Math.pow(1 + appreciationRate / 100, year);
      return monthlyInsurance + maintenanceAtYear;
    };
    
    // Full ownership costs (for detailed breakdown display)
    const getMonthlyOwnershipCost = (year: number) => {
      return monthlySharedCosts + getOwnerOnlyCost(year);
    };
    
    // Comparable buying cost (excludes shared costs for apples-to-apples comparison)
    const getComparableBuyingCost = (year: number) => {
      const mortgagePayment = year < mortgageTermYears ? monthlyMortgage : 0;
      return mortgagePayment + getOwnerOnlyCost(year);
    };
    
    // Full buying cost (for total cost tracking)
    const getMonthlyBuyingCost = (year: number) => {
      const mortgagePayment = year < mortgageTermYears ? monthlyMortgage : 0;
      return mortgagePayment + getMonthlyOwnershipCost(year);
    };
    
    // Year-0 values for display — comparable (excluding shared costs)
    const totalMonthlyOwnershipCosts = getOwnerOnlyCost(0);
    const totalMonthlyBuying = getComparableBuyingCost(0);
    const monthlyMaintenance = monthlyMaintenanceYear0;
    
    // Property value at end of period
    const futurePropertyValue = price * Math.pow(1 + appreciationRate / 100, years);
    const appreciation$ = futurePropertyValue - price;
    
    // Calculate remaining loan balance after timeHorizon years on a mortgageTerm-year mortgage
    let remainingBalance: number;
    if (years >= mortgageTermYears) {
      remainingBalance = 0; // mortgage fully paid
    } else {
      remainingBalance = monthlyRate > 0
        ? loanAmount * 
          (Math.pow(1 + monthlyRate, totalMortgagePayments_count) - Math.pow(1 + monthlyRate, years * 12)) /
          (Math.pow(1 + monthlyRate, totalMortgagePayments_count) - 1)
        : loanAmount * (1 - (years * 12) / totalMortgagePayments_count);
    }
    
    // Equity built (before exit costs)
    const equityBuiltGross = futurePropertyValue - remainingBalance;
    
    // EXIT COSTS: Selling costs (~3%) and Capital Gains Tax (Mas Shevach)
    const sellingCosts = futurePropertyValue * 0.03;
    const purchaseYear = new Date().getFullYear();
    const sellerCategory = buyerType === 'first_time' || buyerType === 'oleh' ? 'primary_residence' : 'investor';
    const capitalGainsResult = calculateMasShevach(
      price, futurePropertyValue, purchaseYear,
      sellerCategory as 'primary_residence' | 'investor',
      { ownedMonths: years * 12 }
    );
    const capitalGainsTax = capitalGainsResult.taxAmount;
    
    // Net equity after exit costs
    const equityBuilt = equityBuiltGross - sellingCosts - capitalGainsTax;
    
    // Total cost of buying over period (with growing maintenance)
    let totalMortgagePayments = 0;
    let totalOwnershipCosts = 0;
    for (let year = 0; year < years; year++) {
      const mortgageThisYear = year < mortgageTermYears ? monthlyMortgage * 12 : 0;
      totalMortgagePayments += mortgageThisYear;
      totalOwnershipCosts += getMonthlyOwnershipCost(year) * 12;
    }
    const totalBuyingCost = downPayment + totalPurchaseCosts + totalMortgagePayments + totalOwnershipCosts;
    
    // Net wealth from buying
    const netBuyingWealth = equityBuilt;
    
    // Renting calculations with year-varying buying costs
    let totalRentPaid = 0;
    let currentRent = rent;
    const monthlyInvestmentRate = investmentReturnRate / 100 / 12;
    let monthlySavingsPortfolio = 0;
    let totalMonthlySavingsRaw = 0;
    
    for (let year = 0; year < years; year++) {
      const comparableBuyingCost = getComparableBuyingCost(year);
      for (let month = 0; month < 12; month++) {
        totalRentPaid += currentRent;
        const monthlySaving = Math.max(0, comparableBuyingCost - currentRent);
        totalMonthlySavingsRaw += monthlySaving;
        monthlySavingsPortfolio = (monthlySavingsPortfolio + monthlySaving) * (1 + monthlyInvestmentRate);
      }
      currentRent *= (1 + rentIncreaseRate / 100);
    }
    const finalYearRent = rent * Math.pow(1 + rentIncreaseRate / 100, years - 1);
    
    // Lump sum: down payment + purchase costs invested
    const totalCashNotSpent = downPayment + totalPurchaseCosts;
    const lumpSumInvestedValue = totalCashNotSpent * Math.pow(1 + investmentReturnRate / 100, years);
    const lumpSumGains = lumpSumInvestedValue - totalCashNotSpent;
    
    // Total renting portfolio
    const investedSavingsValue = lumpSumInvestedValue + monthlySavingsPortfolio;
    // Pure investment gains = total portfolio - total cash deposited
    const totalCashDeposited = totalCashNotSpent + totalMonthlySavingsRaw;
    const investmentGains = investedSavingsValue - totalCashDeposited;
    
    const netRentingWealth = investedSavingsValue;
    
    // Comparison
    const buyingIsBetter = netBuyingWealth > netRentingWealth;
    const wealthDifference = Math.abs(netBuyingWealth - netRentingWealth);
    
    // Break-even year (with year-varying buying costs)
    let breakEvenYear = null;
    for (let checkYear = 1; checkYear <= 30; checkYear++) {
      const propertyValueAtYear = price * Math.pow(1 + appreciationRate / 100, checkYear);
      let remainingLoanAtYear: number;
      if (checkYear >= mortgageTermYears) {
        remainingLoanAtYear = 0;
      } else {
        remainingLoanAtYear = monthlyRate > 0
          ? loanAmount * 
            (Math.pow(1 + monthlyRate, totalMortgagePayments_count) - Math.pow(1 + monthlyRate, checkYear * 12)) /
            (Math.pow(1 + monthlyRate, totalMortgagePayments_count) - 1)
          : loanAmount * (1 - (checkYear * 12) / totalMortgagePayments_count);
      }
      
      const sellingCostsAtYear = propertyValueAtYear * 0.03;
      const cgResult = calculateMasShevach(price, propertyValueAtYear, purchaseYear, sellerCategory as 'primary_residence' | 'investor', { ownedMonths: checkYear * 12 });
      const cgTaxAtYear = cgResult.taxAmount;
      const buyingEquityAtYear = propertyValueAtYear - remainingLoanAtYear - sellingCostsAtYear - cgTaxAtYear;
      
      let rentAtYear = rent;
      let savingsPortfolioAtYear = 0;
      for (let y = 0; y < checkYear; y++) {
        const comparableCostThisYear = getComparableBuyingCost(y);
        for (let m = 0; m < 12; m++) {
          const saving = Math.max(0, comparableCostThisYear - rentAtYear);
          savingsPortfolioAtYear = (savingsPortfolioAtYear + saving) * (1 + monthlyInvestmentRate);
        }
        rentAtYear *= (1 + rentIncreaseRate / 100);
      }
      const investedValueAtYear = totalCashNotSpent * Math.pow(1 + investmentReturnRate / 100, checkYear);
      const rentingWealthAtYear = investedValueAtYear + savingsPortfolioAtYear;
      
      if (buyingEquityAtYear > rentingWealthAtYear) {
        breakEvenYear = checkYear;
        break;
      }
    }
    
    // Lifestyle comparison
    const avgPricePerSqm = cityMetrics?.average_price_sqm || (price / (SQM_BY_ROOMS[rooms] || 75));
    const buyingSqm = price / avgPricePerSqm;
    const rentPricePerSqm = rent / (SQM_BY_ROOMS[rooms] || 75);
    const rentingSqmForBuyingBudget = totalMonthlyBuying / rentPricePerSqm;
    const spaceAdvantagePercent = Math.round(((rentingSqmForBuyingBudget - buyingSqm) / buyingSqm) * 100);
    
    // Monthly equity building: actual principal portion of first payment
    // Principal = Payment - Interest, where Interest = balance * monthlyRate
    const firstMonthInterest = loanAmount * monthlyRate;
    const monthlyEquityBuilding = monthlyMortgage - firstMonthInterest;
    
    const priceToRentRatio = price / (rent * 12);
    
    return {
      buyingIsBetter, wealthDifference, breakEvenYear,
      monthlyMortgage, totalMonthlyBuying, totalMonthlyOwnershipCosts,
      currentMonthlyRent: rent, finalYearRent,
      downPayment, loanAmount, purchaseTax, lawyerFee, agentFee,
      totalPurchaseCosts, totalMortgagePayments, totalOwnershipCosts,
      futurePropertyValue, appreciation: appreciation$, equityBuilt,
      netBuyingWealth, totalBuyingCost,
      totalRentPaid, investedSavingsValue, investmentGains,
      netRentingWealth, totalCashNotSpent, lumpSumInvestedValue,
      monthlySavingsPortfolio, totalMonthlySavingsRaw,
      monthlyArnona, monthlyVaadBayit, monthlySharedCosts, monthlyInsurance, monthlyMaintenance,
      buyingSqm, rentingSqmForBuyingBudget, spaceAdvantagePercent,
      monthlyEquityBuilding, priceToRentRatio,
      sellingCosts, capitalGainsTax, equityBuiltGross,
    };
  }, [propertyPrice, monthlyRent, downPaymentPercent, interestRate, mortgageTerm, timeHorizon, appreciation, rentIncrease, investmentReturn, buyerType, cityMetrics, rooms]);

  // Generate personalized insights
  const insights = useMemo(() => {
    if (!calculations) return [];
    const messages: string[] = [];
    
    // Monthly cost comparison — concrete numbers
    const monthlyDiff = calculations.totalMonthlyBuying - calculations.currentMonthlyRent;
    if (monthlyDiff > 0) {
      messages.push(`Buying costs ${formatPrice(Math.round(calculations.totalMonthlyBuying))}/month vs ${formatPrice(Math.round(calculations.currentMonthlyRent))}/month renting — a difference of ${formatPrice(Math.round(monthlyDiff))}.`);
    } else {
      messages.push(`Buying is actually cheaper monthly: ${formatPrice(Math.round(calculations.totalMonthlyBuying))}/month vs ${formatPrice(Math.round(calculations.currentMonthlyRent))}/month renting.`);
    }
    
    // Break-even context
    if (calculations.breakEvenYear && calculations.breakEvenYear <= timeHorizon) {
      messages.push(`You reach break-even in ~${calculations.breakEvenYear} years. After that, buying pulls ahead in wealth building.`);
    } else if (calculations.breakEvenYear && calculations.breakEvenYear > timeHorizon) {
      messages.push(`At ${timeHorizon} years, renting still wins financially. You'd need to stay ${calculations.breakEvenYear}+ years for buying to break even.`);
    } else if (calculations.buyingIsBetter) {
      messages.push(`Buying builds more wealth at every point in your timeline — strong financial case if you have the down payment.`);
    }
    
    // Down payment opportunity cost
    if (calculations.totalCashNotSpent > 100000) {
      const returnRate = typeof investmentReturn === 'string' ? parseFloat(investmentReturn) : investmentReturn;
      const annualReturn = Math.round(calculations.totalCashNotSpent * (returnRate / 100));
      messages.push(`Your ${formatPrice(Math.round(calculations.totalCashNotSpent))} down payment could earn ~${formatPrice(annualReturn)}/year invested elsewhere at ${returnRate}% return.`);
    }
    
    return messages.slice(0, 3);
  }, [calculations, timeHorizon, investmentReturn, formatPrice]);

  // Save inputs (defined after calculations to use its values)
  const handleSave = () => {
    const data = {
      selectedCity,
      rooms,
      propertyPrice,
      monthlyRent,
      buyerType,
      downPaymentPercent,
      interestRate,
      mortgageTerm,
      timeHorizon,
      appreciation,
      rentIncrease,
      investmentReturn,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // If logged in, also save to profile
    if (user && calculations) {
      saveToProfile.mutate({
        calculatorType: 'rentvsbuy',
        inputs: data,
        results: {
          breakEvenYear: calculations.breakEvenYear,
          buyingIsBetter: calculations.buyingIsBetter,
          wealthDifference: calculations.wealthDifference,
          netBuyingWealth: calculations.netBuyingWealth,
          netRentingWealth: calculations.netRentingWealth,
        },
      });
    } else {
      toast.success('Inputs saved! Sign in to save to your profile.');
    }
  };
  
  // Header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
        <RotateCcw className="h-4 w-4" />
        <span className="hidden sm:inline">Reset</span>
      </Button>
      <Button variant="outline" size="sm" onClick={handleSave} disabled={saveToProfile.isPending} className="gap-2">
        {saveToProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        <span className="hidden sm:inline">{saveToProfile.isPending ? 'Saving...' : 'Save'}</span>
      </Button>
    </div>
  );
  
  // Get profile buyer category for reset functionality
  const profileBuyerCategory = buyerProfile ? getBuyerTaxCategory(buyerProfile) as SharedBuyerCategory : undefined;
  
  // Info banner
  const infoBanner = (
    <div className="space-y-3">
      <BuyerTypeInfoBanner
        selectedType={buyerType as SharedBuyerCategory}
        onTypeChange={(type) => setBuyerType(type as BuyerCategory)}
        profileType={profileBuyerCategory}
        onOlehFirstPropertyChange={setOlehIsFirstProperty}
        olehIsFirstProperty={olehIsFirstProperty}
      />
    </div>
  );
  
  // Left column - Inputs
  const leftColumn = (
    <div className="space-y-6">
      <ExampleValuesHint />
      {/* Property & Location */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Property Details</h3>
        </div>
        
        <div className="space-y-4">
          {/* City Selection */}
          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center text-sm font-medium">
              City
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
              <InfoTooltip content="Select a city to auto-suggest typical rents and property prices based on current market data." />
            </Label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select city for market data" />
              </SelectTrigger>
              <SelectContent>
                {cities?.map((city) => (
                  <SelectItem key={city.slug} value={city.slug}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Bedrooms */}
          <div className="space-y-2">
            <Label htmlFor="rooms" className="flex items-center text-sm font-medium">
              Bedrooms
            </Label>
            <Select value={rooms} onValueChange={setRooms}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROOM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Property Price */}
          <div className="space-y-2">
            <Label htmlFor="propertyPrice" className="flex items-center text-sm font-medium">
              Property Price
              <InfoTooltip content="Full purchase price of the property you're considering." />
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">{currencySymbol}</span>
              <Input
                id="propertyPrice"
                type="text"
                value={propertyPrice}
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, '');
                  if (/^\d*$/.test(raw)) {
                    setPropertyPrice(raw ? formatNumber(parseInt(raw)) : '');
                  }
                }}
                placeholder="2,500,000"
                className="h-11 text-lg pl-8"
              />
            </div>
            {suggestedPrice && !propertyPrice && (
              <button
                onClick={handleUseSuggestedPrice}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Use city estimate: {formatPrice(suggestedPrice)}
              </button>
            )}
          </div>
          
          {/* Monthly Rent */}
          <div className="space-y-2">
            <Label htmlFor="monthlyRent" className="flex items-center text-sm font-medium">
              Current / Expected Monthly Rent
              <InfoTooltip content="Your current or expected monthly rent payment. This will be compared against ownership costs." />
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">{currencySymbol}</span>
              <Input
                id="monthlyRent"
                type="text"
                value={monthlyRent}
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, '');
                  if (/^\d*$/.test(raw)) {
                    setMonthlyRent(raw ? formatNumber(parseInt(raw)) : '');
                  }
                }}
                placeholder="6,000"
                className="h-11 text-lg pl-8"
              />
            </div>
            {suggestedRent && !monthlyRent && selectedCity && (
              <button
                onClick={handleUseSuggestedRent}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Use city average: {formatPrice(suggestedRent)}/mo
              </button>
            )}
          </div>
        </div>
      </Card>
      
      {/* Financing */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Financing</h3>
        </div>
        
        <div className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            {/* Down Payment */}
            <div className="space-y-2">
              <Label htmlFor="downPayment" className="flex items-center text-sm font-medium">
                Down Payment
                <InfoTooltip content="Israeli banks require minimum 25% for first-time buyers, 30% for additional properties, 50% for non-residents." />
              </Label>
              <div className="relative">
                <Input
                  id="downPayment"
                  type="text"
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(e.target.value)}
                  className="h-11 pr-8 text-lg"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>
            
            {/* Interest Rate */}
            <div className="space-y-2">
              <Label htmlFor="interestRate" className="flex items-center text-sm font-medium">
                Interest Rate
                <InfoTooltip content="Blended mortgage rate. Israeli banks offer various 'tracks' with different rate structures." />
              </Label>
              <div className="relative">
                <Input
                  id="interestRate"
                  type="text"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="h-11 pr-8 text-lg"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
          </div>
          
          {/* Mortgage Term */}
          <div className="space-y-2">
            <Label htmlFor="mortgageTerm" className="flex items-center text-sm font-medium">
              Mortgage Term
              <InfoTooltip content="Length of your mortgage loan. Standard in Israel is 25-30 years. This is separate from your comparison time horizon." />
            </Label>
            <Select value={mortgageTerm} onValueChange={setMortgageTerm}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MORTGAGE_TERM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        </div>
      </Card>
      
      {/* Assumptions */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Time & Growth Assumptions</h3>
        </div>
        
        <div className="space-y-4">
          {/* Time Horizon */}
          <div className="space-y-2">
            <Label className="flex items-center text-sm font-medium">
              Time Horizon (Years)
              <InfoTooltip content="How long you plan to stay. Buying typically becomes more favorable over longer periods." />
            </Label>
            <div className="flex gap-2">
              {TIME_HORIZONS.map((years) => (
                <Button
                  key={years}
                  variant={timeHorizon === years ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeHorizon(years)}
                  className="flex-1"
                >
                  {years}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {/* Appreciation */}
            <div className="space-y-2">
              <Label htmlFor="appreciation" className="flex items-center text-sm font-medium">
                Appreciation
                <InfoTooltip content="Expected annual property value increase. Pre-filled from city's recent performance if available." />
              </Label>
              <div className="relative">
                <Input
                  id="appreciation"
                  type="text"
                  value={appreciation}
                  onChange={(e) => setAppreciation(e.target.value)}
                  className="h-11 pr-10 text-lg"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%/yr</span>
              </div>
            </div>
            
            {/* Rent Increase */}
            <div className="space-y-2">
              <Label htmlFor="rentIncrease" className="flex items-center text-sm font-medium">
                Rent Increase
                <InfoTooltip content="Expected annual rent increase. Israeli contracts typically allow 3-5% annual increases." />
              </Label>
              <div className="relative">
                <Input
                  id="rentIncrease"
                  type="text"
                  value={rentIncrease}
                  onChange={(e) => setRentIncrease(e.target.value)}
                  className="h-11 pr-10 text-lg"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%/yr</span>
              </div>
            </div>
            
            {/* Investment Return */}
            <div className="space-y-2">
              <Label htmlFor="investmentReturn" className="flex items-center text-sm font-medium">
                Savings Return
                <InfoTooltip content="If you rent, what return could your down payment earn if invested elsewhere?" />
              </Label>
              <div className="relative">
                <Input
                  id="investmentReturn"
                  type="text"
                  value={investmentReturn}
                  onChange={(e) => setInvestmentReturn(e.target.value)}
                  className="h-11 pr-10 text-lg"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%/yr</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
  
  // Right column - Results
  const rightColumn = (
    <div>
      {calculations ? (
        <Card className="overflow-hidden border-t-4 border-t-primary">
          {/* HERO: Break-even verdict - Brand compliant gradient */}
          <div className="p-6 text-center bg-gradient-to-b from-primary/5 via-background to-background">
            <p className="text-sm text-muted-foreground mb-1">Break-even Point</p>
            <motion.p
              key={calculations.breakEvenYear || 'never'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-5xl font-bold tracking-tight text-primary"
            >
              {calculations.breakEvenYear ? `${calculations.breakEvenYear} years` : '30+ years'}
            </motion.p>
            <p className="text-sm text-muted-foreground mt-2">
              {calculations.breakEvenYear && calculations.breakEvenYear <= 7 
                ? <span className="text-primary">"Buying wins relatively quickly"</span> :
               calculations.breakEvenYear && calculations.breakEvenYear <= 12 
                ? <span className="text-primary">"Consider your timeline carefully"</span> :
               <span className="text-primary">"Long horizon needed for buying to pay off"</span>}
            </p>
          </div>
          
          {/* Visual Breakdown Bar - Monthly Costs Allocation */}
          

          
          {/* Quick Stats Grid - 2x2 with dividers */}
          <div className="p-6 border-t">
            <div className="grid grid-cols-2 gap-4">
              {/* Monthly if Buying */}
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center">
                  Monthly if Buying
                  <InfoTooltip content={`Mortgage + insurance + maintenance only. Excludes ₪${formatNumber(Math.round(calculations.monthlySharedCosts))}/mo shared costs (Arnona + Vaad) since renters pay those too.`} />
                </p>
                <p className="text-lg font-bold tabular-nums">{formatPrice(Math.round(calculations.totalMonthlyBuying))}</p>
              </div>
              
              {/* Monthly if Renting */}
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Monthly if Renting</p>
                <p className="text-lg font-bold tabular-nums">{formatPrice(Math.round(calculations.currentMonthlyRent))}</p>
              </div>
              
              {/* Equity if Buy */}
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Equity After {timeHorizon}Y</p>
                <p className="text-lg font-bold tabular-nums">{formatPrice(Math.round(calculations.equityBuilt))}</p>
              </div>
              
              {/* Net if Rent */}
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Net if Renting</p>
                <p className="text-lg font-bold tabular-nums">
                  {calculations.netRentingWealth >= 0 
                    ? formatPrice(Math.round(calculations.netRentingWealth)) 
                    : `-${formatPrice(Math.abs(Math.round(calculations.netRentingWealth)))}`}
                </p>
              </div>
            </div>
            
            {/* Verdict */}
            <p className={cn(
              "text-center text-sm font-medium mt-4 p-2 rounded-lg",
              "text-primary-foreground bg-primary"
            )}>
              {calculations.buyingIsBetter 
                ? `Buying builds ${formatPrice(Math.round(calculations.wealthDifference))} more wealth`
                : `Renting saves ${formatPrice(Math.round(calculations.wealthDifference))}`}
            </p>
          </div>
          
          
          {/* Notes */}
          <div className="px-6 py-3 border-t space-y-1">
            <p className="text-[10px] text-muted-foreground text-center">
              Arnona & Vaad Bayit (~{formatPrice(Math.round(calculations.monthlySharedCosts))}/mo) excluded — paid by both renters and buyers
            </p>
            <p className="text-[10px] text-muted-foreground text-center">
              Exit factored: 3% selling fees {calculations.capitalGainsTax > 0 
                ? `+ ₪${Math.round(calculations.capitalGainsTax / 1000)}K Mas Shevach` 
                : '• No Mas Shevach (primary residence exempt)'}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Enter property price and rent</p>
            <p className="text-sm mt-1">
              We'll show you the full picture—monthly costs AND long-term wealth
            </p>
          </div>
        </Card>
      )}
    </div>
  );
  
  // Bottom section - Collapsible breakdown, Pros/Cons, and navigation
  const bottomSection = calculations && (
    <div className="space-y-8">
      {/* 1. Detailed Breakdown */}
      <Collapsible>
        <div className="rounded-lg border border-border/50 bg-muted/20">
          <CollapsibleTrigger className="w-full px-5 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Detailed {timeHorizon}-Year Breakdown</h3>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="grid md:grid-cols-2 gap-5 px-5 pb-5">
              {/* Buying Breakdown */}
              <div className="space-y-2 text-sm">
                <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-2">If You Buy</h4>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Down payment</span>
                  <span className="tabular-nums">{formatPrice(Math.round(calculations.downPayment))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Tax</span>
                  <span className="tabular-nums">{formatPrice(Math.round(calculations.purchaseTax))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total mortgage payments</span>
                  <span className="tabular-nums">{formatPrice(Math.round(calculations.totalMortgagePayments))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Other buying costs</span>
                  <span className="tabular-nums">{formatPrice(Math.round(calculations.totalBuyingCost - calculations.downPayment - calculations.purchaseTax - calculations.totalMortgagePayments))}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center">
                    Property value at end
                    <InfoTooltip content={(() => {
                      const rate = parseFloat(appreciation) || 3.0;
                      const cityRate = cityMetrics?.yoy_price_change;
                      let context = `Projected at ${rate}% annual appreciation compounded over ${timeHorizon} years.`;
                      if (cityRate) {
                        context += ` Based on this city's recent data (${cityRate.toFixed(1)}% YoY), tempered to a moderate long-term estimate.`;
                      }
                      context += ' Israel\'s long-term national average is ~4-6% annually.';
                      return context;
                    })()} />
                  </span>
                  <span className="tabular-nums text-primary">{formatPrice(Math.round(calculations.futurePropertyValue))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Equity built</span>
                  <span className="tabular-nums text-primary">{formatPrice(Math.round(calculations.equityBuilt))}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-border/50">
                  <span className="flex items-center gap-1">Net position <InfoTooltip content="Cash you'd walk away with if you sold — property value minus remaining mortgage, selling costs (~3%), and capital gains tax." /></span>
                  <span className="tabular-nums">
                    {calculations.netBuyingWealth >= 0 ? formatPrice(Math.round(calculations.netBuyingWealth)) : `-${formatPrice(Math.abs(Math.round(calculations.netBuyingWealth)))}`}
                  </span>
                </div>
              </div>
              
              {/* Renting Breakdown */}
              <div className="space-y-2 text-sm">
                <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-2">If You Rent</h4>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total rent paid</span>
                  <span className="tabular-nums">{formatPrice(Math.round(calculations.totalRentPaid))}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lump sum invested <InfoTooltip content="Down payment + purchase costs you didn't spend, invested instead." /></span>
                  <span className="tabular-nums">{formatPrice(Math.round(calculations.totalCashNotSpent))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lump sum growth</span>
                  <span className="tabular-nums text-primary">{formatPrice(Math.round(calculations.lumpSumInvestedValue - calculations.totalCashNotSpent))}</span>
                </div>
                {calculations.monthlySavingsPortfolio > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly savings invested <InfoTooltip content={`Each month buying costs more than renting, the difference is invested at ${investmentReturn}% annual return. This is the compounded value of those monthly savings.`} /></span>
                    <span className="tabular-nums text-primary">{formatPrice(Math.round(calculations.monthlySavingsPortfolio))}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total portfolio value</span>
                  <span className="tabular-nums text-primary">{formatPrice(Math.round(calculations.investedSavingsValue))}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-border/50">
                  <span className="flex items-center gap-1">Net position <InfoTooltip content={`Your total investment portfolio — the down payment + purchase costs you invested instead of buying, plus monthly savings (ownership costs minus rent) compounded at ${investmentReturn}% annual return.`} /></span>
                  <span className="tabular-nums">
                    {calculations.netRentingWealth >= 0 ? formatPrice(Math.round(calculations.netRentingWealth)) : `-${formatPrice(Math.abs(Math.round(calculations.netRentingWealth)))}`}
                  </span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* 2. Beyond the Numbers - Qualitative factors */}
      <div>
        <h3 className="text-lg font-semibold mb-5">Beyond the Numbers</h3>
        
        <div className="grid md:grid-cols-2 gap-5">
          {/* Buying Pros */}
          <div className="p-5 rounded-lg bg-muted/30 border border-border/50">
            <h4 className="font-medium flex items-center gap-2 mb-3 text-sm">
              <Home className="h-4 w-4 text-muted-foreground" />
              Why People Buy
            </h4>
            
            <ul className="space-y-2">
              {BUYING_PROS.map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm">{pro.text}</span>
                    <p className="text-xs text-muted-foreground">{pro.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Renting Pros */}
          <div className="p-5 rounded-lg bg-muted/30 border border-border/50">
            <h4 className="font-medium flex items-center gap-2 mb-3 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Why People Rent
            </h4>
            
            <ul className="space-y-2">
              {RENTING_PROS.map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm">{pro.text}</span>
                    <p className="text-xs text-muted-foreground">{pro.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
              <span className="font-medium">Note:</span> Most Israeli rentals are 1-2 year contracts.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Interpret - What This Means For You */}
      {insights.length > 0 && (
        <InsightCard insights={insights} />
      )}

      {/* 4. Sources */}
      <SourceAttribution toolType="rentVsBuy" />

      {/* 5. Property Carousel */}
      {calculations && (() => {
        const cityName = cities?.find(c => c.slug === selectedCity)?.name;
        return (
          <ToolPropertySuggestions
            title={cityName ? `Properties in ${cityName} near ${formatPrice(parseFormattedNumber(propertyPrice))}` : `Properties near ${formatPrice(parseFormattedNumber(propertyPrice))}`}
            subtitle={cityName ? `Homes matching your search in ${cityName}` : "See what's available at this price point"}
            minPrice={Math.round(parseFormattedNumber(propertyPrice) * 0.8)}
            maxPrice={Math.round(parseFormattedNumber(propertyPrice) * 1.2)}
            city={cityName || undefined}
            enabled={!!calculations}
          />
        );
      })()}

      {/* 6. Continue Exploring */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Continue exploring</span>
          <div className="h-px flex-1 bg-border/60" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="/tools?tool=mortgage"><Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors group h-full"><Calculator className="h-5 w-5 text-primary mb-2" /><h4 className="font-medium text-sm group-hover:text-primary transition-colors">Mortgage Calculator</h4><p className="text-xs text-muted-foreground mt-1">Plan your monthly payments</p></Card></Link>
          <Link to="/guides/buying-property-in-israel"><Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors group h-full"><BookOpen className="h-5 w-5 text-primary mb-2" /><h4 className="font-medium text-sm group-hover:text-primary transition-colors">Complete Buying Guide</h4><p className="text-xs text-muted-foreground mt-1">Step-by-step process for buyers</p></Card></Link>
          <Link to="/professionals"><Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors group h-full"><Users className="h-5 w-5 text-primary mb-2" /><h4 className="font-medium text-sm group-hover:text-primary transition-colors">Find a Professional</h4><p className="text-xs text-muted-foreground mt-1">Connect with vetted agents & lawyers</p></Card></Link>
        </div>
      </div>

      {/* 7. Disclaimer */}
      <ToolDisclaimer 
        text="This calculator provides estimates for educational purposes. Actual costs vary based on specific properties, lender terms, and market conditions. Consult with local professionals for personalized advice."
      />

      {/* 8. Feedback */}
      <div className="text-center">
        <ToolFeedback toolName="rent-vs-buy-calculator" variant="inline" />
      </div>
    </div>
  );
  
  return (
    <>
    <ToolLayout
      title="Rent vs Buy Calculator"
      subtitle="Compare renting versus buying in Israel — financially and practically."
      icon={<Scale className="h-6 w-6" />}
      
      headerActions={headerActions}
      infoBanner={infoBanner}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      bottomSection={bottomSection}
    />
    <SaveResultsPrompt
      show={showSavePrompt}
      calculatorName="rent vs buy"
      onDismiss={dismissSavePrompt}
      resultSummary={calculations ? (calculations.buyingIsBetter ? 'Verdict: Buying is better' : 'Verdict: Renting is better') : undefined}
    />
    </>
  );
}
