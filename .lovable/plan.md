

# Mock Sold Transactions Seeding Plan

## Overview

Create an edge function to seed realistic mock sold transaction data into the `sold_transactions` table. This will ensure every resale listing shows "Recent Nearby Sales" with believable comps that match the listing's location and price range.

---

## Data Generation Strategy

### Per-Property Clustering

For each resale listing with coordinates, generate 4-8 sold transactions nearby:

| Distance Tier | Percentage | Distance Range | Badge |
|---------------|------------|----------------|-------|
| Same building | 15% | 0-20m | "Same building" badge |
| Very close | 35% | 20-150m | "85m away" |
| Nearby | 50% | 150-500m | "320m away" |

### Price Calibration

Use the property's actual price to calibrate sold prices:
- Base the sold price per sqm on the listing's implied price/sqm
- Add realistic variance: ±15% to create natural market spread
- This ensures "Listing is X% above/below this sale" badges make sense

### Date Distribution (24 months)

| Time Period | Weight | Example Range |
|-------------|--------|---------------|
| Recent (0-6 months) | 45% | Aug 2025 - Jan 2026 |
| Mid-range (6-12 months) | 35% | Feb 2025 - Jul 2025 |
| Older (12-24 months) | 20% | Feb 2024 - Jan 2025 |

---

## Implementation Details

### New Edge Function: `seed-sold-transactions`

**File:** `supabase/functions/seed-sold-transactions/index.ts`

#### Core Logic Flow

```text
1. Fetch all resale properties with lat/lng from properties table
2. For each property:
   a. Determine number of comps to generate (4-8)
   b. Calculate base price/sqm from property price and size
   c. For each comp:
      - Pick distance tier (same building / close / nearby)
      - Generate coordinates near the property
      - Generate rooms/size with slight variance from listing
      - Calculate sold price based on listing's price/sqm ± variance
      - Generate sold date (weighted toward recent)
      - Pick property type, condition, floor, etc.
   d. Insert batch to sold_transactions
3. Return summary stats
```

#### Coordinate Generation

```typescript
function generateNearbyCoords(lat: number, lng: number, maxDistanceMeters: number) {
  // Generate random point within radius
  const radiusInDegrees = maxDistanceMeters / 111000; // ~111km per degree
  const angle = Math.random() * 2 * Math.PI;
  const r = Math.sqrt(Math.random()) * radiusInDegrees;
  
  return {
    latitude: lat + r * Math.cos(angle),
    longitude: lng + r * Math.sin(angle) / Math.cos(lat * Math.PI / 180),
  };
}
```

#### Price Generation (Relative to Listing)

```typescript
function generateSoldPrice(listingPrice: number, listingSqm: number, soldSqm: number) {
  const listingPriceSqm = listingPrice / listingSqm;
  
  // Add ±15% variance to create realistic spread
  const variance = 0.85 + Math.random() * 0.30; // 0.85 to 1.15
  const soldPriceSqm = listingPriceSqm * variance;
  
  return Math.round(soldSqm * soldPriceSqm);
}
```

#### Transaction Fields

| Field | Generation Logic |
|-------|-----------------|
| `sold_price` | Based on listing price/sqm ± 15% variance |
| `sold_date` | Random date within 24 months, weighted toward recent |
| `property_type` | 60% apartment, 15% duplex, 10% penthouse, 10% garden_apartment, 5% cottage |
| `rooms` | Listing rooms ± 1 (min 2, max 6) |
| `size_sqm` | Listing size ± 20% variance |
| `floor` | 0-12, weighted toward middle floors |
| `year_built` | 1975-2024, weighted toward 2000+ |
| `asset_condition` | 40% good, 35% renovated, 25% new |
| `is_new_construction` | True if year_built > 2022 |
| `latitude/longitude` | Near listing with controlled radius |
| `address` | Generated street name + number in listing's city |
| `source` | 70% 'nadlan_gov_il', 30% 'israel_tax_authority' |

