

## Fix: "Failed to save preferences" Error in Buyer Onboarding Wizard

### Root Cause

The database logs reveal the exact error: **"duplicate key value violates unique constraint 'buyer_profiles_user_id_key'"**.

Here's what happens:
1. User starts the onboarding wizard (no `buyer_profiles` row exists yet)
2. Step 1 completes -- `saveStepProgress` calls `createProfile.mutateAsync()` which does an **INSERT** -- works fine, row is created
3. Step 3 completes -- `saveStepProgress` checks `existingProfile` (the prop from the parent component), but it's **still null** because the parent hasn't re-fetched it. So it calls `createProfile.mutateAsync()` again -- another **INSERT** -- which fails because a row already exists for that `user_id`
4. Every subsequent step and the final "Complete" button all fail with the same duplicate key error

The `existingProfile` prop is stale -- it was `null` when the dialog opened and never updates mid-wizard, so the code always takes the INSERT path instead of the UPDATE path.

### Impact on Other Roles

Agents, Agencies, and Developers are **not affected** by this specific bug because:
- Their registration flows use different tables (`agents`, `agencies`, `developers`) with separate hooks
- They don't use the progressive step-saving pattern that causes this duplicate insert

### Fix Plan

**File: `src/hooks/useBuyerProfile.tsx`** -- Change `useCreateBuyerProfile` to use UPSERT

Replace the `.insert()` call with `.upsert()` using `onConflict: 'user_id'`. This way:
- First call: creates the row (no existing row)
- Subsequent calls: updates the existing row instead of failing
- The "Complete" button: works regardless of whether the row exists

```text
// Before (line ~116-120):
.insert(insertData as never)
.select()
.single();

// After:
.upsert(insertData as never, { onConflict: 'user_id' })
.select()
.single();
```

This is a single-line change that fully resolves the issue. The upsert approach is inherently safe -- it prevents duplicate key errors permanently, not just for the current flow but for any future scenario where a buyer profile might already exist.

### Technical Details

- **Table**: `buyer_profiles` (has a unique constraint on `user_id`)
- **Change scope**: 1 line in `src/hooks/useBuyerProfile.tsx` (line ~117)
- **Risk**: Very low -- upsert behaves identically to insert when no row exists, and acts as update when one does
- **No database migration needed** -- the unique constraint already exists and is what upsert relies on

