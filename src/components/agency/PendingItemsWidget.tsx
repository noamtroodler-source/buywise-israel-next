import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, X, AlertTriangle, ImageIcon, UserMinus, BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  usePendingItems,
  useDismissPendingItems,
} from '@/hooks/usePendingItems';

interface PendingItemsWidgetProps {
  agencyId: string;
}

/**
 * Phase 8 — post-handover "Pending Items" surface for the owner dashboard.
 * Renders only for agencies in `handed_over` state that haven't been dismissed yet.
 * Shows a consolidated, non-overwhelming summary of remaining quality work.
 */
export function PendingItemsWidget({ agencyId }: PendingItemsWidgetProps) {
  const { data, isLoading } = usePendingItems(agencyId);
  const dismiss = useDismissPendingItems();
  const { toast } = useToast();

  if (isLoading || !data) return null;
  if (data.dismissedAt) return null;

  const items: { icon: typeof AlertTriangle; label: string; href: string }[] = [];
  if (data.agentsMissingLicense > 0) {
    items.push({
      icon: BadgeCheck,
      label: `${data.agentsMissingLicense} agent${data.agentsMissingLicense !== 1 ? 's' : ''} missing license number`,
      href: '/agency/team',
    });
  }
  if (data.listingsMissingPhotos > 0) {
    items.push({
      icon: ImageIcon,
      label: `${data.listingsMissingPhotos} listing${data.listingsMissingPhotos !== 1 ? 's' : ''} need more photos`,
      href: '/agency/listings',
    });
  }
  if (data.listingsUnassigned > 0) {
    items.push({
      icon: UserMinus,
      label: `${data.listingsUnassigned} listing${data.listingsUnassigned !== 1 ? 's' : ''} need agent assignment`,
      href: '/agency/listings',
    });
  }
  if (data.listingsCriticalFlags > 0 || data.listingsWarningFlags > 0) {
    items.push({
      icon: AlertTriangle,
      label: `${data.listingsCriticalFlags + data.listingsWarningFlags} listing${data.listingsCriticalFlags + data.listingsWarningFlags !== 1 ? 's' : ''} flagged for review`,
      href: '/agency/listings',
    });
  }

  if (items.length === 0) return null;

  const handleDismiss = async () => {
    try {
      await dismiss.mutateAsync(agencyId);
    } catch (err: any) {
      toast({
        title: 'Could not dismiss',
        description: err?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="rounded-2xl border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-primary/10 mt-0.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Welcome — your account is ready
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  We set up {data.totalAgents} agent{data.totalAgents !== 1 ? 's' : ''} and{' '}
                  {data.totalListings} listing{data.totalListings !== 1 ? 's' : ''} for you. A few
                  items would benefit from your review.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              disabled={dismiss.isPending}
              className="h-7 w-7 rounded-lg flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {items.length > 0 && (
            <ul className="space-y-2 mb-4">
              {items.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-background hover:bg-muted/50 border border-border/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                    <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Review →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
