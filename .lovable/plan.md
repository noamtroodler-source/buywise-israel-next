

# Phase G: Seat Management

## Overview
Wire seat limits into the invite and approval flows, show "X/Y seats used" on the team tab, block actions when at limit with upgrade prompts, and keep seat counts in sync on add/remove.

## What Already Exists
- `useSeatLimitCheck` hook -- returns `canInvite`, `currentSeats`, `maxSeats`, `usagePercent`
- "New Code" button already disabled when `!canInvite` (line 428 of AgencyDashboard)
- Tooltip showing "You've used X/Y team seats" on the disabled button
- `UpgradePromptCard` already checks seat usage at 80%
- `useRemoveAgentFromAgency` and `useApproveJoinRequest` mutations exist but don't invalidate `seatCount`

## Changes Needed

### 1. Show "X/Y seats used" badge on team tab header
**File**: `src/pages/agency/AgencyDashboard.tsx`

In the Team tab's `CardHeader` (line 291-293), add a seat usage badge next to "Team Members":
- Show `currentSeats/maxSeats seats used` as a small badge
- Color-code: default for normal, amber for >80%, destructive for 100%
- If `maxSeats` is null (unlimited), show "Unlimited seats"

### 2. Block approve flow when at seat limit
**File**: `src/pages/agency/AgencyDashboard.tsx`

The "Approve" button for join requests (line 389-399) currently has no seat check. Changes:
- Disable the Approve button when `!canInvite`
- Add tooltip explaining the limit
- Show an inline upgrade prompt banner above join requests when at limit

### 3. Invalidate seat count on add/remove
**File**: `src/hooks/useAgencyManagement.tsx`

Add `queryClient.invalidateQueries({ queryKey: ['seatCount'] })` to:
- `useApproveJoinRequest` onSuccess (line ~178)
- `useRemoveAgentFromAgency` onSuccess (line ~232)

This ensures the seat counter updates immediately when agents are added or removed.

### 4. Seat limit banner on team tab
**File**: `src/pages/agency/AgencyDashboard.tsx`

When `usagePercent >= 100`, show a warning card at the top of the team tab content:
- "You've reached your seat limit (X/Y). Upgrade to add more team members."
- Link to /pricing

### 5. Seat info in CreateInviteDialog
**File**: `src/components/agency/CreateInviteDialog.tsx`

Add a small info note at the top of the dialog showing current seat usage so admins know how many seats remain before creating a code.

## Technical Details

### Files Modified
- `src/pages/agency/AgencyDashboard.tsx` -- seat badge on team header, approve button seat gate, at-limit banner
- `src/hooks/useAgencyManagement.tsx` -- add `seatCount` invalidation to approve and remove mutations
- `src/components/agency/CreateInviteDialog.tsx` -- show seat usage info

### No New Files
All changes are additions to existing components.

### No Database Changes
Seat counting already queries the `agents` table filtered by `agency_id`. The `maxSeats` comes from the subscription/plan data via `useSubscription`. No schema changes needed.

### Query Invalidation Flow

```text
Agent Approved/Removed
  -> invalidate 'agencyTeam'     (existing)
  -> invalidate 'seatCount'      (new)
  -> useSeatLimitCheck re-fetches
  -> canInvite / usagePercent updates
  -> UI reflects new state
```
