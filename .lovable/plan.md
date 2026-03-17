

# Revamp Agent Blog Page — Match Agency Design

The agent page currently uses the old design (gradient header, 4-tab filter with `BlogArticleTable`). It needs to match the new agency blog layout with organized sections, growth banner, and content prompts — minus the Team Articles tab since agents only see their own posts.

## Changes — `src/pages/agent/AgentBlog.tsx`

Full rewrite to mirror `AgencyBlogManagement.tsx` structure:

**Header**: Clean minimal header (no gradient box) — back arrow, title "My Articles", post count subtitle, "Write Article" button with quota tooltip.

**Growth Banner**: Same dismissible "Your expertise, their trust" banner (separate `localStorage` key `agent_blog_growth_banner_dismissed`), but agent-specific copy:
- "Writing builds credibility. Buyers who read your articles are more likely to reach out."
- Badges: "Published articles link to your profile" + "AI formatting included"

**Sections instead of tabs**:
- **In Progress** — drafts, pending_review, changes_requested posts using the `PostCard` component pattern (status badge, views, date, Edit button linking to `/agent/blog/:id/edit`)
- **Published** — collapsible section (show 3, expand for more) with "View" link to public blog post. Same `PublishedSection` pattern.

**Empty state**: `EnhancedEmptyState` with content prompt cards linking to `/agent/blog/new`.

**Content prompts**: Subtle "Ideas for your next article" card at the bottom when posts exist and quota allows.

**No tabs** — agents only have their own posts, so the 4-tab filter (All/Drafts/Pending/Published) and the `BlogArticleTable` component are removed. The In Progress + Published sections provide clearer organization.

## Reuse
Extract `PostCard`, `PublishedSection`, `STATUS_CONFIG`, `contentPrompts`, and `BANNER_KEY` pattern from `AgencyBlogManagement.tsx`. Since the agent page needs slightly different edit paths (`/agent/blog/` vs `/agency/blog/`), we'll pass `editBasePath` as a prop to `PostCard`. To keep the change focused, we'll inline the components in the agent file (same as agency does) rather than extracting to shared — can deduplicate later.

## Files
- **`src/pages/agent/AgentBlog.tsx`** — full rewrite to match agency design

