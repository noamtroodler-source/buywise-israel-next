

## Move Mortgage Estimate Higher — Resale Listings Only

**Goal:** Make the estimated monthly mortgage payment a first-class line below the price on all for-sale property pages, visible to every visitor — not just those who've saved mortgage preferences.

---

### What Changes

**File: `src/components/property/PropertyQuickSummary.tsx`**

1. **Remove the conditional gate** on line 302 (`mortgageEstimate.hasCustomPreferences !== false`). The estimate will always show for non-rental listings, using sensible defaults (75% LTV, 4.5-6% rates, 25-year term) when the user hasn't personalized.

2. **Promote visual styling** — change the estimate from small muted helper text to a clear secondary price line:
   - Larger text (text-base instead of text-sm)
   - Prefix with "Est." for clarity
   - Semi-bold weight so it reads as a natural secondary line under the price

3. **Rename the CTA** from "Calculate Exact" to "Customize" — shorter, action-oriented, and links to the same mortgage calculator tool page.

4. **Keep the tooltip** with breakdown details (down payment %, rate range, term) and the personalization nudge for signed-out or non-customized users.

---

### Technical Details

- Only the condition on line 302 and the styling/text within lines 301-341 of `PropertyQuickSummary.tsx` are modified
- No new components, hooks, or database changes needed
- The `useMortgageEstimate` hook already returns default estimates when no preferences are saved — we're just removing the UI gate
- Rental listings (`for_rent`) remain unchanged — they already show their own "total monthly" line
- Project pages are not affected (per the agreed decision)

