

# Phase 3: Remaining Minor Fixes

Phases 1-2 addressed all critical and significant issues. This phase covers the remaining minor items found during a sweep of the codebase.

---

## Fix 1: Capital Gains — Holding Period 18 → 24 Months

`src/lib/calculations/capitalGains.ts` line 29: `holdingPeriodMonths: 18` → `24`, and update comment on line 25 from "2024" to "2025/2026". This aligns with the Amendment 76 change already applied everywhere else.

## Fix 2: Remaining "Minhal" Without "RMI" Prefix (2 files)

These were missed in Phase 2's glossary pass:

| File | Line | Current | Fix |
|------|------|---------|-----|
| `BuyingInIsraelGuide.tsx` | 360 | "Minhal (leasehold)" | "RMI/Minhal (leasehold)" |
| `BuyingPropertyGuide.tsx` | 90 | "Tabu or Minhal" | "Tabu or RMI (Minhal)" |
| `BuyingPropertyGuide.tsx` | 165 | "Tabu, Minhal, or a housing company" | "Tabu, RMI (Minhal), or a housing company" |
| `BuyingPropertyGuide.tsx` | 184 | "Tabu, Minhal, housing company" | "Tabu, RMI/Minhal, housing company" |

## Fix 3: TAMA 38 Caveat in Editorial Insights (1 file)

`src/components/city/cityRoomSizeInsights.ts` — Three cities (Tel Aviv line 34, Herzliya line 51, Ramat Gan line 95) mention "TAMA 38" as if it's currently available without noting the program ended. Add "(where still active)" or "urban renewal" as a replacement since this is editorial prose, not tooltip content.

## Fix 4: cityInsights.ts "18 months ago" (No change needed)

Line 43 says "there was 18 months ago" — this is a relative editorial comparison ("compared to 18 months ago"), not a legal deadline reference. No fix required.

---

## Execution Order

1. Update `capitalGains.ts` holding period and comment
2. Fix remaining "Minhal" references in guides
3. Update TAMA 38 editorial references in cityRoomSizeInsights

