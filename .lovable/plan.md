

## Plan: Improve Buyer Type Dropdown Descriptions + Smart Oleh Follow-up

### What Changes

**1. Update dropdown descriptions** in `BuyerTypeInfoBanner.tsx` to be clearer qualifying statements:

Both `DEFAULT_BUYER_TYPE_OPTIONS` and `EXTENDED_BUYER_TYPE_OPTIONS` get updated descriptions:

| Option | Current Description | New Description |
|--------|-------------------|-----------------|
| First-Time Buyer | "Israeli resident, first property" | "No property in Israel, not a new Oleh" |
| Oleh Hadash | "New immigrant (within 7 years)" | "Made aliyah within 7 years" |
| Upgrader | "Selling existing home within 18 months" | "Selling current home within 18 months" |
| Investor | "Additional property in Israel" | "Already own property in Israel" |
| Non-Resident / Foreign | "Not an Israeli tax resident" | "Not an Israeli tax resident" |
| Corporate Buyer | "Purchasing as a company" | "Purchasing as a company" |
| Additional Property | "Already own property in Israel" | "Already own property in Israel" |

**2. Add conditional follow-up for Oleh Hadash** in `BuyerTypeInfoBanner.tsx`:

When a user selects "Oleh Hadash", show a compact inline follow-up below the radio group asking: **"Is this your first property in Israel?"** (Yes/No toggle or radio). This determines:
- **Yes** → `first_time` LTV (75%) with Oleh tax brackets
- **No** → `investor` LTV (50%) with Oleh tax brackets

Implementation: The component already passes `selectedType` and `onTypeChange` — we'll add local state for the Oleh sub-question. When "Oleh" is selected + "No" on first property, internally map to a combined state that the parent tool can use. Since the `BuyerCategory` type doesn't have an "oleh_additional" variant, we'll handle this by:
- Keeping `selectedType` as `'oleh'` (for tax calculation — correct)
- Adding an optional callback `onFirstPropertyChange?: (isFirst: boolean) => void` prop
- Each consuming tool can use this to override LTV from 75% → 50% when applicable

**3. Wire up the LTV override** in `AffordabilityCalculator.tsx` and other tools that use `extended` mode, so the Oleh + additional property combo correctly uses 50% LTV instead of 75%.

### Files to Change

1. **`src/components/tools/shared/BuyerTypeInfoBanner.tsx`** — Update descriptions, add Oleh follow-up UI, add `onFirstPropertyChange` prop
2. **`src/components/tools/AffordabilityCalculator.tsx`** — Wire up follow-up callback to override LTV
3. **`src/components/tools/TrueCostCalculator.tsx`** — Same wiring
4. **`src/components/tools/PurchaseTaxCalculator.tsx`** — Same wiring
5. **`src/components/tools/RentVsBuyCalculator.tsx`** — Same wiring
6. **`src/components/tools/NewConstructionCostCalculator.tsx`** — Same wiring
7. **`src/hooks/useAffordability.tsx`** — Accept optional `isOlehFirstProperty` override to adjust LTV

### Technical Detail

The follow-up UI will be a simple animated section that appears when `selectedType === 'oleh'` inside the popover, containing two small radio buttons: "Yes, first property" / "No, I own property." It collapses/hides when a different buyer type is selected. The state defaults to "Yes" (first property) to match current behavior, so existing users see no change unless they explicitly say no.

