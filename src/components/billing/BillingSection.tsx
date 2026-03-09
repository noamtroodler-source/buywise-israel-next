import { Link } from 'react-router-dom';
import { CreditCard, ArrowUpRight, ExternalLink, Loader2, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';

export function BillingSection() {
  const { data: sub, isLoading } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);

  const openBillingPortal = async () => {
    if (!sub || sub.status === 'none') return;

    // Trialing users don't have a billing portal yet
    if (sub.status === 'trialing') {
      toast.info('Payment processing will be available soon. Your trial is still active!');
      return;
    }

    setPortalLoading(true);
    try {
      // PayPlus billing portal — placeholder until PayPlus is wired
      toast.info('Billing management coming soon.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!sub) return null;

  const hasSubscription = sub.status !== 'none';
  const isTrialing = sub.status === 'trialing';
  const trialDaysLeft = isTrialing && sub.trialEnd
    ? Math.max(0, differenceInDays(new Date(sub.trialEnd), new Date()))
    : null;

  return (
    <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle>Billing & Subscription</CardTitle>
            <CardDescription>Manage your plan</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border/50 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-lg font-semibold text-foreground">{sub.planName}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className={
                  sub.status === 'past_due'
                    ? 'bg-destructive/10 text-destructive'
                    : sub.status === 'trialing'
                    ? 'bg-primary/10 text-primary'
                    : sub.status === 'active'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }
              >
                {sub.status === 'none' ? 'No Plan' : sub.status}
              </Badge>
              {sub.billingCycle && (
                <Badge variant="outline" className="text-xs">
                  {sub.billingCycle === 'annual' ? 'Annual billing' : 'Monthly billing'}
                </Badge>
              )}
            </div>
          </div>

          {isTrialing && trialDaysLeft !== null && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining in free trial
            </p>
          )}

          {!isTrialing && hasSubscription && sub.currentPeriodEnd && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Next billing: {format(new Date(sub.currentPeriodEnd), 'MMMM d, yyyy')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl">
            <Link to="/pricing">
              <ArrowUpRight className="h-4 w-4 mr-1.5" />
              {hasSubscription ? 'Change Plan' : 'View Plans'}
            </Link>
          </Button>
          {hasSubscription && !isTrialing && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={openBillingPortal}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-1.5" />
              )}
              Manage Billing
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
