
# Update FinalCTA Button to Link to Guides

## Summary

Change the secondary CTA button in the FinalCTA component from "Try Our Tools" (linking to /tools) to "Browse Guides" (linking to /guides).

---

## Current vs New

| Element | Current | New |
|---------|---------|-----|
| Text | Try Our Tools | Browse Guides |
| Link | /tools | /guides |
| Icon | Wrench | BookOpen |

---

## Implementation

**File:** `src/components/home/FinalCTA.tsx`

### Changes Required

1. **Update import** - Replace `Wrench` with `BookOpen` from lucide-react

2. **Update button** - Change link destination, icon, and text

```tsx
// Before
import { ArrowRight, Search, Wrench } from 'lucide-react';
...
<Button variant="outline" asChild className="gap-2">
  <Link to="/tools">
    <Wrench className="h-4 w-4" />
    Try Our Tools
  </Link>
</Button>

// After
import { ArrowRight, Search, BookOpen } from 'lucide-react';
...
<Button variant="outline" asChild className="gap-2">
  <Link to="/guides">
    <BookOpen className="h-4 w-4" />
    Browse Guides
  </Link>
</Button>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/home/FinalCTA.tsx` | Update icon import, link destination, and button text |
