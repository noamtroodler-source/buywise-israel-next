
# Owner vs Admin: Full Operational Admin Model

## The current reality (what we have)

The codebase only knows ONE role: `agencies.admin_user_id` (a single user pointer). `useMyAgency().isAgencyAdmin` is just `user.id === agency.admin_user_id`. Every gated page (`AgencyTeam`, `AgencyBilling`, `AgencySettings`, `AgencyImport`, `AgencyFeatured`, `AgencySources`, etc.) uses that one boolean. The `agents.agency_role` column exists but defaults to `'member'` and isn't used for gating.

We need to evolve this into: **1 Owner + N Admins + N Agents**, where Admins can do everything except destroy/transfer the agency.

## Final permission matrix (source of truth)

| Capability | Owner | Admin | Agent |
|---|:---:|:---:|:---:|
| Manage own listings & leads | ✅ | ✅ | ✅ (own only) |
| Invite / remove agents | ✅ | ✅ | ❌ |
| Promote agent ↔ Admin | ✅ | ✅ | ❌ |
| Edit agency profile, branding, sources | ✅ | ✅ | ❌ |
| Approve imports, resolve conflicts | ✅ | ✅ | ❌ |
| Featured placement management | ✅ | ✅ | ❌ |
| Full agency analytics | ✅ | ✅ | ❌ (own only) |
| **Billing — invoices, plan, payment method, cancel** | ✅ | ✅ | ❌ |
| Set/change Primary Contact | ✅ | ✅ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ |
| Delete agency | ✅ | ❌ | ❌ |
| Demote/remove the Owner | ✅ (self only) | ❌ | ❌ |

Roles are **additive** — one user can be Owner + Admin + Agent simultaneously. No exclusivity.

## Database changes

### 1. New table: `agency_members` (the multi-admin source of truth)
```
agency_members
- id (uuid, pk)
- agency_id (uuid, fk agencies)
- user_id (uuid, fk auth.users)
- role text check in ('owner','admin')   -- 'agent' lives in agents table, not here
- is_primary_contact boolean default false
- created_at, created_by
- UNIQUE (agency_id, user_id, role)
- Partial unique: ONE owner per agency, ONE primary_contact per agency
```

Why a new table instead of reusing `agents.agency_role`: an Owner/Admin doesn't have to be a licensed selling agent. Keeping office-management roles separate from the sales `agents` table avoids polluting agent-facing analytics/leads with non-selling staff.

### 2. Keep `agencies.admin_user_id` as the **Owner pointer** (rename in code, not in DB)
Backfill: every existing `admin_user_id` → seed an `agency_members` row with `role='owner'` AND `role='admin'` AND `is_primary_contact=true`. No one loses access on day one.

### 3. Security-definer helpers (avoid RLS recursion)
```
is_agency_owner(_uid uuid, _agency uuid) returns boolean
is_agency_admin(_uid uuid, _agency uuid) returns boolean   -- true if owner OR admin
is_agency_member(_uid uuid, _agency uuid) returns boolean  -- owner/admin/agent
get_my_agency_role(_agency uuid) returns text              -- 'owner'|'admin'|'agent'|null
```

### 4. Update RLS policies
Sweep every `agencies`/`properties`/`leads`/`agency_*` policy that currently checks `admin_user_id = auth.uid()` and replace with `is_agency_admin(auth.uid(), agency_id)`. Owner-only destructive policies (delete agency, transfer ownership) keep the strict `is_agency_owner` check.

## Backend (edge functions) changes

| Function | Change |
|---|---|
| `provision-agency-account` | After creating the user, also insert an `agency_members` row with `role='owner'` + `role='admin'` + `is_primary_contact=true`. |
| New: `agency-promote-member` | Promote an existing agent → Admin (or demote). Caller must be Owner or Admin. |
| New: `agency-transfer-ownership` | Move `owner` role from current Owner → target Admin. **Caller must be the current Owner.** Atomic: remove old owner row, insert new. |
| New: `agency-delete` | Hard-delete the agency and cascade. Owner-only. Confirmation required (typed agency name). |
| `handover-agency` | Updated to use the new owner-only check. |

All new functions: zod-validated input, JWT-validated caller, service-role for writes, audit log.

## Frontend changes

### Hooks
- Replace `useMyAgency().isAgencyAdmin` with a richer `useAgencyPermissions(agencyId?)` returning:
  ```ts
  { role, isOwner, isAdmin, canManageBilling, canManageTeam,
    canEditAgency, canManageListings, canTransferOwnership, canDeleteAgency, isLoading }
  ```
  `isAdmin` is `true` for both Owner and Admin (since Admin = Owner − 3 destructive actions). All gated pages just check `isAdmin`. Only the Settings → "Danger Zone" tab checks `isOwner`.
