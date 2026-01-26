

# Fix Developer Profile Pages Not Loading

## Problem Identified

The mock developers created by the seed function have `status: 'active'`, but the hooks that fetch developers are filtering for `status: 'approved'`. This mismatch causes all developer profile pages to show "Developer not found".

**Database state:**
| Developer | status | verification_status |
|-----------|--------|---------------------|
| Azrieli Development Group | active | approved |
| Tidhar Group | active | approved |
| All 8 developers... | active | approved |

**Hook filter:**
```tsx
.eq('status', 'approved')  // Looking for 'approved' but data has 'active'
```

---

## Solution

Update both developer hooks in `src/hooks/useProjects.tsx` to filter by `status: 'active'` instead of `status: 'approved'`. This aligns with:
1. The seed data generation (uses `active`)
2. The professional role lifecycle documented in the memory (uses `active` for approved professionals)

---

## Files to Change

### `src/hooks/useProjects.tsx`

**Change 1 - Line 56** (`useDevelopers` hook):
```tsx
// Before
.eq('status', 'approved')

// After
.eq('status', 'active')
```

**Change 2 - Line 74** (`useDeveloper` hook):
```tsx
// Before
.eq('status', 'approved')

// After
.eq('status', 'active')
```

---

## Why This Is Correct

Per the architecture memory: *"Admin approval sets the 'status' to 'active'"*

The `status` field represents the account state:
- `pending` - Awaiting admin review
- `active` - Approved and visible
- `suspended` - Blocked from platform

The `verification_status` field is a separate check:
- `pending` / `approved` / `rejected`

So filtering by `status: 'active'` is the correct behavior for showing public-facing profiles.

---

## Result

After this fix:
- `/developers` page will list all 8 mock developers
- `/developers/azrieli-development-group` (and all other slugs) will load the full profile
- Projects, stats, contact info, and blog posts will all display correctly

