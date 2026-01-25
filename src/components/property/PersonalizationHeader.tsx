import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, RotateCcw, ExternalLink, CreditCard, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  /** Show compact collapsed state without full edit panel */
  compact?: boolean;
}

const TERM_OPTIONS = [15, 20, 25, 30];
const DOWN_PAYMENT_PRESETS = [25, 30, 35];

export function PersonalizationHeader({
  buyerCategoryLabel,
  hasProfile,
  downPaymentPercent,
  termYears,
  propertyPrice,
  ltvLimit,
  savedProfileDimensions,
  compact = false,
}: PersonalizationHeaderProps) {
  const { user } = useAuth();
  const formatPrice = useFormatPrice();
  const { 
    preferences, 
    savePreferences, 
    isSaving,
    includeMortgage,
  } = useMortgagePreferences();
  
  const [isEditing, setIsEditing] = useState(false);
  const [localIncludeMortgage, setLocalIncludeMortgage] = useState(includeMortgage);
  
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
  
  // Down payment state
  const [downPaymentMode, setDownPaymentMode] = useState<'preset' | 'custom'>(() => {
    // Check if current preference matches a preset
    const currentPercent = preferences.down_payment_percent;
    if (currentPercent && DOWN_PAYMENT_PRESETS.includes(currentPercent)) {
      return 'preset';
    }
    if (preferences.down_payment_amount !== null) {
      return 'custom';
    }
    return 'preset';
  });
  
  const [selectedPreset, setSelectedPreset] = useState<number>(() => {
    const currentPercent = preferences.down_payment_percent;
    if (currentPercent && DOWN_PAYMENT_PRESETS.includes(currentPercent)) {
      return currentPercent;
    }
    return 25;
  });
  
  const [customAmount, setCustomAmount] = useState<string>(
    preferences.down_payment_amount?.toLocaleString() || ''
  );
  
  const [localTermYears, setLocalTermYears] = useState<number>(preferences.term_years);
  
  // Sync local state with preferences
  useEffect(() => {
    const currentPercent = preferences.down_payment_percent;
    if (currentPercent && DOWN_PAYMENT_PRESETS.includes(currentPercent)) {
      setDownPaymentMode('preset');
      setSelectedPreset(currentPercent);
    } else if (preferences.down_payment_amount !== null) {
      setDownPaymentMode('custom');
      setCustomAmount(preferences.down_payment_amount.toLocaleString());
    }
    setLocalTermYears(preferences.term_years);
    setLocalIncludeMortgage(preferences.include_mortgage);
  }, [preferences]);
  
  // Calculate effective values for display
  const effectiveDownPayment = useMemo(() => {
    if (downPaymentMode === 'preset') {
      return {
        percent: selectedPreset,
        amount: propertyPrice * (selectedPreset / 100),
      };
    } else {
      const amount = parseFloat(customAmount.replace(/,/g, '')) || 0;
      return {
        percent: (amount / propertyPrice) * 100,
        amount,
      };
    }
  }, [downPaymentMode, selectedPreset, customAmount, propertyPrice]);
  
  const loanAmount = propertyPrice - effectiveDownPayment.amount;
  
  const handleSave = () => {
    const newPrefs: Partial<MortgagePreferences> = {
      include_mortgage: localIncludeMortgage,
      term_years: localTermYears,
    };
    
    if (localIncludeMortgage) {
      if (downPaymentMode === 'preset') {
        newPrefs.down_payment_percent = selectedPreset;
        newPrefs.down_payment_amount = null;
      } else {
        const amount = parseFloat(customAmount.replace(/,/g, ''));
        newPrefs.down_payment_amount = isNaN(amount) ? null : amount;
        newPrefs.down_payment_percent = null;
      }
    } else {
      // Cash purchase - clear mortgage-specific values
      newPrefs.down_payment_percent = null;
      newPrefs.down_payment_amount = null;
    }
    
    savePreferences(newPrefs);
    setIsEditing(false);
  };
  
  const handleReset = () => {
    setLocalIncludeMortgage(false); // Reset to cash-first default
    setDownPaymentMode('preset');
    setSelectedPreset(25);
    setCustomAmount('');
    setLocalTermYears(25);
  };

  const handleDownPaymentChange = (value: string) => {
    if (value === 'custom') {
      setDownPaymentMode('custom');
    } else if (value) {
      setDownPaymentMode('preset');
      setSelectedPreset(parseInt(value));
    }
  };

  // Determine display label
  const displayLabel = user ? buyerCategoryLabel : derived.shortLabel;
  const financingLabel = includeMortgage 
    ? `${downPaymentPercent}% down · ${termYears}yr`
    : 'Paid in Full';

  // Collapsed header bar - different styles for guest vs signed-in
  const headerContent = user && hasProfile ? (
    // Signed-in user with profile - confidence messaging
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 flex items-center gap-2 flex-wrap text-sm">
        <span className="font-medium text-foreground">Personalized for You</span>
        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
          {displayLabel}
        </Badge>
        <span className="text-muted-foreground/50">·</span>
        <span className="text-muted-foreground">{financingLabel}</span>
      </div>
      <CollapsibleTrigger asChild>
        <button className="inline-flex items-center gap-0.5 text-primary hover:underline text-sm shrink-0">
          {isEditing ? 'Close' : 'Edit'}
          <ChevronDown className={cn("h-3 w-3 transition-transform", isEditing && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
    </div>
  ) : (
    // Guest or incomplete profile - assumptions messaging
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/50">
      <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="text-muted-foreground">
            Showing estimates for:{' '}
            <span className="font-medium text-foreground">{displayLabel}</span>
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            <span className="font-medium text-foreground">{financingLabel}</span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Your situation different?{' '}
          {user ? (
            <Link to="/profile?tab=settings" className="text-primary hover:underline">
              Complete your profile
            </Link>
          ) : (
            <Link to="/auth?tab=signup" className="text-primary hover:underline">
              Set up profile (free)
            </Link>
          )}
          <span className="mx-1.5 text-muted-foreground/40">·</span>
          <CollapsibleTrigger asChild>
            <button className="text-primary hover:underline">
              {isEditing ? 'Close' : 'Adjust assumptions'}
            </button>
          </CollapsibleTrigger>
        </p>
      </div>
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
      
      {/* Financing Method Toggle */}
      <div className="space-y-3">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Financing Method
        </Label>
        
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Include Mortgage</p>
              <p className="text-xs text-muted-foreground">
                {localIncludeMortgage 
                  ? 'Mortgage costs & monthly payments included' 
                  : 'Toggle on to add mortgage estimates'}
              </p>
            </div>
          </div>
          <Switch
            checked={localIncludeMortgage}
            onCheckedChange={setLocalIncludeMortgage}
          />
        </div>
      </div>
      
      {/* Mortgage Scenario - Only shown when mortgage enabled */}
      {localIncludeMortgage && (
        <>
          <Separator />
          
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Mortgage Scenario
            </Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Down Payment */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Down Payment</Label>
                <ToggleGroup
                  type="single"
                  value={downPaymentMode === 'preset' ? selectedPreset.toString() : 'custom'}
                  onValueChange={handleDownPaymentChange}
                  className="grid grid-cols-4 gap-1 p-1 bg-muted rounded-lg w-full"
                >
                  {DOWN_PAYMENT_PRESETS.map((percent) => (
                    <ToggleGroupItem 
                      key={percent}
                      value={percent.toString()} 
                      className="text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md py-1.5"
                    >
                      {percent}%
                    </ToggleGroupItem>
                  ))}
                  <ToggleGroupItem 
                    value="custom" 
                    className="text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md py-1.5"
                  >
                    Custom
                  </ToggleGroupItem>
                </ToggleGroup>
                
                {/* Custom input - only shown when "Custom" selected */}
                {downPaymentMode === 'custom' && (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₪</span>
                    <Input
                      type="text"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                      placeholder={(propertyPrice * 0.25).toLocaleString()}
                      className="h-9 pl-7 text-sm"
                    />
                  </div>
                )}
                
                {/* Summary line */}
                <p className="text-xs text-muted-foreground">
                  {downPaymentMode === 'preset' 
                    ? `= ${formatPrice(effectiveDownPayment.amount, 'ILS')} · Loan: ${formatPrice(loanAmount, 'ILS')}`
                    : effectiveDownPayment.amount > 0 
                      ? `= ${effectiveDownPayment.percent.toFixed(1)}% down · Loan: ${formatPrice(loanAmount, 'ILS')}`
                      : `Min ${minDownPaymentPercent}% for ${effectiveLtv}% max LTV`
                  }
                </p>
              </div>
              
              {/* Loan Term */}
              <div className="space-y-1.5">
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
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button 
          size="sm" 
          variant="ghost"
          onClick={handleReset}
          className="h-8 text-xs gap-1.5 text-muted-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setIsEditing(false)}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 text-xs"
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
