import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Check, X, Eye, Merge } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertySummary {
  id: string;
  title: string | null;
  city: string | null;
  neighborhood: string | null;
  price: number | null;
  bedrooms: number | null;
  size_sqm: number | null;
  images: string[] | null;
  views_count: number | null;
  listing_status: string | null;
  created_at: string | null;
  agent_id: string | null;
  import_source?: string | null;
  merged_source_urls?: string[] | null;
  data_quality_score?: number | null;
}

interface DuplicateCompareCardProps {
  pairId: string;
  propertyA: PropertySummary;
  propertyB: PropertySummary;
  similarityScore: number | null;
  detectionMethod?: string;
  onKeep: (pairId: string, winnerId: string, loserId: string) => void;
  onDismiss: (pairId: string) => void;
  isLoading?: boolean;
}

function PropertyMiniCard({
  property,
  isWinner,
  onKeep,
  onView,
}: {
  property: PropertySummary;
  isWinner?: boolean;
  onKeep: () => void;
  onView: () => void;
}) {
  const leadImage = property.images?.[0];
  const daysListed = property.created_at
    ? Math.floor((Date.now() - new Date(property.created_at).getTime()) / 86400000)
    : null;

  return (
    <div className={cn(
      'flex-1 border rounded-lg p-3 space-y-2 transition-colors',
      isWinner && 'ring-2 ring-primary bg-primary/5'
    )}>
      {leadImage && (
        <AspectRatio ratio={16 / 9}>
          <img
            src={leadImage}
            alt={property.title || 'Property'}
            className="rounded-md object-cover w-full h-full"
            loading="lazy"
          />
        </AspectRatio>
      )}

      <div className="space-y-1">
        <p className="text-sm font-medium truncate">{property.title || 'Untitled'}</p>
        <p className="text-xs text-muted-foreground">
          {[property.city, property.neighborhood].filter(Boolean).join(', ')}
        </p>

        <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          {property.price != null && (
            <Badge variant="secondary" className="text-xs">
              ₪{property.price.toLocaleString()}
            </Badge>
          )}
          {property.bedrooms != null && (
            <span>{property.bedrooms} beds</span>
          )}
          {property.size_sqm != null && (
            <span>{property.size_sqm} m²</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          {property.import_source && (
            <Badge variant="secondary" className="text-xs">
              {property.import_source}
            </Badge>
          )}
          {property.views_count != null && <span>{property.views_count} views</span>}
          {daysListed != null && <span>{daysListed}d listed</span>}
          {property.listing_status && (
            <Badge variant="outline" className="text-xs">
              {property.listing_status}
            </Badge>
          )}
          {(property.merged_source_urls?.length ?? 0) > 0 && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              {property.merged_source_urls!.length} sources
            </Badge>
          )}
          {property.data_quality_score != null && (
            <span className="text-muted-foreground">Q:{property.data_quality_score}</span>
          )}
        </div>
      </div>

      <div className="flex gap-1 pt-1">
        <Button size="sm" variant="default" className="flex-1 h-7 text-xs" onClick={onKeep}>
          <Check className="h-3 w-3 mr-1" />
          Keep This
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onView}>
          <Eye className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function DuplicateCompareCard({
  pairId,
  propertyA,
  propertyB,
  similarityScore,
  detectionMethod,
  onKeep,
  onDismiss,
  isLoading,
}: DuplicateCompareCardProps) {
  const methodLabel = detectionMethod === 'cross_source' ? 'Cross-Source' : detectionMethod === 'phash' ? 'Image Match' : 'Auto';
  const methodColor = detectionMethod === 'cross_source'
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : detectionMethod === 'phash'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : '';

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Merge className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Potential Duplicate</span>
            {detectionMethod && (
              <Badge variant="outline" className={cn("text-xs", methodColor)}>
                {methodLabel}
              </Badge>
            )}
            {similarityScore != null && (
              <Badge variant="outline" className="text-xs">
                Distance: {similarityScore}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => onDismiss(pairId)}
            disabled={isLoading}
          >
            <X className="h-3 w-3 mr-1" />
            Not a Duplicate
          </Button>
        </div>

        <div className="flex gap-3">
          <PropertyMiniCard
            property={propertyA}
            onKeep={() => onKeep(pairId, propertyA.id, propertyB.id)}
            onView={() => window.open(`/admin/properties?id=${propertyA.id}`, '_blank')}
          />
          <PropertyMiniCard
            property={propertyB}
            onKeep={() => onKeep(pairId, propertyB.id, propertyA.id)}
            onView={() => window.open(`/admin/properties?id=${propertyB.id}`, '_blank')}
          />
        </div>
      </CardContent>
    </Card>
  );
}
