

# Comprehensive Room System Overhaul: Bedrooms + Additional Rooms

## Summary
This plan converts the entire platform from the traditional Israeli "rooms" counting system (which includes living areas) to a clearer **"Bedrooms + Additional Rooms"** model. This affects **all filters, wizards, cards, detail pages, mock data, and documentation**.

---

## Phase 1: Database Schema Update

**Migration to run:**
```sql
-- Add additional_rooms to properties table
ALTER TABLE properties ADD COLUMN additional_rooms integer DEFAULT 0;

-- Add additional_rooms to project_units table  
ALTER TABLE project_units ADD COLUMN additional_rooms integer DEFAULT 0;
```

---

## Phase 2: Type Definitions Update

**File: `src/types/database.ts`**
- Add `additional_rooms: number | null` to the `Property` interface (around line 88)

**File: `src/components/agent/wizard/PropertyWizardContext.tsx`**
- Add `additional_rooms: number` to `PropertyWizardData` interface
- Add default value `additional_rooms: 0` to `defaultPropertyData`

**File: `src/components/developer/wizard/ProjectWizardContext.tsx`**
- Add `additionalRooms: number` to `UnitTypeData` interface
- Add default value `additionalRooms: 0` to `defaultUnitType`

---

## Phase 3: Agent Property Wizard Update

**File: `src/components/agent/wizard/steps/StepDetails.tsx`**

Current layout:
```
┌─────────────────────┐  ┌─────────────────────┐
│ Rooms *             │  │ Bathrooms *         │
└─────────────────────┘  └─────────────────────┘
```

New layout:
```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ Bedrooms *          │  │ Other Rooms         │  │ Bathrooms *         │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

Changes:
- Change section header from "Rooms" to "Layout"
- Change "Rooms *" label to "Bedrooms *"
- Add new "Other Rooms" input field with helper text "Living room, office, etc."

---

## Phase 4: Developer Project Wizard Update

**File: `src/components/developer/wizard/steps/StepUnitTypes.tsx`**

Changes:
- Change "Rooms *" label to "Bedrooms *" in unit type dialog
- Add "Other Rooms" field next to it
- Update `UNIT_TYPE_PRESETS` constant:

```
Before: '2-Room Apartment', '3-Room Apartment', '4-Room Apartment', ...
After:  '1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom', ...
```

---

## Phase 5: Filter Components Update (Buy, Rent, Projects)

### Desktop Filters

**File: `src/components/filters/PropertyFilters.tsx`** (Buy & Rent)
- Line 646: Change "Rooms" label to "Bedrooms"
- Lines 647-654: **Remove the Israeli room tooltip** entirely (the HoverOnlyTooltip explaining "3-room = 2 bedrooms + living")
- Keep filter logic working on `min_rooms` field

**File: `src/components/filters/ProjectFilters.tsx`** (Projects)
- Line 370: Change "Rooms" to "Bedrooms"
- Lines 371-388: **Remove the Tooltip component** explaining Israeli room convention
- Keep filter logic as-is

### Mobile Filters

**File: `src/components/filters/MobileFilterSheet.tsx`** (Buy & Rent mobile)
- Line 233: Change section header from "Rooms" to "Bedrooms"
- No tooltip exists here, just the label change

**File: `src/components/filters/ProjectMobileFilterSheet.tsx`** (Projects mobile)
- Line 179: Change "Rooms" to "Bedrooms"
- Keep all filter button logic as-is

---

## Phase 6: Property Cards Update

**File: `src/components/property/PropertyCard.tsx`**

Compact mode (line ~340):
```tsx
// Before:
{property.bedrooms} bd | {property.bathrooms} ba

// After:
{property.bedrooms} bd{property.additional_rooms ? ` + ${property.additional_rooms}` : ''} | {property.bathrooms} ba
```

Standard mode (line ~531):
- Add `DoorOpen` icon import from lucide-react
- Show additional rooms stat when > 0:
```
🛏️ 3  🚪 +1  🛁 2  📐 95m²
```

---

## Phase 7: Property Detail Pages Update

**File: `src/components/property/PropertyQuickSummary.tsx`**

Hero Stats Bar (lines ~306-313):
- Change "Beds" label to "Bedrooms"
- Add new stat for additional rooms when present:

```tsx
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

