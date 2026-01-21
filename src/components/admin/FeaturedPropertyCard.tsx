import { format, formatDistanceToNow, isPast, isBefore, addDays } from 'date-fns';
import { Trash2, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeaturedPropertySlot } from '@/hooks/useHomepageFeatured';
import { cn } from '@/lib/utils';

interface FeaturedPropertyCardProps {
  slot: FeaturedPropertySlot;
  onRemove: (slotId: string) => void;
  isRemoving?: boolean;
}

export function FeaturedPropertyCard({ slot, onRemove, isRemoving }: FeaturedPropertyCardProps) {
  const property = slot.property;
  
  const formatPrice = (price: number, currency: string = 'ILS') => {
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

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

  if (!property) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Property not found or deleted</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(slot.id)}
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
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            {property.images && property.images[0] ? (
              <img
                src={property.images[0]}
                alt={property.title}
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
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-medium text-sm truncate">{property.title}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {property.city}{property.neighborhood && `, ${property.neighborhood}`}
                </p>
              </div>
              <Badge variant={expiryStatus.variant === 'warning' ? 'secondary' : expiryStatus.variant} className={cn(
                "flex-shrink-0 text-xs",
                expiryStatus.variant === 'warning' && "bg-yellow-100 text-yellow-800 border-yellow-200"
              )}>
                {isExpiringSoon && <Clock className="h-3 w-3 mr-1" />}
                {expiryStatus.text}
              </Badge>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">
                  {formatPrice(property.price, property.currency)}
                </p>
                {property.agent && (
                  <p className="text-xs text-muted-foreground">
                    Agent: {property.agent.name}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0"
                >
                  <a href={`/properties/${property.id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(slot.id)}
                  disabled={isRemoving}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              Featured {formatDistanceToNow(new Date(slot.featured_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
