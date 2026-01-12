import { useState, useMemo } from 'react';
import { Calculator, DollarSign, Receipt, Calendar, Info, Settings, MapPin, TrendingUp, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { useBuyerProfile, getBuyerTaxCategory, getBuyerCategoryLabel } from '@/hooks/useBuyerProfile';
import { usePurchaseTaxBrackets } from '@/hooks/usePurchaseTaxBrackets';
import { useCityDetails } from '@/hooks/useCityDetails';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { FEE_RANGES, formatPriceRange } from '@/lib/utils/formatRange';

interface PropertyCostBreakdownProps {
  price: number;
  currency: string;
  listingStatus: string;
  city?: string;
  sizeSqm?: number;
  isNewConstruction?: boolean;
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
  isNewConstruction = false
}: PropertyCostBreakdownProps) {
  const { user } = useAuth();
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
    low: Math.round(lawyerFeesRange.low * 0.17),
    high: Math.round(lawyerFeesRange.high * 0.17),
  };
  
  // Agent fees: 1.5-2.5% (negotiable)
  const agentFeesRange = {
    low: Math.round(price * FEE_RANGES.agent.min),
    high: Math.round(price * FEE_RANGES.agent.max),
  };
  const agentVatRange = {
    low: Math.round(agentFeesRange.low * 0.17),
    high: Math.round(agentFeesRange.high * 0.17),
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
  
  const vaadBayit = cityData?.average_vaad_bayit || 300;
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

  // Profile prompt banner
  const ProfilePrompt = () => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
      <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <p className="text-sm text-foreground">
          {user ? (
            <>Costs shown for <span className="font-medium">{getBuyerCategoryLabel(buyerCategory)}</span> (default)</>
          ) : (
            <>Assuming <span className="font-medium">First-Time Buyer</span> rates</>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {user ? (
            'Set your buyer profile for personalized calculations'
          ) : (
            'Sign up to get personalized tax calculations'
          )}
        </p>
      </div>
      {user ? (
        <Link to="/profile">
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
            <Settings className="h-3.5 w-3.5" />
            Personalize
          </Button>
        </Link>
      ) : (
        <Link to="/auth?tab=signup">
          <Button variant="ghost" size="sm" className="h-8 text-xs">
            Sign Up
          </Button>
        </Link>
      )}
    </div>
  );

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
        {/* Show personalization prompt if no profile set */}
        {!hasProfile && !isLoading && <ProfilePrompt />}
        
        {/* Buyer category indicator if profile exists */}
        {hasProfile && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">
                Calculating for: <span className="font-medium">{getBuyerCategoryLabel(buyerCategory)}</span>
              </span>
            </div>
            <Link to="/profile">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Change
              </Button>
            </Link>
          </div>
        )}


        {/* One-Time Costs - Now with honest ranges */}
        <TooltipProvider>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-foreground">One-Time Costs</h4>
            <Badge variant="outline" className="text-xs ml-auto">Ranges reflect negotiation</Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border/50">
              <div>
                <span className="text-muted-foreground">Purchase Tax (Mas Rechisha)</span>
                {buyerCategory === 'oleh' && (
                  <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">Oleh rate</Badge>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  Effective rate: {effectiveTaxRate.toFixed(2)}%
                </p>
              </div>
              <span className="font-medium">{formatPrice(purchaseTax, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <span className="text-muted-foreground border-b border-dotted border-muted-foreground/50">Lawyer Fees ({FEE_RANGES.lawyer.label} + VAT)</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Varies by transaction complexity and negotiation. Simple deals at lower end, complex deals higher.</p>
                </TooltipContent>
              </Tooltip>
              <span className="font-medium">{formatPriceRange(lawyerFeesRange.low + lawyerVatRange.low, lawyerFeesRange.high + lawyerVatRange.high, 'ILS')}</span>
            </div>
            {isNewConstruction && (
              <div className="flex justify-between py-2 border-b border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-help">
                      <span className="text-muted-foreground border-b border-dotted border-muted-foreground/50">Developer Lawyer Fee ({FEE_RANGES.developerLawyer.label})</span>
                      <Badge variant="outline" className="text-xs">New Build</Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Required for new construction. Covers contract review and registration with developer.</p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-medium">{formatPriceRange(developerLawyerFeesRange.low, developerLawyerFeesRange.high, 'ILS')}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-border/50">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <span className="text-muted-foreground border-b border-dotted border-muted-foreground/50">Agent Fees ({FEE_RANGES.agent.label} + VAT)</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Negotiable. In competitive markets, may be lower or shared with seller.</p>
                </TooltipContent>
              </Tooltip>
              <span className="font-medium">{formatPriceRange(agentFeesRange.low + agentVatRange.low, agentFeesRange.high + agentVatRange.high, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <span className="text-muted-foreground border-b border-dotted border-muted-foreground/50">Mortgage & Registration Fees</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Includes appraisal ({FEE_RANGES.appraisal.label}), origination ({FEE_RANGES.mortgageOrigination.label}), and Tabu registration ({FEE_RANGES.registration.label}).</p>
                </TooltipContent>
              </Tooltip>
              <span className="font-medium">{formatPriceRange(mortgageFeesRange.low + registrationFeesRange.low, mortgageFeesRange.high + registrationFeesRange.high, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-3 bg-muted/30 px-3 rounded-xl mt-2">
              <span className="font-semibold">Total One-Time Range</span>
              <span className="font-bold text-primary">{formatPriceRange(totalOneTimeRange.low, totalOneTimeRange.high, 'ILS')}</span>
            </div>
          </div>
        </div>
        </TooltipProvider>

        {/* Monthly Costs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-foreground">Estimated Monthly</h4>
            {city && cityData && (
              <Badge variant="outline" className="text-xs ml-auto">
                <MapPin className="h-3 w-3 mr-1" />
                {city} rates
              </Badge>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border/50">
              <div>
                <span className="text-muted-foreground">Arnona (monthly)</span>
                {sizeSqm && cityData?.arnona_rate_sqm && (
                  <p className="text-xs text-muted-foreground">
                    ₪{cityData.arnona_rate_sqm}/sqm/yr × {sizeSqm}sqm ÷ 12
                  </p>
                )}
              </div>
              <span className="font-medium">{formatPrice(arnona, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Va'ad Bayit</span>
              <span className="font-medium">{formatPrice(vaadBayit, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Home Insurance</span>
              <span className="font-medium">{formatPrice(insurance, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-3 bg-muted/30 px-3 rounded-xl mt-2">
              <span className="font-semibold">Total Monthly (excl. mortgage)</span>
              <span className="font-bold text-primary">{formatPrice(totalMonthly, 'ILS')}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          * Based on 2025 tax brackets{cityData ? ` and ${city} municipal rates` : ''}. Actual costs may vary.
        </p>
      </div>
    </div>
  );
}