---

## Phase 8: Project Display Updates

**File: `src/components/project/ProjectFloorPlans.tsx`**
- Change "Rooms" table header to "Beds"
- Add "Other" column if `additional_rooms` data exists
- Update mobile cards similarly

**File: `src/components/home/ProjectCarousel.tsx`**
- Update unit display from "X Room" to "X Bed"

---

## Phase 9: Calculator Tools Update

**File: `src/components/tools/RentVsBuyCalculator.tsx`**
- Change "Property Size (Rooms)" label to "Bedrooms"
- **Remove the tooltip** explaining Israeli room convention
- Update select options from "X rooms" to "X bedrooms"

**File: `src/components/tools/InvestmentReturnCalculator.tsx`**
- Same changes as above

---

## Phase 10: Other Components & Pages

| File | Change |
|------|--------|
| `src/pages/agent/EditProperty.tsx` | Add "Other Rooms" field |
| `src/pages/agent/EditPropertyWizard.tsx` | Add "Other Rooms" field |
| `src/pages/agent/NewPropertyWizard.tsx` | Include `additional_rooms` in submit data |
| `src/components/agent/wizard/steps/StepReview.tsx` | Display "X bedrooms + Y other rooms" |
| `src/components/profile/RecentlyViewedSection.tsx` | Update display format |
| `src/components/map-search/MapPropertyPopup.tsx` | Update display |
| `src/pages/Listings.tsx` | **Remove empty state suggestion** about Israeli rooms |
| `src/components/filters/CreateAlertDialog.tsx` | Update filter display label |
| `src/components/developer/wizard/steps/ProjectPreviewDialog.tsx` | Update display |
| `src/components/admin/UnitTypesPreview.tsx` | Update "Rooms" table header |
| `src/pages/guides/ListingsGuide.tsx` | Remove "4-room apartment" confusion entry |

---

## Phase 11: Remove All Israeli Room Convention References

| File | Line | What to Remove |
|------|------|----------------|
| `PropertyFilters.tsx` | 647-654 | HoverOnlyTooltip about "3-room = 2 bedrooms" |
| `ProjectFilters.tsx` | 371-388 | Tooltip about "4-room apt = 3 bedrooms" |
| `RentVsBuyCalculator.tsx` | ~629 | InfoTooltip about room counting |
| `InvestmentReturnCalculator.tsx` | ~467 | InfoTooltip about room counting |
| `Listings.tsx` | ~342 | Empty state suggestion mentioning Israeli rooms |
| `ListingsGuide.tsx` | ~146 | FAQ entry about "4-room apartment" confusion |

---

## Phase 12: Update Mock Data Seeding

**File: `supabase/functions/seed-demo-data/index.ts`**

### Properties (Sale & Rent - lines 410-537)
Add `additional_rooms` field to property inserts:

```typescript
// Current bedrooms logic:
const bedrooms = propertyType === 'penthouse' ? randomInt(4, 6) : ...

// Add additional rooms (typically 1 for living room, sometimes 2 for office/study):
const additionalRooms = propertyType === 'house' ? randomInt(1, 3) :
                        propertyType === 'penthouse' ? randomInt(1, 2) : 
                        randomInt(1, 2);

// In insert:
bedrooms: bedrooms,
additional_rooms: additionalRooms,
```

Update property titles:
```typescript
// Before:
title: `${bedrooms}-Room ${propertyType}...`

// After:
title: `${bedrooms} Bedroom ${propertyType}...`
```

Update `generatePropertyDescription` function (line 224):
```typescript
// Before:
`Stunning ${bedrooms}-room ${type} in...`

// After:
`Stunning ${bedrooms} bedroom ${type} in...`
```

### Project Units (lines 608-638)
Update unit type definitions:

