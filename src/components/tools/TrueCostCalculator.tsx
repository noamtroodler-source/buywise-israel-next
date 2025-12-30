import { useState, useMemo, useCallback, useEffect } from 'react';
import { Calculator, Home, Wallet, Info, Save, PiggyBank, FileText, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ToolLayout } from './shared/ToolLayout';
import { ToolDisclaimer } from './shared/ToolDisclaimer';
import { ToolFeedback } from './shared/ToolFeedback';
import { CTACard } from './shared/CTACard';
import { CashBreakdownTable } from './shared/CashBreakdownTable';
import { 
  calculateOlehEligibility,
  type BuyerType 
} from '@/lib/calculations/purchaseTax';
import { 
  calculateMonthlyCosts,
  calculateNewConstructionLinkage 
} from '@/lib/calculations/purchaseCosts';
import { useBuyerProfile, calculatePurchaseTax as calcTax, getBuyerCategoryLabel } from '@/hooks/useBuyerProfile';
import { useCities } from '@/hooks/useCities';
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

function InfoTooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help">
          {children}
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

export function TrueCostCalculator() {
  const navigate = useNavigate();
  const { data: buyerProfile } = useBuyerProfile();
  const { data: cities } = useCities();

  // Core inputs
  const [propertyPrice, setPropertyPrice] = useState('2500000');
  const [propertySize, setPropertySize] = useState('85');
  const [selectedCity, setSelectedCity] = useState('');
  
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
    const loan = parseFormattedNumber(loanAmount);
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
        value: `₪${formatNumber(calculations.price)}`,
      },
      { isSeparator: true, label: '', value: '' },
      {
        label: 'Purchase Tax (מס רכישה)',
        value: `₪${formatNumber(Math.round(calculations.purchaseTax))}`,
        percentage: calculations.effectiveTaxRate.toFixed(2) + '%',
        tooltip: `Based on ${getBuyerCategoryLabel(buyerCategory)} tax brackets`,
      },
      {
        label: 'Lawyer Fees (שכ"ט עו"ד)',
        value: `₪${formatNumber(Math.round(calculations.lawyerFee))}`,
        tooltip: '0.5% of property price + VAT',
      },
    ];

    // Agent commission (resale only)
    if (calculations.agentFee > 0) {
      items.push({
        label: 'Agent Commission (עמלת תיווך)',
        value: `₪${formatNumber(Math.round(calculations.agentFee))}`,
        tooltip: '2% of property price + VAT',
      });
    }

    // New construction specific
    if (isNewConstruction) {
      if (calculations.developerLawyerFee > 0) {
        items.push({
          label: 'Developer Lawyer (עו"ד קבלן)',
          value: `₪${formatNumber(Math.round(calculations.developerLawyerFee))}`,
          tooltip: "Legal fees paid to developer's attorney",
        });
      }

      if (calculations.bankGuaranteeFee > 0) {
        items.push({
          label: 'Bank Guarantee (ערבות בנקאית)',
          value: `₪${formatNumber(Math.round(calculations.bankGuaranteeFee))}`,
          tooltip: 'Required guarantee for off-plan purchases',
        });
      }

      if (calculations.madadCost > 0) {
        items.push({
          label: 'Index Linkage (הצמדה למדד)',
          value: `₪${formatNumber(Math.round(calculations.madadCost))}`,
          tooltip: 'Estimated price increase linked to construction cost index',
          highlight: 'negative',
        });
      }
    }

    // Mortgage costs
    if (calculations.mortgageCosts > 0) {
      items.push({
        label: 'Mortgage Fees (Appraisal, Registration)',
        value: `₪${formatNumber(Math.round(calculations.mortgageCosts))}`,
        tooltip: 'Includes appraisal, registration, and bank fees',
      });
    }

    // Registration
    items.push({
      label: 'Tabu Registration (רישום בטאבו)',
      value: `₪${formatNumber(calculations.tabuRegistration)}`,
    });

    // Optional extras
    if (calculations.movingCost > 0) {
      items.push({
        label: 'Moving Costs',
        value: `₪${formatNumber(calculations.movingCost)}`,
      });
    }

    if (calculations.furnitureCost > 0) {
      items.push({
        label: `Furniture (${furnitureLevel})`,
        value: `₪${formatNumber(calculations.furnitureCost)}`,
      });
    }

    // Separator before total
    items.push({ isSeparator: true, label: '', value: '' });

    // Total
    items.push({
      label: 'Total One-Time Costs',
      value: `₪${formatNumber(Math.round(calculations.totalOneTime))}`,
      isTotal: true,
    });

    return items;
  }, [calculations, buyerCategory, isNewConstruction, furnitureLevel]);

  // Monthly costs breakdown
  const monthlyItems = useMemo(() => {
    const insuranceEstimate = 150;
    return [
      {
        label: 'Arnona (ארנונה)',
        value: `₪${formatNumber(Math.round(calculations.monthlyCosts.arnona))}`,
        tooltip: selectedCity ? 'Based on selected city rates' : 'Average estimate - select city for accuracy',
      },
      {
        label: "Va'ad Bayit (ועד בית)",
        value: `₪${formatNumber(Math.round(calculations.monthlyCosts.vaadBayit))}`,
        tooltip: 'Building maintenance committee fees',
      },
      {
        label: 'Home Insurance',
        value: `₪${formatNumber(insuranceEstimate)}`,
      },
      { isSeparator: true, label: '', value: '' },
      {
        label: 'Est. Monthly Total',
        value: `₪${formatNumber(Math.round(calculations.monthlyCosts.arnona + calculations.monthlyCosts.vaadBayit + insuranceEstimate))}`,
        isTotal: true,
      },
    ];
  }, [calculations.monthlyCosts, selectedCity]);

  const headerActions = (
    <Button variant="outline" size="sm" onClick={handleSave} className="gap-2">
      <Save className="h-4 w-4" />
      <span className="hidden sm:inline">Save</span>
    </Button>
  );

  return (
    <ToolLayout
      title="True Cost Calculator"
      subtitle="See the complete cost of buying property in Israel — beyond just the price"
      icon={<Calculator className="h-6 w-6" />}
      headerActions={headerActions}
      leftColumn={
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Property & Buyer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Property Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Property Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span>
                  <Input
                    id="price"
                    type="text"
                    value={formatNumber(parseFormattedNumber(propertyPrice))}
                    onChange={(e) => setPropertyPrice(e.target.value.replace(/[^\d]/g, ''))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">Size (sqm)</Label>
                  <Input
                    id="size"
                    type="number"
                    value={propertySize}
                    onChange={(e) => setPropertySize(e.target.value)}
                    min={20}
                    max={500}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City (for Arnona)</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger id="city">
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

            {/* Buyer Profile */}
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="buyerType">
                  <InfoTooltip content="Your buyer status determines your purchase tax rate. First-time buyers and Olim pay significantly less.">
                    Buyer Type
                  </InfoTooltip>
                </Label>
                <Select value={buyerCategory} onValueChange={(v) => setBuyerCategory(v as BuyerCategory)}>
                  <SelectTrigger id="buyerType">
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
                <div className="space-y-2">
                  <Label htmlFor="aliyahYear">Year of Aliyah</Label>
                  <Input
                    id="aliyahYear"
                    type="number"
                    value={aliyahYear}
                    onChange={(e) => setAliyahYear(e.target.value)}
                    placeholder="e.g., 2022"
                    min={2000}
                    max={new Date().getFullYear()}
                  />
                  {aliyahYear && !calculateOlehEligibility(parseInt(aliyahYear)) && (
                    <p className="text-xs text-destructive">
                      Oleh benefits expire 7 years after Aliyah
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Purchase Type */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="newConstruction" className="flex-1">
                  <InfoTooltip content="New construction (off-plan) purchases include additional costs like index linkage and developer attorney fees.">
                    New Construction
                  </InfoTooltip>
                </Label>
                <Switch
                  id="newConstruction"
                  checked={isNewConstruction}
                  onCheckedChange={setIsNewConstruction}
                />
              </div>

              {isNewConstruction && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="constructionMonths">Construction Period (months)</Label>
                    <Input
                      id="constructionMonths"
                      type="number"
                      value={constructionMonths}
                      onChange={(e) => setConstructionMonths(e.target.value)}
                      min={6}
                      max={60}
                    />
                  </div>
                  <Alert className="bg-warning/10 border-warning/20">
                    <Building2 className="h-4 w-4 text-warning-foreground" />
                    <AlertDescription className="text-sm">
                      New construction prices are linked to the building cost index (מדד תשומות הבנייה). 
                      The final price may be 3-8% higher than the contract price.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </div>

            {/* Advanced Options */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="pt-4 border-t">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                  <span className="font-medium">Advanced Options</span>
                  <span className="text-muted-foreground text-sm">
                    {advancedOpen ? '−' : '+'}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {!isNewConstruction && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="agentFee">
                      <InfoTooltip content="Agent commission is typically 2% + VAT for resale properties.">
                        Include Agent Fee
                      </InfoTooltip>
                    </Label>
                    <Switch
                      id="agentFee"
                      checked={includeAgentFee}
                      onCheckedChange={setIncludeAgentFee}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="mortgageCosts">
                    <InfoTooltip content="Includes appraisal, mortgage registration, and bank fees.">
                      Include Mortgage Costs
                    </InfoTooltip>
                  </Label>
                  <Switch
                    id="mortgageCosts"
                    checked={includeMortgageCosts}
                    onCheckedChange={setIncludeMortgageCosts}
                  />
                </div>

                {includeMortgageCosts && (
                  <div className="space-y-2">
                    <Label htmlFor="loanAmount">Loan Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span>
                      <Input
                        id="loanAmount"
                        type="text"
                        value={formatNumber(parseFormattedNumber(loanAmount))}
                        onChange={(e) => setLoanAmount(e.target.value.replace(/[^\d]/g, ''))}
                        className="pl-8"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="moving">Include Moving Costs</Label>
                  <Switch
                    id="moving"
                    checked={includeMoving}
                    onCheckedChange={setIncludeMoving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="furniture">Include Furniture</Label>
                  <Switch
                    id="furniture"
                    checked={includeFurniture}
                    onCheckedChange={setIncludeFurniture}
                  />
                </div>

                {includeFurniture && (
                  <div className="space-y-2">
                    <Label htmlFor="furnitureLevel">Furniture Level</Label>
                    <Select value={furnitureLevel} onValueChange={(v) => setFurnitureLevel(v as typeof furnitureLevel)}>
                      <SelectTrigger id="furnitureLevel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic (~₪30,000)</SelectItem>
                        <SelectItem value="standard">Standard (~₪60,000)</SelectItem>
                        <SelectItem value="premium">Premium (~₪120,000)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
                  Reset to Defaults
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      }
      rightColumn={
        <div className="space-y-4">
          {/* Hero Result */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Total One-Time Costs</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                ₪{formatNumber(Math.round(calculations.totalOneTime))}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                +₪{formatNumber(Math.round(calculations.allCostsAbovePrice))} ({calculations.percentAbovePrice.toFixed(1)}%) above property price
              </p>
            </CardContent>
          </Card>

          {/* Tax Savings Alert */}
          {calculations.taxSavings > 0 && buyerCategory !== 'additional' && buyerCategory !== 'non_resident' && (
            <Alert className="bg-success/10 border-success/20">
              <PiggyBank className="h-4 w-4 text-success" />
              <AlertDescription className="text-sm">
                As a {getBuyerCategoryLabel(buyerCategory).toLowerCase()}, you save{' '}
                <span className="font-semibold text-success">₪{formatNumber(Math.round(calculations.taxSavings))}</span>{' '}
                on purchase tax compared to investor rates.
              </AlertDescription>
            </Alert>
          )}

          {/* Cost Breakdown */}
          <CashBreakdownTable 
            title="One-Time Costs (עלויות חד-פעמיות)"
            items={breakdownItems} 
          />

          {/* Monthly Costs */}
          <CashBreakdownTable 
            title="Estimated Monthly Costs (עלויות חודשיות)"
            items={monthlyItems} 
          />
          {!selectedCity && (
            <p className="text-xs text-muted-foreground text-center -mt-2">
              Select a city above for accurate Arnona estimates
            </p>
          )}
        </div>
      }
      bottomSection={
        <div className="space-y-8">
          {/* Navigation Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <CTACard
              title="Plan Your Financing"
              description="Calculate monthly mortgage payments"
              icon={<Calculator className="h-5 w-5" />}
              buttonText="Open Calculator"
              buttonLink="/tools?tool=mortgage"
            />
            <CTACard
              title="Check Your Budget"
              description="See what you can afford"
              icon={<Wallet className="h-5 w-5" />}
              buttonText="Check Affordability"
              buttonLink="/tools?tool=affordability"
            />
            <CTACard
              title="Browse Properties"
              description="Find your next home"
              icon={<Home className="h-5 w-5" />}
              buttonText="View Listings"
              buttonLink="/listings"
            />
          </div>

          {/* Feedback */}
          <div className="flex justify-center">
            <ToolFeedback toolName="True Cost Calculator" variant="inline" />
          </div>
        </div>
      }
      disclaimer={
        <ToolDisclaimer 
          text="These estimates are based on current market rates and may vary. Consult with a lawyer and accountant for precise figures. Tax brackets are updated annually by the Israel Tax Authority."
        />
      }
    />
  );
}