- New `useAgencyMembers(agencyId)` — list owner + admins (separate from `useAgencyTeam` which is the sales roster).

### Route guards (`ProtectedRoute`)
- Add `requirePermission?: 'admin' | 'owner'` prop. Default behavior unchanged.
- `/agency/settings/danger` and any future destructive route → `requirePermission="owner"`.

### UI updates
1. **Agency Team page** (`AgencyTeam.tsx`)
   - New "Roles & Access" subsection at the top showing: Owner (1), Admins (N), Agents (N).
   - Each agent row gets a kebab menu: "Promote to Admin" / "Demote to Agent".
   - Each Admin row: "Make Primary Contact", "Transfer Ownership" (Owner-only, only on Admin rows), "Demote to Agent".
   - Confirm dialogs for every promote/demote.

2. **Agency Settings page** — split into tabs:
   - **General** (profile, branding) — Admin
   - **Sources & Imports** — Admin
   - **Billing** entry point — Admin
   - **Danger Zone** — Owner only: Transfer Ownership, Delete Agency

3. **Agency Billing page** (`AgencyBilling.tsx`)
   - Replace the `!isAgencyAdmin → access denied` block with `!canManageBilling`. Admins now pass through. Copy update: "Admin access required" stays accurate since Admin is the new floor.

4. **Provisioning (white-glove) page** (`AdminAgencyProvisioning.tsx`)
   - In the agency-creation form, add an "Also make this person an active Admin (recommended)" checkbox (default ON). Pass through to `provision-agency-account` so the seed user gets owner+admin+primary_contact.
   - In **HandoverSection**, add a "Primary Contact" picker (defaults to the Owner; can pick any Admin) before sending the handover email.

5. **Header / portal switcher** — already context-switches; no nav changes needed. A user with `agent + admin` roles already sees both portal links.

### Erez Real Estate retroactive fix (one-time)
A second migration step (data migration via `insert`-tool, not schema):
- Identify Erez's record. Wipe `admin_user_id` placeholder if it points at a ghost user, OR keep it.
- Insert the office-manager agent's `auth.users.id` into `agency_members` as `role='admin'` + `is_primary_contact=true`. Leave `owner` row empty/pending (allowed — Owner is optional after seed).
- Add UI banner on agency dashboard: "Owner not yet assigned — contact BuyWise to claim ownership" (only visible to Admins, suppressible).

## Edge cases & guards

1. **Agency with no Owner** — fully allowed. All ops still work via Admins. Only the 3 destructive ops are blocked with a clear "Owner required" message.
2. **Last Admin tries to demote themselves** — blocked: "You're the last Admin. Promote someone first."
3. **Owner tries to demote themselves** — only allowed via "Transfer Ownership" flow (atomic). No orphaned-owner state.
4. **Deleting a user who is Owner of an agency** — `delete-account` edge function refuses unless ownership is transferred or agency is deleted first. Already partially handled; tighten with the new helper.
5. **Promote an agent who isn't on the agents table** — flow always creates/links an `agency_members` row keyed on `auth.uid`, independent of `agents` table. Office managers who don't sell never need an `agents` row.
6. **Audit log** — every promote/demote/transfer/delete writes to existing `agency_audit_log` (or `provisioning_audit_log`) with actor, target, action, timestamp.
7. **Realtime UI** — invalidate `['myAgency']`, `['agencyMembers']`, `['userRoles']` on every mutation so portal access updates without refresh.
8. **Email notifications** — promote/demote/ownership-transfer triggers a Resend email to the affected user ("You're now an Admin of {agency}").

## Rollout order (single PR per step, each ships independently)

1. **DB migration**: create `agency_members`, helpers, backfill from `admin_user_id`, update RLS. (No UI change yet — old code keeps working because helpers also accept the legacy `admin_user_id`.)
2. **Hooks**: ship `useAgencyPermissions` + `useAgencyMembers`. Refactor existing pages to use them but keep behavior identical.
3. **Edge functions**: `agency-promote-member`, `agency-transfer-ownership`, `agency-delete`. Update `provision-agency-account` to seed `agency_members`.
4. **Team UI**: roles section + promote/demote menu.
5. **Settings UI**: Danger Zone tab + ownership transfer + delete agency.
6. **Provisioning UI**: "also make Admin" checkbox + primary-contact picker.
7. **Erez data fix**: one-off insert via insert tool. Verify in Lovable.

## Out of scope (intentionally deferred)
- Self-serve agency signup changes (you white-glove 100% today; revisit when self-serve volume picks up).
- Granular per-Admin permissions (can-do-billing-but-not-team, etc.) — current flat Admin role is plenty.
- Multi-Owner agencies — single Owner is the legal/billing simplification we want.

---

Say **"go"** and I'll start with step 1 (DB migration). Each step ends with a verification you can click through in the preview before I move to the next.
