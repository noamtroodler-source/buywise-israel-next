# Agent Invite Claim Flow

## Goal

When an agent signs up through an agency invite link, automatically attach them to the **existing provisional agent row** that the agency already imported (with their pre-assigned listings) instead of creating a duplicate empty profile.

## Matching strategy

Run server-side against unclaimed agents (`agency_id = X AND user_id IS NULL`) in this priority:

1. **License number** match → auto-claim (highest confidence — license numbers are unique to a person)
2. **Phone number** match (normalized: digits only, last 9) → auto-claim
3. **Email** match (case-insensitive) → auto-claim
4. **Name fuzzy match** (normalized: lowercase, strip diacritics, Levenshtein ≤ 2) → **return as suggestion, do not auto-claim**. Show a "Is this you?" confirmation screen in the signup wizard.

If nothing matches → create a fresh agent row like today.

## What "claim" does

Update the existing provisional row in place:
- Set `user_id` to the new auth user's id
- Overwrite `name`, `email`, `phone`, `license_number`, `bio`, `languages`, `specializations`, `years_experience` with whatever the agent entered in the wizard (their input is the source of truth)
- Set `is_provisional = false`, `joined_via = 'invite_code'`, `email_verified_at = now()`, `status = 'active'`, `approved_at = now()`
- Insert `agent` role into `user_roles`

**No new agent row is created.** All `properties.agent_id` references stay intact → listings appear in the agent's dashboard on first login.

## Pieces to build

### 1. Edge function `claim-or-create-agent` (new)

Runs with service-role key, validates JWT in code.

**Input (Zod-validated):**
```
{
  agency_id: uuid,
  name: string,
  email: string,
  phone?: string,
  license_number?: string,
  bio?: string,
  languages?: string[],
  specializations?: string[],
  years_experience?: number,
  confirm_claim_agent_id?: uuid   // present when user confirmed a fuzzy match
}
```

**Logic:**
- Verify caller JWT, extract `user_id`.
- If `confirm_claim_agent_id` is set → validate it's unclaimed + in this agency, then claim it.
- Otherwise run the 4-tier match against `agents` where `agency_id = input.agency_id AND user_id IS NULL`.
- Tiers 1–3 → claim immediately, return `{ status: 'claimed', agent }`.
- Tier 4 (name fuzzy) → return `{ status: 'needs_confirmation', candidate: {id, name, listing_count, license_number} }`. Do NOT modify anything.
- No match → insert new agent row, return `{ status: 'created', agent }`.
- Always insert the `agent` role into `user_roles` (ignore duplicate-key error).

### 2. Update `useAgentRegistration` hook

Replace the direct `INSERT` with a call to `supabase.functions.invoke('claim-or-create-agent', { body })`. Return the function's `{ status, agent, candidate }` payload to the caller.

### 3. Add a "Is this you?" step to `AgentRegisterWizard`

In `handleSubmit`:
- Call the mutation.
- If response is `status: 'needs_confirmation'` → open a confirmation dialog showing the candidate: `"We found Sarah Cohen on the {agency} roster with 8 listings already assigned. Is this you?"` with two buttons:
  - **"Yes, that's me"** → re-call mutation with `confirm_claim_agent_id: candidate.id`
  - **"No, I'm new here"** → re-call mutation with an explicit `skip_match: true` flag to force creation
- On `claimed` or `created` → continue with existing welcome-email + agency-notification flow.

### 4. Dialog component `ClaimAgentConfirmDialog`

Simple shadcn `AlertDialog` showing candidate name, license number (if any), listing count, and the two action buttons. Loading state on the chosen button while the second mutation runs.

## Edge cases handled

- **Double-claim race**: the edge function re-checks `user_id IS NULL` inside the UPDATE's WHERE clause; if another session claimed first, it falls through to "create new".
- **Empty license / phone**: skipped from matching when blank — never matches `NULL = NULL`.
- **Wrong agency**: matching is scoped to `agency_id` in the invite, so an agent invited to Agency A can never claim a provisional row in Agency B.
- **Already-claimed account signing up again**: if the auth user already has an agent row, return it instead of creating/claiming.

## Verification (mandatory before declaring done)

1. **Dry-run query**: pick a real provisional agent row (e.g., Sarah Cohen) and confirm matching tiers find it via license/phone/email/name in a test SELECT.
2. **License path**: simulate signup with matching license_number → confirm the existing row's `user_id` is set, `is_provisional = false`, and `properties.agent_id` count is unchanged.
3. **Fuzzy-name path**: simulate signup with name "Sara Cohen" (typo) → confirm response is `needs_confirmation`, no DB writes happened, then confirm → row claimed.
4. **No-match path**: simulate signup with unrelated identity → confirm a fresh row is created.
5. **Listings visibility**: after claiming, query `properties WHERE agent_id = claimed.id` to verify the 8 listings are now visible to the new user.
6. **Deploy** the edge function and confirm no console errors during a real wizard run.

## Technical notes (for reference)

- Files touched:
  - new: `supabase/functions/claim-or-create-agent/index.ts`
  - new: `src/components/agent/ClaimAgentConfirmDialog.tsx`
  - edited: `src/hooks/useAgentRegistration.tsx`
  - edited: `src/pages/agent/AgentRegisterWizard.tsx` (and `AgentRegister.tsx` if it shares the same submit path)
- No DB schema changes needed — `is_provisional`, `joined_via`, `user_id` already exist on `agents`.
- Phone normalization: strip non-digits, keep last 9 digits (handles `+972`, `0`, spaces, dashes).
- Name normalization: `toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim()`.
- Levenshtein implemented inline (small util, ~20 lines).
- Matching is per-agency only, so worst case it scans ~50 rows — no index needed.
