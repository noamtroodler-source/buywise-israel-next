

## Plan: Upgrade Agent Listings Page to Match Agency Listings

### Assessment
After comparing all 6 agent sub-pages against their agency equivalents:

- **Analytics, Settings, Blog** — already use identical design patterns (gradient headers, rounded-2xl cards, motion animations, stat cards). No changes needed.
- **Leads** — already polished with the 5-column engagement grid, pie chart, hourly chart. No changes needed.
- **Listings (AgentProperties.tsx)** — this is the outlier. It uses a basic card-row layout with simple tabs, no search, no filters, no stats strip, and no table with columns. The agency version (`AgencyListings.tsx`) has search, status/city filters, stat cards, and a full data table with Views/Saves/Inquiries/Days columns plus dropdown actions.

### Changes — `src/pages/agent/AgentProperties.tsx`

**1. Add Stats Cards Strip** (matching agency)
- 4-card grid: Total Listings, Active, Pending Review, Total Views
- Same `rounded-2xl border-primary/10` card styling with icon + value + label

**2. Add Search + Filters Bar** (matching agency)
- Search input with icon
- Status filter dropdown (All / Active / Pending / Draft / Changes Requested)
- City filter dropdown (extracted from properties)
- All inside a `rounded-2xl border-primary/10` card

**3. Replace Card Rows with Data Table** (matching agency)
- Table columns: Property (image + title + city), Status badge, Price, Views, Saves, Inquiries, Days on Market, Actions
- Actions column: Edit, Submit for Review, View Live, Delete — using a dropdown menu for cleaner layout
- Same `hover:bg-muted/30` row styling

**4. Upgrade Header** (matching agency)
- Same flat layout: back arrow + icon + title/subtitle on left, "New Listing" button on right
- Use `rounded-xl` buttons consistently

**5. Keep Existing Logic**
- All hooks (`useAgentProperties`, `useDeleteProperty`, `useSubmitForReview`), stale detection, verification badges, rejection reason display — preserved as-is
- Tabs removed in favor of the filter dropdown (matching agency pattern)

### Files to Edit
1. `src/pages/agent/AgentProperties.tsx` — full rewrite of layout/template (~290 lines)

