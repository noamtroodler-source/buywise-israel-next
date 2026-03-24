import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Sparkles, TrendingUp, TrendingDown, Minus, ExternalLink, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNeighborhoodProfile } from '@/hooks/useNeighborhoodProfile';
import { UnifiedNeighborhood } from './CityNeighborhoods';

interface NeighborhoodDetailDialogProps {
  neighborhood: UnifiedNeighborhood | null;
  cityName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCompactPrice(price: number): string {
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return `₪${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (price >= 1_000) {
    return `₪${Math.round(price / 1_000)}K`;
  }
  return `₪${price.toLocaleString()}`;
}

export function NeighborhoodDetailDialog({ neighborhood: n, cityName, open, onOpenChange }: NeighborhoodDetailDialogProps) {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useNeighborhoodProfile(cityName, n?.name);

  if (!n) return null;

  const hasNarrative = profile?.narrative;
  const hasBestFor = profile?.best_for;
  const hasPrice = n.avg_price != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Neighborhood Guide
            </span>
          </div>
          <DialogTitle className="flex items-baseline gap-2.5">
            <span className="text-lg font-semibold">{n.name}</span>
            {n.name_he && (
              <span className="text-sm text-muted-foreground/60" dir="rtl">
                {n.name_he}
              </span>
            )}
          </DialogTitle>
          {n.vibe && (
            <p className="text-sm text-muted-foreground mt-0.5">{n.vibe}</p>
          )}
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* Price + Trend row */}
          {hasPrice && (
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Avg. 4-room price</p>
                <p className="text-xl font-bold tabular-nums">{formatCompactPrice(n.avg_price!)}</p>
              </div>
              {n.yoy_change_percent != null && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-0.5">3-year trend</p>
                  <TrendBadge yoyChange={n.yoy_change_percent} />
                </div>
              )}
            </div>
          )}

          {/* Narrative */}
          {isLoading ? (
            <div className="h-16 rounded-lg bg-muted/30 animate-pulse" />
          ) : hasNarrative ? (
            <div className="border-l-2 border-primary/20 pl-4">
              <p className="text-sm leading-relaxed text-foreground/80">
                {profile!.narrative}
              </p>
            </div>
          ) : (
            <div className="border-l-2 border-border pl-4">
              <p className="text-sm text-muted-foreground italic">
                Neighborhood guide coming soon.
              </p>
            </div>
          )}

          {/* Best For callout */}
          {hasBestFor && (
            <div className="flex gap-2.5 rounded-lg bg-primary/5 px-4 py-3">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                <span className="font-semibold text-primary">Best for: </span>
                {profile!.best_for!.replace(/\s*-\s*$/, '')}
              </p>
            </div>
          )}

          {/* Anglo hub tag */}
          {n.anglo_tag && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary/70 bg-primary/8 border border-primary/15 rounded-full px-2 py-1">
              International community hub
            </span>
          )}

          {/* Browse Properties CTA */}
          <Button
            className="w-full mt-2"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              navigate(`/listings?city=${encodeURIComponent(cityName)}&neighborhoods=${encodeURIComponent(n.name)}`);
            }}
          >
            Browse Properties
            <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
          </Button>

          {/* Source footnote */}
          {hasPrice && (
            <p className="text-[10px] text-muted-foreground/50 text-center">
              Market transaction data · 4-room avg
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TrendBadge({ yoyChange }: { yoyChange: number }) {
  if (yoyChange > 0.5) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-semantic-green">
        <TrendingUp className="h-3.5 w-3.5" />
        +{yoyChange}%
      </span>
    );
  }
  if (yoyChange < -0.5) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-destructive">
        <TrendingDown className="h-3.5 w-3.5" />
        {yoyChange}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground">
      <Minus className="h-3.5 w-3.5" />
      Stable
    </span>
  );
}
