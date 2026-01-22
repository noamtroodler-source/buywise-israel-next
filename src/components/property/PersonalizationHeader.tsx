import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, RotateCcw, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useMortgagePreferences, MortgagePreferences } from '@/hooks/useMortgagePreferences';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BuyerProfileDimensions, deriveEffectiveBuyerType, LTV_LIMITS } from '@/lib/calculations/buyerProfile';

interface PersonalizationHeaderProps {
  buyerCategoryLabel: string;
  hasProfile: boolean;
  downPaymentPercent: number;
  termYears: number;
  propertyPrice: number;
  ltvLimit: number;
  savedProfileDimensions?: BuyerProfileDimensions | null;
}

const TERM_OPTIONS = [15, 20, 25, 30];

export function PersonalizationHeader({
  buyerCategoryLabel,
  hasProfile,
  downPaymentPercent,
  termYears,
  propertyPrice,
  ltvLimit,
  savedProfileDimensions,
}: PersonalizationHeaderProps) {
  const { user } = useAuth();
  const formatPrice = useFormatPrice();
  const { 
    preferences, 
    savePreferences, 
    isSaving,
  } = useMortgagePreferences();
  
  const [isEditing, setIsEditing] = useState(false);
  const [inputMode, setInputMode] = useState<'percent' | 'amount'>(
    preferences.down_payment_amount !== null ? 'amount' : 'percent'
  );
  
  // Get derived buyer type from saved profile
  const derived = useMemo(() => {
    const profile: BuyerProfileDimensions = savedProfileDimensions || {
      residency_status: 'israeli_resident',
      is_first_property: true,
      buyer_entity: 'individual',
      aliyah_year: null,
      is_upgrading: false,
    };
    return deriveEffectiveBuyerType(profile);
  }, [savedProfileDimensions]);
  
  const effectiveLtvInfo = LTV_LIMITS[derived.taxType];
  const effectiveLtv = effectiveLtvInfo?.maxLtv ?? ltvLimit;
  const minDownPaymentPercent = 100 - effectiveLtv;
  const minDownPaymentAmount = propertyPrice * (minDownPaymentPercent / 100);
  
  // Local mortgage state
  const [localDownPaymentPercent, setLocalDownPaymentPercent] = useState<string>(
    preferences.down_payment_percent?.toString() || ''
  );
  const [localDownPaymentAmount, setLocalDownPaymentAmount] = useState<string>(
    preferences.down_payment_amount?.toString() || ''
  );
  const [localTermYears, setLocalTermYears] = useState<number>(preferences.term_years);
  
  // Sync with saved preferences when they change
  useEffect(() => {
    setLocalDownPaymentPercent(preferences.down_payment_percent?.toString() || '');
    setLocalDownPaymentAmount(preferences.down_payment_amount?.toString() || '');
    setLocalTermYears(preferences.term_years);
  }, [preferences]);
  
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
  
  const handleReset = () => {
    setLocalDownPaymentPercent('25');
    setLocalDownPaymentAmount('');
    setLocalTermYears(25);
    setInputMode('percent');
  };

  // Collapsed header bar
  const headerContent = (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">
        Calculating for:{' '}
        <span className="font-medium text-foreground">{user ? buyerCategoryLabel : derived.shortLabel}</span>
        <span className="mx-1.5 text-muted-foreground/40">·</span>
        <span className="font-medium text-foreground">{downPaymentPercent}% down</span>
        <span className="mx-1.5 text-muted-foreground/40">·</span>
        <span className="font-medium text-foreground">{termYears}yr</span>
      </span>
      
      <CollapsibleTrigger asChild>
        <button className="inline-flex items-center gap-0.5 text-primary hover:underline ml-1 text-sm">
          {isEditing ? 'Close' : 'Edit'}
          <ChevronDown className={cn("h-3 w-3 transition-transform", isEditing && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
    </div>
  );

  // Expanded panel content
  const panelContent = (
    <div className="mt-3 p-4 rounded-xl border bg-card space-y-4">
      {/* Buyer Type - Display Only with Profile Link */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Buyer Type
          </Label>
          <p className="text-sm font-medium text-foreground">
            {derived.label}
          </p>
        </div>
        {user ? (
          <Link to="/profile?tab=settings">
            <Button variant="ghost" size="sm" className="text-xs text-primary h-7 gap-1.5 hover:bg-primary/5">
              Change in Profile
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        ) : (
          <Link to="/auth?tab=signup">
            <Button variant="ghost" size="sm" className="text-xs text-primary h-7 gap-1.5 hover:bg-primary/5">
              Sign up to set profile
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </div>
      
      <Separator />
      
      {/* Mortgage Scenario - Editable */}
      <div className="space-y-3">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Mortgage Scenario
        </Label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Down Payment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Down Payment</Label>
              <ToggleGroup
                type="single"
                value={inputMode}
                onValueChange={(v) => v && setInputMode(v as 'percent' | 'amount')}
                className="flex gap-0.5 p-0.5 bg-muted rounded"
              >
                <ToggleGroupItem 
                  value="amount" 
                  className="text-[10px] h-5 px-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded"
                >
                  ₪
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="percent" 
                  className="text-[10px] h-5 px-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded"
                >
                  %
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            {inputMode === 'amount' ? (
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₪</span>
                <Input
                  type="text"
                  value={localDownPaymentAmount}
                  onChange={(e) => setLocalDownPaymentAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                  placeholder={Math.round(minDownPaymentAmount).toLocaleString()}
                  className="h-9 pl-6 text-sm"
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
                  className="h-9 pr-7 text-sm"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Min {minDownPaymentPercent}% for {effectiveLtv}% max LTV
            </p>
          </div>
          
          {/* Loan Term */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Loan Term</Label>
            <ToggleGroup
              type="single"
              value={localTermYears.toString()}
              onValueChange={(v) => v && setLocalTermYears(parseInt(v))}
              className="grid grid-cols-4 gap-1 p-1 bg-muted rounded-lg w-full"
            >
              {TERM_OPTIONS.map((years) => (
                <ToggleGroupItem 
                  key={years}
                  value={years.toString()} 
                  className="text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md py-1.5"
                >
                  {years}yr
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            
            {/* Show calculated loan amount */}
            {inputMode === 'percent' && localDownPaymentPercent && (
              <p className="text-xs text-muted-foreground">
                Loan: {formatPrice(propertyPrice * (1 - parseFloat(localDownPaymentPercent) / 100), 'ILS')}
              </p>
            )}
            {inputMode === 'amount' && localDownPaymentAmount && (
              <p className="text-xs text-muted-foreground">
                Loan: {formatPrice(propertyPrice - parseFloat(localDownPaymentAmount.replace(/,/g, '')), 'ILS')}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Effective Summary */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
        <span>
          <span className="font-medium text-foreground">{derived.shortLabel}</span>
          <span className="mx-1.5">·</span>
          Max LTV: {effectiveLtv}%
        </span>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <Button 
          size="sm" 
          variant="ghost"
          onClick={handleReset}
          className="h-7 text-xs gap-1 text-muted-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setIsEditing(false)}
            className="h-7 text-xs"
          >
            Close
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={isSaving}
            className="h-7 text-xs"
          >
            {isSaving ? 'Saving...' : (user ? 'Save' : 'Apply')}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Collapsible open={isEditing} onOpenChange={setIsEditing}>
      {headerContent}
      <CollapsibleContent>
        {panelContent}
      </CollapsibleContent>
    </Collapsible>
  );
}
