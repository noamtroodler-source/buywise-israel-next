import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CreditPackageCardProps {
  name: string;
  credits: number;
  price: number;
  bonusPercent: number;
  onBuy: () => void;
  loading?: boolean;
}

export function CreditPackageCard({
  name,
  credits,
  price,
  bonusPercent,
  onBuy,
  loading,
}: CreditPackageCardProps) {
  const pricePerCredit = (price / credits).toFixed(1);
  const totalWithBonus = credits + Math.round(credits * bonusPercent / 100);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">{name}</h3>
        {bonusPercent > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{bonusPercent}% bonus
          </Badge>
        )}
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-bold text-foreground">₪{price}</span>
      </div>

      <div className="text-sm text-muted-foreground mb-4 space-y-0.5">
        <p className="flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-primary" />
          {totalWithBonus} credits{bonusPercent > 0 ? ` (${credits} + ${totalWithBonus - credits} bonus)` : ''}
        </p>
        <p>₪{pricePerCredit} per credit</p>
      </div>

      <Button
        onClick={onBuy}
        disabled={loading}
        variant="outline"
        className="w-full rounded-xl mt-auto"
      >
        {loading ? 'Loading...' : 'Buy Credits'}
      </Button>
    </div>
  );
}
