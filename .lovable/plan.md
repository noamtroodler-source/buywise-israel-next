

# White-Glove Agency Onboarding — Build Plan

A complete, gap-free implementation plan for `/admin/agency-provisioning`. Each phase ends in a working, testable state. Phases are ordered so nothing depends on something that hasn't been built yet.

---

## Phase 1 — Database Foundation

Single migration. Establishes every table, column, enum, RLS policy, and trigger needed by every later phase.

**New tables**
- `provisional_credentials` — encrypted password vault (admin-only RLS, uses `pgcrypto`). Columns: `id`, `user_id`, `agency_id`, `role` (owner/agent), `encrypted_password`, `created_by`, `created_at`, `revealed_at`, `revealed_by`, `delivered_at`.
- `password_setup_tokens` — one-time set-password links. Columns: `token` (UUID PK), `user_id`, `agency_id`, `purpose` (owner_setup/agent_setup), `created_at`, `used_at`. **No expiry** per spec.
- `listing_quality_flags` — flag rows attached to provisioned properties. Columns: `id`, `property_id`, `flag_type` (enum), `severity` (critical/warning/info), `message`, `auto_resolvable`, `resolved_at`, `resolved_by`, `created_at`.
- `agency_provisioning_notes` — admin-only scratchpad per agency. Columns: `id`, `agency_id`, `note`, `created_by`, `created_at`.
- `agency_provisioning_audit` — append-only log of every provisioning action (account created, credential revealed, email sent, handover triggered).

**Column additions**
- `agencies`: `management_status` enum (`draft`, `provisioning`, `quality_review`, `ready_for_handover`, `handed_over`, `claimed`), `provisioned_by`, `provisioned_at`, `handover_completed_at`, `agent_email_strategy` enum (`send_all_now`, `send_after_owner`).
- `agents`: `is_provisional` bool, `completeness_score` int, `pending_fields` text[], `welcome_email_sent_at`.
- `properties`: `provisioning_audit_status` enum (`pending`, `flagged`, `reviewed`, `approved`), `quality_audit_score` int, `provisioned_from_source` text.

**Enums**
- `flag_type`: `missing_field`, `low_photo_count`, `suspicious_value`, `hebrew_only_description`, `agent_unassigned`, `stale_source`, `address_too_vague_for_geocode`.
- All enums and tables use `IF NOT EXISTS` / `CREATE OR REPLACE`.

**RLS**: Admin-only on all new tables. `password_setup_tokens` has a `SECURITY DEFINER` RPC for public token consumption.

---

## Phase 2 — Account Provisioning Edge Functions

- **`provision-agency-account`** — creates `auth.users` row for owner via service role, links to `agencies` record, generates strong password, encrypts and stores in `provisional_credentials`, creates a `password_setup_tokens` row, writes audit log entry.
- **`provision-agent-account`** — same flow for an individual agent. Links to `agents` row + `agency_id`. Marks `is_provisional = true`.
- **`reveal-credentials`** — admin-only. Decrypts and returns password once for display in the UI. Logs the reveal in audit table.

All three: input validation with Zod, CORS headers, JWT verification with admin role check, structured error responses.

---

## Phase 3 — Admin UI: Agency + Agent Setup

New page `/admin/agency-provisioning` with sidebar list of in-progress agencies + a workspace pane.

**Section A — Agency Profile**
- Form: name, slug, logo upload, bio, cities covered, website, social links, office address, owner name + real email + phone.
- "Provision Agency Account" button → calls `provision-agency-account` → status flips to `provisioning`.
- Agent email strategy toggle (send all now / send after owner approves).

**Section B — Agent Roster**
- Add agents one at a time via a form (real name, real email, phone, photo, bio, license, specializations, languages).
- Live completeness score display per agent.
- "Provision Agent Account" button per row.
- Roster table shows status pill per agent (provisioned / pending email / completed).

**Sidebar navigation**
- Lists every agency in `provisioning` / `quality_review` / `ready_for_handover` states with progress %.

---

## Phase 4 — Listing Audit + Auto-Enrichment Edge Function

**`audit-and-enrich-listings`** — runs over a batch of properties belonging to one agency.

For each property:
1. **Auto-translate** Hebrew description → English (Lovable AI / Gemini Flash). Replaces description if originally Hebrew-only.
2. **AI rewrite** if description below quality threshold (too short, all caps, low signal). Otherwise keeps original.
3. **Smart geocode**: only auto-geocode if address contains a numeric house number (regex check). Otherwise insert `address_too_vague_for_geocode` flag.
4. **AI suggest missing fields** from photos + description (year_built, condition, parking, etc.) — stored as suggestions, not auto-applied.
5. **Generate flag rows** in `listing_quality_flags`:
   - critical: `agent_unassigned`, missing price/size/bedrooms/address
   - warning: `low_photo_count` (<5), `suspicious_value` (3x city median check), `hebrew_only_description` (post-translate fallback only)
   - info: `stale_source` (>90 days)
