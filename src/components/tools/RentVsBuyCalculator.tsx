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
  Calendar,
  Building2,
  Clock,
  PiggyBank,
  Calculator,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { 
  ToolLayout, 
  ToolDisclaimer, 
  ToolFeedback, 
  CTACard,
  InfoBanner,
} from './shared';
import { calculatePurchaseTax as calcTax } from '@/hooks/useBuyerProfile';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { useCities } from '@/hooks/useCities';
import { useCanonicalMetrics, getRentalRange } from '@/hooks/useCanonicalMetrics';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'buywise_rent_vs_buy_inputs';
const STORAGE_EXPIRY_DAYS = 7;

type BuyerCategory = 'first_time' | 'oleh' | 'additional' | 'non_resident';

// Fee estimates
const FEES = {
  lawyerRate: 0.005, // 0.5% of price
  lawyerMinimum: 5000,
  agentRate: 0.02, // 2% + VAT
  vatRate: 0.17,
  arnonaDefault: 400, // Monthly estimate when city data not available
  vaadBayitDefault: 350, // Monthly building maintenance
  homeInsurance: 150, // Monthly
  maintenanceRate: 0.005, // 0.5% of property value annually
};

// Time horizon options
const TIME_HORIZONS = [5, 10, 15, 20, 25];

