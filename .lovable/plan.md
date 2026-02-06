

# Redesign: Grouped Left-Aligned Navigation

## The Problem

The current split layout (← Go back on left, All Cities → on right) looks awkward and disconnected. Having navigation elements on opposite sides of the screen creates visual tension and feels unpolished.

## The Solution

Group both navigation options together in the top-left area with a clear visual hierarchy:

```text
← Go back  ·  All Cities
   ↑             ↑
 Major        Minor
(button)   (text link)
```

### Design Decision: Which Should Be Primary?

**"Go back" should be the major/primary action** because:
- It's the most common user intent (return to where they came from)
- It respects the user's browsing context
- Industry standard (Amazon, YouTube, etc. prioritize the back action)

**"All Cities" should be the minor/secondary action** because:
- It's a fallback for users who want to explore alternatives
- Less common use case
- Should be visible but not competing for attention

### Visual Design

**Desktop:**
```text
┌─────────────────────────────────────────────────────────────┐
│ ← Go back  ·  All Cities                                    │
│   (ghost     (subtle text                                   │
│   button)     link, smaller)                                │
└─────────────────────────────────────────────────────────────┘
```

**Mobile:**
```text
┌───────────────────────────────┐
│ ← Back  ·  All Cities         │
└───────────────────────────────┘
```

### Styling Approach

| Element | Style |
|---------|-------|
| Container | `flex items-center gap-2` (grouped left) |
| "Go back" button | Ghost button, standard size |
| Separator | A subtle dot `·` or slash `/` |
| Parent link | Smaller text, muted color, no chevron |

For the overlay variant (on hero images), both will be white/semi-transparent but the back button will still be more prominent.

---

## Technical Changes

### File to Update

**`src/components/shared/DualNavigation.tsx`**

Current layout uses `justify-between` to spread elements across the full width. Will change to:

1. Remove `justify-between` - elements stay left-aligned
2. Add a visual separator between the two links
3. Make the parent link smaller and more subtle
4. Remove the `ChevronRight` icon from parent link (it implied right-side positioning)
5. Keep both clickable areas appropriately sized for touch targets

### Updated Component Structure

```tsx
<div className="flex items-center gap-2">
  {/* Primary: Go back button */}
  <Button variant="ghost" size="sm" onClick={handleBack}>
    <ArrowLeft />
    Go back
  </Button>
  
  {/* Separator */}
  <span className="text-muted-foreground/50">·</span>
  
  {/* Secondary: Parent section link */}
  <Link 
    to={parentPath} 
    className="text-sm text-muted-foreground/70 hover:text-foreground"
  >
    {parentLabel}
  </Link>
</div>
```

---

## Summary

| Change | Before | After |
|--------|--------|-------|
| Layout | Split (left + right) | Grouped (all left) |
| Primary action | Go back (left) | Go back (left, prominent) |
| Secondary action | All Cities (right) | All Cities (left, subtle) |
| Separator | None | Subtle dot |
| Chevron icon | On parent link | Removed |

This creates a cohesive navigation cluster that's intuitive and doesn't look "weird" with elements scattered across the screen.

