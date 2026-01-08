import { useState, useMemo } from 'react';
import { ChevronDown, RotateCcw, Info, Check, AlertTriangle, Building2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  BuyerProfileDimensions, 
  deriveEffectiveBuyerType, 
  DerivedBuyerType,
  LTV_LIMITS 
} from '@/lib/calculations/buyerProfile';

interface BuyerProfileSelectorProps {
  profile: BuyerProfileDimensions;
  onProfileChange: (profile: BuyerProfileDimensions) => void;
  savedProfile?: BuyerProfileDimensions | null;
  className?: string;
  compact?: boolean;
}

const currentYear = new Date().getFullYear();
const aliyahYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

export function BuyerProfileSelector({
  profile,
  onProfileChange,
  savedProfile,
  className,
  compact = false,
}: BuyerProfileSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const derived = useMemo(() => deriveEffectiveBuyerType(profile), [profile]);
  const savedDerived = useMemo(
    () => savedProfile ? deriveEffectiveBuyerType(savedProfile) : null,
    [savedProfile]
  );
  
  const isModified = savedProfile && (
    profile.residency_status !== savedProfile.residency_status ||
    profile.is_first_property !== savedProfile.is_first_property ||
    profile.buyer_entity !== savedProfile.buyer_entity ||
    profile.is_upgrading !== savedProfile.is_upgrading ||
    profile.aliyah_year !== savedProfile.aliyah_year
  );
  
  const handleResetToSaved = () => {
    if (savedProfile) {
      onProfileChange(savedProfile);
      setIsOpen(false);
    }
  };
  
  const updateProfile = (updates: Partial<BuyerProfileDimensions>) => {
    onProfileChange({ ...profile, ...updates });
  };
  
  const ltvInfo = LTV_LIMITS[derived.taxType];

  return (
    <div className={cn(
      "flex items-start gap-3 rounded-lg border p-4 bg-primary/5 border-primary/20 text-foreground",
      className
    )}>
      <Info className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
      <div className="text-sm flex-1">
        <span>Calculations reflect </span>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              className="inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Change buyer profile"
            >
              {derived.label}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-80 p-0" 
            align="start" 
            sideOffset={8}
          >
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Customize Your Profile</h4>
                <p className="text-xs text-muted-foreground">
                  Adjust to see how different scenarios affect calculations
                </p>
              </div>
              
              {/* Tax Status */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tax Status
                </Label>
                <RadioGroup
                  value={profile.residency_status}
                  onValueChange={(v) => updateProfile({ 
                    residency_status: v as BuyerProfileDimensions['residency_status'],
                    // Clear aliyah year if not oleh
                    aliyah_year: v === 'oleh_hadash' ? profile.aliyah_year : null,
                  })}
                  className="grid grid-cols-1 gap-1"
                >
                  <Label
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors text-sm",
                      "hover:bg-muted/50",
                      profile.residency_status === 'israeli_resident' && "bg-muted"
                    )}
                  >
                    <RadioGroupItem value="israeli_resident" className="h-3.5 w-3.5" />
                    Israeli Resident (7+ Years)
                  </Label>
                  <Label
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 cursor-pointer transition-colors text-sm",
                      "hover:bg-muted/50",
                      profile.residency_status === 'oleh_hadash' && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="oleh_hadash" className="h-3.5 w-3.5" />
                      New Oleh (Within 7 Years)
                    </div>
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Tax Benefit</span>
                  </Label>
                  <Label
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors text-sm",
                      "hover:bg-muted/50",
                      profile.residency_status === 'non_resident' && "bg-muted"
                    )}
                  >
                    <RadioGroupItem value="non_resident" className="h-3.5 w-3.5" />
                    Non-Resident
                  </Label>
                </RadioGroup>
              </div>
              
              {/* Aliyah Year - only for Oleh */}
              {profile.residency_status === 'oleh_hadash' && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Year of Aliyah
                  </Label>
                  <Select
                    value={profile.aliyah_year?.toString() || ''}
                    onValueChange={(v) => updateProfile({ aliyah_year: parseInt(v) })}
                  >
                    <SelectTrigger className="h-9">
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
              
              {/* Property Ownership */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Property Ownership
                </Label>
                <RadioGroup
                  value={
                    profile.is_upgrading 
                      ? 'upgrading' 
                      : profile.is_first_property 
                        ? 'first' 
                        : 'additional'
                  }
                  onValueChange={(v) => {
                    if (v === 'first') {
                      updateProfile({ is_first_property: true, is_upgrading: false });
                    } else if (v === 'upgrading') {
                      updateProfile({ is_first_property: false, is_upgrading: true });
                    } else {
                      updateProfile({ is_first_property: false, is_upgrading: false });
                    }
                  }}
                  className="grid grid-cols-1 gap-1"
                >
                  <Label
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors text-sm",
                      "hover:bg-muted/50",
                      profile.is_first_property && !profile.is_upgrading && "bg-muted"
                    )}
                  >
                    <RadioGroupItem value="first" className="h-3.5 w-3.5" />
                    First Property
                  </Label>
                  <Label
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors text-sm",
                      "hover:bg-muted/50",
                      profile.is_upgrading && "bg-muted"
                    )}
                  >
                    <RadioGroupItem value="upgrading" className="h-3.5 w-3.5" />
                    <div>
                      <span>Upgrading</span>
                      <span className="text-xs text-muted-foreground ml-1">(selling within 18 months)</span>
                    </div>
                  </Label>
                  <Label
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors text-sm",
                      "hover:bg-muted/50",
                      !profile.is_first_property && !profile.is_upgrading && "bg-muted"
                    )}
                  >
                    <RadioGroupItem value="additional" className="h-3.5 w-3.5" />
                    Additional Property
                  </Label>
                </RadioGroup>
              </div>
              
              {/* Entity Type */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Buying As
                </Label>
                <div className="flex items-center gap-3">
                  <Label
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors text-sm flex-1",
                      "hover:bg-muted/50 border",
                      profile.buyer_entity === 'individual' && "bg-muted border-primary"
                    )}
                    onClick={() => updateProfile({ buyer_entity: 'individual' })}
                  >
                    {profile.buyer_entity === 'individual' && <Check className="h-3.5 w-3.5 text-primary" />}
                    Individual
                  </Label>
                  <Label
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors text-sm flex-1",
                      "hover:bg-muted/50 border",
                      profile.buyer_entity === 'company' && "bg-muted border-primary"
                    )}
                    onClick={() => updateProfile({ buyer_entity: 'company' })}
                  >
                    {profile.buyer_entity === 'company' && <Check className="h-3.5 w-3.5 text-primary" />}
                    <Building2 className="h-3.5 w-3.5" />
                    Company
                  </Label>
                </div>
              </div>
              
              <Separator />
              
              {/* Derived Result */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Effective Tax Category
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {derived.shortLabel}
                  </Badge>
                </div>
                
                {derived.benefits.length > 0 && (
                  <div className="space-y-1">
                    {derived.benefits.slice(0, 2).map((benefit, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                )}
                
                {derived.warnings && derived.warnings.length > 0 && (
                  <div className="space-y-1">
                    {derived.warnings.slice(0, 1).map((warning, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-amber-600">
                        <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Max LTV: {ltvInfo.maxLtv}%
                </div>
              </div>
              
              {/* Reset Button */}
              {isModified && savedProfile && (
                <>
                  <Separator />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetToSaved}
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset to my saved profile
                  </Button>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <span> rates.</span>
        {isModified && (
          <span className="text-muted-foreground text-xs ml-1.5">(modified)</span>
        )}
      </div>
    </div>
  );
}

// Hook to manage buyer profile state with defaults
export function useBuyerProfileState(
  savedProfile?: BuyerProfileDimensions | null
): [BuyerProfileDimensions, (profile: BuyerProfileDimensions) => void] {
  const defaultProfile: BuyerProfileDimensions = {
    residency_status: 'israeli_resident',
    is_first_property: true,
    buyer_entity: 'individual',
    aliyah_year: null,
    is_upgrading: false,
  };
  
  const [profile, setProfile] = useState<BuyerProfileDimensions>(
    savedProfile || defaultProfile
  );
  
  return [profile, setProfile];
}
