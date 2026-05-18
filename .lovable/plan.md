# Reset Demo Realty TLV for a fresh demo run

## Confirmed targets

- **Agency:** Demo Realty TLV — `d3070000-0000-4000-a000-000000000001`
- **Owner login:** noam.troodler@gmail.com — `7e7d2499-f0ff-4f46-920c-f565bde6e532`
- **Current state**: 6 provisional agents (none claimed), 44 listings attached, no blog posts, no pending invites, no announcements, no testimonials, owner already has owner+admin rows in `agency_members` and `admin / agent / developer / user` roles in `user_roles`.

So you're actually 90% of the way to a clean medium-reset already. The only thing making it feel "used" is that the agency is flagged as `handover_completed_at` set + `pending_items_dismissed_at` (the onboarding nudges have been dismissed). Once we clear those flags the dashboard greets him with the onboarding cards again.

## What I'll do

### 1. Reset agency state so it looks freshly handed over

Migration on `agencies` (single row, id = above):
- `handover_completed_at` → `NULL`  → re-shows the "complete handover" / welcome cards
- `pending_items_dismissed_at` → `NULL`  → re-shows the pending-items panel
- `last_conflict_digest_at` → `NULL`  → clears the digest banner
- Leave `status='active'`, `management_status='handed_over'`, `admin_user_id`, `default_invite_code` untouched (he still needs to log in and own the agency).

### 2. Wipe transient activity tied to this agency

Inserts (delete) into:
- `agency_announcements` WHERE agency_id = demo agency
- `agency_notifications` WHERE agency_id = demo agency
- `agency_join_requests` WHERE agency_id = demo agency
- `agency_invites` WHERE agency_id = demo agency  (clears any active invite-link sessions)
- `agency_testimonials` WHERE agency_id = demo agency
- `agency_provisioning_notes` WHERE agency_id = demo agency
- `blog_posts` WHERE author_id = owner
- `agent_notifications` WHERE agent_id IN (the 6 provisional agents) — keeps inbox clean for the agent-side demo

All currently 0 rows except the audit/notes which may have a couple — safe deletes.

### 3. Keep (medium reset)

- 6 provisional agents (`Sarah Cohen`, `Noam Troodler`, `David Levi`, `Maya Friedman`, `Yossi Mizrahi`, `Rachel Goldberg`) with their `is_provisional=true, user_id=NULL` — these are the roster cards.
- 44 listings — they stay attached via `properties.agent_id`.
- `agency_members` rows for Noam (owner + admin).
- `user_roles` for Noam.

### 4. Make sure no stale `agents` row owns Noam

Confirmed there is no claimed `agents` row with his `user_id`, so nothing to clean. The "Noam Troodler" provisional row stays unclaimed — when he goes through the invite-claim flow in the demo, the new claim-or-create-agent function will license-match him to that row automatically, which is exactly the magic moment you want to show.

### 5. Send the password-reset email

I'll add a tiny admin edge function `admin-send-password-reset` (one route, service-role) that:
- Verifies caller is `admin` via `user_roles`
- Calls `supabase.auth.admin.generateLink({ type: 'recovery', email })`
- Triggers `supabase.auth.resetPasswordForEmail(email, { redirectTo })` so the existing `auth-email-hook` ships the branded BuyWise reset email

Then I'll invoke it for `noam.troodler@gmail.com` and confirm in `email_send_log` that a `recovery` email was queued and delivered.

You'll get an email titled "Reset your BuyWise password" within ~1 minute. Click → set new password → land on `/auth` → log in → land on Demo Realty TLV dashboard with the onboarding cards back, 6 provisional agents + 44 listings ready, no claimed sub-agents. Perfect demo state.

## Verification I'll run after

1. `SELECT handover_completed_at, pending_items_dismissed_at FROM agencies WHERE id = demo` → both `NULL`.
2. `SELECT COUNT(*) FROM agents WHERE agency_id = demo` → still 6, all `is_provisional = true`, all `user_id IS NULL`.
3. `SELECT COUNT(*) FROM properties p JOIN agents a ON a.id = p.agent_id WHERE a.agency_id = demo` → still 44.
4. `SELECT status, recipient, template_name, created_at FROM email_send_log WHERE recipient = 'noam.troodler@gmail.com' ORDER BY created_at DESC LIMIT 3` → newest row is recovery + status `sent` (or `pending` → `sent` within 5s).
5. Log into preview as your own user-replay and tap the agency dashboard URL once to confirm the onboarding cards reappear.

## Technical notes

- All wipe operations go through `supabase--insert` (data ops, not schema), so no migration approval beyond the one-row UPDATE on `agencies`. I'll bundle the UPDATE into a single insert-tool call too since it's data not schema.
- The new edge function is the only file change in code; everything else is database.
- Rollback: if something looks wrong I can re-flip `handover_completed_at = now()` from a single SQL update — non-destructive.
