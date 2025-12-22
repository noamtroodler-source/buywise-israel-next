import { Settings, DollarSign, Ruler, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {/* Currency Section */}
        <DropdownMenuLabel className="flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5" />
          Currency
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={currency}
          onValueChange={(value) => setCurrency(value as 'ILS' | 'USD' | 'both')}
        >
          <DropdownMenuRadioItem value="ILS">₪ Shekel only</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="USD">$ Dollar only</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="both">Both (₪ & $)</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {/* Exchange Rate Section */}
        <DropdownMenuLabel className="flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Exchange Rate
        </DropdownMenuLabel>
        <div className="px-2 py-1.5 space-y-2">
          <div className="text-xs text-muted-foreground">
            Default: 1 USD = ₪{defaultExchangeRate.toFixed(2)}
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="custom-rate" className="text-xs cursor-pointer">
              Custom rate
            </Label>
            <Switch
              id="custom-rate"
              checked={isCustomRate}
              onCheckedChange={setIsCustomRate}
              className="scale-75"
            />
          </div>
          {isCustomRate && (
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || defaultExchangeRate)}
              placeholder="3.65"
              className="h-8 text-sm"
            />
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Area Units Section */}
        <DropdownMenuLabel className="flex items-center gap-2">
          <Ruler className="h-3.5 w-3.5" />
          Area Units
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={areaUnit}
          onValueChange={(value) => setAreaUnit(value as 'sqm' | 'sqft')}
        >
          <DropdownMenuRadioItem value="sqm">m² (Square Meters)</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="sqft">ft² (Square Feet)</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
