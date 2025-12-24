import { useState, useMemo } from 'react';
import { Calculator, DollarSign, Receipt, Calendar, Info, Settings, MapPin, TrendingUp, Building2 } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { useBuyerProfile, getBuyerTaxCategory, getBuyerCategoryLabel } from '@/hooks/useBuyerProfile';
import { usePurchaseTaxBrackets } from '@/hooks/usePurchaseTaxBrackets';
import { useCityDetails } from '@/hooks/useCityDetails';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

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
  
  // Other one-time costs
  const lawyerFees = price * 0.005; // ~0.5%
  const lawyerVat = lawyerFees * 0.17;
  const agentFees = price * 0.02; // ~2%
  const agentVat = agentFees * 0.17;
  
  // Fixed mortgage & registration fees per PDF research:
  // Appraisal: ₪1,500, Origination: ₪360, Tabu registration: ₪500
  const appraisalFee = 1500;
  const originationFee = 360;
  const registrationFees = 500;
  const mortgageFees = appraisalFee + originationFee; // Total: ₪1,860
  
  // Developer lawyer fees for new construction
  const developerLawyerFees = isNewConstruction ? price * 0.015 : 0;
  
  const totalOneTime = purchaseTax + lawyerFees + lawyerVat + agentFees + agentVat + 
                       mortgageFees + registrationFees + developerLawyerFees;

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
      <CollapsibleSection 
        title="Cost Breakdown" 
        icon={<Calculator className="h-5 w-5" />}
        defaultOpen={true}
      >
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
            <div className="flex justify-between py-3 bg-muted/30 px-3 rounded-lg mt-3">
              <span className="font-semibold">Total Monthly</span>
              <span className="font-bold text-primary">{formatPrice(price + arnona + vaadBayit, currency)}</span>
            </div>
          </div>
        </div>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection 
      title="Cost Breakdown" 
      icon={<Calculator className="h-5 w-5" />}
      defaultOpen={true}
    >
      <div className="space-y-5">
        {/* Show personalization prompt if no profile set */}
        {!hasProfile && !isLoading && <ProfilePrompt />}
        
        {/* Buyer category indicator if profile exists */}
        {hasProfile && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
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

        {/* Tax Savings Alert */}
        {taxSavings > 10000 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-700 dark:text-green-400">
                You save {formatPrice(taxSavings, 'ILS')} vs investor rates!
              </p>
              <p className="text-xs text-green-600/80 dark:text-green-500/80">
                {getBuyerCategoryLabel(buyerCategory)} benefits applied
              </p>
            </div>
          </div>
        )}

        {/* One-Time Costs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-foreground">One-Time Costs</h4>
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
              <div>
                <span className="text-muted-foreground">Lawyer Fees (~0.5% + VAT)</span>
              </div>
              <span className="font-medium">{formatPrice(lawyerFees + lawyerVat, 'ILS')}</span>
            </div>
            {isNewConstruction && (
              <div className="flex justify-between py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Developer Lawyer Fee</span>
                  <Badge variant="outline" className="text-xs">New Build</Badge>
                </div>
                <span className="font-medium">{formatPrice(developerLawyerFees, 'ILS')}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Agent Fees (~2% + VAT)</span>
              <span className="font-medium">{formatPrice(agentFees + agentVat, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Mortgage & Registration Fees</span>
              <span className="font-medium">{formatPrice(mortgageFees + registrationFees, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-3 bg-muted/30 px-3 rounded-lg mt-2">
              <span className="font-semibold">Total One-Time</span>
              <span className="font-bold text-primary">{formatPrice(totalOneTime, 'ILS')}</span>
            </div>
          </div>
        </div>

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
            <div className="flex justify-between py-3 bg-muted/30 px-3 rounded-lg mt-2">
              <span className="font-semibold">Total Monthly (excl. mortgage)</span>
              <span className="font-bold text-primary">{formatPrice(totalMonthly, 'ILS')}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          * Based on 2025 tax brackets{cityData ? ` and ${city} municipal rates` : ''}. Actual costs may vary.
        </p>
      </div>
    </CollapsibleSection>
  );
}
