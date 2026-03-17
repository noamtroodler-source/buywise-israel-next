

## Implementation: BuyWise Estimate Badge + Transparency Layer

All database work (verification table, 7 cities, 128 rows of data) is already done. This is purely UI work — 3 new/modified files.

### File 1: `src/hooks/useCityVerification.ts` (new)

Hook that queries `city_rental_verification` for a given city slug. Returns:
- `yieldRow` (room_count=0) — yield source, verified date
- `rental4Room` — 4-room rental range for the methodology tooltip
- `sources` — deduplicated source list (e.g. "Madlan, GPG")
- `verifiedAt` — verification date

Uses react-query with 1-hour stale time (this data rarely changes).

### File 2: `src/components/shared/BuyWiseEstimateBadge.tsx` (new)

A small badge + tooltip component that:
- Displays: `BuyWise Estimate` with a `Lightbulb` Lucide icon (amber/warm color to distinguish from government ShieldCheck blue)
- Tooltip content shows methodology:
  > "Calculated from avg 4-room rent ₪X,000–Y,000/mo ÷ median purchase price ₪Z.ZM. Sources: Madlan, GPG. Verified Mar 2025."
- Uses `useFormatPrice` hook for currency formatting
- Props: `yieldMin`, `yieldMax`, `rental4RoomMin`, `rental4RoomMax`, `medianPrice`, `sources`, `verifiedAt`
- Falls back to simpler text if rental4Room data isn't available
- Styled with `text-amber-600` / `bg-amber-50` to visually separate from government-source badges

### File 3: `src/components/city/CityQuickStats.tsx` (modify)

Changes:
1. **Add `citySlug` prop** to the interface (passed from AreaDetail.tsx)
2. **Import and call `useCityVerification(citySlug)`** to get methodology data
3. **Yield section** — append the `BuyWiseEstimateBadge` right after the yield range text, replacing the current plain display:
   - Before: `2.8%–3.4% yield`
   - After: `2.8%–3.4% yield` `[BuyWise Estimate ⓘ]`
4. **Rental section** — also gets the BuyWise badge (same data source)
5. **CBS InlineSourceBadge** stays attached only to price/sqm and median price (those are government-sourced)

### File 4: `src/pages/AreaDetail.tsx` (modify)

One-line change: pass `citySlug={slug}` prop to `<CityQuickStats>` (the slug is already available from `useParams`).

### Visual Result

```text
₪38k–52k/m²  |  ₪3.5M median  |  2.8%–3.4% yield [💡 BuyWise Estimate ⓘ]  |  ₪7.5k–11k/mo [💡 BuyWise Estimate ⓘ]  |  ✓ CBS, MoJ · Mar 2025
                                   ↑ amber badge, tooltip shows math           ↑ same treatment                           ↑ blue gov badge (unchanged)
```

The tooltip on hover reveals: "Calculated from avg 4-room rent ₪9,500–14,000/mo ÷ median purchase price ₪3.5M. Sources: Madlan, GPG. Verified Mar 2025."

