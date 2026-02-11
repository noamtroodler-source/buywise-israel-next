// Investment Return Calculator - Unified Side-by-Side Layout for BuyWise Israel
import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Building2, DollarSign, PiggyBank, Scale, Wallet, Clock, LineChart, ArrowRight, RotateCcw, Save, Loader2, Home, HelpCircle, BadgeCheck, ChevronDown, Calculator, MapPin, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ToolLayout, ToolDisclaimer, ToolFeedback, InsightCard, SourceAttribution, ExampleValuesHint } from './shared';
import { BuyerTypeInfoBanner, type BuyerCategory } from './shared/BuyerTypeInfoBanner';
import { Link } from 'react-router-dom';

import { useAllCanonicalMetrics, getRentalRange } from '@/hooks/useCanonicalMetrics';
import { useCities } from '@/hooks/useCities';
import { useFormatPrice, useCurrencySymbol, useAreaUnitLabel } from '@/contexts/PreferencesContext';
import { useBuyerProfile, getBuyerTaxCategory } from '@/hooks/useBuyerProfile';
import { useAuth } from '@/hooks/useAuth';
import { useSaveCalculatorResult } from '@/hooks/useSavedCalculatorResults';
import { toast } from 'sonner';
import { 
  calculateGrossYield,
  calculateRentalIncomeTax,
  findOptimalTaxMethod,
  projectMultiYearROI,
  getVacancyRate,
} from '@/lib/calculations/rentalYield';
import { calculateMortgagePayment } from '@/lib/calculations/mortgage';
import { calculateMasShevach } from '@/lib/calculations/capitalGains';
import { cn } from '@/lib/utils';

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

// Investment grade calculator - returns brand-compliant colors
function calculateInvestmentGrade(netYield: number, cashOnCash: number, appreciation: number): { 
  grade: string; 
  label: string; 
  colorClass: string;
} {
  const score = (netYield * 0.4) + (cashOnCash * 0.15) + (appreciation * 0.45);
  if (score >= 8) return { grade: 'A+', label: 'Excellent Investment', colorClass: 'text-semantic-green-foreground bg-semantic-green border-semantic-green' };
  if (score >= 6.5) return { grade: 'A', label: 'Strong Investment', colorClass: 'text-semantic-green-foreground bg-semantic-green border-semantic-green' };
  if (score >= 5) return { grade: 'B+', label: 'Good Investment', colorClass: 'text-foreground bg-muted border-border' };
  if (score >= 4) return { grade: 'B', label: 'Solid Investment', colorClass: 'text-foreground bg-muted border-border' };
  if (score >= 3) return { grade: 'C+', label: 'Moderate Investment', colorClass: 'text-muted-foreground bg-muted border-border' };
  if (score >= 2) return { grade: 'C', label: 'Fair Investment', colorClass: 'text-muted-foreground bg-muted border-border' };
  return { grade: 'D', label: 'Weak Investment', colorClass: 'text-muted-foreground bg-muted/50 border-border' };
}

// Default values - harmonized with other calculators (₪2.75M standard, 5.25% rate)
const DEFAULTS = {
  purchasePrice: 2750000,
  selectedCity: 'tel-aviv',
  propertySizeSqm: 85,
  rooms: 3,
  monthlyRent: 8500,
  vacancyRate: 5,
  monthlyArnona: 450,
  monthlyVaadBayit: 350,
  monthlyInsurance: 150,
  maintenancePercent: 1,
  usePropertyManagement: false,
  managementFeePercent: 8,
  useLeverage: true,
  buyerType: 'investor' as const,
  downPaymentPercent: 50,
  interestRate: 5.25,
  loanTermYears: 20,
  taxMethod: 'flat_10' as const,
  holdingPeriod: 10,
  appreciationRate: 4,
};

const STORAGE_KEY = 'investment-calculator-saved';

const formatNumber = (num: number): string => num.toLocaleString('en-US');
const parseFormattedNumber = (str: string): number => {
  const cleaned = str.replace(/[^\d.-]/g, '');
  return Number(cleaned) || 0;
};

