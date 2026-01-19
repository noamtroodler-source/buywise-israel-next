import { Loader2, Check, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveStatusIndicatorProps {
  isSaving: boolean;
  lastSavedAt: Date | null;
  isDirty: boolean;
  error?: string | null;
  className?: string;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 10) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}

export function SaveStatusIndicator({
  isSaving,
  lastSavedAt,
  isDirty,
  error,
  className,
}: SaveStatusIndicatorProps) {
  if (error) {
    return (
      <div className={cn('flex items-center gap-1.5 text-sm text-destructive', className)}>
        <AlertCircle className="h-3.5 w-3.5" />
        <span>{error}</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (isDirty) {
    return (
      <div className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
        <Circle className="h-3.5 w-3.5 fill-current" />
        <span>Unsaved changes</span>
      </div>
    );
  }

  if (lastSavedAt) {
    return (
      <div className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
        <Check className="h-3.5 w-3.5 text-primary" />
        <span>Draft saved {formatTimeAgo(lastSavedAt)}</span>
      </div>
    );
  }

  return null;
}
