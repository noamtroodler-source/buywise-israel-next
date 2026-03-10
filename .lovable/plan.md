

## Plan: Make Empty Announcements "Create" Button Functional + Clarify Purpose

### Problem
The "Create" button in the empty announcements state is non-functional — the `onClick` has a comment placeholder and does nothing. Also, the label "No announcements" doesn't clarify that announcements are for the team/agents.

### Changes

**`src/pages/agency/AgencyDashboard.tsx`** (lines 253-264)
- Replace the non-functional empty state with a rendering of `AgencyAnnouncements` in compact mode (which already has a working "New Announcement" button and create dialog)
- Update the label to say "Team Announcements" to clarify purpose
- Alternatively: render `AgencyAnnouncements` with `compact` in both cases (it already handles the empty state with "No announcements yet" + a working "New Announcement" button)

**Simplest approach**: Remove the conditional entirely — always render the `AgencyAnnouncements` compact card regardless of count. The component already handles empty state gracefully with a working create button.

**Copy tweak in `AgencyAnnouncements.tsx`**:
- Change "No announcements yet" to "No team announcements yet"
- Change "Post an announcement to your team" dialog description to "Post an announcement visible to all agents in your agency"
- Update the card title from "Announcements" to "Team Announcements" in the full view

### Files
1. `src/pages/agency/AgencyDashboard.tsx` — Remove conditional, always show `AgencyAnnouncements compact` inside a card with "Team Announcements" header
2. `src/components/agency/AgencyAnnouncements.tsx` — Update copy to clarify team/agent visibility

