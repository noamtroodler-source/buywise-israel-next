import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useMortgagePreferences, MortgagePreferences } from '@/hooks/useMortgagePreferences';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BuyerProfileDimensions, deriveEffectiveBuyerType, LTV_LIMITS } from '@/lib/calculations/buyerProfile';

const LOCAL_STORAGE_KEY = 'guest_buyer_profile';

interface PersonalizationHeaderProps {
  buyerCategoryLabel: string;
  hasProfile: boolean;
  downPaymentPercent: number;
  termYears: number;
  propertyPrice: number;
  ltvLimit: number;
  savedProfileDimensions?: BuyerProfileDimensions | null;
  onProfileOverride?: (profile: BuyerProfileDimensions | null) => void;
}

const TERM_OPTIONS = [15, 20, 25, 30];
const currentYear = new Date().getFullYear();
const aliyahYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

function getGuestProfile(): BuyerProfileDimensions | null {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveGuestProfile(profile: BuyerProfileDimensions): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Silently fail
  }
}

export function PersonalizationHeader({
  buyerCategoryLabel,
  hasProfile,
  downPaymentPercent,
  termYears,
  propertyPrice,
  ltvLimit,
  savedProfileDimensions,
  onProfileOverride,
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
  
  const defaultProfile: BuyerProfileDimensions = savedProfileDimensions || {
    residency_status: 'israeli_resident',
    is_first_property: true,
    buyer_entity: 'individual',
    aliyah_year: null,
    is_upgrading: false,
  };
  
  const [localProfile, setLocalProfile] = useState<BuyerProfileDimensions>(() => {
    if (!user) {
      return getGuestProfile() || defaultProfile;
    }
    return savedProfileDimensions || defaultProfile;
  });
  
  useEffect(() => {
    if (savedProfileDimensions) {
      setLocalProfile(savedProfileDimensions);
    }
  }, [savedProfileDimensions]);
  
  const handleProfileChange = (updates: Partial<BuyerProfileDimensions>) => {
    const newProfile = { ...localProfile, ...updates };
    setLocalProfile(newProfile);
    onProfileOverride?.(newProfile);
    
    if (!user) {
      saveGuestProfile(newProfile);
    }
  };
  
  const derived = useMemo(() => deriveEffectiveBuyerType(localProfile), [localProfile]);
  const currentLabel = derived.shortLabel;
  
  const isProfileModified = savedProfileDimensions && (
    localProfile.residency_status !== savedProfileDimensions.residency_status ||
    localProfile.is_first_property !== savedProfileDimensions.is_first_property ||
    localProfile.buyer_entity !== savedProfileDimensions.buyer_entity ||
    localProfile.is_upgrading !== savedProfileDimensions.is_upgrading ||
    localProfile.aliyah_year !== savedProfileDimensions.aliyah_year
  );
  
  const [localDownPaymentPercent, setLocalDownPaymentPercent] = useState<string>(
    preferences.down_payment_percent?.toString() || ''
  );
  const [localDownPaymentAmount, setLocalDownPaymentAmount] = useState<string>(
    preferences.down_payment_amount?.toString() || ''
  );
  const [localTermYears, setLocalTermYears] = useState<number>(preferences.term_years);
  
  const effectiveLtvInfo = LTV_LIMITS[derived.taxType];
  const effectiveLtv = effectiveLtvInfo?.maxLtv ?? ltvLimit;
  const minDownPaymentPercent = 100 - effectiveLtv;
  const minDownPaymentAmount = propertyPrice * (minDownPaymentPercent / 100);
  
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
    const resetProfile: BuyerProfileDimensions = savedProfileDimensions || {
      residency_status: 'israeli_resident',
      is_first_property: true,
      buyer_entity: 'individual',
      aliyah_year: null,
      is_upgrading: false,
    };
    setLocalProfile(resetProfile);
    onProfileOverride?.(null);
    if (!user) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  // Get property status value for toggle
  const propertyStatusValue = localProfile.is_upgrading 
    ? 'upgrading' 
    : localProfile.is_first_property 
      ? 'first' 
      : 'additional';

  // Collapsed header bar
  const headerContent = (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">
        Calculating for:{' '}
        <span className="font-medium text-foreground">{isProfileModified ? currentLabel : (user ? buyerCategoryLabel : currentLabel)}</span>
        {isProfileModified && <span className="text-xs text-muted-foreground/70 ml-1">(modified)</span>}
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

  // Expanded panel content - shared between guest and logged-in
  const panelContent = (
    <div className="mt-3 p-4 rounded-xl border bg-card space-y-5">
      {/* Tax Status - Segmented Toggle */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Tax Status
        </Label>
        <ToggleGroup
          type="single"
          value={localProfile.residency_status}
          onValueChange={(v) => {
            if (v) {
              handleProfileChange({ 
                residency_status: v as BuyerProfileDimensions['residency_status'],
                aliyah_year: v === 'oleh_hadash' ? localProfile.aliyah_year : null,
              });
            }
          }}
          className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg w-full"
        >
          <ToggleGroupItem 
            value="israeli_resident" 
            className="text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md px-2 py-1.5"
          >
            Resident
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="oleh_hadash" 
            className="text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md px-2 py-1.5"
          >
            New Oleh
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="non_resident" 
            className="text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md px-2 py-1.5"
          >
            Non-Resident
          </ToggleGroupItem>
        </ToggleGroup>
        
        {/* Aliyah Year - only for Oleh */}
        {localProfile.residency_status === 'oleh_hadash' && (
          <div className="flex items-center gap-2 mt-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Aliyah Year:</Label>
            <Select
              value={localProfile.aliyah_year?.toString() || ''}
              onValueChange={(v) => handleProfileChange({ aliyah_year: parseInt(v) })}
            >
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {aliyahYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
                <SelectItem value={(currentYear - 10).toString()}>
                  Before {currentYear - 9}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Property Status - Segmented Toggle */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Property Status
        </Label>
        <ToggleGroup
          type="single"
          value={propertyStatusValue}
          onValueChange={(v) => {
            if (v === 'first') {
              handleProfileChange({ is_first_property: true, is_upgrading: false });
            } else if (v === 'upgrading') {
              handleProfileChange({ is_first_property: false, is_upgrading: true });
            } else if (v === 'additional') {
              handleProfileChange({ is_first_property: false, is_upgrading: false });
            }
          }}
          className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg w-full"
        >
          <ToggleGroupItem 
            value="first" 
            className="text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md px-2 py-1.5"
          >
            First Home
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="upgrading" 
            className="text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md px-2 py-1.5"
          >
            Upgrading
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="additional" 
            className="text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md px-2 py-1.5"
          >
            Additional
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      {/* Buying As - Only show if relevant (most users are individuals) */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Buying As
        </Label>
        <ToggleGroup
          type="single"
          value={localProfile.buyer_entity}
          onValueChange={(v) => {
            if (v) handleProfileChange({ buyer_entity: v as 'individual' | 'company' });
          }}
          className="flex gap-1 p-1 bg-muted rounded-lg w-fit"
        >
          <ToggleGroupItem 
            value="individual" 
            className="text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md px-3 py-1.5"
          >
            Individual
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="company" 
            className="text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md px-3 py-1.5"
          >
            Company
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      {/* Divider */}
      <div className="border-t" />
      
      {/* Financing Section - Two Column Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Down Payment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Down Payment
            </Label>
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
            Min {minDownPaymentPercent}% for {effectiveLtv}% LTV
          </p>
        </div>
        
        {/* Loan Term - Segmented Toggle */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Loan Term
          </Label>
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
                className="text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md px-2 py-1.5"
              >
                {years}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="text-[10px] text-muted-foreground">years</p>
        </div>
      </div>
      
      {/* Effective Category Summary */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
        <span>
          Effective: <span className="font-medium text-foreground">{derived.label}</span>
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
          {user ? (
            <>
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
                {isSaving ? 'Saving...' : 'Save to Profile'}
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="h-7 text-xs"
              >
                Close
              </Button>
              <Link to="/auth?tab=signup">
                <Button size="sm" className="h-7 text-xs">
                  Sign Up to Save
                </Button>
              </Link>
            </>
          )}
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
