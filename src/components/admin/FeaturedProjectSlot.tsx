import React from 'react';
import { format, formatDistanceToNow, isPast, isBefore, addDays } from 'date-fns';
import { Trash2, Clock, AlertTriangle, ExternalLink, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeaturedProjectSlot as FeaturedProjectSlotType } from '@/hooks/useHomepageFeatured';
import { cn } from '@/lib/utils';

interface FeaturedProjectSlotProps {
  slot?: FeaturedProjectSlotType;
  slotLabel: string;
  isHero?: boolean;
  onRemove?: (slotId: string) => void;
  onAdd?: () => void;
  isRemoving?: boolean;
}

export const FeaturedProjectSlot = React.forwardRef<HTMLDivElement, FeaturedProjectSlotProps>(
  ({ slot, slotLabel, isHero = false, onRemove, onAdd, isRemoving }, ref) => {
  const formatPrice = (price: number, currency: string = 'ILS') => {
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Empty slot
  if (!slot) {
    return (
      <Card className={cn(
        "border-dashed border-2 transition-all hover:border-primary/50",
        isHero ? "min-h-[200px]" : "min-h-[140px]"
      )}>
        <CardContent className="p-4 h-full flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground mb-2">{slotLabel}</p>
          <Button variant="outline" size="sm" onClick={onAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Assign Project
          </Button>
        </CardContent>
      </Card>
    );
  }

  const project = slot.project;

  const isExpired = slot.expires_at && isPast(new Date(slot.expires_at));
  const isExpiringSoon = slot.expires_at && 
    !isExpired && 
    isBefore(new Date(slot.expires_at), addDays(new Date(), 3));

  const getExpiryStatus = () => {
    if (!slot.expires_at) {
      return { text: 'No expiry', variant: 'secondary' as const };
    }
    if (isExpired) {
      return { text: 'Expired', variant: 'destructive' as const };
    }
    if (isExpiringSoon) {
      return { 
        text: `Expires ${formatDistanceToNow(new Date(slot.expires_at), { addSuffix: true })}`, 
        variant: 'warning' as const 
      };
    }
    return { 
      text: `Expires ${format(new Date(slot.expires_at), 'MMM d')}`, 
      variant: 'outline' as const 
    };
  };

  const expiryStatus = getExpiryStatus();

  // Project not found
  if (!project) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{slotLabel}</p>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Project not found or deleted</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove?.(slot.id)}
              disabled={isRemoving}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all",
      isExpired && "border-destructive/50 bg-destructive/5",
      isExpiringSoon && !isExpired && "border-yellow-500/50 bg-yellow-50/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">{slotLabel}</Badge>
          <Badge variant={expiryStatus.variant === 'warning' ? 'secondary' : expiryStatus.variant} className={cn(
            "text-xs",
            expiryStatus.variant === 'warning' && "bg-yellow-100 text-yellow-800 border-yellow-200"
          )}>
            {isExpiringSoon && <Clock className="h-3 w-3 mr-1" />}
            {expiryStatus.text}
          </Badge>
        </div>

        <div className={cn("flex gap-4", isHero && "flex-col sm:flex-row")}>
          {/* Thumbnail */}
          <div className={cn(
            "flex-shrink-0 rounded-lg overflow-hidden bg-muted",
            isHero ? "w-full sm:w-40 h-32" : "w-20 h-20"
          )}>
            {project.images && project.images[0] ? (
              <img
                src={project.images[0]}
                alt={project.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                No image
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h4 className={cn("font-medium truncate", isHero ? "text-base" : "text-sm")}>
              {project.name}
            </h4>
            <p className="text-xs text-muted-foreground">
              {project.developer?.name} • {project.city}
            </p>

            {project.price_from && (
              <p className="text-sm font-semibold text-primary mt-1">
                From {formatPrice(project.price_from, project.currency)}
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-1">
              Featured {formatDistanceToNow(new Date(slot.featured_at), { addSuffix: true })}
            </p>

            <div className="flex items-center gap-1 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onAdd}
                className="h-7 text-xs"
              >
                Change
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-7 w-7 p-0"
              >
                <a href={`/projects/${project.id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove?.(slot.id)}
                disabled={isRemoving}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

FeaturedProjectSlot.displayName = 'FeaturedProjectSlot';
