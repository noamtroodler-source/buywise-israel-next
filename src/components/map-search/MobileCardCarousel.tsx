import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Property } from '@/types/database';
import { Project } from '@/types/projects';
import { PropertyThumbnail } from '@/components/shared/PropertyThumbnail';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';
import type { MapItem } from '@/types/mapItem';

interface MobileCardCarouselProps {
  items: MapItem[];
}

const PropertyCarouselCard = memo(function PropertyCarouselCard({ property }: { property: Property }) {
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

const ProjectCarouselCard = memo(function ProjectCarouselCard({ project }: { project: Project }) {
  const formatPrice = useFormatPrice();

  const image = project.images?.[0] ?? null;
  const priceDisplay = project.price_from
    ? `From ${formatPrice(project.price_from, project.currency)}`
    : 'Contact for pricing';

  const location = [project.neighborhood, project.city].filter(Boolean).join(', ');

  return (
    <Link
      to={`/projects/${project.slug}`}
      className="shrink-0 w-[280px] snap-start rounded-lg border border-border bg-card overflow-hidden"
    >
      <div className="relative aspect-[16/10] bg-muted">
        <PropertyThumbnail src={image} alt={project.name} className="w-full h-full" />
        <div className="absolute top-2 left-2 z-10">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/90 text-white backdrop-blur-sm">
            <Building2 className="h-2.5 w-2.5" />
            New
          </span>
        </div>
      </div>
      <div className="p-2.5 space-y-0.5">
        <p className="text-sm font-bold text-foreground">{priceDisplay}</p>
        <p className="text-xs text-foreground truncate">{project.name}</p>
        <p className="text-xs text-muted-foreground truncate">{location}</p>
      </div>
    </Link>
  );
});

export function MobileCardCarousel({ items }: MobileCardCarouselProps) {
  const visible = items.slice(0, 10);

  return (
    <div
      className="flex gap-3 overflow-x-auto px-4 py-2 snap-x snap-mandatory scrollbar-hide"
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {visible.map((item) => {
        if (item.type === 'project') {
          const project = item.data as Project;
          return <ProjectCarouselCard key={`project-${project.id}`} project={project} />;
        }
        const property = item.data as Property;
        return <PropertyCarouselCard key={property.id} property={property} />;
      })}
    </div>
  );
}
