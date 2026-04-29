# Plan: simplify agency launch, listing statuses, wizard validation, and agent approval

## Goal
Make the agency experience feel guided and lightweight: agencies should know exactly what to do after approval, understand each listing’s state in plain English, submit listings without over-fixing optional details, and manage their own agents by default.

## 1. Unify agency-facing listing statuses

### What will change
Create one shared agency-facing status mapper for listings, while keeping the existing database statuses untouched.

Agency UI labels will become:

```text
To review
Ready to submit
Pending BuyWise review
Live
Needs fixes
Archived
```

### Mapping logic
Use a combination of existing fields:

- `verification_status`
- `is_published`
- `agency_review_status`
- hard blocker count from listing quality/completeness
- archived state

Proposed logic:

```text
archived_stale -> Archived
approved + published -> Live
pending_review -> Pending BuyWise review
changes_requested / rejected -> Needs fixes
draft + hard blockers -> To review
draft + no hard blockers -> Ready to submit
needs_edit + hard blockers -> Needs fixes / To review depending severity
```

### UI updates
Update agency-facing places that currently show raw/internal status labels:

- Agency listings table
- Agency listings filters
- Dashboard recent listings preview
- CSV export status column
- Launch/checklist links that filter listings

The listing table will show one primary status badge. Internal raw details can remain in a tooltip or advanced detail line, e.g.:

```text
Live
Advanced: verification=approved, agency=approved_live
```

### Why
Agents should not have to understand internal workflow states. A single status line makes the listing queue easier to act on.

---

## 2. Add a guided agency launch checklist

### What will change
Replace/upgrade the current lightweight “Complete Your Profile” widget into a stronger “Launch your BuyWise presence” checklist for newly approved agencies.

This will appear prominently on the agency dashboard, especially when the agency has not completed launch milestones yet.

### Checklist items
Recommended launch checklist:

1. **Complete agency profile**
   - logo
   - description
   - phone/website/socials
   - service areas
   - specializations
   - links to `/agency/settings`

2. **Invite your team**
   - create/copy invite codes
   - approve pending join requests
   - links to `/agency/team`

3. **Add or import inventory**
   - create listing manually
   - import from website/source
   - links to `/agency/properties/new` and `/agency/import`

4. **Fix listings that need required info**
   - count listings in “To review” / hard-blocked state
   - link to filtered agency listings page

5. **Submit ready listings for BuyWise review**
   - count “Ready to submit” listings
   - link to filtered agency listings page

6. **Get first listing live**
   - completion when at least one listing is live
   - link to agency listings/public page

### UI behavior
- Show it expanded for not-yet-launched agencies.
- Allow collapse once progress is underway.
- Hide or minimize after launch completion.
- Keep it action-oriented: every row should have a direct button/link.

### Technical approach
Use existing agency/team/listing data where possible:

- `useMyAgency`
- `useAgencyTeam`
- `useAgencyJoinRequests`
- `useAgencyListingsManagement`
- `useAgencyStats`

No new database table is required for the first version unless we want to persist dismiss/collapse state later.

### Why
This turns the first login from “empty admin dashboard” into a guided launch program.

---

## 3. Separate hard blockers vs trust boosters in the property wizard

### What will change
Refactor wizard validation so missing information is separated into two groups:

```text
Must fix to submit
Recommended for buyer trust
```

Only “Must fix” items will disable submission. “Recommended” items will show soft guidance but still allow submit.

### Hard blockers
Use these to block submission:

- assigned/active agent for agency-created listings
- price
- city
- neighborhood
- valid address with map pin
- property type
- size or lot size, depending property type
- sqm source for non-land properties
- ownership type for non-land properties
- floor/total floors for apartment-like property types if currently required
- rental-specific required fields for rental listings
- minimum photos
- basic description, but reduce from “long polished description” to a lighter requirement if needed

### Trust boosters
Move these to recommendations instead of blockers:

- long/richer description
- premium explanation/context when it is informational rather than required for suspicious pricing
- extra amenities/features
- featured highlight
- parking/vaad bayit/year built where not essential
- stronger photo coverage beyond the minimum
- additional buyer-trust details

### UI updates
Update:

- `PropertyWizardContext` validation helpers
- `ValidationSummary`
- `StepReview`
- new/edit agent wizard submission buttons
- new/edit agency wizard submission buttons
- progress error badges so hard blockers are visually distinct from recommendations

Review screen will show:

```text
Must fix before submitting
- Add sqm source
- Upload 2 more photos

Recommended for buyer trust
- Add a stronger description
- Add premium explanation
- Add more amenities

You can submit now and improve these later.
```

### Button behavior
- Disable submit only when hard blockers exist.
- Keep soft warnings visible when only trust boosters remain.
- Preserve other true blockers like listing limit, active agent requirement, duplicate hard-blocks, and price-context confirmation when the system explicitly requires confirmation.

