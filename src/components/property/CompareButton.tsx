import { GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/contexts/CompareContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CompareButtonProps {
  propertyId: string;
  className?: string;
}

export function CompareButton({ propertyId, className }: CompareButtonProps) {
  const { addToCompare, removeFromCompare, isInCompare, compareIds, maxItems } = useCompare();
  const isSelected = isInCompare(propertyId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSelected) {
      removeFromCompare(propertyId);
    } else {
      if (compareIds.length >= maxItems) {
        toast.error(`You can compare up to ${maxItems} properties`);
        return;
      }
      addToCompare(propertyId);
    }
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={handleClick}
      className={cn(
        "h-8 w-8 rounded-full transition-all",
        isSelected 
          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
          : "bg-background/80 backdrop-blur-sm hover:bg-background",
        className
      )}
    >
      <GitCompare className="h-4 w-4" />
    </Button>
  );
}
