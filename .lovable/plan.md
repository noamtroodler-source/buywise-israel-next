

# Add Currency Toggle to Monthly Income Field

## Problem

The "Net Monthly Income" field always shows ₪ (shekel) as the prefix, but users who select $ for their down payment should be able to enter their income in USD as well for consistency.

---

## Solution

Add a ₪ / $ toggle for the monthly income field, similar to how it works for the down payment amount. This will use a separate state variable for income currency to allow independent selection.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/onboarding/BuyerOnboarding.tsx` | Add income currency state + toggle for monthly income |
| `src/components/profile/MortgagePreferencesCard.tsx` | Add income currency state + toggle for monthly income |

---

## Technical Implementation

### BuyerOnboarding.tsx

**Add new state variable (near line 57):**
```tsx
const [incomeCurrency, setIncomeCurrency] = useState<'ILS' | 'USD'>('ILS');
const incomeCurrencySymbol = incomeCurrency === 'USD' ? '$' : '₪';
```

**Update Monthly Income section (lines 734-744):**

Replace the simple label with a label + toggle row:

```tsx
{/* Monthly Income */}
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label className="text-sm">Net Monthly Income (optional)</Label>
    <div className="flex gap-1">
      <Toggle
        size="sm"
        pressed={incomeCurrency === 'ILS'}
        onPressedChange={() => setIncomeCurrency('ILS')}
        className="h-7 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        ₪
      </Toggle>
      <Toggle
        size="sm"
        pressed={incomeCurrency === 'USD'}
        onPressedChange={() => setIncomeCurrency('USD')}
        className="h-7 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        $
      </Toggle>
    </div>
  </div>
  <FormattedNumberInput
    value={mortgagePrefs.monthly_income}
    onChange={(val) => setMortgagePrefs({ ...mortgagePrefs, monthly_income: val ?? null, income_type: 'net' })}
    prefix={incomeCurrencySymbol}
    placeholder={incomeCurrency === 'USD' ? '8,000' : '35,000'}
  />
  <p className="text-xs text-muted-foreground">Helps calculate your max budget</p>
</div>
```

### MortgagePreferencesCard.tsx

**Add new state variable (near line 48):**
```tsx
const [incomeCurrency, setIncomeCurrency] = useState<'ILS' | 'USD'>('ILS');
const incomeCurrencySymbol = incomeCurrency === 'USD' ? '$' : '₪';
```

**Update Monthly Income section (lines 246-268):**

Same pattern - add toggle row for ₪ / $:

```tsx
{/* Monthly Income */}
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label className="flex items-center gap-1">
      Net Monthly Income
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>Used to calculate your max affordable property price based on Bank of Israel's 40% payment-to-income guideline.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Label>
    <div className="flex gap-1">
      <Toggle
        size="sm"
        pressed={incomeCurrency === 'ILS'}
        onPressedChange={() => setIncomeCurrency('ILS')}
        className="h-7 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        ₪
      </Toggle>
      <Toggle
        size="sm"
        pressed={incomeCurrency === 'USD'}
        onPressedChange={() => setIncomeCurrency('USD')}
        className="h-7 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        $
      </Toggle>
    </div>
  </div>
  <FormattedNumberInput
    value={formData.monthly_income}
    onChange={(val) => setFormData({ ...formData, monthly_income: val ?? null, income_type: 'net' })}
    prefix={incomeCurrencySymbol}
    placeholder={incomeCurrency === 'USD' ? '8,000' : '35,000'}
  />
  <p className="text-xs text-muted-foreground">Optional - helps calculate your budget</p>
</div>
```

---

## Visual Result

| Before | After |
|--------|-------|
| "Net Monthly Income (optional)" with hardcoded ₪ | "Net Monthly Income (optional)" with ₪ / $ toggles |
| Always shows ₪ prefix | Dynamically shows ₪ or $ based on selection |
| Placeholder: "35,000" | Placeholder: "35,000" (ILS) or "8,000" (USD) |

---

## Summary

1. Add `incomeCurrency` state variable in both files
2. Add ₪ / $ toggle buttons next to the monthly income label
3. Update `FormattedNumberInput` prefix to use dynamic currency symbol
4. Update placeholder to show appropriate example based on currency