### Why
Imported listings often need cleanup. This lets agencies submit a first batch faster without making every optional improvement feel like a blocker.

---

## 4. Let agencies own normal agent approval by default

### Current state
The app already has several pieces in place:

- Agents join via agency invite/code.
- Agency admins can approve/reject join requests in Team Management.
- Agent records have `status`, `approved_at`, and `approved_by` fields.
- Some listing submission flows require `agent.status === 'active'`.

The missing piece is making agency approval the normal activation path instead of implying separate platform-admin verification is required for every agent.

### What will change
When an agency admin approves a join request:

- link the agent to the agency
- set the agent as active, unless flagged/suspended
- set approval tracking fields
- notify the agent
- refresh team/listing permissions

Proposed normal approval update:

```text
agents.agency_id = agency.id
agents.status = 'active'
agents.is_verified = true, if current UI depends on it
agents.approved_at = now()
agents.approved_by = current agency admin user id
agency_join_requests.status = 'approved'
agency_join_requests.reviewed_at = now()
agency_join_requests.reviewed_by = current agency admin user id
```

### Guardrails
Keep platform-admin oversight for edge cases:

- suspicious activity
- suspended/flagged accounts
- compliance checks
- disputed agency membership
- future “BuyWise verified professional” badge, if needed

Do not weaken permissions:

- agency admin can only approve requests for their own agency
- invite codes remain agency-scoped
- seat limits still apply
- RLS/backend permissions remain the source of truth
- no client-side role shortcuts

### UI/copy updates
Update agent registration and team-management copy from:

```text
Once approved by BuyWise...
Agent verification required...
```

to agency-owned wording:

```text
Your agency admin will review your request.
Once your agency approves you, you can manage assigned listings.
```

For platform-admin screens, keep the admin verification capability as an exception workflow, not the default story.

### Database work
Likely no schema change is needed because approval fields already exist. If current RLS prevents agency admins from updating status/approval fields safely, add a secure backend function/RPC for agency-owned approval rather than doing broad client updates.

---

## Implementation phases

### Phase 1: Shared status and validation foundation
- Add agency-facing listing status mapper.
- Add hard-blocker vs trust-booster validation helpers.
- Update submit gating to use hard blockers only.

### Phase 2: Agency listings UI cleanup
- Replace raw status and review badges with one primary human status.
- Update filters to use the six simple labels.
- Keep advanced/internal status in tooltip/details.
- Update dashboard recent listings preview and CSV export.

### Phase 3: Launch checklist
- Replace/upgrade current agency onboarding card.
- Add actionable checklist rows with counts and deep links.
- Connect checklist counts to the new status mapper.

### Phase 4: Agency-owned agent approval
- Update approval mutation to activate approved invited agents.
- Preserve seat-limit and security checks.
- Update registration/team/wizard copy around agent activation.
- Keep platform admin verification available for exceptions.

### Phase 5: QA pass
- Verify new agency first-login dashboard.
- Verify listing status labels across agency dashboard/listings/export.
- Verify imported listings with missing fields show blockers vs recommendations correctly.
- Verify submit button enables when only trust boosters remain.
- Verify agency-approved agents can submit listings after approval.
- Verify suspended/pending/non-approved agents remain blocked.

---

## Files likely to change

- `src/lib/agencyListingStatus.ts` or similar new shared mapper
- `src/components/agent/wizard/PropertyWizardContext.tsx`
- `src/components/agent/wizard/steps/ValidationSummary.tsx`
- `src/components/agent/wizard/steps/StepReview.tsx`
- `src/pages/agent/NewPropertyWizard.tsx`
- `src/pages/agent/EditPropertyWizard.tsx`
- `src/pages/agency/AgencyNewPropertyWizard.tsx`
- `src/pages/agency/AgencyEditPropertyWizard.tsx`
- `src/pages/agency/AgencyListings.tsx`
- `src/components/agency/DashboardListingsPreview.tsx`
- `src/components/agency/AgencyOnboardingProgress.tsx` or a replacement launch checklist component
- `src/pages/agency/AgencyDashboard.tsx`
- `src/hooks/useAgencyListings.tsx`
- `src/hooks/useAgencyManagement.tsx`
- `src/pages/agency/AgencyTeam.tsx`
- `src/pages/agent/AgentRegisterWizard.tsx`

Possibly a backend function/migration only if existing permissions do not safely allow agency-owned activation.

---

## Recommended copy direction

Use simple, encouraging language:

- “Ready to submit” instead of “draft with no missing fields”
- “Needs fixes” instead of “changes_requested” or “needs_edit”
- “Must fix to submit” instead of “errors”
- “Recommended for buyer trust” instead of “warnings”
- “Launch your BuyWise presence” instead of “Complete your profile”

This keeps the portal feeling like a guided partner workflow, not a compliance/admin tool.