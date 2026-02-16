

# Recently Sold Overlay -- Map Layer Implementation

## Overview
Add a "Recently Sold" toggle to the map layers menu. When enabled (and zoom >= 13), gray semi-transparent pills appear showing real transaction prices from the `sold_transactions` table. Clicking a sold marker shows a small tooltip with details (price, date, rooms, size). Off by default.

## Data Flow

```text
User toggles "Recently Sold" layer ON
        |
        v
PropertyMap detects activeLayers.has('sold_transactions')
        |
        v
SoldTransactionsLayer component mounts
        |
        v
Fetches from sold_transactions table:
  - WHERE latitude/longitude within current map bounds
  - WHERE sold_date >= 12 months ago
  - LIMIT 200
        |
        v
Renders gray pills: "1.2M - Jun '25"
```

## Files to Create

### 1. `src/components/map-search/SoldTransactionMarker.tsx` (new)
- Similar structure to `PropertyMarker.tsx` but simpler
- Renders a gray pill with price + short date (e.g., "1.2M - Jun '25")
- Uses a `.sold-marker-pill` CSS class (gray background, slightly transparent)
- On click: shows a Leaflet Tooltip with details (rooms, size, address, price/sqm)
- No hover/active state syncing with sidebar (sold items aren't in the list)
- Always compact-sized (10px font, small padding) since these are background context
- Memo'd with id comparison only

### 2. `src/components/map-search/SoldTransactionsLayer.tsx` (new)
- Follows the same pattern as `TrainStationLayer.tsx`
- Accepts `bounds: LatLngBounds | null` and `city: string | null` props
- Uses `useQuery` to fetch sold transactions within the current bounds
- Query: `supabase.from('sold_transactions').select(...)` filtered by lat/lng bounding box and `sold_date >= now() - 12 months`
- Limits to 200 results, ordered by `sold_date DESC`
- Filters visible markers to current bounds (like TrainStationLayer does)
- Maps over results rendering `SoldTransactionMarker` for each

### 3. `src/hooks/useMapSoldTransactions.ts` (new)
- Custom hook encapsulating the Supabase query
- Parameters: `bounds` (MapBounds), `enabled` (boolean)
- Returns `{ data: SoldTransaction[], isLoading }`
- Uses bounding box filter on latitude/longitude columns
- `sold_date >= (current date - 12 months)`
- `staleTime: 5 * 60 * 1000` (5 min, same as other map queries)
- Selects only needed columns: id, sold_price, sold_date, rooms, size_sqm, property_type, price_per_sqm, address, latitude, longitude

## Files to Modify

### 4. `src/components/map-search/LayersMenu.tsx`
- Add new layer entry: `{ id: 'sold', label: 'Recently Sold', icon: Receipt (from lucide-react), disabled: false }`
- Note: the existing 'saved' layer ID is for "My Places" (hearts). The sold layer will use id `'sold_transactions'` to avoid collision

### 5. `src/components/map-search/PropertyMap.tsx`
- Add conditional rendering of `SoldTransactionsLayer` when `activeLayers.has('sold_transactions')` and `zoom >= 13`
- Pass `bounds={currentBounds}` and `city={cityFilter}` props
- Import the new component

### 6. `src/index.css`
- Add `.sold-marker-pill` styles:
  - Background: `#9ca3af` (gray-400) with 85% opacity
  - White text, 9px font, tight padding (2px 5px)
  - Rounded, thin border, subtle shadow
  - Lower z-index than property pills (z-index: 30 vs property pills at 40+)
  - On hover: opacity goes to 100%, slight scale up

## Technical Details

### Query shape
```sql
SELECT id, sold_price, sold_date, rooms, size_sqm, property_type, 
       price_per_sqm, address, latitude, longitude
FROM sold_transactions
WHERE latitude BETWEEN south AND north
  AND longitude BETWEEN west AND east
  AND sold_date >= CURRENT_DATE - INTERVAL '12 months'
ORDER BY sold_date DESC
LIMIT 200
```

### Pill format
Price formatted as compact (e.g., "1.2M") + abbreviated month/year: `"1.2M - Jun '25"`

### Why zoom >= 13 only
With 11,294 geocoded records, showing at lower zooms would flood the map. At zoom 13+ the viewport is small enough that the 200-record limit provides good coverage without clutter.

### Z-index layering
Sold pills render behind active property pills (z-index 30 vs property markers at 40+), so they never obscure listing data.

### No RLS changes needed
The `sold_transactions` table contains public government data. If RLS is enabled, we may need a public read policy -- will check during implementation and add if needed.

