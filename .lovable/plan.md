
# Save Search / Alert Bell for Map View

## Overview
Add a prominent bell icon to the map filter bar that opens an alert creation dialog. The dialog will show the user's **current search criteria including selected neighborhoods** (Yad2-style granularity) and let them subscribe to new listings matching those criteria.

---

## UX Strategy

### Why Neighborhoods Matter
- Users in Ra'anana want alerts for **specific neighborhoods** (Neve Oz, HaGalil) not the entire city
- Reduces email fatigue and increases engagement
- Matches Yad2's proven UX pattern

### Flow
1. User applies filters on map (city, neighborhoods via chips, rooms, price)
2. User clicks bell icon in filter bar
3. Dialog shows human-readable summary of current search
4. User picks frequency (Instant/Daily/Weekly) and notification method
5. Alert saved to `search_alerts` table with full filter object

---

## Technical Implementation

### File Changes

#### 1. `src/components/map-search/MapFiltersBar.tsx`
- Add a **Bell icon button** next to the Filters button
- Pass current filters + selected neighborhoods to the dialog
- Import and render `CreateAlertDialog`

```text
[Commute Filter] [🔔 Bell] [Filters Button]
```

#### 2. `src/components/filters/CreateAlertDialog.tsx` (minor updates)
- Enhance the "Your Filters" section to display:
  - City name
  - Selected neighborhoods (if any) as chips
  - Rooms, price range, property type
- Improve the auto-generated alert name to include neighborhoods

**Example summary:**
```text
Ra'anana · Neve Oz, HaGalil
4+ rooms · ₪2M - ₪4M
```

#### 3. `src/components/map-search/MapSearchLayout.tsx`
- Pass `selectedNeighborhoods` to `MapFiltersBar` so it can include them in the alert filters

### Database
No schema changes needed - the existing `search_alerts.filters` JSONB column already supports:
- `city: string`
- `neighborhoods: string[]`
- `min_price`, `max_price`, `min_rooms`, etc.

---

## Detailed Component Changes

### MapFiltersBar.tsx

**Add Props:**
```tsx
interface MapFiltersBarProps {
  // ... existing props
  selectedNeighborhoods?: string[];  // NEW
}
```

**Add State:**
```tsx
const [showAlertDialog, setShowAlertDialog] = useState(false);
```

**Add Bell Button (after Commute Filter, before Filters):**
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setShowAlertDialog(true)}
      className="h-8 w-8"
    >
      <Bell className="h-4 w-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Create alert for this search</TooltipContent>
</Tooltip>
```

**Render Dialog:**
```tsx
<CreateAlertDialog
  open={showAlertDialog}
  onOpenChange={setShowAlertDialog}
  filters={{
    ...filters,
    neighborhoods: selectedNeighborhoods,
  }}
  listingType={listingType}
/>
```

### CreateAlertDialog.tsx Enhancements

**Improve filter display:**
```tsx
// Show city prominently
{filters.city && (
  <div className="flex items-center gap-2">
    <MapPin className="h-4 w-4 text-primary" />
    <span className="font-medium">{filters.city}</span>
  </div>
)}

// Show neighborhoods as chips
{filters.neighborhoods?.length > 0 && (
  <div className="flex flex-wrap gap-1.5">
    {filters.neighborhoods.map(n => (
      <Badge key={n} variant="secondary" className="text-xs">
        {n}
      </Badge>
    ))}
  </div>
)}
```

**Auto-generate descriptive name:**
```tsx
const generateAlertName = () => {
  const parts = [];
  if (filters.city) parts.push(filters.city);
  if (filters.neighborhoods?.length) {
    parts.push(`(${filters.neighborhoods.slice(0, 2).join(', ')}${filters.neighborhoods.length > 2 ? '...' : ''})`);
  }
  if (filters.min_rooms) parts.push(`${filters.min_rooms}+ rooms`);
  return parts.join(' · ') || 'New Search Alert';
};
```

### MapSearchLayout.tsx

**Pass neighborhoods to filter bar:**
```tsx
<MapFiltersBar
  filters={filters}
  onFiltersChange={handleFiltersChange}
  listingType={listingType}
  resultCount={properties.length}
  isLoading={isLoading}
  savedLocations={savedLocations}
  commuteFilter={commuteFilter}
  onCommuteFilterChange={setCommuteFilter}
  selectedNeighborhoods={selectedNeighborhoods}  // NEW
/>
```

---

## Visual Design

### Bell Button States
- **Default**: Ghost button with bell icon
- **Hover**: Tooltip "Create alert for this search"
- **Active alert exists**: Filled bell with badge showing count

### Dialog Summary Section
```text
┌─────────────────────────────────────────────────────┐
│  📍 Ra'anana                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │ Neve Oz    │ │ HaGalil    │ │ +2 more    │       │
│  └────────────┘ └────────────┘ └────────────┘       │
│                                                      │
│  🛏️ 4+ rooms  ·  💰 ₪2M - ₪4M  ·  🏠 Apartment      │
│                                                      │
│  ✨ 12 listings currently match                      │
└─────────────────────────────────────────────────────┘
```

---

## Summary

| Task | File | Complexity |
|------|------|------------|
| Add Bell button to filter bar | MapFiltersBar.tsx | Low |
| Pass neighborhoods to filter bar | MapSearchLayout.tsx | Low |
| Enhance filter display in dialog | CreateAlertDialog.tsx | Medium |
| Auto-generate alert names | CreateAlertDialog.tsx | Low |

**No database changes required** - the existing `search_alerts` table and `PropertyFilters` type already support all the data we need including neighborhoods.

**Backend already handles processing** - The scheduled edge functions for search alerts already use the filters JSONB to match new listings.
