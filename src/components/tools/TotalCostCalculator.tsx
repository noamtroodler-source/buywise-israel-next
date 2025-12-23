import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Receipt, Home, Truck, Sofa, AlertTriangle, Info, Building2, Calendar } from 'lucide-react';
import { calculatePurchaseTax, type BuyerType, getBuyerTypeLabel, calculateOlehEligibility } from '@/lib/calculations/purchaseTax';
import { calculateTotalPurchaseCosts, calculateNewConstructionLinkage } from '@/lib/calculations/purchaseCosts';
import { useCities } from '@/hooks/useCities';

export function TotalCostCalculator() {
  const [propertyPrice, setPropertyPrice] = useState(2500000);
  const [buyerType, setBuyerType] = useState<BuyerType>('first_time');
  const [isNewConstruction, setIsNewConstruction] = useState(false);
  const [includeMoving, setIncludeMoving] = useState(true);
  const [includeFurniture, setIncludeFurniture] = useState(false);
  const [furnitureLevel, setFurnitureLevel] = useState<'basic' | 'standard' | 'premium'>('standard');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [propertySizeSqm, setPropertySizeSqm] = useState(100);
  const [aliyahYear, setAliyahYear] = useState<number | undefined>(undefined);
  const [constructionMonths, setConstructionMonths] = useState(24);
  const [includeMortgage, setIncludeMortgage] = useState(true);
  const [loanAmount, setLoanAmount] = useState(propertyPrice * 0.7);

  const { data: cities } = useCities();

  const selectedCityData = useMemo(() => {
    return cities?.find(c => c.slug === selectedCity);
  }, [cities, selectedCity]);

  const taxResult = useMemo(() => {
    return calculatePurchaseTax(propertyPrice, buyerType, buyerType === 'oleh', aliyahYear);
  }, [propertyPrice, buyerType, aliyahYear]);

  const calculations = useMemo(() => {
    const costs = calculateTotalPurchaseCosts(propertyPrice, {
      buyerType,
      isNewConstruction,
      loanAmount: includeMortgage ? loanAmount : 0,
      city: selectedCity,
      sizeSqm: propertySizeSqm,
      isOleh: buyerType === 'oleh',
      aliyahYear,
    });

    // Moving costs estimate
    const movingCosts = includeMoving ? 5000 : 0;

    // Furniture costs
    let furnitureCosts = 0;
    if (includeFurniture) {
      switch (furnitureLevel) {
        case 'basic':
          furnitureCosts = 30000;
          break;
        case 'standard':
          furnitureCosts = 80000;
          break;
        case 'premium':
          furnitureCosts = 200000;
          break;
      }
    }

    // New construction index linkage
    const indexLinkage = isNewConstruction 
      ? calculateNewConstructionLinkage(propertyPrice, constructionMonths)
      : { totalLinkedCost: 0, linkageAmount: 0, annualRate: 0 };

    // City-specific Arnona estimate
    const monthlyArnona = selectedCityData?.arnona_monthly_avg || 
      (propertySizeSqm * (selectedCityData?.arnona_rate_sqm || 25));

    // Vaad Bayit estimate
    const monthlyVaadBayit = selectedCityData?.average_vaad_bayit || 350;

    const totalAdditionalCosts = 
      costs.totalOneTimeCosts + 
      movingCosts + 
      furnitureCosts +
      indexLinkage.linkageAmount;

    const grandTotal = propertyPrice + totalAdditionalCosts;
    const percentageOfPrice = (totalAdditionalCosts / propertyPrice) * 100;

    return {
      ...costs,
      movingCosts,
      furnitureCosts,
      indexLinkage,
      monthlyArnona,
      monthlyVaadBayit,
      totalAdditionalCosts,
      grandTotal,
      percentageOfPrice,
    };
  }, [propertyPrice, buyerType, isNewConstruction, includeMoving, includeFurniture, 
      furnitureLevel, selectedCity, propertySizeSqm, aliyahYear, constructionMonths,
      includeMortgage, loanAmount, selectedCityData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isOlehEligible = buyerType === 'oleh' && aliyahYear && calculateOlehEligibility(aliyahYear);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Total Cost Calculator
        </CardTitle>
        <CardDescription>
          Calculate all costs involved in purchasing a property in Israel, including taxes, fees, and ongoing expenses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Property Price: {formatCurrency(propertyPrice)}</Label>
              <Slider
                value={[propertyPrice]}
                onValueChange={([value]) => {
                  setPropertyPrice(value);
                  setLoanAmount(Math.min(loanAmount, value * 0.75));
                }}
                min={500000}
                max={15000000}
                step={50000}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Buyer Type (סוג רוכש)</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Your buyer category significantly affects purchase tax rates. First-time buyers and Olim get reduced rates.
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={buyerType} onValueChange={(v) => setBuyerType(v as BuyerType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_time">First-Time Buyer (רוכש דירה יחידה)</SelectItem>
                  <SelectItem value="oleh">New Immigrant - Oleh (עולה חדש)</SelectItem>
                  <SelectItem value="upgrader">Upgrader - Selling within 18mo (משפר דיור)</SelectItem>
                  <SelectItem value="investor">Investor / Additional Property (משקיע)</SelectItem>
                  <SelectItem value="foreign">Foreign Resident (תושב חוץ)</SelectItem>
                  <SelectItem value="company">Corporate Buyer (חברה)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {buyerType === 'oleh' && (
              <div className="space-y-2">
                <Label>Year of Aliyah</Label>
                <Input
                  type="number"
                  value={aliyahYear || ''}
                  onChange={(e) => setAliyahYear(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g., 2020"
                  min={2000}
                  max={new Date().getFullYear()}
                />
                {isOlehEligible && (
                  <Badge variant="secondary" className="text-green-700 bg-green-100">
                    ✓ Eligible for Oleh tax benefits ({7 - (new Date().getFullYear() - aliyahYear!)} years remaining)
                  </Badge>
                )}
                {aliyahYear && !isOlehEligible && (
                  <Badge variant="secondary" className="text-amber-700 bg-amber-100">
                    ⚠ 7-year benefit period expired
                  </Badge>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>City</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select for accurate Arnona estimates" />
                </SelectTrigger>
                <SelectContent>
                  {cities?.map((city) => (
                    <SelectItem key={city.id} value={city.slug}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Property Size: {propertySizeSqm} sqm</Label>
              <Slider
                value={[propertySizeSqm]}
                onValueChange={([value]) => setPropertySizeSqm(value)}
                min={30}
                max={300}
                step={5}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Label htmlFor="new-construction">New Construction (from developer)</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    New construction includes developer lawyer fees, bank guarantees, and is subject to building cost index (מדד תשומות הבנייה)
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch
                id="new-construction"
                checked={isNewConstruction}
                onCheckedChange={setIsNewConstruction}
              />
            </div>

            {isNewConstruction && (
              <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                <Label>Construction Period: {constructionMonths} months</Label>
                <Slider
                  value={[constructionMonths]}
                  onValueChange={([value]) => setConstructionMonths(value)}
                  min={12}
                  max={48}
                  step={3}
                />
                <Alert variant="default" className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-xs">
                    <strong>Building Index Warning (מדד תשומות הבנייה):</strong> Final price may increase ~{((calculations.indexLinkage.annualRate) * (constructionMonths / 12) * 100).toFixed(1)}% 
                    ({formatCurrency(calculations.indexLinkage.linkageAmount)}) due to construction cost indexation.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="mortgage">Include Mortgage Costs</Label>
              <Switch
                id="mortgage"
                checked={includeMortgage}
                onCheckedChange={setIncludeMortgage}
              />
            </div>

            {includeMortgage && (
              <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                <Label>Loan Amount: {formatCurrency(loanAmount)}</Label>
                <Slider
                  value={[loanAmount]}
                  onValueChange={([value]) => setLoanAmount(value)}
                  min={0}
                  max={propertyPrice * 0.75}
                  step={50000}
                />
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
                <Label>Furniture Level</Label>
                <Select value={furnitureLevel} onValueChange={(v) => setFurnitureLevel(v as typeof furnitureLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (~₪30,000)</SelectItem>
                    <SelectItem value="standard">Standard (~₪80,000)</SelectItem>
                    <SelectItem value="premium">Premium (~₪200,000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary text-primary-foreground text-center">
              <p className="text-sm opacity-90">Total One-Time Cost</p>
              <p className="text-3xl font-bold">{formatCurrency(calculations.grandTotal)}</p>
              <p className="text-sm opacity-90">
                +{calculations.percentageOfPrice.toFixed(1)}% above property price
              </p>
            </div>

            {/* Tax Savings */}
            {taxResult.savings && taxResult.savings.vsInvestor > 0 && buyerType !== 'investor' && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800 text-sm">
                  <strong>You save:</strong> {formatCurrency(taxResult.savings.vsInvestor)} vs. investor rates
                </AlertDescription>
              </Alert>
            )}

            <div className="p-4 rounded-lg border space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Home className="h-4 w-4" />
                One-Time Costs (עלויות חד-פעמיות)
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property Price (מחיר הנכס):</span>
                  <span className="font-medium">{formatCurrency(propertyPrice)}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Purchase Tax - {getBuyerTypeLabel(taxResult.buyerType)} (מס רכישה):
                  </span>
                  <span className="font-medium">{formatCurrency(taxResult.totalTax)}</span>
                </div>
                <div className="text-xs text-muted-foreground pl-4">
                  Effective rate: {taxResult.effectiveRate}%
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lawyer Fees (שכ"ט עו"ד):</span>
                  <span className="font-medium">{formatCurrency(calculations.lawyerFees)}</span>
                </div>
                {!isNewConstruction && calculations.agentFees > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agent Commission (תיווך):</span>
                    <span className="font-medium">{formatCurrency(calculations.agentFees)}</span>
                  </div>
                )}
                {isNewConstruction && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Developer Lawyer (עו"ד יזם):</span>
                      <span className="font-medium">{formatCurrency(calculations.developerLawyerFees)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank Guarantee (ערבות בנקאית):</span>
                      <span className="font-medium">{formatCurrency(calculations.bankGuarantee)}</span>
                    </div>
                    {calculations.indexLinkage.linkageAmount > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>Est. Index Linkage (הצמדה למדד):</span>
                        <span className="font-medium">{formatCurrency(calculations.indexLinkage.linkageAmount)}</span>
                      </div>
                    )}
                  </>
                )}
                {includeMortgage && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mortgage Fees (עמלות משכנתא):</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.mortgageOriginationFee + calculations.appraisalFee)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mortgage Registration (רישום משכנתא):</span>
                      <span className="font-medium">{formatCurrency(calculations.mortgageRegistration)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tabu Registration (רישום בטאבו):</span>
                  <span className="font-medium">{formatCurrency(calculations.tabuRegistration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Caveat (הערת אזהרה):</span>
                  <span className="font-medium">{formatCurrency(calculations.caveatRegistration)}</span>
                </div>
                {calculations.movingCosts > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3 w-3" /> Moving (הובלה):
                    </span>
                    <span className="font-medium">{formatCurrency(calculations.movingCosts)}</span>
                  </div>
                )}
                {calculations.furnitureCosts > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Sofa className="h-3 w-3" /> Furniture (ריהוט):
                    </span>
                    <span className="font-medium">{formatCurrency(calculations.furnitureCosts)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Additional Costs:</span>
                  <span className="text-primary">{formatCurrency(calculations.totalAdditionalCosts)}</span>
                </div>
              </div>
            </div>

            {/* Monthly Costs */}
            <div className="p-4 rounded-lg border space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Estimated Monthly Costs (עלויות חודשיות)
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Arnona (ארנונה):</span>
                  <span className="font-medium">{formatCurrency(calculations.monthlyArnona)}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vaad Bayit (ועד בית):</span>
                  <span className="font-medium">{formatCurrency(calculations.monthlyVaadBayit)}/mo</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Total Monthly:</span>
                  <span className="text-primary">{formatCurrency(calculations.monthlyArnona + calculations.monthlyVaadBayit)}/mo</span>
                </div>
              </div>
            </div>

            {!selectedCity && (
              <p className="text-xs text-muted-foreground text-center">
                Select a city for accurate Arnona and Vaad estimates
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
