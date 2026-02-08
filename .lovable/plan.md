
# Comprehensive Room System Overhaul: Bedrooms + Additional Rooms

## Summary
This plan converts the platform from the traditional Israeli "rooms" counting system (which includes living areas) to a clearer **"Bedrooms + Additional Rooms"** model that international users are more familiar with.

## Current State Analysis
The codebase currently uses `bedrooms` as the database field but the UI often labels it as "Rooms" with explanatory tooltips about Israeli conventions. This creates confusion because:
- The database field is `bedrooms` (integer)
- UI labels sometimes say "Rooms" and sometimes "Beds"
- Tooltips explain the Israeli room convention (e.g., "3-room = 2 bedrooms + living room")

## Proposed Changes

### Phase 1: Database Schema Update
Add a new column `additional_rooms` to capture non-bedroom rooms (living room, office, storage room, etc.)

**New field for `properties` table:**
```sql
ALTER TABLE properties ADD COLUMN additional_rooms integer DEFAULT 0;
```

**New field for `project_units` table:**
```sql
ALTER TABLE project_units ADD COLUMN additional_rooms integer DEFAULT 0;
```

### Phase 2: Type Definitions Update

**File: `src/types/database.ts`**
- Add `additional_rooms: number | null` to the `Property` interface

**File: `src/components/agent/wizard/PropertyWizardContext.tsx`**
- Add `additional_rooms: number` to `PropertyWizardData` interface
- Add default value `additional_rooms: 0` to `defaultPropertyData`

**File: `src/components/developer/wizard/ProjectWizardContext.tsx`**
- Add `additionalRooms: number` to `UnitTypeData` interface
- Add default value `additionalRooms: 0` to `defaultUnitType`

### Phase 3: Agent Property Wizard Update

**File: `src/components/agent/wizard/steps/StepDetails.tsx`**
Change the Rooms section from a single "Rooms" input to two inputs:

```
Before:
┌─────────────────────┐  ┌─────────────────────┐
│ Rooms *             │  │ Bathrooms *         │
│ [Input field]       │  │ [Input field]       │
└─────────────────────┘  └─────────────────────┘

After:
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ Bedrooms *          │  │ Other Rooms         │  │ Bathrooms *         │
│ [Input field]       │  │ [Input field]       │  │ [Input field]       │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

Changes:
- Change "Rooms *" label to "Bedrooms *"
- Add new "Other Rooms" input with helper text "Living room, office, etc."
- Section header change from "Rooms" to "Layout"

### Phase 4: Developer Project Wizard Update

**File: `src/components/developer/wizard/steps/StepUnitTypes.tsx`**
- Change "Rooms *" label to "Bedrooms *" in the unit type dialog
- Add "Other Rooms" field next to it
- Update `UNIT_TYPE_PRESETS` from "X-Room Apartment" to "X Bedroom Apartment"

```
Before presets:
'2-Room Apartment', '3-Room Apartment', '4-Room Apartment', ...

After presets:
'1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom', ...
```

### Phase 5: Filter Components Update

**Files to update:**
- `src/components/filters/PropertyFilters.tsx`
- `src/components/filters/ProjectFilters.tsx`
- `src/components/filters/MobileFilterSheet.tsx`
- `src/components/filters/ProjectMobileFilterSheet.tsx`

Changes:
1. Change "Rooms" label to "Bedrooms"
2. **Remove the Israeli room tooltip** (the one explaining "3-room = 2 bedrooms + living")
3. Keep the filter logic working on `min_rooms` field (maps to `bedrooms` in DB)

Example from `PropertyFilters.tsx`:
```tsx
// Remove this tooltip:
<HoverOnlyTooltip content="In Israel, 'rooms' includes living areas...">

// Change label from:
<Label>Rooms</Label>
// To:
<Label>Bedrooms</Label>
```

### Phase 6: Property Cards Update

**File: `src/components/property/PropertyCard.tsx`**
Line 340 (compact mode) and line 531 (standard mode):

```tsx
// Before:
{property.bedrooms} bd | {property.bathrooms} ba

// After (show both if additional_rooms exists):
{property.bedrooms} bd{property.additional_rooms ? ` + ${property.additional_rooms} rm` : ''} | {property.bathrooms} ba
```

For non-compact mode, show as icon + number pairs:
```
🛏️ 3  🚪 1  🛁 2  📐 95m²
     ↑      ↑
   beds  other rooms
```

### Phase 7: Property Detail Pages Update

**File: `src/components/property/PropertyQuickSummary.tsx`**
Lines 306-313 (Hero Stats Bar):

```tsx
// Before:
<p className="text-lg font-semibold">{property.bedrooms}</p>
<p className="text-xs text-muted-foreground">Beds</p>

// After - add additional rooms if present:
<div className="flex items-center gap-2">
  <Bed className="h-5 w-5 text-muted-foreground" />
  <div>
    <p className="text-lg font-semibold">{property.bedrooms}</p>
    <p className="text-xs text-muted-foreground">Bedrooms</p>
  </div>
