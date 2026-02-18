import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';
import { useListingLimitCheck } from '@/hooks/useListingLimitCheck';
import { useSeatLimitCheck } from '@/hooks/useSeatLimitCheck';
import { useBlogQuotaCheck } from '@/hooks/useBlogQuota';
import { useSubscription } from '@/hooks/useSubscription';
import { useOverageRate } from '@/hooks/useOverageRecords';

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
  overageRate?: number | null;
  entityType?: 'agency' | 'developer';
  resourceType?: 'listing' | 'seat' | 'project';
}

function MeterRow({ label, current, max, suffix, overageRate }: MeterRowProps) {
  if (max === null) return null; // unlimited = don't show meter

  const isOver = current > max;
  const overageUnits = isOver ? current - max : 0;
  const percent = Math.min(100, Math.round((current / max) * 100));
  const displayPercent = isOver ? 100 : percent;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium ${isOver ? 'text-destructive' : 'text-foreground'}`}>
          {isOver
            ? `${max}/${max} (+${overageUnits} over)`
            : `${current}/${max}`}
          {suffix && !isOver ? ` ${suffix}` : ''}
        </span>
      </div>
      <Progress
        value={displayPercent}
        className="h-2"
        indicatorClassName={getColor(percent, isOver)}
      />
      {isOver && overageRate != null && overageRate > 0 && (
        <p className="text-xs text-destructive font-medium">
          Overage: {overageUnits} × ₪{overageRate} = ₪{(overageUnits * overageRate).toLocaleString()} est. this month
        </p>
      )}
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
  const resourceType = entityType === 'developer' ? 'project' : 'listing';
  const { data: listingRate } = useOverageRate(entityType, resourceType);
  const { data: seatRate } = useOverageRate('agency', 'seat');

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
          overageRate={listingRate}
        />
        {showSeats && (
          <MeterRow
            label="Team Seats"
            current={seat.currentSeats}
            max={seat.maxSeats}
            overageRate={seatRate}
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
