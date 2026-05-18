# Team Page Cleanup

Apply 4 changes to the agency Team page (`SeatManagementPanel.tsx` + supporting hook/dialog).

## 1. Remove Member/Manager toggle
- Drop the Member/Manager button entirely. Every agent is just a "Member" implicitly.
- Keep `agency_role` column in DB untouched (no migration) — just hide the UI and stop calling `updateRole`.

## 2. Admin promotion (Owner-only)
- Add an **Admin** badge next to "Verified" when the agent is an `admin` or `owner` in `agency_members`.
- Add a **⋯ kebab menu** on each row visible only when current user is the agency **Owner**:
  - "Promote to Admin" (if not already admin) → calls existing `agency-promote-member` edge fn with `action: 'promote'`
  - "Demote from Admin" (if admin, and not the owner themselves) → `action: 'demote'`
- Owner row shows a non-removable "Owner" badge; no kebab actions on self.
- Extend `useAgencyTeam` to join `agency_members` and return `agency_member_role` per agent so badges/menu can render.

## 3. Status dropdown rework
- Remove "Pending" from manual options (it had no behavior).
- New dropdown values: **Active**, **Suspended**, and a red **"Remove from agency…"** item at the bottom (separated).
- Auto-derived **"Invite not accepted"** badge shows next to name when the agent has no `user_id` OR has an unused `password_setup_token` (read-only, no manual toggling).
- Selecting "Remove from agency…" opens the existing `RemoveAgentDialog` confirmation (already requires typing/confirming) — delete the standalone red person icon button.

## 4. Invite Agent CTA
- Add prominent **"+ Invite Agent"** button top-right of the Sales Agents card header.
- Opens a dialog with:
  - The agency's invite link (e.g. `https://buywiseisrael.com/agent/register?code=XXXX`) with copy button
  - Optional "Send invite by email" input → calls existing agent-invite edge function (reuse what's already used in onboarding)
- No seat-limit gating (founding agencies = unlimited).

## Files touched
- `src/components/agency/SeatManagementPanel.tsx` — remove Manager button + red icon, add Admin badge, kebab menu, new dropdown structure
- `src/hooks/useAgencyManagement.tsx` — extend `useAgencyTeam` to include `agency_member_role` and `invite_accepted` flags; remove `useUpdateAgentRole` usage (keep hook for now, just unused)
- `src/pages/agency/AgencyTeam.tsx` (or wherever `SeatManagementPanel` is rendered) — add "+ Invite Agent" button + dialog
- New: `src/components/agency/InviteAgentDialog.tsx` — copy link + send email
- No DB migrations needed (uses existing tables and edge functions)

## Behavior summary after changes
| Element | Before | After |
|---|---|---|
| Member/Manager button | Toggle | Removed |
| Status dropdown | Active/Suspended/Pending | Active/Suspended/**Remove…** |
| Pending state | Manual label | Auto "Invite not accepted" badge |
| Remove agent | Red icon | Inside dropdown w/ confirm |
| Admin role | Edge fn only, no UI | Owner-only ⋯ menu + badge |
| Invite agent | Hidden | Prominent "+ Invite Agent" button |
