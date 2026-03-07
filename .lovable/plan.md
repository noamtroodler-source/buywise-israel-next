

## Plan: Currency-Aware Down Payment + Total Cost Calculator Nudge

### 1. Currency Toggle on Down Payment Input

**What:** Add a compact currency selector (USD/EUR/GBP) next to the "Down Payment Available" field. When a non-ILS currency is selected, show the converted ILS equivalent using live exchange rates.

**How:**
- In `AffordabilityCalculator.tsx`, add state for `downPaymentCurrency` (ILS, USD, EUR, GBP)
- Add a small `Select` dropdown inline with the down payment label (e.g., `₪ | $ | € | £`)
- The existing `exchangeRate` from `PreferencesContext` covers USD/ILS. For EUR and GBP, fetch from the `calculator_constants` table (or use reasonable fallbacks: EUR ~3.95, GBP ~4.60)
- When user picks USD/EUR/GBP: the input accepts foreign currency, and a helper line below shows "≈ ₪X at today's rate" — the internal `downPayment` state stays in ILS for all calculations
- Style: small inline currency pill/selector, consistent with existing input patterns (same height, muted colors)

### 2. Total Cost Calculator Nudge (right column)

**What:** After the results card in the right column, add a contextual link card that says something like: *"Your max budget is ₪X — see total cash needed including taxes & fees →"* linking to the Total Cost Calculator pre-filled with the max property price.

**How:**
- Add a compact nudge card below the existing result card in `rightColumn`, after the limiting factor alert
- Use `toolUrl(TOOL_IDS.TOTAL_COST, { price: calculations.maxPropertyPrice })` to generate the pre-filled link
- Style it as a subtle `div` with `bg-muted/50 border rounded-lg p-3` — not a full CTA card, more of an inline contextual hint with an arrow icon
- Only show when `hasInteracted && calculations.maxPropertyPrice > 0`

### Files to Edit

- **`src/components/tools/AffordabilityCalculator.tsx`** — both features (currency selector on down payment, nudge card in right column)

### Design Notes

- Currency selector: small inline `Select` or segmented button group (ILS/USD/EUR/GBP) — compact, not overwhelming
- Conversion helper text uses the same `text-xs text-muted-foreground` pattern already in use
- Nudge card uses existing card/muted styling, with `ArrowRight` icon — matches the bottom section link cards
- Exchange rate source: reuse existing `exchangeRate` from PreferencesContext for USD; add EUR/GBP constants or fallbacks

