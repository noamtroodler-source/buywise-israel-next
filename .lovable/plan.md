

## Personalized "What This Means" Insights for Every City

### What we're doing
Replace the generic, formula-driven insight text (lines 166–191 of `HistoricalPriceChart.tsx`) with a city-specific insight map. Each city gets a hand-crafted, conversational insight template that references its actual metrics dynamically but reads like advice from a knowledgeable friend.

### Implementation

**File: `src/components/city/HistoricalPriceChart.tsx`**

Replace the current `insight` useMemo (lines 166–191) with:

1. A `CITY_INSIGHTS` map keyed by slug, where each entry is a function receiving `metrics` (totalAppreciation, cagr, latestYoY, deltaVsNational, currentPrice, peakYear, peakPrice, years) and returning a string. This lets each city have its own narrative while weaving in real numbers.

2. A fallback generator for any city not in the map (keeps current logic but in friendlier tone).

**Example entries:**

```typescript
'tel-aviv': (m) => `Tel Aviv consistently commands a significant premium over the national market — currently about ${Math.abs(m.deltaVsNational)}% above average. Prices have ${m.latestYoY < 0 ? `dipped about ${Math.abs(m.latestYoY).toFixed(1)}% from their ${m.peakYear} peak, which is rare here. If you've been watching this market, this is one of the more buyer-friendly moments you'll get` : `grown ${m.latestYoY.toFixed(1)}% in the past year, continuing the upward trend`}. At around ${formatAbbrev(m.currentPrice)} average, ${m.latestYoY < 0 ? `there's a bit more room to negotiate than there was 18 months ago` : `expect competition — demand here doesn't let up`}.`

'beer-sheva': (m) => `Beer Sheva has quietly been one of Israel's fastest-growing markets — up ${m.totalAppreciation.toFixed(0)}% over the last ${m.years} years. It's still well below the national average, but that gap is narrowing as demand picks up from the tech park and university expansion. At around ${formatAbbrev(m.currentPrice)} for an average apartment, you're getting in while it's still undervalued relative to where it's heading.`
```

3. All ~30 cities get unique entries reflecting their character: tech hubs (Herzliya, Ra'anana), affordable growth (Beer Sheva, Hadera), coastal lifestyle (Netanya, Nahariya), premium suburban (Shoham, Mevaseret Zion), Jerusalem corridor (Beit Shemesh, Ma'ale Adumim), etc.

4. The `citySlug` prop (already available) is used as the lookup key.

### What changes
- **Lines 166–191** of `HistoricalPriceChart.tsx`: Replace with city insight map + fallback
- Add `citySlug` to the insight useMemo dependency (already a prop)
- No other files change

### What stays the same
- Metric pills above the chart (precise numbers)
- Insight box styling, icon, conditional rendering
- All other sections

