
# Unified Source Attribution: Consistent Design Across City Pages

## Problem Summary

Looking at your screenshots and the code, the source attribution tooltips show inconsistent formats:

| Screenshot | Issues |
|------------|--------|
| Image 1 (Ra'anana) | Shows specific data types: Arnona, Price Data, Rental Data, Historical Prices - detailed with dates |
| Image 2 (Modi'in) | Shows generic labels: Primary, Secondary, Tier 1 Government - with empty values for Secondary and Tier 1 |
| Image 3 (Modi'in) | Same empty labels issue in a different location |

The root causes are:
1. Cities have different `data_sources` JSON structures in the database
2. The tooltip blindly displays whatever keys exist, including empty ones
3. Labels are auto-generated from keys like `tier_1_government` becoming "Tier 1 Government:"

---

## The Trust-Building Solution

Based on best practices for building user trust, the unified design should:

1. **Never show empty values** - If a field has no data, hide it entirely
2. **Use consistent, user-friendly labels** - Map technical keys to readable names
3. **Prioritize the primary source** - Lead with the most authoritative source
4. **Show verification date prominently** - Users care about data freshness
5. **Use the same icon** - Consistency signals reliability (`ShieldCheck` is best)
6. **Hide confusing technical terms** - "Tier 1 Government" → show a simple checkmark badge instead

---

## Unified Design Specification

### Inline Badge (CityQuickStats, MarketOverviewCards, PriceTrendsSection)

```text
+---------------------------------------------+
|  ✓ CBS · Jan 2026                           |
+---------------------------------------------+
```

On hover/click (tooltip):

```text
+---------------------------------------------+
|  ✓ Verified Data Sources                    |
|                                             |
|  Price Data: CBS, Madlan Q4 2024            |
|  Rental Data: Yad2, Madlan                  |
|  Arnona: Municipality 2025                  |
|                                             |
|  ─────────────────────────────────          |
|  Last verified: Jan 2026                    |
+---------------------------------------------+
```

Key changes:
- Only show non-empty data categories
- Use friendly labels (not raw database keys)
- Consistent "Last verified" wording
- No "Primary/Secondary" hierarchy confusion

---

## Implementation Plan

### Phase 1: Normalize Source Labels

Create a shared utility for consistent label mapping:

**New file: `src/lib/utils/sourceFormatting.ts`**

```typescript
// Friendly labels for source categories
export const SOURCE_LABELS: Record<string, string> = {
  // Specific data types (preferred format)
  price_data: 'Price Data',
  rental_data: 'Rental Data',
  arnona: 'Arnona',
  arnona_data: 'Arnona',
  historical_prices: 'Historical Prices',
  market_factors: 'Market Factors',
  demographics: 'Demographics',
  
  // Generic hierarchy (older format - to be deprecated)
  primary: 'Primary Source',
  secondary: 'Secondary Sources',
  profile: 'Profile Data',
  
  // Boolean flags (don't display as text)
  tier_1_government: null, // Handle specially
  earliest_reliable_year: null, // Don't show
};

// Categories that should show as badges, not text
export const BADGE_CATEGORIES = ['tier_1_government'];

// Categories to skip entirely
export const HIDDEN_CATEGORIES = ['earliest_reliable_year'];
```

---

### Phase 2: Update InlineSourceBadge Component

**File: `src/components/shared/InlineSourceBadge.tsx`**

Changes:
1. Import and use the new label mapping
2. Filter out empty values and hidden categories
3. Handle nested `{date, source}` format correctly
4. Improve primary source abbreviation logic
5. Add "Government Verified" badge for `tier_1_government: true`

Key logic improvements:
- Check if value is actually meaningful before displaying
- Use consistent `ShieldCheck` icon
- Better extraction of primary sources for display

---

### Phase 3: Update CitySourceAttribution Component

**File: `src/components/city/CitySourceAttribution.tsx`**

Changes:
1. Use shared label mapping
2. Filter out empty/null values before rendering
3. Handle array values (secondary sources) properly
4. Show "Government Verified" badge when `tier_1_government: true`
5. Keep the expandable methodology section

---

### Phase 4: Standardize Database Format (Future)

While not blocking this fix, recommend standardizing all city `data_sources` to use the specific category format:

```json
{
  "price_data": { "source": "CBS, Madlan", "date": "Q1 2025" },
  "rental_data": { "source": "Yad2, Madlan", "date": "January 2025" },
  "arnona": { "source": "Municipality", "date": "2025" },
  "tier_1_government": true
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/utils/sourceFormatting.ts` | **New file** - Shared label mapping and formatting utilities |
| `src/components/shared/InlineSourceBadge.tsx` | Filter empty values, use consistent labels, improve formatting |
| `src/components/city/CitySourceAttribution.tsx` | Filter empty values, use consistent labels, handle arrays |

---

## Before/After Comparison

### Before (Current - Inconsistent)

Modi'in tooltip:
```
Verified Data Sources
Primary: Central Bureau of Statistics (CBS)
Secondary:
Tier 1 Government:
Last verified: Jan 2026
```

Ra'anana tooltip:
```
Verified Data Sources
Arnona: Tel Aviv Municipality 2019 baseline, 2025 adjusted (2025)
Price Data: CBS Housing Price Index Q3 2025 (2025-09)
Rental Data: Yad2, Semerenkogroup (2025-09)
Historical Prices: CBS Housing Price Index Northern District (2015-2025)
Last verified: Jan 2026
```

### After (Unified)

All cities:
```
Verified Data Sources

Price Data: CBS, Madlan Q4 2024
Rental Data: Yad2, Market listings
Arnona: Municipality 2025

✓ Government verified source
─────────────────────────────────
Last verified: Jan 2026
```

---

## Trust-Building Enhancements

1. **Government Badge**: When `tier_1_government: true`, show a small badge "Government verified source" instead of an empty label
2. **Consistent Icon**: Always use `ShieldCheck` (the checkmark in a shield) for verification
3. **Smart Abbreviation**: Show "CBS" inline, expand to "Central Bureau of Statistics" in tooltip
4. **Never Empty**: If a city has no detailed sources, show a generic "Data sourced from official government and industry records"
5. **Date Formatting**: Consistent "Jan 2026" format everywhere

---

## Summary

This plan:
- Creates a shared source formatting utility
- Updates 2 existing components to use consistent formatting
- Filters out empty values so users never see blank labels
- Adds a "Government verified" badge for official sources
- Uses consistent icons and terminology throughout
- Builds user trust through visual consistency
