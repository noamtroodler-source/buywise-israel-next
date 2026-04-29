import { AlertTriangle, BarChart3, Calculator, CheckCircle2, ChevronDown, CircleHelp, Ruler, ShieldCheck, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getWizardPriceContext } from '@/lib/wizardPriceContext';
import { PRICE_CONTEXT_DISCLAIMER, PRICE_CONTEXT_SIZE_NOTE } from '@/lib/priceContextDisclaimer';
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

function formatPremiumDriver(driver: string) {
  return driver.replace(/[_/]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatNisPerSqm(value: number | null | undefined) {
  if (!value) return '—';
  return `₪${Math.round(value).toLocaleString()}/sqm`;
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
  const priceContext = getWizardPriceContext(data, cityAveragePriceSqm);
  const needsDetails = !data.sqm_source || !data.ownership_type;
  const needsPremiumContext = review.requiresContext || (cityGap !== null && cityGap >= 25 && !data.premium_explanation?.trim());
  const hasPremiumContext = priceContext.confirmedPremiumDrivers.length > 0 || priceContext.detectedPremiumDrivers.length > 0 || Boolean(data.premium_explanation?.trim());

  return (
    <Alert variant="default" className="bg-primary/5 border-primary/20">
      <BarChart3 className="h-4 w-4 text-primary" />
      <AlertTitle className="text-foreground">Price Context preview</AlertTitle>
      <AlertDescription className="space-y-4 text-muted-foreground">
        <p>
          BuyWise will generate buyer-facing price context automatically from available recorded sales, listing details, and local benchmarks.
        </p>
        <div className="rounded-xl border border-primary/15 bg-background/80 p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">BuyWise Price Context</p>
                  <Badge variant="secondary" className="text-xs">{priceContext.publicLabel}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Recorded sales, local benchmark ranges, and property-specific context for International buyers.</p>
              </div>
              <p className="text-sm text-muted-foreground">{priceContext.buyWiseTake}</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-background/70 p-3">
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><Ruler className="h-3 w-3" /> Asking price / sqm</p>
              <p className="text-sm font-semibold text-foreground">{formatNisPerSqm(pricePerSqm)}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/70 p-3">
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><TrendingUp className="h-3 w-3" /> Recorded local range</p>
              <p className="text-sm font-semibold text-foreground">
                {priceContext.benchmarkRange ? `${formatNisPerSqm(priceContext.benchmarkRange.min)}–${formatNisPerSqm(priceContext.benchmarkRange.max).replace('₪', '')}` : 'Directional only'}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/70 p-3">
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><ShieldCheck className="h-3 w-3" /> Comparable confidence</p>
              <p className="text-sm font-semibold text-foreground">{priceContext.confidenceLabel}</p>
            </div>
          </div>

          {hasPremiumContext && (
            <Collapsible defaultOpen>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-primary hover:text-primary">
                  What recorded sales may not capture
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-3">
                {(priceContext.confirmedPremiumDrivers.length > 0 || priceContext.detectedPremiumDrivers.length > 0) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {priceContext.confirmedPremiumDrivers.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Confirmed by agency</p>
                        <div className="flex flex-wrap gap-2">
                          {priceContext.confirmedPremiumDrivers.slice(0, 8).map((driver) => <Badge key={driver} variant="outline" className="rounded-lg bg-background/70">{formatPremiumDriver(driver)}</Badge>)}
                        </div>
                      </div>
                    )}
                    {priceContext.detectedPremiumDrivers.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Detected from listing</p>
                        <div className="flex flex-wrap gap-2">
                          {priceContext.detectedPremiumDrivers.slice(0, 8).map((driver) => <Badge key={driver} variant="outline" className="rounded-lg bg-background/70">{formatPremiumDriver(driver)}</Badge>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {data.premium_explanation && (
                  <p className="border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground">{data.premium_explanation}</p>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {priceContext.buyerQuestions.length > 0 && (
            <div className="rounded-lg border border-border/70 bg-background/70 p-3">
              <div className="mb-2 flex items-center gap-2">
                <CircleHelp className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Questions worth asking</p>
                  <p className="text-xs text-muted-foreground">Based on this listing’s pricing context and property details</p>
                </div>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {priceContext.buyerQuestions.map((question) => (
                  <li key={question} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground space-y-2">
            <p className="flex items-center gap-1 font-medium text-foreground"><Calculator className="h-3.5 w-3.5 text-primary" /> How we calculated this</p>
            <p>Comparable set: local city benchmarks while listing-level comparable sales are finalized.</p>
            <p>Property class: {priceContext.propertyClassLabel}. Standard resale, premium, new-build, garden, penthouse, and house/villa listings are treated cautiously because they do not trade the same way.</p>
            <p>{PRICE_CONTEXT_SIZE_NOTE}</p>
            {priceContext.percentageSuppressionReason && <p>{priceContext.percentageSuppressionReason}</p>}
            <p>{PRICE_CONTEXT_DISCLAIMER}</p>
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
              Automatic buyer context ready
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
              I confirm the asking price and understand BuyWise will present it with automatic, cautious buyer context.
            </span>
          </label>
        )}
      </AlertDescription>
    </Alert>
  );
}