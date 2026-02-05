
# Show 3 Questions with Expand/Collapse

## Overview

Update the "Questions to Ask" components to show only the first 3 questions by default, with a collapsible section to reveal the remaining questions.

## Current Behavior

- All 5-6 questions display immediately
- No way to collapse or hide questions

## New Behavior

- Show first 3 questions by default
- Display "Show X more questions" button below
- Clicking expands to reveal remaining questions
- Button changes to "Show less" when expanded
- Smooth animation for expand/collapse

## Visual Layout

```text
┌─────────────────────────────────────────────┐
│  Questions to Ask                     Copy  │
│  Tailored for this listing                  │
├─────────────────────────────────────────────┤
│  1. "First question..."        [Pricing]    │
│     Why it matters explanation              │
├─────────────────────────────────────────────┤
│  2. "Second question..."       [Legal]      │
│     Why it matters explanation              │
├─────────────────────────────────────────────┤
│  3. "Third question..."        [Building]   │
│     Why it matters explanation              │
├─────────────────────────────────────────────┤
│         ▼ Show 3 more questions             │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
│  (Hidden until expanded)                    │
│  4. "Fourth question..."                    │
│  5. "Fifth question..."                     │
│  6. "Sixth question..."                     │
└─────────────────────────────────────────────┘
```

## Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/property/PropertyQuestionsToAsk.tsx` | Add collapsed state, split questions into visible/hidden |
| `src/components/project/ProjectQuestionsToAsk.tsx` | Same changes as above |

### Technical Approach

1. Add `isExpanded` state (default: `false`)
2. Split questions array:
   - `visibleQuestions`: First 3 questions (always shown)
   - `hiddenQuestions`: Remaining questions (shown when expanded)
3. Use Radix `Collapsible` component for smooth animation
4. Add expand/collapse button with:
   - ChevronDown icon that rotates when expanded
   - Dynamic text: "Show X more questions" / "Show less"
5. Only show button if more than 3 questions exist

### Loading State Update

Update skeleton to show only 3 items instead of 5 to match collapsed state.

### Copy/Email Functionality

Keep unchanged - these actions still copy/email ALL questions regardless of collapsed state.
