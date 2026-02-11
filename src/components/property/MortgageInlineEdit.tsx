import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMortgagePreferences, MortgagePreferences } from '@/hooks/useMortgagePreferences';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';

interface MortgageInlineEditProps {
  propertyPrice: number;
  ltvLimit: number;
  onClose: () => void;
  className?: string;
}

const TERM_OPTIONS = [15, 20, 25, 30];

export function MortgageInlineEdit({
  propertyPrice,
  ltvLimit,
  onClose,
  className,
}: MortgageInlineEditProps) {
  const formatPrice = useFormatPrice();
  const { 
    preferences, 
    savePreferences, 
    isLoggedIn,
    isSaving,
  } = useMortgagePreferences();
  
  const [inputMode, setInputMode] = useState<'percent' | 'amount'>(
    preferences.down_payment_amount !== null ? 'amount' : 'percent'
  );
  
  // Local form state
  const [downPaymentPercent, setDownPaymentPercent] = useState<string>(
    preferences.down_payment_percent?.toString() || ''
  );
  const [downPaymentAmount, setDownPaymentAmount] = useState<string>(
    preferences.down_payment_amount?.toString() || ''
  );
  const [termYears, setTermYears] = useState<number>(preferences.term_years);
  
  // Calculate min down payment based on LTV
  const minDownPaymentPercent = 100 - ltvLimit;
  const minDownPaymentAmount = propertyPrice * (minDownPaymentPercent / 100);
  
  // Handle save
  const handleSave = () => {
    const newPrefs: Partial<MortgagePreferences> = {
      term_years: termYears,
    };
    
    if (inputMode === 'percent') {
      const percent = parseFloat(downPaymentPercent);
      newPrefs.down_payment_percent = isNaN(percent) ? null : percent;
      newPrefs.down_payment_amount = null;
    } else {
      const amount = parseFloat(downPaymentAmount.replace(/,/g, ''));
      newPrefs.down_payment_amount = isNaN(amount) ? null : amount;
      newPrefs.down_payment_percent = null;
    }
    
    savePreferences(newPrefs);
    onClose();
  };
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* Down Payment */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">Down Payment</Label>
          <div className="flex gap-0.5">
            <Button
              variant={inputMode === 'amount' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-5 text-[10px] px-1.5"
              onClick={() => setInputMode('amount')}
            >
              ₪
            </Button>
            <Button
              variant={inputMode === 'percent' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-5 text-[10px] px-1.5"
              onClick={() => setInputMode('percent')}
            >
              %
            </Button>
          </div>
        </div>
        
        {inputMode === 'amount' ? (
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₪</span>
            <Input
              type="text"
              value={downPaymentAmount}
              onChange={(e) => setDownPaymentAmount(e.target.value.replace(/[^0-9,]/g, ''))}
              placeholder={Math.round(minDownPaymentAmount).toLocaleString()}
              className="h-8 pl-5 text-sm"
            />
          </div>
        ) : (
          <div className="relative">
            <Input
              type="number"
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(e.target.value)}
              placeholder={minDownPaymentPercent.toString()}
              min={minDownPaymentPercent}
              max={100}
              className="h-8 pr-6 text-sm"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
          </div>
        )}
        
        <p className="text-[10px] text-muted-foreground">
          Min {minDownPaymentPercent}% ({formatPrice(minDownPaymentAmount, 'ILS')}) for {ltvLimit}% LTV
        </p>
      </div>
      
      {/* Loan Term */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Loan Term</Label>
        <Select
          value={termYears.toString()}
          onValueChange={(v) => setTermYears(parseInt(v))}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TERM_OPTIONS.map((years) => (
              <SelectItem key={years} value={years.toString()}>
                {years} years
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Rate info */}
      <p className="text-[10px] text-muted-foreground">
        Rate range: 4.5–6.0% (typical Bank of Israel rates)
      </p>
      
      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button 
          size="sm" 
          onClick={handleSave}
          disabled={isSaving}
          className="h-7 text-xs"
        >
          {isSaving ? 'Saving...' : isLoggedIn ? 'Save to Profile' : 'Apply'}
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onClose}
          className="h-7 text-xs"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
