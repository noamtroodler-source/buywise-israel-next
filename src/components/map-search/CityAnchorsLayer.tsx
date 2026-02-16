import { useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Compass, ShoppingBag, Car } from 'lucide-react';
import { useCityAnchors } from '@/hooks/useCityAnchors';
import type { LatLngBounds } from 'leaflet';
import type { LucideIcon } from 'lucide-react';

interface CityAnchorsLayerProps {
  cityFilter: string | null;
  bounds: LatLngBounds | null;
}

const ANCHOR_ICONS: Record<string, LucideIcon> = {
  orientation: Compass,
  daily_life: ShoppingBag,
  mobility: Car,
};

function createAnchorIcon(anchorType: string) {
  const IconComponent = ANCHOR_ICONS[anchorType] || Compass;
  return L.divIcon({
    className: '',
    html: `<div class="city-anchor-marker">${renderToStaticMarkup(<IconComponent size={14} />)}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function CityAnchorsLayer({ cityFilter, bounds }: CityAnchorsLayerProps) {
  const { data: anchors = [] } = useCityAnchors(cityFilter ?? undefined);

  const visibleAnchors = useMemo(() => {
    const withCoords = anchors.filter((a) => a.latitude && a.longitude);
    if (!bounds) return withCoords;
    return withCoords.filter((a) =>
      bounds.contains([a.latitude!, a.longitude!])
    );
  }, [bounds, anchors]);

  return (
    <>
      {visibleAnchors.map((anchor) => (
        <Marker
          key={anchor.id}
          position={[anchor.latitude!, anchor.longitude!]}
          icon={createAnchorIcon(anchor.anchor_type)}
          interactive
        >
          <Tooltip direction="top" offset={[0, -16]} className="city-anchor-popup">
            <div className="text-sm font-medium">{anchor.name}</div>
            {anchor.name_he && (
              <div className="text-xs text-muted-foreground">{anchor.name_he}</div>
            )}
            {anchor.description && (
              <div className="text-xs text-muted-foreground mt-0.5">{anchor.description}</div>
            )}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}
