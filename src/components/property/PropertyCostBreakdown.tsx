import { useState, useMemo } from 'react';
import { Calculator, Receipt, Calendar, Home, ChevronDown, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { useBuyerProfile, getBuyerTaxCategory, getBuyerCategoryLabel, profileToDimensions } from '@/hooks/useBuyerProfile';
import { usePurchaseTaxBrackets } from '@/hooks/usePurchaseTaxBrackets';
import { useCityDetails } from '@/hooks/useCityDetails';
import { useMortgageEstimate, useMortgagePreferences } from '@/hooks/useMortgagePreferences';
import { PersonalizationHeader } from './PersonalizationHeader';
import { FEE_RANGES, RENTAL_FEE_RANGES, VAT_RATE, formatPriceRange, getUtilitiesEstimate } from '@/lib/utils/formatRange';
import { cn } from '@/lib/utils';
import { BuyerProfileDimensions, deriveEffectiveBuyerType } from '@/lib/calculations/buyerProfile';
import { BuyerType } from '@/lib/calculations/purchaseTax';
import { calculateArnonaWithDiscount, type ArnonaEstimate } from '@/lib/calculations/arnona';

interface PropertyCostBreakdownProps {
  price: number;
  currency: string;
  listingStatus: string;
  city?: string;
  sizeSqm?: number;
  isNewConstruction?: boolean;
  vaadBayitMonthly?: number | null;
  // Rental-specific props
  agentFeeRequired?: boolean | null;
  bankGuaranteeRequired?: boolean | null;
  checksRequired?: boolean | null;
}

// Calculate tax using actual brackets from DB or fallback
function calculateTaxFromBrackets(
  price: number, 
  brackets: Array<{ bracket_min: number; bracket_max: number | null; rate_percent: number }> | undefined
): number {
  if (!brackets || brackets.length === 0) {
    // Fallback to first-time buyer default
    if (price <= 1978745) return 0;
    if (price <= 2347040) return (price - 1978745) * 0.035;
    if (price <= 6055070) return (2347040 - 1978745) * 0.035 + (price - 2347040) * 0.05;
    return (2347040 - 1978745) * 0.035 + (6055070 - 2347040) * 0.05 + (price - 6055070) * 0.08;
  }

  let totalTax = 0;
  let remainingPrice = price;

  for (const bracket of brackets) {
    if (remainingPrice <= 0) break;

    const bracketMax = bracket.bracket_max ?? Infinity;
    const bracketSize = bracketMax - bracket.bracket_min;
    const taxableAmount = Math.min(remainingPrice, bracketSize);
    const rate = bracket.rate_percent / 100;

    totalTax += taxableAmount * rate;
    remainingPrice -= taxableAmount;
  }

  return Math.round(totalTax);
}

// Map BuyerType to tax bracket type
function mapBuyerTypeToTaxType(buyerType: BuyerType): string {
  switch (buyerType) {
    case 'first_time':
    case 'upgrader':
      return 'first_time';
    case 'oleh':
      return 'oleh';
    case 'investor':
    case 'company':
    case 'foreign':
      return 'investor';
    default:
      return 'first_time';
  }
}

export function PropertyCostBreakdown({ 
  price, 
  currency, 
  listingStatus, 
  city,
  sizeSqm,
  isNewConstruction = false,
  vaadBayitMonthly,
  agentFeeRequired,
  bankGuaranteeRequired,
  checksRequired
}: PropertyCostBreakdownProps) {
  const { data: buyerProfile, isLoading } = useBuyerProfile();
  const formatPrice = useFormatPrice();
  
  // Get saved profile dimensions (buyer type comes from profile, not editable inline)
  const savedProfileDimensions = useMemo(() => profileToDimensions(buyerProfile), [buyerProfile]);
  const effectiveDerived = useMemo(() => deriveEffectiveBuyerType(savedProfileDimensions), [savedProfileDimensions]);
  
  // Get buyer category from effective profile
  const buyerCategory = getBuyerTaxCategory(buyerProfile);
  const effectiveTaxType = effectiveDerived.taxType;
  const hasProfile = !!buyerProfile?.onboarding_completed;
  
  // Fetch tax brackets from database using effective tax type
  const taxBracketType = mapBuyerTypeToTaxType(effectiveTaxType);
  const { data: taxBrackets } = usePurchaseTaxBrackets(taxBracketType);
  
  // Fetch city-specific data
  const citySlug = city?.toLowerCase().replace(/\s+/g, '-');
  const { data: cityData } = useCityDetails(citySlug || '');
  
  // Get mortgage estimate
  const mortgageEstimate = useMortgageEstimate(price);
  
  // Calculate purchase tax from DB brackets
  const purchaseTax = useMemo(() => {
    if (listingStatus === 'for_rent') return 0;
    return calculateTaxFromBrackets(price, taxBrackets);
  }, [price, taxBrackets, listingStatus]);
  
  // Effective tax rate
  const effectiveTaxRate = price > 0 ? (purchaseTax / price) * 100 : 0;
  
  // Other one-time costs - now using honest ranges instead of fake precision
  // Lawyer fees: 0.5-1.0% of price (varies by complexity and negotiation)
  const lawyerFeesRange = {
    low: Math.round(price * FEE_RANGES.lawyer.min),
    high: Math.round(price * FEE_RANGES.lawyer.max),
  };
  const lawyerVatRange = {
    low: Math.round(lawyerFeesRange.low * 0.18), // VAT 18% as of Jan 2025
    high: Math.round(lawyerFeesRange.high * 0.18),
  };
  
  // Agent fees: 1.5-2.5% (negotiable)
  const agentFeesRange = {
    low: Math.round(price * FEE_RANGES.agent.min),
    high: Math.round(price * FEE_RANGES.agent.max),
  };
  const agentVatRange = {
    low: Math.round(agentFeesRange.low * 0.18), // VAT 18% as of Jan 2025
    high: Math.round(agentFeesRange.high * 0.18),
  };
  
  // Fixed fees with ranges
  const mortgageFeesRange = {
    low: FEE_RANGES.appraisal.min + FEE_RANGES.mortgageOrigination.min,
    high: FEE_RANGES.appraisal.max + FEE_RANGES.mortgageOrigination.max,
  };
  const registrationFeesRange = {
    low: FEE_RANGES.registration.min,
    high: FEE_RANGES.registration.max,
  };
  
  // Developer lawyer fees for new construction: 1-2%
  const developerLawyerFeesRange = isNewConstruction ? {
    low: Math.round(price * FEE_RANGES.developerLawyer.min),
    high: Math.round(price * FEE_RANGES.developerLawyer.max),
  } : { low: 0, high: 0 };
  
  // Calculate total range
  const totalOneTimeRange = {
    low: purchaseTax + lawyerFeesRange.low + lawyerVatRange.low + agentFeesRange.low + agentVatRange.low + 
         mortgageFeesRange.low + registrationFeesRange.low + developerLawyerFeesRange.low,
    high: purchaseTax + lawyerFeesRange.high + lawyerVatRange.high + agentFeesRange.high + agentVatRange.high + 
          mortgageFeesRange.high + registrationFeesRange.high + developerLawyerFeesRange.high,
  };

  // Monthly costs - use city-specific data where available
  // arnona_rate_sqm is ANNUAL rate per sqm, so divide by 12 for monthly
  const arnona = useMemo(() => {
    if (cityData?.arnona_monthly_avg) {
      return cityData.arnona_monthly_avg;
    }
    if (cityData?.arnona_rate_sqm && sizeSqm) {
      return (cityData.arnona_rate_sqm * sizeSqm) / 12; // Convert annual to monthly
    }
    // Fallback: estimate based on size or default (annual ~70/sqm avg)
    return sizeSqm ? (sizeSqm * 70) / 12 : 350;
  }, [cityData, sizeSqm]);
  
  // Use actual Va'ad if provided, otherwise estimate from city data
  const vaadBayit = vaadBayitMonthly ?? cityData?.average_vaad_bayit ?? 300;
  const isVaadActual = vaadBayitMonthly !== null && vaadBayitMonthly !== undefined;
  const insurance = 150;
  const totalMonthly = arnona + vaadBayit + insurance;

  // Calculate tax savings vs investor rate
  const investorTax = useMemo(() => {
    // Investor rate: 8% up to 6M, 10% above
    if (price <= 6055070) return price * 0.08;
    return 6055070 * 0.08 + (price - 6055070) * 0.10;
  }, [price]);
  
  // Use effective tax type for savings calculation
  const taxSavings = effectiveTaxType !== 'investor' && effectiveTaxType !== 'company' && effectiveTaxType !== 'foreign'
    ? investorTax - purchaseTax 
    : 0;

  // State for collapsible sections
  const [oneTimeOpen, setOneTimeOpen] = useState(false);
  const [monthlyOpen, setMonthlyOpen] = useState(false);
  
  // Get LTV limit for personalization header
  const { ltvLimit } = useMortgagePreferences();
  
  // Calculate % of purchase price for context
  const oneTimePercentLow = ((totalOneTimeRange.low / price) * 100).toFixed(1);
  const oneTimePercentHigh = ((totalOneTimeRange.high / price) * 100).toFixed(1);

  // Rental cost breakdown state
  const [rentalUpfrontOpen, setRentalUpfrontOpen] = useState(false);
  const [rentalMonthlyOpen, setRentalMonthlyOpen] = useState(false);
  
  // Rental upfront costs calculations
  const rentalSecurityDepositRange = useMemo(() => ({
    low: price * RENTAL_FEE_RANGES.securityDeposit.min,
    high: price * RENTAL_FEE_RANGES.securityDeposit.max,
  }), [price]);
  
  const rentalAgentFee = useMemo(() => {
    if (!agentFeeRequired) return 0;
    return price * RENTAL_FEE_RANGES.agentFee.base * (1 + VAT_RATE);
  }, [price, agentFeeRequired]);
  
  const rentalTotalUpfrontRange = useMemo(() => ({
    low: rentalSecurityDepositRange.low + price + (agentFeeRequired ? rentalAgentFee : 0),
    high: rentalSecurityDepositRange.high + price + (agentFeeRequired ? rentalAgentFee : 0),
  }), [rentalSecurityDepositRange, price, agentFeeRequired, rentalAgentFee]);
  
  // Calculate arnona with Oleh discount for rentals
  const rentalArnonaEstimate = useMemo((): ArnonaEstimate => {
    const rate = cityData?.arnona_rate_sqm || 70; // fallback annual rate per sqm
    const size = sizeSqm || 80; // fallback size
    return calculateArnonaWithDiscount(
      rate,
      size,
      buyerProfile ? {
        residency_status: buyerProfile.residency_status as 'israeli_resident' | 'oleh_hadash' | 'non_resident' | undefined,
        aliyah_year: buyerProfile.aliyah_year,
        arnona_discount_categories: buyerProfile.arnona_discount_categories || [],
      } : null
    );
  }, [cityData, sizeSqm, buyerProfile]);
  
  // Calculate utilities estimate based on property size
  const utilitiesEstimate = useMemo(() => getUtilitiesEstimate(sizeSqm), [sizeSqm]);
  
  // Calculate monthly range (includes utilities range)
  const rentalMonthlyRange = useMemo(() => ({
    low: price + rentalArnonaEstimate.discountedMonthly + vaadBayit + utilitiesEstimate.min,
    high: price + rentalArnonaEstimate.discountedMonthly + vaadBayit + utilitiesEstimate.max,
  }), [price, rentalArnonaEstimate.discountedMonthly, vaadBayit, utilitiesEstimate]);

  // Calculate upfront cost as percentage of annual rent
  const annualRent = price * 12;
  const upfrontPercentLow = ((rentalTotalUpfrontRange.low / annualRent) * 100).toFixed(1);
  const upfrontPercentHigh = ((rentalTotalUpfrontRange.high / annualRent) * 100).toFixed(1);
  
  // Calculate first year total: upfront + (monthly × 12)
  const firstYearTotalRange = useMemo(() => {
    const monthlyAnnualLow = rentalMonthlyRange.low * 12;
    const monthlyAnnualHigh = rentalMonthlyRange.high * 12;
    return {
      low: rentalTotalUpfrontRange.low + monthlyAnnualLow,
      high: rentalTotalUpfrontRange.high + monthlyAnnualHigh,
    };
  }, [rentalTotalUpfrontRange, rentalMonthlyRange]);

  if (listingStatus === 'for_rent') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Cost Breakdown</h3>
        </div>
        
        <div className="space-y-5">
          {/* Personalization header - simplified for rentals (no mortgage info) */}
          {!isLoading && (
            <div className="text-sm text-muted-foreground">
              Calculating for: <span className="font-medium text-foreground">{getBuyerCategoryLabel(buyerCategory)}</span>
            </div>
          )}

          {/* Upfront Costs - Progressive disclosure (matching buy page) */}
          <TooltipProvider>
          <Collapsible open={rentalUpfrontOpen} onOpenChange={setRentalUpfrontOpen}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-foreground">Upfront Costs</h4>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">
                    {formatPriceRange(rentalTotalUpfrontRange.low, rentalTotalUpfrontRange.high, 'ILS')}
                  </div>
                  <div className="text-xs text-muted-foreground">~{upfrontPercentLow}–{upfrontPercentHigh}% of annual rent</div>
                </div>
              </div>
              
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ChevronDown className={cn("h-3 w-3 transition-transform", rentalUpfrontOpen && "rotate-180")} />
                  {rentalUpfrontOpen ? 'Hide breakdown' : 'View breakdown'}
                </button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-2 text-sm pt-2">
                {/* Security Deposit */}
                <div className="flex justify-between py-2 border-b border-border/50">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                        Security Deposit ({RENTAL_FEE_RANGES.securityDeposit.label})
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="font-medium mb-1">Pikadon (Security Deposit)</p>
                      <p className="text-xs">A refundable deposit held by the landlord (typically 2-3 months' rent). Returned when you move out, minus any deductions for damages.</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="font-medium">
                    {formatPriceRange(rentalSecurityDepositRange.low, rentalSecurityDepositRange.high, 'ILS')}
                  </span>
                </div>
                
                {/* First Month's Rent */}
                <div className="flex justify-between py-2 border-b border-border/50">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                        First Month's Rent
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="font-medium mb-1">First Month</p>
                      <p className="text-xs">The first month's rent is due upon signing, before you receive the keys.</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="font-medium">{formatPrice(price, currency)}</span>
                </div>
                
                {/* Agent Fee */}
                {agentFeeRequired && (
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                          Agent Fee + VAT
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="font-medium mb-1">Broker Commission</p>
                        <p className="text-xs">A one-time broker fee (1 month's rent + 18% VAT). This applies when an agent is involved in the rental process.</p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="font-medium">{formatPrice(rentalAgentFee, 'ILS')}</span>
                  </div>
                )}
                
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {/* Bank Guarantee Badge */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant={bankGuaranteeRequired ? "secondary" : "outline"} className="text-xs cursor-help">
                        Bank Guarantee: {bankGuaranteeRequired === true ? 'Required' : bankGuaranteeRequired === false ? 'Not Required' : 'Check with agent'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="font-medium mb-1">Aravut Bankit</p>
                      <p className="text-xs">Some landlords require a bank-backed guarantee in addition to the security deposit. This is money held by the bank—not a fee you lose.</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Post-dated Checks Badge */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant={checksRequired ? "secondary" : "outline"} className="text-xs cursor-help">
                        Post-dated Checks: {checksRequired === true ? 'Yes' : checksRequired === false ? 'No' : 'Check with agent'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="font-medium mb-1">Chekim Dechuim</p>
                      <p className="text-xs">Post-dated checks for future rent payments are common in Israel. You provide checks covering the full lease term upfront.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
          </TooltipProvider>
          
          {/* Monthly Costs - Progressive disclosure (matching buy page) */}
          <TooltipProvider>
          <Collapsible open={rentalMonthlyOpen} onOpenChange={setRentalMonthlyOpen}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-foreground">Monthly Costs</h4>
                </div>
                <div className="flex items-center gap-3">
                  {city && cityData && (
                    <span className="text-xs text-muted-foreground">{city} rates</span>
                  )}
                  <div className="text-right">
                    <div className="font-bold text-primary">
                      {formatPriceRange(rentalMonthlyRange.low, rentalMonthlyRange.high, 'ILS')}/mo
                    </div>
                  </div>
                </div>
              </div>
              
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ChevronDown className={cn("h-3 w-3 transition-transform", rentalMonthlyOpen && "rotate-180")} />
                  {rentalMonthlyOpen ? 'Hide breakdown' : 'View breakdown'}
                </button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-2 text-sm pt-2">
                {/* Rent */}
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Rent</span>
                  <span className="font-medium">{formatPrice(price, currency)}</span>
                </div>
                
                {/* Arnona - with Oleh discount support */}
                <div className="flex justify-between py-2 border-b border-border/50">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <span className="text-muted-foreground border-b border-dotted border-muted-foreground/50">
                          Arnona {rentalArnonaEstimate.discountPercent > 0 ? '' : '(est.)'}
                        </span>
                        {rentalArnonaEstimate.discountPercent > 0 && (
                          <Badge variant="secondary" className="text-xs bg-accent text-accent-foreground">
                            {rentalArnonaEstimate.discountType}
                          </Badge>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="font-medium mb-1">Municipal Property Tax</p>
                      {rentalArnonaEstimate.discountPercent > 0 ? (
                        <div className="text-xs space-y-1">
                          <p>Base rate: ₪{rentalArnonaEstimate.baseMonthly}/mo</p>
                          <p className="text-primary">Discount: {rentalArnonaEstimate.discountPercent}% ({rentalArnonaEstimate.discountType})</p>
                          {rentalArnonaEstimate.areaLimitApplied && (
                            <p className="text-muted-foreground">Note: Discount applies to first {rentalArnonaEstimate.areaLimitSqm}m² only</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs">Estimate based on {city || 'city'} average rates. Amount depends on apartment size and city zone.</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                  <span className="font-medium">{formatPrice(rentalArnonaEstimate.discountedMonthly, 'ILS')}</span>
                </div>
                
                {/* Va'ad Bayit */}
                <div className="flex justify-between py-2 border-b border-border/50">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <span className="text-muted-foreground border-b border-dotted border-muted-foreground/50">
                          Va'ad Bayit {isVaadActual ? '' : '(est.)'}
                        </span>
                        {isVaadActual && (
                          <Badge variant="secondary" className="text-xs">Actual</Badge>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="font-medium mb-1">Building Maintenance Fee</p>
                      <p className="text-xs">Monthly building maintenance fee covering shared expenses like cleaning, elevator, and common utilities.</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="font-medium">{formatPrice(vaadBayit, 'ILS')}</span>
                </div>
                
                {/* Utilities Estimate */}
                <div className="flex justify-between py-2 border-b border-border/50">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground border-b border-dotted border-muted-foreground/50">
                          Utilities (est.)
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="font-medium mb-1">Electricity, Water & Gas</p>
                      <p className="text-xs">Monthly utility bills. Actual costs vary by season, usage, and household size. Summer A/C and winter heating can significantly increase bills.</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="font-medium text-muted-foreground">
                    {formatPriceRange(utilitiesEstimate.min, utilitiesEstimate.max, 'ILS')}
                  </span>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
          </TooltipProvider>
          
          {/* First Year Total Summary */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">First Year Total</h4>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-right cursor-help">
                    <div className="font-bold text-lg text-primary">
                      {formatPriceRange(firstYearTotalRange.low, firstYearTotalRange.high, 'ILS')}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="font-medium mb-1">Total First Year Cost</p>
                  <p className="text-xs">Upfront costs + 12 months of rent, arnona, va'ad bayit, and estimated utilities. Helps you plan your total budget for the first year of your lease.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            * Estimates based on {city || 'city'} rates. Actual costs may vary.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Cost Breakdown</h3>
      </div>
      
      <div className="space-y-5">
        {/* Unified personalization header - buyer type + mortgage assumptions */}
        {!isLoading && (
          <PersonalizationHeader
            buyerCategoryLabel={getBuyerCategoryLabel(buyerCategory)}
            hasProfile={hasProfile}
            downPaymentPercent={mortgageEstimate.downPaymentPercent}
            termYears={mortgageEstimate.termYears}
            propertyPrice={price}
            ltvLimit={ltvLimit}
            savedProfileDimensions={savedProfileDimensions}
          />
        )}


        {/* Upfront Costs - Progressive disclosure */}
        <TooltipProvider>
        <Collapsible open={oneTimeOpen} onOpenChange={setOneTimeOpen}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">Upfront Costs</h4>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">{formatPriceRange(totalOneTimeRange.low, totalOneTimeRange.high, 'ILS')}</div>
                <div className="text-xs text-muted-foreground">~{oneTimePercentLow}–{oneTimePercentHigh}% of price</div>
              </div>
            </div>
            
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                <ChevronDown className={cn("h-3 w-3 transition-transform", oneTimeOpen && "rotate-180")} />
                {oneTimeOpen ? 'Hide breakdown' : 'View breakdown'}
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-2 text-sm pt-2">
              <div className="flex justify-between py-2 border-b border-border/50">
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <span className="text-muted-foreground border-b border-dotted border-muted-foreground/50">Purchase Tax</span>
                        {effectiveTaxType === 'oleh' && (
                          <Badge variant="secondary" className="ml-2 text-xs bg-primary/10 text-primary">Oleh</Badge>
                        )}
                        {effectiveTaxType === 'first_time' && (
                          <Badge variant="secondary" className="ml-2 text-xs bg-primary/10 text-primary">First-Time</Badge>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">Mas Rechisha (Purchase Tax)</p>
                      <p className="text-xs">
                        Calculated using 2025 tax brackets for {effectiveDerived.label} buyers. 
                        Your {effectiveTaxRate.toFixed(2)}% rate reflects tiered brackets where lower portions are taxed at reduced rates.
                        {taxSavings > 0 && ` Saving ~${formatPrice(taxSavings, 'ILS')} vs. investor rates.`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {effectiveTaxRate.toFixed(2)}% effective
                  </p>
                </div>
                <span className="font-medium">{formatPrice(purchaseTax, 'ILS')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">Lawyer Fees</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Legal Fees</p>
                    <p className="text-xs">
                      Your attorney handles contract review, due diligence, and closing. 
                      {FEE_RANGES.lawyer.label} of price + 18% VAT. Often negotiable based on complexity.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-medium">{formatPriceRange(lawyerFeesRange.low + lawyerVatRange.low, lawyerFeesRange.high + lawyerVatRange.high, 'ILS')}</span>
              </div>
              {isNewConstruction && (
                <div className="flex justify-between py-2 border-b border-border/50">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <span className="text-muted-foreground border-b border-dotted border-muted-foreground/50">Developer Lawyer</span>
                        <Badge variant="outline" className="text-xs">New Build</Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">Developer's Legal Fees</p>
                      <p className="text-xs">
                        New construction requires paying the developer's legal costs. 
                        {FEE_RANGES.developerLawyer.label} of price. This is standard and non-negotiable.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="font-medium">{formatPriceRange(developerLawyerFeesRange.low, developerLawyerFeesRange.high, 'ILS')}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">Agent Fees</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Real Estate Agent Commission</p>
                    <p className="text-xs">
                      Buyer's agent commission. {FEE_RANGES.agent.label} of price + 18% VAT. 
                      Often negotiable, especially on higher-value properties.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-medium">{formatPriceRange(agentFeesRange.low + agentVatRange.low, agentFeesRange.high + agentVatRange.high, 'ILS')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">Other Fees</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Additional Closing Costs</p>
                    <p className="text-xs">
                      Includes: Property appraisal ({formatPrice(FEE_RANGES.appraisal.min, 'ILS')}–{formatPrice(FEE_RANGES.appraisal.max, 'ILS').replace('₪', '')}), 
                      mortgage origination ({formatPrice(FEE_RANGES.mortgageOrigination.min, 'ILS')}–{formatPrice(FEE_RANGES.mortgageOrigination.max, 'ILS').replace('₪', '')}), 
                      and Tabu registration ({formatPrice(FEE_RANGES.registration.min, 'ILS')}–{formatPrice(FEE_RANGES.registration.max, 'ILS').replace('₪', '')}).
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-medium">{formatPriceRange(mortgageFeesRange.low + registrationFeesRange.low, mortgageFeesRange.high + registrationFeesRange.high, 'ILS')}</span>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
        </TooltipProvider>

        {/* Monthly Costs - Progressive disclosure */}
        <TooltipProvider>
        <Collapsible open={monthlyOpen} onOpenChange={setMonthlyOpen}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">Estimated Monthly</h4>
              </div>
              <div className="flex items-center gap-3">
                {city && cityData && (
                  <span className="text-xs text-muted-foreground">{city} rates</span>
                )}
                <div className="text-right">
                  <div className="font-bold text-primary">
                    {formatPrice(mortgageEstimate.monthlyPaymentLow + totalMonthly, 'ILS')}–{formatPrice(mortgageEstimate.monthlyPaymentHigh + totalMonthly, 'ILS').replace('₪', '')}/mo
                  </div>
                </div>
              </div>
            </div>
            
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                <ChevronDown className={cn("h-3 w-3 transition-transform", monthlyOpen && "rotate-180")} />
                {monthlyOpen ? 'Hide breakdown' : 'View breakdown'}
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-2 text-sm pt-2">
              {/* Mortgage Payment Row - Display only, edit happens at the top */}
              <div className="py-2 border-b border-border/50">
                <div className="flex justify-between items-start">
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                          <Home className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground border-b border-dotted border-muted-foreground/50">Mortgage</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-medium mb-1">Monthly Payment Estimate</p>
                        <p className="text-xs">
                          Based on {mortgageEstimate.downPaymentPercent}% down payment ({formatPrice(mortgageEstimate.downPayment, 'ILS')}), 
                          {mortgageEstimate.termYears}-year term, and typical rates of 4.5%–6.0%. 
                          Adjust assumptions in the panel above.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mortgageEstimate.downPaymentPercent}% down · {mortgageEstimate.termYears}yr
                    </p>
                  </div>
                  <span className="font-medium">
                    {formatPrice(mortgageEstimate.monthlyPaymentLow, 'ILS')}–{formatPrice(mortgageEstimate.monthlyPaymentHigh, 'ILS').replace('₪', '')}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between py-2 border-b border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">Arnona</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Municipal Property Tax</p>
                    <p className="text-xs">
                      {cityData 
                        ? `Based on official 2025 ${city} rates (~₪${cityData.arnona_rate_sqm?.toFixed(0) || 70}/sqm annually). Actual varies by zone and property classification.`
                        : 'Estimated based on typical Israeli municipal rates. Actual varies by city, zone, and property type.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-medium">{formatPrice(arnona, 'ILS')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-help">
                      <span className="text-muted-foreground border-b border-dotted border-muted-foreground/50">Va'ad Bayit</span>
                      {isVaadActual && (
                        <Badge variant="secondary" className="text-xs">Actual</Badge>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Building Maintenance Fee</p>
                    <p className="text-xs">
                      {isVaadActual 
                        ? 'Amount as listed by the seller. Covers shared maintenance, cleaning, elevator, building insurance.'
                        : `Estimated based on typical ${city || 'building'} fees. Covers shared maintenance, cleaning, and building insurance. Actual varies by building.`}
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-medium">{formatPrice(vaadBayit, 'ILS')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">Insurance</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Home Insurance</p>
                    <p className="text-xs">
                      Basic structure and contents insurance estimate. Actual cost depends on coverage level, building age, location, and provider.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-medium">{formatPrice(insurance, 'ILS')}</span>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
        </TooltipProvider>
        
        <p className="text-xs text-muted-foreground">
          * Based on 2025 tax brackets{cityData ? ` and ${city} municipal rates` : ''}. Actual costs may vary.
        </p>
      </div>
    </div>
  );
}
