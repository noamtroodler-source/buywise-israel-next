import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';
import { useListingLimitCheck } from '@/hooks/useListingLimitCheck';
import { useSeatLimitCheck } from '@/hooks/useSeatLimitCheck';
import { useBlogQuotaCheck } from '@/hooks/useBlogQuota';
import { useSubscription } from '@/hooks/useSubscription';

function getColor(percent: number) {
  if (percent >= 90) return 'bg-destructive';
  if (percent >= 60) return 'bg-amber-500';
  return 'bg-primary';
}

interface MeterRowProps {
  label: string;
  current: number;
  max: number | null;
  suffix?: string;
}

function MeterRow({ label, current, max, suffix }: MeterRowProps) {
  if (max === null) return null; // unlimited = don't show meter
  const percent = Math.min(100, Math.round((current / max) * 100));

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">
          {current}/{max} {suffix || 'used'}
        </span>
      </div>
      <Progress value={percent} className="h-2" indicatorClassName={getColor(percent)} />
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

  // Don't show if no subscription
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
        {blog.limit !== null && (
          <MeterRow
            label="Blog Posts"
            current={blog.used}
            max={blog.limit}
            suffix="this month"
          />
        )}
      </CardContent>
    </Card>
  );
}
