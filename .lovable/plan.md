
# Agency-Only Listing Model: Full Implementation Plan

## What This Changes (Summary)

| Actor | Before | After |
|---|---|---|
| Agency admin | View-only listings page, no wizard | Full wizard to create/edit/manage all listings + assign each listing to an agent |
| Agent (with agency) | Create, edit, submit, delete own listings | Read-only view of assigned listings, see stats, manage leads |
| Agent (solo, no agency) | Create own listings | No listing creation — must join an agency |

---

## Technical Understanding of Current State

- **Property creation**: `NewPropertyWizard` (`/agent/properties/new`) uses `useCreateProperty` which auto-fetches the caller's `agents` record by `user_id` and uses that `agent_id`
- **Editing**: `EditPropertyWizard` (`/agent/properties/:id/edit`) also under agent routes
- **Agency listings page**: `AgencyListings.tsx` is currently read-only — just a filterable table with a "View" link, and the "Add Listing" button redirects to `/agent/properties/new` (the agent wizard)
- **Data model**: Properties already have `agent_id` pointing to the assigned agent — this field is already correct for our new model. No schema change needed.
- **`useCreateProperty`** fetches the `agents` record by `user_id` — but agency admins may not have an agent record themselves. We need a new hook `useCreatePropertyForAgency` that accepts an explicit `agent_id` to assign to.

---

## Phases

### Phase 1 — New "Agency New Property Wizard" page
**File created**: `src/pages/agency/AgencyNewPropertyWizard.tsx`  
**File created**: `src/pages/agency/AgencyEditPropertyWizard.tsx`

The agency wizard is a thin wrapper around the existing `PropertyWizardProvider` and all existing step components (StepBasics, StepDetails, StepFeatures, StepPhotos, StepDescription, StepReview) — we reuse all of them since the form fields are identical.

**What's new — Agent Assignment step**: Inserted as Step 1 (index 0), before Basics. This step shows a searchable dropdown of the agency's team members. The wizard now has 7 steps instead of 6:
- Step 0: Assign Agent
- Step 1: Basics
- Step 2: Details
- Step 3: Features
- Step 4: Photos
- Step 5: Description
- Step 6: Review

The `PropertyWizardContext` already has all the data fields. We extend it (or pass props) to carry `assignedAgentId`. On submit, we call a new `useCreatePropertyForAgency` hook that takes an explicit `agent_id`.

**StepAssignAgent component** (`src/components/agency/wizard/StepAssignAgent.tsx`): Renders a card grid of team members with avatar, name, and listing count — user clicks to select. Search input for large teams. Validates that at least one agent is selected before proceeding.

### Phase 2 — New data hook for agency property creation

**File modified**: `src/hooks/useAgentProperties.tsx`  
Add `useCreatePropertyForAgency` mutation:

```typescript
export function useCreatePropertyForAgency() {
  // Same as useCreateProperty but:
  // - Accepts explicit agent_id instead of looking up by current user
  // - Accepts agency entity type for listing limit check
  // - The caller MUST be an authenticated agency admin
}
```

Also add `useUpdatePropertyForAgency` — same as `useUpdateProperty` but navigates back to `/agency/listings` instead of `/agent/properties`.

### Phase 3 — Upgrade AgencyListings to full management

**File modified**: `src/pages/agency/AgencyListings.tsx`

Current state: Read-only table, "Add Listing" links to `/agent/properties/new`

Changes:
- "Add Listing" button → links to `/agency/properties/new`
- Each row gets action buttons: **Edit** (→ `/agency/properties/:id/edit`), **Submit for Review** (if draft), **View** (if approved)
- Add dropdown menu per row: Mark as Sold, Mark as Rented, Duplicate, Delete — all the same actions currently in `AgentProperties.tsx`
- Reuse `useDeleteProperty`, `useSubmitForReview`, `useUpdatePropertyStatus` hooks — they operate on the property ID and don't care who calls them

### Phase 4 — Refactor AgentProperties to read-only "Assigned Listings"

**File modified**: `src/pages/agent/AgentProperties.tsx`

Remove:
- `Plus` / "Add New Listing" button and link to `/agent/properties/new`
- Edit button (link to `/agent/properties/:id/edit`)
- Delete button
- Submit for Review button
- Duplicate action
- Mark as Sold/Rented actions
- Bulk selection bar (bulk delete, bulk renew)
- All mutation hook imports that become unused

Keep:
- Listing cards showing title, address, price, status badge
- View button (→ `/properties/:id`) for approved listings
- Stats display (views count, status)
- Tab filtering by status
- Renewal badge warning (visual only, not actionable by agent)

