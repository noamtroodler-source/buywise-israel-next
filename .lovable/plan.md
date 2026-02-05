
# Move Show More/Less Button to Bottom

## The Issue

Currently, the "Show more/less" toggle button is positioned **between** the visible questions (1-3) and the hidden questions (4-6). When you expand, the button stays in the middle instead of moving to the bottom.

## The Fix

Move the `CollapsibleTrigger` button to **after** the `CollapsibleContent`. This way:
- **Collapsed**: Button appears below question 3, says "Show 3 more questions"
- **Expanded**: Button appears below question 6, says "Show less"

The button will always be at the bottom of all visible questions.

## Visual Comparison

```text
CURRENT (Button in middle when expanded):
┌────────────────────────────────────┐
│  1. Question...                    │
│  2. Question...                    │
│  3. Question...                    │
├────────────────────────────────────┤
│      ▲ Show less  ← STUCK HERE     │
├────────────────────────────────────┤
│  4. Question...                    │
│  5. Question...                    │
│  6. Question...                    │
├────────────────────────────────────┤
│  Take your time...                 │
└────────────────────────────────────┘

FIXED (Button at bottom):
┌────────────────────────────────────┐
│  1. Question...                    │
│  2. Question...                    │
│  3. Question...                    │
│  4. Question...                    │
│  5. Question...                    │
│  6. Question...                    │
├────────────────────────────────────┤
│      ▲ Show less  ← MOVES HERE     │
├────────────────────────────────────┤
│  Take your time...                 │
└────────────────────────────────────┘
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/property/PropertyQuestionsToAsk.tsx` | Move `CollapsibleTrigger` after `CollapsibleContent` |
| `src/components/project/ProjectQuestionsToAsk.tsx` | Same change |

## Technical Change

Simply reorder the elements inside the `Collapsible` component:

```tsx
// Before:
<Collapsible>
  <CollapsibleTrigger>...</CollapsibleTrigger>  {/* Button first */}
  <CollapsibleContent>...</CollapsibleContent>
</Collapsible>

// After:
<Collapsible>
  <CollapsibleContent>...</CollapsibleContent>
  <CollapsibleTrigger>...</CollapsibleTrigger>  {/* Button last */}
</Collapsible>
```

This is a simple reordering - no logic changes needed.
