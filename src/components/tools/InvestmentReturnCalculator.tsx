import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Info, Building2, DollarSign, PiggyBank, Scale, Calendar, Lightbulb, RotateCcw, Percent, Home, Users, Wallet, Clock, LineChart, ArrowRight, Save, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ToolLayout } from './shared/ToolLayout';
import { ToolDisclaimer } from './shared/ToolDisclaimer';
import { ToolFeedback } from './shared/ToolFeedback';
import { InsightCard } from './shared/InsightCard';
import { BuyerTypeInfoBanner, type BuyerCategory } from './shared/BuyerTypeInfoBanner';
import { useAllCanonicalMetrics, getRentalRange } from '@/hooks/useCanonicalMetrics';
import { useCities } from '@/hooks/useCities';
import { usePreferences, useFormatPrice, useFormatArea, useCurrencySymbol, useAreaUnitLabel } from '@/contexts/PreferencesContext';
import { useBuyerProfile, getBuyerTaxCategory, getBuyerCategoryLabel } from '@/hooks/useBuyerProfile';
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

// Tooltip component with consistent styling
function InfoTooltip({ content }: { content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help inline ml-1 shrink-0" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm" side="top">
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Investment grade calculator
function calculateInvestmentGrade(netYield: number, cashOnCash: number, appreciation: number): { grade: string; label: string; color: string } {
  const score = (netYield * 0.4) + (cashOnCash * 0.15) + (appreciation * 0.45);
  if (score >= 8) return { grade: 'A+', label: 'Excellent Investment', color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' };
  if (score >= 6.5) return { grade: 'A', label: 'Strong Investment', color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' };
  if (score >= 5) return { grade: 'B+', label: 'Good Investment', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' };
  if (score >= 4) return { grade: 'B', label: 'Solid Investment', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' };
  if (score >= 3) return { grade: 'C+', label: 'Moderate Investment', color: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800' };
  if (score >= 2) return { grade: 'C', label: 'Fair Investment', color: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800' };
  return { grade: 'D', label: 'Weak Investment', color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800' };
}

// Default values for reset
const DEFAULTS = {
  purchasePrice: 2500000,
  selectedCity: 'tel-aviv',
  propertySizeSqm: 85,
  rooms: 3,
  monthlyRent: 8000,
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
  interestRate: 4.5,
  loanTermYears: 20,
  taxMethod: 'flat_10' as const,
  holdingPeriod: 10,
  appreciationRate: 4,
};

export function InvestmentReturnCalculator() {
  const { areaUnit } = usePreferences();
  const formatCurrency = useFormatPrice();
  const formatArea = useFormatArea();
  const currencySymbol = useCurrencySymbol();
  const areaUnitLabel = useAreaUnitLabel();
  const { data: canonicalMetrics } = useAllCanonicalMetrics();
  const { data: cities } = useCities();
  const { data: buyerProfile } = useBuyerProfile();
  const buyerCategory = buyerProfile ? getBuyerTaxCategory(buyerProfile) : 'additional';
  const { user } = useAuth();
  const saveToProfile = useSaveCalculatorResult();
  
  // State
  const [purchasePrice, setPurchasePrice] = useState(DEFAULTS.purchasePrice);
  const [selectedCity, setSelectedCity] = useState(DEFAULTS.selectedCity);
  const [propertySizeSqm, setPropertySizeSqm] = useState(DEFAULTS.propertySizeSqm);
  const [rooms, setRooms] = useState(DEFAULTS.rooms);
  const [monthlyRent, setMonthlyRent] = useState(DEFAULTS.monthlyRent);
  const [vacancyRate, setVacancyRate] = useState(DEFAULTS.vacancyRate);
  const [monthlyArnona, setMonthlyArnona] = useState(DEFAULTS.monthlyArnona);
  const [monthlyVaadBayit, setMonthlyVaadBayit] = useState(DEFAULTS.monthlyVaadBayit);
  const [monthlyInsurance, setMonthlyInsurance] = useState(DEFAULTS.monthlyInsurance);
  const [maintenancePercent, setMaintenancePercent] = useState(DEFAULTS.maintenancePercent);
  const [usePropertyManagement, setUsePropertyManagement] = useState(DEFAULTS.usePropertyManagement);
  const [managementFeePercent, setManagementFeePercent] = useState(DEFAULTS.managementFeePercent);
  const [useLeverage, setUseLeverage] = useState(DEFAULTS.useLeverage);
  const [buyerType, setBuyerType] = useState<'investor' | 'foreign' | 'oleh'>(DEFAULTS.buyerType);
  const [downPaymentPercent, setDownPaymentPercent] = useState(DEFAULTS.downPaymentPercent);
  const [interestRate, setInterestRate] = useState(DEFAULTS.interestRate);
  const [loanTermYears, setLoanTermYears] = useState(DEFAULTS.loanTermYears);
  const [taxMethod, setTaxMethod] = useState<'exemption' | 'flat_10' | 'progressive'>(DEFAULTS.taxMethod);
  const [holdingPeriod, setHoldingPeriod] = useState(DEFAULTS.holdingPeriod);
  const [appreciationRate, setAppreciationRate] = useState(DEFAULTS.appreciationRate);
  
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
  
  // Reset to defaults
  const resetToDefaults = () => {
    setPurchasePrice(DEFAULTS.purchasePrice);
    setSelectedCity(DEFAULTS.selectedCity);
    setPropertySizeSqm(DEFAULTS.propertySizeSqm);
    setRooms(DEFAULTS.rooms);
    setMonthlyRent(DEFAULTS.monthlyRent);
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
  };
  
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
    
    // ITEMIZED CLOSING COSTS (instead of generic 8%)
    // Purchase tax for investors is 8% up to ~6M
    const purchaseTax = purchasePrice <= 5872725 
      ? purchasePrice * 0.08 
      : 5872725 * 0.08 + (purchasePrice - 5872725) * 0.10;
    const lawyerFees = Math.max(5000, purchasePrice * 0.005) * 1.17; // 0.5% + VAT
    const agentFees = purchasePrice * 0.02 * 1.17; // 2% + VAT
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
    const totalReturn = finalYear.totalReturn;
    const annualizedROI = Math.pow((finalYear.propertyValue + finalYear.cumulativeCashFlow) / totalCashInvested, 1 / holdingPeriod) - 1;
    const grade = calculateInvestmentGrade(netYield, cashOnCash, appreciationRate);
    
    // EXIT ANALYSIS: Capital gains tax at end of holding period
    const futurePropertyValue = purchasePrice * Math.pow(1 + appreciationRate / 100, holdingPeriod);
    const purchaseYear = new Date().getFullYear();
    const capitalGainsResult = calculateMasShevach(
      purchasePrice,
      futurePropertyValue,
      purchaseYear,
      'investor',
      { ownedMonths: holdingPeriod * 12 }
    );
    const sellingCostsAtExit = futurePropertyValue * 0.03; // ~3% selling costs
    const remainingMortgageAtExit = useLeverage 
      ? loanAmount * (Math.pow(1 + interestRate / 100 / 12, loanTermYears * 12) - Math.pow(1 + interestRate / 100 / 12, holdingPeriod * 12)) /
        (Math.pow(1 + interestRate / 100 / 12, loanTermYears * 12) - 1)
      : 0;
    const netProceedsAtExit = futurePropertyValue - remainingMortgageAtExit - sellingCostsAtExit - capitalGainsResult.taxAmount;
    
    return { 
      vacancyLoss, totalOperatingExpenses, noi, annualTax, annualMaintenance, annualManagement, 
      monthlyMortgage, monthlyCashFlow, downPayment, loanAmount, 
      // Itemized closing costs
      closingCosts, purchaseTax, lawyerFees, agentFees, appraisalFees, registrationFees,
      totalCashInvested, grossYield, netYield, capRate, cashOnCash, taxComparison, projection, 
      finalYear, totalReturn, annualizedROI: annualizedROI * 100, grade,
      // Exit analysis
      futurePropertyValue,
      capitalGainsTax: capitalGainsResult.taxAmount,
      sellingCostsAtExit,
      remainingMortgageAtExit,
      netProceedsAtExit,
      inflationAdjustment: capitalGainsResult.inflationAdjustment,
    };
  }, [purchasePrice, monthlyRent, vacancyRate, monthlyArnona, monthlyVaadBayit, monthlyInsurance, maintenancePercent, usePropertyManagement, managementFeePercent, useLeverage, downPaymentPercent, interestRate, loanTermYears, taxMethod, holdingPeriod, appreciationRate]);
  
  // Generate personalized insights
  const investmentInsights = useMemo(() => {
    const messages: string[] = [];
    const grade = calculations.grade.grade;
    const cashOnCash = calculations.cashOnCash;
    const monthlyCashFlow = calculations.monthlyCashFlow;
    
    // Grade-based insights
    if (grade === 'A+' || grade === 'A') {
      messages.push(`This looks like a strong investment on paper. The numbers work well—now do your due diligence on the specific property and tenant market.`);
    } else if (grade === 'B+' || grade === 'B') {
      messages.push(`Solid, not spectacular. This could work well as a long-term hold, especially if you expect the area to appreciate.`);
    } else if (grade.startsWith('C')) {
      messages.push(`The returns here are modest. You might be paying for lifestyle location rather than pure investment return. Make sure that's what you want.`);
    } else {
      messages.push(`The numbers are weak on paper. Consider whether emotional factors or future potential justify this over alternatives.`);
    }
    
    // Cash flow insights
    if (monthlyCashFlow < 0 && useLeverage) {
      const formatted = formatCurrency(Math.abs(Math.round(monthlyCashFlow)));
      messages.push(`This property will cost you ${formatted}/month beyond the mortgage. You're betting on appreciation, not income. Make sure you can carry it.`);
    } else if (cashOnCash > 6) {
      messages.push(`Your annual return on cash invested is healthy at ${cashOnCash.toFixed(1)}%. You're making your money work.`);
    }
    
    return messages;
  }, [calculations, useLeverage, formatCurrency]);
  
  // Save inputs (defined after calculations to use its values)
  const handleSave = () => {
    const inputs = {
      purchasePrice, selectedCity, propertySizeSqm, rooms, monthlyRent,
      vacancyRate, monthlyArnona, monthlyVaadBayit, monthlyInsurance,
      maintenancePercent, usePropertyManagement, managementFeePercent,
      useLeverage, buyerType, downPaymentPercent, interestRate, loanTermYears,
      taxMethod, holdingPeriod, appreciationRate,
    };
    
    if (user) {
      saveToProfile.mutate({
        calculatorType: 'investment',
        inputs,
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
      toast.info('Sign in to save results to your profile');
    }
  };
  
  // Helpers
  const parseNumericInput = (value: string): number => parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
  const availableCities = useMemo(() => canonicalMetrics?.filter(m => m.median_apartment_price).map(m => ({ slug: m.city_slug, name: m.city_slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), grossYield: m.gross_yield_percent })).sort((a, b) => a.name.localeCompare(b.name)) || [], [canonicalMetrics]);

  // Section header component
  const SectionHeader = ({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) => (
    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
      <Icon className="h-4 w-4 text-primary" />
      <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
    </div>
  );

  const leftColumn = (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-8">
        {/* Property Details Section */}
        <div>
          <SectionHeader icon={Building2} title="Property Details" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                Purchase Price
                <InfoTooltip content="The full purchase price of the investment property." />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                <Input 
                  type="text" 
                  value={purchasePrice.toLocaleString()} 
                  onChange={(e) => setPurchasePrice(parseNumericInput(e.target.value))} 
                  className="pl-8 h-11 tabular-nums" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                City
                <InfoTooltip content="Select a city to auto-populate local arnona rates, typical rents, and vacancy rates based on market data." />
              </Label>
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
              <p className="text-xs text-muted-foreground">Yields and arnona auto-populated from market data</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  Size
                  <InfoTooltip content="Property size in square meters. Used to calculate arnona (municipal tax) based on the city's rate per sqm." />
                </Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={propertySizeSqm} 
                    onChange={(e) => setPropertySizeSqm(parseInt(e.target.value) || 0)} 
                    className="h-11 tabular-nums pr-12" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{areaUnitLabel}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  Rooms
                  <InfoTooltip content="Number of rooms (excluding bathroom/kitchen). Israeli listings count bedrooms + living room as 'rooms'." />
                </Label>
                <Select value={rooms.toString()} onValueChange={(v) => setRooms(parseInt(v))}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5].map(r => (
                      <SelectItem key={r} value={r.toString()}>{r} rooms</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Rental Income Section */}
        <div>
          <SectionHeader icon={DollarSign} title="Rental Income" />
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center">
                  Monthly Rent
                  <InfoTooltip content="Expected monthly rental income. Click the 'Market' badge to use the suggested rate based on city and room count." />
                </Label>
                {suggestedRent && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs cursor-pointer hover:bg-primary/20 transition-colors" 
                    onClick={() => setMonthlyRent(suggestedRent)}
                  >
                    Market: {formatCurrency(suggestedRent)}
                  </Badge>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                <Input 
                  type="text" 
                  value={monthlyRent.toLocaleString()} 
                  onChange={(e) => setMonthlyRent(parseNumericInput(e.target.value))} 
                  className="pl-8 h-11 tabular-nums" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                Vacancy Rate
                <InfoTooltip content="Percentage of time the property sits empty between tenants. Tel Aviv averages ~3%, peripheral cities ~8%. Lower is better." />
              </Label>
              <div className="relative">
                <Input 
                  type="number" 
                  value={vacancyRate} 
                  onChange={(e) => setVacancyRate(Math.min(15, Math.max(0, parseFloat(e.target.value) || 0)))} 
                  className="h-11 tabular-nums pr-8" 
                  min={0} 
                  max={15} 
                  step={1} 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">= {formatCurrency(Math.round(calculations.vacancyLoss))}/year lost income</p>
            </div>
          </div>
        </div>
        
        {/* Operating Expenses Section */}
        <div>
          <SectionHeader icon={PiggyBank} title="Operating Expenses" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  Arnona
                  <InfoTooltip content="Municipal property tax (Arnona) paid monthly. Rates vary significantly by city - Tel Aviv is among the highest. Auto-calculated from city data." />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
                  <Input 
                    type="text" 
                    value={monthlyArnona.toLocaleString()} 
                    onChange={(e) => setMonthlyArnona(parseNumericInput(e.target.value))} 
                    className="pl-8 h-11 tabular-nums" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  Va'ad Bayit
                  <InfoTooltip content="Building maintenance committee fee covering shared spaces, cleaning, elevator, and upkeep. Typically ₪200-800/month depending on building amenities." />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
                  <Input 
                    type="text" 
                    value={monthlyVaadBayit.toLocaleString()} 
                    onChange={(e) => setMonthlyVaadBayit(parseNumericInput(e.target.value))} 
                    className="pl-8 h-11 tabular-nums" 
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  Insurance
                  <InfoTooltip content="Home contents and structure insurance. Required by most mortgage lenders. Budget ₪100-250/month for comprehensive coverage." />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
                  <Input 
                    type="text" 
                    value={monthlyInsurance.toLocaleString()} 
                    onChange={(e) => setMonthlyInsurance(parseNumericInput(e.target.value))} 
                    className="pl-8 h-11 tabular-nums" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  Maintenance
                  <InfoTooltip content="Annual budget for repairs and maintenance, typically 1% of property value. Covers appliance repairs, painting, and unexpected fixes." />
                </Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={maintenancePercent} 
                    onChange={(e) => setMaintenancePercent(Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)))} 
                    className="h-11 tabular-nums pr-8" 
                    min={0} 
                    max={5} 
                    step={0.5} 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center">
                  Property Management
                  <InfoTooltip content="Professional management handles tenant relations, rent collection, and maintenance. Costs 8-10% of rent but valuable for overseas investors or those with multiple properties." />
                </Label>
                <Switch checked={usePropertyManagement} onCheckedChange={setUsePropertyManagement} />
              </div>
              {usePropertyManagement && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <Label className="text-xs text-muted-foreground">Management Fee</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={managementFeePercent} 
                      onChange={(e) => setManagementFeePercent(Math.min(15, Math.max(0, parseFloat(e.target.value) || 0)))} 
                      className="h-10 tabular-nums pr-8" 
                      min={0} 
                      max={15} 
                      step={1} 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">= {formatCurrency(Math.round(calculations.annualManagement))}/year</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center text-sm pt-2 border-t border-border">
              <span className="text-muted-foreground">Total Operating Expenses</span>
              <span className="font-semibold tabular-nums">{formatCurrency(calculations.totalOperatingExpenses)}/year</span>
            </div>
          </div>
        </div>
        
        {/* Financing Section */}
        <div>
          <SectionHeader icon={Scale} title="Financing" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center">
                Use Mortgage
                <InfoTooltip content="Leverage amplifies both gains and risks. Using a mortgage means less cash upfront but higher monthly costs and interest payments." />
              </Label>
              <Switch checked={useLeverage} onCheckedChange={setUseLeverage} />
            </div>
            
            {useLeverage && (
              <div className="space-y-4 pt-2 border-t border-border/50">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center">
                    Buyer Type
                    <InfoTooltip content="Bank of Israel limits investor mortgages to 50% LTV (loan-to-value). Olim within 7 years of Aliyah may qualify for up to 75% LTV." />
                  </Label>
                  <Select value={buyerType} onValueChange={(v) => setBuyerType(v as typeof buyerType)}>
                    <SelectTrigger className="h-11">
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
                    <Label className="text-sm font-medium flex items-center">
                      Down Payment
                      <InfoTooltip content="Minimum down payment depends on buyer type. Investors must put down at least 50%. Higher down payments reduce monthly costs but require more upfront cash." />
                    </Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        value={downPaymentPercent} 
                        onChange={(e) => setDownPaymentPercent(Math.min(100, Math.max(100 - maxLTV, parseFloat(e.target.value) || 0)))} 
                        className="h-11 tabular-nums pr-8" 
                        min={100 - maxLTV} 
                        max={100} 
                        step={5} 
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">= {formatCurrency(calculations.downPayment)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center">
                      Interest Rate
                      <InfoTooltip content="Current Israeli mortgage rates for investment properties range from 4-6%. Rates are typically higher for investment vs. primary residence loans." />
                    </Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        value={interestRate} 
                        onChange={(e) => setInterestRate(Math.min(15, Math.max(0, parseFloat(e.target.value) || 0)))} 
                        className="h-11 tabular-nums pr-8" 
                        min={0} 
                        max={15} 
                        step={0.25} 
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center">
                    Loan Term
                    <InfoTooltip content="Longer terms mean lower monthly payments but more total interest paid. Most Israeli mortgages are 15-25 years." />
                  </Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={loanTermYears} 
                      onChange={(e) => setLoanTermYears(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))} 
                      className="h-11 tabular-nums pr-14" 
                      min={1} 
                      max={30} 
                      step={1} 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">years</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Monthly payment: {formatCurrency(calculations.monthlyMortgage)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Tax Strategy Section */}
        <div>
          <SectionHeader icon={Wallet} title="Tax Strategy" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                Tax Method
                <InfoTooltip content="Israel offers 3 ways to pay tax on rental income. The 'Best' badge shows which method saves you the most based on your rent level." />
              </Label>
              <Select value={taxMethod} onValueChange={(v) => setTaxMethod(v as typeof taxMethod)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exemption">
                    <div className="flex flex-col items-start">
                      <span>Tax-Free Exemption</span>
                      <span className="text-xs text-muted-foreground">Up to ₪5,471/month tax-free</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="flat_10">
                    <div className="flex flex-col items-start">
                      <span>10% Flat Tax</span>
                      <span className="text-xs text-muted-foreground">Simple, no deductions allowed</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="progressive">
                    <div className="flex flex-col items-start">
                      <span>Progressive Tax</span>
                      <span className="text-xs text-muted-foreground">Marginal rate, deductions allowed</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="rounded-lg bg-muted/30 p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Annual Tax by Method</p>
              <div className="space-y-2">
                {(['exemption', 'flat_10', 'progressive'] as const).map(method => {
                  const result = calculations.taxComparison.comparison[method];
                  const isRecommended = method === calculations.taxComparison.recommended;
                  const isSelected = method === taxMethod;
                  return (
                    <div 
                      key={method} 
                      className={cn(
                        "flex items-center justify-between text-sm py-2 px-3 rounded-md transition-colors",
                        isSelected && "bg-primary/10 ring-1 ring-primary/20",
                        isRecommended && !isSelected && "bg-green-50 dark:bg-green-950/20"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {method === 'exemption' && 'Exemption'}
                        {method === 'flat_10' && '10% Flat'}
                        {method === 'progressive' && 'Progressive'}
                        {isRecommended && (
                          <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                            Best
                          </Badge>
                        )}
                      </span>
                      <span className="tabular-nums font-medium">{formatCurrency(result.annualTax)}/yr</span>
                    </div>
                  );
                })}
              </div>
              {calculations.taxComparison.savings > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400 font-medium pt-2 border-t border-border/50">
                  💡 Switch to {calculations.taxComparison.recommended === 'exemption' ? 'Exemption' : calculations.taxComparison.recommended === 'flat_10' ? '10% Flat' : 'Progressive'} to save {formatCurrency(calculations.taxComparison.savings)}/year
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Projection Settings Section */}
        <div>
          <SectionHeader icon={LineChart} title="Projections" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  Holding Period
                  <InfoTooltip content="How long you plan to own the property. Longer holding periods smooth out market volatility and accumulate more appreciation gains." />
                </Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={holdingPeriod} 
                    onChange={(e) => setHoldingPeriod(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))} 
                    className="h-11 tabular-nums pr-14" 
                    min={1} 
                    max={30} 
                    step={1} 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">years</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  Appreciation
                  <InfoTooltip content="Expected annual increase in property value. Israeli real estate has historically appreciated 3-6% annually, with higher rates in central areas." />
                </Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={appreciationRate} 
                    onChange={(e) => setAppreciationRate(Math.min(20, Math.max(0, parseFloat(e.target.value) || 0)))} 
                    className="h-11 tabular-nums pr-8" 
                    min={0} 
                    max={20} 
                    step={0.5} 
                  />
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
        </div>
        
        {/* Reset Button */}
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={resetToDefaults}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </CardContent>
    </Card>
  );
  
  const rightColumn = (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Investment Grade Hero */}
        <div className="text-center pb-5 border-b border-border">
          <div className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 text-2xl font-bold mb-2",
            calculations.grade.color
          )}>
            {calculations.grade.grade}
          </div>
          <p className="text-sm text-muted-foreground">{calculations.grade.label}</p>
        </div>
        
        {/* Key Metrics Grid */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Key Metrics</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/30 p-3 space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Gross Yield</span>
                <InfoTooltip content="Annual rent divided by purchase price. A quick comparison metric - higher is better. Israeli averages: Tel Aviv 2.5-3%, periphery 4-5%." />
              </div>
              <p className="text-xl font-bold tabular-nums">{calculations.grossYield.toFixed(2)}%</p>
              {cityMetrics?.gross_yield_percent && (
                <p className="text-xs text-muted-foreground">City avg: {cityMetrics.gross_yield_percent.toFixed(1)}%</p>
              )}
            </div>
            
            <div className="rounded-lg bg-muted/30 p-3 space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Net Yield</span>
                <InfoTooltip content="Gross yield minus operating expenses. The true income return before financing costs." />
              </div>
              <p className="text-xl font-bold tabular-nums">{calculations.netYield.toFixed(2)}%</p>
            </div>
            
            <div className="rounded-lg bg-muted/30 p-3 space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Cap Rate</span>
                <InfoTooltip content="Net Operating Income (NOI) divided by purchase price. The standard commercial real estate valuation metric." />
              </div>
              <p className="text-xl font-bold tabular-nums">{calculations.capRate.toFixed(2)}%</p>
            </div>
            
            <div className="rounded-lg bg-muted/30 p-3 space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{useLeverage ? 'Cash-on-Cash' : 'ROI'}</span>
                <InfoTooltip content="Annual cash flow divided by total cash invested. Shows your actual return on the money you put in, accounting for leverage." />
              </div>
              <p className={cn(
                "text-xl font-bold tabular-nums",
                calculations.cashOnCash >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {calculations.cashOnCash.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Monthly Cash Flow Breakdown */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Monthly Cash Flow</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rental Income</span>
              <span className="tabular-nums text-green-600 dark:text-green-400 font-medium">+{formatCurrency(monthlyRent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vacancy ({vacancyRate}%)</span>
              <span className="tabular-nums text-red-600 dark:text-red-400">-{formatCurrency(calculations.vacancyLoss / 12)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expenses</span>
              <span className="tabular-nums text-red-600 dark:text-red-400">-{formatCurrency(calculations.totalOperatingExpenses / 12)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({taxMethod === 'flat_10' ? '10%' : taxMethod})</span>
              <span className="tabular-nums text-red-600 dark:text-red-400">-{formatCurrency(calculations.annualTax / 12)}</span>
            </div>
            {useLeverage && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mortgage</span>
                <span className="tabular-nums text-red-600 dark:text-red-400">-{formatCurrency(calculations.monthlyMortgage)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold text-base">
              <span>Net Cash Flow</span>
              <span className={cn(
                "tabular-nums",
                calculations.monthlyCashFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {calculations.monthlyCashFlow >= 0 ? '+' : ''}{formatCurrency(calculations.monthlyCashFlow)}
              </span>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Long-Term Projection Summary */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">After {holdingPeriod} Years</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Property Value</span>
              <div className="text-right">
                <span className="font-semibold tabular-nums">{formatCurrency(calculations.finalYear.propertyValue)}</span>
                <span className="text-xs text-green-600 dark:text-green-400 ml-1">(+{((calculations.finalYear.propertyValue / purchasePrice - 1) * 100).toFixed(0)}%)</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Cash Flow</span>
              <span className={cn(
                "font-semibold tabular-nums",
                calculations.finalYear.cumulativeCashFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {calculations.finalYear.cumulativeCashFlow >= 0 ? '+' : ''}{formatCurrency(calculations.finalYear.cumulativeCashFlow)}
              </span>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Annualized ROI</p>
              <p className="text-3xl font-bold tabular-nums text-primary">{calculations.annualizedROI.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Cash to Close - ITEMIZED */}
        <div className="rounded-lg bg-muted/30 p-4 space-y-3">
          <h4 className="text-sm font-semibold">Cash to Close (Itemized)</h4>
          <div className="space-y-2 text-sm">
            {useLeverage ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Down Payment ({downPaymentPercent}%)</span>
                  <span className="tabular-nums">{formatCurrency(calculations.downPayment)}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center">
                    Purchase Tax (8%)
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 ml-1" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs text-sm">Mas Rechisha - Investors pay 8% on the first ~₪6M, then 10%.</TooltipContent>
                    </Tooltip>
                  </span>
                  <span className="tabular-nums">{formatCurrency(Math.round(calculations.purchaseTax))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lawyer Fees + VAT</span>
                  <span className="tabular-nums">{formatCurrency(Math.round(calculations.lawyerFees))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent Commission + VAT</span>
                  <span className="tabular-nums">{formatCurrency(Math.round(calculations.agentFees))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Appraisal & Registration</span>
                  <span className="tabular-nums">{formatCurrency(calculations.appraisalFees + calculations.registrationFees)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Price</span>
                  <span className="tabular-nums">{formatCurrency(purchasePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Closing Costs</span>
                  <span className="tabular-nums">{formatCurrency(Math.round(calculations.closingCosts))}</span>
                </div>
              </>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between font-semibold">
              <span>Total Cash Needed</span>
              <span className="tabular-nums">{formatCurrency(Math.round(calculations.totalCashInvested))}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* EXIT ANALYSIS */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exit After {holdingPeriod} Years</h4>
            <Tooltip>
              <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                What you'd net if you sold at the end of your holding period, after selling costs and Mas Shevach (capital gains tax).
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property Value</span>
              <span className="tabular-nums">{formatCurrency(Math.round(calculations.futurePropertyValue))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Less: Remaining Mortgage</span>
              <span className="tabular-nums text-red-600 dark:text-red-400">-{formatCurrency(Math.round(calculations.remainingMortgageAtExit))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Less: Selling Costs (~3%)</span>
              <span className="tabular-nums text-red-600 dark:text-red-400">-{formatCurrency(Math.round(calculations.sellingCostsAtExit))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center">
                Less: Capital Gains Tax
                <Tooltip>
                  <TooltipTrigger><Info className="h-3 w-3 ml-1" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs text-sm">
                    Mas Shevach: 25% on real (inflation-adjusted) gain. After {holdingPeriod} years, ~₪{(calculations.inflationAdjustment / 1000).toFixed(0)}K is deductible as inflation adjustment.
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="tabular-nums text-red-600 dark:text-red-400">-{formatCurrency(Math.round(calculations.capitalGainsTax))}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-semibold">
              <span>Net Proceeds at Exit</span>
              <span className="tabular-nums text-green-600 dark:text-green-400">{formatCurrency(Math.round(calculations.netProceedsAtExit))}</span>
            </div>
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
  
  const bottomSection = (
    <div className="space-y-6">
      {/* Insight Card - Full Width */}
      {investmentInsights.length > 0 && (
        <InsightCard insights={investmentInsights} />
      )}
      
      {/* Year-by-Year Projection Table */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Year-by-Year Projection
          </h3>
          <div className="overflow-x-auto">
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
                    <td className="py-3 tabular-nums">{year.year}</td>
                    <td className="py-3 text-right tabular-nums">{formatCurrency(year.propertyValue)}</td>
                    <td className={cn("py-3 text-right tabular-nums", year.netCashFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                      {year.netCashFlow >= 0 ? '+' : ''}{formatCurrency(year.netCashFlow)}
                    </td>
                    <td className={cn("py-3 text-right tabular-nums", year.cumulativeCashFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                      {year.cumulativeCashFlow >= 0 ? '+' : ''}{formatCurrency(year.cumulativeCashFlow)}
                    </td>
                    <td className="py-3 text-right tabular-nums font-medium text-primary">{year.roi.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Related Tools */}
      <div className="flex flex-wrap gap-3 justify-center pt-4">
        <a href="/tools?tool=mortgage" className="text-sm text-primary hover:underline">Mortgage Calculator →</a>
        <span className="text-muted-foreground">•</span>
        <a href="/tools?tool=totalcost" className="text-sm text-primary hover:underline">True Cost Calculator →</a>
        <span className="text-muted-foreground">•</span>
        <a href="/tools?tool=rentvsbuy" className="text-sm text-primary hover:underline">Rent vs Buy →</a>
      </div>
      
      <ToolFeedback toolName="investment-return-calculator" variant="inline" />
    </div>
  );

  return (
    <ToolLayout 
      title="Investment Return Calculator" 
      subtitle="Analyze potential returns on Israeli investment properties" 
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
              'first_time': 'investor', // Investment calc defaults non-applicable types to investor
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
      headerActions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saveToProfile.isPending} className="gap-2">
            {saveToProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline">{saveToProfile.isPending ? 'Saving...' : 'Save'}</span>
          </Button>
        </div>
      }
      leftColumn={leftColumn} 
      rightColumn={rightColumn} 
      bottomSection={bottomSection} 
      disclaimer={<ToolDisclaimer text="This calculator provides estimates for informational purposes only. Actual returns may vary. Consult with a financial advisor before making investment decisions." />}
    />
  );
}