// Room options for rental matching
const ROOM_OPTIONS = [
  { value: '2', label: '2 Rooms' },
  { value: '3', label: '3 Rooms' },
  { value: '4', label: '4 Rooms' },
  { value: '5', label: '5+ Rooms' },
];

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
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help ml-1 inline-block" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function RentVsBuyCalculator() {
  const { data: buyerProfile } = useBuyerProfile();
  const { data: cities } = useCities();
  
  // Form state
  const [selectedCity, setSelectedCity] = useState('');
  const [rooms, setRooms] = useState('3');
  const [propertyPrice, setPropertyPrice] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [buyerType, setBuyerType] = useState<BuyerCategory>('first_time');
  const [downPaymentPercent, setDownPaymentPercent] = useState('25');
  const [interestRate, setInterestRate] = useState('5.0');
  const [timeHorizon, setTimeHorizon] = useState(10);
  const [appreciation, setAppreciation] = useState('3.0');
  const [rentIncrease, setRentIncrease] = useState('3.0');
  const [investmentReturn, setInvestmentReturn] = useState('5.0');
  
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
      setAppreciation(cityMetrics.yoy_price_change.toFixed(1));
    }
  }, [cityMetrics]);
  
  // Load saved inputs
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { data, timestamp } = JSON.parse(saved);
        const expiryMs = STORAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp < expiryMs) {
          if (data.selectedCity) setSelectedCity(data.selectedCity);
          if (data.rooms) setRooms(data.rooms);
          if (data.propertyPrice) setPropertyPrice(data.propertyPrice);
          if (data.monthlyRent) setMonthlyRent(data.monthlyRent);
          if (data.buyerType) setBuyerType(data.buyerType);
          if (data.downPaymentPercent) setDownPaymentPercent(data.downPaymentPercent);
          if (data.interestRate) setInterestRate(data.interestRate);
          if (data.timeHorizon) setTimeHorizon(data.timeHorizon);
          if (data.appreciation) setAppreciation(data.appreciation);
          if (data.rentIncrease) setRentIncrease(data.rentIncrease);
          if (data.investmentReturn) setInvestmentReturn(data.investmentReturn);
        }
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
    // Estimate size based on rooms
    const estimatedSize = parseInt(rooms) === 2 ? 50 
      : parseInt(rooms) === 3 ? 75 
      : parseInt(rooms) === 4 ? 100 
      : 130;
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
  
  // Save inputs
  const handleSave = useCallback(() => {
    const data = {
      selectedCity,
      rooms,
      propertyPrice,
      monthlyRent,
      buyerType,
      downPaymentPercent,
      interestRate,
      timeHorizon,
      appreciation,
      rentIncrease,
      investmentReturn,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
    toast.success('Inputs saved for 7 days');
  }, [selectedCity, rooms, propertyPrice, monthlyRent, buyerType, downPaymentPercent, interestRate, timeHorizon, appreciation, rentIncrease, investmentReturn]);
  
  // Reset inputs
  const handleReset = useCallback(() => {
    setSelectedCity('');
    setRooms('3');
    setPropertyPrice('');
    setMonthlyRent('');
    setBuyerType('first_time');
    setDownPaymentPercent('25');
    setInterestRate('5.0');
    setTimeHorizon(10);
    setAppreciation('3.0');
    setRentIncrease('3.0');
    setInvestmentReturn('5.0');
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Reset to defaults');
  }, []);
  
  // Main calculations
  const calculations = useMemo(() => {
    const price = parseFormattedNumber(propertyPrice);
    const rent = parseFormattedNumber(monthlyRent);
    const downPaymentPct = parseFloat(downPaymentPercent) || 25;
    const rate = parseFloat(interestRate) || 5.0;
    const years = timeHorizon;
    const appreciationRate = parseFloat(appreciation) || 3.0;
    const rentIncreaseRate = parseFloat(rentIncrease) || 3.0;
    const investmentReturnRate = parseFloat(investmentReturn) || 5.0;
    
    if (price <= 0 || rent <= 0) return null;
    
    // Buying calculations
    const downPayment = price * (downPaymentPct / 100);
    const loanAmount = price - downPayment;
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    
    // Monthly mortgage payment (P&I)
    const monthlyMortgage = monthlyRate > 0
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanAmount / numPayments;
    
    // One-time purchase costs
    const purchaseTax = calcTax(price, buyerType);
    const lawyerFee = Math.max(price * FEES.lawyerRate * (1 + FEES.vatRate), FEES.lawyerMinimum);
    const agentFee = price * FEES.agentRate * (1 + FEES.vatRate);
    const totalPurchaseCosts = purchaseTax + lawyerFee + agentFee;
    
    // Monthly ownership costs (beyond mortgage)
    const monthlyArnona = cityMetrics?.arnona_monthly_avg || FEES.arnonaDefault;
    const monthlyVaadBayit = FEES.vaadBayitDefault;
    const monthlyInsurance = FEES.homeInsurance;
    const monthlyMaintenance = (price * FEES.maintenanceRate) / 12;
    const totalMonthlyOwnershipCosts = monthlyArnona + monthlyVaadBayit + monthlyInsurance + monthlyMaintenance;
    
    // Total monthly if buying
    const totalMonthlyBuying = monthlyMortgage + totalMonthlyOwnershipCosts;
    
    // Property value at end of period
    const futurePropertyValue = price * Math.pow(1 + appreciationRate / 100, years);
    const appreciation$ = futurePropertyValue - price;
    
    // Calculate remaining loan balance after X years
    const remainingBalance = loanAmount * 
      (Math.pow(1 + monthlyRate, numPayments) - Math.pow(1 + monthlyRate, years * 12)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    // Equity built
    const equityBuilt = futurePropertyValue - remainingBalance;
    
    // Total cost of buying over period
    const totalMortgagePayments = monthlyMortgage * years * 12;
    const totalOwnershipCosts = totalMonthlyOwnershipCosts * years * 12;
    const totalBuyingCost = downPayment + totalPurchaseCosts + totalMortgagePayments + totalOwnershipCosts;
    
    // Net wealth from buying (equity - what you spent)
    const netBuyingWealth = equityBuilt;
    
    // Renting calculations
    // Total rent paid with annual increases
    let totalRentPaid = 0;
    let currentRent = rent;
    for (let year = 0; year < years; year++) {
      totalRentPaid += currentRent * 12;
      currentRent *= (1 + rentIncreaseRate / 100);
    }
    const finalYearRent = rent * Math.pow(1 + rentIncreaseRate / 100, years - 1);
    
    // Opportunity cost: what if down payment + purchase costs were invested?
    const totalCashNotSpent = downPayment + totalPurchaseCosts;
    const investedSavingsValue = totalCashNotSpent * Math.pow(1 + investmentReturnRate / 100, years);
    const investmentGains = investedSavingsValue - totalCashNotSpent;
    
    // Net wealth from renting (invested savings - rent paid)
    const netRentingWealth = investedSavingsValue - totalRentPaid;
    
    // Comparison
    const buyingIsBetter = netBuyingWealth > netRentingWealth;
    const wealthDifference = Math.abs(netBuyingWealth - netRentingWealth);
    
    // Calculate break-even year
    let breakEvenYear = null;
    for (let year = 1; year <= 30; year++) {
      // Calculate cumulative costs/gains for each scenario at this year
      const propertyValueAtYear = price * Math.pow(1 + appreciationRate / 100, year);
      const remainingLoanAtYear = year >= years ? 0 : loanAmount * 
        (Math.pow(1 + monthlyRate, numPayments) - Math.pow(1 + monthlyRate, year * 12)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);
      const buyingEquityAtYear = propertyValueAtYear - remainingLoanAtYear;
      
      let rentPaidAtYear = 0;
      let rentAtYear = rent;
      for (let y = 0; y < year; y++) {
        rentPaidAtYear += rentAtYear * 12;
        rentAtYear *= (1 + rentIncreaseRate / 100);
      }
      const investedValueAtYear = totalCashNotSpent * Math.pow(1 + investmentReturnRate / 100, year);
      const rentingWealthAtYear = investedValueAtYear - rentPaidAtYear;
      
      if (buyingEquityAtYear > rentingWealthAtYear) {
        breakEvenYear = year;
        break;
      }
    }
    
    return {
      // Core comparison
      buyingIsBetter,
      wealthDifference,
      breakEvenYear,
      
      // Monthly comparison
      monthlyMortgage,
      totalMonthlyBuying,
      totalMonthlyOwnershipCosts,
      currentMonthlyRent: rent,
      finalYearRent,
      
      // Buying details
      downPayment,
      loanAmount,
      purchaseTax,
      lawyerFee,
      agentFee,
      totalPurchaseCosts,
      totalMortgagePayments,
      totalOwnershipCosts,
      futurePropertyValue,
      appreciation: appreciation$,
      equityBuilt,
      netBuyingWealth,
      totalBuyingCost,
      
      // Renting details
      totalRentPaid,
      investedSavingsValue,
      investmentGains,
      netRentingWealth,
      totalCashNotSpent,
      
      // Monthly costs breakdown
      monthlyArnona,
      monthlyVaadBayit,
      monthlyInsurance,
      monthlyMaintenance,
    };
  }, [propertyPrice, monthlyRent, downPaymentPercent, interestRate, timeHorizon, appreciation, rentIncrease, investmentReturn, buyerType, cityMetrics]);
  
  // Header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
        <RotateCcw className="h-4 w-4" />
        <span className="hidden sm:inline">Reset</span>
      </Button>
      <Button variant="outline" size="sm" onClick={handleSave} className="gap-2">
        <Save className="h-4 w-4" />
        <span className="hidden sm:inline">Save</span>
      </Button>
    </div>
  );
  
  // Info banner
  const infoBanner = (
    <InfoBanner>
      Israeli rental contracts typically allow 3-5% annual increases. Property appreciation has historically outpaced many Western markets.
    </InfoBanner>
  );
  
  // Left column - Inputs
  const leftColumn = (
    <div className="space-y-6">
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
          
          {/* Rooms */}
          <div className="space-y-2">
            <Label htmlFor="rooms" className="flex items-center text-sm font-medium">
              Property Size (Rooms)
              <InfoTooltip content="Israeli room count includes living room and bedrooms. A '3-room' apartment typically has 2 bedrooms + living room." />
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span>
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
                className="h-11 pl-8"
              />
            </div>
            {suggestedPrice && !propertyPrice && (
              <button
                onClick={handleUseSuggestedPrice}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Use city estimate: ₪{formatNumber(suggestedPrice)}
              </button>
            )}
          </div>
          
          {/* Monthly Rent */}
          <div className="space-y-2">
            <Label htmlFor="monthlyRent" className="flex items-center text-sm font-medium">
              Current Monthly Rent
              <InfoTooltip content="Your current or expected monthly rent payment. This will be compared against ownership costs." />
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span>
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
                className="h-11 pl-8"
              />
            </div>
            {suggestedRent && !monthlyRent && selectedCity && (
              <button
                onClick={handleUseSuggestedRent}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Use city average: ₪{formatNumber(suggestedRent)}/mo
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
          {/* Buyer Type */}
          <div className="space-y-2">
            <Label htmlFor="buyerType" className="flex items-center text-sm font-medium">
              Buyer Status
              <InfoTooltip content="Your buyer status determines Purchase Tax (Mas Rechisha) rates and maximum mortgage LTV." />
            </Label>
            <Select value={buyerType} onValueChange={(v) => setBuyerType(v as BuyerCategory)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_time">First-Time Buyer</SelectItem>
                <SelectItem value="oleh">Oleh Hadash (within 7 years)</SelectItem>
                <SelectItem value="additional">Upgrader / Additional Property</SelectItem>
                <SelectItem value="non_resident">Non-Resident</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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
                  className="h-11 pr-8"
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
                  className="h-11 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
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
                  className="h-11 pr-10"
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
                  className="h-11 pr-10"
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
                  className="h-11 pr-10"
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
    <div className="space-y-4">
      {calculations ? (
        <>
          {/* Hero Result */}
          <Card className={cn(
            "p-6 border-2",
            calculations.buyingIsBetter 
              ? "bg-success/5 border-success/30" 
              : "bg-primary/5 border-primary/30"
          )}>
            <div className="flex items-center gap-3 mb-3">
              {calculations.buyingIsBetter ? (
                <div className="p-2 rounded-full bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-primary/10">
                  <PiggyBank className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold">
                  {calculations.buyingIsBetter ? 'Buying is Better' : 'Renting May Be Better'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Over {timeHorizon} years
                </p>
              </div>
            </div>
            
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-foreground">
                ₪{formatNumber(Math.round(calculations.wealthDifference))}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {calculations.buyingIsBetter 
                  ? 'More wealth from buying'
                  : 'Saved by continuing to rent'}
              </p>
            </div>
            
            {/* Break-even */}
            {calculations.breakEvenYear && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Break-even point
                  </span>
                  <span className="font-semibold">
                    ~{calculations.breakEvenYear} years
                  </span>
                </div>
                {calculations.breakEvenYear > timeHorizon && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Break-even is beyond your {timeHorizon}-year horizon
                  </p>
                )}
              </div>
            )}
          </Card>
          
          {/* Monthly Comparison */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Monthly Comparison
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* If You Buy */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">If You Buy</p>
                <p className="text-xl font-bold">₪{formatNumber(Math.round(calculations.totalMonthlyBuying))}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Mortgage</span>
                    <span>₪{formatNumber(Math.round(calculations.monthlyMortgage))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Running costs</span>
                    <span>₪{formatNumber(Math.round(calculations.totalMonthlyOwnershipCosts))}</span>
                  </div>
                </div>
              </div>
              
              {/* If You Rent */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">If You Rent</p>
                <p className="text-xl font-bold">₪{formatNumber(Math.round(calculations.currentMonthlyRent))}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Year 1</span>
                    <span>₪{formatNumber(Math.round(calculations.currentMonthlyRent))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Year {timeHorizon}</span>
                    <span>₪{formatNumber(Math.round(calculations.finalYearRent))}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Wealth Projection */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              After {timeHorizon} Years
            </h4>
            
            <div className="space-y-4">
              {/* If Buying */}
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    If You Buy
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Property value</span>
                    <span className="text-foreground">₪{formatNumber(Math.round(calculations.futurePropertyValue))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Equity built</span>
                    <span className="text-success">₪{formatNumber(Math.round(calculations.equityBuilt))}</span>
                  </div>
                </div>
              </div>
              
              {/* If Renting */}
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    If You Rent
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Total rent paid</span>
                    <span className="text-destructive">-₪{formatNumber(Math.round(calculations.totalRentPaid))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Savings invested</span>
                    <span className="text-success">₪{formatNumber(Math.round(calculations.investedSavingsValue))}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Enter property price and rent</p>
            <p className="text-sm mt-1">
              We'll calculate the true cost of each option
            </p>
          </div>
        </Card>
      )}
    </div>
  );
  
  // Bottom section - Cost breakdowns and navigation
  const bottomSection = calculations && (
    <div className="space-y-8">
      {/* Detailed Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Buying Breakdown */}
        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            Buying: Full {timeHorizon}-Year Cost
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Down payment</span>
              <span>₪{formatNumber(Math.round(calculations.downPayment))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                Purchase Tax (Mas Rechisha)
                <InfoTooltip content="One-time tax on property purchases. Rate depends on buyer status." />
              </span>
              <span>₪{formatNumber(Math.round(calculations.purchaseTax))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Legal & agent fees</span>
              <span>₪{formatNumber(Math.round(calculations.lawyerFee + calculations.agentFee))}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total mortgage payments</span>
              <span>₪{formatNumber(Math.round(calculations.totalMortgagePayments))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                Running costs (Arnona, Vaad, etc.)
                <InfoTooltip content="Includes Arnona (property tax), Vaad Bayit (building maintenance), insurance, and maintenance reserve." />
              </span>
              <span>₪{formatNumber(Math.round(calculations.totalOwnershipCosts))}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total cash outflow</span>
              <span>₪{formatNumber(Math.round(calculations.totalBuyingCost))}</span>
            </div>
            <div className="flex justify-between text-success">
              <span>Property appreciation</span>
              <span>+₪{formatNumber(Math.round(calculations.appreciation))}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Net position (equity)</span>
              <span className="text-success">₪{formatNumber(Math.round(calculations.equityBuilt))}</span>
            </div>
          </div>
        </Card>
        
        {/* Renting Breakdown */}
        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Renting: Full {timeHorizon}-Year Cost
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Year 1 rent (monthly)</span>
              <span>₪{formatNumber(Math.round(calculations.currentMonthlyRent))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Year {timeHorizon} rent (with increases)</span>
              <span>₪{formatNumber(Math.round(calculations.finalYearRent))}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-destructive">
              <span>Total rent paid over {timeHorizon} years</span>
              <span>-₪{formatNumber(Math.round(calculations.totalRentPaid))}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                Cash kept (vs. down payment)
                <InfoTooltip content="The down payment and purchase costs you didn't spend, which could be invested." />
              </span>
              <span>₪{formatNumber(Math.round(calculations.totalCashNotSpent))}</span>
            </div>
            <div className="flex justify-between text-success">
              <span>Investment growth ({investmentReturn}% return)</span>
              <span>+₪{formatNumber(Math.round(calculations.investmentGains))}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Net position</span>
              <span className={calculations.netRentingWealth >= 0 ? 'text-success' : 'text-destructive'}>
                {calculations.netRentingWealth >= 0 ? '₪' : '-₪'}{formatNumber(Math.abs(Math.round(calculations.netRentingWealth)))}
              </span>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Navigation Cards */}
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
          buttonLink="/tools?tool=truecost"
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
      
      {/* Feedback */}
      <div className="text-center">
        <ToolFeedback 
          toolName="rent-vs-buy-calculator" 
          variant="inline" 
        />
      </div>
    </div>
  );
  
  // Disclaimer
  const disclaimer = (
    <ToolDisclaimer 
      text="This calculator provides estimates for educational purposes. Actual costs vary based on specific properties, lender terms, and market conditions. Consult with local professionals for personalized advice."
    />
  );
  
  return (
    <ToolLayout
      title="Rent vs Buy Calculator"
      subtitle="Compare the true cost of renting versus buying in Israel over time"
      icon={<Scale className="h-6 w-6" />}
      headerActions={headerActions}
      infoBanner={infoBanner}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      bottomSection={bottomSection}
      disclaimer={disclaimer}
    />
  );
}
