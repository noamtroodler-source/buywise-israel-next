import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { BarChart3 } from 'lucide-react';
import { useListingLimitCheck } from '@/hooks/useListingLimitCheck';
import { useSeatLimitCheck } from '@/hooks/useSeatLimitCheck';
import { useBlogQuotaCheck } from '@/hooks/useBlogQuota';
import { useSubscription } from '@/hooks/useSubscription';

function getColor(percent: number, isOver: boolean) {
  if (isOver || percent >= 100) return 'bg-destructive';
  if (percent >= 80) return 'bg-amber-500';
  return 'bg-primary';
}

interface MeterRowProps {
  label: string;
  current: number;
  max: number | null;
  suffix?: string;
}

function MeterRow({ label, current, max, suffix }: MeterRowProps) {
  if (max === null) return null;
  const percent = Math.min(100, Math.round((current / max) * 100));
  const isOver = current >= max;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium ${isOver ? 'text-destructive' : 'text-foreground'}`}>
          {current} / {max}{suffix ? ` ${suffix}` : ''}
        </span>
      </div>
      <Progress value={percent} className={`h-2 ${getColor(percent, isOver)}`} />
    </div>
  );
}

interface UsageMetersProps {
  entityType: 'agency' | 'developer';
  authorType?: string;
  profileId?: string;
}

export function UsageMeters({ entityType, authorType, profileId }: UsageMetersProps) {
  const listing = useListingLimitCheck(entityType);
  const seat = useSeatLimitCheck();
  const blog = useBlogQuotaCheck(authorType, profileId);
  const { data: sub } = useSubscription();

  if (!sub || sub.status === 'none') return null;

  const showSeats = entityType === 'agency' && seat.maxSeats !== null;

  return (
    <Card className="rounded-2xl border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          Plan Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <MeterRow
          label={entityType === 'developer' ? 'Projects' : 'Listings'}
          current={listing.currentCount}
          max={listing.maxListings}
        />
        {showSeats && (
          <MeterRow
            label="Team Seats"
            current={seat.currentSeats}
            max={seat.maxSeats}
          />
        )}
        {blog.limit !== null && (() => {
          const now = new Date();
          const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const daysUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const resetLabel = resetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
          return (
            <div className="space-y-1.5">
              <MeterRow
                label="Blog Posts"
                current={blog.used}
                max={blog.limit}
              />
              <div className="flex items-center justify-between">
                {blog.used >= blog.limit ? (
                  <p className="text-xs text-destructive font-medium">
                    Limit reached — resets {resetLabel}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {blog.limit - blog.used} remaining this month
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