---

## Address Generation

Generate realistic Israeli addresses for each transaction:

```typescript
const STREET_NAMES = [
  "Herzl", "Ben Yehuda", "Rothschild", "Jabotinsky", "Weizmann",
  "Dizengoff", "Ben Gurion", "Nordau", "Arlozorov", "King George",
  "HaNevi'im", "Emek Refaim", "Jaffa", "Bialik", "Sokolov"
];

function generateAddress(city: string): string {
  const street = randomChoice(STREET_NAMES);
  const number = randomInt(1, 120);
  return `${number} ${street} Street, ${city}`;
}
```

---

## Expected Outcomes

### Database State After Seeding
- **sold_transactions** table: ~1,500-2,000 rows (assuming ~200 resale listings × 6 comps average)
- Coverage: All cities with resale listings
- Date range: February 2024 - January 2026

### Frontend Behavior

On any property detail page with coordinates:
- **RecentNearbySales** will show 3-5 actual comps from database
- **"Same building"** badge appears for closest matches (~15%)
- **Price comparison badges** show realistic comparisons (±15% variance)
- Tooltips explain data source and calculations

### Sample Display

```text
📍 Recent Nearby Sales
Last 24 months • Within 500m
────────────────────────────────────────────────────────
🏠 3BR, 92m² sold for ₪2,480,000
   Same building • Oct 2025
   ₪26,957/m²
   🏷️ Listing is 8% above this sale

🏠 4BR, 115m² sold for ₪3,150,000
   85m away • Aug 2025
   ₪27,391/m²

🏠 3BR, 88m² sold for ₪2,310,000
   220m away • Jun 2025
   ₪26,250/m²
────────────────────────────────────────────────────────
🛡️ Government verified data
```

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `supabase/functions/seed-sold-transactions/index.ts` | Edge function to generate and insert mock sold data |

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add config entry for new edge function |

---

## Technical Details

### Function Structure

```text
seed-sold-transactions/index.ts
├── CORS headers
├── Constants:
│   ├── STREET_NAMES (Israeli street names)
│   ├── PROPERTY_TYPES_WEIGHTED
│   └── ASSET_CONDITIONS
├── Helper functions:
│   ├── randomInt(), randomChoice()
│   ├── generateNearbyCoords(lat, lng, maxMeters)
│   ├── generateSoldDate(monthsBack)
│   ├── generateSoldPrice(listingPrice, listingSqm, soldSqm)
│   └── generateAddress(city)
├── Main logic:
│   ├── Fetch resale properties with coordinates
│   ├── Generate 4-8 comps per property
│   ├── Batch insert to sold_transactions
│   └── Clear existing data first (optional flag)
└── Response with summary stats
```

### Unique Constraint Handling

The `sold_transactions` table has a unique constraint on `(address, city, sold_date, sold_price)`. The seeder will generate unique addresses by combining:
- Random street name
- Random building number (1-120)
- Random apartment suffix (optional)

---

## Admin Triggering

After deployment, the function can be triggered:

1. **Via SoldTransactionsAdmin page** - Add a "Seed Mock Data" button
2. **Via direct API call** - POST to the edge function endpoint

### Request Options

```typescript
interface SeedRequest {
  clearExisting?: boolean;  // Delete existing data first
  compsPerProperty?: number; // Override default 4-8
  limitCities?: string[];   // Only seed specific cities
}
```

---

## Testing Checklist

1. **Data Quality**
   - Verify prices are realistic relative to each listing
   - Confirm date distribution spans 24 months
   - Check coordinate clustering near listings

2. **Frontend Integration**
   - Visit 5+ property pages in different cities
   - Confirm comps appear with proper formatting
   - Verify "Same building" badges show correctly
   - Check price comparison badges show realistic percentages

3. **Edge Cases**
   - Properties at city boundaries
   - Properties with unusual sizes/prices
   - Very expensive vs. affordable listings

