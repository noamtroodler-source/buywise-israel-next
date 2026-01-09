import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataFetchErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export function DataFetchError({ 
  message = "Failed to load data", 
  onRetry,
  className,
  compact = false
}: DataFetchErrorProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg", className)}>
        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
        <span>{message}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="h-7 px-2 ml-auto">
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("text-center py-12 space-y-4", className)}>
      <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground">Please try again or check back later.</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}
