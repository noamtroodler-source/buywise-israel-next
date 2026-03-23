

# Phase 2: Significant Fixes + Transparency Labels

Phase 1 (critical calculation fixes and city data) is complete. This phase covers the remaining audit items: stale "18 months" upgrader references, glossary remnants, TAMA 38 tooltip accuracy, and the Phase 4 transparency/labeling work.

---

## Group A: Upgrader Timeline 18 → 24 Months (5 files)

The audit confirmed Amendment 76 extended the upgrader sell-deadline to 24 months. Phase 1 updated the comment in `purchaseTax.ts` line 51 but missed the hardcoded "18 months" text in these locations:

| File | Line | Current | Fix |
|------|------|---------|-----|
| `purchaseTax.ts` | 9 | `within 18 months` | `within 24 months` |
| `purchaseTax.ts` | 196 | `deadline.setMonth(+18)` | `+24` |
| `BuyerTypeInfoBanner.tsx` | 36 | `within 18 months` | `within 24 months` |
| `buyerProfile.ts` | 108, 114, 117, 120 | All say "18 months" | Change to "24 months" |
| `PurchaseTaxGuide.tsx` | 142, 410 | `within 18 months` | `within 24 months` |
| `ask-buywise/index.ts` | 142 | `within 18 months` | `within 24 months` |

## Group B: Remaining Glossary / Name Fixes (3 files)

| File | Line | Fix |
|------|------|-----|
| `BuyingInIsraelGuide.tsx` | 116 | "Israel Land Authority" → "RMI (Rashut Mekarkei Yisrael)" |
| `ListingsGuide.tsx` | 125 | "leasehold (Minhal)" → "leasehold (RMI/Minhal)" — acceptable as "Minhal" is colloquially used |
| `decode-listing/index.ts` | 135 | "Minhal/Taboo Rashut" → "RMI (Minhal)" |

## Group C: TAMA 38 Tooltip Accuracy (2 files)

The program ended Aug 2024 in most cities. Tooltips still say "may require seismic retrofitting (TAMA 38 eligibility)" without the expiration caveat.

| File | Line | Fix |
|------|------|-----|
| `ListingDecoderTool.tsx` | 408 | Add: "Note: TAMA 38 ended Aug 2024 in most areas" |
| `PropertyQuickSummary.tsx` | 557 | Same caveat |

## Group D: Anglo Presence — Editorial Label (1 file)

Add a small "Editorial assessment" note to `AngloFriendlinessScore.tsx` to comply with the audit's requirement that Anglo presence be labeled as editorial rather than government-sourced data.

## Group E: Vaad Bayit & Arnona Estimate Labels (2 files)

Where city-level Vaad Bayit or Arnona averages are displayed, add "(est.)" suffix or tooltip noting these are BuyWise estimates, not municipal quotes. Key locations:
- `TotalCostCalculator.tsx` — where `average_vaad_bayit` fallback is used
- `CityMarketSnapshot.tsx` — if displaying arnona/vaad

## Group F: Exchange Rate Refresh (database)

Invoke the existing `update-exchange-rate` edge function to refresh the stale DB value to the current market rate.

## Group G: Database Updates

- Update `glossary_terms`: Add TAMA 38 expiration note if not already done in Phase 1
- Update `calculator_constants`: Ensure upgrader period constant is 24

---

## Execution Order

1. Code fixes: upgrader 18→24 across all files (Group A)
2. Code fixes: glossary name corrections (Group B)
3. Code fixes: TAMA 38 tooltips (Group C)
4. Code fixes: Anglo editorial label (Group D)
5. Code fixes: estimate labels (Group E)
6. Database: exchange rate refresh (Group F)
7. Database: glossary/constants updates (Group G)

