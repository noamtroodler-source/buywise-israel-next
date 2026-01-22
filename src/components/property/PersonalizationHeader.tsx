import { useState, useEffect } from 'react';
import { DollarSign, ChevronDown, Info, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { useMortgagePreferences, MortgagePreferences } from '@/hooks/useMortgagePreferences';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BuyerProfileDimensions, deriveEffectiveBuyerType, LTV_LIMITS } from '@/lib/calculations/buyerProfile';
import { BuyerProfileSelector, useBuyerProfileState } from '@/components/tools/shared/BuyerProfileSelector';

const LOCAL_STORAGE_KEY = 'guest_buyer_profile';

interface PersonalizationHeaderProps {
  buyerCategoryLabel: string;
  hasProfile: boolean;
  downPaymentPercent: number;
  termYears: number;
  propertyPrice: number;
  ltvLimit: number;
  // New props for profile override
  savedProfileDimensions?: BuyerProfileDimensions | null;
  onProfileOverride?: (profile: BuyerProfileDimensions | null) => void;
}

const TERM_OPTIONS = [15, 20, 25, 30];

// Load guest profile from localStorage
function getGuestProfile(): BuyerProfileDimensions | null {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// Save guest profile to localStorage
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
  
  // Local buyer profile state for what-if testing
  const defaultProfile: BuyerProfileDimensions = savedProfileDimensions || {
    residency_status: 'israeli_resident',
    is_first_property: true,
    buyer_entity: 'individual',
    aliyah_year: null,
    is_upgrading: false,
  };
  
  const [localProfile, setLocalProfile] = useState<BuyerProfileDimensions>(() => {
    // For guests, try to load from localStorage
    if (!user) {
      return getGuestProfile() || defaultProfile;
    }
    return savedProfileDimensions || defaultProfile;
  });
  
  // Update local profile when saved profile changes
  useEffect(() => {
    if (savedProfileDimensions) {
      setLocalProfile(savedProfileDimensions);
    }
  }, [savedProfileDimensions]);
  
  // Handle profile change - update parent immediately for live recalc
  const handleProfileChange = (newProfile: BuyerProfileDimensions) => {
    setLocalProfile(newProfile);
    onProfileOverride?.(newProfile);
    
    // For guests, persist to localStorage
    if (!user) {
      saveGuestProfile(newProfile);
    }
  };
  
  // Derive the current buyer type label from local profile
  const derived = deriveEffectiveBuyerType(localProfile);
  const currentLabel = derived.shortLabel;
  
  // Check if profile is modified from saved
  const isProfileModified = savedProfileDimensions && (
    localProfile.residency_status !== savedProfileDimensions.residency_status ||
    localProfile.is_first_property !== savedProfileDimensions.is_first_property ||
    localProfile.buyer_entity !== savedProfileDimensions.buyer_entity ||
    localProfile.is_upgrading !== savedProfileDimensions.is_upgrading ||
    localProfile.aliyah_year !== savedProfileDimensions.aliyah_year
  );
  
  // Local form state for mortgage
  const [localDownPaymentPercent, setLocalDownPaymentPercent] = useState<string>(
    preferences.down_payment_percent?.toString() || ''
  );
  const [localDownPaymentAmount, setLocalDownPaymentAmount] = useState<string>(
    preferences.down_payment_amount?.toString() || ''
  );
  const [localTermYears, setLocalTermYears] = useState<number>(preferences.term_years);
  
  // Calculate min down payment based on effective LTV from profile
  const effectiveLtvInfo = LTV_LIMITS[derived.taxType];
  const effectiveLtv = effectiveLtvInfo?.maxLtv ?? ltvLimit;
  const minDownPaymentPercent = 100 - effectiveLtv;
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
  
  // Handle reset for guests
  const handleReset = () => {
    const resetProfile: BuyerProfileDimensions = {
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

  // Guest view - now with inline editing
  if (!user) {
    return (
      <Collapsible open={isEditing} onOpenChange={setIsEditing}>
        <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-muted/50 text-sm">
          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground flex-1">
            Calculating for{' '}
            <span className="font-medium text-foreground">{currentLabel}</span>
            <span className="mx-1">·</span>
            <span className="font-medium text-foreground">{downPaymentPercent}% down</span>
            <span className="mx-1">·</span>
            <span className="font-medium text-foreground">{termYears}yr</span>
          </span>
          <CollapsibleTrigger asChild>
            <button className="inline-flex items-center gap-0.5 text-primary hover:underline text-sm">
              Edit
              <ChevronDown className={cn("h-3 w-3 transition-transform", isEditing && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <div className="mt-3 p-4 rounded-lg bg-muted/30 space-y-4">
            {/* Buyer Profile Section */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Buyer Profile
              </Label>
              <BuyerProfileSelector
                profile={localProfile}
                onProfileChange={handleProfileChange}
                savedProfile={null}
                className="border-0 bg-transparent p-0"
              />
            </div>
            
            <Separator />
            
            {/* Down Payment */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Down Payment
                </Label>
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
                Min {minDownPaymentPercent}% ({formatPrice(minDownPaymentAmount, 'ILS')}) for {effectiveLtv}% LTV
              </p>
            </div>
            
            {/* Loan Term */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Loan Term
              </Label>
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
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleReset}
                  className="h-7 text-xs gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
              </div>
              <div className="flex items-center gap-2">
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
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Logged-in user view
  return (
    <Collapsible open={isEditing} onOpenChange={setIsEditing}>
      <div className="flex items-center gap-2 text-sm">
        <DollarSign className="h-4 w-4 text-primary shrink-0" />
        <span className="text-muted-foreground">
          Calculating for:{' '}
          <span className="font-medium text-foreground">{isProfileModified ? currentLabel : buyerCategoryLabel}</span>
          {isProfileModified && <span className="text-xs text-muted-foreground/70 ml-1">(modified)</span>}
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
        <div className="mt-3 p-4 rounded-lg bg-muted/30 space-y-4">
          {/* Buyer Profile Section - now inline */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Buyer Profile
            </Label>
            <BuyerProfileSelector
              profile={localProfile}
              onProfileChange={handleProfileChange}
              savedProfile={savedProfileDimensions}
              className="border-0 bg-transparent p-0"
            />
          </div>
          
          <Separator />
          
          {/* Down Payment */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Down Payment
              </Label>
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
              Min {minDownPaymentPercent}% ({formatPrice(minDownPaymentAmount, 'ILS')}) for {effectiveLtv}% LTV
            </p>
          </div>
          
          {/* Loan Term */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Loan Term
            </Label>
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
              {isSaving ? 'Saving...' : 'Save to Profile'}
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
