

# Phase G: Optimistic Delete Rollbacks & Error Hardening

## Current State

The optimistic update pattern (onMutate → snapshot → rollback in onError) is already implemented for `useDeleteProperty`, `useBulkDeleteProperties`, `useSubmitForReview`, and `useBulkSubmitForReview`. However, two gaps remain:

1. **Raw error messages**: All `onError` handlers in `useAgentProperties.tsx` expose raw `error.message` directly to users. The rest of the codebase uses `getUserFriendlyError()` for consistent, non-technical error messaging.
2. **Missing optimistic update**: `useReassignProperty` has no `onMutate`/rollback — if the server call fails, the user gets an error toast but no visual recovery.

## Changes

### 1. Import `getUserFriendlyError` into `useAgentProperties.tsx`

Add the import and replace all `error.message` references in `onError` handlers with `getUserFriendlyError(error, 'contextual fallback')`.

Affected mutations (7 total):
- `useCreateProperty` → fallback: "Failed to create listing"
- `useSubmitForReview` → fallback: "Failed to submit for review"
- `useUpdateProperty` → fallback: "Failed to update listing"
- `useCreatePropertyForAgency` → fallback: "Failed to create listing"
- `useUpdatePropertyForAgency` → fallback: "Failed to update listing"
- `useReassignProperty` → fallback: "Failed to reassign listing"
- `useDeleteProperty` → fallback: "Failed to delete listing"
- `useBulkDeleteProperties` → fallback: "Failed to delete listings"
- `useBulkSubmitForReview` → fallback: "Failed to submit for review"

### 2. Add optimistic update to `useReassignProperty`

Add `onMutate` to snapshot `agencyListingsManagement` cache, optimistically update the `agent_id` on the property, and roll back in `onError`. Add `onSettled` to refetch.

## Files touched

| File | Change |
|------|--------|
| `src/hooks/useAgentProperties.tsx` | Add `getUserFriendlyError` import; update all 9 `onError` handlers; add `onMutate`/rollback to `useReassignProperty` |

Single file, minimal risk. No database or schema changes needed.

