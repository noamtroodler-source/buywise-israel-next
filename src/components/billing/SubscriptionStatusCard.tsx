import { Link } from 'react-router-dom';
import { CreditCard, Zap, ArrowUpRight, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { differenceInDays, format } from 'date-fns';

export function SubscriptionStatusCard() {
  const { data: sub, isLoading } = useSubscription();

  if (isLoading || !sub) return null;

  const isTrialing = sub.status === 'trialing';
  const isPastDue = sub.status === 'past_due';
  const isActive = sub.status === 'active';
  const hasSubscription = sub.status !== 'none';

  const trialDaysLeft = isTrialing && sub.trialEnd
    ? Math.max(0, differenceInDays(new Date(sub.trialEnd), new Date()))
    : 0;

  const statusColor = isPastDue
    ? 'bg-destructive/10 text-destructive'
    : isTrialing
    ? 'bg-primary/10 text-primary'
    : isActive
    ? 'bg-primary/10 text-primary'
    : 'bg-muted text-muted-foreground';

  const statusLabel = isPastDue
    ? 'Past Due'
    : isTrialing
    ? `Trial · ${trialDaysLeft}d left`
    : isActive
    ? 'Active'
    : 'No Plan';

  return (
    <Card className="rounded-2xl border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{sub.planName}</p>
                <Badge variant="secondary" className={statusColor}>
                  {statusLabel}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                {hasSubscription && sub.currentPeriodEnd && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Renews {format(new Date(sub.currentPeriodEnd), 'MMM d, yyyy')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {sub.creditBalance} credits
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/pricing">
                <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                {hasSubscription ? 'Upgrade' : 'View Plans'}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/pricing#credits">
                <Zap className="h-3.5 w-3.5 mr-1" />
                Buy Credits
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
