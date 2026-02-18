
# Seat Management — Complete Build Plan

## What Currently Exists

The seat system has partial implementation:

- `useSeatLimitCheck` — reads current count vs. plan limit, exposes `isOverLimit`, `canInvite`, `currentSeats`, `maxSeats`
- `UsageMeters` — shows a seat progress bar with overage cost estimate when over limit
- `AgencyDashboard` — Team tab shows seat count badge and a soft warning when at 100%
- `RemoveAgentDialog` — removes an agent (sets `agency_id = null`)
- Agent status dropdown — can set each agent to `active`, `suspended`, or `pending`
- Join request approve/reject flow — exists but has **no overage consent** before approving

### What's Missing

1. **No seat-level role system** — all agents are equal; there's no way to designate a team lead, manager, or limit what a specific seat-holder can do
2. **No overage consent on join request approval** — when approving a request that pushes the count over the seat limit, admin clicks "Approve" with zero warning or acceptance of the ₪100/seat overage charge
3. **No overage consent on invite code creation path** — creating an invite code when at-limit has no consent gate either (the code is created and someone joins without the admin accepting the charge at that moment)
4. **No "suspend seat" vs "remove seat" distinction** — suspending makes the agent inactive but the seat is still consumed; there's no UI that makes this distinction clear
5. **No seat activity visibility** — no way to see when an agent last was active, how many listings they have, or identify "dead seats" occupying quota
6. **No seat management panel** — the Team tab is purely a list; there's no consolidated view of seat usage, cost, and agent activity that would help an admin make decisions about who to remove

---

## What We're Building

### Feature 1 — Agent Role Column (DB + UI)

Add an `agency_role` column to the `agents` table with values: `member` (default), `manager`.

- `manager` = can create/edit listings on behalf of other agents; future-proofed for more permissions
- `member` = standard seat holder

This is a **light addition** — no RLS impact, no permission enforcement in this phase. It's structural groundwork and visible in the UI so admins can label who is a team lead.

**DB change:** `ALTER TABLE public.agents ADD COLUMN agency_role text NOT NULL DEFAULT 'member';`

### Feature 2 — Seat Overage Consent on Join Request Approval

Currently the "Approve" button in `AgencyDashboard` calls `approveRequest.mutate(...)` directly with no warning when `isOverLimit` is true.

**Fix:** When `isOverLimit` is true, clicking "Approve" first opens a small `SeatOverageConsentDialog` that:
- Shows current seat count and max
- Shows the ₪100/seat monthly overage charge from the live DB rate
- Has a checkbox to accept
- Only then calls `approveRequest.mutate(...)`

This mirrors exactly how `OverageConsentBanner` works for listings.

**Files touched:**
- New: `src/components/agency/SeatOverageConsentDialog.tsx`
- Edit: `src/pages/agency/AgencyDashboard.tsx` — wrap the Approve button with consent dialog when `isOverLimit`

### Feature 3 — Seat Activity Panel (New Component)

Replace the plain agent list in the Team tab with a richer `SeatManagementPanel` that shows per-agent:

- Avatar + name + email
- `agency_role` badge (Manager / Member) — click to toggle
- Active listing count (query `properties` by `agent_id`)
- Last active date (from `agents.last_active_at`)
- Status dropdown (existing `active` / `suspended` / `pending`)
- "Dead seat" indicator: amber badge if agent has 0 listings and was last active > 30 days ago — helps admin spot seats to reclaim
- Remove button (existing `RemoveAgentDialog`)

This is a new component `src/components/agency/SeatManagementPanel.tsx` that replaces the inline list in `AgencyDashboard`.

**Data needed:** listing counts per agent. The hook `useAgencyStats` already fetches agent IDs; we'll extend `useAgencyTeam` to also return listing counts per agent via a joined query.

### Feature 4 — Seat Summary Header Card

At the top of the Team tab, before the agent list, add a `SeatSummaryCard` showing:

```
[ 3 / 5 seats used ]  [ ₪100/extra seat/month ]  [ Upgrade Plan → ]
[████████░░] 60%
```

- Green when under limit, amber at 80%+, red when over
- If over limit: "You are X seats over. Est. monthly overage: ₪Y"
- Upgrade CTA links to `/pricing`

This replaces the current badge-only display in the `CardHeader`.

**File:** New `src/components/agency/SeatSummaryCard.tsx`

### Feature 5 — Invite Code Seat Awareness

When `isOverLimit` is already true and admin opens `CreateInviteDialog`, the dialog shows a persistent amber warning:

> "You are currently over your seat limit. Any agent who joins via this code will add to your overage charges at ₪100/seat/month."

This is informational only — no consent checkbox needed (they already accepted by creating the code). But it's honest about the financial implication.

**File touched:** `src/components/agency/CreateInviteDialog.tsx` — add `isOverLimit` conditional banner

---

## Files Summary

| File | Type | Change |
|---|---|---|
| DB migration | New | Add `agency_role` column to `agents` table |
| `src/components/agency/SeatOverageConsentDialog.tsx` | New | Consent dialog before approving a join request over seat limit |
| `src/components/agency/SeatManagementPanel.tsx` | New | Rich per-agent card with role, listing count, last active, dead seat badge |
| `src/components/agency/SeatSummaryCard.tsx` | New | Seat usage summary header for the Team tab |
| `src/hooks/useAgencyManagement.tsx` | Edit | Extend `useAgencyTeam` query to include listing count per agent; add `useUpdateAgentRole` mutation |
| `src/pages/agency/AgencyDashboard.tsx` | Edit | Replace inline agent list with `SeatManagementPanel`; add `SeatSummaryCard`; wire overage consent dialog to Approve button |
| `src/components/agency/CreateInviteDialog.tsx` | Edit | Add over-limit warning banner when `isOverLimit` is true |

---

## Technical Notes

- The `agency_role` column uses a plain `text` type (not enum) to avoid migration complexity, with the application enforcing valid values (`'member'` | `'manager'`). No RLS changes needed.
- `SeatOverageConsentDialog` fetches the live seat overage rate from `overage_rates` table using `useOverageRate('agency', 'seat')` — same pattern as `OverageConsentBanner`.
- Listing counts per agent are computed in the extended `useAgencyTeam` query using a single Supabase call: select agents + properties count via `properties!agent_id(count)` using the PostgREST embed syntax.
- `last_active_at` already exists on the `agents` table — no DB change needed for the dead seat indicator.
- The "dead seat" threshold (0 listings + last active > 30 days) is computed client-side in the component — no DB function needed.
- No changes to RLS policies — all reads are already scoped to the admin's agency via existing policies.
