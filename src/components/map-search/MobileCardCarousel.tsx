import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Property } from '@/types/database';
import { PropertyThumbnail } from '@/components/shared/PropertyThumbnail';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';

interface MobileCardCarouselProps {
  properties: Property[];
}

const CarouselCard = memo(function CarouselCard({ property }: { property: Property }) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();

  const image = property.images?.[0] ?? null;
  const stats = [
    property.bedrooms > 0 ? `${property.bedrooms} bds` : null,
    property.bathrooms > 0 ? `${property.bathrooms} ba` : null,
    property.size_sqm ? formatArea(property.size_sqm) : null,
  ].filter(Boolean).join(' · ');

  const location = [property.neighborhood, property.city].filter(Boolean).join(', ');

  return (
    <Link
      to={`/property/${property.id}`}
      className="shrink-0 w-[280px] snap-start rounded-lg border border-border bg-card overflow-hidden"
    >
      <div className="relative aspect-[16/10] bg-muted">
        <PropertyThumbnail src={image} alt={property.title} className="w-full h-full" />
      </div>
      <div className="p-2.5 space-y-0.5">
        <p className="text-sm font-bold text-foreground">
          {formatPrice(property.price, property.currency)}
        </p>
        {stats && <p className="text-xs text-muted-foreground">{stats}</p>}
        <p className="text-xs text-foreground truncate">{location}</p>
      </div>
    </Link>
  );
});

export function MobileCardCarousel({ properties }: MobileCardCarouselProps) {
  const visible = properties.slice(0, 10);

  return (
    <div
      className="flex gap-3 overflow-x-auto px-4 py-2 snap-x snap-mandatory scrollbar-hide"
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {visible.map((p) => (
        <CarouselCard key={p.id} property={p} />
      ))}
    </div>
  );
}
