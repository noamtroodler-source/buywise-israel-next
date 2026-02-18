import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

function getResetDate(): string {
  const now = new Date();
  const reset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return reset.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

interface BlogQuotaBannerProps {
  used: number;
  limit: number;
}

export function BlogQuotaBanner({ used, limit }: BlogQuotaBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-destructive">
          Monthly blog limit reached — {used} of {limit} posts used
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your quota resets on {getResetDate()}. Upgrade your plan to publish more articles this month.
        </p>
      </div>
      <Button variant="outline" size="sm" asChild className="flex-shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
        <Link to="/pricing">
          Upgrade
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Link>
      </Button>
    </div>
  );
}
