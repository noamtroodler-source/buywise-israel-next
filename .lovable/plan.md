

## Audit: Orphaned Data and Broken References

### Findings

After a thorough audit of every database table and its code references, here's what I found:

**1. Orphaned Database Tables (no code references, safe to DROP)**

| Table | Rows | Status |
|-------|------|--------|
| `city_market_cycles` | 8 | No code references anywhere — completely unused |
| `comparison_sessions` | 0 | Empty, no code references |
| `funnel_exit_feedback` | 0 | Empty, no code references |

**2. Broken "Purchase Tax Calculator" Links (tool removed but links remain)**

The Purchase Tax Calculator (`PurchaseTaxCalculator.tsx`, 521 lines) was removed from the Tools page registry but the component file still exists and **6 files still link to `?tool=purchasetax`**:
- `OlehBuyerGuide.tsx` — "Use the Purchase Tax Calculator" button
- `NewConstructionGuide.tsx` — "Purchase Tax Calculator" button
- `InvestmentPropertyGuide.tsx` — "Purchase Tax Calculator" link
- `SavedCalculatorResults.tsx` — saved results link
- `SavedCalculationsCompact.tsx` — saved results link
- `App.tsx` — redirect from `/tools/purchase-tax-calculator`

Clicking any of these links today leads to the Tools page with no calculator loaded (broken UX).

**3. Everything Else: CLEAN**

All 32 cities match the platform whitelist and are actively used. The `purchase_tax_brackets` table is actively used by TrueCost, PropertyCostBreakdown, ProjectCostBreakdown, and RentVsBuy calculators (it powers tax calculations across the site, not just the standalone tool). All other ~100 tables are referenced by active code.

---

### Proposed Changes

**A. Drop 3 orphaned tables** via database migration:
```sql
DROP TABLE IF EXISTS public.city_market_cycles;
DROP TABLE IF EXISTS public.comparison_sessions;
DROP TABLE IF EXISTS public.funnel_exit_feedback;
```

**B. Re-add Purchase Tax Calculator to the Tools page** (recommended over deleting it — it's a fully-built tool and multiple guides reference it):
- Add `purchasetax` entry back to `allTools` and `toolComponents` in `Tools.tsx`
- This fixes all 6 broken links at once with zero guide edits needed

**C. Alternative to B: Remove all broken links** — update the 6 files to redirect to `/tools?tool=totalcost` instead, and delete `PurchaseTaxCalculator.tsx`. This is more destructive and loses a useful standalone tool.

### Recommendation

Option B (re-add the calculator) is the cleanest fix — one small change in `Tools.tsx` fixes everything. The component is production-ready and the guides already reference it correctly.

