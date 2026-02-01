

# Increase Hero Headline Line Spacing

## Problem
The current spacing between "Navigate Israel Real Estate" and "— With Clarity" is still too tight. The `mt-1 sm:mt-2` adds only 4-8px of margin, which isn't enough visual breathing room.

## Solution

**File:** `src/components/home/HeroSplit.tsx`

### Change (line 71):

```tsx
// Before
<span className="block mt-1 sm:mt-2">— With Clarity</span>

// After - increase margin for more visual separation
<span className="block mt-2 sm:mt-3">— With Clarity</span>
```

This increases the spacing:
- Mobile: `mt-2` = 0.5rem (8px) — up from 4px
- Desktop (sm+): `mt-3` = 0.75rem (12px) — up from 8px

If this still feels too tight, we could go even larger with `mt-3 sm:mt-4` (12px / 16px).

## Files Modified

| File | Change |
|------|--------|
| `src/components/home/HeroSplit.tsx` | Increase margin on second headline line from `mt-1 sm:mt-2` to `mt-2 sm:mt-3` |

