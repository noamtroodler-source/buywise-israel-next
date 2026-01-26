

# Update AI Feedback Section to BuyWise Israel Brand Standards

## Current Issue

The AI feedback section in the property description step uses amber/orange styling for "Suggestions for Improvement" which is off-brand. Per the platform's color palette standards, red, orange, green, and emerald semantic colors should be replaced with primary blue tints.

**Current (off-brand):**
- `bg-amber-500/5` background
- `text-amber-500` icon (AlertTriangle)
- Orange warning triangle icon

**Brand standard:**
- `bg-primary/5` background  
- `text-primary` icon
- Blue-branded icons (Info, Lightbulb, or CheckCircle2)

---

## File to Modify

### `src/components/agent/wizard/steps/StepDescription.tsx`

**Changes:**

1. **Replace AlertTriangle icon with Info icon** (line 6)
   - Remove `AlertTriangle` from imports
   - Keep `Info` (already imported)

2. **Update feedback container background** (line 182)
   - Change from: `bg-amber-500/5` 
   - Change to: `bg-primary/5` (same as success state — unified styling)

3. **Update icon for suggestions** (lines 184-188)
   - Replace `AlertTriangle` with `Info` icon
   - Change `text-amber-500` to `text-primary`

4. **Update header text styling** (line 190-191)
   - Keep the text content but ensure consistent styling

---

## Visual Result

**Before:**
```
┌─────────────────────────────────────┐
│ ⚠️ Suggestions for Improvement      │  ← Orange warning triangle
│   (amber background)                │
└─────────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────────┐
│ ℹ️ Suggestions for Improvement      │  ← Blue info icon
│   (primary/5 background)            │
└─────────────────────────────────────┘
```

Both states (has issues / looking good) will now use the same blue-branded styling, matching the "Writing Tips" card and other informational components across the platform. This creates visual consistency and removes the alarming amber color that feels out of place.

---

## Code Changes Summary

| Line | Current | Updated |
|------|---------|---------|
| 6 | `AlertTriangle` import | Remove (unused) |
| 182 | `bg-amber-500/5` | `bg-primary/5` |
| 185 | `<AlertTriangle className="h-5 w-5 text-amber-500 ...` | `<Info className="h-5 w-5 text-primary ...` |

