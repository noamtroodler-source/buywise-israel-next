

# Phase 11: Duplicate Merge UI

## Overview
A dedicated admin page (`/admin/duplicates`) for reviewing and merging duplicate property listings detected via pHash image matching. Admins see side-by-side property comparisons, pick the "primary" listing, and merge — transferring inquiries, favorites, and views to the winner while archiving or deleting the loser.

## Database Changes

**New table: `duplicate_pairs`** — tracks detected duplicates and their resolution status.

```sql
CREATE TABLE public.duplicate_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_a UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  property_b UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  detection_method TEXT NOT NULL DEFAULT 'phash',  -- 'phash', 'address', 'manual'
  similarity_score INTEGER,  -- e.g. hamming distance for phash
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'merged', 'dismissed'
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  merged_into UUID REFERENCES public.properties(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_a, property_b)
);

ALTER TABLE public.duplicate_pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage duplicate pairs"
  ON public.duplicate_pairs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

**New DB function: `merge_properties`** — a `SECURITY DEFINER` function that:
1. Reassigns inquiries from loser → winner
2. Transfers favorites (skip duplicates)
3. Sums views_count
4. Unpublishes the loser property
5. Updates the `duplicate_pairs` record to `merged`

## Edge Function: `detect-duplicates`

Scans `image_hashes` for cross-property pHash matches (hamming ≤ 5) and inserts new rows into `duplicate_pairs` if not already tracked. Can be triggered manually from the admin UI or scheduled.

## New Page: `/admin/duplicates`

**File: `src/pages/admin/AdminDuplicates.tsx`**

- Fetches pending `duplicate_pairs` with full property data for both sides
- Side-by-side comparison cards showing: title, images, price, agent, city, size, rooms, listing status
- Highlight differences (e.g., price mismatch in red)
- Actions per pair:
  - **Keep Left** — merge into property_a, archive property_b
  - **Keep Right** — merge into property_b, archive property_a  
  - **Dismiss** — mark as not-duplicate
- Bulk dismiss option
- Filter tabs: All | Pending | Merged | Dismissed

## UI Component: `DuplicateCompareCard.tsx`

Side-by-side layout with two property mini-cards. Each card shows:
- Lead image
- Title, city, neighborhood
- Price, rooms, size
- Agent name
- Days listed, views count
- "Keep This" button

## Integration Points

1. **AdminLayout sidebar** — add "Duplicates" link under Content section with badge count of pending pairs
2. **App.tsx** — add route `<Route path="duplicates" element={<AdminDuplicates />} />`
3. **ImageDedupPanel** — add "Review All" link to `/admin/duplicates`
4. **AdminDashboard** — wire pending duplicates count into TodaysPriorities if > 0

## Files to Create/Edit
- **Migration**: `duplicate_pairs` table + `merge_properties` function
- **New**: `supabase/functions/detect-duplicates/index.ts`
- **New**: `src/pages/admin/AdminDuplicates.tsx`
- **New**: `src/components/admin/DuplicateCompareCard.tsx`
- **Edit**: `src/pages/admin/AdminLayout.tsx` — add sidebar link
- **Edit**: `src/App.tsx` — add route
- **Edit**: `src/components/admin/ImageDedupPanel.tsx` — add "Review All" link

