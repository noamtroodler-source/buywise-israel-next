import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MobilePropertySkeletonProps {
  variant?: 'card' | 'carousel';
  className?: string;
}

/**
 * Enhanced skeleton loader for property cards on mobile
 * Matches the actual card layout with shimmer animation
 */
export function MobilePropertySkeleton({ variant = 'card', className }: MobilePropertySkeletonProps) {
  return (
    <div className={cn(
      "rounded-xl border border-border/60 overflow-hidden bg-card",
      variant === 'carousel' && "min-w-[280px] snap-start",
      className
    )}>
      {/* Image skeleton with shimmer */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Price */}
        <Skeleton className="h-6 w-28" />
        
        {/* Title */}
        <Skeleton className="h-4 w-full" />
        
        {/* Location */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
        
        {/* Stats row */}
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of skeleton loaders for listings page
 */
export function MobileListingsSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <MobilePropertySkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Horizontal carousel skeleton for mobile
 */
export function MobileCarouselSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
      {Array.from({ length: count }).map((_, i) => (
        <MobilePropertySkeleton key={i} variant="carousel" />
      ))}
    </div>
  );
}
