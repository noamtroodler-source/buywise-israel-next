import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSeatLimitCheck } from '@/hooks/useSeatLimitCheck';
import { useSubscription } from '@/hooks/useSubscription';

export function SeatSummaryCard() {
  const { currentSeats, maxSeats, isOverLimit, overageRate, usagePercent, isLoading, needsSubscription } = useSeatLimitCheck();
  const { data: sub } = useSubscription();

  if (isLoading || needsSubscription) return null;

  if (sub?.isFoundingAgency) {
    return (
      <Card className="rounded-2xl border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{currentSeats} team seat{currentSeats !== 1 ? 's' : ''} active · Founding agency access</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overSeats = maxSeats !== null ? Math.max(0, currentSeats - maxSeats) : 0;
  const estOverage = overSeats * (overageRate ?? 0);

  const progressColor =
    isOverLimit ? 'bg-destructive' :
    usagePercent >= 80 ? 'bg-amber-500' :
    'bg-primary';

  return (
    <Card className="rounded-2xl border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {maxSeats === null
                ? `${currentSeats} seats used · Unlimited plan`
                : `${currentSeats} / ${maxSeats} seats used`}
            </span>
            {isOverLimit && (
              <span className="text-xs text-destructive font-medium">
                +{overSeats} over limit · Est. ₪{estOverage}/mo overage
              </span>
            )}
            {!isOverLimit && usagePercent >= 80 && maxSeats !== null && (
              <span className="text-xs text-amber-600 font-medium">
                {maxSeats - currentSeats} seat{maxSeats - currentSeats !== 1 ? 's' : ''} remaining
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Team seats are included in your current access</span>
          </div>
        </div>
        {maxSeats !== null && (
          <div className="relative">
            <Progress
              value={Math.min(100, usagePercent)}
              className="h-2 bg-muted/50"
            />
            <div
              className={`absolute top-0 left-0 h-2 rounded-full transition-all ${progressColor}`}
              style={{ width: `${Math.min(100, usagePercent)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
