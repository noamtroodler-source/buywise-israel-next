
# Fix Hero Headline Line Breaking

## Problem
The headline "Navigate Israel Real Estate" is wrapping awkwardly at medium viewport widths, causing "Estate" to appear on its own line (3 lines total instead of 2 clean lines).

**Current (broken):**
```
Navigate Israel Real
Estate
— With Clarity
```

**Desired (from reference):**
```
Navigate Israel Real Estate
— With Clarity
```

## Solution

**File:** `src/components/home/HeroSplit.tsx`

### Changes to line 70-73:

```tsx
{/* Headline */}
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">
  <span className="whitespace-nowrap">Navigate <span className="text-primary">Israel</span> Real Estate</span>
  <span className="block">— With Clarity</span>
</h1>
```

### What this does:
1. **Wraps the first line in `whitespace-nowrap`** - This prevents "Navigate Israel Real Estate" from breaking mid-phrase. The entire first line will either fit or the whole thing will wrap to a smaller font size.

2. **Keeps `span className="block"` for the second line** - This ensures "— With Clarity" always appears on its own line below.

### Alternative approach (if viewport is too narrow):
If `whitespace-nowrap` causes overflow on very small screens, we could instead use a responsive approach:

```tsx
<h1 className="text-[1.4rem] sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">
  Navigate <span className="text-primary">Israel</span> Real Estate
  <span className="block">— With Clarity</span>
</h1>
```

This slightly reduces the base font size (from `text-2xl` / 1.5rem to `text-[1.4rem]`) so the phrase fits on one line at mobile widths.

### Recommended: Combination approach
Use `whitespace-nowrap` for the first phrase to ensure it never breaks awkwardly, combined with a slightly adjusted mobile font size to ensure it fits:

```tsx
<h1 className="text-[1.35rem] sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">
  <span className="inline sm:whitespace-nowrap">Navigate <span className="text-primary">Israel</span> Real Estate</span>
  <span className="block">— With Clarity</span>
</h1>
```

- On mobile (`sm` and below): Allows natural wrapping but with smaller text
- On `sm` and up: `whitespace-nowrap` keeps "Navigate Israel Real Estate" on one line

## Files Modified

| File | Change |
|------|--------|
| `src/components/home/HeroSplit.tsx` | Add `whitespace-nowrap` wrapper and adjust mobile font size |
