// True Cost Calculator - Unified Side-by-Side Layout for BuyWise Israel
import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, 
  Home, 
  TrendingUp, 
  Info, 
  Save, 
  Lightbulb, 
  MapPin,
  RotateCcw,
  Building2,
  Loader2,
  ChevronDown,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSaveCalculatorResult } from '@/hooks/useSavedCalculatorResults';
import { 
  ToolLayout, 
  ToolDisclaimer, 
  ToolFeedback, 
  InsightCard,
  BuyerTypeInfoBanner,
  SourceAttribution,
  ExampleValuesHint,
  ToolPropertySuggestions,
  ToolGuidanceHint,
  type BuyerCategory as SharedBuyerCategory,
} from './shared';

import { 
  calculateOlehEligibility,
} from '@/lib/calculations/purchaseTax';
import { 
  calculateMonthlyCosts,
  calculateNewConstructionLinkage 
} from '@/lib/calculations/purchaseCosts';
import { getBuyerCategoryLabel, getBuyerTaxCategory, useBuyerProfile } from '@/hooks/useBuyerProfile';
import { calculateTaxAmount, BuyerType } from '@/lib/calculations/purchaseTax';
import { BuyerCategory as BannerBuyerCategory } from './shared/BuyerTypeInfoBanner';
import { useCities } from '@/hooks/useCities';
import { useCanonicalMetrics } from '@/hooks/useCanonicalMetrics';
import { usePreferences, useFormatPrice, useFormatArea, useCurrencySymbol, useAreaUnitLabel } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';

// Map BuyerCategory to BuyerType for tax calculations
function mapCategoryToBuyerType(category: BannerBuyerCategory): BuyerType {
  const mapping: Partial<Record<BannerBuyerCategory, BuyerType>> = {
    'first_time': 'first_time',
    'oleh': 'oleh',
    'upgrader': 'upgrader',
    'investor': 'investor',
    'foreign': 'foreign',
    'company': 'company',
  };
  return mapping[category] || 'first_time';
}

const STORAGE_KEY = 'buywise_true_cost_inputs';

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
  vatRate: 0.18, // Updated to 18% as of Jan 2025
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

// Helper component for info tooltips - matching Mortgage Calculator style
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

