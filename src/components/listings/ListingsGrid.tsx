import { ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListingsGridProps {
  children: ReactNode;
  isFetching?: boolean;
  className?: string;
}

/**
 * Wrapper component that shows a dimmed overlay with spinner
 * when results are being refetched (filter changes)
 */
export const ListingsGrid = forwardRef<HTMLDivElement, ListingsGridProps>(
  function ListingsGrid({ children, isFetching, className }, ref) {
    return (
      <div ref={ref} className={cn("relative", className)}>
        {/* Dimmed overlay with spinner - only shown during refetch */}
        {isFetching && (
          <div 
            className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex items-center justify-center transition-opacity duration-200"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="bg-background/90 rounded-full p-3 shadow-lg">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </div>
        )}
        
        {/* Content - disable pointer events during refetch */}
        <div className={cn(isFetching && "pointer-events-none select-none")}>
          {children}
        </div>
      </div>
    );
  }
);
