
# Agencies Page Enhancement

## Overview
Upgrade the Agencies listing page with search, filtering, real stats, and sorting -- all integrated into the existing clean card-based design.

## What Changes

### 1. Enhanced Header with Agency Count
The subtitle becomes dynamic: "Browse 15 verified real estate agencies in Israel" instead of static copy. Instant credibility signal.

### 2. Search + Filter Toolbar
A single row below the header containing:
- **Search input** (left) -- text field with a search icon, filters agencies by name as you type
- **City filter pills** (center/below) -- horizontal scrollable row of pill buttons extracted from all `cities_covered` data across agencies. Clicking a city filters to agencies covering that city. An "All" pill is selected by default. On mobile, the pills scroll horizontally
- **Sort dropdown** (right) -- small select with options: "A-Z", "Most Established", "Largest Team", "Most Listings"

This fits naturally between the header and the grid, consistent with how filter bars work on the property listing pages.

### 3. Real Stats on Agency Cards
Replace the static "View team" / "Listings" labels in the card footer with **live counts**:
- "8 Agents" (with Users icon)  
- "24 Listings" (with Home icon)

This requires updating the `useAgencies` hook to fetch agent and listing counts per agency. We'll do this with two additional queries (agent counts grouped by agency, listing counts grouped by agency) and merge the data client-side -- avoiding N+1 queries.

### 4. Specialization Tags
Your concern about them all looking the same is valid, but looking at the actual data, agencies DO differ meaningfully (e.g., "Anglo clients" vs "Investment properties" vs "Rentals"). These are high-signal for users who know what they need. We'll show them as small outline badges below the description, limited to 2-3 tags per card to keep it clean. They blend in rather than dominate.

### 5. No-Results State
When search/filter yields zero matches, show a friendly empty state with a "Clear filters" button.

---

## Technical Details

### Files Modified

**`src/hooks/useAgency.tsx`**
- Update `useAgencies()` to also return `agent_count` and `listing_count` per agency
- Approach: After fetching agencies, run two grouped count queries (agents by agency_id, published properties by agent's agency_id) and merge results into the agency objects
- Add `specializations` to the returned data (already in select `*`, just need to expose in the card)

**`src/pages/Agencies.tsx`**
- Add state for `searchQuery`, `selectedCity`, and `sortBy`
- Extract unique cities from all agencies' `cities_covered` arrays
- Add filter/search toolbar UI between header and grid
- Update `AgencyCard` interface to include `agent_count`, `listing_count`, `specializations`
- Replace static footer labels with real counts
- Add specialization badges (max 3, outline variant)
- Add client-side filtering logic: name search (case-insensitive includes), city filter (agency.cities_covered includes selected city), and sort
- Add filtered count in header ("Showing 5 of 15 agencies" when filtered)
- Add empty state for no filter matches

### No Database Changes Required
All data already exists in the `agencies` and `agents` tables. We just need smarter queries and client-side filtering.
