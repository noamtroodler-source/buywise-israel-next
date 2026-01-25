
# Fix Mortgage Preferences Form Issues

## Problems to Solve

1. **Yellow toggle color** - The pressed toggle button shows a yellow background (the accent color) instead of blue
2. **Double percent sign** - Toggle shows both a Percent icon and "%" text, resulting in "% %"
3. **USD/Shekel option** - Users cannot choose to enter amounts in USD; it's hardcoded to shekels

---

## Solution Approach

### 1. Fix Toggle Color (Yellow to Blue)

The Toggle component uses `data-[state=on]:bg-accent` by default, which is yellow. Override this in the forms to use `data-[state=on]:bg-primary data-[state=on]:text-primary-foreground` for blue styling.

**Affected files:**
- `src/components/onboarding/BuyerOnboarding.tsx`
- `src/components/profile/MortgagePreferencesCard.tsx`

### 2. Remove Double Percent Sign

Currently the toggle renders:
```tsx
<Percent className="h-3 w-3 mr-1" />
%
```

Fix by removing the icon and keeping only the single `%` text:
```tsx
%
```

### 3. Add Currency Selection for Amount Mode

When user switches to "Amount" mode for down payment, show a currency selector (₪/$ toggle) that uses the existing `useCurrencySymbol()` hook. This adds a third toggle option for currency when in amount mode.

**Implementation:**
- Add currency state that defaults to the global preference
- Show currency symbol dynamically in input prefix
- Store amounts in ILS internally (convert if entered in USD)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/onboarding/BuyerOnboarding.tsx` | Fix toggle styling, remove double %, add currency option |
| `src/components/profile/MortgagePreferencesCard.tsx` | Same fixes as above |

---

## Technical Implementation

### Toggle Button Updates

```tsx
// Before
<Toggle
  size="sm"
  pressed={downPaymentMode === 'percent'}
  onPressedChange={() => setDownPaymentMode('percent')}
  className="h-7 px-2 text-xs"
>
  <Percent className="h-3 w-3 mr-1" />
  %
</Toggle>

// After
<Toggle
  size="sm"
  pressed={downPaymentMode === 'percent'}
  onPressedChange={() => setDownPaymentMode('percent')}
  className="h-7 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
>
  %
</Toggle>
```

### Amount Input with Currency Toggle

```tsx
// Add currency state
const [amountCurrency, setAmountCurrency] = useState<'ILS' | 'USD'>('ILS');
const currencySymbol = amountCurrency === 'USD' ? '$' : '₪';

// Render toggle group for percent/amount with currency options
<div className="flex gap-1">
  <Toggle pressed={downPaymentMode === 'percent'} ...>
    %
  </Toggle>
  <Toggle pressed={downPaymentMode === 'amount' && amountCurrency === 'ILS'} ...>
    ₪
  </Toggle>
  <Toggle pressed={downPaymentMode === 'amount' && amountCurrency === 'USD'} ...>
    $
  </Toggle>
</div>

// Input prefix updates dynamically
<span className="...">{currencySymbol}</span>
```

---

## User Experience

After the fix:
- Toggle buttons will have a **blue background** when selected (matching brand primary color)
- The percent toggle will show only a single **%** symbol
- Users can choose between **%**, **₪**, or **$** for entering down payment
- Input prefix will update to show the correct currency symbol
