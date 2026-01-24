import { useState, useMemo, useEffect } from 'react';
import { Calculator, Receipt, Shield, ChevronDown, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { useBuyerProfile, getBuyerTaxCategory, getBuyerCategoryLabel, profileToDimensions } from '@/hooks/useBuyerProfile';
import { usePurchaseTaxBrackets } from '@/hooks/usePurchaseTaxBrackets';
import { useMortgageEstimate, useMortgagePreferences } from '@/hooks/useMortgagePreferences';
import { PersonalizationHeader } from '@/components/property/PersonalizationHeader';
import { FEE_RANGES, VAT_RATE, formatPriceRange } from '@/lib/utils/formatRange';
import { cn } from '@/lib/utils';
import { deriveEffectiveBuyerType } from '@/lib/calculations/buyerProfile';
import { ProjectUnit } from '@/types/projects';

interface ProjectCostBreakdownProps {
  units: ProjectUnit[];
  defaultPrice?: number;
  currency?: string;
}

interface UnitOption {
  type: string;
  price: number;
  label: string;
}

// Calculate tax using actual brackets from DB or fallback
function calculateTaxFromBrackets(
  price: number, 
  brackets: Array<{ bracket_min: number; bracket_max: number | null; rate_percent: number }> | undefined
): number {
  if (!brackets || brackets.length === 0) {
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

function mapCategoryToTaxType(category: 'first_time' | 'oleh' | 'additional' | 'non_resident'): string {
  switch (category) {
    case 'first_time': return 'first_time';
    case 'oleh': return 'oleh';
    case 'additional':
    case 'non_resident': return 'investor';
    default: return 'first_time';
  }
}

export function ProjectCostBreakdown({ units, defaultPrice = 0, currency = 'ILS' }: ProjectCostBreakdownProps) {
  const { data: buyerProfile, isLoading } = useBuyerProfile();
  const formatPrice = useFormatPrice();
  const { includeMortgage, ltvLimit } = useMortgagePreferences();
  
  // Get saved profile dimensions
  const savedProfileDimensions = useMemo(() => profileToDimensions(buyerProfile), [buyerProfile]);
  const effectiveDerived = useMemo(() => deriveEffectiveBuyerType(savedProfileDimensions), [savedProfileDimensions]);
  
  // Build unit options for selector
  const unitOptions = useMemo<UnitOption[]>(() => {
    const groups: Record<string, UnitOption> = {};
    
    units.forEach(unit => {
      const type = unit.unit_type;
      if (!groups[type] || (unit.price && unit.price < groups[type].price)) {
        groups[type] = {
          type,
          price: unit.price || 0,
          label: `${type} (from ${formatPrice(unit.price || 0, 'ILS')})`,
        };
      }
    });
    
    return Object.values(groups).sort((a, b) => a.price - b.price);
  }, [units, formatPrice]);

  // Fix state management for unit selection
  const [selectedType, setSelectedType] = useState<string>('');
  
  // Initialize selected type when options load
  useEffect(() => {
    if (unitOptions.length > 0 && !selectedType) {
      setSelectedType(unitOptions[0].type);
    }
  }, [unitOptions, selectedType]);
  
  const selectedOption = unitOptions.find(o => o.type === selectedType) || unitOptions[0];
  const price = selectedOption?.price || defaultPrice;
  
  // Get mortgage estimate for the selected price
  const mortgageEstimate = useMortgageEstimate(price);
  
  const buyerCategory = getBuyerTaxCategory(buyerProfile);
  const hasProfile = !!buyerProfile?.onboarding_completed;
  
  const taxType = mapCategoryToTaxType(buyerCategory);
  const { data: taxBrackets } = usePurchaseTaxBrackets(taxType);
  
  const purchaseTax = useMemo(() => {
    return calculateTaxFromBrackets(price, taxBrackets);
  }, [price, taxBrackets]);
  
  // State for collapsible sections
  const [upfrontOpen, setUpfrontOpen] = useState(false);
  const [monthlyOpen, setMonthlyOpen] = useState(false);
  
  // Estimate apartment size from price (rough: ₪25-35k per sqm in new construction)
  const estimatedSizeSqm = Math.round(price / 30000);
  
  // Monthly cost ranges
  const arnonaRange = {
    low: Math.round(estimatedSizeSqm * 70 / 12),
    high: Math.round(estimatedSizeSqm * 120 / 12),
  };
  
  const vaadBayitRange = {
    low: 300,
    high: 600,
  };
  
  const insuranceRange = {
    low: 100,
    high: 200,
  };
  
  // Total monthly ownership (without mortgage)
  const monthlyOwnershipRange = {
    low: arnonaRange.low + vaadBayitRange.low + insuranceRange.low,
    high: arnonaRange.high + vaadBayitRange.high + insuranceRange.high,
  };
  
  // Total monthly (with mortgage if enabled)
  const totalMonthlyRange = includeMortgage ? {
    low: monthlyOwnershipRange.low + (mortgageEstimate.monthlyPaymentLow || 0),
    high: monthlyOwnershipRange.high + (mortgageEstimate.monthlyPaymentHigh || 0),
  } : monthlyOwnershipRange;
  
  // New construction specific costs - using honest ranges
  const lawyerFeesRange = {
    low: Math.round(price * FEE_RANGES.lawyer.min * (1 + VAT_RATE)),
    high: Math.round(price * FEE_RANGES.lawyer.max * (1 + VAT_RATE)),
  };
  
  // Developer lawyer: 1-2% + VAT (new construction standard)
  const developerLawyerFeesRange = {
    low: Math.round(price * FEE_RANGES.developerLawyer.min * (1 + VAT_RATE)),
    high: Math.round(price * FEE_RANGES.developerLawyer.max * (1 + VAT_RATE)),
  };
  
  // Other fees (registration, mortgage if applicable)
  const otherFeesRange = includeMortgage ? {
    low: FEE_RANGES.registration.min + FEE_RANGES.appraisal.min + FEE_RANGES.mortgageOrigination.min,
    high: FEE_RANGES.registration.max + FEE_RANGES.appraisal.max + FEE_RANGES.mortgageOrigination.max,
  } : {
    low: FEE_RANGES.registration.min,
    high: FEE_RANGES.registration.max,
  };

  // Total upfront range
  const totalUpfrontRange = {
    low: purchaseTax + lawyerFeesRange.low + developerLawyerFeesRange.low + otherFeesRange.low,
    high: purchaseTax + lawyerFeesRange.high + developerLawyerFeesRange.high + otherFeesRange.high,
  };
  
  // Calculate % of purchase price for context
  const upfrontPercentLow = price > 0 ? ((totalUpfrontRange.low / price) * 100).toFixed(1) : '0';
  const upfrontPercentHigh = price > 0 ? ((totalUpfrontRange.high / price) * 100).toFixed(1) : '0';

  // First payment at signing
  const firstPaymentPercent = 10;
  const firstPaymentAmount = price * (firstPaymentPercent / 100);
  
  // Due at signing = first payment + all upfront fees
  const dueAtSigningRange = {
    low: firstPaymentAmount + totalUpfrontRange.low,
    high: firstPaymentAmount + totalUpfrontRange.high,
  };
  
  const dueAtSigningPercentLow = price > 0 ? ((dueAtSigningRange.low / price) * 100).toFixed(0) : '0';
  const dueAtSigningPercentHigh = price > 0 ? ((dueAtSigningRange.high / price) * 100).toFixed(0) : '0';


  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Cost Breakdown</h3>
      </div>
      
      {/* PersonalizationHeader */}
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

      {/* Unit Type Selector - ToggleGroup style */}
      {unitOptions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Unit Type
          </Label>
          <ToggleGroup
            type="single"
            value={selectedType}
            onValueChange={(val) => val && setSelectedType(val)}
            className="flex flex-wrap gap-2"
          >
            {unitOptions.map((option) => (
              <ToggleGroupItem 
                key={option.type}
                value={option.type}
                className="px-4 py-2 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
              >
                {option.type}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          
          {/* Selected Unit Price Display */}
          <p className="text-sm text-muted-foreground">
            {formatPrice(price, currency)} · {selectedOption?.type}
          </p>
        </div>
      )}

      {/* Summary Banner - Both Key Numbers */}
      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">At Signing</p>
            <p className="text-lg font-bold text-primary">
              {formatPriceRange(dueAtSigningRange.low, dueAtSigningRange.high, 'ILS')}
            </p>
            <p className="text-xs text-muted-foreground">
              10% + fees
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly</p>
            <p className="text-lg font-bold text-primary">
              {formatPriceRange(totalMonthlyRange.low, totalMonthlyRange.high, 'ILS')}/mo
            </p>
            <p className="text-xs text-muted-foreground">
              After delivery
            </p>
          </div>
        </div>
      </div>

      {/* Due at Signing Breakdown - Collapsible */}
      <TooltipProvider>
        <Collapsible open={upfrontOpen} onOpenChange={setUpfrontOpen}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">Due at Contract Signing</h4>
              </div>
              <span className="text-sm font-medium text-primary">
                {formatPriceRange(dueAtSigningRange.low, dueAtSigningRange.high, 'ILS')}
              </span>
            </div>
            
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                <ChevronDown className={cn("h-3 w-3 transition-transform", upfrontOpen && "rotate-180")} />
                {upfrontOpen ? 'Hide details' : 'View details'}
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-2 text-sm pt-2">
              {/* First Payment (10%) */}
              <div className="flex justify-between py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">First Payment (10%)</span>
                  <Badge variant="outline" className="text-xs">At Signing</Badge>
                </div>
                <span className="font-medium">{formatPrice(firstPaymentAmount, 'ILS')}</span>
              </div>
              
              {/* Purchase Tax */}
              <div className="flex justify-between py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                        Purchase Tax
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="font-medium mb-1">Mas Rechisha (Purchase Tax)</p>
                      <p className="text-xs">Progressive tax on property purchase. Rate depends on buyer status (first-time, oleh, investor).</p>
                    </TooltipContent>
                  </Tooltip>
                  {effectiveDerived.taxType === 'first_time' && (
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">First-Time</Badge>
                  )}
                  {effectiveDerived.taxType === 'oleh' && (
                    <Badge variant="secondary" className="text-xs bg-accent/50 text-accent-foreground">Oleh</Badge>
                  )}
                </div>
                <span className="font-medium">{formatPrice(purchaseTax, 'ILS')}</span>
              </div>
              
              {/* Your Lawyer */}
              <div className="flex justify-between py-2 border-b border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                      Your Lawyer (0.5–1% + VAT)
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="font-medium mb-1">Legal Representation</p>
                    <p className="text-xs">Your personal lawyer to review contracts, conduct due diligence, and protect your interests. Rate varies by complexity.</p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-medium">
                  {formatPriceRange(lawyerFeesRange.low, lawyerFeesRange.high, 'ILS')}
                </span>
              </div>
              
              {/* Developer Lawyer */}
              <div className="flex justify-between py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                        Developer Lawyer (1–2% + VAT)
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="font-medium mb-1">Developer's Legal Fees</p>
                      <p className="text-xs">In new construction, buyers typically pay for the developer's legal costs. This is standard practice in Israel.</p>
                    </TooltipContent>
                  </Tooltip>
                  <Badge variant="outline" className="text-xs">New Build</Badge>
                </div>
                <span className="font-medium">
                  {formatPriceRange(developerLawyerFeesRange.low, developerLawyerFeesRange.high, 'ILS')}
                </span>
              </div>
              
              {/* Other Fees */}
              <div className="flex justify-between py-2 border-b border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                      Other Fees {includeMortgage && '(incl. mortgage)'}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="font-medium mb-1">Additional Closing Costs</p>
                    <p className="text-xs">
                      Includes land registration (₪{FEE_RANGES.registration.min}–{FEE_RANGES.registration.max})
                      {includeMortgage && `, mortgage appraisal (₪${FEE_RANGES.appraisal.min}–${FEE_RANGES.appraisal.max}), and bank origination fees`}.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-medium">
                  {formatPriceRange(otherFeesRange.low, otherFeesRange.high, 'ILS')}
                </span>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </TooltipProvider>

      {/* Monthly Costs Section */}
      <TooltipProvider>
        <Collapsible open={monthlyOpen} onOpenChange={setMonthlyOpen}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">Monthly Costs</h4>
                <Badge variant="outline" className="text-xs">After Key Delivery</Badge>
              </div>
              <span className="text-sm font-medium text-primary">
                {formatPriceRange(totalMonthlyRange.low, totalMonthlyRange.high, 'ILS')}/mo
              </span>
            </div>
            
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                <ChevronDown className={cn("h-3 w-3 transition-transform", monthlyOpen && "rotate-180")} />
                {monthlyOpen ? 'Hide breakdown' : 'View breakdown'}
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-2 text-sm pt-2">
              {/* Mortgage (if enabled) */}
              {includeMortgage && (
                <div className="py-2 border-b border-border/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-medium text-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                            Mortgage
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="font-medium mb-1">Monthly Payment Estimate</p>
                          <p className="text-xs">
                            Based on {mortgageEstimate.downPaymentPercent}% down payment, {mortgageEstimate.termYears}-year term, and typical rates of 4.5%–6.0%. 
                            Mortgage is typically disbursed at key delivery stage in new construction.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <p className="text-xs text-muted-foreground">
                        {mortgageEstimate.downPaymentPercent}% down · {mortgageEstimate.termYears}yr
                      </p>
                    </div>
                    <span className="font-medium">
                      {formatPriceRange(mortgageEstimate.monthlyPaymentLow || 0, mortgageEstimate.monthlyPaymentHigh || 0, 'ILS')}/mo
                    </span>
                  </div>
                </div>
              )}
              
              {/* Arnona */}
              <div className="flex justify-between py-2 border-b border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                      Arnona
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="font-medium mb-1">Municipal Property Tax</p>
                    <p className="text-xs">
                      Monthly tax paid to the city. Rate varies by city and property size. 
                      Estimate based on ~{estimatedSizeSqm} sqm at typical rates.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-medium">
                  {formatPriceRange(arnonaRange.low, arnonaRange.high, 'ILS')}/mo
                </span>
              </div>
              
              {/* Va'ad Bayit */}
              <div className="flex justify-between py-2 border-b border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                      Va'ad Bayit
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="font-medium mb-1">Building Maintenance Fee</p>
                    <p className="text-xs">
                      Monthly fee for building maintenance, cleaning, elevator, lobby, etc. 
                      New construction typically has higher fees due to premium amenities.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-medium">
                  {formatPriceRange(vaadBayitRange.low, vaadBayitRange.high, 'ILS')}/mo
                </span>
              </div>
              
              {/* Insurance */}
              <div className="flex justify-between py-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                      Home Insurance
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="font-medium mb-1">Structure & Contents Insurance</p>
                    <p className="text-xs">
                      Recommended coverage for your home and belongings. 
                      Required if you have a mortgage.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-medium">
                  {formatPriceRange(insuranceRange.low, insuranceRange.high, 'ILS')}/mo
                </span>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </TooltipProvider>

      {/* Buyer Protections */}
      <div className="space-y-3 pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h4 className="font-medium text-foreground">Buyer Protections</h4>
        </div>
        <TooltipProvider>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help border-b border-dotted border-muted-foreground/50">
                      Bank Guarantee
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-medium mb-1">Aravut Bankit</p>
                    <p className="text-xs">Israeli law requires developers to provide bank guarantees protecting your payments until the property is registered in your name.</p>
                  </TooltipContent>
                </Tooltip>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>1-Year Warranty</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help border-b border-dotted border-muted-foreground/50">
                      Staged Payments
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-medium mb-1">Milestone-Based Payments</p>
                    <p className="text-xs">Pay in milestones as construction progresses, typically 10/15/25/50% at key stages.</p>
                  </TooltipContent>
                </Tooltip>
              </span>
            </li>
          </ul>
        </TooltipProvider>
      </div>

      <p className="text-xs text-muted-foreground">
        * Based on 2026 tax brackets. Payment schedules vary by developer. Always verify with your lawyer.
      </p>
    </div>
  );
}
