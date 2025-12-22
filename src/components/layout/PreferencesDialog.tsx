import { Settings, Check } from 'lucide-react';
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
  onSelect: () => void;
  children: React.ReactNode;
}

function RadioOption({ value, selected, onSelect, children }: RadioOptionProps) {
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-3 py-2 w-full text-left hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
    >
      <div
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
          selected ? "border-primary bg-primary" : "border-muted-foreground/40"
        )}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
      </div>
      <span className="flex-1 text-sm">{children}</span>
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-5">
        {/* Header */}
        <h3 className="text-xl font-semibold mb-6">Preferences</h3>

        {/* Currency Section */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground mb-3">Currency</h4>
          <RadioOption
            value="ILS"
            selected={currency === 'ILS'}
            onSelect={() => setCurrency('ILS')}
          >
            ₪ NIS
          </RadioOption>
          <RadioOption
            value="USD"
            selected={currency === 'USD'}
            onSelect={() => setCurrency('USD')}
          >
            $ USD
          </RadioOption>
          <RadioOption
            value="both"
            selected={currency === 'both'}
            onSelect={() => setCurrency('both')}
          >
            ₪+$ Both
          </RadioOption>
        </div>

        <DropdownMenuSeparator className="my-5" />

        {/* Exchange Rate Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Exchange Rate</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Default rate updated weekly. Enter current rate for most accurate conversions (ILS per $1 USD)
          </p>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={isCustomRate ? exchangeRate : ''}
            onChange={handleRateChange}
            placeholder={`Default: ${defaultExchangeRate.toFixed(2)}`}
            className="h-11"
          />
        </div>

        <DropdownMenuSeparator className="my-5" />

        {/* Units Section */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground mb-3">Units</h4>
          <RadioOption
            value="sqm"
            selected={areaUnit === 'sqm'}
            onSelect={() => setAreaUnit('sqm')}
          >
            Square Meters (m²)
          </RadioOption>
          <RadioOption
            value="sqft"
            selected={areaUnit === 'sqft'}
            onSelect={() => setAreaUnit('sqft')}
          >
            Square Feet (sq ft)
          </RadioOption>
        </div>

        <DropdownMenuSeparator className="my-5" />

        {/* Footer */}
        <p className="text-sm text-muted-foreground">
          Your preferences are saved automatically
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
