

## Delete "What We Do / What We Don't Do" Section

### Overview
Remove the entire section from the Principles page that displays "What We Do" and "What We Don't Do" in a two-column card layout.

### Changes Required

**File: `src/pages/Principles.tsx`**

1. **Remove the data arrays** (lines 83-97):
   - Delete the `whatWeDo` array
   - Delete the `whatWeDontDo` array

2. **Remove the JSX section** (lines 282-332):
   - Delete the entire `{/* What We Do / Don't Do */}` section including the background container, grid layout, and both cards

### Result
The page will flow directly from the "What We Believe" (Core Principles) section to the "Pro-Agent" section, removing the checklist-style cards entirely.

