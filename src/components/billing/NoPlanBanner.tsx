import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

const DISMISS_KEY = 'no_plan_banner_dismissed';

export function NoPlanBanner() {
  const { data: sub, isLoading } = useSubscription();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (isLoading || !sub || sub.status !== 'none' || dismissed) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/[0.03] to-transparent p-4 sm:p-5">
      {/* Subtle decorative glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">
              Your account is approved — activate your plan to start posting
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Pick a plan and hit the ground running. No credit card required to browse.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pl-13 sm:pl-0">
          <Button size="sm" asChild className="rounded-xl h-9">
            <Link to="/pricing">
              View Plans & Pricing
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
