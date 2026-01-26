

## Add Visual Distinction Between "What We Believe" and "Pro-Agent" Sections

### The Problem
Both the "What We Believe" section (with the 4 principle cards) and the "Pro-Agent" section directly below it share the same plain white background, causing them to visually blend together.

### Solution
Add a subtle background treatment to the "Pro-Agent" section to create visual separation while maintaining design consistency with the rest of the page.

### Recommended Approach
Apply a `bg-muted/30` background to the "Pro-Agent" section. This matches the styling already used in the "What BuyWise Actually Is" section, creating a consistent visual rhythm throughout the page where sections alternate between plain and tinted backgrounds.

### Changes Required

**File: `src/pages/Principles.tsx`**

Update the Pro-Agent section (line 248) to add a background:

```tsx
// Before
<section className="py-16 md:py-20">

// After  
<section className="py-16 md:py-20 bg-muted/30">
```

### Visual Result
The page will have this alternating pattern:
1. Hero - gradient background
2. "If This Sounds Familiar" - plain
3. "What BuyWise Actually Is" - muted background
4. "What We Believe" - plain
5. "Pro-Agent" - muted background (the change)
6. "The Promise" - gradient background
7. CTA - plain

This creates a clear visual rhythm and helps distinguish each section from its neighbors.

