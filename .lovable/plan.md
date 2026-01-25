
# City-Specific Arnona & Utilities Estimate Implementation

## Overview

This plan adds two features to the Project Cost Breakdown component:
1. **City-Specific Arnona Estimates** - Use actual Herzliya rates from the database instead of generic ₪70-120/sqm
2. **Utilities Estimate** - Add a new monthly cost line item (₪250-700/mo depending on size)

---

## Current State

The `ProjectCostBreakdown` component currently:
- Does NOT receive the project's city as a prop
- Uses hardcoded generic Arnona rates: `estimatedSizeSqm * 70 / 12` to `estimatedSizeSqm * 120 / 12`
- Has no utilities line item in monthly costs

---

## Implementation

### Step 1: Pass City to ProjectCostBreakdown

**File:** `src/pages/ProjectDetail.tsx`

Add `city` prop to the component:

```
<ProjectCostBreakdown 
  units={units}
  defaultPrice={project.price_from || 0}
  currency={project.currency || 'ILS'}
  city={project.city}                    // ADD THIS
/>
```

---

### Step 2: Update Component Interface

**File:** `src/components/project/ProjectCostBreakdown.tsx`

Update props interface to accept city:

```typescript
interface ProjectCostBreakdownProps {
  units: ProjectUnit[];
  defaultPrice?: number;
  currency?: string;
  city?: string;  // NEW - project's city name
}
```

---

### Step 3: Fetch City-Specific Arnona Data

**File:** `src/components/project/ProjectCostBreakdown.tsx`

Add the `useCityDetails` hook to fetch Herzliya's actual Arnona rates:

```typescript
import { useCityDetails } from '@/hooks/useCityDetails';

// Inside component:
const citySlug = city?.toLowerCase().replace(/\s+/g, '-') || '';
const { data: cityData } = useCityDetails(citySlug);
```

---

### Step 4: Replace Generic Arnona Logic

**Current code (lines 129-132):**
```typescript
const arnonaRange = {
  low: Math.round(estimatedSizeSqm * 70 / 12),
  high: Math.round(estimatedSizeSqm * 120 / 12),
};
```

**New code:**
```typescript
const arnonaRange = useMemo(() => {
  // Use city-specific data if available
  if (cityData?.arnona_rate_sqm) {
    const annualArnona = cityData.arnona_rate_sqm * estimatedSizeSqm;
    const monthly = Math.round(annualArnona / 12);
    // Show ±15% range for municipal tier variation
    return {
      low: Math.round(monthly * 0.85),
      high: Math.round(monthly * 1.15),
    };
  }
  
  // Fallback to generic estimates
  return {
    low: Math.round(estimatedSizeSqm * 70 / 12),
    high: Math.round(estimatedSizeSqm * 120 / 12),
  };
}, [cityData, estimatedSizeSqm]);
```

---

### Step 5: Add Utilities Estimate

**File:** `src/components/project/ProjectCostBreakdown.tsx`

Import the existing utilities helper:
```typescript
import { getUtilitiesEstimate } from '@/lib/utils/formatRange';
```

Add utilities calculation after insurance range:
```typescript
const utilitiesRange = useMemo(() => {
  return getUtilitiesEstimate(estimatedSizeSqm);
}, [estimatedSizeSqm]);
```

Update monthly totals to include utilities:
```typescript
// Total monthly ownership (without mortgage)
const monthlyOwnershipRange = {
  low: arnonaRange.low + vaadBayitRange.low + insuranceRange.low + utilitiesRange.min,
  high: arnonaRange.high + vaadBayitRange.high + insuranceRange.high + utilitiesRange.max,
};
```

---

### Step 6: Add Utilities UI Row

**File:** `src/components/project/ProjectCostBreakdown.tsx`

Add new row after Insurance in the monthly costs collapsible section (after line 485):

```tsx
{/* Utilities */}
<div className="flex justify-between py-2">
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
        Utilities (estimate)
      </span>
    </TooltipTrigger>
    <TooltipContent side="left" className="max-w-xs">
      <p className="font-medium mb-1">Monthly Utilities</p>
      <p className="text-xs">
        Electricity, water, gas, and internet. Varies by usage, 
        season, and provider. Based on ~{estimatedSizeSqm} sqm apartment.
      </p>
    </TooltipContent>
  </Tooltip>
  <span className="font-medium">
    {formatPriceRange(utilitiesRange.min, utilitiesRange.max, 'ILS')}/mo
  </span>
</div>
```

---

### Step 7: Update Arnona Tooltip with City Context

Update the Arnona tooltip to show city-specific context when available:

```tsx
<TooltipContent side="left" className="max-w-xs">
  <p className="font-medium mb-1">Municipal Property Tax (Arnona)</p>
  <p className="text-xs">
    {city ? (
      <>
        Estimate for {city} based on ~{estimatedSizeSqm} sqm. 
        Actual rate depends on municipal zone and property classification.
      </>
    ) : (
      <>
        Monthly tax paid to the city. Rate varies by city and property size. 
        Estimate based on ~{estimatedSizeSqm} sqm at typical rates.
      </>
    )}
  </p>
</TooltipContent>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ProjectDetail.tsx` | Add `city={project.city}` prop |
| `src/components/project/ProjectCostBreakdown.tsx` | Add city prop, fetch city data, add utilities row |

---

## Expected Result

**For Marina Towers Herzliya:**

**Before (generic):**
- Arnona: ₪350–600/mo (based on 70-120/sqm generic)
- No utilities shown

**After (city-specific):**
- Arnona: ₪480–650/mo (based on Herzliya's ~110/sqm rate ±15%)
- Utilities: ₪350–550/mo (based on ~80sqm medium apartment)

**Monthly total increases** to reflect realistic ownership costs including utilities.

---

## Data Flow

```
ProjectDetail.tsx
   └── project.city = "Herzliya"
          │
          ▼
ProjectCostBreakdown
   └── useCityDetails("herzliya")
          │
          ▼
   cities table
   └── arnona_rate_sqm: 110 (or actual Herzliya rate)
          │
          ▼
   Calculated: (110 × estimatedSqm) / 12 = monthly
```
