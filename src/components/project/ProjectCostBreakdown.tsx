import { useMemo } from 'react';
import { Calculator, Receipt, Calendar, Info, Settings, HelpCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { useBuyerProfile, getBuyerTaxCategory, getBuyerCategoryLabel } from '@/hooks/useBuyerProfile';
import { usePurchaseTaxBrackets } from '@/hooks/usePurchaseTaxBrackets';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
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
  const { user } = useAuth();
  const { data: buyerProfile, isLoading } = useBuyerProfile();
  const formatPrice = useFormatPrice();
  
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

  const [selectedType, setSelectedType] = useMemo(() => {
    const initial = unitOptions[0]?.type || '';
    return [initial, (val: string) => val];
  }, [unitOptions]);
  
  // Use state for selected unit type
  const selectedOption = unitOptions.find(o => o.type === selectedType) || unitOptions[0];
  const price = selectedOption?.price || defaultPrice;
  
  const buyerCategory = getBuyerTaxCategory(buyerProfile);
  const hasProfile = !!buyerProfile?.onboarding_completed;
  
  const taxType = mapCategoryToTaxType(buyerCategory);
  const { data: taxBrackets } = usePurchaseTaxBrackets(taxType);
  
  const purchaseTax = useMemo(() => {
    return calculateTaxFromBrackets(price, taxBrackets);
  }, [price, taxBrackets]);
  
  // New construction specific costs
  const lawyerFees = price * 0.005;
  const lawyerVat = lawyerFees * 0.18; // VAT 18% as of Jan 2025
  const developerLawyerFees = price * 0.015;
  const developerLawyerVat = developerLawyerFees * 0.18; // VAT 18% as of Jan 2025
  const registrationFees = 500;
  
  const totalOneTime = purchaseTax + lawyerFees + lawyerVat + developerLawyerFees + developerLawyerVat + registrationFees;

  // Payment schedule (typical for new construction)
  const paymentSchedule = [
    { stage: 'Contract Signing', percent: 10, amount: price * 0.10 },
    { stage: 'Foundation Complete', percent: 15, amount: price * 0.15 },
    { stage: 'Structure Complete', percent: 25, amount: price * 0.25 },
    { stage: 'Key Delivery', percent: 50, amount: price * 0.50 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Cost Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Unit Type Selector */}
        {unitOptions.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Unit Type</label>
            <Select 
              value={selectedOption?.type || ''} 
              onValueChange={(val) => {
                // This is a controlled component workaround
                const event = new CustomEvent('unitTypeChange', { detail: val });
                window.dispatchEvent(event);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a unit type" />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.map((option) => (
                  <SelectItem key={option.type} value={option.type}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Selected Unit Price */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Unit Price</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(price, currency)}</p>
            </div>
            {selectedOption && (
              <Badge variant="outline" className="font-normal">
                {selectedOption.type}
              </Badge>
            )}
          </div>
        </div>

        {/* Profile Banner */}
        {!hasProfile && !isLoading && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm">
                {user ? (
                  <>Costs shown for <span className="font-medium">{getBuyerCategoryLabel(buyerCategory)}</span> (default)</>
                ) : (
                  <>Assuming <span className="font-medium">First-Time Buyer</span> rates</>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Set your buyer profile for personalized calculations
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
                <Button variant="ghost" size="sm" className="h-8 text-xs">Sign Up</Button>
              </Link>
            )}
          </div>
        )}

        {/* One-Time Costs */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            One-Time Costs
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border/50">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1.5 text-muted-foreground cursor-help">
                    Purchase Tax (Mas Rechisha)
                    <HelpCircle className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    <p>Progressive tax on property purchase. Rate depends on buyer status (first-time, oleh, investor).</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="font-medium">{formatPrice(purchaseTax, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Your Lawyer (~0.5% + VAT)</span>
              <span className="font-medium">{formatPrice(lawyerFees + lawyerVat, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1.5 text-muted-foreground cursor-help">
                    Developer Lawyer Fee (~1.5% + VAT)
                    <HelpCircle className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    <p>In new construction, buyers typically pay for the developer's legal costs. This is standard practice in Israel.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="font-medium">{formatPrice(developerLawyerFees + developerLawyerVat, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Registration Fees</span>
              <span className="font-medium">{formatPrice(registrationFees, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-3 bg-muted/30 px-3 rounded-lg mt-2">
              <span className="font-semibold">Total Additional Costs</span>
              <span className="font-bold text-primary">{formatPrice(totalOneTime, 'ILS')}</span>
            </div>
          </div>
        </div>

        {/* Payment Schedule */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Typical Payment Schedule
            <Badge variant="outline" className="text-xs font-normal">New Construction</Badge>
          </h4>
          <div className="space-y-2">
            {paymentSchedule.map((stage, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {stage.percent}%
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{stage.stage}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(stage.amount, 'ILS')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buyer Protections - Integrated */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Buyer Protections
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>
                Bank Guarantee
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 inline ml-1 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">Israeli law requires developers to provide bank guarantees protecting your payments until the property is registered in your name.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>1-Year Warranty</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>
                Staged Payments
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 inline ml-1 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">Pay in milestones as construction progresses, typically 10/15/25/50% at key stages.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          * Based on 2026 tax brackets. Payment schedules vary by developer. Always verify with your lawyer.
        </p>
      </CardContent>
    </Card>
  );
}
