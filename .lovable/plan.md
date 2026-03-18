

## Tiered Radius Expansion: 500m → 1km

### Approach

Modify `RecentNearbySales.tsx` to make two queries (or a single smarter one) — first at 500m, and if fewer than 3 comps are returned, automatically expand to 1km. Show a subtle label when the expanded radius is used.

### Changes

**1. `src/components/property/RecentNearbySales.tsx`**
- Add a second `useNearbySoldComps` call with `radiusKm: 1.0`, enabled only when the 500m query returns < 3 results
- Use the 1km results when the 500m results are insufficient
- Track which radius was used via a derived variable (`usedExpandedRadius`)
- Update the header subtitle from hardcoded "Within 500m" to dynamic "Within 500m" / "Within 1km"
- When expanded radius is used, show a small note: _"Expanded to 1km — fewer sales found nearby"_

**2. `src/components/property/MarketIntelligence.tsx`**
- Update the divider text that says "within 500m" to be dynamic — pass the actual radius used back up via the `onVerdictComputed` callback (add a third parameter) or a new callback, so the parent can display the correct distance

### Implementation Detail

```text
RecentNearbySales
├── query1: useNearbySoldComps(lat, lng, city, { radiusKm: 0.5, ... })
├── query2: useNearbySoldComps(lat, lng, city, { radiusKm: 1.0, ... })
│   └── enabled: query1 finished AND query1.length < 3
├── activeComps = query1.length >= 3 ? query1 : (query2 ?? query1)
└── expandedRadius = query1.length < 3 && query2?.length > 0
```

The second query reuses the same RPC and cache key structure — just a different radius. No database or edge function changes needed.

### Files to Change

| File | Change |
|------|--------|
| `src/components/property/RecentNearbySales.tsx` | Add second query, tiered logic, dynamic radius label |
| `src/components/property/MarketIntelligence.tsx` | Update divider text to reflect actual search radius |

