import { useMemo } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Wallet, TrendingUp, Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuickAffordability } from '@/hooks/useAffordability';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { formatMonthlyRange } from '@/lib/utils/formatRange';

interface AffordabilityBadgeProps {
  price: number;
  variant?: 'badge' | 'card' | 'minimal';
  showMonthly?: boolean;
}

export function AffordabilityBadge({ price, variant = 'badge', showMonthly = true }: AffordabilityBadgeProps) {
  const { ltvLimit, hasSavedSettings, maxPrice, getMonthlyEstimateRange, getDownPaymentRequired } = useQuickAffordability();
  const formatPrice = useFormatPrice();

  const monthlyRange = useMemo(() => getMonthlyEstimateRange(price), [price, getMonthlyEstimateRange]);
  const downPayment = useMemo(() => getDownPaymentRequired(price), [price, getDownPaymentRequired]);

  // Determine affordability level if user has saved settings
  const affordabilityLevel = useMemo(() => {
    if (!hasSavedSettings || !maxPrice) return null;
    
    if (price <= maxPrice * 0.8) return 'comfortable';
    if (price <= maxPrice) return 'stretch';
    return 'out_of_reach';
  }, [price, maxPrice, hasSavedSettings]);

  const getAffordabilityInfo = () => {
    switch (affordabilityLevel) {
      case 'comfortable':
        return {
          icon: CheckCircle2,
          color: 'text-semantic-green',
          bg: 'bg-semantic-green/10 border-semantic-green/20',
          label: 'Comfortable',
          description: 'Well within your budget',
        };
      case 'stretch':
        return {
          icon: AlertCircle,
          color: 'text-semantic-amber',
          bg: 'bg-semantic-amber/10 border-semantic-amber/20',
          label: 'Stretch',
          description: 'At your budget limit',
        };
      case 'out_of_reach':
        return {
          icon: XCircle,
          color: 'text-semantic-red',
          bg: 'bg-semantic-red/10 border-semantic-red/20',
          label: 'Over Budget',
          description: 'Exceeds your max budget',
        };
      default:
        return null;
    }
  };

  const affordabilityInfo = getAffordabilityInfo();

  // Minimal variant - just show monthly payment range
  if (variant === 'minimal') {
    return (
      <span className="text-sm text-muted-foreground">
        {formatMonthlyRange(monthlyRange.low, monthlyRange.high, 'ILS')}
      </span>
    );
  }

  // Badge variant - compact inline display
  if (variant === 'badge') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1.5">
            {affordabilityInfo ? (
              <Badge 
                variant="outline" 
                className={`${affordabilityInfo.bg} ${affordabilityInfo.color} border text-xs font-medium`}
              >
                <affordabilityInfo.icon className="h-3 w-3 mr-1" />
                {affordabilityInfo.label}
              </Badge>
            ) : showMonthly ? (
              <Badge variant="secondary" className="text-xs font-medium">
                <Wallet className="h-3 w-3 mr-1" />
                {formatMonthlyRange(monthlyRange.low, monthlyRange.high, 'ILS')}
              </Badge>
            ) : null}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2 text-sm">
            <p className="font-medium">Estimated Monthly Range</p>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Mortgage ({ltvLimit}% LTV)</span>
              <span>{formatMonthlyRange(monthlyRange.low, monthlyRange.high, 'ILS')}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Down Payment</span>
              <span>{formatPrice(downPayment, 'ILS')}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1 border-t border-border">
              Based on 4.5–6% rates, 25-year term
            </p>
            {affordabilityInfo && (
              <p className={`${affordabilityInfo.color} pt-1 border-t border-border`}>
                {affordabilityInfo.description}
              </p>
            )}
            {!hasSavedSettings && (
              <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                Set your budget in Tools → Affordability Calculator
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Card variant - full display with details
  return (
    <div className={`p-3 rounded-lg border ${affordabilityInfo?.bg || 'bg-muted/30 border-border'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {affordabilityInfo ? (
            <>
              <affordabilityInfo.icon className={`h-5 w-5 ${affordabilityInfo.color}`} />
              <span className={`font-medium ${affordabilityInfo.color}`}>
                {affordabilityInfo.label}
              </span>
            </>
          ) : (
            <>
              <Calculator className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Monthly Estimate</span>
            </>
          )}
        </div>
        {affordabilityInfo && (
          <span className="text-xs text-muted-foreground">
            {affordabilityInfo.description}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Monthly Range</p>
          <p className="font-semibold">{formatMonthlyRange(monthlyRange.low, monthlyRange.high, 'ILS')}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Down Payment ({100 - ltvLimit}%)</p>
          <p className="font-semibold">{formatPrice(downPayment, 'ILS')}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Based on 4.5–6% rates, {ltvLimit}% LTV</p>
    </div>
  );
}

// Export a simpler monthly estimate component for property cards - now shows range
export function MonthlyEstimate({ price }: { price: number }) {
  const { getMonthlyEstimateRange } = useQuickAffordability();
  const range = getMonthlyEstimateRange(price);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-xs text-muted-foreground hover:text-foreground cursor-help">
          {formatMonthlyRange(range.low, range.high, 'ILS')}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Estimated range at 4.5–6% rates</p>
      </TooltipContent>
    </Tooltip>
  );
}
