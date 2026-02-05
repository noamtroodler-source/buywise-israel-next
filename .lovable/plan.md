

# Ensure All Resale Listings Have Nearby Sold Comps

## Current State

- **309** resale listings with coordinates
- **1,822** sold transactions in database
- **7 cities with listings but NO comps**: Modi'in (name mismatch), Ma'ale Adumim, Hadera, Zichron Yaakov, Gush Etzion, Efrat, Givat Shmuel

## Issues to Fix

| Issue | Impact |
|-------|--------|
| City name mismatch: `Modi'in` vs `Modiin` | 16 listings have no matching comps |
| 6 cities completely missing from sold data | ~50 listings have no nearby comps |

## Solution

### Step 1: Fix City Name Consistency

Update the `seed-sold-transactions` edge function to use the exact city name from each property (which it already does correctly - the issue is the existing data).

### Step 2: Re-run Seeding with Clear Flag

Call the edge function with `clearExisting: true` to:
1. Delete all existing sold transactions
2. Re-generate 4-8 comps per property
3. Use correct city names matching properties table

### Step 3: Verify Comp Quality

The existing algorithm already ensures prices are realistic:
- Price per sqm derived from listing's price
- ±15% variance for market spread
- Size variance of ±20%
- Coords within 0-500m of listing

## Execution Plan

1. Deploy the existing edge function (no code changes needed)
2. Call it with options:
```json
{
  "clearExisting": true,
  "compsPerProperty": 6
}
```

This will generate ~1,854 sold transactions (309 properties × 6 comps) with prices anchored to each listing's price per sqm.

## Expected Result

| Metric | Before | After |
|--------|--------|-------|
| Total sold transactions | 1,822 | ~1,854 |
| Cities with comps | 19 | 25 (all) |
| Price alignment | Mixed | ±15% of listing price/sqm |
| Comp distance | 0-500m | 0-500m |

## No Code Changes Required

The existing `seed-sold-transactions` function already:
- Uses city name directly from properties table
- Generates prices based on listing's price/sqm with ±15% variance
- Creates 4-8 comps per property within 500m radius

We just need to re-run it with `clearExisting: true` to fix the data inconsistencies.

