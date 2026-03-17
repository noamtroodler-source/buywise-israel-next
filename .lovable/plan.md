
# Agency Blog Management — Organized Sections + Team Articles

## What changes

Restructure `AgencyBlogManagement.tsx` from a flat list into organized sections with tabs, and add a new query to fetch blog posts from the agency's agents.

### 1. New hook: `useAgencyTeamBlogPosts`
Add to `src/hooks/useProfessionalBlog.tsx` a function that fetches all blog posts where `author_type = 'agent'` and the agent's `agency_id` matches the current agency. This requires a two-step query: get agent IDs from `useAgencyTeam`, then fetch their blog posts.

### 2. Restructure the page with two tabs
Replace the flat post list with a tabbed layout using the existing shadcn `Tabs` component:

- **Agency Articles** — Posts authored by the agency (`author_type = 'agency'`). Split into:
  - **Active** section (drafts, pending_review, changes_requested) — shown first with edit actions
  - **Published** section (approved) — displayed below in a lighter, compact style with view counts
- **Team Articles** — Posts authored by agents belonging to this agency. Read-only view showing agent name, status, and views. Agency owner can see what their team is publishing but not edit.

### 3. Section design (BuyWise branding)
- Tab bar: Uses `Tabs`/`TabsList`/`TabsTrigger` with `rounded-xl` styling and `bg-muted/50` background
- Active articles: Current card style (rounded-2xl, border-border/50, hover:border-primary/20)
- Published section: Collapsible with a subtle header "Published · X articles · Y total views", using `primary/5` background cards, no edit button — replaced with "View" link to the public blog post
- Team articles: Same card pattern but with agent avatar + name shown, and an "outline" style badge for the agent name
- Empty states per tab using `EnhancedEmptyState`

### 4. Files to edit
- **`src/hooks/useProfessionalBlog.tsx`** — Add `useAgencyTeamBlogPosts(agencyId, agentIds)` hook
- **`src/pages/agency/AgencyBlogManagement.tsx`** — Full restructure with Tabs, sections, team posts integration

### 5. Key details
- Team articles query filters by agent IDs from `useAgencyTeam` — no new DB tables needed
- Stats row updates to combine agency + team totals
- Growth banner and content prompts stay as-is, only shown in the Agency Articles tab
- The Published section uses `Collapsible` from radix if >3 posts, showing first 3 with "Show all" toggle
