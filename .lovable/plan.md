
Goal
- When a guest (not signed in) saves/favorites a property, the public “X saves” number should increase (and decrease if they un-save).
- Signed-in users must still work exactly as before.
- Prevent regressions by centralizing save-count logic in one place (a single backend function) and making favorites toggles always refresh/optimistically update the count.

What’s happening now (root cause)
- Guest favorites are stored only in the browser (sessionStorage via FavoritesContext).
- The “saves” number is calculated by `useSavesCount`, which counts rows in the `favorites` table (signed-in users only).
- So: guests can “save” locally, but there is nothing in the backend to count, so the saves count stays 0.

High-level fix
1) Add a backend table to track guest saves keyed by a durable guest identifier (stored in localStorage).
2) Add a backend function (RPC) that returns the combined count:
   - authenticated saves: `favorites` (unique per user+property already)
   - guest saves: new table (unique per guestId+property)
3) Update the frontend:
   - When a guest favorites/unfavorites, also insert/delete their row in the guest-saves table.
   - Change `useSavesCount` to call the combined-count RPC.
   - After toggling favorites (guest or signed-in), update/invalidate the saves-count query so the UI updates immediately and consistently.

Step-by-step implementation plan

A) Backend: schema + RLS + counting function
1) Create table `guest_property_saves`
   - Columns:
     - `id uuid primary key default gen_random_uuid()`
     - `property_id uuid not null references public.properties(id) on delete cascade`
     - `guest_id text not null`
     - `created_at timestamptz not null default now()`
   - Constraint:
     - unique(`property_id`, `guest_id`) to prevent double-counting.

2) Enable Row Level Security (RLS) on `guest_property_saves`.

3) RLS policies for guest_property_saves
   We need guests to be able to insert/delete only their own rows without exposing all rows.
   - Create policies that compare `guest_id` to a value passed in the request header, e.g. `x-guest-id`.
   - Policies:
     - INSERT: allow if `guest_id = (request header x-guest-id)`
     - DELETE: allow if `guest_id = (request header x-guest-id)`
   - No general SELECT policy (so clients can’t read the guest rows and guest_ids).

   Note: This uses the database request-header context (common in this stack). The frontend will send `x-guest-id` via a dedicated client instance that sets global headers.

4) Create an RPC function for combined save counts
   - Function: `get_property_saves_count(p_property_id uuid) returns integer`
   - It returns:
     - count of `favorites` rows for property
     - plus count of `guest_property_saves` rows for property
   - Mark as `security definer` so it can read both tables safely without granting SELECT on `guest_property_saves`.
   - Validate input (null/empty) and return 0 in safe cases.

   Example logic:
   - `select (select count(*) from favorites where property_id = p_property_id) + (select count(*) from guest_property_saves where property_id = p_property_id);`

B) Frontend: durable guest ID + guest save writes
5) Add a small utility for a durable guest ID
   - New helper: `getOrCreateGuestId()`
   - Storage: localStorage key like `buywise_guest_id`
   - Value: `crypto.randomUUID()`
   - Rationale: localStorage survives tab close/reopen, so guests can un-save later and not “leak” counts due to session expiry.

6) Add a “guest-aware” database client factory (do not edit the auto-generated client)
   - Create a helper like `createGuestClient(guestId: string)` that uses `createClient` with the same URL + publishable key but sets:
     - `global.headers: { 'x-guest-id': guestId }`
   - This client is used only for writes to `guest_property_saves`.

7) Update `useFavorites` guest mutations to also write to backend
   - On guest addFavorite:
     - update FavoritesContext (existing behavior)
     - insert into `guest_property_saves` using guest client:
       - `{ property_id: propertyId, guest_id: guestId }`
     - handle conflicts gracefully:
       - because of unique constraint, repeated inserts should not break UX; treat “already exists” as success (or use upsert if preferred).
   - On guest removeFavorite:
     - update FavoritesContext (existing behavior)
     - delete from `guest_property_saves` where:
       - `property_id = propertyId` AND `guest_id = guestId`

8) Keep signed-in behavior unchanged
   - Signed-in users continue to insert/delete in `favorites` only.
   - No writes to `guest_property_saves` for authenticated users.

C) Frontend: make the “saves count” always reflect combined totals
9) Update `useSavesCount(propertyId)`
   - Replace the `favorites` count query with an RPC call:
     - `supabase.rpc('get_property_saves_count', { p_property_id: propertyId })`
   - Keep caching/staleTime as is.
   - This ensures every UI surface that uses `useSavesCount` automatically gets the new combined count.

10) Ensure UI updates immediately after toggling favorites
   - In `useFavorites` mutations (both guest and signed-in):
     - After success, invalidate `['savesCount', propertyId]`
     - Optionally also do an optimistic `setQueryData` increment/decrement in `onMutate`:
       - If saving: +1
       - If unsaving: -1 (min 0)
     - This prevents the “I just saved but it still shows 0” moment.

11) Regression prevention: centralize the rule
   - The only source of truth for the count becomes the RPC (`get_property_saves_count`).
   - The only way “guest saves” affect the backend is through the guest_id + policies.
   - This prevents future components from accidentally showing signed-in-only counts again.

D) Verification checklist (end-to-end)
12) Guest flow
   - Open property detail in a fresh incognito window
   - Click Save
   - Confirm:
     - heart indicates saved
     - “saves” increments from 0 to 1 within a moment (or instantly with optimistic update)
   - Refresh page
   - Confirm “saves” still shows 1 and the property is still saved locally
   - Click Save again (un-save)
   - Confirm “saves” decrements back to 0

13) Signed-in flow
   - Sign in
   - Save the same property
   - Confirm “saves” increments accordingly
   - Un-save
   - Confirm decrements accordingly

14) Concurrency sanity
   - Two browsers (or incognito + normal):
     - guest save in one should increase count seen in the other after refresh or cache expiry (or after invalidation where applicable).

Files expected to be touched (implementation phase)
- Database migration (new table + RLS + RPC function)
- `src/hooks/useSavesCount.tsx` (switch to rpc)
- `src/hooks/useFavorites.tsx` (guest insert/delete + invalidate savesCount)
- New small utilities (guest id + guest client factory), likely under:
  - `src/utils/guestId.ts` (or similar)
  - `src/integrations/supabase/guestClient.ts` (or similar)

Notes / tradeoffs
- This counts “unique guest browsers” as saves (unique guest_id), which is the best practical equivalent to unique users for guests.
- Guest_id is not personally identifying and is never exposed via SELECT to clients.
- If a guest later signs up, their past guest save may remain counted separately unless we choose to reconcile; not required for your request and usually acceptable for a public “saves” metric.

