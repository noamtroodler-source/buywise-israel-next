
# Content Visit Tracking - "What Have I Already Seen?"

## Problem Statement
Users exploring the site lose track of which guides, tools, and resources they've already visited. When they return to the navigation menus, everything looks the same — no way to know "I already read this" vs "I haven't seen this yet."

## Solution Overview
A lightweight visit tracking system with subtle visual indicators in navigation menus, using localStorage for guests and database sync for authenticated users.

---

## Visual Design

### Checkmark Indicator in Menus
Each visited item in mega-menus will show a small blue checkmark:

```text
┌─────────────────────────────────────────────────┐
│  CALCULATORS                                    │
│                                                 │
│  ✓ Mortgage Calculator          (visited)      │
│    Monthly payments & rates                     │
│                                                 │
│    Affordability                 (not visited) │
│    What can you afford?                         │
│                                                 │
│  ✓ True Cost                     (visited)     │
│    Taxes, fees & closing costs                  │
└─────────────────────────────────────────────────┘
```

**Styling:**
- Small `Check` icon (12px) in `text-primary` color
- Positioned inline before the label
- Subtle, not overwhelming

---

## What Gets Tracked

| Content Type | Example URLs | Track? |
|--------------|--------------|--------|
| Guides | `/guides/buying-in-israel`, `/guides/purchase-tax` | Yes |
| Tools | `/tools?tool=mortgage`, `/tools?tool=affordability` | Yes |
| Area Pages | `/areas/tel-aviv`, `/areas/jerusalem` | Yes |
| Blog Posts | `/blog/[slug]` | Yes |
| Glossary Page | `/glossary` | Yes |
| Listings | `/listings/[id]` | No (already tracked separately) |
| Projects | `/projects/[id]` | No (already tracked separately) |

---

## Technical Architecture

### 1. New Database Table
```sql
CREATE TABLE content_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_path TEXT NOT NULL,  -- e.g., "/guides/buying-in-israel"
  content_type TEXT NOT NULL,  -- "guide", "tool", "area", "blog", "glossary"
  first_visited_at TIMESTAMPTZ DEFAULT now(),
  last_visited_at TIMESTAMPTZ DEFAULT now(),
  visit_count INTEGER DEFAULT 1,
  UNIQUE(user_id, content_path)
);
```

### 2. LocalStorage for Guests
```typescript
// Key: 'buywise_content_visits'
// Value: { [path: string]: { type: string; visitedAt: string; count: number } }
```

### 3. New Hook: `useContentVisits`
```typescript
function useContentVisits() {
  // Returns:
  // - visitedPaths: Set<string> (for quick lookup)
  // - isVisited(path: string): boolean
  // - markVisited(path: string, type: string): void
  // - getVisitCount(path: string): number
}
```

### 4. Tracking Hook: `useTrackContentVisit`
```typescript
// Auto-tracks the current page on mount
function useTrackContentVisit(contentType: string) {
  const { pathname, search } = useLocation();
  const { markVisited } = useContentVisits();
  
  useEffect(() => {
    markVisited(pathname + search, contentType);
  }, [pathname, search]);
}
```

### 5. Database Sync on Login
When a user logs in, merge localStorage visits into the database (like favorites sync pattern).

---

## Implementation Files

### New Files
| File | Purpose |
|------|---------|
| `src/hooks/useContentVisits.tsx` | Core hook for tracking and querying visits |
| `src/hooks/useTrackContentVisit.tsx` | Auto-track hook for pages |

### Modified Files
| File | Change |
|------|--------|
| `src/components/layout/MegaMenu.tsx` | Add checkmark indicator |
| `src/components/layout/LearnNav.tsx` | Add checkmark indicator |
| `src/pages/guides/*.tsx` | Add `useTrackContentVisit('guide')` |
| `src/pages/ToolsPage.tsx` | Add tracking for tool views |
| `src/pages/AreasPage.tsx` + `CityPage.tsx` | Add tracking for area views |
| `src/pages/blog/*.tsx` | Add tracking for blog views |
| `src/pages/GlossaryPage.tsx` | Add tracking |

---

## Database Migration

```sql
-- Create content_visits table
CREATE TABLE public.content_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_path TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('guide', 'tool', 'area', 'blog', 'glossary')),
  first_visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  visit_count INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT unique_user_content UNIQUE(user_id, content_path)
);

-- Index for fast lookups
CREATE INDEX idx_content_visits_user ON public.content_visits(user_id);

-- RLS policies
ALTER TABLE public.content_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own visits"
  ON public.content_visits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visits"
  ON public.content_visits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visits"
  ON public.content_visits FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## Component Updates

### MegaMenu.tsx (Updated)
```tsx
// Before
<span className="text-sm font-medium text-foreground">
  {item.label}
</span>

// After
<span className="text-sm font-medium text-foreground flex items-center gap-1.5">
  {isVisited(item.href) && (
    <Check className="h-3 w-3 text-primary flex-shrink-0" />
  )}
  {item.label}
</span>
```

### LearnNav.tsx (Updated)
Same pattern — add checkmark before labels for visited items.

---

## Behavior Details

### Guest Users
- Visits stored in localStorage (persists across sessions)
- No database writes
- Checkmarks appear based on localStorage

### Authenticated Users
- On login: merge localStorage visits → database
- All new visits go to database
- Checkmarks based on database query (cached with React Query)

### Sync on Login
```typescript
// When user logs in:
const localVisits = getLocalStorageVisits();
if (localVisits.length > 0) {
  await syncVisitsToDatabase(localVisits);
  clearLocalStorageVisits();
}
```

---

## UI/UX Considerations

1. **Subtle, Not Pushy**: Small checkmarks, not blocking repeat visits
2. **Fast Lookup**: Use React Query for caching, localStorage for guests
3. **No "Don't Visit Again" Vibe**: Just helpful context, still clickable
4. **Cross-Device for Logged-In**: Database sync ensures consistency

---

## Implementation Order

1. **Database**: Create `content_visits` table with RLS
2. **Hook**: Build `useContentVisits` with localStorage + DB logic
3. **MegaMenu**: Add checkmark indicators to all nav menus
4. **Page Tracking**: Add `useTrackContentVisit` to guide/tool/area pages
5. **Sync**: Implement localStorage → DB merge on login
6. **Test**: Verify checkmarks appear correctly after visiting pages
