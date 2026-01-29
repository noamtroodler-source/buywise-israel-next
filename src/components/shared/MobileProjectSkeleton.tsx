import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MobileProjectSkeletonProps {
  className?: string;
}

/**
 * Enhanced skeleton loader for project cards on mobile
 * Matches the actual project card layout with progress bar
 */
export function MobileProjectSkeleton({ className }: MobileProjectSkeletonProps) {
  return (
    <div className={cn(
      "rounded-xl border border-border/60 overflow-hidden bg-card",
      className
    )}>
      {/* Image skeleton with shimmer */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      
      {/* Content skeleton */}
      <div className="p-5 space-y-3">
        {/* Project name & developer */}
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-24" />
        </div>
        
        {/* Location */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3 w-40" />
        </div>
        
        {/* Unit types & completion */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
        
        {/* Price section */}
        <div className="pt-3 border-t border-border space-y-1">
          <Skeleton className="h-2 w-16" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of project skeleton loaders
 */
export function MobileProjectsSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <MobileProjectSkeleton key={i} />
      ))}
    </div>
  );
}
