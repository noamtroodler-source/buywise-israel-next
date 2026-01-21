import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectFavorites } from '@/hooks/useProjectFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ProjectFavoriteButtonProps {
  projectId: string;
  className?: string;
}

export function ProjectFavoriteButton({ projectId, className }: ProjectFavoriteButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggleProjectFavorite, isProjectFavorite, isToggling } = useProjectFavorites();
  const isFavorite = isProjectFavorite(projectId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    toggleProjectFavorite(projectId);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isToggling}
      className={cn(
        "h-8 w-8 bg-background/80 hover:bg-background transition-colors",
        isFavorite 
          ? "text-destructive hover:text-destructive/80" 
          : "text-muted-foreground hover:text-destructive",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
    </Button>
  );
}
