import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CityRoomPrice } from '@/hooks/useCityRoomPrices';

interface CityRoomPriceBreakdownProps {
  city: string;
  maxBudget: number;
  roomPrices: CityRoomPrice[];
  formatPrice: (value: number) => string;
}

const ROOM_LABELS: Record<number, string> = {
  3: '3-room',
  4: '4-room',
  5: '5-room',
};

function getAffordabilityStatus(maxBudget: number, avgPrice: number) {
  if (maxBudget >= avgPrice) return { label: 'Within budget', variant: 'comfortable' as const };
  if (maxBudget >= avgPrice * 0.9) return { label: 'Stretch', variant: 'stretch' as const };
  return { label: 'Over budget', variant: 'over' as const };
}

const STATUS_STYLES = {
  comfortable: 'bg-semantic-green/10 text-semantic-green-foreground border-semantic-green/30',
  stretch: 'bg-semantic-amber/10 text-semantic-amber-foreground border-semantic-amber/30',
  over: 'bg-semantic-red/10 text-semantic-red-foreground border-semantic-red/30',
};

export function CityRoomPriceBreakdown({ city, maxBudget, roomPrices, formatPrice }: CityRoomPriceBreakdownProps) {
  if (!roomPrices.length || maxBudget <= 0) return null;

  const period = roomPrices[0];
  const periodLabel = `Q${period.quarter} ${period.year}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          What Can You Buy in {city}?
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Based on CBS transaction data ({periodLabel})
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {roomPrices.map((rp) => {
          const status = getAffordabilityStatus(maxBudget, rp.avgPrice);
          return (
            <div
              key={rp.rooms}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/40"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {ROOM_LABELS[rp.rooms] || `${rp.rooms}-room`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Avg. {formatPrice(rp.avgPrice)}
                </p>
              </div>
              <Badge
                className={cn(
                  'shrink-0 text-xs border',
                  STATUS_STYLES[status.variant]
                )}
                variant="outline"
              >
                {status.label}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
