import { useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Home, Briefcase, Heart, Star, Building2 } from 'lucide-react';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import type { LatLngBounds } from 'leaflet';
import type { LocationIcon } from '@/types/savedLocation';
import type { LucideIcon } from 'lucide-react';

interface SavedPlacesLayerProps {
  bounds: LatLngBounds | null;
}

const ICON_MAP: Record<LocationIcon, LucideIcon> = {
  home: Home,
  briefcase: Briefcase,
  heart: Heart,
  star: Star,
  building: Building2,
};

function createSavedPlaceIcon(iconType: LocationIcon) {
  const IconComponent = ICON_MAP[iconType] || Building2;
  return L.divIcon({
    className: '',
    html: `<div class="saved-place-marker">${renderToStaticMarkup(<IconComponent size={14} />)}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function SavedPlacesLayer({ bounds }: SavedPlacesLayerProps) {
  const { data: locations = [] } = useSavedLocations();

  const visibleLocations = useMemo(() => {
    if (!bounds) return locations;
    return locations.filter((loc) =>
      bounds.contains([loc.latitude, loc.longitude])
    );
  }, [bounds, locations]);

  return (
    <>
      {visibleLocations.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.latitude, loc.longitude]}
          icon={createSavedPlaceIcon(loc.icon)}
          interactive
        >
          <Tooltip direction="top" offset={[0, -16]} className="saved-place-popup">
            <div className="text-sm font-medium">{loc.label}</div>
            <div className="text-xs text-muted-foreground">{loc.address}</div>
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}
