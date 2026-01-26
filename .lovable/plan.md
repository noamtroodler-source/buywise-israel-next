
# Fix "Save as Draft" for Pending Agents

## Problem Identified

When you click "Save as Draft", you see "Failed to create property: Agent profile not found" even though your agent profile exists in the database (with `status: pending`).

**Root Cause**: The `useCreateProperty` hook has a stale closure issue. It captures `agentProfile` from `useAgentProfile()` at render time, but by the time the mutation actually runs, the value may still be `undefined` because:

1. The `useAgentProfile` query runs asynchronously
2. The mutation captures the `agentProfile` value at the time the hook is called
3. When you click "Save Draft", the captured `agentProfile` may still be `null/undefined` even though the query has since resolved

Your agent profile **does exist** and is correctly in `pending` status:
```
id: 6f158b7a-55f8-4b3e-8502-ce6ac06ddb04
name: Daniel Troodler
status: pending
user_id: 137e8e73-fe2c-454c-a2ae-20cff8d1948e
```

---

## Solution

Modify `useCreateProperty` to fetch the agent profile **inside the mutation function** rather than relying on the stale hook value. This guarantees we get the current profile at mutation time.

---

## File to Modify

### `src/hooks/useAgentProperties.tsx`

**Change the `useCreateProperty` hook (lines 100-145)**:

1. Remove the captured `agentProfile` from the hook level
2. Add a direct Supabase query inside `mutationFn` to get the current user's agent profile
3. This ensures the profile is fetched fresh when saving, not stale from render time

```text
Before (line 100-106):
┌───────────────────────────────────────────────────┐
│ export function useCreateProperty() {             │
│   const queryClient = useQueryClient();           │
│   const { data: agentProfile } = useAgentProfile(); │ ← Captured at render time (stale)
│                                                   │
│   return useMutation({                            │
│     mutationFn: async (...) => {                  │
│       if (!agentProfile) throw new Error(...)     │ ← Uses stale value
│       ...                                         │
└───────────────────────────────────────────────────┘

After:
┌───────────────────────────────────────────────────┐
│ export function useCreateProperty() {             │
│   const queryClient = useQueryClient();           │
│   const { user } = useAuth();                     │ ← Get user directly
│                                                   │
│   return useMutation({                            │
│     mutationFn: async (...) => {                  │
│       // Fetch agent profile fresh at mutation time │
│       const { data: agentProfile } = await supabase │ ← Fresh fetch!
│         .from('agents')                           │
│         .select('id')                             │
│         .eq('user_id', user?.id)                  │
│         .maybeSingle();                           │
│                                                   │
│       if (!agentProfile) throw new Error(...)     │ ← Now has real data
│       ...                                         │
└───────────────────────────────────────────────────┘
```

---

## Why This Works

- **Fresh Data**: Fetching inside the mutation guarantees we get the current database state
- **No Status Filter**: The query doesn't filter by `status`, so pending agents are included
- **Proper RLS**: The "Agents are viewable by everyone" policy allows this SELECT
- **Minimal Impact**: Only affects the create flow, existing update/delete flows remain unchanged

---

## Developer Portal Coverage

This same fix pattern should also be applied to:
- `useCreateProject` in `src/hooks/useDeveloperProjects.tsx` (if it has the same issue)

This ensures developers with pending profiles can also save project drafts.

---

## Expected Result

After this fix:
- "Save as Draft" will work even with a pending agent account
- "Submit for Review" will continue to be blocked (as intended by the `isAgentVerified` check in the UI)
- No changes to RLS policies or database schema required
