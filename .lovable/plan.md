
# Make Developer Name & Logo Clickable

## Problem

In the `ProjectDeveloperCard` component, users expect to click on the developer's name or logo to visit their profile page, but currently only the "View All Projects" button at the bottom is a link. The name and logo are static elements.

## Solution

Wrap the developer logo and name in a `Link` component that navigates to `/developers/{slug}`.

---

## File to Modify

### `src/components/project/ProjectDeveloperCard.tsx`

**Changes:**

1. **Make the logo clickable** (lines 26-37)
   - Wrap the logo image and fallback icon in a `Link` to `/developers/${developer.slug}`
   - Add hover cursor styling

2. **Make the developer name clickable** (line 40)
   - Wrap `<h3>{developer.name}</h3>` in a `Link`
   - Add hover styling (underline or color change) for visual feedback

---

## Visual Result

```text
Before:
┌─────────────────────────────────────────┐
│ [Logo]  Blue Square Real Estate ✓       │  ← Not clickable
│         72 Projects · Since 2004        │
│                                         │
│ [Call]  [Email]                         │
│ Visit Website                      →    │
│ View All Blue Square Projects      →    │  ← Only this is clickable
└─────────────────────────────────────────┘

After:
┌─────────────────────────────────────────┐
│ [Logo]  Blue Square Real Estate ✓       │  ← Logo & name now clickable!
│  ↑       ↑ hover underline              │
│ clickable                               │
│ [Call]  [Email]                         │
│ Visit Website                      →    │
│ View All Blue Square Projects      →    │
└─────────────────────────────────────────┘
```

---

## Code Changes

**Line 26-37** - Wrap logo/fallback in Link:
```tsx
<Link to={`/developers/${developer.slug}`} className="shrink-0">
  {developer.logo_url && !logoError ? (
    <img ... className="... hover:ring-2 hover:ring-primary/20 transition-all" />
  ) : (
    <div ... className="... hover:ring-2 hover:ring-primary/20 transition-all">
      ...
    </div>
  )}
</Link>
```

**Line 40** - Make name a link:
```tsx
<Link to={`/developers/${developer.slug}`}>
  <h3 className="font-semibold hover:text-primary hover:underline transition-colors">
    {developer.name}
  </h3>
</Link>
```

This provides the expected UX where clicking anywhere on the developer's identity (logo or name) takes you to their full profile page.
