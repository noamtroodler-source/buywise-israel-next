import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface LiveIndicatorProps {
  lastUpdated?: Date;
  queryKeys?: string[][];
  className?: string;
}

export function LiveIndicator({ lastUpdated, queryKeys = [], className }: LiveIndicatorProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayTime, setDisplayTime] = useState<string>('');

  // Update display time every 10 seconds
  useEffect(() => {
    const updateTime = () => {
      if (lastUpdated) {
        setDisplayTime(formatDistanceToNow(lastUpdated, { addSuffix: true }));
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Invalidate all provided query keys
    await Promise.all(
      queryKeys.map(key => queryClient.invalidateQueries({ queryKey: key }))
    );
    
    // Also invalidate common admin queries
    await queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
    await queryClient.invalidateQueries({ queryKey: ['admin-recent-activity'] });
    await queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
    
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span>Live</span>
      </div>
      {displayTime && (
        <>
          <span className="text-muted-foreground/50">•</span>
          <span>Updated {displayTime}</span>
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 ml-1"
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={cn(
          "h-3 w-3",
          isRefreshing && "animate-spin"
        )} />
      </Button>
    </div>
  );
}
