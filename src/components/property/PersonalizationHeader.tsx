import { useState } from 'react';
import { DollarSign, ChevronDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMortgagePreferences, MortgagePreferences } from '@/hooks/useMortgagePreferences';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PersonalizationHeaderProps {
  buyerCategoryLabel: string;
  hasProfile: boolean;
  downPaymentPercent: number;
  termYears: number;
  propertyPrice: number;
  ltvLimit: number;
}

const TERM_OPTIONS = [15, 20, 25, 30];

export function PersonalizationHeader({
  buyerCategoryLabel,
  hasProfile,
  downPaymentPercent,
  termYears,
  propertyPrice,
  ltvLimit,
}: PersonalizationHeaderProps) {
  const { user } = useAuth();
  const formatPrice = useFormatPrice();
  const { 
    preferences, 
    savePreferences, 
    isLoggedIn,
    isSaving,
  } = useMortgagePreferences();
  
  const [isEditing, setIsEditing] = useState(false);
  const [inputMode, setInputMode] = useState<'percent' | 'amount'>(
    preferences.down_payment_amount !== null ? 'amount' : 'percent'
  );
  
  // Local form state
  const [localDownPaymentPercent, setLocalDownPaymentPercent] = useState<string>(
    preferences.down_payment_percent?.toString() || ''
  );
  const [localDownPaymentAmount, setLocalDownPaymentAmount] = useState<string>(
    preferences.down_payment_amount?.toString() || ''
  );
  const [localTermYears, setLocalTermYears] = useState<number>(preferences.term_years);
  
  // Calculate min down payment based on LTV
  const minDownPaymentPercent = 100 - ltvLimit;
  const minDownPaymentAmount = propertyPrice * (minDownPaymentPercent / 100);
  
  // Handle save
  const handleSave = () => {
    const newPrefs: Partial<MortgagePreferences> = {
      term_years: localTermYears,
    };
    
    if (inputMode === 'percent') {
      const percent = parseFloat(localDownPaymentPercent);
      newPrefs.down_payment_percent = isNaN(percent) ? null : percent;
      newPrefs.down_payment_amount = null;
    } else {
      const amount = parseFloat(localDownPaymentAmount.replace(/,/g, ''));
      newPrefs.down_payment_amount = isNaN(amount) ? null : amount;
      newPrefs.down_payment_percent = null;
    }
    
    savePreferences(newPrefs);
    setIsEditing(false);
  };

  // Guest prompt
  if (!user) {
    return (
      <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-muted/50 text-sm">
        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">
          Assuming <span className="font-medium text-foreground">First-Time Buyer</span>
          <span className="mx-1">·</span>
          <span className="font-medium text-foreground">{downPaymentPercent}% down</span>
          <span className="mx-1">·</span>
          <span className="font-medium text-foreground">{termYears}yr</span>
        </span>
        <span className="text-muted-foreground">·</span>
        <Link to="/auth?tab=signup" className="text-primary hover:underline text-sm">
          Sign up to personalize
        </Link>
      </div>
    );
  }

  return (
    <Collapsible open={isEditing} onOpenChange={setIsEditing}>
      <div className="flex items-center gap-2 text-sm">
        <DollarSign className="h-4 w-4 text-primary shrink-0" />
        <span className="text-muted-foreground">
          Calculating for:{' '}
          <span className="font-medium text-foreground">{buyerCategoryLabel}</span>
          <span className="mx-1 text-muted-foreground/60">·</span>
          <span className="font-medium text-foreground">{downPaymentPercent}% down</span>
          <span className="mx-1 text-muted-foreground/60">·</span>
          <span className="font-medium text-foreground">{termYears}yr</span>
        </span>
        
        <CollapsibleTrigger asChild>
          <button className="inline-flex items-center gap-0.5 text-primary hover:underline ml-1">
            Edit
            <ChevronDown className={cn("h-3 w-3 transition-transform", isEditing && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent>
        <div className="mt-3 p-3 rounded-lg bg-muted/30 space-y-3">
          {/* Buyer Type - Link to profile */}
          <div className="flex items-center justify-between text-sm">
            <Label className="text-xs font-medium text-muted-foreground">Buyer Type</Label>
            <div className="flex items-center gap-2">
              <span className="font-medium">{buyerCategoryLabel}</span>
              <Link 
                to="/profile" 
                className="text-xs text-primary hover:underline"
              >
                Change in profile
              </Link>
            </div>
          </div>
          
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
                  value={localDownPaymentAmount}
                  onChange={(e) => setLocalDownPaymentAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                  placeholder={Math.round(minDownPaymentAmount).toLocaleString()}
                  className="h-8 pl-5 text-sm"
                />
              </div>
            ) : (
              <div className="relative">
                <Input
                  type="number"
                  value={localDownPaymentPercent}
                  onChange={(e) => setLocalDownPaymentPercent(e.target.value)}
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
              value={localTermYears.toString()}
              onValueChange={(v) => setLocalTermYears(parseInt(v))}
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
              onClick={() => setIsEditing(false)}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
