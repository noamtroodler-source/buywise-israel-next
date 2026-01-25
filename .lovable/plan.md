
# Admin Blog Review System

## Overview

Implement a complete blog review workflow for admins, following the same patterns used for Listings and Projects. This allows admins to:
1. **Preview** blog posts submitted by agents, agencies, and developers
2. **Approve** - Publish the article to the public blog
3. **Request Changes** - Send feedback and return to author for revisions
4. **Reject** - Decline the article with a reason

The system will integrate into the existing admin sidebar under the **Review Queue** section with a pending badge.

---

## Architecture

```text
Admin Dashboard → Review Queue
│
├── Listings (existing)
├── Agents (existing)
├── Agencies (existing)
├── Developers (existing)
├── Projects (existing)
└── Blog Posts (NEW) ← Pending badge showing count
```

---

## Implementation Details

### 1. New Hook: `useBlogReview.tsx`

Create a dedicated hook following the `useListingReview.tsx` pattern:

**Exports:**
- `BlogPostForReview` - Interface for review data
- `useBlogPostsForReview(status?)` - Fetch posts by verification status
- `usePendingBlogCount()` - Count for sidebar badge
- `useBlogReviewStats()` - Stats for all statuses
- `useApproveBlogPost()` - Approve and publish
- `useRequestBlogChanges()` - Request changes with feedback
- `useRejectBlogPost()` - Reject with reason

**Data Structure:**
```typescript
interface BlogPostForReview {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category_ids: string[] | null;
  city: string | null;
  audiences: string[] | null;
  reading_time_minutes: number | null;
  views_count: number | null;
  verification_status: BlogVerificationStatus;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  is_published: boolean;
  author: {
    id: string;
    type: AuthorType;
    profile_id: string;
    name: string;
    email: string;
    avatar: string | null;
    // Agency/company name if applicable
    organization_name: string | null;
  } | null;
  categories: { id: string; name: string; slug: string }[] | null;
}
```

---

### 2. New Component: `BlogReviewCard.tsx`

Create a review card component following `ListingReviewCard.tsx` pattern:

**Features:**
- **Header**: Cover image thumbnail, title, status badge, submission time
- **Metadata**: Categories, city, reading time, word count
- **Author Info**: Avatar, name, type (Agent/Agency/Developer), organization
- **Expandable Content**: Full article preview with rendered markdown
- **Previous Feedback**: Show rejection_reason if status is `changes_requested`
- **Actions**: Approve, Request Changes, Reject, Preview (opens full modal)

**UI Layout:**
```text
┌──────────────────────────────────────────────────────────────┐
│ [Cover Image]  │  Title of the Blog Article                 │
│  (thumbnail)   │  ● Pending Review • Submitted 2 hours ago  │
│                │  Categories: Buying Guide, First-Time...   │
│                │  📍 Tel Aviv • 5 min read                  │
│                ├────────────────────────────────────────────│
│                │  👤 Agent Name • Verified                  │
│                │     Agency Name (if applicable)            │
│                ├────────────────────────────────────────────│
│                │  [▼ Show More]                             │
│                │                                            │
│                │  [✓ Approve] [💬 Request Changes] [✗ Reject] │
│                │                              [Preview →]   │
└──────────────────────────────────────────────────────────────┘
```

---

### 3. New Component: `BlogPreviewModal.tsx`

Full-screen preview modal showing the article as it would appear on the public blog:

- Cover image (full width)
- Title, author info, publication meta
- Rendered markdown content (using same styling as public BlogPost page)
- Categories and tags
- "Close" button

---

### 4. New Page: `AdminBlogReview.tsx`

Main review queue page following `AdminListingReview.tsx` pattern:

**Features:**
- Header with "Blog Review Queue" title and pending count badge
- 5 stat cards (Pending, Changes Requested, Approved, Rejected, Drafts)
- Tabs for filtering by status
- List of `BlogReviewCard` components
- Empty state with checkmark icon when all reviewed

---

### 5. Update Admin Layout

**File:** `src/pages/admin/AdminLayout.tsx`

Add blog review to the `reviewItems` array:
```tsx
const reviewItems = [
  { href: '/admin/review', label: 'Listings', icon: ClipboardCheck, badge: pendingCount || 0 },
  { href: '/admin/agents', label: 'Agents', icon: Building2, badge: stats?.pendingAgents || 0 },
  { href: '/admin/agencies', label: 'Agencies', icon: Building, badge: stats?.pendingAgencies || 0 },
  { href: '/admin/developers', label: 'Developers', icon: Building, badge: stats?.pendingDevelopers || 0 },
  { href: '/admin/projects', label: 'Projects', icon: Building, badge: stats?.pendingProjects || 0 },
  { href: '/admin/blog-review', label: 'Blog Posts', icon: FileText, badge: pendingBlogCount || 0 }, // NEW
];
```

---

### 6. Update Routes

**File:** `src/App.tsx`

Add the new admin route:
```tsx
<Route path="blog-review" element={<AdminBlogReview />} />
```

---

## File Changes Summary

| File | Action |
|------|--------|
| `src/hooks/useBlogReview.tsx` | Create - Hook with queries and mutations |
| `src/components/admin/BlogReviewCard.tsx` | Create - Review card component |
| `src/components/admin/BlogPreviewModal.tsx` | Create - Full article preview modal |
| `src/pages/admin/AdminBlogReview.tsx` | Create - Main review queue page |
| `src/pages/admin/AdminLayout.tsx` | Update - Add blog review to sidebar |
| `src/App.tsx` | Update - Add route for blog review |

---

## Author Resolution Strategy

Since blogs can come from agents, agencies, or developers, we need to resolve author info dynamically:

```sql
-- In the query, we join based on author_type:
SELECT 
  bp.*,
  CASE 
    WHEN bp.author_type = 'agent' THEN ag.name
    WHEN bp.author_type = 'agency' THEN ay.name
    WHEN bp.author_type = 'developer' THEN dv.name
  END as author_name,
  ...
```

For simplicity in the hook, we'll fetch the author info in a secondary query or use RPC if needed. Alternatively, we can denormalize author_name on the blog_posts table for faster queries.

**Practical approach**: Use JavaScript-side resolution after fetching the posts with separate lookups for agent/agency/developer based on `author_type` and `author_profile_id`.

---

## Notification Integration

When admin takes action, send notification to the author:
- **Approve**: "Your article '[title]' has been approved and published!"
- **Request Changes**: "Changes requested for '[title]': [feedback]"
- **Reject**: "Your article '[title]' was not approved: [reason]"

Uses existing `send-notification` edge function pattern.

---

## Technical Considerations

1. **Markdown Rendering**: Use DOMPurify for safe HTML rendering in preview
2. **RLS Policies**: Admins need SELECT/UPDATE access to all blog_posts (existing admin role check)
3. **Query Optimization**: Index on `verification_status` column (already exists from migration)
4. **Author Type Badge**: Show different colored badges for Agent/Agency/Developer
