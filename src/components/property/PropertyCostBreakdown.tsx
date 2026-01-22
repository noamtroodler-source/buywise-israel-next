import { useState, useMemo } from 'react';
import { Calculator, Receipt, Calendar, Home, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { useBuyerProfile, getBuyerTaxCategory, getBuyerCategoryLabel } from '@/hooks/useBuyerProfile';
import { usePurchaseTaxBrackets } from '@/hooks/usePurchaseTaxBrackets';
import { useCityDetails } from '@/hooks/useCityDetails';
import { useMortgageEstimate, useMortgagePreferences } from '@/hooks/useMortgagePreferences';
import { PersonalizationHeader } from './PersonalizationHeader';
import { FEE_RANGES, formatPriceRange } from '@/lib/utils/formatRange';
import { cn } from '@/lib/utils';

interface PropertyCostBreakdownProps {
  price: number;
  currency: string;
  listingStatus: string;
  city?: string;
  sizeSqm?: number;
  isNewConstruction?: boolean;
  vaadBayitMonthly?: number | null;
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

// Map buyer category to tax bracket buyer_type
function mapCategoryToTaxType(category: 'first_time' | 'oleh' | 'additional' | 'non_resident'): string {
  switch (category) {
    case 'first_time': return 'first_time';
    case 'oleh': return 'oleh';
    case 'additional':
    case 'non_resident': return 'investor';
    default: return 'first_time';
  }
}

export function PropertyCostBreakdown({ 
  price, 
  currency, 
  listingStatus, 
  city,
  sizeSqm,
  isNewConstruction = false,
  vaadBayitMonthly
}: PropertyCostBreakdownProps) {
  const { data: buyerProfile, isLoading } = useBuyerProfile();
  const formatPrice = useFormatPrice();
  
  // Get buyer category from profile
  const buyerCategory = getBuyerTaxCategory(buyerProfile);
  const hasProfile = !!buyerProfile?.onboarding_completed;
  
  // Fetch tax brackets from database
  const taxType = mapCategoryToTaxType(buyerCategory);
  const { data: taxBrackets } = usePurchaseTaxBrackets(taxType);
  
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
  
  const taxSavings = buyerCategory !== 'additional' && buyerCategory !== 'non_resident' 
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

  if (listingStatus === 'for_rent') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Cost Breakdown</h3>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Monthly Costs (Estimates)</h4>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Rent</span>
              <span className="font-medium">{formatPrice(price, currency)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Arnona</span>
                {cityData && (
                  <Badge variant="outline" className="text-xs">{city}</Badge>
                )}
              </div>
              <span className="font-medium">{formatPrice(arnona, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Va'ad Bayit</span>
              <span className="font-medium">{formatPrice(vaadBayit, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-3 bg-muted/30 px-3 rounded-xl mt-3">
              <span className="font-semibold">Total Monthly</span>
              <span className="font-bold text-primary">{formatPrice(price + arnona + vaadBayit, currency)}</span>
            </div>
          </div>
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
          />
        )}


        {/* One-Time Costs - Progressive disclosure */}
        <TooltipProvider>
        <Collapsible open={oneTimeOpen} onOpenChange={setOneTimeOpen}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">One-Time Costs</h4>
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
                  <span className="text-muted-foreground">Purchase Tax</span>
                  {buyerCategory === 'oleh' && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-primary/10 text-primary">Oleh</Badge>
                  )}
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
                    <p>{FEE_RANGES.lawyer.label} + 18% VAT. Varies by complexity.</p>
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
                      <p>{FEE_RANGES.developerLawyer.label}. Required for new construction.</p>
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
                    <p>{FEE_RANGES.agent.label} + VAT. Negotiable.</p>
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
                    <p>Appraisal, mortgage origination & Tabu registration.</p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-medium">{formatPriceRange(mortgageFeesRange.low + registrationFeesRange.low, mortgageFeesRange.high + registrationFeesRange.high, 'ILS')}</span>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
        </TooltipProvider>

        {/* Monthly Costs - Progressive disclosure */}
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
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">Mortgage</span>
                    </div>
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
                <span className="text-muted-foreground">Arnona</span>
                <span className="font-medium">{formatPrice(arnona, 'ILS')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Va'ad Bayit</span>
                  {isVaadActual && (
                    <Badge variant="secondary" className="text-xs">Actual</Badge>
                  )}
                </div>
                <span className="font-medium">{formatPrice(vaadBayit, 'ILS')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Insurance</span>
                <span className="font-medium">{formatPrice(insurance, 'ILS')}</span>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
        
        <p className="text-xs text-muted-foreground">
          * Based on 2025 tax brackets{cityData ? ` and ${city} municipal rates` : ''}. Actual costs may vary.
        </p>
      </div>
    </div>
  );
}
