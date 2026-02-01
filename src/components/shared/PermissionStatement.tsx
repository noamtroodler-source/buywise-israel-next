import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PermissionStatementProps {
  variant: 'inline' | 'card' | 'subtle';
  message?: string;
  onSave?: () => void;
  showSaveButton?: boolean;
  guideLink?: string;
  guideLinkText?: string;
  className?: string;
}

const defaultMessages = {
  inline: "Not ready to reach out? That's okay.",
  card: "Take your time. There's no rush. We'll be here when you're ready.",
  subtle: "If you're not ready, that's fine.",
};

export function PermissionStatement({ 
  variant, 
  message,
  onSave,
  showSaveButton = true,
  guideLink = '/guides/talking-to-professionals',
  guideLinkText = 'Prepare first',
  className,
}: PermissionStatementProps) {
  const displayMessage = message || defaultMessages[variant];

  if (variant === 'subtle') {
    return (
      <p className={cn("text-sm text-muted-foreground text-center mt-4", className)}>
        {displayMessage}
      </p>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn("pt-3 border-t border-border/50 mt-3", className)}>
        <p className="text-xs text-muted-foreground text-center mb-2">
          {displayMessage}
        </p>
        <div className="flex gap-2">
          {showSaveButton && onSave && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 text-xs" 
              onClick={onSave}
            >
              <Heart className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("text-xs", showSaveButton && onSave ? "flex-1" : "w-full")} 
            asChild
          >
            <Link to={guideLink}>
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              {guideLinkText}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <div className={cn("p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3", className)}>
      <p className="text-sm text-muted-foreground text-center">
        {displayMessage}
      </p>
      <div className="flex gap-2">
        {showSaveButton && onSave && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1" 
            onClick={onSave}
          >
            Save for later
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(showSaveButton && onSave ? "flex-1" : "w-full")} 
          asChild
        >
          <Link to={guideLink}>
            {guideLinkText}
          </Link>
        </Button>
      </div>
    </div>
  );
}
