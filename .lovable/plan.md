
# Fix Price Display for 17 Cities: Use Canonical Data

## Problem

15 out of 17 cities you listed have **zero records** in the `market_data` table, causing the Market Overview section to display "₪0/m²":

| City | market_data records | Has canonical data? |
|------|---------------------|---------------------|
| Herzliya | 0 | ✅ ₪43,500/m² |
| Netanya | 0 | ✅ ₪26,595/m² |
| Haifa | 0 | ✅ ₪20,000/m² |
| Ramat Gan | 0 | ✅ ₪35,000/m² |
| Modi'in | 10 (fuzzy match) | ✅ ₪29,000/m² |
| Hod HaSharon | 0 | ✅ ₪29,500/m² |
| Petah Tikva | 0 | ✅ ₪24,600/m² |
| Hadera | 0 | ✅ ₪20,500/m² |
| Caesarea | 0 | ✅ ₪40,900/m² |
| Beit Shemesh | 0 | ✅ ₪23,000/m² |
| Gush Etzion | 0 | ✅ ₪22,050/m² |
| Mevaseret Zion | 0 | ✅ ₪28,333/m² |
| Zichron Yaakov | 18 (fuzzy match) | ✅ ₪27,400/m² |
| Pardes Hanna-Karkur | 0 | ✅ ₪20,425/m² |
| Ashkelon | 0 | ✅ ₪15,420/m² |
| Beer Sheva | 0 | ✅ ₪11,470/m² |
| Eilat | 0 | ✅ ₪17,200/m² |

**All 17 cities have accurate, verified data** in `city_canonical_metrics` - it's just not being used by `MarketOverviewCards`.

---

## Root Cause

The `CityQuickStats` component correctly uses this priority chain:
```text
canonicalMetrics → cityData → marketData
```

But `MarketOverviewCards` only does:
```text
marketData[0]?.average_price_sqm || 0   ← Falls back to 0!
```

---

## Solution

Update `MarketOverviewCards` to accept and use `canonicalMetrics` and `cityData` with the same fallback pattern as `CityQuickStats`.

### Changes to `src/components/city/MarketOverviewCards.tsx`

**1. Update interface to accept new props:**
```typescript
interface MarketOverviewCardsProps {
  marketData: MarketData[];
  cityName: string;
  arnonaRateSqm?: number | null;
  propertyTypes?: { name: string; value: number }[];
  dataSources?: Record<string, string> | null;
  lastVerified?: string | null;
  // NEW: Add these for proper fallback
  canonicalMetrics?: {
    average_price_sqm?: number | null;
  } | null;
  cityData?: {
    average_price_sqm?: number | null;
  };
}
```

**2. Implement priority fallback for price:**
```typescript
// Priority: Canonical > cityData > marketData > 0
const latestData = marketData[0];
const pricePerSqm = canonicalMetrics?.average_price_sqm 
  ?? cityData?.average_price_sqm 
  ?? latestData?.average_price_sqm 
  ?? 0;
```

### Changes to `src/pages/AreaDetail.tsx`

Pass the missing props to `MarketOverviewCards`:
```typescript
<MarketOverviewCards
  marketData={marketData}
  cityName={city.name}
  arnonaRateSqm={canonicalMetrics?.arnona_rate_sqm ?? city.arnona_rate_sqm}
  propertyTypes={...}
  dataSources={(city as any).data_sources}
  lastVerified={canonicalMetrics?.updated_at}
  // NEW: Pass canonical and city data for accurate pricing
  canonicalMetrics={canonicalMetrics}
  cityData={{
    average_price_sqm: city.average_price_sqm,
  }}
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/city/MarketOverviewCards.tsx` | Add `canonicalMetrics` and `cityData` props, implement fallback chain |
| `src/pages/AreaDetail.tsx` | Pass `canonicalMetrics` and `cityData` to `MarketOverviewCards` |

---

## Result

After this fix, all 17 cities will display their accurate, government-verified price data instead of ₪0/m². The data is already in the database - we're just connecting it properly.

### Before (Broken)
- Modi'in: ₪0/m²
- Herzliya: ₪0/m²
- (all 15 others): ₪0/m²

### After (Fixed)
- Modi'in: ₪29,000/m² ✅
- Herzliya: ₪43,500/m² ✅
- Netanya: ₪26,595/m² ✅
- ... (all verified from CBS/official sources)

---

## Data Accuracy Confirmation

All prices come from the `city_canonical_metrics` table which:
- Is marked with `tier_1_government: true` where applicable
- Has `source_priority: "cbs"` indicating CBS (Central Bureau of Statistics)
- Has been verified with `updated_at` timestamps

No external data is needed - this fix connects existing verified data to the display.
