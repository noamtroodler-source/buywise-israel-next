
# Default to USD + sqft & Improve Unit Display Formatting

## Overview
This plan changes the site defaults to USD and square feet for international buyers, and updates the display format from `ft²` to `sqft` for better readability while keeping `m²` as the metric display.

---

## Changes Summary

### 1. Change Default Preferences (New Visitors)
| Setting | Current Default | New Default |
|---------|-----------------|-------------|
| Currency | ILS (₪) | USD ($) |
| Area Unit | sqm | sqft |

This means first-time visitors see familiar US-style formatting immediately.

### 2. Update Unit Display Labels
| Location | Current | New |
|----------|---------|-----|
| Formatted area output | `X ft²` | `X sqft` |
| Formatted area output | `X m²` | `X m²` (unchanged) |
| Header toggle button | `ft²` | `sqft` |
| Header toggle button | `m²` | `m²` (unchanged) |
| Price per area | `/ft²` | `/sqft` |
| Price per area | `/m²` | `/m²` (unchanged) |

---

## Files to Modify

### Core Context & Formatting
| File | Changes |
|------|---------|
| `src/contexts/PreferencesContext.tsx` | Change defaults from 'ILS'/'sqm' to 'USD'/'sqft'; update format functions to output 'sqft' instead of 'ft²' |

### UI Components  
| File | Changes |
|------|---------|
| `src/components/layout/PreferencesDialog.tsx` | Change `ft²` to `sqft` in display; keep `m²` |

### Map Components
| File | Changes |
|------|---------|
| `src/components/map-search/HeatmapLegend.tsx` | Update title to use preference-based unit label |

---

## Technical Details

### PreferencesContext.tsx Changes

**Default state changes (lines 33, 36, 68, 71, 127, 134):**
```typescript
// Before
const [currency, setCurrencyState] = useState<Currency>('ILS');
const [areaUnit, setAreaUnitState] = useState<AreaUnit>('sqm');

// After  
const [currency, setCurrencyState] = useState<Currency>('USD');
const [areaUnit, setAreaUnitState] = useState<AreaUnit>('sqft');
```

**Format function updates:**
```typescript
// useFormatArea (line 174)
// Before: return `${sqft.toLocaleString()} ft²`;
// After:  return `${sqft.toLocaleString()} sqft`;

// useFormatPricePerArea (line 209)
// Before: const unit = areaUnit === 'sqft' ? 'ft²' : 'm²';
// After:  const unit = areaUnit === 'sqft' ? 'sqft' : 'm²';
```

### PreferencesDialog.tsx Changes

**Header display (line 70):**
```typescript
// Before
const unitLabel = areaUnit === 'sqft' ? 'ft²' : 'm²';

// After
const unitLabel = areaUnit === 'sqft' ? 'sqft' : 'm²';
```

### HeatmapLegend.tsx Changes

**Dynamic unit in title (line 32):**
```typescript
// Before
<p className="heatmap-legend-title">Price per m²</p>

// After (with preferences hook)
const unitLabel = areaUnit === 'sqft' ? 'sqft' : 'm²';
<p className="heatmap-legend-title">Price per {unitLabel}</p>
```

---

## User Experience Impact

### For New Visitors (No Saved Preferences)
- See `$` prices and `sqft` areas immediately
- Familiar experience for US-based international buyers
- Can switch to ₪/m² anytime via preferences toggle

### For Returning Visitors (Have Saved Preferences)  
- No change - their saved preferences are loaded from localStorage
- Existing ILS/sqm users continue seeing ILS/sqm

### For Power Users
- Toggle remains easily accessible in header
- All formatting updates in real-time when preferences change
