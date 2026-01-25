

# Match Both CTA Buttons (Text + Arrow Only)

## The Change

Update the "Calculate True Costs" button to match the "Run Mortgage Numbers" button exactly:
- **Remove** the Calculator icon from the left
- **Add** an ArrowRight icon to the right
- Both buttons will have: `Text → Arrow` format with no leading icons

---

## File to Update

| File | Change |
|------|--------|
| `src/components/compare/CompareWinnerSummary.tsx` | Update "Calculate True Costs" button content |

---

## Code Change

**Lines 79-84** - Update from:
```tsx
<Button asChild variant="outline" className="flex-1">
  <Link to="/tools?tool=totalcost">
    <Calculator className="h-4 w-4 mr-2" />
    Calculate True Costs
  </Link>
</Button>
```

To:
```tsx
<Button asChild variant="outline" className="flex-1">
  <Link to="/tools?tool=totalcost">
    Calculate True Costs
    <ArrowRight className="h-4 w-4 ml-2" />
  </Link>
</Button>
```

---

## Result

Both buttons will look identical:

| Before | After |
|--------|-------|
| `🧮 Calculate True Costs` | `Calculate True Costs →` |
| `Run Mortgage Numbers →` | `Run Mortgage Numbers →` |

Clean, consistent styling with matching text + arrow format.

