import { useState, useMemo, useCallback, useEffect } from 'react';
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
  Settings2,
  Globe,
  Percent,
  Banknote,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  ToolDisclaimer, 
  ToolFeedback, 
  CTACard,
} from './shared';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { calculatePurchaseTax as calcTax } from '@/hooks/useBuyerProfile';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { useCities } from '@/hooks/useCities';
import { useCanonicalMetrics, getRentalRange } from '@/hooks/useCanonicalMetrics';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STORAGE_KEY = 'buywise_rent_vs_buy_v2';
const STORAGE_EXPIRY_DAYS = 7;

type BuyerCategory = 'first_time' | 'oleh' | 'additional' | 'non_resident';

// Time horizon options
const TIME_HORIZONS = [5, 10, 15, 20, 25];

// Room estimate for default pricing
const SQM_BY_ROOMS: Record<string, number> = {
  '2': 50,
  '3': 75,
  '4': 100,
  '5': 130,
};

// Minimum down payment requirements by buyer type
const MIN_DOWN_PAYMENT: Record<BuyerCategory, number> = {
  first_time: 25,
  oleh: 25,
  additional: 30,
  non_resident: 50,
};

// Default values
const DEFAULTS = {
  legalFees: 15000,
  bankAndAppraisalFees: 5000,
  brokerFeePercent: 0,
  sellingCostsPercent: 2.34, // 2% + VAT
  monthlyArnona: 400,
  monthlyVaadAndInsurance: 500,
  annualMaintenanceReservePercent: 1.0,
  annualHomeAppreciationPercent: 3.0,
  annualRentIncreasePercent: 3.0,
  annualInvestmentReturnPercent: 5.0,
};

const VAT_RATE = 0.17;

function formatNumber(num: number): string {
  if (!isFinite(num) || isNaN(num)) return '0';
  return Math.round(num).toLocaleString('en-IL');
}

