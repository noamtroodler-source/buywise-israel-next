

## Plan: Smarter Save Prompt Trigger Across All Calculators

### What changes

**1. New hook: `src/hooks/useSavePromptTrigger.ts`**

Reusable hook that encapsulates the trigger logic:
- Caller calls `trackChange()` each time a field is modified
- Hook internally counts distinct changes. When count ≥ 2 AND user is not logged in, starts a 5-second idle timer
- Each new `trackChange()` call resets the timer (waits for user to stop adjusting)
- After 5 seconds of inactivity with ≥ 2 changes, sets `showPrompt = true`
- Exposes `{ showPrompt, dismissPrompt, trackChange }`
- Uses `useAuth` internally to check login state

**2. Update AffordabilityCalculator** — Replace the existing `hasInteracted` + 3-second timer with the new hook. Call `trackChange()` in the `useEffect` that watches input changes.

**3. Add SaveResultsPrompt + hook to 7 other calculators:**

| Calculator | Name shown | Result summary |
|---|---|---|
| MortgageCalculator | "mortgage" | Monthly payment amount |
| TrueCostCalculator | "true cost" | Total cost figure |
| PurchaseTaxCalculator | "purchase tax" | Tax amount |
| InvestmentROICalculator | "investment" | Yield / ROI % |
| RenovationCostEstimator | "renovation" | Total renovation cost |
| NewConstructionCostCalculator | "new construction" | Total cost with linkage |
| RentVsBuyCalculator | "rent vs buy" | Recommendation verdict |

For each: import the hook + `SaveResultsPrompt`, call `trackChange()` alongside existing state setters, render the prompt at the bottom of the component.

### Files touched
- **New:** `src/hooks/useSavePromptTrigger.ts`
- **Modified (8):** All calculator files listed above

