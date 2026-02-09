
# Checkmark Expiration System for Content Visits

## Overview
This plan implements a smart expiration system for the "visited" checkmarks in navigation menus. The system will automatically clear checkmarks based on time (30 days) and section completion, while giving users manual control to reset their history.

---

## Expiration Rules

| Rule | Trigger | What Happens |
|------|---------|--------------|
| **Time-based expiry** | 30 days since last visit to a page | That page's checkmark disappears |
| **Section completion** | User visits ALL items in a nav section | All checkmarks in that section clear |
| **Manual reset** | User clicks "Clear History" | All checkmarks cleared |

---

## Changes Summary

### 1. Database Updates
- Add `expires_at` column to `content_visits` table (defaults to 30 days after `last_visited_at`)
- Create a trigger to auto-update `expires_at` when `last_visited_at` changes

### 2. Hook Updates (`useContentVisits.tsx`)
- Filter out expired visits (where `expires_at < now()`)
- Add section completion detection using navigation config
- Add `clearHistory()` function for manual reset
- Add `getVisitedBySection()` to track section progress

### 3. localStorage Updates
- Store `visitedAt` timestamp (already there)
- Filter expired visits locally (30+ days old)

### 4. UI Updates
- Add section completion logic in `MegaMenu.tsx` and `LearnNav.tsx`
- Add "Clear history" option in account settings

---

## Technical Implementation

### Database Migration

```sql
-- Add expires_at column with 30-day default
ALTER TABLE public.content_visits
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone 
  DEFAULT (now() + interval '30 days');

-- Backfill existing records
UPDATE public.content_visits
SET expires_at = last_visited_at + interval '30 days'
WHERE expires_at IS NULL;

-- Create trigger to auto-update expires_at
CREATE OR REPLACE FUNCTION update_content_visit_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := NEW.last_visited_at + interval '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_visit_expiry_trigger
  BEFORE INSERT OR UPDATE OF last_visited_at ON public.content_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_content_visit_expiry();
```

### useContentVisits.tsx Changes

**Add expiry filtering for database visits:**
```typescript
// Filter out expired visits when fetching
const { data: dbVisits = [] } = useQuery({
  queryFn: async () => {
    const { data } = await supabase
      .from('content_visits')
      .select('content_path, content_type, visit_count, expires_at')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString()); // Only non-expired
    return data || [];
  },
  // ...
});
```

**Add expiry filtering for localStorage:**
```typescript
// Filter expired local visits (30+ days old)
const EXPIRY_DAYS = 30;
const isExpired = (visitedAt: string) => {
  const visitDate = new Date(visitedAt);
  const expiryDate = new Date(visitDate.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  return expiryDate < new Date();
};
```

**Add section completion detection:**
```typescript
import { NAV_CONFIG } from '@/lib/navigationConfig';

// Get all items in a section
const getSectionItems = (sectionKey: string) => {
  const section = NAV_CONFIG[sectionKey];
  if (!section) return [];
  return section.columns.flatMap(col => col.items.map(item => item.href));
};

// Check if all items in a section are visited
const isSectionComplete = (sectionKey: string) => {
  const sectionItems = getSectionItems(sectionKey);
  return sectionItems.every(href => visitedPaths.has(href));
};

// When section is complete, clear those visits
useEffect(() => {
  ['buy', 'rent', 'projects'].forEach(sectionKey => {
    if (isSectionComplete(sectionKey)) {
      clearSectionVisits(sectionKey);
    }
  });
}, [visitedPaths]);
```

**Add clear functions:**
```typescript
// Clear all history
const clearHistory = useCallback(async () => {
  if (user) {
    await supabase
      .from('content_visits')
      .delete()
      .eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['content-visits', user.id] });
  } else {
    clearLocalVisits();
    setLocalVisits({});
  }
}, [user, queryClient]);

// Clear section-specific visits
const clearSectionVisits = useCallback(async (sectionKey: string) => {
  const sectionItems = getSectionItems(sectionKey);
  if (user) {
    await supabase
      .from('content_visits')
      .delete()
      .eq('user_id', user.id)
      .in('content_path', sectionItems);
    queryClient.invalidateQueries({ queryKey: ['content-visits', user.id] });
  } else {
    setLocalVisits(prev => {
      const updated = { ...prev };
      sectionItems.forEach(path => delete updated[path]);
      saveLocalVisits(updated);
      return updated;
    });
  }
}, [user, queryClient]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| **Database migration** | Add `expires_at` column and trigger |
| `src/hooks/useContentVisits.tsx` | Add expiry filtering, section completion, clear functions |
| `src/components/layout/MegaMenu.tsx` | No changes needed (uses `isVisited` which handles expiry) |
| `src/components/layout/LearnNav.tsx` | No changes needed (uses `isVisited` which handles expiry) |
| `src/pages/Settings.tsx` or profile page | Add "Clear browsing history" button |

---

## User Experience

### Anonymous User Flow
1. Visits guides → checkmarks appear
2. After 30 days without revisiting → checkmarks fade away
3. If completes all items in "Buy" section → "Buy" checkmarks clear
4. Can manually clear via settings

### Logged-in User Flow
- Same behavior, but synced across devices
- Expiry tracked in database

### Why This Works
- **30 days**: Matches typical property search timeline
- **Section completion**: Provides closure without cluttering UI
- **Manual reset**: Gives power users control
- **Silent expiry**: Old visits just disappear, no UI noise
