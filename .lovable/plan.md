
# Fix Hero Headline Width Overflow

## Problem
The headline "Navigate Israel Real Estate" is extending past the search box width because:
1. Large font size at `lg:text-5xl` (48px) combined with `whitespace-nowrap` creates a very wide line
2. The parent container is constrained to `max-w-xl` (576px)
3. At large viewport widths, the headline text overflows this constraint

## Solution Strategy

**Best Practice Approach:** Rather than fighting the typography, we should adjust the headline sizing to naturally fit within the same visual width as the search box. There are two strategic options:

### Option A: Reduce Maximum Font Size (Recommended)
Scale down the largest font size so the headline naturally fits within the container width. This is the cleanest solution that maintains the design intent.

**File:** `src/components/home/HeroSplit.tsx`

**Current (line 70):**
```tsx
<h1 className="text-[1.35rem] sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">
```

**New:**
```tsx
<h1 className="text-[1.35rem] sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-white leading-[1.1] tracking-tight">
```

This reduces `lg:text-5xl` (48px / 3rem) to `lg:text-[2.75rem]` (44px), which should fit "Navigate Israel Real Estate" within the `max-w-xl` container while still being impactful.

### Option B: Allow Strategic Line Breaking (Alternative)
Remove `whitespace-nowrap` and instead let the text wrap naturally but control where it breaks. This would mean accepting a 3-line headline on some viewports but with cleaner containment.

---

## Recommended Implementation: Option A with Refinement

**Changes to `src/components/home/HeroSplit.tsx`:**

### 1. Adjust font sizing (line 70)
```tsx
// Before
<h1 className="text-[1.35rem] sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">

// After - reduce lg size to fit within container
<h1 className="text-[1.35rem] sm:text-3xl md:text-[2.25rem] lg:text-[2.75rem] font-bold text-white leading-[1.1] tracking-tight">
```

This creates a smoother size progression:
- Mobile: 1.35rem (21.6px)
- `sm`: 1.875rem (30px) - text-3xl
- `md`: 2.25rem (36px) - custom
- `lg`: 2.75rem (44px) - custom (down from 48px)

### 2. Remove whitespace-nowrap (safer containment)
Since we're reducing the font size to fit, we can also remove the `whitespace-nowrap` as a safety measure. If the text does need to wrap at edge cases, it will do so gracefully:

```tsx
// Before
<span className="inline sm:whitespace-nowrap">Navigate <span className="text-primary">Israel</span> Real Estate</span>

// After - remove the wrapper span entirely, just use the text inline
Navigate <span className="text-primary">Israel</span> Real Estate
```

---

## Technical Rationale

**Why reduce font size instead of widening the container?**
- The `max-w-xl` container width is intentional - it keeps the search box at a comfortable, scannable width
- Widening would make the search box too stretched on large screens
- A slightly smaller headline still has strong visual impact while respecting layout constraints

**Why remove whitespace-nowrap?**
- With the reduced font size, the text should fit naturally
- If edge cases occur, natural wrapping is better than overflow
- Reduces CSS complexity

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/home/HeroSplit.tsx` | Reduce headline font sizes and remove whitespace-nowrap wrapper |

---

## Visual Result
- Headline will align with or be slightly shorter than the search box width
- Maintains strong visual hierarchy
- Clean, professional appearance at all viewport widths
