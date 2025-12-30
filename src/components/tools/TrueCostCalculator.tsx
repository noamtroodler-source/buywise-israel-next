import { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Calculator, 
  Home, 
  TrendingUp, 
  Info, 
  Save, 
  Lightbulb, 
  MapPin,
  ChevronDown,
  RotateCcw,
  Building2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { 
  ToolLayout, 
  ToolDisclaimer, 
  ToolFeedback, 
  CashBreakdownTable,
} from './shared';
import { 
  calculateOlehEligibility,
} from '@/lib/calculations/purchaseTax';
import { 
  calculateMonthlyCosts,
  calculateNewConstructionLinkage 
} from '@/lib/calculations/purchaseCosts';
import { calculatePurchaseTax as calcTax, getBuyerCategoryLabel } from '@/hooks/useBuyerProfile';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { useCities } from '@/hooks/useCities';
import { useCanonicalMetrics } from '@/hooks/useCanonicalMetrics';
import { usePreferences } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'buywise_true_cost_inputs';
const STORAGE_EXPIRY_DAYS = 7;

// Buyer category type for this calculator
type BuyerCategory = 'first_time' | 'oleh' | 'additional' | 'non_resident';

// Furniture cost estimates by level (in ILS)
const FURNITURE_COSTS = {
  basic: 30000,
  standard: 60000,
  premium: 120000,
};

const MOVING_COST_ESTIMATE = 8000;

// Fee estimates (as percentages or fixed amounts)
const FEES = {
  lawyerRate: 0.005, // 0.5% of price
  lawyerMinimum: 5000,
  agentRate: 0.02, // 2% + VAT
  vatRate: 0.17,
  developerLawyerRate: 0.015, // 1.5%
  bankGuaranteeRate: 0.005, // 0.5%
  appraisalFee: 2500,
  mortgageRegistration: 1500,
  bankFees: 2000,
  tabuRegistration: 1200,
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

export function TrueCostCalculator() {
  const { data: buyerProfile } = useBuyerProfile();
  const { data: cities } = useCities();
  const { currency } = usePreferences();
  
  // Format price helper
  const formatPrice = (value: number) => `₪${formatNumber(value)}`;

  // Core inputs
  const [propertyPrice, setPropertyPrice] = useState('2500000');
  const [propertySize, setPropertySize] = useState('85');
  const [selectedCity, setSelectedCity] = useState('');
  
  // Fetch canonical metrics for selected city
  const { data: cityMetrics } = useCanonicalMetrics(selectedCity);
  
  // Calculate suggested price based on city metrics
  const suggestedPrice = useMemo(() => {
    if (!cityMetrics || !propertySize) return null;
    const size = parseFormattedNumber(propertySize);
    if (size <= 0) return null;
    
    // Use average price per sqm if available
    if (cityMetrics.average_price_sqm) {
      return Math.round(size * cityMetrics.average_price_sqm);
    }
    return null;
  }, [cityMetrics, propertySize]);
  
  // Calculate price comparison to median
  const priceComparison = useMemo(() => {
    if (!cityMetrics?.median_apartment_price || !propertyPrice) return null;
    const price = parseFormattedNumber(propertyPrice);
    if (price <= 0) return null;
    
    const median = cityMetrics.median_apartment_price;
    const diff = ((price - median) / median) * 100;
    return {
      percentDiff: Math.abs(diff).toFixed(0),
      isAbove: diff > 0,
      isBelow: diff < 0,
      median,
    };
  }, [cityMetrics?.median_apartment_price, propertyPrice]);
  
  const handleUseEstimate = useCallback(() => {
    if (suggestedPrice) {
      setPropertyPrice(String(suggestedPrice));
    }
  }, [suggestedPrice]);

  
  // Buyer profile
  const [buyerCategory, setBuyerCategory] = useState<BuyerCategory>('first_time');
  const [aliyahYear, setAliyahYear] = useState('');
  
  // Purchase type
  const [isNewConstruction, setIsNewConstruction] = useState(false);
  const [constructionMonths, setConstructionMonths] = useState('24');
  
  // Advanced options
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [includeAgentFee, setIncludeAgentFee] = useState(true);
  const [includeMortgageCosts, setIncludeMortgageCosts] = useState(false);
  const [loanAmount, setLoanAmount] = useState('1500000');
  const [includeMoving, setIncludeMoving] = useState(false);
  const [includeFurniture, setIncludeFurniture] = useState(false);
  const [furnitureLevel, setFurnitureLevel] = useState<'basic' | 'standard' | 'premium'>('standard');

  // Load saved inputs on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { data, timestamp } = JSON.parse(saved);
        const daysSaved = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        if (daysSaved < STORAGE_EXPIRY_DAYS) {
          setPropertyPrice(data.propertyPrice || '2500000');
          setPropertySize(data.propertySize || '85');
          setSelectedCity(data.selectedCity || '');
          setBuyerCategory(data.buyerCategory || 'first_time');
          setAliyahYear(data.aliyahYear || '');
          setIsNewConstruction(data.isNewConstruction || false);
          setConstructionMonths(data.constructionMonths || '24');
          setIncludeAgentFee(data.includeAgentFee ?? true);
          setIncludeMortgageCosts(data.includeMortgageCosts || false);
          setLoanAmount(data.loanAmount || '1500000');
          setIncludeMoving(data.includeMoving || false);
          setIncludeFurniture(data.includeFurniture || false);
          setFurnitureLevel(data.furnitureLevel || 'standard');
        }
      } catch (e) {
        console.error('Failed to load saved inputs:', e);
      }
    }
  }, []);

  // Auto-populate from buyer profile
  useEffect(() => {
    if (buyerProfile) {
      if (buyerProfile.residency_status === 'oleh_hadash' && buyerProfile.aliyah_year) {
        if (calculateOlehEligibility(buyerProfile.aliyah_year)) {
          setBuyerCategory('oleh');
          setAliyahYear(String(buyerProfile.aliyah_year));
        } else if (buyerProfile.is_first_property) {
          setBuyerCategory('first_time');
        }
      } else if (buyerProfile.is_first_property) {
        setBuyerCategory('first_time');
      } else if (buyerProfile.residency_status === 'non_resident') {
        setBuyerCategory('non_resident');
      } else {
        setBuyerCategory('additional');
      }
    }
  }, [buyerProfile]);

  const handleSave = useCallback(() => {
    const data = {
      propertyPrice,
      propertySize,
      selectedCity,
      buyerCategory,
      aliyahYear,
      isNewConstruction,
      constructionMonths,
      includeAgentFee,
      includeMortgageCosts,
      loanAmount,
      includeMoving,
      includeFurniture,
      furnitureLevel,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    toast.success('Inputs saved! They\'ll be here when you return.');
  }, [propertyPrice, propertySize, selectedCity, buyerCategory, aliyahYear, isNewConstruction, constructionMonths, includeAgentFee, includeMortgageCosts, loanAmount, includeMoving, includeFurniture, furnitureLevel]);

  const handleReset = useCallback(() => {
    setPropertyPrice('2500000');
    setPropertySize('85');
    setSelectedCity('');
    setBuyerCategory('first_time');
    setAliyahYear('');
    setIsNewConstruction(false);
    setConstructionMonths('24');
    setIncludeAgentFee(true);
    setIncludeMortgageCosts(false);
    setLoanAmount('1500000');
    setIncludeMoving(false);
    setIncludeFurniture(false);
    setFurnitureLevel('standard');
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Reset to defaults');
  }, []);

  // Calculate costs
  const calculations = useMemo(() => {
    const price = parseFormattedNumber(propertyPrice);
    const size = parseFormattedNumber(propertySize);
    const months = parseInt(constructionMonths) || 24;

    // Purchase tax calculation
    const purchaseTax = calcTax(price, buyerCategory);
    const effectiveTaxRate = price > 0 ? (purchaseTax / price) * 100 : 0;
    
    // Investor tax for savings comparison
    const investorTax = calcTax(price, 'additional');
    const taxSavings = investorTax - purchaseTax;

    // Calculate individual fees
    const lawyerFee = Math.max(price * FEES.lawyerRate, FEES.lawyerMinimum) * (1 + FEES.vatRate);
    const agentFee = includeAgentFee && !isNewConstruction 
      ? price * FEES.agentRate * (1 + FEES.vatRate) 
      : 0;
    const developerLawyerFee = isNewConstruction ? price * FEES.developerLawyerRate * (1 + FEES.vatRate) : 0;
    const bankGuaranteeFee = isNewConstruction ? price * FEES.bankGuaranteeRate : 0;

    // New construction linkage (Madad)
    let madadCost = 0;
    if (isNewConstruction && months > 0) {
      const linkageResult = calculateNewConstructionLinkage(price, months, 0.03);
      madadCost = linkageResult.linkageAmount;
    }

    // Mortgage costs
    const mortgageCosts = includeMortgageCosts 
      ? FEES.appraisalFee + FEES.mortgageRegistration + FEES.bankFees 
      : 0;

    // Optional costs
    const movingCost = includeMoving ? MOVING_COST_ESTIMATE : 0;
    const furnitureCost = includeFurniture ? FURNITURE_COSTS[furnitureLevel] : 0;

    // Monthly costs
    const cityData = cities?.find(c => c.slug === selectedCity);
    const monthlyCosts = calculateMonthlyCosts(size, cityData?.name);

    // Sum all costs above property price
    const allCostsAbovePrice = purchaseTax + lawyerFee + agentFee + developerLawyerFee + 
      bankGuaranteeFee + madadCost + mortgageCosts + FEES.tabuRegistration + movingCost + furnitureCost;
    
    const totalOneTime = price + allCostsAbovePrice;
    const percentAbovePrice = price > 0 ? (allCostsAbovePrice / price) * 100 : 0;

    return {
      price,
      size,
      purchaseTax,
      effectiveTaxRate,
      taxSavings,
      lawyerFee,
      agentFee,
      developerLawyerFee,
      bankGuaranteeFee,
      madadCost,
      mortgageCosts,
      tabuRegistration: FEES.tabuRegistration,
      movingCost,
      furnitureCost,
      monthlyCosts,
      totalOneTime,
      allCostsAbovePrice,
      percentAbovePrice,
      cityName: cities?.find(c => c.slug === selectedCity)?.name,
    };
  }, [propertyPrice, propertySize, selectedCity, buyerCategory, isNewConstruction, constructionMonths, includeAgentFee, includeMortgageCosts, loanAmount, includeMoving, includeFurniture, furnitureLevel, cities]);

  // Build cost breakdown items for CashBreakdownTable
  const breakdownItems = useMemo(() => {
    const items: Array<{
      label: string;
      value: string;
      percentage?: string;
      tooltip?: string;
      isSeparator?: boolean;
      isTotal?: boolean;
      highlight?: 'positive' | 'negative' | 'neutral';
    }> = [
      {
        label: 'Property Price',
        value: formatPrice(calculations.price),
      },
      { isSeparator: true, label: '', value: '' },
      {
        label: 'Purchase Tax (מס רכישה)',
        value: formatPrice(Math.round(calculations.purchaseTax)),
        percentage: calculations.effectiveTaxRate.toFixed(2) + '%',
        tooltip: `Based on ${getBuyerCategoryLabel(buyerCategory)} tax brackets`,
      },
      {
        label: 'Lawyer Fees (שכ"ט עו"ד)',
        value: formatPrice(Math.round(calculations.lawyerFee)),
        tooltip: '0.5% of property price + VAT',
      },
    ];

    // Agent commission (resale only)
    if (calculations.agentFee > 0) {
      items.push({
        label: 'Agent Commission (עמלת תיווך)',
        value: formatPrice(Math.round(calculations.agentFee)),
        tooltip: '2% of property price + VAT',
      });
    }

    // New construction specific
    if (isNewConstruction) {
      if (calculations.developerLawyerFee > 0) {
        items.push({
          label: 'Developer Lawyer (עו"ד קבלן)',
          value: formatPrice(Math.round(calculations.developerLawyerFee)),
          tooltip: "Legal fees paid to developer's attorney",
        });
      }

      if (calculations.bankGuaranteeFee > 0) {
        items.push({
          label: 'Bank Guarantee (ערבות בנקאית)',
          value: formatPrice(Math.round(calculations.bankGuaranteeFee)),
          tooltip: 'Required guarantee for off-plan purchases',
        });
      }

      if (calculations.madadCost > 0) {
        items.push({
          label: 'Index Linkage (הצמדה למדד)',
          value: formatPrice(Math.round(calculations.madadCost)),
          tooltip: 'Estimated price increase linked to construction cost index',
          highlight: 'negative',
        });
      }
    }

    // Mortgage costs
    if (calculations.mortgageCosts > 0) {
      items.push({
        label: 'Mortgage Fees (Appraisal, Registration)',
        value: formatPrice(Math.round(calculations.mortgageCosts)),
        tooltip: 'Includes appraisal, registration, and bank fees',
      });
    }

    // Registration
    items.push({
      label: 'Tabu Registration (רישום בטאבו)',
      value: formatPrice(calculations.tabuRegistration),
    });

    // Optional extras
    if (calculations.movingCost > 0) {
      items.push({
        label: 'Moving Costs',
        value: formatPrice(calculations.movingCost),
      });
    }

    if (calculations.furnitureCost > 0) {
      items.push({
        label: `Furniture (${furnitureLevel})`,
        value: formatPrice(calculations.furnitureCost),
      });
    }

    // Separator before total
    items.push({ isSeparator: true, label: '', value: '' });

    // Total
    items.push({
      label: 'Total One-Time Costs',
      value: formatPrice(Math.round(calculations.totalOneTime)),
      isTotal: true,
    });

    return items;
  }, [calculations, buyerCategory, isNewConstruction, furnitureLevel, formatPrice]);

  // Monthly costs breakdown
  const monthlyItems = useMemo(() => {
    const insuranceEstimate = 150;
    return [
      {
        label: 'Arnona (ארנונה)',
        value: formatPrice(Math.round(calculations.monthlyCosts.arnona)),
        tooltip: selectedCity ? 'Based on selected city rates' : 'Average estimate - select city for accuracy',
      },
      {
        label: "Va'ad Bayit (ועד בית)",
        value: formatPrice(Math.round(calculations.monthlyCosts.vaadBayit)),
        tooltip: 'Building maintenance committee fees',
      },
      {
        label: 'Home Insurance',
        value: formatPrice(insuranceEstimate),
      },
      { isSeparator: true, label: '', value: '' },
      {
        label: 'Est. Monthly Total',
        value: formatPrice(Math.round(calculations.monthlyCosts.arnona + calculations.monthlyCosts.vaadBayit + insuranceEstimate)),
        isTotal: true,
      },
    ];
  }, [calculations.monthlyCosts, selectedCity, formatPrice]);

  // Left column - inputs
  const leftColumn = (
    <Card className="p-6 shadow-sm">
      <div className="space-y-6">
        {/* Property Details Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            Property Details
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center text-sm font-medium">
                Property Price
                <InfoTooltip content="Enter the full purchase price in Israeli Shekels" />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span>
                <Input
                  id="price"
                  type="text"
                  value={formatNumber(parseFormattedNumber(propertyPrice))}
                  onChange={(e) => setPropertyPrice(e.target.value.replace(/[^\d]/g, ''))}
                  className="h-11 pl-8"
                />
              </div>
              
              {/* City-based price intelligence */}
              {selectedCity && cityMetrics && (
                <div className="space-y-1.5">
                  {/* Suggested price based on city avg/sqm */}
                  {suggestedPrice && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
                      <span>
                        {cities?.find(c => c.slug === selectedCity)?.name} avg: ₪{formatNumber(cityMetrics.average_price_sqm || 0)}/sqm → ₪{formatNumber(suggestedPrice)}
                      </span>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 text-xs text-primary hover:no-underline"
                        onClick={handleUseEstimate}
                      >
                        Use estimate
                      </Button>
                    </div>
                  )}
                  
                  {/* Price comparison to median */}
                  {priceComparison && Math.abs(parseFloat(priceComparison.percentDiff)) > 5 && (
                    <p className={cn(
                      "text-xs px-2.5",
                      priceComparison.isAbove ? "text-amber-600" : "text-emerald-600"
                    )}>
                      {priceComparison.percentDiff}% {priceComparison.isAbove ? 'above' : 'below'} city median (₪{formatNumber(priceComparison.median)})
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size" className="text-sm font-medium">
                  Size (sqm)
                </Label>
                <Input
                  id="size"
                  type="number"
                  value={propertySize}
                  onChange={(e) => setPropertySize(e.target.value)}
                  min={20}
                  max={500}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  City
                </Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger id="city" className="h-11">
                    <SelectValue placeholder="Select city" />
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
            </div>
          </div>
        </div>

        <Separator />

        {/* Buyer Profile Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Buyer Profile
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="buyerType" className="flex items-center text-sm font-medium">
              Buyer Type
              <InfoTooltip content="Your buyer status determines your purchase tax rate. First-time buyers and Olim pay significantly less." />
            </Label>
            <Select value={buyerCategory} onValueChange={(v) => setBuyerCategory(v as BuyerCategory)}>
              <SelectTrigger id="buyerType" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_time">First-Time Buyer (דירה יחידה)</SelectItem>
                <SelectItem value="oleh">Oleh Hadash (עולה חדש)</SelectItem>
                <SelectItem value="additional">Additional Property (דירה נוספת)</SelectItem>
                <SelectItem value="non_resident">Foreign Resident (תושב חוץ)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {buyerCategory === 'oleh' && (
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <Label htmlFor="aliyahYear" className="text-sm font-medium">
                Year of Aliyah
              </Label>
              <Input
                id="aliyahYear"
                type="number"
                value={aliyahYear}
                onChange={(e) => setAliyahYear(e.target.value)}
                placeholder="e.g., 2022"
                min={2000}
                max={new Date().getFullYear()}
                className="h-11"
              />
              {aliyahYear && !calculateOlehEligibility(parseInt(aliyahYear)) && (
                <p className="text-xs text-destructive">
                  Oleh benefits expire 7 years after Aliyah
                </p>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Purchase Type Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Purchase Type
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="newConstruction" className="text-sm font-medium">
                New Construction
              </Label>
              <p className="text-xs text-muted-foreground">
                Includes developer fees & index linkage
              </p>
            </div>
            <Switch
              id="newConstruction"
              checked={isNewConstruction}
              onCheckedChange={setIsNewConstruction}
            />
          </div>

          {isNewConstruction && (
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label htmlFor="constructionMonths" className="flex items-center text-sm font-medium">
                  Construction Period (months)
                  <InfoTooltip content="Estimated time until delivery. Affects index linkage calculation." />
                </Label>
                <Input
                  id="constructionMonths"
                  type="number"
                  value={constructionMonths}
                  onChange={(e) => setConstructionMonths(e.target.value)}
                  min={6}
                  max={60}
                  className="h-11"
                />
              </div>
              <Alert className="bg-amber-500/10 border-amber-500/30">
                <Building2 className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-700 dark:text-amber-400">
                  New construction prices are linked to the building cost index. The final price may be 3-8% higher.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <Separator />

        {/* Advanced Options */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span>Advanced Options</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")} />
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 pt-4">
            {!isNewConstruction && (
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Include Agent Fee</Label>
                  <p className="text-xs text-muted-foreground">2% + VAT commission</p>
                </div>
                <Switch
                  checked={includeAgentFee}
                  onCheckedChange={setIncludeAgentFee}
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Include Mortgage Costs</Label>
                  <p className="text-xs text-muted-foreground">Appraisal & registration fees</p>
                </div>
                <Switch
                  checked={includeMortgageCosts}
                  onCheckedChange={setIncludeMortgageCosts}
                />
              </div>
              
              {includeMortgageCosts && (
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  <Label htmlFor="loanAmount" className="text-sm font-medium">
                    Loan Amount
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span>
                    <Input
                      id="loanAmount"
                      type="text"
                      value={formatNumber(parseFormattedNumber(loanAmount))}
                      onChange={(e) => setLoanAmount(e.target.value.replace(/[^\d]/g, ''))}
                      className="h-11 pl-8"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Include Moving Costs</Label>
                <p className="text-xs text-muted-foreground">~{formatPrice(MOVING_COST_ESTIMATE)} estimate</p>
              </div>
              <Switch
                checked={includeMoving}
                onCheckedChange={setIncludeMoving}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Include Furniture</Label>
                  <p className="text-xs text-muted-foreground">Furnishing your new home</p>
                </div>
                <Switch
                  checked={includeFurniture}
                  onCheckedChange={setIncludeFurniture}
                />
              </div>
              
              {includeFurniture && (
                <div className="pl-4 border-l-2 border-primary/20">
                  <Select value={furnitureLevel} onValueChange={(v) => setFurnitureLevel(v as typeof furnitureLevel)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic ({formatPrice(FURNITURE_COSTS.basic)})</SelectItem>
                      <SelectItem value="standard">Standard ({formatPrice(FURNITURE_COSTS.standard)})</SelectItem>
                      <SelectItem value="premium">Premium ({formatPrice(FURNITURE_COSTS.premium)})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Reset Button */}
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-1.5"
            onClick={handleReset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to defaults
          </Button>
        </div>
      </div>
    </Card>
  );

  // Right column - results
  const rightColumn = (
    <Card className="p-6 shadow-sm border-t-4 border-t-primary">
      <div className="space-y-6">
        {/* Hero Result */}
        <div className="text-center pb-5 border-b border-border">
          <p className="text-sm text-muted-foreground mb-1">Total One-Time Costs</p>
          <p className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent tracking-tight">
            {formatPrice(Math.round(calculations.totalOneTime))}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            +{formatPrice(Math.round(calculations.allCostsAbovePrice))} ({calculations.percentAbovePrice.toFixed(1)}%) above property price
          </p>
        </div>

        {/* Tax Savings Alert */}
        {calculations.taxSavings > 0 && buyerCategory !== 'additional' && buyerCategory !== 'non_resident' && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <Lightbulb className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              As a {getBuyerCategoryLabel(buyerCategory).toLowerCase()}, you save{' '}
              <span className="font-semibold">{formatPrice(Math.round(calculations.taxSavings))}</span>{' '}
              on purchase tax compared to investor rates.
            </AlertDescription>
          </Alert>
        )}

        {/* Cost Breakdown */}
        <div>
          <h4 className="font-semibold text-foreground mb-3">Cost Breakdown</h4>
          <CashBreakdownTable items={breakdownItems} />
        </div>

        <Separator />

        {/* Monthly Costs */}
        <div>
          <h4 className="font-semibold text-foreground mb-1">Estimated Monthly Costs</h4>
          <p className="text-xs text-muted-foreground mb-3">
            {calculations.cityName ? `Based on ${calculations.cityName} averages` : 'Select a city for accurate estimates'}
          </p>
          <CashBreakdownTable items={monthlyItems} />
        </div>
      </div>
    </Card>
  );

  // Bottom section - navigation cards
  const bottomSection = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          to="/tools?tool=mortgage"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calculator className="h-5 w-5" />
            </div>
            <p className="font-semibold">Plan Your Financing</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Calculate monthly mortgage payments
          </p>
        </Link>

        <Link 
          to="/tools?tool=affordability"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="font-semibold">Check Affordability</p>
          </div>
          <p className="text-sm text-muted-foreground">
            See your maximum budget
          </p>
        </Link>

        <Link 
          to="/listings"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <p className="font-semibold">Browse Properties</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Find properties in your range
          </p>
        </Link>
      </div>

      <ToolFeedback toolName="True Cost Calculator" variant="inline" />
    </div>
  );

  return (
    <ToolLayout
      title="True Cost Calculator"
      subtitle="See the complete cost of buying property in Israel — beyond just the price"
      icon={<Calculator className="h-6 w-6 text-primary" />}
      headerActions={
        <Button variant="outline" size="sm" onClick={handleSave} className="gap-1.5">
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">Save</span>
        </Button>
      }
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      bottomSection={bottomSection}
      disclaimer={
        <ToolDisclaimer 
          text="These estimates are based on current market rates and may vary. Consult with a lawyer and accountant for precise figures. Tax brackets are updated annually by the Israel Tax Authority."
        />
      }
    />
  );
}

export default TrueCostCalculator;
