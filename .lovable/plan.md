
# Integrate Currency & Area Unit Preferences in Floor Plans & Units Section

## Problem
The "Floor Plans & Units" table on project pages currently displays all values in hardcoded Shekels (₪) and square meters (m²). When users change their preferences to USD or Square Feet, these values don't update:

- **Size column**: Shows "75-80" with hardcoded "(m²)" header
- **Price From column**: Uses `formatPrice` but always passes 'ILS'  
- **Price per area column**: Shows "₪24,710" with hardcoded "₪/m²" header

## Solution
Update `ProjectFloorPlans.tsx` to use the full suite of preference hooks so all values dynamically update when users toggle currency or area unit settings.

## Technical Changes

### File: `src/components/project/ProjectFloorPlans.tsx`

**1. Add missing imports:**
```tsx
import { 
  useFormatPrice, 
  useFormatArea, 
  useFormatPricePerArea, 
  useAreaUnitLabel 
} from '@/contexts/PreferencesContext';
```

**2. Initialize hooks inside component:**
```tsx
const formatPrice = useFormatPrice();
const formatArea = useFormatArea();
const formatPricePerArea = useFormatPricePerArea();
const areaLabel = useAreaUnitLabel();
```

**3. Update table header (desktop):**
- Change "Size (m²)" → Dynamic: `Size (${areaLabel === 'sqft' ? 'ft²' : 'm²'})`
- Change "₪/m²" → Dynamic: `${currencySymbol}/${areaLabel === 'sqft' ? 'ft²' : 'm²'}`

**4. Update Size column cells:**
- Current: `formatRange(group.sizeRange.min, group.sizeRange.max)` (raw numbers)
- New: Format each bound with `formatArea()` to show "807-861 ft²" or "75-80 m²"
- Need a new helper function to format size ranges with unit conversion

**5. Update Price per sqm column:**
- Current: `₪${group.pricePerSqm.toLocaleString()}`
- New: `formatPricePerArea(group.pricePerSqm)` which handles currency + area unit

**6. Update mobile card display:**
- Same changes for the mobile card grid (size display and price/m² display)

## Detailed Code Changes

### New helper function for size range formatting:
```tsx
const formatSizeRange = (min: number, max: number) => {
  if (min === Infinity || max === 0) return 'N/A';
  // formatArea returns "807 ft²" or "75 m²" - need raw number version
  const areaUnit = areaLabel;
  const SQM_TO_SQFT = 10.764;
  
  if (areaUnit === 'sqft') {
    const minFt = Math.round(min * SQM_TO_SQFT);
    const maxFt = Math.round(max * SQM_TO_SQFT);
    if (minFt === maxFt) return `${minFt}`;
    return `${minFt}-${maxFt}`;
  }
  
  if (min === max) return `${min}`;
  return `${min}-${max}`;
};
```

### Table Header Updates:
```tsx
<TableHead className="text-center">
  Size ({areaLabel === 'sqft' ? 'ft²' : 'm²'})
</TableHead>
...
<TableHead className="text-right">
  {currencySymbol}/{areaLabel === 'sqft' ? 'ft²' : 'm²'}
</TableHead>
```

### Cell Value Updates:
```tsx
// Size cell (was line 204)
<TableCell className="text-center">
  {formatSizeRange(group.sizeRange.min, group.sizeRange.max)}
</TableCell>

// Price per area cell (was line 210-212)
<TableCell className="text-right text-muted-foreground">
  {group.pricePerSqm > 0 ? formatPricePerArea(group.pricePerSqm) : 'N/A'}
</TableCell>
```

### Mobile Card Updates:
```tsx
// Line 227 - Mobile card size display
<p className="text-sm text-muted-foreground">
  {group.bedrooms} Bed • {group.bathrooms} Bath • {formatSizeRange(group.sizeRange.min, group.sizeRange.max)} {areaLabel === 'sqft' ? 'ft²' : 'm²'}
</p>

// Line 263-264 - Mobile price per area
<div>
  <span className="text-muted-foreground">{currencySymbol}/{areaLabel === 'sqft' ? 'ft²' : 'm²'}:</span>{' '}
  <span>{group.pricePerSqm > 0 ? formatPricePerArea(group.pricePerSqm) : 'N/A'}</span>
</div>
```

## Result

After implementation:
- **ILS + m²**: Size shows "75-80", header shows "₪/m²", value shows "₪24,710/m²"  
- **USD + sqft**: Size shows "807-861", header shows "$/ft²", value shows "$214/ft²"
- All values update instantly when user changes preferences in the header settings dropdown
