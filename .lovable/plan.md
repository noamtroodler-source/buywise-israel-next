

## Remove Compare Links from Navigation

### What we're removing
Two navigation items from the mega-menu dropdowns:
1. **"Compare Properties"** → `/compare` (from Buy menu)
2. **"Compare Projects"** → `/compare-projects` (from Projects menu)

### Why this makes sense
- The Compare feature is available contextually from the Favorites page and individual property/project cards
- Users don't typically "start" with comparing — they discover it after saving items
- Reduces visual clutter in the navigation

### File to modify
**`src/lib/navigationConfig.ts`**

### Changes
Remove these two lines:
- Line 43: `{ label: 'Compare Properties', href: '/compare', phase: 'check' },`
- Line 106: `{ label: 'Compare Projects', href: '/compare-projects', phase: 'check' },`

### Result
The Browse columns will become cleaner:

**Buy → Browse:**
- All Properties for Sale
- New Construction
- Browse by Area

**Projects → Browse:**
- All New Projects
- Browse Developers

Note: The `/compare` and `/compare-projects` routes still exist — users can access them from the Favorites page or via direct link. We're just removing them from the primary navigation.

