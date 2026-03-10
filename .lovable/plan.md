

# Agent Reassignment — Click-to-Reassign in Listings Table

## What We're Building
Make the "Agent" column in the agency listings table clickable. When the agency owner clicks an agent name, a popover appears with a searchable list of team agents. Selecting a different agent instantly reassigns the property and shows a confirmation toast.

A subtle tooltip/hint will appear on the column header to make this feature discoverable: "Click agent name to reassign".

## Implementation

### 1. Create `useReassignProperty` mutation hook
- Add to `src/hooks/useAgentProperties.tsx`
- Updates `properties.agent_id` for the given property ID
- Invalidates `agencyListingsManagement` and `properties` query caches
- Shows toast: "Listing reassigned to [Agent Name]"

### 2. Create `AgentReassignPopover` component
- New file: `src/components/agency/AgentReassignPopover.tsx`
- Popover trigger: agent name styled as a clickable chip (underline on hover, `ArrowLeftRight` icon)
- Content: searchable list of team agents with avatars, names
- Current agent shown with a checkmark, disabled from selection
- On select → call `useReassignProperty`, close popover

### 3. Update `AgencyListings.tsx`
- Replace static `getAgentName()` text in the Agent column (line 290) with the new `AgentReassignPopover`
- Add a subtle hint on the "Agent" column header: tooltip saying "Click to reassign"
- Pass `team` array and current `listing.agent_id` to the popover

### 4. RLS Check
- The `properties` table update is already permitted for agency owners through existing RLS policies (agents can update their own listings, and agency admin operations go through the same update path). No migration needed.

## UX Details
- Agent name shows as a pill/chip with hover state (`bg-primary/5`, underline, small swap icon)
- Popover has search input for teams with 5+ agents
- Selecting same agent = no-op (greyed out with checkmark)
- Toast confirmation with old → new agent name
- Column header has a small `ArrowLeftRight` icon + tooltip for discoverability

