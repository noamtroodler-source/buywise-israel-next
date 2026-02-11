

## Consolidate "AI Value Snapshot" + "Recent Nearby Sales" into "Market Intelligence"

**Goal:** Merge two separate sections into a single cohesive section that answers "Is this a fair price?" with a narrative flow: Verdict -> Evidence -> Action.

---

### What Changes

#### 1. New Component: `src/components/property/MarketIntelligence.tsx`

A wrapper component that combines both sub-sections under one unified header. Structure:

```text
Market Intelligence
├── Section header with icon + "Government verified" badge
├── Market Verdict Badge (promoted from RecentNearbySales to hero position)
│   - Blue: "Priced in line" or "Below average"
│   - Amber: "Above average" (+10-20%)
│   - Rose: "Significantly above" (+20%)
│   - Falls back to "Limited data" when no comps exist
├── Value Snapshot Cards (3 metric cards: Price/sqm, vs City Avg, 12-mo Trend)
│   - Rendered inline (no sub-header), pulled from existing PropertyValueSnapshot logic
├── Divider + "Based on X verified sales within 500m"
├── Recent Nearby Sales comps list (existing comp cards, no duplicate header)
│   - Desktop: show 3 + "Show more"
│   - Mobile: carousel
├── Source attribution footer (existing "Government verified data" line)
└── Link: "Explore [City] Market Data" -> /areas/{citySlug}
```

This component receives all the props that both `PropertyValueSnapshot` and `RecentNearbySales` currently receive, and composes them internally.

#### 2. Update `PropertyValueSnapshot.tsx`

- Remove the standalone header ("AI Value Snapshot" with BarChart3 icon) since the parent `MarketIntelligence` now owns the header
- Export the metric cards grid as-is but without the wrapping `space-y-4` div and header
- Essentially just strip the top-level title — the cards remain unchanged

#### 3. Update `RecentNearbySales.tsx`

- Remove the standalone header ("Recent Nearby Sales" with TrendingUp icon)
- Remove the Market Verdict badge (it moves up to the parent `MarketIntelligence` level)
- Export the verdict calculation logic (or keep it internal but expose `avgComparison` via a prop/callback so the parent can use it) — simplest approach: keep the verdict inside `RecentNearbySales` but add a `hideHeader` and `hideVerdict` prop so the parent controls layout
- Keep the comps list, carousel, loading/empty states, and source footer intact

#### 4. Update `PropertyDetail.tsx`

Replace the two separate `motion.div` blocks (lines 179-227) with a single block:

```tsx
{/* Market Intelligence - Unified section */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: 0.1 }}
  className="py-6 border-b border-border md:border-none"
>
  <MobileCollapsibleSection
    id="market-intelligence"
    title="Market Intelligence"
    icon={<BarChart3 className="h-5 w-5" />}
    summary={verdictSummaryText}
    alwaysStartClosed
  >
    <MarketIntelligence
      property={property}
      cityData={cityData}
    />
  </MobileCollapsibleSection>
</motion.div>
```

- The rental path keeps the existing `PropertyValueSnapshot` rendering (rental snapshot logic is separate and stays as-is)
- For `for_sale` / `sold` listings, the new `MarketIntelligence` component replaces both sections

---

### Technical Details

**Files modified:**
- `src/components/property/PropertyValueSnapshot.tsx` — Add `hideHeader` prop; when true, skip the title row
- `src/components/property/RecentNearbySales.tsx` — Add `hideHeader` and `hideVerdict` props; expose `avgComparison` calculation. When these props are set, the parent controls header and verdict placement
- `src/pages/PropertyDetail.tsx` — Replace two separate motion blocks with one unified `MarketIntelligence` block for non-rental listings

**New file:**
- `src/components/property/MarketIntelligence.tsx` — Composition component that renders the verdict badge at top, then value snapshot cards, then comps evidence

**No database changes.** No new hooks. Same data sources, just restructured presentation.

**Mobile behavior:** The entire "Market Intelligence" section becomes one `MobileCollapsibleSection` instead of two separate ones. On desktop, everything renders expanded as a single flowing section.

**Edge cases:**
- No comps available: Show value snapshot cards only, with a "No nearby sales data yet" note below
- No value snapshot data (no city data): Show comps only with the verdict badge
- Rental listings: Skip this component entirely — rentals keep their existing separate "AI Rental Snapshot" section unchanged

