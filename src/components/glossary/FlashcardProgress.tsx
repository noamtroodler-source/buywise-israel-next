import { Progress } from '@/components/ui/progress';
import { Flame, CheckCircle2, RotateCcw } from 'lucide-react';

interface FlashcardProgressProps {
  current: number;
  total: number;
  originalTotal: number;
  masteredInSession: number;
  stillLearningInSession: number;
  streak: number;
}

export function FlashcardProgress({
  current,
  total,
  originalTotal,
  masteredInSession,
  stillLearningInSession,
  streak,
}: FlashcardProgressProps) {
  // Show progress as mastered cards vs original deck size for clearer UX
  const progressPercent = originalTotal > 0 ? (masteredInSession / originalTotal) * 100 : 0;
  
  // Number of cards remaining (including re-queued ones)
  const cardsRemaining = total - current + 1;

  return (
    <div className="space-y-3">
      {/* Progress bar with position */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Card {current} of {total}
          {total > originalTotal && (
            <span className="text-xs ml-1">
              (+{total - originalTotal} to review)
            </span>
          )}
        </span>
        {streak >= 3 && (
          <span className="flex items-center gap-1 text-primary font-medium animate-pulse">
            <Flame className="h-4 w-4" />
            {streak} streak!
          </span>
        )}
      </div>
      
      <Progress value={progressPercent} className="h-2" />
      
      {/* Session stats */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-1.5 text-primary">
          <CheckCircle2 className="h-4 w-4" />
          <span>{masteredInSession} got it</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <RotateCcw className="h-4 w-4" />
          <span>{stillLearningInSession} learning</span>
        </div>
      </div>
    </div>
  );
}
