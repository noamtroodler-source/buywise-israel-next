import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Home, Search, Building2, Mail, Zap, Star, BarChart2, Users, Rocket,
  CheckCircle, AlertTriangle, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisibilityProduct, ActiveBoost, SlotAvailability } from '@/hooks/useBoosts';
import { formatDistanceToNow } from 'date-fns';

const SLUG_ICONS: Record<string, React.ElementType> = {
  homepage_sale_featured: Home,
  homepage_rent_featured: Home,
  homepage_project_hero: Star,
  homepage_project_secondary: Star,
  projects_boost: Rocket,
  search_priority: Search,
  city_spotlight: BarChart2,
  similar_listings_priority: Zap,
  agency_directory_featured: Building2,
  developer_directory_featured: Building2,
  email_digest_sponsored: Mail,
  budget_tool_sponsor: Users,
};

const ENTITY_LEVEL_SLUGS = new Set([
  'agency_directory_featured',
  'developer_directory_featured',
  'email_digest_sponsored',
  'budget_tool_sponsor',
]);

interface BoostProductCardProps {
  product: VisibilityProduct;
  slotAvailability?: SlotAvailability;
  activeBoost?: ActiveBoost;
  creditBalance: number;
  entityName: string;
  entityType: 'agency' | 'developer';
  onActivate: (product: VisibilityProduct) => void;
  isActivating?: boolean;
}

export function BoostProductCard({
  product,
  slotAvailability,
  activeBoost,
  creditBalance,
  entityName,
  entityType,
  onActivate,
  isActivating,
}: BoostProductCardProps) {
  const Icon = SLUG_ICONS[product.slug] || Zap;
  const isEntityLevel = ENTITY_LEVEL_SLUGS.has(product.slug);
  const canAfford = creditBalance >= product.credit_cost;
  const isSoldOut = slotAvailability?.isFull ?? false;
  const ilsEquivalent = product.credit_cost * 20;
  const isActive = !!activeBoost;

  const disabled = isActivating || isActive || isSoldOut || !canAfford;

  return (
    <Card
      className={cn(
        'rounded-2xl border-primary/10 transition-all duration-200',
        isActive && 'ring-2 ring-primary/30 border-primary/30 bg-primary/5',
        isSoldOut && !isActive && 'opacity-60',
      )}
    >
      <CardContent className="p-5 flex flex-col gap-4 h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0',
              isActive ? 'bg-primary/20' : 'bg-primary/10',
            )}>
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">{product.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {product.credit_cost} credits · {product.duration_days}d
              </p>
            </div>
          </div>
          {isActive && (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs gap-1 shrink-0">
              <CheckCircle className="h-3 w-3" />
              Active
            </Badge>
          )}
          {isSoldOut && !isActive && (
            <Badge variant="secondary" className="text-xs shrink-0">Sold Out</Badge>
          )}
          {!canAfford && !isActive && !isSoldOut && (
            <Badge variant="outline" className="text-xs shrink-0 text-muted-foreground">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Low credits
            </Badge>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {product.description}
          </p>
        )}

        {/* ILS equivalent */}
        <p className="text-xs text-muted-foreground">≈ ₪{ilsEquivalent.toLocaleString()} value</p>

        {/* Slot availability */}
        {slotAvailability && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{slotAvailability.availableSlots} of {slotAvailability.maxSlots} slots remaining</span>
              {slotAvailability.isFull && <span className="text-destructive font-medium">Full</span>}
            </div>
            <Progress
              value={(slotAvailability.usedSlots / slotAvailability.maxSlots) * 100}
              className="h-1.5"
            />
          </div>
        )}

        {/* Active boost expiry */}
        {isActive && activeBoost && (
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <Clock className="h-3.5 w-3.5" />
            <span>Expires {formatDistanceToNow(new Date(activeBoost.ends_at), { addSuffix: true })}</span>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-1">
          {isActive ? (
            <p className="text-xs text-center text-muted-foreground italic">
              Boost is running
            </p>
          ) : (
            <Button
              size="sm"
              className="w-full rounded-xl"
              disabled={disabled}
              onClick={() => onActivate(product)}
            >
              {isEntityLevel
                ? `Activate for ${entityName}`
                : 'Select a listing →'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { ENTITY_LEVEL_SLUGS };
