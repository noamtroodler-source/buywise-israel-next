import { Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePreferences } from '@/contexts/PreferencesContext';

interface PreferencesDialogProps {
  trigger?: React.ReactNode;
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
      <DropdownMenuContent align="end" className="w-80 p-4">
        {/* Header */}
        <h3 className="text-lg font-semibold mb-4">Preferences</h3>

        {/* Currency Section */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Currency</h4>
          <DropdownMenuRadioGroup
            value={currency}
            onValueChange={(value) => setCurrency(value as 'ILS' | 'USD' | 'both')}
          >
            <DropdownMenuRadioItem value="ILS" className="cursor-pointer">
              ₪ NIS
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="USD" className="cursor-pointer">
              $ USD
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="both" className="cursor-pointer">
              ₪+$ Both
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </div>

        <DropdownMenuSeparator className="my-4" />

        {/* Exchange Rate Section */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Exchange Rate</h4>
          <p className="text-sm text-muted-foreground">
            Default rate updated weekly. Enter current rate for most accurate conversions (ILS per $1 USD)
          </p>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={isCustomRate ? exchangeRate : ''}
            onChange={handleRateChange}
            placeholder={`Default: ${defaultExchangeRate.toFixed(2)}`}
            className="h-10"
          />
        </div>

        <DropdownMenuSeparator className="my-4" />

        {/* Units Section */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Units</h4>
          <DropdownMenuRadioGroup
            value={areaUnit}
            onValueChange={(value) => setAreaUnit(value as 'sqm' | 'sqft')}
          >
            <DropdownMenuRadioItem value="sqm" className="cursor-pointer">
              Square Meters (m²)
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="sqft" className="cursor-pointer">
              Square Feet (sq ft)
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
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
