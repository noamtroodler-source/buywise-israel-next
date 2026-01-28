
# Clean Up Agent Avatar Styling

## Problem
The agent profile picture on the Agent Detail page looks like viewing through a "glass tank" or "mirror" - the current styling has too many layered effects that create an overly processed, cheap-looking appearance.

**Current styling on AgentDetail.tsx:**
```tsx
<Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-background shadow-lg">
```

**Compare to clean Blog Author styling:**
```tsx
<Avatar className="h-12 w-12">  // Simple and clean
```

The issue is caused by:
- `border-4 border-background` - creates a thick white border that looks like a photo frame
- `shadow-lg` - heavy drop shadow adds an artificial floating effect
- The combination creates a "layered glass" appearance

---

## Solution

Simplify the avatar styling across agent-related components to match the clean blog author look, while keeping the avatar size appropriate for each context.

---

## Files to Modify

### 1. AgentDetail.tsx (Main Agent Profile Page)

**Line 164 - Hero Avatar**

| Current | New |
|---------|-----|
| `border-4 border-background shadow-lg` | Simple ring with subtle offset |

New styling:
```tsx
<Avatar className="h-24 w-24 md:h-28 md:w-28 ring-2 ring-border">
```

This gives:
- Clean, simple ring around the avatar
- No heavy shadows or thick borders
- Professional, modern look

---

### 2. ProjectAgentCard.tsx (Agent Card on Project Pages)

**Line 90 - Agent Avatar in sidebar card**

| Current | New |
|---------|-----|
| `ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-md border border-background` | Simple, clean styling |

New styling:
```tsx
<Avatar className="h-16 w-16 ring-2 ring-border">
```

---

### 3. StickyContactCard.tsx (Agent Card on Listing Pages)

**Line 89 - Agent Avatar in contact sidebar**

| Current | New |
|---------|-----|
| `ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-md border border-background` | Simple, clean styling |

New styling:
```tsx
<Avatar className="h-16 w-16 ring-2 ring-border">
```

---

## Visual Comparison

**Before (glass tank effect):**
- Thick white border around the photo
- Heavy shadow underneath
- Multiple overlapping decorative elements
- Looks like the photo is in a frame inside another frame

**After (clean look):**
- Single subtle ring around the avatar
- No shadows or thick borders
- Photo feels natural and integrated
- Matches blog author styling and modern design standards

---

## Result

All agent avatars across the site will have a consistent, clean, professional appearance without the artificial "glass tank" or "framed" look - matching the quality you see on blog pages.