```typescript
// Before:
const unitTypes = [
  { type: '3-Room Apartment', bedrooms: 3, sizeMin: 70, sizeMax: 90 },
  { type: '4-Room Apartment', bedrooms: 4, sizeMin: 90, sizeMax: 120 },
  ...
];

// After:
const unitTypes = [
  { type: '2 Bedroom', bedrooms: 2, additionalRooms: 1, sizeMin: 70, sizeMax: 90 },
  { type: '3 Bedroom', bedrooms: 3, additionalRooms: 1, sizeMin: 90, sizeMax: 120 },
  { type: '4 Bedroom', bedrooms: 4, additionalRooms: 1, sizeMin: 120, sizeMax: 150 },
  { type: 'Penthouse', bedrooms: 4, additionalRooms: 2, sizeMin: 150, sizeMax: 250 },
  { type: 'Garden Apartment', bedrooms: 3, additionalRooms: 1, sizeMin: 100, sizeMax: 140 },
];
```

Add `additional_rooms` to unit insert:
```typescript
additional_rooms: unitType.additionalRooms,
```

---

## Phase 13: Update Existing Database Records

**SQL migration to update existing mock data:**
```sql
-- Update existing properties with randomized additional_rooms
UPDATE properties 
SET additional_rooms = CASE 
  WHEN property_type IN ('penthouse', 'house') THEN floor(random() * 2 + 1)::int
  ELSE floor(random() * 2 + 1)::int
END
WHERE additional_rooms = 0 OR additional_rooms IS NULL;

-- Update existing project_units
UPDATE project_units 
SET additional_rooms = CASE 
  WHEN unit_type ILIKE '%penthouse%' THEN 2
  ELSE 1
END
WHERE additional_rooms = 0 OR additional_rooms IS NULL;
```

---

## Display Format Examples

### Cards
```
Before: 3 bd | 2 ba | 95m²
After:  3 bd + 1 | 2 ba | 95m²
```

### Detail Page Hero Stats
```
Before: 🛏️ 3 Beds  🛁 2 Baths  📐 95m²
After:  🛏️ 3 Bedrooms  🚪 +1 Other  🛁 2 Baths  📐 95m²
```

### Filters
```
Before: "Rooms" with tooltip explaining Israeli convention
After:  "Bedrooms" (clean, no tooltip)
```

### Property Titles
```
Before: "3-Room Apartment in Tel Aviv"
After:  "3 Bedroom Apartment in Tel Aviv"
```

---

## Files Changed Summary

| Category | Files | Changes |
|----------|-------|---------|
| **Database** | 1 migration | Add `additional_rooms` to properties + project_units |
| **Types** | 3 files | Add `additional_rooms` to interfaces |
| **Agent Wizard** | 4 files | Split rooms into bedrooms + other rooms |
| **Developer Wizard** | 2 files | Same split, update presets |
| **Filters (Desktop)** | 2 files | Change labels, remove tooltips |
| **Filters (Mobile)** | 2 files | Change labels |
| **Cards** | 2 files | Update display format |
| **Detail Pages** | 2 files | Add other rooms stat |
| **Calculators** | 2 files | Remove tooltips, update labels |
| **Mock Data** | 1 file | Update seeding logic + unit types |
| **Other** | ~10 files | Various label and format updates |
| **Total** | **~31 files** | |

---

## Implementation Notes

### Icons
- Bedrooms: `Bed` (existing)
- Other Rooms: `DoorOpen` from lucide-react

### Filter Logic
The filter field `min_rooms` continues to filter on the `bedrooms` database column only. Users filter by bedrooms needed, not total rooms.

### Backward Compatibility
- Existing data works as-is (`additional_rooms` defaults to 0)
- Cards and detail pages only show "+X" when additional_rooms > 0
- Filters continue working unchanged

### Verification Checklist
After implementation, verify:
- [ ] Agent wizard shows Bedrooms + Other Rooms inputs
- [ ] Developer wizard shows updated fields and presets
- [ ] Buy filters show "Bedrooms" (no tooltip)
- [ ] Rent filters show "Bedrooms" (no tooltip)
- [ ] Project filters show "Bedrooms" (no tooltip)
- [ ] Mobile filters for all three tabs updated
- [ ] Property cards display format correct
- [ ] Property detail pages show both stats
- [ ] Calculators updated (no tooltips)
- [ ] Mock data includes additional_rooms values
- [ ] No Israeli room convention references remain

