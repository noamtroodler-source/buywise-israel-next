import { addYears, format } from 'date-fns';
import { CalendarClock, TrendingDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AnnualBillingConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  tier: string;
  priceMonthly: number;
  priceAnnual: number;
  entityType: 'agency' | 'developer';
  onConfirm: () => void;
}

export function AnnualBillingConfirmDialog({
  open,
  onOpenChange,
  planName,
  tier,
  priceMonthly,
  priceAnnual,
  entityType,
  onConfirm,
}: AnnualBillingConfirmDialogProps) {
  const monthlyEquivalent = Math.round(priceAnnual / 12);
  const annualSaving = Math.round(priceMonthly * 12 - priceAnnual);
  const renewalDate = format(addYears(new Date(), 1), 'MMMM d, yyyy');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="capitalize">
              {entityType}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {tier}
            </Badge>
          </div>
          <DialogTitle className="text-xl">Confirm Annual Billing</DialogTitle>
          <DialogDescription>
            Review your annual commitment before proceeding to checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Plan + price summary */}
          <div className="rounded-xl border bg-muted/40 p-4 space-y-1">
            <p className="font-semibold text-foreground">{planName}</p>
            <p className="text-sm text-muted-foreground">
              ₪{monthlyEquivalent.toLocaleString()}/mo equivalent · <span className="font-medium text-foreground">₪{priceAnnual.toLocaleString()} billed today</span>
            </p>
          </div>

          {/* Savings callout */}
          <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 p-3">
            <TrendingDown className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              You save <span className="font-semibold text-primary">₪{annualSaving.toLocaleString()}</span> compared to paying monthly
            </p>
          </div>

          {/* Commitment note */}
          <div className="flex items-start gap-3 rounded-xl bg-muted/60 border p-3">
            <CalendarClock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              This is a <span className="font-medium text-foreground">12-month commitment</span>. Your plan renews automatically on{' '}
              <span className="font-medium text-foreground">{renewalDate}</span>. Cancel anytime from your billing portal before renewal.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Go Back
          </Button>
          <Button
            className="w-full sm:w-auto gap-1"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            Confirm &amp; Continue →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
