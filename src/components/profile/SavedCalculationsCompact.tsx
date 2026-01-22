import { Link } from 'react-router-dom';
import { Calculator, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSavedCalculatorResults } from '@/hooks/useSavedCalculatorResults';
import { useFormatPrice } from '@/contexts/PreferencesContext';

export function SavedCalculationsCompact() {
  const { data: savedResults = [], isLoading } = useSavedCalculatorResults();
  const formatPrice = useFormatPrice();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Saved Calculations</span>
        </div>
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const displayedResults = savedResults.slice(0, 3);

  const getCalculatorLabel = (type: string) => {
    switch (type) {
      case 'mortgage': return 'Mortgage';
      case 'affordability': return 'Affordability';
      case 'purchase_tax': return 'Purchase Tax';
      case 'rental_yield': return 'Rental Yield';
      default: return type;
    }
  };

  const getCalculatorLink = (type: string) => {
    switch (type) {
      case 'mortgage': return '/tools/mortgage-calculator';
      case 'affordability': return '/tools/affordability-calculator';
      case 'purchase_tax': return '/tools/purchase-tax-calculator';
      case 'rental_yield': return '/tools/rental-yield-calculator';
      default: return '/tools';
    }
  };

  const formatResult = (result: any) => {
    if (result.monthly_payment) {
      return `${formatPrice(result.monthly_payment, 'ILS')}/mo`;
    }
    if (result.max_property_price) {
      return formatPrice(result.max_property_price, 'ILS');
    }
    if (result.tax_amount) {
      return formatPrice(result.tax_amount, 'ILS');
    }
    if (result.gross_yield) {
      return `${result.gross_yield.toFixed(1)}% yield`;
    }
    return 'View';
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Saved Calculations</span>
        </div>
        {savedResults.length > 0 && (
          <span className="text-xs text-muted-foreground">{savedResults.length} saved</span>
        )}
      </div>

      {savedResults.length === 0 ? (
        <div className="text-center py-4">
          <div className="w-10 h-10 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center">
            <Calculator className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mb-2">No saved calculations</p>
          <Button asChild variant="outline" size="sm" className="h-7 text-xs">
            <Link to="/tools">
              Explore Tools
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedResults.map((result) => (
            <Link
              key={result.id}
              to={getCalculatorLink(result.calculator_type)}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <span className="text-xs text-muted-foreground">
                {getCalculatorLabel(result.calculator_type)}
              </span>
              <span className="text-sm font-medium text-primary">
                {formatResult(result.results)}
              </span>
            </Link>
          ))}

          {savedResults.length > 3 && (
            <Button asChild variant="ghost" size="sm" className="w-full h-8 text-xs text-primary">
              <Link to="/tools">
                View all {savedResults.length} calculations
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
