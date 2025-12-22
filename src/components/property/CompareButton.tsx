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
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        "bg-background/80 hover:bg-background transition-colors",
        isSelected 
          ? "text-primary" 
          : "text-muted-foreground hover:text-primary",
        className
      )}
    >
      <GitCompare className={cn("h-4 w-4", isSelected && "fill-current")} />
    </Button>
  );
}
