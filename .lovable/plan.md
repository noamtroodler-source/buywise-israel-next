
# Map Search Improvements: Smart City Defaults + Zillow-Style Card Grid

## Overview
Transform the map search experience with two major improvements:
1. **Smart city selection** - Automatically center the map on a relevant city based on user history
2. **Zillow-style property grid** - Replace single-column cards with a 2-column grid using the same `PropertyCard` component from the grid listings page

---

## Part 1: Smart City Selection

### Current Problem
When users visit `/map`, they see all of Israel zoomed out (zoom level 8), which isn't useful for browsing properties.

### Solution: City Priority System
The map will automatically determine the best city to show based on this priority order:

1. **URL Parameter** - If `?city=Tel Aviv` is in URL, use that city
2. **Recent Session City** - If user searched a city during this session, use the most recent one
3. **User's Saved Preference** - For logged-in users, use their most frequently searched city from database
4. **localStorage History** - For guests, use their last searched city stored locally
5. **Fallback Empty State** - Show a friendly "Select a City" prompt (like Zillow screenshot)

### New Hook: useRecentSearchCity
```typescript
// src/hooks/useRecentSearchCity.ts
- Checks localStorage for 'bw_last_search_city'
- For logged-in users, queries search_analytics for most common city
- Returns { city, isLoading } or null if no history
```

### localStorage Key
```typescript
const LAST_CITY_KEY = 'bw_last_search_city';
// Format: { city: string, timestamp: number }
```

### Auto-Save City on Search
When user selects a city filter (on grid or map), automatically save to localStorage.

---

## Part 2: Empty State for No City Selected

When the smart city system can't find a previous city (new user, first visit), show a friendly empty state panel.

### Design (Inspired by Zillow Screenshot)
```text
+----------------------------------------------+
|                                              |
|  [Map Icon]                                  |
|                                              |
|  Where would you like to search?             |
|                                              |
|  [City Search Input with autocomplete]       |
|                                              |
|  ─────────── or ───────────                  |
|                                              |
|  Popular Cities:                             |
|  [Tel Aviv] [Jerusalem] [Herzliya]           |
|  [Ra'anana] [Netanya] [Haifa]               |
|                                              |
|  ─────────────────────────────               |
|                                              |
|  SEARCH TIPS                                 |
|  • Enter a city name to see properties       |
|  • Use filters to narrow your search         |
|  • Draw on the map to search custom areas    |
|                                              |
+----------------------------------------------+
```

### New Component
```typescript
// src/components/map-search/MapEmptyState.tsx
interface MapEmptyStateProps {
  onCitySelect: (city: string, coordinates: { lat: number; lng: number }) => void;
}
```

---

## Part 3: Zillow-Style 2-Column Property Grid

### Current Issue
The map sidebar uses `MapPropertyCard` - a compact horizontal card that differs from the main grid.

### Solution
Replace with the actual `PropertyCard` component used on `/listings` grid, arranged in a 2-column layout.

### Changes to MapPropertyList

**Before (single column, different card):**
```tsx
<div className="p-3 space-y-3">
  {properties.map(property => (
    <MapPropertyCard property={property} ... />
  ))}
</div>
```

**After (2-column grid, same PropertyCard):**
```tsx
<div className="p-3 grid grid-cols-2 gap-3">
  {properties.map(property => (
    <PropertyCard 
      property={property} 
      compact 
      showCompareButton={false}
      showShareButton={false}
      maxBadges={1}
    />
  ))}
</div>
```

### Benefits
- **Consistency** - Same card design on grid and map pages
- **Feature Parity** - Image carousel, badges, favorites all work the same
- **Zillow-Style** - Larger cards with images displayed in a grid layout
- **No Duplicate Code** - Reuse existing `PropertyCard` component

### Card Hover Sync
Add hover state sync between sidebar cards and map markers:
- Wrap `PropertyCard` in a div with `onMouseEnter`/`onMouseLeave` handlers
- When card is hovered, highlight corresponding map marker

---

## Part 4: Enhanced Filter Bar

### Goal
Show the same filters available on the grid page, not just a simplified version.

### Changes to MapFiltersBar
Add inline filter buttons that match the grid page:
- **City search** (prominent, with search icon)
- **Price dropdown**
- **Beds & Baths dropdown** 
- **Property Type dropdown**
- **More Filters button** (opens full filter sheet)
- **Sort dropdown** (pushed to right side)

### Layout
```text
[Buy|Rent] [City ▼] [Price ▼] [Beds/Baths ▼] [Type ▼] [More ▼]     [Sort ▼] [View Toggle]
```

On mobile, keep the existing condensed approach with full-screen filter sheet.

---

## Implementation Files

### New Files
| File | Purpose |
|------|---------|
| `src/hooks/useRecentSearchCity.ts` | Get/save user's recent city |
| `src/components/map-search/MapEmptyState.tsx` | Empty state when no city |

### Modified Files
| File | Changes |
|------|---------|
| `MapSearchLayout.tsx` | Add smart city logic, show empty state |
| `MapPropertyList.tsx` | Convert to 2-column grid using `PropertyCard` |
| `MapFiltersBar.tsx` | Add full filter set like grid page |
| `PropertyFilters.tsx` | Save selected city to localStorage |
| `Listings.tsx` | Save selected city to localStorage |

---

## Technical Details

### City Coordinates Lookup
The `cities` table includes `center_lat` and `center_lng` columns for map centering.

```sql
-- Example: Get city center for map focus
SELECT name, center_lat, center_lng 
FROM cities 
WHERE name = 'Tel Aviv';
```

### Smart Zoom Level
- City selected: zoom to level 13 (neighborhood view)
- No city: show empty state overlay instead of zoomed-out Israel

### localStorage Format
```typescript
interface RecentCity {
  name: string;
  lat: number;
  lng: number;
  timestamp: number;
}
```

### Database Query for Frequent City (logged-in users)
```sql
SELECT cities[1] as city, COUNT(*) as search_count
FROM search_analytics
WHERE user_id = $1 AND cities IS NOT NULL
GROUP BY cities[1]
ORDER BY search_count DESC
LIMIT 1;
```

---

## User Flows

### First-Time Visitor
1. User visits `/map`
2. No city history found
3. Shows MapEmptyState with city picker
4. User selects "Tel Aviv"
5. Map centers on Tel Aviv, city saved to localStorage
6. Properties load in 2-column grid

### Returning Visitor
1. User visits `/map`
2. localStorage has "Ra'anana" as last city
3. Map auto-centers on Ra'anana (zoom 13)
4. Properties load immediately

### Logged-In User with Search History
1. User visits `/map`
2. Query finds they search "Jerusalem" most often
3. Map centers on Jerusalem
4. Properties load in 2-column grid

---

## Mobile Considerations

- Empty state displays in full mobile view
- 2-column grid becomes 1-column on mobile (for the split/list views)
- City picker uses native-feeling input with suggestions
