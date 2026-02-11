

# "What You'll Pay" Summary Line for Rentals

## What We're Adding
A single subtle line directly below the rental price in PropertyQuickSummary, showing:

```
~₪X,XXX/mo total · ₪XX,XXXk to move in
```

This mirrors the existing mortgage estimate line that buy listings already show in the same position (lines 275-315). Clicking scrolls to the full Cost Breakdown section.

## Where It Goes
In `PropertyQuickSummary.tsx`, right after the price drop/increase badges (line 273) and *instead of* the mortgage estimate block (which is already hidden for rentals via `showMortgageEstimate`). Essentially occupying the same visual slot.

## Calculation Logic (reusing existing constants)
All numbers come from constants already defined in `formatRange.ts` and city data:

**Total Monthly:**
- Rent (the listed price) + Arnona estimate (city rate x size / 12) + Va'ad Bayit (from property or city average)

**Move-in Costs:**
- Security deposit: 2-3 months rent (`RENTAL_FEE_RANGES.securityDeposit`)
- First month's rent
- Agent fee if applicable: 1 month + VAT (`RENTAL_FEE_RANGES.agentFee`)

## UI Design
- Same `text-sm text-muted-foreground` styling as the existing mortgage line
- Tooltip on hover explaining what's included
- "See full breakdown" link that smooth-scrolls to `#section-costs`
- No new visual weight -- just a whisper under the price

## Scope
- **Only** for `listing_status === 'for_rent'` -- no changes to buy/sold/project listings
- Entirely within `PropertyQuickSummary.tsx` -- no new files needed

## Technical Details

### Data needed (already available via props + hooks)
- `property.price` (monthly rent)
- `property.vaad_bayit_monthly` (nullable, fallback from city data)
- `property.size_sqm` (for arnona estimate)
- `property.city` (for city data lookup)
- `property.agent_fee_required` (boolean)
- `useCityDetails` hook (already imported pattern in the codebase)

### File changes
**Edit: `src/components/property/PropertyQuickSummary.tsx`**
1. Import `useCityDetails` and `RENTAL_FEE_RANGES`, `VAT_RATE` from existing utils
2. Add city data fetch using the existing `useCityDetails` hook
3. Add rental summary calculation (arnona, va'ad, move-in total) -- ~15 lines of logic
4. After line 273 (price badges), add a conditional block for `isRental` that renders:
   - A tooltip-wrapped line showing `~₪X,XXX/mo total · ₪XXk to move in`
   - A "See full breakdown" anchor link to `#section-costs`
5. Same dotted-underline tooltip pattern used by the mortgage estimate

### What's NOT changing
- No new components or files
- No backend/database changes
- Buy listings untouched
- Cost Breakdown section stays exactly as-is
- No new dependencies
