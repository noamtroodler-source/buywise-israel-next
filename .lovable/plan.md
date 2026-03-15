

# Phase 2: Performance & Data — Refresh + Optimistic Updates

## 1. Manual Refresh Button on Dashboard

**Problem**: Agents checking stats repeatedly must reload the page.

**Solution**: Add a refresh button in the dashboard header that refetches all dashboard queries.

**Changes**:
- **Edit `src/pages/agent/AgentDashboard.tsx`**:
  - Import `useQueryClient` from react-query
  - Add a `handleRefresh` function that invalidates `agentProperties`, `my-agent-performance`, `leadStats`, and `agentProfile` query keys
  - Add a refresh button (RefreshCw icon, already imported) next to the NotificationBell in the header actions row
  - Show a spinning animation on the icon while any query is loading after refresh
  - On mobile, also support pull-to-refresh by wrapping the dashboard content in the existing `PullToRefresh` component (already built at `src/components/shared/PullToRefresh.tsx`)

## 2. Optimistic Updates on Delete & Submit-for-Review

**Problem**: After deleting or submitting a listing, the UI waits for a full refetch before updating. Feels sluggish.

**Solution**: Add `onMutate` / `onError` / `onSettled` handlers to `useDeleteProperty` and `useSubmitForReview` for instant cache updates with rollback on failure.

**Changes**:
- **Edit `src/hooks/useAgentProperties.tsx`** — `useDeleteProperty()`:
  - `onMutate`: Cancel outgoing queries, snapshot current cache, optimistically remove the property from `agentProperties` cache
  - `onError`: Rollback to snapshot, show error toast
  - `onSettled`: Invalidate queries to sync with server

- **Edit `src/hooks/useAgentProperties.tsx`** — `useSubmitForReview()`:
  - `onMutate`: Cancel outgoing queries, snapshot current cache, optimistically set `verification_status` to `'pending_review'` and clear `rejection_reason` on the target property
  - `onError`: Rollback to snapshot, show error toast
  - `onSettled`: Invalidate queries to sync with server

## Files Touched

| File | Action |
|------|--------|
| `src/pages/agent/AgentDashboard.tsx` | Edit — add refresh button + pull-to-refresh wrapper |
| `src/hooks/useAgentProperties.tsx` | Edit — add optimistic update logic to `useDeleteProperty` and `useSubmitForReview` |