function InvestmentCalculatorContent() {
  const formatCurrency = useFormatPrice();
  const currencySymbol = useCurrencySymbol();
  const areaUnitLabel = useAreaUnitLabel();
  const { data: canonicalMetrics } = useAllCanonicalMetrics();
  const { data: cities } = useCities();
  const { data: buyerProfile } = useBuyerProfile();
  const buyerCategory = buyerProfile ? getBuyerTaxCategory(buyerProfile) : 'additional';
  const { user } = useAuth();
  const saveToProfile = useSaveCalculatorResult();
  
  // Core inputs
  const [purchasePrice, setPurchasePrice] = useState(DEFAULTS.purchasePrice);
  const [purchasePriceInput, setPurchasePriceInput] = useState(formatNumber(DEFAULTS.purchasePrice));
  const [selectedCity, setSelectedCity] = useState(DEFAULTS.selectedCity);
  const [propertySizeSqm, setPropertySizeSqm] = useState(DEFAULTS.propertySizeSqm);
  const [rooms, setRooms] = useState(DEFAULTS.rooms);
  const [monthlyRent, setMonthlyRent] = useState(DEFAULTS.monthlyRent);
  const [monthlyRentInput, setMonthlyRentInput] = useState(formatNumber(DEFAULTS.monthlyRent));
  const [vacancyRate, setVacancyRate] = useState(DEFAULTS.vacancyRate);
  
  // Operating expenses
  const [monthlyArnona, setMonthlyArnona] = useState(DEFAULTS.monthlyArnona);
  const [monthlyVaadBayit, setMonthlyVaadBayit] = useState(DEFAULTS.monthlyVaadBayit);
  const [monthlyInsurance, setMonthlyInsurance] = useState(DEFAULTS.monthlyInsurance);
  const [maintenancePercent, setMaintenancePercent] = useState(DEFAULTS.maintenancePercent);
  const [usePropertyManagement, setUsePropertyManagement] = useState(DEFAULTS.usePropertyManagement);
  const [managementFeePercent, setManagementFeePercent] = useState(DEFAULTS.managementFeePercent);
  
  // Financing
  const [useLeverage, setUseLeverage] = useState(DEFAULTS.useLeverage);
  const [buyerType, setBuyerType] = useState<'investor' | 'foreign' | 'oleh'>(DEFAULTS.buyerType);
  const [downPaymentPercent, setDownPaymentPercent] = useState(DEFAULTS.downPaymentPercent);
  const [interestRate, setInterestRate] = useState(DEFAULTS.interestRate);
  const [loanTermYears, setLoanTermYears] = useState(DEFAULTS.loanTermYears);
  
  // Strategy
  const [taxMethod, setTaxMethod] = useState<'exemption' | 'flat_10' | 'progressive'>(DEFAULTS.taxMethod);
  const [holdingPeriod, setHoldingPeriod] = useState(DEFAULTS.holdingPeriod);
  const [appreciationRate, setAppreciationRate] = useState(DEFAULTS.appreciationRate);
  
  // UI state
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const [isFinancingOpen, setIsFinancingOpen] = useState(false);
  const [isProjectionOpen, setIsProjectionOpen] = useState(false);
  const [isExitOpen, setIsExitOpen] = useState(false);
  const [isTaxInfoOpen, setIsTaxInfoOpen] = useState(false);
  
  // Derived data
  const cityMetrics = useMemo(() => canonicalMetrics?.find(m => m.city_slug === selectedCity), [canonicalMetrics, selectedCity]);
  const cityData = useMemo(() => cities?.find(c => c.slug === selectedCity), [cities, selectedCity]);
  
  // Auto-update arnona when city/size changes
  useEffect(() => {
    if (cityMetrics?.arnona_rate_sqm) {
      setMonthlyArnona(Math.round((cityMetrics.arnona_rate_sqm * propertySizeSqm) / 12));
    }
  }, [cityMetrics, propertySizeSqm]);
  
  // Suggested rent based on city/rooms
  const suggestedRent = useMemo(() => {
    if (!cityMetrics) return null;
    const range = getRentalRange(cityMetrics, rooms);
    return range.min && range.max ? Math.round((range.min + range.max) / 2) : null;
  }, [cityMetrics, rooms]);
  
  // Auto-update vacancy rate when city changes
  useEffect(() => { setVacancyRate(getVacancyRate(selectedCity) * 100); }, [selectedCity]);
  
  // LTV limits based on buyer type
  const maxLTV = useMemo(() => buyerType === 'oleh' ? 75 : 50, [buyerType]);
  useEffect(() => { if (downPaymentPercent < (100 - maxLTV)) setDownPaymentPercent(100 - maxLTV); }, [maxLTV, downPaymentPercent]);
  
  // Available cities
  const availableCities = useMemo(() => 
    canonicalMetrics?.filter(m => m.median_apartment_price).map(m => ({ 
      slug: m.city_slug, 
      name: m.city_slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), 
      grossYield: m.gross_yield_percent 
    })).sort((a, b) => a.name.localeCompare(b.name)) || [], 
  [canonicalMetrics]);

  // Load saved data from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.purchasePrice) { setPurchasePrice(data.purchasePrice); setPurchasePriceInput(formatNumber(data.purchasePrice)); }
        if (data.selectedCity) setSelectedCity(data.selectedCity);
        if (data.monthlyRent) { setMonthlyRent(data.monthlyRent); setMonthlyRentInput(formatNumber(data.monthlyRent)); }
        if (data.vacancyRate !== undefined) setVacancyRate(data.vacancyRate);
        if (data.holdingPeriod) setHoldingPeriod(data.holdingPeriod);
        if (data.appreciationRate !== undefined) setAppreciationRate(data.appreciationRate);
      } catch (e) {}
    }
  }, []);
  
  // Main calculations
  const calculations = useMemo(() => {
    const annualRent = monthlyRent * 12;
    const vacancyLoss = annualRent * (vacancyRate / 100);
    const effectiveGrossIncome = annualRent - vacancyLoss;
    const annualArnona = monthlyArnona * 12;
    const annualVaadBayit = monthlyVaadBayit * 12;
    const annualInsurance = monthlyInsurance * 12;
    const annualMaintenance = purchasePrice * (maintenancePercent / 100);
    const annualManagement = usePropertyManagement ? (effectiveGrossIncome * (managementFeePercent / 100)) : 0;
    const totalOperatingExpenses = annualArnona + annualVaadBayit + annualInsurance + annualMaintenance + annualManagement;
    const noi = effectiveGrossIncome - totalOperatingExpenses;
    const taxResult = calculateRentalIncomeTax(monthlyRent, taxMethod);
    const annualTax = taxResult.annualTax;
    const netIncomeAfterTax = noi - annualTax;
    const downPayment = purchasePrice * (downPaymentPercent / 100);
    const loanAmount = useLeverage ? purchasePrice - downPayment : 0;
    const mortgageResult = useLeverage ? calculateMortgagePayment(loanAmount, interestRate, loanTermYears) : null;
    const monthlyMortgage = mortgageResult?.monthlyPayment ?? 0;
    const annualMortgage = monthlyMortgage * 12;
    const annualCashFlow = netIncomeAfterTax - annualMortgage;
    const monthlyCashFlow = annualCashFlow / 12;
    const grossYield = calculateGrossYield(purchasePrice, monthlyRent);
    const netYield = (noi / purchasePrice) * 100;
    const capRate = (noi / purchasePrice) * 100;
    
    // Itemized closing costs
    const purchaseTax = purchasePrice <= 5872725 
      ? purchasePrice * 0.08 
      : 5872725 * 0.08 + (purchasePrice - 5872725) * 0.10;
    const lawyerFees = Math.max(5000, purchasePrice * 0.005) * 1.18; // VAT 18% as of Jan 2025
    const agentFees = purchasePrice * 0.02 * 1.18; // VAT 18% as of Jan 2025
    const appraisalFees = 3000;
    const registrationFees = 1500;
    const closingCosts = purchaseTax + lawyerFees + agentFees + appraisalFees + registrationFees;
    
    const totalCashInvested = useLeverage ? downPayment + closingCosts : purchasePrice + closingCosts;
    const cashOnCash = useLeverage ? (annualCashFlow / totalCashInvested) * 100 : (netIncomeAfterTax / totalCashInvested) * 100;
    const taxComparison = findOptimalTaxMethod(monthlyRent);
    const projection = projectMultiYearROI({
      purchasePrice, monthlyRent, appreciationRate: appreciationRate / 100, years: holdingPeriod,
      expenses: { arnona: annualArnona, vaadBayit: annualVaadBayit, insurance: annualInsurance, maintenance: annualMaintenance, vacancy: vacancyLoss, tax: annualTax },
      mortgagePayment: annualMortgage, downPayment: totalCashInvested,
    });
    const finalYear = projection[projection.length - 1];
    const annualizedROI = Math.pow((finalYear.propertyValue + finalYear.cumulativeCashFlow) / totalCashInvested, 1 / holdingPeriod) - 1;
    const grade = calculateInvestmentGrade(netYield, cashOnCash, appreciationRate);
    
    // Exit analysis
    const futurePropertyValue = purchasePrice * Math.pow(1 + appreciationRate / 100, holdingPeriod);
    const purchaseYear = new Date().getFullYear();
    const capitalGainsResult = calculateMasShevach(purchasePrice, futurePropertyValue, purchaseYear, 'investor', { ownedMonths: holdingPeriod * 12 });
    const sellingCostsAtExit = futurePropertyValue * 0.03;
    const remainingMortgageAtExit = useLeverage 
      ? loanAmount * (Math.pow(1 + interestRate / 100 / 12, loanTermYears * 12) - Math.pow(1 + interestRate / 100 / 12, holdingPeriod * 12)) /
        (Math.pow(1 + interestRate / 100 / 12, loanTermYears * 12) - 1)
      : 0;
    const netProceedsAtExit = futurePropertyValue - remainingMortgageAtExit - sellingCostsAtExit - capitalGainsResult.taxAmount;
    
    return { 
      vacancyLoss, totalOperatingExpenses, noi, annualTax, annualMaintenance, annualManagement, 
      monthlyMortgage, monthlyCashFlow, downPayment, loanAmount, 
      closingCosts, purchaseTax, lawyerFees, agentFees, appraisalFees, registrationFees,
      totalCashInvested, grossYield, netYield, capRate, cashOnCash, taxComparison, projection, 
      finalYear, totalReturn: finalYear.totalReturn, annualizedROI: annualizedROI * 100, grade,
      futurePropertyValue, capitalGainsTax: capitalGainsResult.taxAmount, sellingCostsAtExit, remainingMortgageAtExit, netProceedsAtExit, inflationAdjustment: capitalGainsResult.inflationAdjustment,
    };
  }, [purchasePrice, monthlyRent, vacancyRate, monthlyArnona, monthlyVaadBayit, monthlyInsurance, maintenancePercent, usePropertyManagement, managementFeePercent, useLeverage, downPaymentPercent, interestRate, loanTermYears, taxMethod, holdingPeriod, appreciationRate]);
  
  // Generate insights
  const insights = useMemo(() => {
    const messages: string[] = [];
    const grade = calculations.grade.grade;
    const cashOnCash = calculations.cashOnCash;
    const monthlyCashFlow = calculations.monthlyCashFlow;
    
    if (grade === 'A+' || grade === 'A') {
      messages.push(`This looks like a strong investment on paper. The numbers work well—now do your due diligence on the specific property and tenant market.`);
    } else if (grade === 'B+' || grade === 'B') {
      messages.push(`Solid, not spectacular. This could work well as a long-term hold, especially if you expect the area to appreciate.`);
    } else if (grade.startsWith('C')) {
      messages.push(`The returns here are modest. You might be paying for lifestyle location rather than pure investment return.`);
    } else {
      messages.push(`The numbers are weak on paper. Consider whether emotional factors or future potential justify this over alternatives.`);
    }
    
    if (monthlyCashFlow < 0 && useLeverage) {
      messages.push(`This property will cost you ${formatCurrency(Math.abs(Math.round(monthlyCashFlow)))}/month beyond the mortgage. You're betting on appreciation, not income.`);
    } else if (cashOnCash > 6) {
      messages.push(`Your annual return on cash invested is healthy at ${cashOnCash.toFixed(1)}%. You're making your money work.`);
    }
    
    if (calculations.taxComparison.recommended !== taxMethod) {
      const savings = calculations.taxComparison.savings;
      messages.push(`Consider the ${calculations.taxComparison.recommended.replace('_', ' ')} tax method—you could save ${formatCurrency(savings)}/year.`);
    }
    
    return messages;
  }, [calculations, useLeverage, formatCurrency, taxMethod]);
  
  // Handlers
  const handlePurchasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPurchasePriceInput(e.target.value);
    const parsed = parseFormattedNumber(e.target.value);
    if (!isNaN(parsed)) setPurchasePrice(Math.max(500000, Math.min(50000000, parsed)));
  };

  const handlePurchasePriceBlur = () => {
    let value = parseFormattedNumber(purchasePriceInput);
    value = Math.max(500000, Math.min(50000000, value));
    setPurchasePrice(value);
    setPurchasePriceInput(formatNumber(value));
  };

  const handleMonthlyRentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMonthlyRentInput(e.target.value);
    const parsed = parseFormattedNumber(e.target.value);
    if (!isNaN(parsed)) setMonthlyRent(Math.max(1000, Math.min(100000, parsed)));
  };

  const handleMonthlyRentBlur = () => {
    let value = parseFormattedNumber(monthlyRentInput);
    value = Math.max(1000, Math.min(100000, value));
    setMonthlyRent(value);
    setMonthlyRentInput(formatNumber(value));
  };
  
  const handleReset = () => {
    setPurchasePrice(DEFAULTS.purchasePrice);
    setPurchasePriceInput(formatNumber(DEFAULTS.purchasePrice));
    setSelectedCity(DEFAULTS.selectedCity);
    setPropertySizeSqm(DEFAULTS.propertySizeSqm);
    setRooms(DEFAULTS.rooms);
    setMonthlyRent(DEFAULTS.monthlyRent);
    setMonthlyRentInput(formatNumber(DEFAULTS.monthlyRent));
    setVacancyRate(DEFAULTS.vacancyRate);
    setMonthlyArnona(DEFAULTS.monthlyArnona);
    setMonthlyVaadBayit(DEFAULTS.monthlyVaadBayit);
    setMonthlyInsurance(DEFAULTS.monthlyInsurance);
    setMaintenancePercent(DEFAULTS.maintenancePercent);
    setUsePropertyManagement(DEFAULTS.usePropertyManagement);
    setManagementFeePercent(DEFAULTS.managementFeePercent);
    setUseLeverage(DEFAULTS.useLeverage);
    setBuyerType(DEFAULTS.buyerType);
    setDownPaymentPercent(DEFAULTS.downPaymentPercent);
    setInterestRate(DEFAULTS.interestRate);
    setLoanTermYears(DEFAULTS.loanTermYears);
    setTaxMethod(DEFAULTS.taxMethod);
    setHoldingPeriod(DEFAULTS.holdingPeriod);
    setAppreciationRate(DEFAULTS.appreciationRate);
    toast.success("Reset complete", { description: "All values restored to defaults" });
  };
  
  const handleSave = () => {
    const savedData = {
      purchasePrice, selectedCity, propertySizeSqm, rooms, monthlyRent, vacancyRate, monthlyArnona, monthlyVaadBayit, monthlyInsurance,
      maintenancePercent, usePropertyManagement, managementFeePercent, useLeverage, buyerType, downPaymentPercent, interestRate, loanTermYears,
      taxMethod, holdingPeriod, appreciationRate,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    
    if (user) {
      saveToProfile.mutate({
        calculatorType: 'investment',
        inputs: savedData,
        results: {
          netYield: calculations.netYield,
          grossYield: calculations.grossYield,
          cashOnCash: calculations.cashOnCash,
          monthlyCashFlow: calculations.monthlyCashFlow,
          investmentGrade: calculations.grade.grade,
          capRate: calculations.capRate,
          annualizedROI: calculations.annualizedROI,
        },
      });
    } else {
      toast.success("Calculation saved", { description: "Your inputs have been saved locally. Sign in to save to your profile." });
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
          
          {/* Purchase Price */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label className="text-sm font-medium">Purchase Price</Label>
              <InfoTooltip content="The full purchase price of the investment property." />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currencySymbol}</span>
              <Input
                type="text"
                inputMode="numeric"
                value={purchasePriceInput}
                onChange={handlePurchasePriceChange}
                onBlur={handlePurchasePriceBlur}
                className="pl-10 h-11 text-lg"
                placeholder="2,500,000"
              />
            </div>
          </div>

          {/* City */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label className="text-sm font-medium">City</Label>
              <InfoTooltip content="Select a city to auto-populate local arnona rates, typical rents, and vacancy rates based on market data." />
            </div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map(city => (
                  <SelectItem key={city.slug} value={city.slug}>
                    <span className="flex items-center justify-between w-full">
                      {city.name}
                      {city.grossYield && <span className="text-xs text-muted-foreground ml-2">{city.grossYield.toFixed(1)}% yield</span>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size & Rooms */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Label className="text-sm font-medium">Size</Label>
                <InfoTooltip content="Property size. Used to calculate arnona based on the city's rate per sqm." />
              </div>
              <div className="relative">
                <Input 
                  type="number" 
                  value={propertySizeSqm} 
                  onChange={(e) => setPropertySizeSqm(parseInt(e.target.value) || 0)} 
                  className="h-11 pr-14" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{areaUnitLabel}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label className="text-sm font-medium">Bedrooms</Label>
              </div>
              <Select value={rooms.toString()} onValueChange={(v) => setRooms(parseInt(v))}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5].map(r => <SelectItem key={r} value={r.toString()}>{r} bedrooms</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rental Income Card */}
      <Card>
        <CardContent className="p-5 space-y-5">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Rental Income</h3>
          
          {/* Monthly Rent */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Label className="text-sm font-medium">Monthly Rent</Label>
                <InfoTooltip content="Expected monthly rental income. Click the 'Market' badge to use the suggested rate." />
              </div>
              {suggestedRent && (
                <Badge 
                  variant="secondary" 
                  className="text-xs cursor-pointer hover:bg-primary/20 transition-colors" 
                  onClick={() => { setMonthlyRent(suggestedRent); setMonthlyRentInput(formatNumber(suggestedRent)); }}
                >
                  Market: {formatCurrency(suggestedRent)}
                </Badge>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currencySymbol}</span>
              <Input
                type="text"
                inputMode="numeric"
                value={monthlyRentInput}
                onChange={handleMonthlyRentChange}
                onBlur={handleMonthlyRentBlur}
                className="pl-10 h-11 text-lg"
                placeholder="8,000"
              />
            </div>
          </div>

          {/* Vacancy Rate */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label className="text-sm font-medium">Vacancy Rate</Label>
              <InfoTooltip content="Percentage of time the property sits empty. Tel Aviv ~3%, peripheral cities ~8%." />
            </div>
            <div className="relative">
              <Input 
                type="number" 
                value={vacancyRate} 
                onChange={(e) => setVacancyRate(Math.min(15, Math.max(0, parseFloat(e.target.value) || 0)))} 
                className="h-11 pr-10" 
                min={0} max={15} step={1} 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">= {formatCurrency(Math.round(calculations.vacancyLoss))}/year lost income</p>
          </div>

          {/* Tax Method */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Label className="text-sm font-medium">Tax Method</Label>
                <InfoTooltip content="Israel offers 3 ways to pay tax on rental income. The 'Best' badge shows which saves you the most." />
              </div>
              {calculations.taxComparison.recommended !== taxMethod && (
                <Badge variant="outline" className="text-xs text-primary border-primary/30">
                  Try: {calculations.taxComparison.recommended.replace('_', ' ')}
                </Badge>
              )}
            </div>
            <Select value={taxMethod} onValueChange={(v) => setTaxMethod(v as typeof taxMethod)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exemption">Tax-Free Exemption (up to ₪5,471/mo)</SelectItem>
                <SelectItem value="flat_10">10% Flat Tax (no deductions)</SelectItem>
                <SelectItem value="progressive">Progressive Tax (with deductions)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Operating Expenses (Collapsible) */}
      <Collapsible open={isExpensesOpen} onOpenChange={setIsExpensesOpen}>
        <Card className="overflow-hidden">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <PiggyBank className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Operating Expenses</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(calculations.totalOperatingExpenses)}/year total</p>
              </div>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpensesOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Arnona (monthly)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
                    <Input type="text" value={monthlyArnona.toLocaleString()} onChange={(e) => setMonthlyArnona(parseFormattedNumber(e.target.value))} className="pl-8 h-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Va'ad Bayit (monthly)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
                    <Input type="text" value={monthlyVaadBayit.toLocaleString()} onChange={(e) => setMonthlyVaadBayit(parseFormattedNumber(e.target.value))} className="pl-8 h-10" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Insurance (monthly)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
                    <Input type="text" value={monthlyInsurance.toLocaleString()} onChange={(e) => setMonthlyInsurance(parseFormattedNumber(e.target.value))} className="pl-8 h-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Maintenance (%/year)</Label>
                  <div className="relative">
                    <Input type="number" value={maintenancePercent} onChange={(e) => setMaintenancePercent(Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)))} className="h-10 pr-8" min={0} max={5} step={0.5} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Property Management</Label>
                  <Switch checked={usePropertyManagement} onCheckedChange={setUsePropertyManagement} />
                </div>
                {usePropertyManagement && (
                  <div className="flex items-center gap-2 pt-1">
                    <Label className="text-xs text-muted-foreground">Fee:</Label>
                    <div className="relative flex-1">
                      <Input type="number" value={managementFeePercent} onChange={(e) => setManagementFeePercent(Math.min(15, Math.max(0, parseFloat(e.target.value) || 0)))} className="h-8 text-sm pr-8" min={0} max={15} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                    </div>
                    <span className="text-xs text-muted-foreground">= {formatCurrency(Math.round(calculations.annualManagement))}/yr</span>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Financing & Strategy (Collapsible) */}
      <Collapsible open={isFinancingOpen} onOpenChange={setIsFinancingOpen}>
        <Card className="overflow-hidden">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Scale className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Financing & Strategy</p>
                <p className="text-xs text-muted-foreground">
                  {useLeverage ? `${downPaymentPercent}% down, ${holdingPeriod}yr hold` : `Cash purchase, ${holdingPeriod}yr hold`}
                </p>
              </div>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isFinancingOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Use Mortgage</Label>
                  <InfoTooltip content="Leverage amplifies both gains and risks. Using a mortgage means less cash upfront but higher monthly costs." />
                </div>
                <Switch checked={useLeverage} onCheckedChange={setUseLeverage} />
              </div>
              
              {useLeverage && (
                <div className="space-y-4 pt-2 border-t border-border/50">
                  <div className="space-y-2">
                    <Label className="text-sm">Buyer Type</Label>
                    <Select value={buyerType} onValueChange={(v) => setBuyerType(v as typeof buyerType)}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investor">Israeli Investor (max 50% LTV)</SelectItem>
                        <SelectItem value="foreign">Foreign Buyer (max 50% LTV)</SelectItem>
                        <SelectItem value="oleh">Oleh Hadash (max 75% LTV)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Down Payment</Label>
                      <div className="relative">
                        <Input type="number" value={downPaymentPercent} onChange={(e) => setDownPaymentPercent(Math.min(100, Math.max(100 - maxLTV, parseFloat(e.target.value) || 0)))} className="h-10 pr-8" min={100 - maxLTV} max={100} step={5} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">= {formatCurrency(calculations.downPayment)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Interest Rate</Label>
                      <div className="relative">
                        <Input type="number" value={interestRate} onChange={(e) => setInterestRate(Math.min(15, Math.max(0, parseFloat(e.target.value) || 0)))} className="h-10 pr-8" min={0} max={15} step={0.25} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Loan Term</Label>
                    <div className="relative">
                      <Input type="number" value={loanTermYears} onChange={(e) => setLoanTermYears(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))} className="h-10 pr-14" min={1} max={30} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">years</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Monthly payment: {formatCurrency(calculations.monthlyMortgage)}</p>
                  </div>
                </div>
              )}

              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label className="text-sm">Holding Period</Label>
                    <InfoTooltip content="How long you plan to hold before selling. Affects ROI projections and capital gains." />
                  </div>
                  <div className="relative">
                    <Input type="number" value={holdingPeriod} onChange={(e) => setHoldingPeriod(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))} className="h-10 pr-14" min={1} max={30} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">years</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label className="text-sm">Appreciation</Label>
                    <InfoTooltip content="Expected annual property value increase. Israeli real estate has historically appreciated 3-6% annually." />
                  </div>
                  <div className="relative">
                    <Input type="number" value={appreciationRate} onChange={(e) => setAppreciationRate(Math.min(20, Math.max(0, parseFloat(e.target.value) || 0)))} className="h-10 pr-8" min={0} max={20} step={0.5} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              {cityData?.yoy_price_change && (
                <p className="text-xs text-muted-foreground">
                  Recent YoY change in {cityData.name || selectedCity.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}: {cityData.yoy_price_change > 0 ? '+' : ''}{cityData.yoy_price_change}%
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );

  // Right Column - Results
  const rightColumn = (
    <Card className="overflow-hidden">
      {/* Hero Result */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-background p-6 text-center border-b border-border">
        <p className="text-sm text-muted-foreground mb-1">Net Rental Yield</p>
        <motion.p 
          key={calculations.netYield}
          initial={{ opacity: 0.5, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-4xl md:text-5xl font-bold text-primary tracking-tight"
        >
          {calculations.netYield.toFixed(2)}%
        </motion.p>
        <div className={cn("inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full border text-sm font-medium", calculations.grade.colorClass)}>
          <span>{calculations.grade.grade}</span>
          <span className="text-xs opacity-70">•</span>
          <span className="text-xs">{calculations.grade.label}</span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-border">
        <div className="p-4">
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">Gross Yield</p>
            <InfoTooltip content="Annual rent divided by price. Israeli averages: Tel Aviv 2.5-3%, periphery 4-5%." />
          </div>
          <p className="text-lg font-semibold mt-0.5">{calculations.grossYield.toFixed(2)}%</p>
          {cityMetrics?.gross_yield_percent && (
            <p className="text-xs text-muted-foreground">City avg: {cityMetrics.gross_yield_percent.toFixed(1)}%</p>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">Cap Rate</p>
            <InfoTooltip content="Net Operating Income divided by price. Standard commercial valuation metric." />
          </div>
          <p className="text-lg font-semibold mt-0.5">{calculations.capRate.toFixed(2)}%</p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">{useLeverage ? 'Cash-on-Cash' : 'ROI'}</p>
            <InfoTooltip content="Annual return on the actual cash you invested, accounting for leverage." />
          </div>
          <p className={cn("text-lg font-semibold mt-0.5", calculations.cashOnCash >= 0 ? "text-primary" : "text-muted-foreground")}>
            {calculations.cashOnCash.toFixed(2)}%
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground">Monthly Cash Flow</p>
          <p className={cn("text-lg font-semibold mt-0.5", calculations.monthlyCashFlow >= 0 ? "text-primary" : "text-muted-foreground")}>
            {calculations.monthlyCashFlow >= 0 ? '+' : ''}{formatCurrency(Math.round(calculations.monthlyCashFlow))}
          </p>
        </div>
      </div>

      {/* Visual Income Breakdown */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Income Allocation</span>
          <span>{formatCurrency(monthlyRent)}/mo rent</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden flex">
          <motion.div 
            className="bg-primary h-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, ((calculations.monthlyCashFlow / monthlyRent) * 100))}%` }}
            transition={{ duration: 0.5 }}
            title="Net Cash Flow"
          />
          <motion.div 
            className="bg-primary/50 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, ((calculations.totalOperatingExpenses / 12) / monthlyRent) * 100)}%` }}
            transition={{ duration: 0.5, delay: 0.1 }}
            title="Operating Expenses"
          />
          <motion.div 
            className="bg-primary/30 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, ((calculations.annualTax / 12) / monthlyRent) * 100)}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            title="Tax"
          />
          {useLeverage && (
            <motion.div 
              className="bg-muted-foreground/30 h-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, (calculations.monthlyMortgage / monthlyRent) * 100)}%` }}
              transition={{ duration: 0.5, delay: 0.3 }}
              title="Mortgage"
            />
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Cash Flow</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/50" /> Expenses</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/30" /> Tax</span>
          {useLeverage && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/30" /> Mortgage</span>}
        </div>
      </div>

      {/* Long-Term Summary */}
      <div className="p-4 border-t border-border space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">After {holdingPeriod} Years</h4>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Property Value</span>
          <div className="text-right">
            <span className="font-semibold">{formatCurrency(Math.round(calculations.finalYear.propertyValue))}</span>
            <span className="text-xs text-primary ml-1">(+{((calculations.finalYear.propertyValue / purchasePrice - 1) * 100).toFixed(0)}%)</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Cash Flow</span>
          <span className={cn("font-semibold", calculations.finalYear.cumulativeCashFlow >= 0 ? "text-primary" : "text-muted-foreground")}>
            {calculations.finalYear.cumulativeCashFlow >= 0 ? '+' : ''}{formatCurrency(Math.round(calculations.finalYear.cumulativeCashFlow))}
          </span>
        </div>
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Annualized ROI</p>
          <p className="text-3xl font-bold text-primary">{calculations.annualizedROI.toFixed(1)}%</p>
        </div>
      </div>

      {/* Cash to Close Summary */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-semibold">Total Cash Needed</h4>
          <span className="text-lg font-bold">{formatCurrency(Math.round(calculations.totalCashInvested))}</span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>{useLeverage ? 'Down Payment' : 'Purchase Price'}</span>
            <span>{formatCurrency(useLeverage ? calculations.downPayment : purchasePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span>Purchase Tax (8%)</span>
            <span>{formatCurrency(Math.round(calculations.purchaseTax))}</span>
          </div>
          <div className="flex justify-between">
            <span>Legal + Agent + Fees</span>
            <span>{formatCurrency(Math.round(calculations.lawyerFees + calculations.agentFees + calculations.appraisalFees + calculations.registrationFees))}</span>
          </div>
        </div>
      </div>
    </Card>
  );

  // Bottom Section
  const bottomSection = (
    <div className="space-y-6">
      {/* Educational Sections */}
      <div className="space-y-4">
        {/* Tax Methods Info */}
        <Collapsible open={isTaxInfoOpen} onOpenChange={setIsTaxInfoOpen}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Wallet className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Israeli Rental Tax Options</p>
                  <p className="text-xs text-muted-foreground">Compare the 3 tax methods for your rent level</p>
                </div>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isTaxInfoOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  {(['exemption', 'flat_10', 'progressive'] as const).map((method) => {
                    const result = calculations.taxComparison.comparison[method];
                    const isRecommended = calculations.taxComparison.recommended === method;
                    return (
                      <div key={method} className={cn("p-3 rounded-lg border", isRecommended ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30")}>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-sm capitalize">{method.replace('_', ' ')}</p>
                          {isRecommended && <Badge variant="secondary" className="text-xs">Best</Badge>}
                        </div>
                        <p className="text-xl font-bold">{formatCurrency(result.annualTax)}/yr</p>
                        <p className="text-xs text-muted-foreground mt-1">{result.effectiveRate.toFixed(1)}% effective</p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Exemption:</strong> First ₪5,471/month tax-free, but you lose all expense deductions. <strong>10% Flat:</strong> Simple, no deductions allowed. <strong>Progressive:</strong> Taxed at your marginal rate, but you can deduct all expenses.
                </p>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Exit Analysis */}
        <Collapsible open={isExitOpen} onOpenChange={setIsExitOpen}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Exit After {holdingPeriod} Years</p>
                  <p className="text-xs text-muted-foreground">Net proceeds: {formatCurrency(Math.round(calculations.netProceedsAtExit))}</p>
                </div>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExitOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-2 text-sm border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property Value</span>
                  <span>{formatCurrency(Math.round(calculations.futurePropertyValue))}</span>
                </div>
                {useLeverage && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Less: Remaining Mortgage</span>
                    <span className="text-muted-foreground">-{formatCurrency(Math.round(calculations.remainingMortgageAtExit))}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Less: Selling Costs (~3%)</span>
                  <span className="text-muted-foreground">-{formatCurrency(Math.round(calculations.sellingCostsAtExit))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center">
                    Less: Capital Gains Tax (Mas Shevach)
                    <InfoTooltip content={`25% on real gain. After ${holdingPeriod} years, ~₪${(calculations.inflationAdjustment / 1000).toFixed(0)}K deductible as inflation adjustment.`} />
                  </span>
                  <span className="text-muted-foreground">-{formatCurrency(Math.round(calculations.capitalGainsTax))}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Net Proceeds at Exit</span>
                  <span className="text-primary">{formatCurrency(Math.round(calculations.netProceedsAtExit))}</span>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Year-by-Year Projection */}
        <Collapsible open={isProjectionOpen} onOpenChange={setIsProjectionOpen}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <LineChart className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Year-by-Year Projection</p>
                  <p className="text-xs text-muted-foreground">{holdingPeriod} year breakdown</p>
                </div>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isProjectionOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 border-t border-border pt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">Year</th>
                      <th className="pb-3 font-medium text-right">Property Value</th>
                      <th className="pb-3 font-medium text-right">Net Cash Flow</th>
                      <th className="pb-3 font-medium text-right">Cumulative</th>
                      <th className="pb-3 font-medium text-right">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.projection.map((year) => (
                      <tr key={year.year} className="border-b last:border-0">
                        <td className="py-3">{year.year}</td>
                        <td className="py-3 text-right">{formatCurrency(year.propertyValue)}</td>
                        <td className={cn("py-3 text-right", year.netCashFlow >= 0 ? "text-primary" : "text-muted-foreground")}>
                          {year.netCashFlow >= 0 ? '+' : ''}{formatCurrency(year.netCashFlow)}
                        </td>
                        <td className={cn("py-3 text-right", year.cumulativeCashFlow >= 0 ? "text-primary" : "text-muted-foreground")}>
                          {year.cumulativeCashFlow >= 0 ? '+' : ''}{formatCurrency(year.cumulativeCashFlow)}
                        </td>
                        <td className="py-3 text-right font-medium text-primary">{year.roi.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Insight Card */}
      {insights.length > 0 && <InsightCard insights={insights} />}

      {/* Calculated for Israel Badge */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
        <BadgeCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium">Calculated for Israel</p>
          <p className="text-xs text-muted-foreground mt-1">
            Includes Israeli investor tax rates (8% purchase tax), rental income tax options, and Mas Shevach (capital gains) calculations with inflation adjustment. Consult a tax advisor for personalized guidance.
          </p>
        </div>
      </div>

      {/* Next Steps Grid */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link 
          to="/guides/rent-vs-buy"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="font-semibold">Rent vs Buy Guide</p>
          </div>
          <p className="text-sm text-muted-foreground">Understand ownership tradeoffs</p>
        </Link>

        <Link 
          to="/tools?tool=totalcost"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calculator className="h-5 w-5" />
            </div>
            <p className="font-semibold">True Cost</p>
          </div>
          <p className="text-sm text-muted-foreground">Total cash needed to close</p>
        </Link>

        <Link 
          to="/listings?listing_status=for_sale"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Home className="h-5 w-5" />
            </div>
            <p className="font-semibold">Browse Properties</p>
          </div>
          <p className="text-sm text-muted-foreground">Find investment properties</p>
        </Link>
      </div>

      {/* Feedback */}
      <ToolFeedback toolName="investment-return-calculator" variant="inline" />
    </div>
  );

  const disclaimer = (
    <ToolDisclaimer 
      text="Estimates for informational purposes only. Actual returns may vary. Consult a financial advisor and tax professional before making investment decisions."
    />
  );

  return (
    <ToolLayout 
      title="Investment Return Calculator" 
      subtitle="Evaluate rental yields and long-term returns — using real Israeli tax and market assumptions."
      icon={<TrendingUp className="h-6 w-6" />}
      infoBanner={
        <BuyerTypeInfoBanner
          selectedType={
            buyerType === 'investor' ? 'additional' :
            buyerType === 'foreign' ? 'non_resident' :
            buyerType as BuyerCategory
          }
          onTypeChange={(type) => {
            const mapping: Partial<Record<BuyerCategory, 'investor' | 'foreign' | 'oleh'>> = {
              'first_time': 'investor',
              'oleh': 'oleh',
              'additional': 'investor',
              'non_resident': 'foreign',
              'upgrader': 'investor',
              'investor': 'investor',
              'foreign': 'foreign',
              'company': 'investor',
            };
            setBuyerType(mapping[type] || 'investor');
          }}
          profileType={buyerProfile ? buyerCategory : undefined}
        />
      }
      headerActions={headerActions}
      leftColumn={leftColumn} 
      rightColumn={rightColumn} 
      bottomSection={bottomSection} 
      sourceAttribution={<SourceAttribution toolType="investment" />}
      disclaimer={disclaimer}
    />
  );
}

export function InvestmentReturnCalculator() {
  return <InvestmentCalculatorContent />;
}
