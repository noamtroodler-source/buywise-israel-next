import { Link } from 'react-router-dom';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useListingLimitCheck } from '@/hooks/useListingLimitCheck';
import { useSeatLimitCheck } from '@/hooks/useSeatLimitCheck';

interface UpgradePromptCardProps {
  entityType: 'agency' | 'developer';
}

export function UpgradePromptCard({ entityType }: UpgradePromptCardProps) {
  const listing = useListingLimitCheck(entityType);
  const seat = useSeatLimitCheck();

  // Collect metrics that exceed 80%
  const metrics: { label: string; current: number; max: number; percent: number }[] = [];

  if (listing.maxListings !== null && listing.usagePercent >= 80) {
    metrics.push({
      label: entityType === 'developer' ? 'Projects' : 'Listings',
      current: listing.currentCount,
      max: listing.maxListings,
      percent: listing.usagePercent,
    });
  }

  if (entityType === 'agency' && seat.maxSeats !== null && seat.usagePercent >= 80) {
    metrics.push({
      label: 'Team Seats',
      current: seat.currentSeats,
      max: seat.maxSeats,
      percent: seat.usagePercent,
    });
  }

  if (metrics.length === 0) return null;

  // Show the highest usage metric
  const top = metrics.sort((a, b) => b.percent - a.percent)[0];
  const nextTier = listing.nextTierName;

  return (
    <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Approaching Limit</h3>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{top.label}</span>
            <span className="font-medium text-foreground">
              {top.current}/{top.max} ({top.percent}%)
            </span>
          </div>
          <Progress
            value={top.percent}
            className="h-2"
            indicatorClassName={top.percent >= 90 ? 'bg-destructive' : 'bg-amber-500'}
          />
        </div>

        {nextTier && (
          <p className="text-sm text-muted-foreground">
            Upgrade to <span className="font-medium text-foreground">{nextTier}</span> for more capacity
          </p>
        )}

        <Button variant="outline" size="sm" asChild className="rounded-xl w-full">
          <Link to="/pricing">
            <ArrowUpRight className="h-4 w-4 mr-1.5" />
            View Plans
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
