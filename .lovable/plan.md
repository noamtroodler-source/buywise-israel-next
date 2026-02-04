
# Comprehensive Map View Enhancement Plan
## BuyWise Israel - Ultimate Map Experience

This plan implements all requested features in strategic phases, ensuring each enhancement aligns with BuyWise Israel's design standards and provides maximum value to Olim users.

---

## Phase 1: Marker Enhancements
### Price drop indicator, Hot badge, and Project markers

### 1.1 Price Change Indicator on Property Markers

**File: `src/components/map-search/PropertyMarker.tsx`**

Add a small downward arrow indicator for properties with price drops:

```tsx
// Add to markerStyle calculation
const hasPriceDrop = property.original_price && property.original_price > property.price;
const priceDropPercent = hasPriceDrop 
  ? Math.round(((property.original_price! - property.price) / property.original_price!) * 100)
  : 0;

// Modify the icon HTML to include drop indicator
const dropIndicator = hasPriceDrop && priceDropPercent >= 3 
  ? `<span style="
      position: absolute;
      top: -6px;
      right: -6px;
      width: 14px;
      height: 14px;
      background: hsl(213, 94%, 45%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    ">
      <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
        <path d="M6 2L6 10M6 10L3 7M6 10L9 7" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </span>`
  : '';
```

**Design Notes:**
- Uses BuyWise primary blue (not red) per brand standards
- Small circular badge with downward arrow
- Only shows for drops >= 3% to avoid clutter
- White border for visibility against map

---

### 1.2 "Hot" Badge on Markers (Properties < 3 days old)

**File: `src/components/map-search/PropertyMarker.tsx`**

Add a small flame indicator for hot listings:

```tsx
// Calculate freshness
const daysOnMarket = property.created_at 
  ? differenceInDays(new Date(), new Date(property.created_at)) 
  : null;
const isHot = daysOnMarket !== null && daysOnMarket <= 3;

// Add hot indicator to icon HTML
const hotIndicator = isHot
  ? `<span style="
      position: absolute;
      top: -6px;
      left: -6px;
      width: 14px;
      height: 14px;
      background: hsl(35, 90%, 50%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    ">
      <span style="font-size: 8px;">🔥</span>
    </span>`
  : '';
```

**Design Notes:**
- Warm amber/orange color (acceptable accent per brand guidelines)
- Small flame emoji for universal recognition
- Positioned opposite to price drop indicator (left vs right)

---

### 1.3 New Project Markers (Distinct from Resale)

**New File: `src/components/map-search/ProjectMarker.tsx`**

Create a distinct marker style for new development projects:

```tsx
// Building icon with gradient, larger size, distinct shape
const icon = L.divIcon({
  html: `
    <div class="project-marker-wrapper">
      <div class="project-marker-pill">
        <svg class="project-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 10V19H17V14H7V19H5V10L12 3L19 10Z"/>
        </svg>
        <span class="project-name">${project.name}</span>
      </div>
      <div class="project-marker-pointer"></div>
    </div>
  `,
  className: '',
  iconSize: L.point(0, 0),
  iconAnchor: L.point(0, 40),
});
```

**New CSS in `src/index.css`:**

```css
/* Project Markers - Distinct from property markers */
.project-marker-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: linear-gradient(135deg, hsl(213, 94%, 45%) 0%, hsl(213, 94%, 35%) 100%);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 11px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 2px solid white;
  cursor: pointer;
  transition: all 200ms ease;
}

.project-marker-pill:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.project-icon {
  flex-shrink: 0;
}
```

**Modify: `src/components/map-search/PropertyMap.tsx`**

Add project fetching and rendering (only for Buy mode):

```tsx
// New hook for projects in bounds
const { data: projects } = useQuery({
  queryKey: ['map-projects', mapBounds],
  queryFn: async () => {
    // Fetch published projects within bounds
    return supabase.from('projects')
      .select('id, name, city, latitude, longitude, price_from, status')
      .eq('is_published', true)
      .not('latitude', 'is', null);
  },
  enabled: listingStatus === 'for_sale' && !showCityOverlay,
});

// Render ProjectMarkers alongside PropertyMarkers
{listingStatus === 'for_sale' && !showCityOverlay && projects?.map(project => (
  <ProjectMarker
    key={project.id}
    project={project}
    onClick={() => navigate(`/projects/${project.slug}`)}
  />
))}
```

---

## Phase 2: Quick Filter Chips
### Fast refinement for Pool, Parking, Elevator, Balcony

### 2.1 Amenity Quick Filter Chips

**Modify: `src/components/map-search/MapFiltersBar.tsx`**

Add horizontal scrolling amenity chips below the main filter bar:

```tsx
const QUICK_AMENITIES = [
  { key: 'has_balcony', label: 'Balcony', icon: '🏠' },
  { key: 'has_elevator', label: 'Elevator', icon: '🛗' },
  { key: 'has_storage', label: 'Storage', icon: '📦' },
  { key: 'parking', label: 'Parking', icon: '🚗' },
  { key: 'has_pool', label: 'Pool', icon: '🏊' },
  { key: 'is_accessible', label: 'Accessible', icon: '♿' },
];

// Add below the main filters row
<div className="px-4 py-2 border-b flex gap-2 overflow-x-auto scrollbar-hide">
  {QUICK_AMENITIES.map((amenity) => {
    const isActive = filters[amenity.key];
    return (
      <button
        key={amenity.key}
        onClick={() => onFiltersChange({ 
          ...filters, 
          [amenity.key]: isActive ? undefined : true 
        })}
        className={cn(
          "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
          isActive 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted/50 text-muted-foreground hover:bg-muted"
        )}
      >
        <span>{amenity.icon}</span>
        <span>{amenity.label}</span>
      </button>
    );
  })}
</div>
```

**Database Consideration:**
- Properties table has `has_balcony`, `has_elevator`, `has_storage`, `parking`, `is_accessible`
- Need to add `has_pool` to `features` array check or add dedicated column

**Also apply to Grid View:**
Add same chips to `PropertyFilters.tsx` for consistency across views.

---

## Phase 3: Neighborhood Boundaries
### Visual spatial context with named regions

### 3.1 Neighborhood Polygon Layer

**New File: `src/components/map-search/NeighborhoodBoundariesLayer.tsx`**

```tsx
import { useMemo } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import { useCities } from '@/hooks/useCities';

interface NeighborhoodBoundariesLayerProps {
  visible: boolean;
  currentCity: string | null;
}

export function NeighborhoodBoundariesLayer({ visible, currentCity }: NeighborhoodBoundariesLayerProps) {
  const { data: cities } = useCities();

  const neighborhoods = useMemo(() => {
    if (!visible || !currentCity || !cities) return [];
    
    const city = cities.find(c => c.name === currentCity);
    if (!city?.neighborhoods) return [];
    
    // neighborhoods need polygon coordinates
    // This requires adding boundary_coords to neighborhood schema
    return (city.neighborhoods as any[]).filter(n => n.boundary_coords);
  }, [visible, currentCity, cities]);

  return (
    <>
      {neighborhoods.map((hood) => (
        <Polygon
          key={hood.name}
          positions={hood.boundary_coords}
          pathOptions={{
            color: 'hsl(213, 94%, 45%)',
            fillColor: 'hsl(213, 94%, 45%)',
            fillOpacity: 0.05,
            weight: 1.5,
            dashArray: '4, 4',
          }}
        >
          <Tooltip permanent direction="center" className="neighborhood-label">
            {hood.name}
          </Tooltip>
        </Polygon>
      ))}
    </>
  );
}
```

**Data Requirement:**
Neighborhoods in the `cities.neighborhoods` JSONB need to include `boundary_coords` array of lat/lng pairs. This may require:
1. Manual entry for key cities (Tel Aviv, Jerusalem, Ra'anana)
2. Or integration with external boundary data source

**CSS Styling:**
```css
.neighborhood-label {
  background: white !important;
  border: none !important;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1) !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  color: hsl(220, 10%, 40%) !important;
}
```

---

## Phase 4: Price Per Sqm Heatmap
### Visual value comparison layer

### 4.1 Enhanced Price Heatmap

**Modify: `src/components/map-search/PriceHeatmapLayer.tsx`**

Update the color scheme to use BuyWise brand-aligned cool tones:

```tsx
// Updated color scale - blue-based for brand alignment
function getPriceColor(pricePerSqm: number | null, isPerSqm: boolean): string {
  if (!pricePerSqm) return 'hsl(220, 10%, 70%)'; // Gray for unknown
  
  // Blue gradient: lighter = more affordable, darker = expensive
  if (pricePerSqm < 25000) return 'hsl(200, 80%, 70%)';   // Light blue - affordable
  if (pricePerSqm < 40000) return 'hsl(200, 75%, 55%)';   // Medium blue
  if (pricePerSqm < 55000) return 'hsl(213, 85%, 50%)';   // Primary blue
  if (pricePerSqm < 70000) return 'hsl(220, 80%, 40%)';   // Dark blue
  return 'hsl(230, 70%, 30%)';                             // Deep blue - expensive
}
```

**Modify: `src/components/map-search/HeatmapLegend.tsx`**

Update legend to show price/sqm values in user's preferred currency:

```tsx
const { currency, exchangeRate } = usePreferences();

// Convert thresholds based on currency
const formatThreshold = (ilsValue: number) => {
  if (currency === 'USD') {
    return `$${Math.round(ilsValue / exchangeRate).toLocaleString()}`;
  }
  return `₪${ilsValue.toLocaleString()}`;
};
```

---

## Phase 5: Anglo/Olim POI Layer
### Shuls and community spots English-speaking Olim frequent

### 5.1 Anglo Community Points of Interest

**New File: `src/components/map-search/AngloCommunityLayer.tsx`**

Based on research, here are verified Anglo-frequented locations:

```tsx
const ANGLO_POIS = [
  // Jerusalem
  { id: 'shul-nitzanim', name: 'Nitzanim Shul', type: 'synagogue', lat: 31.7756, lng: 35.1949, city: 'Jerusalem', description: 'Anglo-friendly, English announcements' },
  { id: 'shul-eretz-chemdah', name: 'Eretz Chemdah', type: 'synagogue', lat: 31.7683, lng: 35.1820, city: 'Jerusalem', description: 'Popular with Anglos, morning shiurim' },
  { id: 'shul-shir-chadash', name: 'Shir Chadash', type: 'synagogue', lat: 31.7523, lng: 35.2107, city: 'Jerusalem', description: 'Modern Orthodox, Anglo community' },
  
  // Tel Aviv area
  { id: 'shul-yeshivat-hakotel', name: 'Yedidya', type: 'synagogue', lat: 32.0715, lng: 34.7876, city: 'Tel Aviv', description: 'Egalitarian, English-friendly' },
  
  // Ra'anana
  { id: 'shul-ohel-ari', name: 'Ohel Ari', type: 'synagogue', lat: 32.1847, lng: 34.8714, city: "Ra'anana", description: 'Anglo Orthodox community hub' },
  
  // Schools
  { id: 'school-tali-bayit', name: 'Tali Bayit Vegan', type: 'school', lat: 31.7756, lng: 35.2156, city: 'Jerusalem', description: 'English-speaking families' },
  
  // Community centers
  { id: 'community-aaci', name: 'AACI Tel Aviv', type: 'community', lat: 32.0741, lng: 34.7820, city: 'Tel Aviv', description: 'Association of Americans & Canadians' },
];

export function AngloCommunityLayer({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <>
      {ANGLO_POIS.map((poi) => (
        <Marker
          key={poi.id}
          position={[poi.lat, poi.lng]}
          icon={createAngloPOIIcon(poi.type)}
        >
          <Popup>
            <div className="p-2">
              <h4 className="font-semibold">{poi.name}</h4>
              <p className="text-xs text-muted-foreground">{poi.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
```

**Note:** This data should ideally be stored in a database table (`anglo_pois`) so it can be updated without code changes. Initial implementation uses hardcoded curated list of verified locations.

---

## Phase 6: Commute Time Tool
### "Show homes within X min of [location]"

### 6.1 Enhanced Commute Filter

The existing `CommuteFilter` component already provides this functionality. Enhancements:

**Modify: `src/components/map-search/CommuteFilter.tsx`**

Add visual radius indicator on the map:

```tsx
// When commute filter is active, draw a circle showing approximate range
{commuteFilter && targetLocation && (
  <Circle
    center={[targetLocation.latitude, targetLocation.longitude]}
    radius={commuteFilter.maxMinutes * 833} // Approximate: 50km/hr avg = 833m/min
    pathOptions={{
      color: 'hsl(213, 94%, 45%)',
      fillColor: 'hsl(213, 94%, 45%)',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '8, 8',
    }}
  />
)}
```

---

## Phase 7: UX Improvements
### Filter undo, no results state, currency sync

### 7.1 Filter Undo Button

**Modify: `src/components/map-search/MapFiltersBar.tsx`**

Track filter history and add undo capability:

```tsx
const [filterHistory, setFilterHistory] = useState<PropertyFiltersType[]>([]);

const handleFiltersChange = (newFilters: PropertyFiltersType) => {
  // Save current state to history before changing
  setFilterHistory(prev => [...prev.slice(-5), filters]); // Keep last 5
  onFiltersChange(newFilters);
};

const handleUndo = () => {
  if (filterHistory.length > 0) {
    const previousFilters = filterHistory[filterHistory.length - 1];
    setFilterHistory(prev => prev.slice(0, -1));
    onFiltersChange(previousFilters);
  }
};

// Add Undo button to UI
{filterHistory.length > 0 && (
  <Button
    variant="ghost"
    size="sm"
    onClick={handleUndo}
    className="text-muted-foreground"
  >
    <RotateCcw className="h-4 w-4 mr-1" />
    Undo
  </Button>
)}
```

### 7.2 Enhanced "No Results" State

**Modify: `src/components/map-search/MapPropertyList.tsx`**

Add helpful suggestions when no properties found:

```tsx
if (properties.length === 0) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Home className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">No properties in this area</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">
        Try adjusting your search to find more options
      </p>
      <div className="space-y-2 text-sm text-left max-w-xs">
        <p className="flex items-center gap-2">
          <span className="text-primary">•</span>
          <span>Zoom out to see more areas</span>
        </p>
        <p className="flex items-center gap-2">
          <span className="text-primary">•</span>
          <span>Adjust your price range</span>
        </p>
        <p className="flex items-center gap-2">
          <span className="text-primary">•</span>
          <span>Remove amenity filters</span>
        </p>
      </div>
      {hasActiveFilters && (
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={onClearFilters}
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );
}
```

### 7.3 Currency/Unit Sync

**Already Implemented** - The `PropertyMarker.tsx` uses `useFormatPrice()` from `PreferencesContext`. However, the marker currently shows hardcoded `₪`. Fix:

```tsx
const { currency } = usePreferences();
const currencySymbol = currency === 'USD' ? '$' : '₪';

// In icon HTML:
${currencySymbol}${displayPrice}${suffix}
```

---

## Phase 8: Olim Favorites Sort Option
### Social proof - what other Olim are saving

### 8.1 "Popular with Olim" Sort Option

**Modify: `src/types/database.ts`**

Add new sort option:

```tsx
export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'size_desc' | 'rooms_desc' | 'olim_popular';
```

**Modify: `src/components/filters/PropertyFilters.tsx`**

Add to SORT_OPTIONS:

```tsx
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest Listings' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'size_desc', label: 'Largest First' },
  { value: 'rooms_desc', label: 'Rooms: Most to Fewest' },
  { value: 'olim_popular', label: '🌟 Popular with Olim' },
];
```

**Backend Implementation:**

Create a database function to calculate "olim popularity" based on:
1. Favorites count
2. Views count
3. Recent activity weighting

```sql
-- Create a view or function for olim popularity score
CREATE OR REPLACE VIEW property_olim_scores AS
SELECT 
  p.id,
  (
    (SELECT COUNT(*) FROM favorites f WHERE f.property_id = p.id) * 3 +
    COALESCE(p.views_count, 0) * 0.1
  ) * (1.0 / GREATEST(1, EXTRACT(days FROM NOW() - p.created_at) / 7)) AS olim_score
FROM properties p
WHERE p.is_published = true;
```

---

## Phase 9: Performance & Polish
### Skeleton loading, clustering, back-to-top

### 9.1 Enhanced Skeleton Loading

**Already Implemented** in `MapPropertyList.tsx` but can be enhanced with shimmer effect:

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 25%,
    hsl(var(--muted-foreground) / 0.1) 50%,
    hsl(var(--muted)) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### 9.2 Marker Clustering at Far Zoom

**Modify: `src/components/map-search/PropertyMap.tsx`**

Add clustering when zoomed out with many properties:

```tsx
import Supercluster from 'supercluster';
import useSupercluster from 'use-supercluster';

const shouldCluster = mapZoom < 13 && properties.length > 100;

const points = useMemo(() => 
  properties.map(p => ({
    type: 'Feature' as const,
    properties: { cluster: false, propertyId: p.id, price: p.price },
    geometry: { type: 'Point' as const, coordinates: [p.longitude!, p.latitude!] }
  })), 
  [properties]
);

const { clusters } = useSupercluster({
  points,
  bounds: mapBounds ? [mapBounds.west, mapBounds.south, mapBounds.east, mapBounds.north] : undefined,
  zoom: mapZoom,
  options: { radius: 75, maxZoom: 12 }
});
```

### 9.3 Back to Top Button

**Modify: `src/components/map-search/MapPropertyList.tsx`**

```tsx
const [showBackToTop, setShowBackToTop] = useState(false);
const scrollRef = useRef<HTMLDivElement>(null);

const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  setShowBackToTop(e.currentTarget.scrollTop > 500);
};

// In JSX
{showBackToTop && (
  <Button
    size="sm"
    className="fixed bottom-20 right-4 rounded-full shadow-lg z-20"
    onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
  >
    <ChevronUp className="h-4 w-4" />
  </Button>
)}
```

---

## Implementation Order (Recommended)

| Phase | Priority | Effort | Impact |
|-------|----------|--------|--------|
| 1. Marker Enhancements | High | Medium | High - Visual differentiation |
| 2. Quick Filter Chips | High | Low | High - Fast UX improvement |
| 7. Currency Sync | High | Low | High - User preferences |
| 5. Anglo POI Layer | Medium | Medium | High - Unique BuyWise value |
| 3. Neighborhood Boundaries | Medium | High | Medium - Requires data entry |
| 8. Olim Favorites Sort | Medium | Medium | Medium - Social proof |
| 4. Price Heatmap Enhancement | Low | Low | Low - Already exists |
| 6. Commute Tool Enhancement | Low | Low | Low - Already exists |
| 9. Performance Polish | Low | Medium | Medium - Polish |
| 7. UX (Undo, No Results) | Low | Low | Low - Polish |

---

## Technical Notes

### Dependencies
All features use existing dependencies:
- `react-leaflet` for map layers
- `supercluster`/`use-supercluster` already installed for clustering
- `@tanstack/react-query` for data fetching
- `PreferencesContext` for currency/units

### Database Changes
1. Add `has_pool` boolean to `properties` table (or query from `features` array)
2. Add `boundary_coords` to neighborhood JSONB schema in `cities` table
3. Create `anglo_pois` table for community locations
4. Create `property_olim_scores` view for sorting

### Testing Considerations
- Test marker indicators at various zoom levels
- Verify currency symbol updates when user switches preference
- Test filter chips on mobile (horizontal scroll)
- Validate project markers only show on Buy mode
