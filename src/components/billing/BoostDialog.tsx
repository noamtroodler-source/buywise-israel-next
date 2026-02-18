import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Zap, Loader2, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { useExpiringCredits } from '@/hooks/useExpiringCredits';
import { useVisibilityProducts, useActivateBoost, useActiveBoosts, useSlotAvailability } from '@/hooks/useBoosts';
import { useSubscription } from '@/hooks/useSubscription';
import { Link } from 'react-router-dom';

interface BoostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: 'property' | 'project';
  targetId: string;
  targetName: string;
}

export function BoostDialog({ open, onOpenChange, targetType, targetId, targetName }: BoostDialogProps) {
  const { data: sub } = useSubscription();
  const entityType = sub?.entityType as 'agency' | 'developer' | undefined;
  const { data: products = [], isLoading: productsLoading } = useVisibilityProducts(entityType);
  const { data: activeBoosts = [] } = useActiveBoosts(targetType, targetId);
  const activateBoost = useActivateBoost();
  const { data: slotMap = {} } = useSlotAvailability(products);
  const { data: expiringGroups = [] } = useExpiringCredits(sub?.entityType, sub?.entityId);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const creditBalance = sub?.creditBalance ?? 0;
  const activeSlugs = new Set(
    activeBoosts.map((b) => {
      const prod = products.find((p) => p.id === b.product_id);
      return prod?.slug;
    }).filter(Boolean)
  );

  const handleActivate = async () => {
    if (!selectedSlug) return;
    await activateBoost.mutateAsync({
      product_slug: selectedSlug,
      target_type: targetType,
      target_id: targetId,
    });
    onOpenChange(false);
    setSelectedSlug(null);
  };

  const selectedProduct = products.find((p) => p.slug === selectedSlug);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Boost Listing
          </DialogTitle>
          <DialogDescription>
            Promote "{targetName}" with visibility boosts
          </DialogDescription>
        </DialogHeader>

        {/* Credit balance */}
        <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Your Credits</span>
            </div>
            <span className="font-bold text-foreground">{creditBalance}</span>
          </div>
          {(() => {
            const nearestExpiry = expiringGroups[0];
            if (!nearestExpiry) return null;
            const daysLeft = differenceInDays(new Date(nearestExpiry.expiresAt), new Date());
            if (daysLeft > 30) return null;
            const isUrgent = daysLeft <= 7;
            return (
              <div className={`flex items-center gap-1 mt-1.5 ${isUrgent ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                {isUrgent ? <AlertTriangle className="h-3 w-3 flex-shrink-0" /> : <Clock className="h-3 w-3 flex-shrink-0" />}
                <span className="text-xs">{nearestExpiry.amount} expiring {format(new Date(nearestExpiry.expiresAt), 'MMM d')}</span>
              </div>
            );
          })()}
        </div>

        {creditBalance === 0 && (
          <div className="text-center p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <p className="text-sm text-muted-foreground mb-2">No credits available</p>
            <Button size="sm" asChild className="rounded-xl">
              <Link to="/pricing#credits">Buy Credits</Link>
            </Button>
          </div>
        )}

        {/* Products */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {productsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No boost products available</p>
          ) : (
            products.map((product) => {
              const isActive = activeSlugs.has(product.slug);
              const isSoldOut = slotMap[product.id]?.isFull ?? false;
              const cantAfford = creditBalance < product.credit_cost;
              const isSelected = selectedSlug === product.slug;
              const isDisabled = isActive || isSoldOut || cantAfford;

              return (
                <Card
                  key={product.id}
                  className={`p-3 transition-all rounded-xl border ${
                    isActive
                      ? 'border-primary/40 bg-primary/5 opacity-60 cursor-default'
                      : isSoldOut
                      ? 'opacity-50 cursor-not-allowed border-border'
                      : isSelected
                      ? 'border-primary ring-1 ring-primary/20 bg-primary/5 cursor-pointer'
                      : cantAfford
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-primary/30 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!isDisabled) setSelectedSlug(isSelected ? null : product.slug);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        {isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
                        {isSoldOut && !isActive && (
                          <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600 dark:text-amber-400">Sold Out</Badge>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{product.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{product.duration_days} days</span>
                        {slotMap[product.id] && !isSoldOut && (
                          <span className="text-xs text-muted-foreground">
                            · {slotMap[product.id].availableSlots}/{slotMap[product.id].maxSlots} slots left
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-primary" />
                        <span className="font-bold text-foreground">{product.credit_cost}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">credits</span>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Confirm */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-xl"
            disabled={!selectedSlug || activateBoost.isPending}
            onClick={handleActivate}
          >
            {activateBoost.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Activate{selectedProduct ? ` (${selectedProduct.credit_cost} credits)` : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
