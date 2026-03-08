

## Plan: Three Tweaks to Polish the True Cost Calculator Output

### 1. Add midpoint estimate below the hero range
Below the range line (`$328k – $419k`), add a subtle "~$374k most likely" midpoint anchor to help users process the wide spread.

**File:** `src/components/tools/TrueCostCalculator.tsx` (~line 771)
- Calculate midpoint: `Math.round((totalCashNeededMin + totalCashNeededMax) / 2)`
- Add a line: `<p className="text-xs text-muted-foreground text-center mt-1">~{formatPrice(midpoint)} most likely</p>` between the hero value and the "+X above list price" line

### 2. Refine "Fees & Registration" label
**File:** `src/components/tools/TrueCostCalculator.tsx` (~line 801)
- When mortgage is ON, change label from "Fees & Registration" → "Fees & Gov."
- Add sublabel `incl. mortgage fees` below the value (same `text-[10px]` style as Lawyer/Agent sublabels)

### 3. Tighten Monthly Costs section
**File:** `src/components/tools/TrueCostCalculator.tsx` (~lines 856-872)
- Move the description text ("Arnona, Va'ad Bayit, Insurance") into a tooltip on an info icon instead of inline text
- This makes the monthly section more compact and visually consistent with the stats grid cells above

All changes are in a single file, purely cosmetic/UX — no calculation logic changes.

