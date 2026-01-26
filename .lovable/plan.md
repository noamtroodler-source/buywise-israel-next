
# Fix Agent Avatar Images on Agency Page

## Problem

The agent profile pictures on the agency page look "weird" because they appear stretched or distorted. This happens because the `AvatarImage` component is missing the `object-cover` CSS class that ensures images fill the circular avatar without distortion.

## Root Cause

Looking at line 256 in `src/pages/AgencyDetail.tsx`:

```tsx
<AvatarImage src={agent.avatar_url || undefined} alt={agent.name} />
```

This is missing `className="object-cover"` which other avatar implementations in the codebase have (e.g., `ProjectAgentCard.tsx` and `AgentContactSection.tsx`).

Without `object-cover`:
- Images that aren't perfectly square get stretched to fill the circle
- Aspect ratios are not preserved, causing distortion

## Solution

Add `className="object-cover"` to the `AvatarImage` component. This is a single-line change that doesn't affect the layout or format of the page at all.

---

## File to Modify

### `src/pages/AgencyDetail.tsx`

**Line 256** - Add `object-cover` class:

```text
Before:
<AvatarImage src={agent.avatar_url || undefined} alt={agent.name} />

After:
<AvatarImage src={agent.avatar_url || undefined} alt={agent.name} className="object-cover" />
```

---

## Visual Result

```text
Before:                          After:
┌──────────────────┐            ┌──────────────────┐
│   (  stretched   )│            │    (  proper   ) │
│   (   image      )│     →      │    (  circle   ) │
│   (   weird!     )│            │    (  crop!    ) │
│     Agent Name    │            │     Agent Name   │
└──────────────────┘            └──────────────────┘
```

The `object-cover` CSS property ensures the image covers the entire avatar circle while maintaining its aspect ratio, cropping from the center if needed. This matches how avatars are displayed elsewhere in the app.

---

## Summary

| File | Change |
|------|--------|
| `src/pages/AgencyDetail.tsx` | Add `className="object-cover"` to AvatarImage on line 256 |

This is a minimal fix that keeps the layout and format of the agency page exactly the same while fixing the distorted agent photos.
