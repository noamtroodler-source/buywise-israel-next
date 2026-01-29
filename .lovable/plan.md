
# Rename "Browse by Area" to Clarify Purpose

## The Problem

"Browse by Area" implies you'll find property listings organized by area - but the Areas page is actually about **understanding market conditions** per city (prices, trends, yields, rental ranges). This creates a mismatch in expectations.

## What City Pages Actually Contain

Relevant for **Renters**:
- Rental price ranges (3/4/5-room apartments)
- Gross rental yields
- "Rentals" CTA linking to filtered listings
- General market context and trends

Relevant for **Buyers/Investors**:
- Price per sqm and median prices
- Historical price trends
- Market factors ("Worth Watching")
- Investment yield data

## Recommendation

Keep the link in all three menus (Buy, Rent, Projects) but with **clearer wording**:

| Menu | Current Label | New Label | Description |
|------|--------------|-----------|-------------|
| Buy | Browse by Area | Understand Markets | Price & trend context by city |
| Rent | Browse by Area | Market Overview | Rental prices by city |
| Projects | (not present) | - | (no change needed) |

---

## Changes to Navigation Config

**File:** `src/lib/navigationConfig.ts`

### Buy Section (lines 40-43)
```tsx
// Current
{ label: 'Browse by Area', href: '/areas', phase: 'explore' },

// New
{ label: 'Understand Markets', href: '/areas', description: 'Price & trend context', phase: 'understand' },
```

**Why this works:**
- "Understand Markets" clearly signals educational/research content
- Changes phase from `explore` to `understand` (aligns with journey framework)
- Added description helps clarify purpose in the mega-menu

### Rent Section (lines 75-77)
```tsx
// Current
{ label: 'Browse by Area', href: '/areas', phase: 'explore' },

// New
{ label: 'Market Overview', href: '/areas', description: 'Rental prices by city', phase: 'understand' },
```

**Why keep it for renters:**
- City pages show rental price ranges (3/4/5 room)
- Rental yields are displayed
- "Rentals" CTA on each city page links to filtered listings
- Renters benefit from understanding the market before committing

---

## Summary

| File | Line | Change |
|------|------|--------|
| `src/lib/navigationConfig.ts` | 42 | "Browse by Area" -> "Understand Markets" with description |
| `src/lib/navigationConfig.ts` | 76 | "Browse by Area" -> "Market Overview" with rental-focused description |

No changes to Projects menu (it doesn't have this link).

---

## Result

- Clearer expectations: users know they're going to learn about markets, not browse listings
- Rental relevance maintained: renters can still access city-level rental data
- Better journey alignment: moves from "explore" phase to "understand" phase
