import { useState } from 'react';
import { Settings, DollarSign, Ruler, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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

  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferences
          </DialogTitle>
          <DialogDescription>
            Customize how prices and measurements are displayed across the site.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Currency Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Currency Display</Label>
            </div>
            <RadioGroup
              value={currency}
              onValueChange={(value) => setCurrency(value as 'ILS' | 'USD' | 'both')}
              className="grid grid-cols-1 gap-2"
            >
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="ILS" id="ils" />
                <Label htmlFor="ils" className="flex-1 cursor-pointer">
                  <span className="font-medium">₪ Shekel (ILS)</span>
                  <span className="block text-xs text-muted-foreground">Israeli New Shekel only</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="USD" id="usd" />
                <Label htmlFor="usd" className="flex-1 cursor-pointer">
                  <span className="font-medium">$ Dollar (USD)</span>
                  <span className="block text-xs text-muted-foreground">US Dollar only</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="flex-1 cursor-pointer">
                  <span className="font-medium">Both (₪ & $)</span>
                  <span className="block text-xs text-muted-foreground">Show ILS with USD equivalent</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Exchange Rate Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Exchange Rate</Label>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Default rate: 1 USD = ₪{defaultExchangeRate.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground">(updated weekly)</span>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-rate" className="text-sm cursor-pointer">
                  Use custom rate
                </Label>
                <Switch
                  id="custom-rate"
                  checked={isCustomRate}
                  onCheckedChange={setIsCustomRate}
                />
              </div>
              {isCustomRate && (
                <div className="space-y-2">
                  <Label htmlFor="rate-input" className="text-xs text-muted-foreground">
                    Enter current rate (ILS per $1 USD)
                  </Label>
                  <Input
                    id="rate-input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || defaultExchangeRate)}
                    placeholder="3.65"
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Area Units Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Area Units</Label>
            </div>
            <RadioGroup
              value={areaUnit}
              onValueChange={(value) => setAreaUnit(value as 'sqm' | 'sqft')}
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="sqm" id="sqm" />
                <Label htmlFor="sqm" className="cursor-pointer">
                  <span className="font-medium">m²</span>
                  <span className="block text-xs text-muted-foreground">Square Meters</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="sqft" id="sqft" />
                <Label htmlFor="sqft" className="cursor-pointer">
                  <span className="font-medium">ft²</span>
                  <span className="block text-xs text-muted-foreground">Square Feet</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
