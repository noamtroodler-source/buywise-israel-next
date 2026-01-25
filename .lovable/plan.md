

# Make Both CTA Buttons Match (Outline Style)

## The Change

Update the "Calculate True Costs" button from solid blue (`variant="default"`) to outline style (`variant="outline"`) so both buttons in the Comparison Summary section look consistent.

---

## File to Update

| File | Change |
|------|--------|
| `src/components/compare/CompareWinnerSummary.tsx` | Change button variant from `default` to `outline` |

---

## Code Change

**Line 79** - Update from:
```tsx
<Button asChild variant="default" className="flex-1">
```

To:
```tsx
<Button asChild variant="outline" className="flex-1">
```

---

## Result

Both buttons will have the same clean outline style with dark text on a light background, matching your desired look from the right screenshot.

