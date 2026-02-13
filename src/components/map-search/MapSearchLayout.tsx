import { useCallback, useState } from 'react';
import { PropertyMap } from './PropertyMap';
import { MapListPanel } from './MapListPanel';
import type { LatLngBounds } from 'leaflet';

export default function MapSearchLayout() {
  const [, setBounds] = useState<LatLngBounds | null>(null);

  const handleBoundsChange = useCallback((b: LatLngBounds) => {
    setBounds(b);
  }, []);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Filter bar placeholder — reserved for Phase 4 */}
      <div className="h-12 shrink-0 border-b border-border bg-background flex items-center px-4">
        <span className="text-xs text-muted-foreground tracking-wide uppercase">Filters coming soon</span>
      </div>

      {/* Main content: map + list */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[3fr_2fr] min-h-0">
        <PropertyMap onBoundsChange={handleBoundsChange} />
        <MapListPanel resultCount={0} />
      </div>
    </div>
  );
}
