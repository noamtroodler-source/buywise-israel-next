

## Plan: Make Wizard Fields Conditional on Sale vs Rent

### Changes

**1. `StepFeatures.tsx`** — Hide rental-only fields when listing is for sale:
- Move **Furnished Status**, **Pets Policy**, and **Furniture Items** inside the existing `isRental` conditional block (alongside Lease Details)
- The "Property Terms" section header becomes "Rental Terms" and only shows for rentals
- Condition, A/C, Entry Date, Va'ad Bayit, Features checkboxes, and Featured Highlight remain for both

**2. `PropertyWizardContext.tsx`** — Update Step 2 (Features) validation:
- Change `baseValid` from requiring `furnished_status && pets_policy` always, to only requiring them when `listing_status === 'for_rent'`
- For sale: only require entry date validity
- For rent: require `furnished_status`, `pets_policy`, `lease_term`, and entry date

**3. `StepDescription.tsx`** — Dynamic copy:
- Change subtitle from "attract buyers" to "attract renters" when `listing_status === 'for_rent'`

**4. `StepReview.tsx`** — Conditional display:
- Change "Preview as Buyer" button to "Preview as Tenant" for rentals
- Only show Furnished Status, Pets Policy, and Lease Details badges in review when rental
- Hide `/month` label only shown for rent (already done)

### Summary of what shows when

| Field | Sale | Rent |
|-------|------|------|
| Featured Highlight | Yes | Yes |
| Condition | Yes | Yes |
| A/C | Yes | Yes |
| Entry Date | Yes | Yes |
| Va'ad Bayit | Yes | Yes |
| Features checkboxes | Yes | Yes |
| Lease Term, Subletting, Agent Fee | No | Yes |
| Furnished Status | No | Yes |
| Pets Policy | No | Yes |
| Furniture Items | No | Yes |

