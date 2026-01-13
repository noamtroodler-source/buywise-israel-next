import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useUpdateBuyerProfile } from '@/hooks/useBuyerProfile';
import { 
  ARNONA_DISCOUNTS, 
  SELECTABLE_ARNONA_DISCOUNTS, 
  ArnonaDiscountCategory 
} from '@/lib/calculations/arnona';

interface ArnonaDiscountEditorProps {
  open: boolean;
  onClose: () => void;
  currentDiscounts: ArnonaDiscountCategory[];
}

export function ArnonaDiscountEditor({ open, onClose, currentDiscounts }: ArnonaDiscountEditorProps) {
  const [selected, setSelected] = useState<ArnonaDiscountCategory[]>(currentDiscounts);
  const updateProfile = useUpdateBuyerProfile();
  
  const handleToggle = (category: ArnonaDiscountCategory) => {
    setSelected(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const handleSave = async () => {
    await updateProfile.mutateAsync({
      arnona_discount_categories: selected,
    });
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Arnona Discounts</DialogTitle>
          <DialogDescription>
            Select any discounts you're eligible for. Israel typically allows claiming the highest single discount.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {SELECTABLE_ARNONA_DISCOUNTS.map((category) => {
            const discount = ARNONA_DISCOUNTS[category];
            return (
              <div 
                key={category}
                className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => handleToggle(category)}
              >
                <Checkbox 
                  id={category}
                  checked={selected.includes(category)}
                  onCheckedChange={() => handleToggle(category)}
                />
                <div className="flex-1">
                  <Label htmlFor={category} className="font-medium cursor-pointer">
                    {discount.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {discount.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Note:</strong> New immigrant discounts (Year 1 & 2) are automatically detected from your Aliyah year if you've set your residency status to "Oleh Hadash".
        </p>
        
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateProfile.isPending}
            className="flex-1"
          >
            {updateProfile.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
