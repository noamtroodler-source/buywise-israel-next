
# Overage Price Display — Replace Hardcoded Constants with Live DB Rates

## The Problem

Five UI surfaces show overage prices using hardcoded constants from two hooks rather than querying the live `overage_rates` table. The DB already has the real numbers seeded and `useOverageRate` already exists to query them — it just isn't wired into the two limit-check hooks.

### Confirmed DB rates (live in `overage_rates` table)
| Entity | Resource | Rate |
|---|---|---|
| Agency | Listing | ₪150/listing/month |
| Agency | Seat | ₪100/seat/month |
| Developer | Project | ₪500/project/month |

These match the hardcoded constants exactly today, but the constants are labeled "Mock" and are a maintenance liability. More importantly, they're not surfaced as authoritative data — if admin ever updates a rate in the DB, the UI won't reflect it.

### Affected surfaces (all consuming hardcoded values)

| Surface | Hook | Field | Issue |
|---|---|---|---|
| `ListingLimitBanner.tsx` | `useListingLimitCheck` | `overageMockPrice` | Hardcoded `OVERAGE_PRICES` constant |
| `SeatSummaryCard.tsx` | `useSeatLimitCheck` | `overageMockPrice` | Hardcoded `OVERAGE_PRICE_AGENCY_SEAT = 100` |
| `CreateInviteDialog.tsx` | `useSeatLimitCheck` | `overageMockPrice` | Same hardcoded constant |
| `UsageMeters.tsx` | calls `useOverageRate` directly | `listingRate`, `seatRate` | ✅ Already uses live DB |
| `SeatOverageConsentDialog.tsx` | calls `useOverageRate` directly | `liveRate` | ✅ Already uses live DB |

The `UsageMeters` and `SeatOverageConsentDialog` already do this correctly. We need to bring the two hooks and three remaining components into line.

## What We're Building

### Fix 1 — `useListingLimitCheck`: query live rate instead of using constant

Remove the `OVERAGE_PRICES` constant. Import `useOverageRate` and call it with `(entityType, resourceType)`. Return the live rate (or `null` while loading) as `overageRate` instead of `overageMockPrice`.

The interface field is renamed from `overageMockPrice: number` to `overageRate: number | null` to make the type honest — it can be `null` while the DB query is in flight.

`isLoading` gets extended to include the rate query's loading state so the hook remains consistent.

### Fix 2 — `useSeatLimitCheck`: query live rate instead of using constant

Remove `OVERAGE_PRICE_AGENCY_SEAT = 100`. Import and call `useOverageRate('agency', 'seat')`. Return live rate as `overageRate: number | null`.

Same `isLoading` extension and field rename.

### Fix 3 — Update consumers to use the new field name and type

Three components consume the renamed field:

1. **`ListingLimitBanner.tsx`**: Change `overageMockPrice` → `overageRate`. Add null guard — if `overageRate` is null (loading), don't render the price line. When available, render `₪{overageRate}`.

2. **`SeatSummaryCard.tsx`**: Change `overageMockPrice` → `overageRate`. Guard against null in the estimated overage calculation (`estOverage = overSeats * (overageRate ?? 0)`). The rate chip becomes `₪{overageRate ?? '—'}/extra seat/mo`.

3. **`CreateInviteDialog.tsx`**: Change `overageMockPrice` → `overageRate`. Guard against null in the overage warning text — show `₪{overageRate ?? '—'}/seat/month`.

## Files Summary

| File | Type | Change |
|---|---|---|
| `src/hooks/useListingLimitCheck.ts` | Edit | Remove `OVERAGE_PRICES` constant; call `useOverageRate`; rename `overageMockPrice` → `overageRate: number \| null`; extend `isLoading` |
| `src/hooks/useSeatLimitCheck.ts` | Edit | Remove `OVERAGE_PRICE_AGENCY_SEAT`; call `useOverageRate`; rename `overageMockPrice` → `overageRate: number \| null`; extend `isLoading` |
| `src/components/billing/ListingLimitBanner.tsx` | Edit | Use `overageRate`; null-guard the price display line |
| `src/components/agency/SeatSummaryCard.tsx` | Edit | Use `overageRate`; null-guard `estOverage` and the rate chip |
| `src/components/agency/CreateInviteDialog.tsx` | Edit | Use `overageRate`; null-guard the warning text |

**No DB migration needed.** The `overage_rates` table and `useOverageRate` hook already exist and are correct. This is a pure hook-wiring change.

## Technical Notes

- `useOverageRate` uses `staleTime` default (0) — calling it from two hooks doesn't double-fetch because React Query deduplicates by the `['overageRate', entityType, resourceType]` query key.
- `SeatOverageConsentDialog` and `UsageMeters` already use `useOverageRate` directly and are NOT changed — they are already correct.
- The field rename from `overageMockPrice` to `overageRate` is the only breaking change — all three consumers are updated in the same pass, so there are no dangling references.
- `null` while loading is the safe default: the price line either hides or shows `—` until the DB responds. This is better than showing a stale hardcoded number.
