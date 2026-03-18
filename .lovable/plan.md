

## Plan: Drop room-count qualifier from neighborhood labels

### Why
Neighborhood price data (`neighborhood_price_history`) is all-rooms blended — no `rooms` column. Showing "vs Ir Yamim **4-Room** Avg" is misleading. Room-specific data only exists at the city level (`city_price_history`).

### Change
In `PropertyValueSnapshot.tsx`, only show the `{roomCount}-Room` qualifier when it's a **city-level** comparison, not neighborhood.

**Line 254** — header label:
```
// Before
vs {comparisonLabel} {roomCount ? `${roomCount}-Room ` : ''}Avg

// After
vs {comparisonLabel} {!isNeighborhoodComparison && roomCount ? `${roomCount}-Room ` : ''}Avg
```

**Line 258-260** — tooltip text: same logic — strip room references when `isNeighborhoodComparison` is true.

Single file, 2 line changes.

