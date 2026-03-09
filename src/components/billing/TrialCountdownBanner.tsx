import { useState } from 'react';
import { Link } from 'react-router-dom';
import { differenceInDays, differenceInHours } from 'date-fns';
import { Clock, X, ArrowRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/useSubscription';

export function TrialCountdownBanner() {
  const { data: sub } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !sub || sub.status !== 'trialing' || !sub.trialEnd) return null;

  const now = new Date();
  const trialEnd = new Date(sub.trialEnd);
  const trialStart = sub.trialStart ? new Date(sub.trialStart) : now;

  const daysLeft = Math.max(0, differenceInDays(trialEnd, now));
  const hoursLeft = Math.max(0, differenceInHours(trialEnd, now));
  const totalDays = Math.max(1, differenceInDays(trialEnd, trialStart));
  const elapsed = totalDays - daysLeft;
  const progressPercent = Math.min(100, Math.round((elapsed / totalDays) * 100));

  const timeLabel = daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
  const showPaymentCta = daysLeft <= 7;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary-foreground)/0.1),transparent_60%)]" />
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-primary-foreground/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <h3 className="font-semibold text-lg">{timeLabel} left in your free trial</h3>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sm opacity-90">
            <span>Trial progress</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-primary-foreground/20" indicatorClassName="bg-primary-foreground" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            asChild
            className="rounded-xl"
          >
            <Link to="/pricing">
              Choose a plan before your trial ends
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
          {showPaymentCta && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-xl bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Link to="/pricing">
                <CreditCard className="h-4 w-4 mr-1.5" />
                Add payment method
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
