

## Prevent Duplicate Discoveries

### Problem
Clicking "Discover" on the same URL creates a brand new job with duplicate items every time. There's no check for existing jobs.

### Solution
Add duplicate detection in two places: the edge function (server-side guard) and the UI (client-side warning with option to resume).

---

### Changes

**1. Edge Function: `supabase/functions/import-agency-listings/index.ts`**

In `handleDiscover`, before calling Firecrawl, query `import_jobs` for an existing job with the same `agency_id` and `website_url` that isn't in a terminal state:

- If an existing job is found with status `ready`, `processing`, or `discovering` -- return it immediately without re-scanning. Response includes a `resumed: true` flag so the UI knows.
- If an existing job is found with status `completed` -- still return it with `resumed: true`, letting the user continue from where they left off (they can delete it manually if they want a fresh scan).
- Only create a new job if no matching job exists.

This is the authoritative guard -- even if the UI check is bypassed, the server won't create duplicates.

**2. UI: `src/pages/agency/AgencyImport.tsx`**

Before calling the discover mutation, check the local `jobs` array for a job with the same URL (normalized). If found:

- Show a toast warning: "A job for this URL already exists"
- Auto-select that job (set `activeJobId`) instead of starting discovery
- Skip the mutation entirely

This gives instant feedback without waiting for a server round-trip.

**3. Hook: `src/hooks/useImportListings.tsx`**

Update the `useDiscoverListings` mutation's return type to include `resumed?: boolean` so the success handler can show an appropriate toast ("Resumed existing job" vs "Found N listing pages").

---

### Technical Details

```text
Edge Function (handleDiscover) - lines ~18-159
  BEFORE Firecrawl call, add:
  
  1. Normalize website_url (trim, lowercase hostname, remove trailing slash)
  2. Query: SELECT * FROM import_jobs
     WHERE agency_id = ? AND website_url = ?
     AND status NOT IN ('failed')
     ORDER BY created_at DESC LIMIT 1
  3. If found:
     - Count pending items for that job
     - Return { job_id, total_listings, total_discovered, resumed: true }
  4. If not found: proceed with existing Firecrawl + AI flow

UI (AgencyImport.tsx) - handleDiscover function
  BEFORE calling discoverMutation:
  
  1. Normalize the input URL same way as server
  2. Check: jobs.find(j => normalize(j.website_url) === normalize(websiteUrl))
  3. If match found:
     - toast.info("Job already exists for this URL — showing it")
     - setActiveJobId(match.id)
     - return early (don't call mutation)

Hook (useImportListings.tsx) - useDiscoverListings
  - Update return type to include resumed?: boolean
  - Update onSuccess toast: show "Resumed existing job" when resumed is true
```

### URL Normalization

Both client and server will normalize URLs the same way:
- Add `https://` if no protocol
- Lowercase the hostname
- Remove trailing slash

This prevents edge cases like `https://Example.com/` vs `http://example.com` creating duplicate jobs.

