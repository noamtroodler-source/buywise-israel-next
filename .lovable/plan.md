

# Add "Premium Segment" Label to Market Intelligence

## What changes

Detect when a listing's price/sqm is >30% above the city average and add contextual labels to help users understand the gap is due to market segment, not overpricing.

## Logic

```
isPremiumSegment = propertyPricePerSqm > cityAvgPriceSqm * 1.30
```

This is computed from data already available in `PropertyValueSnapshot` and `MarketIntelligence`.

## Visual changes

### 1. PropertyValueSnapshot (purchase cards)
When `isPremiumSegment` is true:
- Add a small muted label under the "vs Neighborhood/City Avg" card (Card 2) and "vs City N-Room Avg" card (Card 3): *"Premium segment — averages include all market tiers"*
- Replace `text-semantic-red` icon color on TrendingUp with `text-semantic-amber` for all purchase comparison cards (consistency with no-red philosophy)

### 2. MarketVerdictBadge
When `isPremiumSegment` is true AND variance is +5% to +20%:
- Append context line: *"Premium property — city/neighborhood averages include all market segments"*

### 3. Rental cards
Same treatment: replace `text-semantic-red` on TrendingUp with `text-semantic-amber`.

## Files changed

**`src/components/property/PropertyValueSnapshot.tsx`**
- Compute `isPremiumSegment` from existing props
- Add subtitle text on Cards 2 & 3 when premium
- Replace all `text-semantic-red` → `text-semantic-amber` on TrendingUp icons

**`src/components/property/MarketIntelligence.tsx`**
- Compute `isPremiumSegment` and pass context to `MarketVerdictBadge`
- Add premium context line in badge component when applicable