New header text: "My Assigned Listings" instead of "My Properties"

Add a small info banner at the top: "Listings are created and managed by your agency. Contact your agency admin to make changes."

### Phase 5 — Refactor AgentDashboard quick actions

**File modified**: `src/pages/agent/AgentDashboard.tsx`

Remove:
- "Add New Property" quick action card (href `/agent/properties/new`)
- "Add Property" button in the top-right header area

Keep:
- "Manage Properties" quick action → `/agent/properties` (now read-only view)
- Analytics, Blog, other actions

Update status counts section — agents still see their live/pending/draft counts for their assigned listings.

Update the "Recent Properties" list at the bottom — keep it, but remove the "Edit" button from each item row.

### Phase 6 — Routing changes in App.tsx

**File modified**: `src/App.tsx`

Add new lazy imports:
```typescript
const AgencyNewPropertyWizard = lazy(() => import("./pages/agency/AgencyNewPropertyWizard"));
const AgencyEditPropertyWizard = lazy(() => import("./pages/agency/AgencyEditPropertyWizard"));
```

Add new routes (within existing `<ProtectedRoute>` that checks for agency admin):
```
/agency/properties/new     → AgencyNewPropertyWizard
/agency/properties/:id/edit → AgencyEditPropertyWizard
```

Keep old agent routes but redirect them:
```
/agent/properties/new → redirect to an "Access Denied / Contact Agency" page
/agent/properties/:id/edit → redirect with message "Editing is managed by your agency"
```

We do NOT delete the old routes immediately — we redirect them so any existing bookmarks or emails work gracefully.

### Phase 7 — "No Access" experience for agents trying to create

**File modified**: `src/pages/agent/NewProperty.tsx` (if it exists) / route redirect

When an agent lands on `/agent/properties/new`, show a clean page:
- Icon + heading: "Listings are managed by your agency"
- Body: "Your agency admin creates and manages all property listings. Once a listing is assigned to you, it will appear in your Assigned Listings."
- CTA button: "View My Listings" → `/agent/properties`
- Secondary link: "Contact your agency" → `/agency/:slug` (if we know their agency)

This is a simple redirect/page — not a full wizard.

---

## Files Created

| File | Purpose |
|---|---|
| `src/pages/agency/AgencyNewPropertyWizard.tsx` | Agency property creation wizard with agent assignment step |
| `src/pages/agency/AgencyEditPropertyWizard.tsx` | Agency property editing wizard |
| `src/components/agency/wizard/StepAssignAgent.tsx` | Step 0: pick which team member to assign listing to |

## Files Modified

| File | Change |
|---|---|
| `src/pages/agency/AgencyListings.tsx` | Add Edit/Submit/Delete/Manage actions per row; update "Add Listing" link |
| `src/pages/agent/AgentProperties.tsx` | Strip write actions; rename to "Assigned Listings"; add agency info banner |
| `src/pages/agent/AgentDashboard.tsx` | Remove "Add Property" button and quick action; remove "Edit" from recent properties list |
| `src/hooks/useAgentProperties.tsx` | Add `useCreatePropertyForAgency` and `useUpdatePropertyForAgency` mutations |
| `src/App.tsx` | Add agency wizard routes; redirect old agent creation routes |

---

## No Database Changes Required

The `properties` table already has `agent_id` — we simply populate it from the agency admin's picker instead of auto-assigning it to the current user. All existing RLS and data stays intact.

---

## Edge Cases Handled

| Scenario | Handling |
|---|---|
| Agency has 0 team members | StepAssignAgent shows "No team members yet — invite agents first" with a link to the agency dashboard team tab |
| Agency admin tries to submit without selecting agent | "Assign Agent" step blocks `canGoNext` until an agent is selected |
| Existing agent-created properties | They remain visible in AgencyListings, agency can edit/manage them normally |
| Agent goes to `/agent/properties/new` | Redirect to a clean "managed by agency" page — no 404 |
| Agent with no agency | `AgentProperties` shows their old listings if any exist (backward compatible); new listing creation is blocked with the same "managed by agency" message |

---

## Implementation Order

1. Create `StepAssignAgent` component
2. Create `AgencyNewPropertyWizard` page
3. Add `useCreatePropertyForAgency` hook
4. Create `AgencyEditPropertyWizard` page
5. Upgrade `AgencyListings` with management actions
6. Refactor `AgentProperties` to read-only
7. Update `AgentDashboard` to remove create actions
8. Update `App.tsx` routing
