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
  Lightbulb,
  Users,
  Shield,
  Paintbrush,
  RefreshCw,
  AlertCircle,
  ChevronDown,
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
import { 
  ToolLayout, 
  ToolDisclaimer, 
  ToolFeedback, 
  CTACard,
  InfoBanner,
  InsightCard,
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
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help ml-1 inline-block" />
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
    
    // Lifestyle comparison calculations
    const avgPricePerSqm = cityMetrics?.average_price_sqm || (price / (SQM_BY_ROOMS[rooms] || 75));
    
    // What size property can you BUY with this budget?
    const buyingSqm = price / avgPricePerSqm;
    
    // What size property can you RENT with the same monthly budget?
    // If buying costs X/month, what size rental does X/month get you?
    const rentPricePerSqm = rent / (SQM_BY_ROOMS[rooms] || 75); // estimate rent per sqm
    const rentingSqmForBuyingBudget = totalMonthlyBuying / rentPricePerSqm;
    
    // Space advantage for renters
    const spaceAdvantagePercent = Math.round(((rentingSqmForBuyingBudget - buyingSqm) / buyingSqm) * 100);
    
    // Monthly equity being built (principal portion of mortgage - rough estimate)
    const monthlyEquityBuilding = monthlyMortgage * 0.3; // Rough estimate, early years are mostly interest
    
    // Price to rent ratio (common metric - lower favors buying)
    const priceToRentRatio = price / (rent * 12);
    
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
      
      // Lifestyle comparison
      buyingSqm,
      rentingSqmForBuyingBudget,
      spaceAdvantagePercent,
      monthlyEquityBuilding,
      priceToRentRatio,
    };
  }, [propertyPrice, monthlyRent, downPaymentPercent, interestRate, timeHorizon, appreciation, rentIncrease, investmentReturn, buyerType, cityMetrics, rooms]);
  
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
      Both paths have real advantages. This tool helps you see what each offers—financially and in daily life—so you can decide what fits your priorities.
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
  
  // Right column - Results (One unified card with internal sections)
  const rightColumn = (
    <div>
      {calculations ? (
        <Card className="overflow-hidden">
          {/* Down Payment Warning Banner - inside card */}
          {parseFloat(downPaymentPercent) < MIN_DOWN_PAYMENT[buyerType] && (
            <div className="flex items-center gap-2 px-6 py-3 bg-warning/10 border-b border-warning/20">
              <AlertCircle className="h-4 w-4 text-warning shrink-0" />
              <p className="text-xs text-warning-foreground">
                Banks require min {MIN_DOWN_PAYMENT[buyerType]}% down for {buyerType === 'first_time' ? 'first-time buyers' : buyerType === 'oleh' ? 'Olim' : buyerType === 'additional' ? 'additional properties' : 'non-residents'} — you entered {downPaymentPercent}%
              </p>
            </div>
          )}
          
          {/* HERO: Monthly Comparison */}
          <div className="p-6">
            <div className="flex items-center gap-4 justify-center mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums">₪{formatNumber(Math.round(calculations.totalMonthlyBuying))}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">to buy</p>
              </div>
              <div className="text-muted-foreground text-sm font-medium">vs</div>
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums">₪{formatNumber(Math.round(calculations.currentMonthlyRent))}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">to rent</p>
              </div>
            </div>
            
            {/* Monthly difference badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm">
                <span className="font-medium tabular-nums">
                  ₪{formatNumber(Math.round(Math.abs(calculations.totalMonthlyBuying - calculations.currentMonthlyRent)))}
                </span>
                <span className="text-muted-foreground">
                  {calculations.totalMonthlyBuying > calculations.currentMonthlyRent ? 'more to buy' : 'more to rent'}
                </span>
              </div>
            </div>
          </div>
          
          {/* BREAKDOWN: Monthly cost details */}
          <div className="px-6 py-5 border-t border-border bg-muted/20">
            <div className="grid grid-cols-2 gap-6">
              {/* Buying costs */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Buying includes</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mortgage</span>
                    <span className="tabular-nums">₪{formatNumber(Math.round(calculations.monthlyMortgage))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Arnona</span>
                    <span className="tabular-nums">₪{formatNumber(Math.round(calculations.monthlyArnona))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Va'ad + Ins.</span>
                    <span className="tabular-nums">₪{formatNumber(Math.round(calculations.monthlyVaadBayit + calculations.monthlyInsurance))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maintenance</span>
                    <span className="tabular-nums">₪{formatNumber(Math.round(calculations.monthlyMaintenance))}</span>
                  </div>
                </div>
              </div>
              
              {/* Renting */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Renting {rooms}rm{selectedCity ? ` · ${cities?.find(c => c.slug === selectedCity)?.name}` : ''}
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rent</span>
                    <span className="tabular-nums">₪{formatNumber(Math.round(calculations.currentMonthlyRent))}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Equity insight */}
            <div className="mt-4 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                {calculations.totalMonthlyBuying > calculations.currentMonthlyRent ? (
                  <>~₪{formatNumber(Math.round(calculations.monthlyEquityBuilding))} of your mortgage payment builds equity you keep.</>
                ) : (
                  <>Buying costs less monthly AND builds ₪{formatNumber(Math.round(calculations.monthlyEquityBuilding))} equity/mo.</>
                )}
              </p>
            </div>
          </div>
          
          {/* LONG GAME: After X Years */}
          <div className="px-6 py-5 border-t border-border">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">After {timeHorizon} Years</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-muted/40 rounded-lg">
                <p className="text-xl font-bold tabular-nums">₪{formatNumber(Math.round(calculations.equityBuilt))}</p>
                <p className="text-xs text-muted-foreground mt-0.5">equity if you buy</p>
              </div>
              <div className="text-center p-3 bg-muted/40 rounded-lg">
                <p className="text-xl font-bold tabular-nums">
                  {calculations.netRentingWealth >= 0 ? '₪' : '-₪'}{formatNumber(Math.abs(Math.round(calculations.netRentingWealth)))}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">net if you rent</p>
              </div>
            </div>
            
            <div className="text-center text-sm">
              <span className={calculations.buyingIsBetter ? 'text-success' : 'text-primary'}>
                {calculations.buyingIsBetter 
                  ? `Buying builds ₪${formatNumber(Math.round(calculations.wealthDifference))} more`
                  : `Renting saves ₪${formatNumber(Math.round(calculations.wealthDifference))}`}
              </span>
              {calculations.breakEvenYear && (
                <span className="text-muted-foreground ml-1">
                  · break-even ~{calculations.breakEvenYear}yr
                </span>
              )}
            </div>
          </div>
          
          {/* KEY INSIGHT */}
          <div className="px-6 py-5 border-t border-border bg-muted/30">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-primary/10 shrink-0">
                <Lightbulb className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {calculations.breakEvenYear && calculations.breakEvenYear <= timeHorizon ? (
                  timeHorizon >= 10 ? (
                    `With a ${timeHorizon}-year horizon, buying builds significant equity. After break-even at ~${calculations.breakEvenYear} years, you're growing wealth faster.`
                  ) : (
                    `You reach break-even in ~${calculations.breakEvenYear} years. If staying that long, buying is likely the stronger path.`
                  )
                ) : calculations.breakEvenYear && calculations.breakEvenYear > timeHorizon ? (
                  `At ${timeHorizon} years, renting still wins financially. Consider buying if you'll stay ${calculations.breakEvenYear}+ years.`
                ) : calculations.buyingIsBetter ? (
                  `Given your inputs, buying builds more wealth at every point. Strong financial choice if you have the down payment.`
                ) : (
                  `Renting provides flexibility here. Invest your would-be down payment and still come out ahead over ${timeHorizon} years.`
                )}
              </p>
            </div>
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
      {/* Pros & Cons Section - Cleaner without heavy cards */}
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
      
      {/* Detailed Breakdown - Lighter styling, no heavy card */}
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
                  <span className="tabular-nums">₪{formatNumber(Math.round(calculations.downPayment))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Tax</span>
                  <span className="tabular-nums">₪{formatNumber(Math.round(calculations.purchaseTax))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Legal & agent fees</span>
                  <span className="tabular-nums">₪{formatNumber(Math.round(calculations.lawyerFee + calculations.agentFee))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mortgage payments</span>
                  <span className="tabular-nums">₪{formatNumber(Math.round(calculations.totalMortgagePayments))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Running costs</span>
                  <span className="tabular-nums">₪{formatNumber(Math.round(calculations.totalOwnershipCosts))}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span>Total spent</span>
                  <span className="tabular-nums font-medium">₪{formatNumber(Math.round(calculations.totalBuyingCost))}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Appreciation gain</span>
                  <span className="tabular-nums">+₪{formatNumber(Math.round(calculations.appreciation))}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-border/50">
                  <span>Net equity</span>
                  <span className="text-success tabular-nums">₪{formatNumber(Math.round(calculations.equityBuilt))}</span>
                </div>
              </div>
              
              {/* Renting Breakdown */}
              <div className="space-y-2 text-sm">
                <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-2">If You Rent</h4>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rent (Year 1)</span>
                  <span className="tabular-nums">₪{formatNumber(Math.round(calculations.currentMonthlyRent))}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rent (Year {timeHorizon})</span>
                  <span className="tabular-nums">₪{formatNumber(Math.round(calculations.finalYearRent))}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total housing cost</span>
                  <span className="tabular-nums">₪{formatNumber(Math.round(calculations.totalRentPaid))}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cash kept</span>
                  <span className="tabular-nums">₪{formatNumber(Math.round(calculations.totalCashNotSpent))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investment growth</span>
                  <span className="tabular-nums">+₪{formatNumber(Math.round(calculations.investmentGains))}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-border/50">
                  <span>Net position</span>
                  <span className="tabular-nums">
                    {calculations.netRentingWealth >= 0 ? '₪' : '-₪'}{formatNumber(Math.abs(Math.round(calculations.netRentingWealth)))}
                  </span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
      
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
      subtitle="Compare the true cost of renting versus buying in Israel—finances AND lifestyle"
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