6. **Try to assign agent** by matching scraped phone → existing agent in agency roster. Fallback: name match. Fallback: leave unassigned + critical flag.
7. Compute `quality_audit_score` (0–100) and `provisioning_audit_status`.

Runs as a background job using `EdgeRuntime.waitUntil` so the admin UI doesn't time out.

---

## Phase 5 — Admin UI: Listings + Quality Dashboard

**Section C of `/admin/agency-provisioning`**

- "Import Listings" button → triggers existing scrape pipeline → on completion auto-fires `audit-and-enrich-listings`.
- Listings table with columns: thumbnail, address, price, assigned agent, status badge (✅/⚠️/🔴), score, flag count.
- Filter chips: All / Ready / Needs Review / Critical.
- Bulk actions: "Mark reviewed", "Assign to agent", "Apply AI suggestions", "Hide from handover".
- Per-listing detail drawer: full flag list, AI suggestions to accept/reject, agent assignment dropdown, manual edit fields.
- **Top-of-section summary card** (the "don't overwhelm" point): "67 ready · 23 need review · 10 critical — only critical/warnings need your attention before handover." Owner-facing version (Phase 7) shows only the consolidated summary, not the full flag noise.

---

## Phase 6 — Set-Password Public Page

- Route: `/auth/setup-password?token=xxx` (public, no auth required).
- Validates token via SECURITY DEFINER RPC `consume_password_setup_token(token)`.
- User sets their own new password → password updated via Supabase Admin API in an edge function `complete-password-setup`.
- Token marked `used_at`. Provisional credential row marked `delivered_at`.
- Redirects to `/agency` (owner) or `/agent` (agent) dashboard on success.
- Handles already-used tokens, invalid tokens with friendly messaging.

---

## Phase 7 — Welcome Email System

**Edge functions**
- `send-owner-welcome-email` — sends "Your BuyWiseIsrael account is ready" email with set-password link to the agency owner. Includes a polished summary: "We've set up X agents and Y listings for you. Once you log in, here are the things we'd like you to confirm." (Consolidated, non-overwhelming view of remaining flags.)
- `send-agent-welcome-emails` — sends set-password link to each agent in the roster.

**Email templates** built via the Lovable transactional email scaffold (BuyWiseIsrael sender, no co-branding per spec).

**Admin UI Section D — Handover**
- "Hand Over Agency" button (enabled when status = `ready_for_handover`).
- Confirmation dialog showing: # agents being emailed, # listings ready, agent email strategy in effect.
- On confirm: sends owner email immediately. If strategy = `send_all_now`, also sends all agent emails. If `send_after_owner`, marks agents `pending` and exposes a "Send Welcome Emails to My Agents" button on the owner's dashboard after they log in.
- Status flips to `handed_over`.

---

## Phase 8 — Owner Dashboard "Pending Items" Surface

- New widget on `/agency` dashboard for `is_provisional = false` agencies that just transitioned from `handed_over`: shows the consolidated quality flags ("3 agents missing license · 8 listings need photos · 2 listings need agent assignment") with one-click jumps to the relevant edit screen.
- "Send welcome emails to my agents" button (only when strategy was `send_after_owner` and there are unsent agents).
- Dismissible after first review.

---

## Phase 9 — Admin Operations + Safety

- `/admin/agency-provisioning` index showing all agencies and their lifecycle state.
- "Reveal Credentials" admin-only modal (re-prompts password before showing — defense in depth).
- "Resend Setup Link" button (generates fresh token, voids old).
- Audit log viewer per agency (uses `agency_provisioning_audit`).
- Provisional account marker in `auth.users.raw_user_meta_data` so they're distinguishable from self-signups.

---

## Phase 10 — End-to-End QA Walkthrough ✅ (manual, owner-driven)

Manual scenarios to verify (run as needed in the live app):
1. Provision agency → owner gets set-password email → sets password → lands in agency dashboard.
2. Provision 5 agents with `send_after_owner` → owner logs in → clicks "Send to my agents" → agents receive emails.
3. Import 100 listings → audit runs → quality dashboard shows accurate flag counts → translations applied → vague-address listings flagged not geocoded.
4. Owner-side "pending items" widget renders clean summary, not raw flag firehose.
5. Reveal credentials modal logs the action.
6. Token re-use blocked with clear error.
7. Admin can resend a setup link without breaking the user's existing record.

---

## Out of Scope (deliberate, per prior decisions)

- Consent record requirement (you confirmed you don't need it).
- Token expiry (never expires until used).
- Magic-link claim flow (skipped in favor of direct set-password).
- Co-branded email sender identity.
- Bulk-paste agent CSV (one-by-one only, per your preference).

