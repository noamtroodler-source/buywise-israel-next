

# Fix: "Questions to Ask" Section Not Showing

## Root Cause

The "Questions to Ask" section is not appearing because the **`generate-listing-questions` edge function is not deployed** (returning 404). When the hook calls the function and gets an error, it throws and the component renders `null` (silent fail per line 98-99 in `PropertyQuestionsToAsk.tsx`).

This affects ALL listing types:
- ✗ Properties (buy/resale)
- ✗ Rentals
- ✗ Projects

---

## Evidence

| Check | Result |
|-------|--------|
| Edge function curl test | `404 NOT_FOUND` |
| Function code exists | ✓ `supabase/functions/generate-listing-questions/` |
| property_questions table | ✓ 144 active questions |
| listing_question_cache | ✓ Has cached entries from previous runs |

---

## Solution

### Step 1: Deploy the Edge Function

Deploy `generate-listing-questions` to make it accessible. The code is correct; it just needs to be deployed.

```
Deploy: generate-listing-questions
```

### Step 2: Verify RLS Policy (Already OK)

The RLS policy on `listing_question_cache` has `USING (false)`:

```sql
Policy: "Cache managed internally only" 
- USING: false
- WITH CHECK: false
```

**This is actually fine** because the edge function uses `SUPABASE_SERVICE_ROLE_KEY` which **bypasses RLS entirely**. The cache is only written/read by the edge function, not the browser client.

---

## Files Changed

No code changes needed - just deployment.

---

## After Fix

Once deployed:
1. Property detail pages (buy/resale) → Questions appear
2. Rental listings → Questions appear
3. Project detail pages → Questions appear

---

## Technical Note

The component correctly handles the loading/error states:
- Shows skeleton while loading
- Returns `null` on error (silent fail)
- Shows questions when available

The issue is purely that the backend function isn't reachable.

