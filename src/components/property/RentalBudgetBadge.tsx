import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useFormatPrice, useCurrencySymbol } from '@/contexts/PreferencesContext';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';

interface RentalBudgetBadgeProps {
  monthlyRent: number;
  variant?: 'badge' | 'minimal';
  className?: string;
}

export function RentalBudgetBadge({ 
  monthlyRent, 
  variant = 'minimal',
  className = '' 
}: RentalBudgetBadgeProps) {
  const formatPrice = useFormatPrice();
  const currencySymbol = useCurrencySymbol();
  const { data: buyerProfile } = useBuyerProfile();
  
  const rentalBudget = buyerProfile?.rental_budget;
  const hasbudget = rentalBudget && rentalBudget > 0;
  
  // Determine affordability
  let affordabilityLevel: 'within' | 'over' | null = null;
  let percentOfBudget = 0;
  
  if (hasbudget) {
    percentOfBudget = Math.round((monthlyRent / rentalBudget) * 100);
    affordabilityLevel = monthlyRent <= rentalBudget ? 'within' : 'over';
  }

  const formattedRent = formatPrice(monthlyRent, 'ILS');

  if (variant === 'minimal') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`text-sm text-muted-foreground ${className}`}>
            {formattedRent}/mo
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">Monthly Rent: {formattedRent}</p>
            {hasbudget && (
              <p className={affordabilityLevel === 'within' ? 'text-semantic-green' : 'text-semantic-red'}>
                {percentOfBudget}% of your {currencySymbol}{rentalBudget.toLocaleString()} budget
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Badge variant with budget comparison
  if (!hasbudget) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{formattedRent}/mo</span>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="secondary" 
          className={`gap-1 ${
            affordabilityLevel === 'within' 
              ? 'bg-semantic-green text-semantic-green-foreground' 
              : 'bg-semantic-red text-semantic-red-foreground'
          } ${className}`}
        >
          {affordabilityLevel === 'within' ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <TrendingUp className="h-3 w-3" />
          )}
          {affordabilityLevel === 'within' ? 'Within Budget' : 'Over Budget'}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm space-y-1">
          <p>Monthly Rent: <span className="font-medium">{formattedRent}</span></p>
          <p>Your Budget: <span className="font-medium">{currencySymbol}{rentalBudget.toLocaleString()}/mo</span></p>
          <p className={affordabilityLevel === 'within' ? 'text-semantic-green' : 'text-semantic-red'}>
            {percentOfBudget}% of budget
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
