
# Add "My Location" to City Dropdown Filters

## Overview
Add a "My Location" option to the city filter dropdowns on the Buy, Rent, and Projects grid view pages. When clicked, this will use the browser's geolocation API to determine the user's current position and automatically select the nearest city from the database.

## User Experience

1. User opens the City filter dropdown on Listings (Buy/Rent) or Projects page
2. At the top of the city list, they see a new "My Location" option with a crosshairs/target icon
3. When clicked:
   - Browser prompts for location permission (if not already granted)
   - Brief loading state shows while getting location
   - System finds the nearest city from the database using coordinates
   - City filter is automatically set to that city
   - Dropdown closes
4. If location access is denied or no city found within range, show a subtle error message

## Technical Implementation

### Step 1: Create useGeolocation Hook
Create a reusable hook at `src/hooks/useGeolocation.ts` that:
- Wraps the browser's `navigator.geolocation.getCurrentPosition` API
- Returns loading state, error state, and coordinates
- Handles permission denied and timeout scenarios

### Step 2: Create findNearestCity Utility
Create a utility function at `src/lib/utils/findNearestCity.ts` that:
- Takes user coordinates and array of cities with center_lat/center_lng
- Uses the existing `getDistanceInMeters` helper from `src/lib/utils/geometry.ts`
- Returns the nearest city within a reasonable radius (10km, matching existing MapSearchLayout pattern)

### Step 3: Update PropertyFilters Component
Modify `src/components/filters/PropertyFilters.tsx`:
- Add "My Location" button at the top of the city list inside the popover
- Wire up geolocation and nearest-city logic
- Show loading spinner while fetching location
- Display inline error if location denied or no city found

### Step 4: Update ProjectFilters Component
Apply the same changes to `src/components/filters/ProjectFilters.tsx`:
- Add identical "My Location" button to the city dropdown
- Reuse the same geolocation hook and nearest-city utility

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/hooks/useGeolocation.ts` | Create - Geolocation hook |
| `src/lib/utils/findNearestCity.ts` | Create - Nearest city utility |
| `src/components/filters/PropertyFilters.tsx` | Modify - Add "My Location" to city popover |
| `src/components/filters/ProjectFilters.tsx` | Modify - Add "My Location" to city popover |

## UI Design

**"My Location" Button:**
- Icon: `Navigation` or `Crosshair` from lucide-react
- Text: "Use my location"
- Position: Top of city list, separated by a subtle divider
- Style: Text button with primary color accent
- Loading state: Show `Loader2` spinner animation
- Error state: Inline muted text below the button

**Visual Layout:**
```text
+---------------------------+
| Select City               |
+---------------------------+
| [Search city...]          |
+---------------------------+
| ○ Use my location         |  <-- New
|---------------------------|
| Ashdod                    |
| Ashkelon                  |
| Beer Sheva                |
| ...                       |
+---------------------------+
```

## Edge Cases Handled

1. **Location permission denied**: Show "Location access denied" message
2. **Geolocation not supported**: Hide the option gracefully
3. **No city within range**: Show "No supported city nearby" message
4. **Slow location fetch**: Show loading spinner with "Locating..." text
5. **Cities data not loaded yet**: Disable the button until cities are available