function sanitizeCurrency(str: string): number {
  const cleaned = str.replace(/[₪,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) || !isFinite(num) ? 0 : num;
}

function sanitizePercent(str: string): number {
  const num = parseFloat(str);
  return isNaN(num) || !isFinite(num) ? 0 : num;
}

function InfoTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help ml-1 inline-block" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Pros and Cons data
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

interface YearlyData {
  year: number;
  buyNetWorth: number;
  rentNetWorth: number;
  difference: number;
}

export function RentVsBuyCalculator() {
  const { data: buyerProfile } = useBuyerProfile();
  const { data: cities } = useCities();
  
  // Primary inputs
  const [buyerType, setBuyerType] = useState<BuyerCategory>('first_time');
  const [selectedCity, setSelectedCity] = useState('');
  const [propertyPrice, setPropertyPrice] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [downPaymentPercent, setDownPaymentPercent] = useState('25');
  const [mortgageRate, setMortgageRate] = useState('5.0');
  const [loanTermYears, setLoanTermYears] = useState('25');
  const [timeHorizonYears, setTimeHorizonYears] = useState(10);
  
  // Market assumptions
  const [annualHomeAppreciationPercent, setAnnualHomeAppreciationPercent] = useState(DEFAULTS.annualHomeAppreciationPercent.toString());
  const [annualRentIncreasePercent, setAnnualRentIncreasePercent] = useState(DEFAULTS.annualRentIncreasePercent.toString());
  const [annualInvestmentReturnPercent, setAnnualInvestmentReturnPercent] = useState(DEFAULTS.annualInvestmentReturnPercent.toString());
  
  // Transaction costs
  const [purchaseTaxOverride, setPurchaseTaxOverride] = useState('');
  const [legalFees, setLegalFees] = useState(DEFAULTS.legalFees.toString());
  const [brokerEnabled, setBrokerEnabled] = useState(false);
  const [brokerFeePercent, setBrokerFeePercent] = useState('2');
  const [bankAndAppraisalFees, setBankAndAppraisalFees] = useState(DEFAULTS.bankAndAppraisalFees.toString());
  const [sellingCostsPercent, setSellingCostsPercent] = useState(DEFAULTS.sellingCostsPercent.toString());
  const [capitalGainsMode, setCapitalGainsMode] = useState<'ignore' | 'estimate'>('ignore');
  const [capitalGainsTaxPercent, setCapitalGainsTaxPercent] = useState('25');
  
  // Ownership costs
  const [monthlyArnona, setMonthlyArnona] = useState(DEFAULTS.monthlyArnona.toString());
  const [monthlyVaadAndInsurance, setMonthlyVaadAndInsurance] = useState(DEFAULTS.monthlyVaadAndInsurance.toString());
  const [annualMaintenanceReservePercent, setAnnualMaintenanceReservePercent] = useState(DEFAULTS.annualMaintenanceReservePercent.toString());
  
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
  
  // Auto-update arnona from city
  useEffect(() => {
    if (cityMetrics?.arnona_monthly_avg) {
      setMonthlyArnona(Math.round(cityMetrics.arnona_monthly_avg).toString());
    }
  }, [cityMetrics]);
  
  // Auto-update appreciation from city YoY
  useEffect(() => {
    if (cityMetrics?.yoy_price_change) {
      setAnnualHomeAppreciationPercent(cityMetrics.yoy_price_change.toFixed(1));
    }
  }, [cityMetrics]);
  
  // Load saved inputs
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { data, timestamp } = JSON.parse(saved);
        const expiryMs = STORAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp < expiryMs && data) {
          if (data.buyerType) setBuyerType(data.buyerType);
          if (data.selectedCity) setSelectedCity(data.selectedCity);
          if (data.propertyPrice) setPropertyPrice(data.propertyPrice);
          if (data.monthlyRent) setMonthlyRent(data.monthlyRent);
          if (data.downPaymentPercent) setDownPaymentPercent(data.downPaymentPercent);
          if (data.mortgageRate) setMortgageRate(data.mortgageRate);
          if (data.loanTermYears) setLoanTermYears(data.loanTermYears);
          if (data.timeHorizonYears) setTimeHorizonYears(data.timeHorizonYears);
        }
      }
    } catch (e) {
      console.error('Error loading saved inputs:', e);
    }
  }, []);
  
  // Suggested values from city data
  const suggestedRent = useMemo(() => {
    if (!cityMetrics) return null;
    const range = getRentalRange(cityMetrics, 3); // Default 3 rooms
    if (range.min && range.max) {
      return Math.round((range.min + range.max) / 2);
    }
    return null;
  }, [cityMetrics]);
  
  const suggestedPrice = useMemo(() => {
    if (!cityMetrics?.average_price_sqm) return null;
    return Math.round(cityMetrics.average_price_sqm * SQM_BY_ROOMS['3']);
  }, [cityMetrics]);
  
  // Save inputs
  const handleSave = useCallback(() => {
    const data = {
      buyerType,
      selectedCity,
      propertyPrice,
      monthlyRent,
      downPaymentPercent,
      mortgageRate,
      loanTermYears,
      timeHorizonYears,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    toast.success('Inputs saved for 7 days');
  }, [buyerType, selectedCity, propertyPrice, monthlyRent, downPaymentPercent, mortgageRate, loanTermYears, timeHorizonYears]);
  
  // Reset inputs
  const handleReset = useCallback(() => {
    setBuyerType('first_time');
    setSelectedCity('');
    setPropertyPrice('');
    setMonthlyRent('');
    setDownPaymentPercent('25');
    setMortgageRate('5.0');
    setLoanTermYears('25');
    setTimeHorizonYears(10);
    setAnnualHomeAppreciationPercent(DEFAULTS.annualHomeAppreciationPercent.toString());
    setAnnualRentIncreasePercent(DEFAULTS.annualRentIncreasePercent.toString());
    setAnnualInvestmentReturnPercent(DEFAULTS.annualInvestmentReturnPercent.toString());
    setPurchaseTaxOverride('');
    setLegalFees(DEFAULTS.legalFees.toString());
    setBrokerEnabled(false);
    setBrokerFeePercent('2');
    setBankAndAppraisalFees(DEFAULTS.bankAndAppraisalFees.toString());
    setSellingCostsPercent(DEFAULTS.sellingCostsPercent.toString());
    setCapitalGainsMode('ignore');
    setCapitalGainsTaxPercent('25');
    setMonthlyArnona(DEFAULTS.monthlyArnona.toString());
    setMonthlyVaadAndInsurance(DEFAULTS.monthlyVaadAndInsurance.toString());
    setAnnualMaintenanceReservePercent(DEFAULTS.annualMaintenanceReservePercent.toString());
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Reset to defaults');
  }, []);
  
  // Calculate auto purchase tax
  const autoPurchaseTax = useMemo(() => {
    const price = sanitizeCurrency(propertyPrice);
    if (price <= 0) return 0;
    return calcTax(price, buyerType);
  }, [propertyPrice, buyerType]);
  
  // Main calculations
  const calculations = useMemo(() => {
    const price = sanitizeCurrency(propertyPrice);
    const rent = sanitizeCurrency(monthlyRent);
    const downPct = sanitizePercent(downPaymentPercent);
    const rate = sanitizePercent(mortgageRate);
    const term = sanitizePercent(loanTermYears);
    const horizon = timeHorizonYears;
    const appreciationRate = sanitizePercent(annualHomeAppreciationPercent);
    const rentIncreaseRate = sanitizePercent(annualRentIncreasePercent);
    const investmentReturnRate = sanitizePercent(annualInvestmentReturnPercent);
    const arnonaMonthly = sanitizeCurrency(monthlyArnona);
    const vaadInsMonthly = sanitizeCurrency(monthlyVaadAndInsurance);
    const maintenancePct = sanitizePercent(annualMaintenanceReservePercent);
    const legal = sanitizeCurrency(legalFees);
    const bankFees = sanitizeCurrency(bankAndAppraisalFees);
    const brokerPct = brokerEnabled ? sanitizePercent(brokerFeePercent) : 0;
    const sellCostPct = sanitizePercent(sellingCostsPercent);
    const capGainsPct = capitalGainsMode === 'estimate' ? sanitizePercent(capitalGainsTaxPercent) : 0;
    
    if (price <= 0 || rent <= 0) return null;
    
    // Purchase costs
    const downPayment = price * (downPct / 100);
    const loanAmount = price - downPayment;
    const purchaseTax = purchaseTaxOverride ? sanitizeCurrency(purchaseTaxOverride) : autoPurchaseTax;
    const brokerFee = brokerPct > 0 ? price * (brokerPct / 100) * (1 + VAT_RATE) : 0;
    const totalPurchaseCosts = purchaseTax + legal + brokerFee + bankFees;
    const totalCashUpfront = downPayment + totalPurchaseCosts;
    
    // Monthly mortgage payment
    const monthlyRate = rate / 100 / 12;
    const numPayments = term * 12;
    const monthlyMortgage = monthlyRate > 0
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanAmount / numPayments;
    
    // Monthly ownership costs
    const maintenanceMonthly = (price * (maintenancePct / 100)) / 12;
    const totalMonthlyOwnership = arnonaMonthly + vaadInsMonthly + maintenanceMonthly;
    const totalMonthlyBuying = monthlyMortgage + totalMonthlyOwnership;
    
    // Year-by-year simulation
    const yearlyData: YearlyData[] = [];
    let breakEvenYear: number | null = null;
    
    for (let year = 1; year <= Math.max(horizon, 30); year++) {
      // BUY SIDE
      const homeValueAtYear = price * Math.pow(1 + appreciationRate / 100, year);
      
      // Remaining loan balance
      const monthsElapsed = Math.min(year * 12, numPayments);
      let remainingBalance = loanAmount;
      if (monthlyRate > 0 && monthsElapsed < numPayments) {
        remainingBalance = loanAmount * (Math.pow(1 + monthlyRate, numPayments) - Math.pow(1 + monthlyRate, monthsElapsed)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
      } else if (monthsElapsed >= numPayments) {
        remainingBalance = 0;
      }
      
      // Selling costs
      const sellingCosts = homeValueAtYear * (sellCostPct / 100);
      
      // Capital gains estimate
      let capitalGainsTax = 0;
      if (capitalGainsMode === 'estimate' && capGainsPct > 0) {
        const gain = homeValueAtYear - price;
        if (gain > 0) {
          capitalGainsTax = gain * (capGainsPct / 100);
        }
      }
      
      // Buy net worth = home value - remaining loan - selling costs - cap gains
      const buyNetWorth = homeValueAtYear - remainingBalance - sellingCosts - capitalGainsTax;
      
      // RENT SIDE
      // Total rent paid over years
      let totalRentPaid = 0;
      let currentRentYear = rent;
      for (let y = 0; y < year; y++) {
        totalRentPaid += currentRentYear * 12;
        currentRentYear *= (1 + rentIncreaseRate / 100);
      }
      
      // Renter invests the cash not spent on buying
      const investedPrincipal = totalCashUpfront;
      const investedValue = investedPrincipal * Math.pow(1 + investmentReturnRate / 100, year);
      
      // Monthly savings if renting is cheaper
      let accumulatedMonthlySavings = 0;
      let rentAtYearStart = rent;
      for (let y = 0; y < year; y++) {
        // Owner costs grow with maintenance linked to home value
        const homeValueMidYear = price * Math.pow(1 + appreciationRate / 100, y + 0.5);
        const maintenanceAtYear = (homeValueMidYear * (maintenancePct / 100)) / 12;
        const ownerMonthlyAtYear = monthlyMortgage + arnonaMonthly + vaadInsMonthly + maintenanceAtYear;
        
        const monthlySavings = ownerMonthlyAtYear - rentAtYearStart;
        if (monthlySavings > 0) {
          // These savings earn returns for remaining years
          const yearsToGrow = year - y - 0.5;
          const savingsWithReturn = monthlySavings * 12 * Math.pow(1 + investmentReturnRate / 100, Math.max(0, yearsToGrow));
          accumulatedMonthlySavings += savingsWithReturn;
        }
        rentAtYearStart *= (1 + rentIncreaseRate / 100);
      }
      
      // Rent net worth = invested savings - rent paid
      const rentNetWorth = investedValue + accumulatedMonthlySavings - totalRentPaid;
      
      yearlyData.push({
        year,
        buyNetWorth: Math.round(buyNetWorth),
        rentNetWorth: Math.round(rentNetWorth),
        difference: Math.round(buyNetWorth - rentNetWorth),
      });
      
      // Find break-even
      if (!breakEvenYear && buyNetWorth >= rentNetWorth) {
        breakEvenYear = year;
      }
    }
    
    const atHorizon = yearlyData.find(d => d.year === horizon) || yearlyData[yearlyData.length - 1];
    const buyingWins = atHorizon.buyNetWorth >= atHorizon.rentNetWorth;
    const wealthDifference = Math.abs(atHorizon.buyNetWorth - atHorizon.rentNetWorth);
    
    // Monthly cashflow difference (Year 1)
    const monthlyCashflowDiff = totalMonthlyBuying - rent;
    
    return {
      // Scoreboard
      winner: buyingWins ? 'Buying' : 'Renting',
      wealthDifference,
      breakEvenYear,
      monthlyCashflowDiff,
      
      // Purchase costs
      downPayment,
      loanAmount,
      purchaseTax,
      legal,
      brokerFee,
      bankFees,
      totalPurchaseCosts,
      totalCashUpfront,
      
      // Monthly
      monthlyMortgage,
      arnonaMonthly,
      vaadInsMonthly,
      maintenanceMonthly,
      totalMonthlyOwnership,
      totalMonthlyBuying,
      currentRent: rent,
      
      // At horizon
      atHorizon,
      
      // Yearly data for chart/table
      yearlyData: yearlyData.filter(d => d.year <= horizon),
    };
  }, [
    propertyPrice, monthlyRent, downPaymentPercent, mortgageRate, loanTermYears, timeHorizonYears,
    annualHomeAppreciationPercent, annualRentIncreasePercent, annualInvestmentReturnPercent,
    purchaseTaxOverride, autoPurchaseTax, legalFees, brokerEnabled, brokerFeePercent,
    bankAndAppraisalFees, sellingCostsPercent, capitalGainsMode, capitalGainsTaxPercent,
    monthlyArnona, monthlyVaadAndInsurance, annualMaintenanceReservePercent, buyerType
  ]);
  
  const minDownRequired = MIN_DOWN_PAYMENT[buyerType];
  const downPaymentWarning = sanitizePercent(downPaymentPercent) < minDownRequired;
  
  const chartConfig = {
    buyNetWorth: {
      label: 'Buying',
      color: 'hsl(var(--primary))',
    },
    rentNetWorth: {
      label: 'Renting',
      color: 'hsl(var(--muted-foreground))',
    },
  };
  
  const hasInputs = sanitizeCurrency(propertyPrice) > 0 && sanitizeCurrency(monthlyRent) > 0;
  
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Rent vs Buy Calculator</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Compare the long-term wealth impact of renting versus buying in Israel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </div>
      
      {/* ROW 1: Inputs & Scoreboard */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Inputs Card */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calculator className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Inputs</h2>
          </div>
          
          <div className="space-y-4">
            {/* Buyer Type */}
            <div className="space-y-1.5">
              <Label className="flex items-center text-sm font-medium">
                Buyer Status
                <InfoTooltip content="Determines Purchase Tax (Mas Rechisha) rates and minimum down payment requirements." />
              </Label>
              <Select value={buyerType} onValueChange={(v) => setBuyerType(v as BuyerCategory)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_time">Resident (First Property)</SelectItem>
                  <SelectItem value="oleh">Oleh Hadash (within 7 years)</SelectItem>
                  <SelectItem value="additional">Resident (Additional Property)</SelectItem>
                  <SelectItem value="non_resident">Foreign Non-Resident</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* City (optional) */}
            <div className="space-y-1.5">
              <Label className="flex items-center text-sm font-medium">
                City <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                <InfoTooltip content="Select a city to auto-fill typical prices, rents, and appreciation rates." />
              </Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select city for defaults" />
                </SelectTrigger>
                <SelectContent>
                  {cities?.map((city) => (
                    <SelectItem key={city.slug} value={city.slug}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCity && suggestedPrice && suggestedRent && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setPropertyPrice(formatNumber(suggestedPrice))}
                    className="text-xs text-primary hover:underline"
                  >
                    Use price: ₪{formatNumber(suggestedPrice)}
                  </button>
                  <button
                    onClick={() => setMonthlyRent(formatNumber(suggestedRent))}
                    className="text-xs text-primary hover:underline"
                  >
                    Use rent: ₪{formatNumber(suggestedRent)}/mo
                  </button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Property Price */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Property Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₪</span>
                  <Input
                    value={propertyPrice}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[₪,\s]/g, '');
                      if (/^\d*$/.test(raw)) {
                        setPropertyPrice(raw ? formatNumber(parseInt(raw)) : '');
                      }
                    }}
                    placeholder="2,500,000"
                    className="h-10 pl-7"
                  />
                </div>
              </div>
              
              {/* Monthly Rent */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Monthly Rent</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₪</span>
                  <Input
                    value={monthlyRent}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[₪,\s]/g, '');
                      if (/^\d*$/.test(raw)) {
                        setMonthlyRent(raw ? formatNumber(parseInt(raw)) : '');
                      }
                    }}
                    placeholder="6,000"
                    className="h-10 pl-7"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Down Payment */}
              <div className="space-y-1.5">
                <Label className="flex items-center text-sm font-medium">
                  Down Payment
                  <InfoTooltip content={`Israeli banks require minimum ${minDownRequired}% for ${buyerType === 'first_time' ? 'first-time buyers' : buyerType === 'oleh' ? 'Olim' : buyerType === 'additional' ? 'additional properties' : 'non-residents'}.`} />
                </Label>
                <div className="relative">
                  <Input
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(e.target.value)}
                    className="h-10 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
                {downPaymentWarning && (
                  <p className="text-xs text-warning flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Min {minDownRequired}% required
                  </p>
                )}
              </div>
              
              {/* Mortgage Rate */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Mortgage Rate</Label>
                <div className="relative">
                  <Input
                    value={mortgageRate}
                    onChange={(e) => setMortgageRate(e.target.value)}
                    className="h-10 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>
            </div>
            
            {/* Loan Term */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Loan Term (years)</Label>
              <Input
                value={loanTermYears}
                onChange={(e) => setLoanTermYears(e.target.value)}
                className="h-10"
              />
            </div>
            
            {/* Time Horizon */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Time Horizon (years)</Label>
              <div className="flex gap-2">
                {TIME_HORIZONS.map((years) => (
                  <Button
                    key={years}
                    variant={timeHorizonYears === years ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeHorizonYears(years)}
                    className="flex-1"
                  >
                    {years}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Scoreboard Card */}
        <Card className="p-6 bg-muted/30">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Scoreboard</h2>
          </div>
          
          {calculations ? (
            <div className="space-y-5">
              {/* Winner */}
              <div className="text-center py-4 px-6 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Winner at {timeHorizonYears} Years</p>
                <p className="text-3xl font-bold text-primary">{calculations.winner}</p>
              </div>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Net Worth Difference</p>
                  <p className="text-xl font-bold tabular-nums">₪{formatNumber(calculations.wealthDifference)}</p>
                  <p className="text-xs text-muted-foreground">{calculations.winner} is ahead</p>
                </div>
                
                <div className="p-4 bg-background rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Break-Even Year</p>
                  <p className="text-xl font-bold">
                    {calculations.breakEvenYear 
                      ? `Year ${calculations.breakEvenYear}` 
                      : `No break-even within ${Math.max(timeHorizonYears, 30)}yr`}
                  </p>
                  {calculations.breakEvenYear && calculations.breakEvenYear > timeHorizonYears && (
                    <p className="text-xs text-warning">Beyond horizon</p>
                  )}
                </div>
              </div>
              
              {/* Monthly Cashflow */}
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Monthly Cashflow Difference (Year 1)</p>
                <p className="text-xl font-bold tabular-nums">
                  ₪{formatNumber(Math.abs(calculations.monthlyCashflowDiff))}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {calculations.monthlyCashflowDiff > 0 ? 'more to buy' : 'more to rent'}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Enter property price and rent</p>
              <p className="text-sm mt-1">to see comparison results</p>
            </div>
          )}
        </Card>
      </div>
      
      {/* ROW 2: Assumptions Grid */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Settings2 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Assumptions</h2>
          <span className="text-sm text-muted-foreground">(all visible)</span>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Market Assumptions */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Market</h3>
            
            <div className="space-y-1.5">
              <Label className="text-sm">Annual Home Appreciation</Label>
              <div className="relative">
                <Input
                  value={annualHomeAppreciationPercent}
                  onChange={(e) => setAnnualHomeAppreciationPercent(e.target.value)}
                  className="h-9 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-sm">Annual Rent Increase</Label>
              <div className="relative">
                <Input
                  value={annualRentIncreasePercent}
                  onChange={(e) => setAnnualRentIncreasePercent(e.target.value)}
                  className="h-9 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="flex items-center text-sm">
                Investment Return
                <InfoTooltip content="If you rent, what annual return could your down payment earn if invested elsewhere?" />
              </Label>
              <div className="relative">
                <Input
                  value={annualInvestmentReturnPercent}
                  onChange={(e) => setAnnualInvestmentReturnPercent(e.target.value)}
                  className="h-9 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
              </div>
            </div>
          </div>
          
          {/* Transaction Costs */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Transaction Costs</h3>
            
            <div className="space-y-1.5">
              <Label className="flex items-center text-sm">
                Purchase Tax
                <InfoTooltip content={`Auto-calculated based on buyer type. For ${buyerType === 'first_time' ? 'first-time buyers' : buyerType === 'oleh' ? 'Olim' : buyerType === 'additional' ? 'additional properties' : 'non-residents'}: ₪${formatNumber(autoPurchaseTax)}`} />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₪</span>
                <Input
                  value={purchaseTaxOverride}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[₪,\s]/g, '');
                    if (/^\d*$/.test(raw)) {
                      setPurchaseTaxOverride(raw ? formatNumber(parseInt(raw)) : '');
                    }
                  }}
                  placeholder={formatNumber(autoPurchaseTax)}
                  className="h-9 pl-7"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-sm">Legal Fees</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₪</span>
                <Input
                  value={legalFees}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[₪,\s]/g, '');
                    if (/^\d*$/.test(raw)) {
                      setLegalFees(raw);
                    }
                  }}
                  className="h-9 pl-7"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-sm">Broker Fee (2% + VAT)</Label>
              <Switch checked={brokerEnabled} onCheckedChange={setBrokerEnabled} />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-sm">Bank & Appraisal Fees</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₪</span>
                <Input
                  value={bankAndAppraisalFees}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[₪,\s]/g, '');
                    if (/^\d*$/.test(raw)) {
                      setBankAndAppraisalFees(raw);
                    }
                  }}
                  className="h-9 pl-7"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="flex items-center text-sm">
                Selling Costs
                <InfoTooltip content="Typical agent commission (2%) plus VAT when selling. Applied at end of horizon." />
              </Label>
              <div className="relative">
                <Input
                  value={sellingCostsPercent}
                  onChange={(e) => setSellingCostsPercent(e.target.value)}
                  className="h-9 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-sm">Capital Gains</Label>
              <Select value={capitalGainsMode} onValueChange={(v) => setCapitalGainsMode(v as 'ignore' | 'estimate')}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ignore">Ignore</SelectItem>
                  <SelectItem value="estimate">Estimate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {capitalGainsMode === 'estimate' && (
              <div className="space-y-1.5">
                <Label className="text-sm">Cap Gains Tax Rate</Label>
                <div className="relative">
                  <Input
                    value={capitalGainsTaxPercent}
                    onChange={(e) => setCapitalGainsTaxPercent(e.target.value)}
                    className="h-9 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Ownership Costs */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Ownership Costs</h3>
            
            <div className="space-y-1.5">
              <Label className="text-sm">Monthly Arnona</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₪</span>
                <Input
                  value={monthlyArnona}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[₪,\s]/g, '');
                    if (/^\d*$/.test(raw)) {
                      setMonthlyArnona(raw);
                    }
                  }}
                  className="h-9 pl-7"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-sm">Monthly Va'ad + Insurance</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₪</span>
                <Input
                  value={monthlyVaadAndInsurance}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[₪,\s]/g, '');
                    if (/^\d*$/.test(raw)) {
                      setMonthlyVaadAndInsurance(raw);
                    }
                  }}
                  className="h-9 pl-7"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="flex items-center text-sm">
                Maintenance Reserve
                <InfoTooltip content="Annual maintenance reserve as percentage of property value. Typical is 1% for routine repairs and upkeep." />
              </Label>
              <div className="relative">
                <Input
                  value={annualMaintenanceReservePercent}
                  onChange={(e) => setAnnualMaintenanceReservePercent(e.target.value)}
                  className="h-9 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%/yr</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* ROW 3: Monthly Comparison & After X Years */}
      {calculations && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly Comparison */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Wallet className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Monthly Comparison</h2>
            </div>
            
            <div className="space-y-4">
              {/* Buying Costs */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">If You Buy</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mortgage (P&I)</span>
                    <span className="tabular-nums">₪{formatNumber(calculations.monthlyMortgage)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Arnona</span>
                    <span className="tabular-nums">₪{formatNumber(calculations.arnonaMonthly)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Va'ad + Insurance</span>
                    <span className="tabular-nums">₪{formatNumber(calculations.vaadInsMonthly)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maintenance Reserve</span>
                    <span className="tabular-nums">₪{formatNumber(calculations.maintenanceMonthly)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total Monthly</span>
                    <span className="tabular-nums">₪{formatNumber(calculations.totalMonthlyBuying)}</span>
                  </div>
                </div>
              </div>
              
              {/* Renting Cost */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">If You Rent</p>
                <div className="flex justify-between font-semibold text-sm">
                  <span>Monthly Rent</span>
                  <span className="tabular-nums">₪{formatNumber(calculations.currentRent)}</span>
                </div>
              </div>
              
              {/* Difference */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Difference</span>
                  <span className="text-lg font-bold tabular-nums">
                    ₪{formatNumber(Math.abs(calculations.monthlyCashflowDiff))}
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      {calculations.monthlyCashflowDiff > 0 ? 'more to buy' : 'more to rent'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </Card>
          
          {/* After X Years */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">After {timeHorizonYears} Years</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Buy Net Worth</p>
                <p className="text-2xl font-bold tabular-nums">₪{formatNumber(calculations.atHorizon.buyNetWorth)}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Rent Net Worth</p>
                <p className="text-2xl font-bold tabular-nums">
                  {calculations.atHorizon.rentNetWorth >= 0 ? '₪' : '-₪'}
                  {formatNumber(Math.abs(calculations.atHorizon.rentNetWorth))}
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Difference</p>
              <p className="text-xl font-bold">
                {calculations.winner} is ahead by ₪{formatNumber(calculations.wealthDifference)}
              </p>
            </div>
          </Card>
        </div>
      )}
      
      {/* ROW 4: Chart & Table */}
      {calculations && calculations.yearlyData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Chart */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Net Worth Over Time</h2>
            </div>
            
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={calculations.yearlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="year" 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `Y${value}`}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₪${(value / 1000000).toFixed(1)}M`}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value, name) => {
                        const numValue = Number(value);
                        return [
                          `₪${formatNumber(numValue)}`,
                          name === 'buyNetWorth' ? 'Buying' : 'Renting'
                        ];
                      }}
                    />}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="buyNetWorth" 
                    name="Buying"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rentNetWorth" 
                    name="Renting"
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>
          
          {/* Year-by-Year Table */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Calculator className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Year-by-Year Comparison</h2>
            </div>
            
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Year</TableHead>
                    <TableHead className="text-right">Buy</TableHead>
                    <TableHead className="text-right">Rent</TableHead>
                    <TableHead className="text-right">Diff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.yearlyData.map((row) => (
                    <TableRow key={row.year} className={row.year === timeHorizonYears ? 'bg-primary/5' : ''}>
                      <TableCell className="font-medium">{row.year}</TableCell>
                      <TableCell className="text-right tabular-nums">₪{formatNumber(row.buyNetWorth)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.rentNetWorth >= 0 ? '₪' : '-₪'}{formatNumber(Math.abs(row.rentNetWorth))}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right tabular-nums font-medium",
                        row.difference > 0 ? "text-success" : row.difference < 0 ? "text-destructive" : ""
                      )}>
                        {row.difference > 0 ? '+' : ''}{row.difference !== 0 ? `₪${formatNumber(row.difference)}` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}
      
      {/* ROW 5: Beyond the Numbers */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Beyond the Numbers</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          {/* Why People Buy */}
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Home className="h-4 w-4 text-muted-foreground" />
              Why People Buy
            </h3>
            <ul className="space-y-2">
              {BUYING_PROS.map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{pro.text}</span>
                </li>
              ))}
            </ul>
          </Card>
          
          {/* Why People Rent */}
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Why People Rent
            </h3>
            <ul className="space-y-2">
              {RENTING_PROS.map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{pro.text}</span>
                </li>
              ))}
            </ul>
          </Card>
          
          {/* Reality Checks for Internationals */}
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Reality Checks (Israel)
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>Rental contracts typically 1-2 years, no renewal guarantee</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>Non-residents require 50% down payment minimum</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>Olim get tax benefits for 7 years after Aliyah</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>Prices linked to shekel; currency risk for USD/EUR earners</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
      
      {/* Navigation & Feedback */}
      <div className="grid md:grid-cols-3 gap-4">
        <CTACard
          title="Calculate Your Mortgage"
          description="Get detailed monthly payment breakdown"
          buttonText="Mortgage Calculator"
          buttonLink="/tools?tool=mortgage"
          icon={<Wallet className="h-5 w-5" />}
          variant="muted"
        />
        <CTACard
          title="Full Purchase Costs"
          description="See all one-time and closing costs"
          buttonText="True Cost Calculator"
          buttonLink="/tools?tool=totalcost"
          icon={<Calculator className="h-5 w-5" />}
          variant="muted"
        />
        <CTACard
          title="Explore Areas"
          description="Research city market data and trends"
          buttonText="Browse Areas"
          buttonLink="/areas"
          icon={<MapPin className="h-5 w-5" />}
          variant="muted"
        />
      </div>
      
      <div className="text-center">
        <ToolFeedback toolName="rent-vs-buy-calculator" variant="inline" />
      </div>
      
      {/* Disclaimer */}
      <ToolDisclaimer text="Estimates only. Actual terms vary by lender, property, and residency status. Consult with local professionals for personalized advice." />
    </div>
  );
}
