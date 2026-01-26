import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePreferences } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';

interface PreferencesDialogProps {
  trigger?: React.ReactNode;
}

interface RadioOptionProps {
  value: string;
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function RadioOption({ value, selected, onClick, children }: RadioOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full py-2 px-1 text-left hover:bg-muted/50 rounded-md transition-colors"
    >
      <div
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
          selected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
        )}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-background" />}
      </div>
      <span className="flex-1 text-sm text-foreground">{children}</span>
      {selected && <Check className="h-4 w-4 text-primary" />}
    </button>
  );
}

export function PreferencesDialog({ trigger }: PreferencesDialogProps) {
  const {
    currency,
    setCurrency,
    exchangeRate,
    setExchangeRate,
    isCustomRate,
    setIsCustomRate,
    areaUnit,
    setAreaUnit,
    defaultExchangeRate,
  } = usePreferences();

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || value === String(defaultExchangeRate)) {
      setIsCustomRate(false);
      setExchangeRate(defaultExchangeRate);
    } else {
      setIsCustomRate(true);
      setExchangeRate(parseFloat(value) || defaultExchangeRate);
    }
  };

  const currencySymbol = currency === 'USD' ? '$' : '₪';
  const unitLabel = areaUnit === 'sqft' ? 'ft²' : 'm²';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button 
            variant="ghost" 
            className="h-9 px-3 gap-1.5 rounded-full border border-border/60 hover:bg-primary/5 hover:border-primary/30 transition-all"
          >
            <span className="text-sm font-medium text-foreground">
              {currencySymbol} · {unitLabel}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-4">
        {/* Header */}
        <h3 className="text-lg font-semibold mb-4">Preferences</h3>

        {/* Currency Section */}
        <div className="space-y-1">
          <h4 className="font-medium text-foreground mb-2">Currency</h4>
          <RadioOption value="ILS" selected={currency === 'ILS'} onClick={() => setCurrency('ILS')}>
            ₪ NIS
          </RadioOption>
          <RadioOption value="USD" selected={currency === 'USD'} onClick={() => setCurrency('USD')}>
            $ USD
          </RadioOption>
        </div>

        <DropdownMenuSeparator className="my-4" />

        {/* Exchange Rate Section */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Exchange Rate</h4>
          <p className="text-sm text-muted-foreground">
            Default rate updated weekly. Enter current rate for most accurate conversions ({currency === 'USD' ? 'USD per 1 ₪' : 'ILS per $1 USD'})
          </p>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={isCustomRate ? exchangeRate : ''}
            onChange={handleRateChange}
            placeholder={`Default: ${currency === 'USD' ? (1 / defaultExchangeRate).toFixed(3) : defaultExchangeRate.toFixed(2)}`}
            className="h-10"
          />
        </div>

        <DropdownMenuSeparator className="my-4" />

        {/* Units Section */}
        <div className="space-y-1">
          <h4 className="font-medium text-foreground mb-2">Units</h4>
          <RadioOption value="sqm" selected={areaUnit === 'sqm'} onClick={() => setAreaUnit('sqm')}>
            Square Meters (m²)
          </RadioOption>
          <RadioOption value="sqft" selected={areaUnit === 'sqft'} onClick={() => setAreaUnit('sqft')}>
            Square Feet (sq ft)
          </RadioOption>
        </div>

        <DropdownMenuSeparator className="my-4" />

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          Your preferences are saved automatically
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