export function TrueCostCalculator() {
  const { data: buyerProfile } = useBuyerProfile();
  const { data: cities } = useCities();
  const { areaUnit } = usePreferences();
  const formatPrice = useFormatPrice();
  const currencySymbol = useCurrencySymbol();
  const areaUnitLabel = useAreaUnitLabel();
  const { user } = useAuth();
  const saveToProfile = useSaveCalculatorResult();

  // Core inputs
  const [propertyPrice, setPropertyPrice] = useState('2750000');
  const [propertySize, setPropertySize] = useState('80');
  const [selectedCity, setSelectedCity] = useState('');
  
  // Fetch canonical metrics for selected city
  const { data: cityMetrics } = useCanonicalMetrics(selectedCity);
  
  // Calculate suggested price based on city metrics
  const suggestedPrice = useMemo(() => {
    if (!cityMetrics || !propertySize) return null;
    const size = parseFormattedNumber(propertySize);
    if (size <= 0) return null;
    
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
  const [includeAgentFee, setIncludeAgentFee] = useState(true);
  const [includeMortgageCosts, setIncludeMortgageCosts] = useState(false);
  const [loanAmount, setLoanAmount] = useState('1500000');
  const [includeMoving, setIncludeMoving] = useState(false);
  const [includeFurniture, setIncludeFurniture] = useState(false);
  const [furnitureLevel, setFurnitureLevel] = useState<'basic' | 'standard' | 'premium'>('standard');
  const [includeRenovation, setIncludeRenovation] = useState(false);
  const [renovationAmount, setRenovationAmount] = useState('100000');
  
  // UI State
  const [isCostsInfoOpen, setIsCostsInfoOpen] = useState(false);

  // Load saved inputs on mount from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setPropertyPrice(data.propertyPrice || '2750000');
        setPropertySize(data.propertySize || '80');
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

  const handleReset = useCallback(() => {
    setPropertyPrice('2750000');
    setPropertySize('80');
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
    setIncludeRenovation(false);
    setRenovationAmount('100000');
    sessionStorage.removeItem(STORAGE_KEY);
    toast.success('Reset complete', { description: 'All values restored to defaults' });
  }, []);

  // Calculate costs
  const calculations = useMemo(() => {
    const price = parseFormattedNumber(propertyPrice);
    const size = parseFormattedNumber(propertySize);
    const months = parseInt(constructionMonths) || 24;

    // Purchase tax calculation
    const purchaseTax = calculateTaxAmount(price, mapCategoryToBuyerType(buyerCategory));
    const effectiveTaxRate = price > 0 ? (purchaseTax / price) * 100 : 0;
    
    // Investor tax for savings comparison
    const investorTax = calculateTaxAmount(price, 'investor');
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
    const renovationCost = includeRenovation ? parseFormattedNumber(renovationAmount) : 0;

    // Monthly costs
    const cityData = cities?.find(c => c.slug === selectedCity);
    const monthlyCosts = calculateMonthlyCosts(size, cityData?.name);

    // Sum all costs above property price
    const allCostsAbovePrice = purchaseTax + lawyerFee + agentFee + developerLawyerFee + 
      bankGuaranteeFee + madadCost + mortgageCosts + FEES.tabuRegistration + movingCost + furnitureCost + renovationCost;
    
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
      renovationCost,
      monthlyCosts,
      totalOneTime,
      allCostsAbovePrice,
      percentAbovePrice,
      cityName: cities?.find(c => c.slug === selectedCity)?.name,
      isNewConstruction,
    };
  }, [propertyPrice, propertySize, selectedCity, buyerCategory, isNewConstruction, constructionMonths, includeAgentFee, includeMortgageCosts, loanAmount, includeMoving, includeFurniture, furnitureLevel, includeRenovation, renovationAmount, cities]);

  // Generate personalized insights
  const trueCostInsights = useMemo(() => {
    const messages: string[] = [];
    const overheadPercent = calculations.percentAbovePrice;
    const taxSavings = calculations.taxSavings;
    const price = calculations.price;
    
    // Day-one cash summary — the most important number
    const ltvRate = buyerCategory === 'non_resident' ? 0.50 : buyerCategory === 'additional' ? 0.70 : 0.75;
    const dayOneCash = calculations.allCostsAbovePrice + (price * (1 - ltvRate));
    messages.push(`You'll need roughly ${formatPrice(Math.round(dayOneCash))} in cash before getting the keys — that's your down payment plus all closing costs.`);
    
    // Overhead context
    if (overheadPercent > 10) {
      messages.push(`Costs above the listing price total ${overheadPercent.toFixed(0)}% — higher than average. Review each line item for savings.`);
    } else if (overheadPercent < 7) {
      messages.push(`At ${overheadPercent.toFixed(0)}% overhead, your costs are lean for an Israeli purchase.`);
    }
    
    // Agent fee negotiation tip (only when agent fee is significant)
    if (calculations.agentFee > 30000) {
      const halfPercentSaving = Math.round(price * 0.005 * 1.18);
      messages.push(`Agent fees are negotiable — even 0.5% less saves you ${formatPrice(halfPercentSaving)}.`);
    }
    
    // Tax savings (only if not already at 3)
    if (messages.length < 3 && taxSavings > 50000 && (buyerCategory === 'first_time' || buyerCategory === 'oleh')) {
      messages.push(`As a ${buyerCategory === 'oleh' ? 'new Oleh' : 'first-time buyer'}, you're saving ${formatPrice(Math.round(taxSavings))} in purchase tax vs. investor rates.`);
    }
    
    // Madad (only if not already at 3)
    if (messages.length < 3 && isNewConstruction && calculations.madadCost > 0) {
      messages.push(`Construction index linkage adds ${formatPrice(Math.round(calculations.madadCost))} to your final price — factor this into your budget now.`);
    }
    
    return messages.slice(0, 3);
  }, [calculations, buyerCategory, isNewConstruction, formatPrice]);

  // Save inputs
  const handleSave = () => {
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
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    if (user) {
      saveToProfile.mutate({
        calculatorType: 'truecost',
        inputs: data,
        results: {
          totalCost: calculations.totalOneTime,
          purchaseTax: calculations.purchaseTax,
          allCostsAbovePrice: calculations.allCostsAbovePrice,
          percentAbovePrice: calculations.percentAbovePrice,
          lawyerFee: calculations.lawyerFee,
          agentFee: calculations.agentFee,
        },
      });
    } else {
      toast.success('Inputs saved!', { description: 'Sign in to save to your profile.' });
    }
  };

  // Calculate visual breakdown percentages
  const propertyPercent = useMemo(() => {
    if (calculations.totalOneTime <= 0) return 80;
    return Math.round((calculations.price / calculations.totalOneTime) * 100);
  }, [calculations.price, calculations.totalOneTime]);
  
  const costsPercent = 100 - propertyPercent;

  // Header Actions - matching Mortgage Calculator style
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

  // Left column - inputs (Multiple Cards matching Mortgage Calculator)
  const leftColumn = (
    <div className="space-y-4">
      <ExampleValuesHint />
      {/* Property Details Card */}
      <Card>
        <CardContent className="p-5 space-y-5">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Property Details</h3>
          
          {/* Property Price */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label className="text-sm font-medium">Property Price</Label>
              <InfoTooltip content="Enter the full purchase price in Israeli Shekels. This is the listing price you're negotiating from." />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currencySymbol}</span>
              <Input
                type="text"
                inputMode="numeric"
                value={formatNumber(parseFormattedNumber(propertyPrice))}
                onChange={(e) => setPropertyPrice(e.target.value.replace(/[^\d]/g, ''))}
                className="pl-10 h-11 text-lg"
                placeholder="2,500,000"
              />
            </div>
            
            {/* City-based price intelligence */}
            {selectedCity && cityMetrics && (
              <div className="space-y-1.5">
                {suggestedPrice && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
                    <span>
                      {cities?.find(c => c.slug === selectedCity)?.name} avg: {formatPrice(cityMetrics.average_price_sqm || 0)}/{areaUnit === 'sqft' ? 'sqft' : 'sqm'} → {formatPrice(suggestedPrice)}
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
                
                {priceComparison && Math.abs(parseFloat(priceComparison.percentDiff)) > 5 && (
                  <p className={cn(
                    "text-xs px-2.5",
                    priceComparison.isAbove ? "text-semantic-amber-foreground" : "text-primary"
                  )}>
                    {priceComparison.percentDiff}% {priceComparison.isAbove ? 'above' : 'below'} city median ({formatPrice(priceComparison.median)})
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Size and City */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Label className="text-sm font-medium">Size ({areaUnitLabel})</Label>
                <InfoTooltip content="Property sizes in Israel vary by source: Tabu (net area), contractor listings (10-15% larger), and municipality calculations may all differ. The same apartment can show different sizes depending on the measurement standard used." />
              </div>
              <Input
                type="number"
                value={propertySize}
                onChange={(e) => setPropertySize(e.target.value)}
                placeholder="e.g., 85"
                min={20}
                max={500}
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">City</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-11">
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
        </CardContent>
      </Card>

      {/* Buyer Profile Card */}
      <Card>
        <CardContent className="p-5 space-y-5">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Buyer Profile</h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <Label className="text-sm font-medium">Buyer Type</Label>
              <InfoTooltip content="Your buyer status determines your purchase tax rate. First-time buyers and Olim pay significantly less." />
            </div>
            <Select value={buyerCategory} onValueChange={(v) => setBuyerCategory(v as BuyerCategory)}>
              <SelectTrigger className="h-11">
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
              <Label className="text-sm font-medium">Year of Aliyah</Label>
              <Input
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
        </CardContent>
      </Card>

      {/* Purchase Type Card */}
      <Card>
        <CardContent className="p-5 space-y-5">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Purchase Type</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">New Construction</Label>
              <p className="text-xs text-muted-foreground">
                Includes developer fees & index linkage
              </p>
            </div>
            <Switch
              checked={isNewConstruction}
              onCheckedChange={setIsNewConstruction}
            />
          </div>

          {isNewConstruction && (
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label className="text-sm font-medium">Construction Period (months)</Label>
                  <InfoTooltip content="Estimated time until delivery. Affects index linkage calculation." />
                </div>
                <Input
                  type="number"
                  value={constructionMonths}
                  onChange={(e) => setConstructionMonths(e.target.value)}
                  min={6}
                  max={60}
                  className="h-11"
                />
              </div>
              
              <Alert className="bg-blue-500/10 border-blue-500/30">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>VAT is included:</strong> Israeli developer prices already include 18% VAT.
                </AlertDescription>
              </Alert>
              <Alert className="bg-semantic-amber border-semantic-amber">
                <Building2 className="h-4 w-4 text-semantic-amber-foreground" />
                <AlertDescription className="text-sm text-semantic-amber-foreground">
                  Prices are linked to the building cost index (מדד). Final price may be 3-8% higher.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Options Card */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Advanced Options</h3>
          
          {/* Transaction Costs */}
          <Collapsible defaultOpen={includeMortgageCosts || (includeAgentFee && !isNewConstruction)}>
            <div className="rounded-lg border border-border/50 bg-muted/20">
              <CollapsibleTrigger className="w-full px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Transaction Costs</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-4">
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
                        <Label className="text-sm font-medium">Loan Amount</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currencySymbol}</span>
                          <Input
                            type="text"
                            value={formatNumber(parseFormattedNumber(loanAmount))}
                            onChange={(e) => setLoanAmount(e.target.value.replace(/[^\d]/g, ''))}
                            className="pl-10 h-11"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
          
          {/* Moving & Setup */}
          <Collapsible defaultOpen={includeMoving || includeFurniture || includeRenovation}>
            <div className="rounded-lg border border-border/50 bg-muted/20">
              <CollapsibleTrigger className="w-full px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Moving & Setup</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-4">
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

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Include Renovation</Label>
                        <p className="text-xs text-muted-foreground">Plan for property upgrades</p>
                      </div>
                      <Switch
                        checked={includeRenovation}
                        onCheckedChange={setIncludeRenovation}
                      />
                    </div>
                    
                    {includeRenovation && (
                      <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                        <div className="flex items-center">
                          <Label className="text-sm font-medium">Renovation Budget</Label>
                          <InfoTooltip content="Israeli properties often need upgrades. Budget ₪1,500-3,000/sqm for basic renovations." />
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currencySymbol}</span>
                          <Input
                            type="text"
                            value={formatNumber(parseFormattedNumber(renovationAmount))}
                            onChange={(e) => setRenovationAmount(e.target.value.replace(/[^\d]/g, ''))}
                            className="pl-10 h-11"
                          />
                        </div>
                        <Link 
                          to="/tools?tool=renovation" 
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Get a detailed estimate →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );

  // Right column - results (matching Mortgage Calculator pattern)
  const rightColumn = (
    <Card className="overflow-hidden">
      {/* Hero Section - Gradient Background */}
      <div className="p-6 bg-gradient-to-br from-primary/5 via-background to-background border-b border-border">
        <p className="text-sm text-muted-foreground text-center mb-1">Total Cash Needed</p>
        <motion.p 
          className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent tracking-tight"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          key={calculations.totalOneTime}
          transition={{ duration: 0.3 }}
        >
          {formatPrice(Math.round(calculations.totalOneTime))}
        </motion.p>
        <p className="text-sm text-muted-foreground text-center mt-2">
          +{formatPrice(Math.round(calculations.allCostsAbovePrice))} ({calculations.percentAbovePrice.toFixed(1)}%) above list price
        </p>
      </div>


      {/* Quick Stats Grid - 2x2 with dividers */}
      <div className="grid grid-cols-2 divide-x divide-y divide-border">
        <div className="p-4">
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">Purchase Tax</p>
            <InfoTooltip content={`Effective rate: ${calculations.effectiveTaxRate.toFixed(2)}% for ${getBuyerCategoryLabel(buyerCategory)}`} />
          </div>
          <p className="text-lg font-semibold mt-0.5">{formatPrice(Math.round(calculations.purchaseTax))}</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground">Lawyer Fees</p>
          <p className="text-lg font-semibold mt-0.5">{formatPrice(Math.round(calculations.lawyerFee))}</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground">Agent Fees</p>
          <p className="text-lg font-semibold mt-0.5">
            {calculations.agentFee > 0 ? formatPrice(Math.round(calculations.agentFee)) : 'N/A'}
          </p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">Registration</p>
            <InfoTooltip content="Tabu (land registry) registration fees" />
          </div>
          <p className="text-lg font-semibold mt-0.5">{formatPrice(calculations.tabuRegistration)}</p>
        </div>
      </div>

      {/* New Construction Extras */}
      {isNewConstruction && (calculations.madadCost > 0 || calculations.developerLawyerFee > 0) && (
        <div className="px-4 py-3 bg-semantic-amber/10 border-t border-semantic-amber">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">New Construction Costs</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Index Linkage (Madad)</span>
            <span className="font-medium text-semantic-amber-foreground">{formatPrice(Math.round(calculations.madadCost))}</span>
          </div>
          {calculations.developerLawyerFee > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Developer Lawyer</span>
              <span className="font-medium">{formatPrice(Math.round(calculations.developerLawyerFee))}</span>
            </div>
          )}
        </div>
      )}

      {/* Visual Breakdown Bar */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Property ({propertyPercent}%)</span>
          <span>Costs ({costsPercent}%)</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden flex">
          <motion.div 
            className="bg-primary h-full"
            initial={{ width: 0 }}
            animate={{ width: `${propertyPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <div className="bg-muted-foreground/30 h-full flex-1" />
        </div>
        <div className="flex items-center justify-between text-xs mt-1.5">
          <span className="font-medium">{formatPrice(calculations.price)}</span>
          <span className="font-medium">{formatPrice(Math.round(calculations.allCostsAbovePrice))}</span>
        </div>
      </div>

      {/* Monthly Costs Preview */}
      <div className="p-4 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Est. Monthly Costs</p>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-lg font-semibold">
              {formatPrice(Math.round(calculations.monthlyCosts.arnona + calculations.monthlyCosts.vaadBayit + 150))}
            </span>
            <span className="text-sm text-muted-foreground">/mo</span>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            <p>Arnona: {formatPrice(Math.round(calculations.monthlyCosts.arnona))}</p>
            <p>Va'ad: {formatPrice(Math.round(calculations.monthlyCosts.vaadBayit))}</p>
          </div>
        </div>
        {!selectedCity && (
          <p className="text-xs text-muted-foreground mt-1">Select a city for accurate estimates</p>
        )}
      </div>
    </Card>
  );

  // Bottom section
  const bottomSection = (
    <div className="space-y-6">
      {/* 1. Interpret */}
      {trueCostInsights.length > 0 && (
        <InsightCard insights={trueCostInsights} />
      )}

      {/* 2. Act */}
      <ToolPropertySuggestions
        title="Properties at This Price"
        subtitle="Real listings matching your total cost estimate"
        minPrice={Math.round(calculations.price * 0.8)}
        maxPrice={Math.round(calculations.price * 1.2)}
        enabled={propertyPrice !== '2750000'}
      />

      {/* 3. Explore - Next Steps Grid */}
      <div className="grid sm:grid-cols-3 gap-4">
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
          to="/guides/true-cost"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="font-semibold">Full Cost Guide</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Understand every cost in detail
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

      {/* 4. Understand - Educational Section */}
      <Collapsible open={isCostsInfoOpen} onOpenChange={setIsCostsInfoOpen}>
        <Card className="overflow-hidden">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Info className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Understanding Israeli Purchase Costs</p>
                <p className="text-xs text-muted-foreground">Why Israel is different from other markets</p>
              </div>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isCostsInfoOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Israeli property purchases typically add 8-12% on top of the listing price. Here's what to expect:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="font-medium text-sm mb-1">Purchase Tax (מס רכישה)</p>
                  <p className="text-xs text-muted-foreground">
                    Progressive tax on all property purchases. First-time buyers and Olim get significant exemptions on properties under ~₪1.8M.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="font-medium text-sm mb-1">Agent Fees (תיווך)</p>
                  <p className="text-xs text-muted-foreground">
                    2% + VAT is standard for resale. New construction is typically sold direct by developers (no agent fee).
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="font-medium text-sm mb-1">Legal Fees (שכ"ט עו"ד)</p>
                  <p className="text-xs text-muted-foreground">
                    0.5% + VAT to your lawyer. New construction adds ~1.5% for the developer's lawyer.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="font-medium text-sm mb-1">Index Linkage (הצמדה)</p>
                  <p className="text-xs text-muted-foreground">
                    New construction prices rise with the building cost index during construction—typically 3-8% over 2-3 years.
                  </p>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 5. Trust */}
      <ToolGuidanceHint
        variant="expert-tip"
        message="Non-Israeli residents are typically required to hold a life insurance policy as a condition of mortgage approval in Israel."
      />

      {/* 6. Engage */}
      <ToolFeedback toolName="True Cost Calculator" variant="inline" />
    </div>
  );

  const disclaimer = (
    <ToolDisclaimer 
      text="Estimates based on current Israeli tax brackets and market rates (2024). Consult a lawyer and accountant for precise figures."
    />
  );

  return (
    <ToolLayout
      title="True Cost Calculator"
      subtitle="See the true cost of buying property in Israel — beyond the list price."
      icon={<Calculator className="h-6 w-6" />}
      headerActions={headerActions}
      infoBanner={
        <BuyerTypeInfoBanner
          selectedType={buyerCategory as SharedBuyerCategory}
          onTypeChange={(type) => setBuyerCategory(type as BuyerCategory)}
          profileType={buyerProfile ? (
            getBuyerTaxCategory(buyerProfile) as SharedBuyerCategory
          ) : undefined}
        />
      }
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      bottomSection={bottomSection}
      sourceAttribution={<SourceAttribution toolType="trueCost" />}
      disclaimer={disclaimer}
    />
  );
}

export default TrueCostCalculator;
