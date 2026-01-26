
# Add Blog Posts to Agent, Agency & Developer Profile Pages

## Overview

Currently, profile pages for agents, agencies, and developers only display listings (Active/Past). The database already supports linking blog posts to professionals via `author_type` and `author_profile_id` fields, but there's no public-facing display of these posts on profile pages.

This plan adds a "Blog Posts" tab to all three profile types so visitors can see articles written by that professional.

---

## What Will Be Built

### New Hook: `useAuthorBlogPosts`

A new query hook in `src/hooks/useBlog.tsx` that fetches **published** blog posts for a specific author (agent, agency, or developer).

```text
┌─────────────────────────────────────────────────────────┐
│  useAuthorBlogPosts(authorType, authorProfileId)        │
├─────────────────────────────────────────────────────────┤
│  Filters:                                               │
│   - is_published = true                                 │
│   - verification_status = 'approved'                    │
│   - author_type = authorType                            │
│   - author_profile_id = authorProfileId                 │
│  Ordering: published_at DESC                            │
└─────────────────────────────────────────────────────────┘
```

---

## UI Changes

### 1. Agent Profile (`/agents/:id`)

Add a third tab "Blog Posts" alongside "Active Listings" and "Past Listings":

```text
┌──────────────────────────────────────────────────────────────┐
│ [ Active Listings (8) ] [ Past Listings (0) ] [ Blog (3) ]  │
└──────────────────────────────────────────────────────────────┘
```

The tab content will show a grid of `BlogCard` components, or an empty state if no posts exist.

### 2. Agency Profile (`/agencies/:slug`)

Same pattern - add "Blog Posts" tab to existing tabs.

### 3. Developer Profile (`/developers/:slug`)

Developers currently don't use tabs (they just show projects in a section). Two options:
- **Option A**: Add a separate "Articles" section below projects
- **Option B**: Convert to tabs like agents/agencies

I'll implement **Option A** (separate section) to keep the developer page's current layout style consistent.

---

## Technical Implementation

### File: `src/hooks/useBlog.tsx`

Add new hook at the end of the file:

```tsx
// Fetch published blog posts by author profile
export function useAuthorBlogPosts(authorType: string, authorProfileId: string | undefined) {
  return useQuery({
    queryKey: ['authorBlogPosts', authorType, authorProfileId],
    queryFn: async () => {
      if (!authorProfileId) return [];
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:category_id (*)
        `)
        .eq('is_published', true)
        .eq('verification_status', 'approved')
        .eq('author_type', authorType)
        .eq('author_profile_id', authorProfileId)
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
    enabled: !!authorProfileId,
  });
}
```

---

### File: `src/pages/AgentDetail.tsx`

1. Import the new hook and `BlogCard` component
2. Fetch blog posts using `useAuthorBlogPosts('agent', agent?.id)`
3. Add "Blog" tab trigger with count badge
4. Add `TabsContent` for blog posts grid

Changes around lines 290-350:
- Add new TabsTrigger for "Blog"
- Add new TabsContent with BlogCard grid or empty state

---

### File: `src/pages/AgencyDetail.tsx`

Same approach:
1. Import the new hook and `BlogCard`
2. Fetch posts using `useAuthorBlogPosts('agency', agency?.id)`
3. Add "Blog" tab with count badge
4. Add TabsContent with grid or empty state

---

### File: `src/pages/DeveloperDetail.tsx`

Add a new section after the "Projects" section:
1. Import the new hook and `BlogCard`
2. Fetch posts using `useAuthorBlogPosts('developer', developer?.id)`
3. Add "Articles by {developer.name}" section heading
4. Render grid of BlogCards or skip section entirely if no posts

---

## Empty States

Each profile type will show an appropriate empty state when no blog posts exist:

**Agent:**
```text
┌────────────────────────────────────┐
│      📝 (FileText icon)            │
│   No articles published yet.       │
└────────────────────────────────────┘
```

**Agency:**
```text
┌────────────────────────────────────────────┐
│      📝 (FileText icon)                    │
│   This agency hasn't published             │
│   any articles yet.                        │
└────────────────────────────────────────────┘
```

**Developer:**
Section is only rendered if there are blog posts (no empty state needed since it's not a tab).

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useBlog.tsx` | Add `useAuthorBlogPosts` hook |
| `src/pages/AgentDetail.tsx` | Import hook/BlogCard, add Blog tab |
| `src/pages/AgencyDetail.tsx` | Import hook/BlogCard, add Blog tab |
| `src/pages/DeveloperDetail.tsx` | Import hook/BlogCard, add Articles section |

---

## Dependencies

- Uses existing `BlogCard` component (no changes needed)
- Uses existing `useSavedArticles` hook for save functionality
- Relies on existing database columns `author_type` and `author_profile_id`

