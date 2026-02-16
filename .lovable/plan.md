

# Show Recently Sold Transactions on Map

## Problem
The sold transactions layer exists but is hidden because:
1. You're at zoom 12, but the threshold is zoom >= 13
2. The layer is toggled OFF by default

Data is already seeded: 506 geocoded sold transactions in Beit Shemesh, 8,839 total across all cities within the last 12 months.

## Changes

### 1. Lower zoom threshold from 13 to 10
**File: `src/components/map-search/PropertyMap.tsx`**
- Change `zoom >= 13` to `zoom >= 10` for `showSoldTransactions`
- This matches the zoom range where property markers start appearing

### 2. Enable "Recently Sold" layer by default
**File: `src/components/map-search/PropertyMap.tsx`**
- Add `'sold_transactions'` to the default `activeLayers` Set so it's on when the map loads

### 3. Increase query limit from 200 to 500
**File: `src/hooks/useMapSoldTransactions.ts`**
- Raise `.limit(200)` to `.limit(500)` so more sold records appear in the viewport
- At zoom 10-12 the viewport is larger, so we need more records to fill it

### 4. Use compact pill sizing at lower zooms
**File: `src/components/map-search/SoldTransactionMarker.tsx`**
- No changes needed — the pills are already small (9px font, compact style)

## Result
When the map loads at zoom 12 in Beit Shemesh, gray "Recently Sold" pills will be visible immediately, showing prices like "₪2.5M · Feb '26" with tooltip details on hover.
