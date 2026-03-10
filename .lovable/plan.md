

# Enable Agent-Level Listing Creation & Management

## Current State
- Agents are **locked out** of creating/editing listings — both `/agent/properties/new` and `/agent/properties/:id/edit` redirect to the properties list
- The `AgentProperties` page shows a banner: "Listings are created and managed by your agency. Contact your agency admin to make changes."
- The agent `NewPropertyWizard` and `EditPropertyWizard` **already exist** with full functionality but are disconnected
- The agency wizard has Step 0 (Assign Agent) — this stays as-is for admin-created listings
- The `useCreateProperty` hook already handles agent-level creation correctly (sets `agent_id` from the logged-in agent)

## What Changes

### 1. Restore Agent Listing Creation Route
**File: `src/App.tsx`**
- Change `/agent/properties/new` from `<Navigate>` redirect back to rendering `<NewPropertyWizard />`
- Change `/agent/properties/:id/edit` from `<Navigate>` redirect back to rendering `<EditPropertyWizard />`

### 2. Update Agent Dashboard — Add "New Listing" Action
**File: `src/pages/agent/AgentDashboard.tsx`**
- Add a `+ New Listing` button in the header (alongside Settings/Analytics)
- Add a "New Listing" quick action card linking to `/agent/properties/new`

### 3. Update Agent Properties Page — Enable Full Management
**File: `src/pages/agent/AgentProperties.tsx`**
- Remove the "Listings are created and managed by your agency" banner
- Add a `+ New Listing` button in the page header
- Add Edit/Delete actions to each property row (Edit links to `/agent/properties/:id/edit`, Delete uses existing `useDeleteProperty`)
- Add "Submit for Review" action on draft listings (using existing `useSubmitForReview`)
- Update empty state to encourage creating a first listing instead of waiting for agency assignment
- Update page title from "My Assigned Listings" to "My Listings"

### 4. Agency Listings Page — Add Agent Attribution Column
**File: `src/pages/agency/AgencyListings.tsx`**
- Already has agent filter and shows all agency listings — no structural changes needed
- Confirm agent name is displayed per listing (it already filters by agent)

### 5. Single Source of Truth
- All listings remain attributed to an `agent_id` which maps to an agency via `agents.agency_id`
- Agency admins see all listings across their agents in `/agency/listings`
- Agents see only their own via `useAgentProperties` (filtered by their `agent_id`)
- The existing verification pipeline (`draft` → `pending_review` → platform review → `approved`) remains unchanged

## No Database Changes Needed
All tables, RLS policies, and hooks already support this model. The `useCreateProperty` hook sets `agent_id` correctly, and `useAgentProperties` filters by the logged-in agent's ID.