</div>
{property.additional_rooms > 0 && (
  <div className="flex items-center gap-2">
    <DoorOpen className="h-5 w-5 text-muted-foreground" />
    <div>
      <p className="text-lg font-semibold">+{property.additional_rooms}</p>
      <p className="text-xs text-muted-foreground">Other Rooms</p>
    </div>
  </div>
)}
```

### Phase 8: Project Display Updates

**File: `src/components/project/ProjectFloorPlans.tsx`**
- Change "Rooms" table header to "Beds"
- Add "Other" column if additional_rooms data exists
- Update mobile cards similarly

**File: `src/components/home/ProjectCarousel.tsx`**
- Update unit display to show "X Bed" instead of "X Room"

### Phase 9: Calculator Tools Update

**Files:**
- `src/components/tools/RentVsBuyCalculator.tsx`
- `src/components/tools/InvestmentReturnCalculator.tsx`

Changes:
- Change "Property Size (Rooms)" to "Bedrooms"
- **Remove the tooltip explaining Israeli room convention**
- Update select options from "X rooms" to "X bedrooms"

```tsx
// Before:
<InfoTooltip content="Israeli room count includes living room and bedrooms..." />

// After: Remove this tooltip entirely
```

### Phase 10: Other Components & Pages

**Files to update:**
1. `src/pages/agent/EditProperty.tsx` - Label change "Bedrooms" → "Bedrooms", add "Other Rooms"
2. `src/pages/agent/EditPropertyWizard.tsx` - Same updates
3. `src/pages/agent/NewPropertyWizard.tsx` - Update submit data
4. `src/components/agent/wizard/steps/StepReview.tsx` - Display "X beds + Y rooms"
5. `src/components/profile/RecentlyViewedSection.tsx` - Update display format
6. `src/components/map-search/MapPropertyPopup.tsx` - Update display
7. `src/pages/Listings.tsx` - **Remove the empty state suggestion about Israeli rooms**
8. `src/components/filters/CreateAlertDialog.tsx` - Update display label
9. `src/components/developer/wizard/steps/ProjectPreviewDialog.tsx` - Update display
10. `src/components/admin/UnitTypesPreview.tsx` - Update table header
11. `src/pages/guides/ListingsGuide.tsx` - Update documentation content

### Phase 11: Remove Israeli Room Convention References

Locations to clean up:
1. `PropertyFilters.tsx` line 650 - Remove tooltip
2. `ProjectFilters.tsx` line 385 - Remove tooltip
3. `RentVsBuyCalculator.tsx` line 629 - Remove tooltip
4. `InvestmentReturnCalculator.tsx` line 467 - Remove tooltip
5. `Listings.tsx` line 342 - Remove empty state suggestion
6. `ListingsGuide.tsx` line 146 - Remove "4-room apartment" confusion entry

## Display Format Examples

**Cards:**
```
Before: 3 bd | 2 ba | 95m²
After:  3 bd + 1 | 2 ba | 95m²
```

**Detail Page Hero Stats:**
```
Before: 🛏️ 3 Beds  🛁 2 Baths  📐 95m²

After:  🛏️ 3 Bedrooms  🚪 +1 Other Rooms  🛁 2 Baths  📐 95m²
```

**Filters:**
```
Before: "Rooms" with tooltip explaining Israeli convention
After:  "Bedrooms" (no tooltip needed)
```

## Data Migration Consideration
For existing properties that only have `bedrooms` data:
- `additional_rooms` will default to 0
- Agents can update their listings to add the additional rooms count
- No automatic conversion is attempted (would be inaccurate)

## Files Changed Summary

| Category | Files | Changes |
|----------|-------|---------|
| Database | Migration | Add `additional_rooms` column to properties and project_units |
| Types | 2 files | Add `additional_rooms` to interfaces |
| Agent Wizard | 3 files | Split rooms into bedrooms + other rooms inputs |
| Developer Wizard | 2 files | Same split, update presets |
| Filters | 4 files | Change labels, remove Israeli tooltips |
| Cards | 2 files | Update display format |
| Detail Pages | 2 files | Add other rooms display |
| Calculators | 2 files | Remove tooltips, update labels |
| Other | ~10 files | Various label and format updates |
| **Total** | **~27 files** | |

## Implementation Notes for Developer

### Icons to Use
- Bedrooms: `Bed` (already used)
- Other Rooms: `DoorOpen` from lucide-react (represents generic rooms)

### Filter Logic
The filter field `min_rooms` will continue to filter on `bedrooms` column only. This keeps the filter simple - users filter by how many bedrooms they need, not total rooms.

### Backward Compatibility
- Existing data works as-is (`additional_rooms` defaults to 0)
- Filters continue working
- No breaking changes to API or data structure
