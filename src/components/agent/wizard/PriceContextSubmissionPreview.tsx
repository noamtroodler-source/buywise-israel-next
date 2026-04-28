import { Sparkles, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getPriceContext } from '@/lib/priceContext';
import type { MarketFitReviewResult } from '@/lib/marketFit';
import type { PropertyWizardData } from './PropertyWizardContext';

interface PriceContextSubmissionPreviewProps {
  data: PropertyWizardData;
  cityAveragePriceSqm?: number | null;
  review: MarketFitReviewResult;
  confirmed: boolean;
  onConfirmedChange: (checked: boolean) => void;
  onEditDetails: () => void;
  onEditPremiumContext: () => void;
}

export function PriceContextSubmissionPreview({
  data,
  cityAveragePriceSqm,
  review,
  confirmed,
  onConfirmedChange,
  onEditDetails,
  onEditPremiumContext,
}: PriceContextSubmissionPreviewProps) {
  const pricePerSqm = data.price && data.size_sqm ? Math.round(data.price / data.size_sqm) : null;
  const cityGap = pricePerSqm && cityAveragePriceSqm
    ? Math.round(((pricePerSqm - cityAveragePriceSqm) / cityAveragePriceSqm) * 100)
    : null;
  const priceContext = getPriceContext({
    avgComparison: cityGap,
    compsCount: 0,
    radiusUsedM: 1000,
    benchmarkPriceSqm: cityAveragePriceSqm,
    pricePerSqm,
    property: data,
  });
  const needsDetails = !data.sqm_source || !data.ownership_type;
  const needsPremiumContext = review.requiresContext || (cityGap !== null && cityGap >= 25 && !data.premium_explanation?.trim());

  return (
    <Alert variant="default" className="bg-primary/5 border-primary/20">
      <Sparkles className="h-4 w-4 text-primary" />
      <AlertTitle className="text-foreground">Price Context preview</AlertTitle>
      <AlertDescription className="space-y-4 text-muted-foreground">
        <p>
          Buyers will see context-first pricing language, not a harsh raw percentage, unless the benchmark match is strong and the gap is modest.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background/80 p-3">
            <p className="text-xs font-medium text-muted-foreground">Buyer label</p>
            <p className="text-sm font-semibold text-foreground">{priceContext.publicLabel}</p>
          </div>
          <div className="rounded-lg border border-border bg-background/80 p-3">
            <p className="text-xs font-medium text-muted-foreground">Confidence</p>
            <p className="text-sm font-semibold text-foreground">{priceContext.confidenceLabel}</p>
          </div>
          <div className="rounded-lg border border-border bg-background/80 p-3">
            <p className="text-xs font-medium text-muted-foreground">Badge status</p>
            <p className="text-sm font-semibold text-foreground">{priceContext.badgeEligible ? 'Pricing Context Complete' : 'Needs context'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {needsDetails && (
            <Button variant="outline" size="sm" onClick={onEditDetails} className="rounded-xl">
              Add SQM / ownership details
            </Button>
          )}
          {needsPremiumContext && (
            <Button variant="outline" size="sm" onClick={onEditPremiumContext} className="rounded-xl">
              Add premium explanation
            </Button>
          )}
          {!needsDetails && !needsPremiumContext && (
            <Badge variant="outline" className="bg-background/80 text-foreground">
              <CheckCircle2 className="mr-1 h-3 w-3 text-primary" />
              Buyer-safe context is complete
            </Badge>
          )}
        </div>
        {priceContext.percentageSuppressed && (
          <div className="flex gap-2 rounded-lg border border-border bg-background/70 p-3 text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{priceContext.percentageSuppressionReason}</span>
          </div>
        )}
        {review.requiresConfirmation && (
          <label className="flex items-start gap-2 rounded-lg border border-semantic-amber/30 bg-semantic-amber/10 p-3 text-sm text-foreground">
            <Checkbox checked={confirmed} onCheckedChange={(checked) => onConfirmedChange(Boolean(checked))} />
            <span className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-semantic-amber" />
              I confirm the asking price and understand admins may review the pricing context before publishing.
            </span>
          </label>
        )}
      </AlertDescription>
    </Alert>
  );
}