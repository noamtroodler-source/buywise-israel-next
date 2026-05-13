## Goal
Make **Admin** functionally identical to **Owner**. Owner becomes a historical "founder" label only — no extra powers.

## Changes

### 1. Permissions hook — `src/hooks/useAgencyPermissions.ts`
Flip the two owner-only gates to admin-level:
- `canTransferOwnership: isAdmin` (was `isOwner`)
- `canDeleteAgency: isAdmin` (was `isOwner`)

Keep `isOwner` exposed (still useful for displaying the founder badge), but no capability depends on it anymore.

### 2. UI gates
- **`src/components/agency/AgencyDangerZone.tsx`** — change `if (!perms.isOwner)` → `if (!perms.isAdmin)` so admins see Delete Agency / dangerous actions.
- **`src/components/agency/AgencyAdminsPanel.tsx`** — already uses `perms.canTransferOwnership` for the transfer button, so it auto-unlocks for admins. Update the label/tooltip on the Owner row from "Owner (only one)" framing to "Founder — same permissions as Admins".
- **`src/components/admin/agency-provisioning/AgentRosterSection.tsx`** — no change needed (platform-admin scoped).

### 3. Edge function — `supabase/functions/agency-promote-member/index.ts`
- **`demote` action**: currently blocks demoting an Owner ("Transfer ownership before demoting the owner"). Change to allow demoting an Owner provided **at least one other Owner or Admin remains** (the existing last-admin DB trigger handles the floor; we just remove the explicit owner block).
- **`promote` action**: no change.
- **`set_primary` action**: no change (still picks from owner+admin pool).

### 4. RLS audit (read-only check before edits)
Quick `psql` scan of policies on `agencies`, `agency_members`, billing-related tables for any `role = 'owner'` checks. If found, broaden to `role IN ('owner','admin')` via a single migration. If none exist (most policies use `has_agency_role(...,'admin')` which already includes owner), no migration needed.

### 5. Copy / labels
Replace any "Owner only" / "Only the owner can…" microcopy in the agency dashboard with neutral labels. The Owner badge remains visible as a founder marker with a tooltip: *"Original registrant. Has the same permissions as any Admin."*

### 6. Memory update
Update `mem://auth/portal-access-control` to record: **Owner and Admin have identical permissions; Owner is a display-only founder label.** Prevents future regressions.

## Out of scope
- Primary contact mechanics (separate earlier discussion).
- Platform-admin (BuyWise staff) flows — unchanged.
- Agency invite / agent role logic — unchanged.

## Files touched
- `src/hooks/useAgencyPermissions.ts`
- `src/components/agency/AgencyDangerZone.tsx`
- `src/components/agency/AgencyAdminsPanel.tsx`
- `supabase/functions/agency-promote-member/index.ts`
- (conditional) one new SQL migration if RLS still references `'owner'` directly
- `mem://auth/portal-access-control`
