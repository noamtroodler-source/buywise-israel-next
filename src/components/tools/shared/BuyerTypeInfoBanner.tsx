/**
 * BuyerTypeInfoBanner - Legacy compatibility wrapper
 * 
 * This component now wraps the new BuyerProfileSelector for backwards compatibility.
 * New implementations should use BuyerProfileSelector directly for full multi-dimensional support.
 */

import { useState } from 'react';
import { ChevronDown, RotateCcw, Info, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BuyerProfileDimensions, deriveEffectiveBuyerType, mapLegacyBuyerCategory } from '@/lib/calculations/buyerProfile';

export type BuyerCategory = 'first_time' | 'oleh' | 'additional' | 'non_resident' | 'upgrader' | 'investor' | 'foreign' | 'company';

export interface BuyerTypeOption {
  value: BuyerCategory;
  label: string;
  description: string;
}

const DEFAULT_BUYER_TYPE_OPTIONS: BuyerTypeOption[] = [
  { value: 'first_time', label: 'First-Time Buyer', description: 'No property in Israel, not a new Oleh' },
  { value: 'oleh', label: 'Oleh Hadash', description: 'Made aliyah within 7 years' },
  { value: 'additional', label: 'Additional Property', description: 'Already own property in Israel' },
  { value: 'non_resident', label: 'Non-Resident / Foreign', description: 'Not an Israeli tax resident' },
];

const EXTENDED_BUYER_TYPE_OPTIONS: BuyerTypeOption[] = [
  { value: 'first_time', label: 'First-Time Buyer', description: 'No property in Israel, not a new Oleh' },
  { value: 'oleh', label: 'Oleh Hadash', description: 'Made aliyah within 7 years' },
  { value: 'upgrader', label: 'Upgrader', description: 'Selling current home within 18 months' },
  { value: 'investor', label: 'Investor', description: 'Already own property in Israel' },
  { value: 'foreign', label: 'Foreign Resident', description: 'Not an Israeli tax resident' },
  { value: 'company', label: 'Corporate Buyer', description: 'Purchasing as a company' },
];

interface BuyerTypeInfoBannerProps {
  selectedType: BuyerCategory;
  onTypeChange: (type: BuyerCategory) => void;
  profileType?: BuyerCategory | null;
  className?: string;
  /** Use extended options including upgrader, investor, foreign, company */
  extended?: boolean;
  /** Callback when Oleh first-property status changes. true = first property (75% LTV), false = owns property (50% LTV) */
  onOlehFirstPropertyChange?: (isFirstProperty: boolean) => void;
  /** Current value of the Oleh first-property toggle */
  olehIsFirstProperty?: boolean;
}

/**
 * Map a BuyerCategory to BuyerProfileDimensions
 */
export function categoryToDimensions(category: BuyerCategory): BuyerProfileDimensions {
  return mapLegacyBuyerCategory(category) as BuyerProfileDimensions;
}

/**
 * Map BuyerProfileDimensions to a BuyerCategory
 */
export function dimensionsToCategory(dimensions: BuyerProfileDimensions): BuyerCategory {
  const derived = deriveEffectiveBuyerType(dimensions);
  return derived.taxType as BuyerCategory;
}

export function BuyerTypeInfoBanner({
  selectedType,
  onTypeChange,
  profileType,
  className,
  extended = false,
  onOlehFirstPropertyChange,
  olehIsFirstProperty = true,
}: BuyerTypeInfoBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const options = extended ? EXTENDED_BUYER_TYPE_OPTIONS : DEFAULT_BUYER_TYPE_OPTIONS;
  const currentOption = options.find(opt => opt.value === selectedType) || options[0];
  const isOverridden = profileType && profileType !== selectedType;

  const handleSelect = (value: BuyerCategory) => {
    onTypeChange(value);
    setIsOpen(false);
  };

  const handleResetToProfile = () => {
    if (profileType) {
      onTypeChange(profileType);
      setIsOpen(false);
    }
  };

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
              aria-label="Change buyer type"
            >
              {currentOption?.label || 'Unknown'}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-72 p-3" 
            align="start" 
            sideOffset={8}
          >
            {selectedType === 'oleh' && onOlehFirstPropertyChange && (
              <>
                <div className="px-1 space-y-1.5 mb-2">
                  <p className="text-xs font-medium text-foreground">Is this your first property in Israel?</p>
                  <RadioGroup
                    value={olehIsFirstProperty ? 'yes' : 'no'}
                    onValueChange={(v) => onOlehFirstPropertyChange(v === 'yes')}
                    className="space-y-0.5"
                  >
                    <Label htmlFor="oleh-first-yes" className={cn(
                      "flex items-center gap-2 rounded-md p-2 cursor-pointer transition-colors hover:bg-muted/50 text-sm",
                      olehIsFirstProperty && "bg-muted"
                    )}>
                      <RadioGroupItem value="yes" id="oleh-first-yes" />
                      <span>Yes, first property</span>
                    </Label>
                    <Label htmlFor="oleh-first-no" className={cn(
                      "flex items-center gap-2 rounded-md p-2 cursor-pointer transition-colors hover:bg-muted/50 text-sm",
                      !olehIsFirstProperty && "bg-muted"
                    )}>
                      <RadioGroupItem value="no" id="oleh-first-no" />
                      <span>No, I own property</span>
                    </Label>
                  </RadioGroup>
                </div>
                <div className="border-t mb-2" />
              </>
            )}

            <RadioGroup
              value={selectedType}
              onValueChange={(value) => handleSelect(value as BuyerCategory)}
              className="space-y-1"
            >
              {options.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={option.value}
                  className={cn(
                    "flex items-start gap-3 rounded-md p-2.5 cursor-pointer transition-colors",
                    "hover:bg-muted/50",
                    selectedType === option.value && "bg-muted"
                  )}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-0.5">
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </Label>
              ))}
            </RadioGroup>

            {isOverridden && profileType && (
              <>
                <div className="border-t my-2" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToProfile}
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to my profile
                </Button>
              </>
            )}
          </PopoverContent>
        </Popover>
        <span> rates.</span>
        {isOverridden && (
          <span className="text-muted-foreground text-xs ml-1.5">(modified)</span>
        )}
      </div>
    </div>
  );
}

// Re-export the new component for gradual migration
export { BuyerProfileSelector, useBuyerProfileState } from './BuyerProfileSelector';
