

# Remove Arnona Discount Text from City Market Overview

## What's Being Removed

The blue text under the Arnona slider that shows discount information like:
- "40% 75-89% Disability discount"
- "90% New Immigrant discount (on first 100m²)"
- "Oleh arnona discount: Years 1-2 only"
- Comparison text like "15% above national average"

## Files to Modify

### 1. `src/components/city/MarketOverviewCards.tsx`

**Remove lines 320-340** - The entire "Discount or comparison message" block:

```tsx
{/* Discount or comparison message */}
{arnonaEstimate.discountPercent > 0 ? (
  <p className="text-sm text-primary font-medium">
    {arnonaEstimate.discountPercent}% {arnonaEstimate.discountType} discount
    {arnonaEstimate.areaLimitApplied && ` (on first ${arnonaEstimate.areaLimitSqm}m²)`}
  </p>
) : arnonaEstimate.olehStatusChecked && ... ? (
  <p className="text-sm text-muted-foreground">
    Oleh arnona discount: Years 1-2 only
  </p>
) : (
  <p className="text-sm text-muted-foreground">
    {/* National average comparison text */}
  </p>
)}
```

This entire conditional block will be removed.

---

### 2. `src/components/city/CityArnonaCard.tsx`

**Remove lines 113-124** - The discount/comparison row:

```tsx
<div className="flex items-center justify-between text-sm">
  <span className="text-muted-foreground">Rate: ₪{rate}/m²/year</span>
  {arnonaEstimate.discountPercent > 0 ? (
    <span className="text-primary font-medium">
      {arnonaEstimate.discountPercent}% discount
    </span>
  ) : (
    <span className="...">
      +15% vs avg
    </span>
  )}
</div>
```

This entire row will be removed.

---

## What Stays

- The "Personalized" badge with the user icon (shows that their profile was considered)
- The Arnona monthly/annual amounts
- The apartment size slider
- All functionality continues to work; only the descriptive text is removed

## Result

The Arnona cards will show:
- The ₪ amount with optional "Personalized" badge
- The slider to adjust apartment size
- No additional text below explaining discounts or comparisons

