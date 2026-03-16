import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, MinusCircle, Loader2, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ImportProgressBarProps {
  totalItems: number;
  doneCount: number;
  skippedCount: number;
  failedCount: number;
  pendingCount: number;
  processingCount: number;
  startTime: number | null;
  processedSoFar: number;
  isActive: boolean;
}

function formatEta(seconds: number): string {
  if (seconds < 60) return 'less than a minute';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `~${h}h ${rm}m`;
  }
  return s > 0 ? `~${m}m ${s}s` : `~${m}m`;
}

export function ImportProgressBar({
  totalItems,
  doneCount,
  skippedCount,
  failedCount,
  pendingCount,
  processingCount,
  startTime,
  processedSoFar,
  isActive,
}: ImportProgressBarProps) {
  const [, setTick] = useState(0);

  // Tick every 3s for ETA updates
  useEffect(() => {
    if (!isActive || !startTime || processedSoFar < 2) return;
    const id = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(id);
  }, [isActive, startTime, processedSoFar]);

  const processed = doneCount + skippedCount + failedCount;
  const progressPercent = totalItems > 0 ? Math.round((processed / totalItems) * 100) : 0;

  // ETA calculation
  let etaText: string | null = null;
  let avgPerItem: number | null = null;
  if (isActive && startTime && processedSoFar >= 2 && pendingCount > 0) {
    const elapsed = (Date.now() - startTime) / 1000;
    avgPerItem = elapsed / processedSoFar;
    const etaSeconds = avgPerItem * pendingCount;
    etaText = formatEta(etaSeconds);
  }

  return (
    <div className="space-y-3">
      {/* Main progress line */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {processed} / {totalItems} listings · {progressPercent}%
        </span>
        {isActive && etaText && (
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {etaText}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <Progress
        value={progressPercent}
        className="h-3"
        indicatorClassName={cn(isActive && 'animate-pulse')}
      />

      {/* Status breakdown */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          {doneCount} imported
        </span>
        {skippedCount > 0 && (
          <span className="flex items-center gap-1">
            <MinusCircle className="h-3 w-3" />
            {skippedCount} skipped
          </span>
        )}
        {failedCount > 0 && (
          <span className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-500" />
            {failedCount} failed
          </span>
        )}
        {pendingCount > 0 && (
          <span className="flex items-center gap-1">
            {processingCount > 0 ? (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            ) : (
              <span className="w-3 h-3 rounded-full bg-muted-foreground/30 inline-block" />
            )}
            {pendingCount} remaining
          </span>
        )}
        {isActive && avgPerItem != null && (
          <span className="text-muted-foreground/60">
            avg {Math.round(avgPerItem)}s per listing
          </span>
        )}
      </div>
    </div>
  );
}
