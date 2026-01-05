import { useState } from 'react';
import { ChevronDown, RotateCcw, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type BuyerCategory = 'first_time' | 'oleh' | 'additional' | 'non_resident';

const BUYER_TYPE_OPTIONS: {
  value: BuyerCategory;
  label: string;
  description: string;
}[] = [
  { value: 'first_time', label: 'First-Time Buyer', description: 'Israeli resident, first property' },
  { value: 'oleh', label: 'Oleh Hadash', description: 'New immigrant (within 7 years)' },
  { value: 'additional', label: 'Additional Property', description: 'Already own property in Israel' },
  { value: 'non_resident', label: 'Non-Resident / Foreign', description: 'Not an Israeli tax resident' },
];

interface BuyerTypeInfoBannerProps {
  selectedType: BuyerCategory;
  onTypeChange: (type: BuyerCategory) => void;
  profileType?: BuyerCategory | null;
  className?: string;
}

export function BuyerTypeInfoBanner({
  selectedType,
  onTypeChange,
  profileType,
  className,
}: BuyerTypeInfoBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentOption = BUYER_TYPE_OPTIONS.find(opt => opt.value === selectedType);
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
            <RadioGroup
              value={selectedType}
              onValueChange={(value) => handleSelect(value as BuyerCategory)}
              className="space-y-1"
            >
              {BUYER_TYPE_OPTIONS.map((option) => (
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
