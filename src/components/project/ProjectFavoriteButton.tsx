import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectFavorites } from '@/hooks/useProjectFavorites';
import { cn } from '@/lib/utils';

interface ProjectFavoriteButtonProps {
  projectId: string;
  className?: string;
}

export function ProjectFavoriteButton({ projectId, className }: ProjectFavoriteButtonProps) {
  const { toggleProjectFavorite, isProjectFavorite, isToggling } = useProjectFavorites();
  const isFavorite = isProjectFavorite(projectId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Guests can now favorite - stored in sessionStorage
    toggleProjectFavorite(projectId);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isToggling}
      className={cn(
        "h-8 w-8 rounded-md bg-background/80 hover:bg-background transition-colors",
        isFavorite 
          ? "text-primary hover:text-primary/80" 
          : "text-muted-foreground hover:text-primary",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
    </Button>
  );
}
