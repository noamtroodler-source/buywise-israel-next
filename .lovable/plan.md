
# Simplify Mortgage Forms: Add Commas + Remove Net/Gross

## Problems to Fix

1. **Numbers don't have commas** - When typing "500000", it stays as "500000" instead of showing "500,000"
2. **Net/Gross selector is overcomplicated** - There's a dropdown to choose between Net and Gross income, but you just want it to be "Net" only

---

## Solution

### 1. Replace Input with FormattedNumberInput

The project already has a `FormattedNumberInput` component that automatically adds commas as you type. Replace the raw `<Input type="number">` elements with this component.

**Where to fix:**
- Down Payment Amount input (when in ₪ or $ mode)
- Monthly Income input

### 2. Remove Net/Gross Dropdown

Remove the `<Select>` dropdown that lets users choose between Net and Gross. Simply hardcode the label to say "Net Monthly Income" and always save `income_type: 'net'`.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/onboarding/BuyerOnboarding.tsx` | Use `FormattedNumberInput` for amount inputs, remove income_type selector |
| `src/components/profile/MortgagePreferencesCard.tsx` | Same changes |

---

## Technical Changes

### BuyerOnboarding.tsx (Step 6)

**Down Payment Amount - Replace lines 704-713:**
```tsx
// Before
<Input
  type="number"
  value={downPaymentAmount ?? ''}
  onChange={(e) => setDownPaymentAmount(...)}
  className="pl-8"
  placeholder="1,500,000"
/>

// After
<FormattedNumberInput
  value={downPaymentAmount}
  onChange={setDownPaymentAmount}
  prefix={currencySymbol}
  placeholder={amountCurrency === 'USD' ? '400,000' : '1,500,000'}
/>
```

**Monthly Income - Replace lines 739-764:**
```tsx
// Before: Has Net/Gross dropdown
<div className="flex items-center justify-between">
  <Label className="text-sm">Monthly Income (optional)</Label>
  <Select value={mortgagePrefs.income_type} ...>
    <SelectItem value="net">Net</SelectItem>
    <SelectItem value="gross">Gross</SelectItem>
  </Select>
</div>
<Input type="number" ... />

// After: Simple label, formatted input
<div className="space-y-2">
  <Label className="text-sm">Net Monthly Income (optional)</Label>
  <FormattedNumberInput
    value={mortgagePrefs.monthly_income}
    onChange={(val) => setMortgagePrefs({ ...mortgagePrefs, monthly_income: val ?? null })}
    prefix="₪"
    placeholder="35,000"
  />
  <p className="text-xs text-muted-foreground">Helps calculate your max budget</p>
</div>
```

**Also update the default state and saved data:**
```tsx
// Hardcode income_type to 'net' in the initial state and save logic
income_type: 'net' as const
```

### MortgagePreferencesCard.tsx

Same pattern - replace the Input with FormattedNumberInput and remove the Net/Gross selector for monthly income.

---

## Visual Result

| Before | After |
|--------|-------|
| `500000` (no commas) | `500,000` (with commas) |
| "Monthly Income (optional)" with Net/Gross dropdown | "Net Monthly Income (optional)" (no dropdown) |

---

## Summary of Changes

1. **Import** `FormattedNumberInput` in both files
2. **Replace** down payment amount `<Input type="number">` with `<FormattedNumberInput>`
3. **Replace** monthly income `<Input type="number">` with `<FormattedNumberInput>`
4. **Remove** the Net/Gross `<Select>` dropdown entirely
5. **Update** label to "Net Monthly Income (optional)"
6. **Hardcode** `income_type: 'net'` in state and save logic
