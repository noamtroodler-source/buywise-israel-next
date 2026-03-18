

## Plan: Clean Up Sold Comps — Remove Mock Data, Keep Only Real

### Current State
The `sold_transactions` table has **26,551 records** from these sources:
- **15,247** — `govmap_gov_il` (real)
- **1,270** — `nadlan_gov_il` (real)
- **584** — `israel_tax_authority` (real)
- **10** — `nadlan.gov.il` (real)
- **9,440** — `mock_seed` (fake — must go)

The hook (`useNearbySoldComps.ts`) correctly queries the real `get_nearby_sold_comps` database function, but has a **fallback that generates fake mock comps** when no real results are found (lines 132-140). This means even after purging mock DB rows, properties without nearby real comps would still show fabricated data — violating your no-fabrication policy.

### Changes

1. **Purge 9,440 mock_seed rows** from `sold_transactions` table
   - `DELETE FROM sold_transactions WHERE source = 'mock_seed'`

2. **Remove the mock fallback** from `useNearbySoldComps.ts`
   - Delete the `seededRandom` and `generateMockComps` helper functions (~70 lines)
   - Remove the "if no results, generate mock" block — just return the real results (empty array if none found)

3. **No component changes needed** — `RecentNearbySales.tsx` already handles empty comps gracefully (the section simply won't render when there's no data)

### Result
- ~17,111 real government-sourced transactions remain
- Properties near those transactions show real comps
- Properties without nearby real data show nothing (honest) instead of fabricated numbers

