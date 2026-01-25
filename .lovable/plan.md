
# Professional Blog Feature for Agents, Agencies & Developers

## Overview

This feature enables verified agents, agencies, and developers to create and publish blog content through their respective dashboard portals. Posts require admin approval before going live, maintaining content quality while empowering professionals to share expertise and build credibility.

---

## Current State Analysis

The platform already has:
- A fully functional blog system with `blog_posts` table
- An `author_id` field that references `auth.users(id)`
- Existing RLS policies allowing authors to create and manage their own posts
- Admin moderation via the Admin Blog page
- Display infrastructure (Blog page, BlogCard, BlogPost detail)

What's needed:
- Professional-focused blog management UI in each dashboard
- Verification status fields for professional content
- Author attribution display on published posts
- New RLS policies for professional verification requirements

---

## Database Schema Changes

### New Fields on `blog_posts` Table

```text
+------------------------+---------------------------+----------------------------------------+
| Field                  | Type                      | Purpose                                |
+------------------------+---------------------------+----------------------------------------+
| author_type            | TEXT                      | 'agent', 'agency', 'developer', 'admin'|
| author_profile_id      | UUID                      | References agent/agency/developer ID   |
| verification_status    | TEXT                      | 'draft', 'pending_review', 'approved', |
|                        |                           | 'changes_requested', 'rejected'        |
| submitted_at           | TIMESTAMP                 | When submitted for review              |
| reviewed_at            | TIMESTAMP                 | When admin reviewed                    |
| reviewed_by            | UUID                      | Admin who reviewed                     |
| rejection_reason       | TEXT                      | Feedback for rejected posts            |
+------------------------+---------------------------+----------------------------------------+
```

### RLS Policy Updates

- Only verified professionals can submit posts for review
- Draft posts are always savable (regardless of verification)
- Posts must be `is_published = true` AND `verification_status = 'approved'` to display publicly

---

## Implementation by Portal

### Agent Portal (`/agent`)

**New Page: `/agent/blog`** — "My Articles"

Features:
- List of agent's blog posts with status badges
- "Write Article" button → article wizard
- Status tabs: All | Drafts | Pending Review | Published
- View counts and saves for published posts

**New Page: `/agent/blog/new`** — Article Wizard

Multi-step wizard matching property wizard patterns:
1. **Basics** — Title, category, target audience, city (optional)
2. **Content** — Rich text editor for main content, excerpt
3. **Cover Image** — Image upload (reuse SortableImageUpload)
4. **Preview & Submit** — Review before save/submit

Dashboard Integration:
- Add "Blog" quick action card on Agent Dashboard
- Add "Blog" button in header action row
- Badge showing pending article count

### Agency Portal (`/agency`)

**New Tab: "Blog"** in Agency Dashboard tabs

Features:
- Aggregate view of all team member articles
- Filter by agent, status
- Agency-authored articles (where agency is the author)
- "Write Article" for agency-level content

The agency can:
- Create articles attributed to the agency brand
- See team articles in read-only mode

### Developer Portal (`/developer`)

**New Page: `/developer/blog`** — "Development Insights"

Similar structure to Agent Blog:
- List of developer's blog posts
- "Write Article" wizard
- Focus on project updates, market insights, development news

Dashboard Integration:
- Add "Blog" quick action card
- Badge showing article stats

---

## Article Wizard Design

Following existing wizard patterns (PropertyWizard, ProjectWizard):

```text
+------------------------------------------------------------------+
|  ← Back to Blog                              Save Draft | Submit |
+------------------------------------------------------------------+
|                                                                  |
|  Step 1 of 4 — Basics                                           |
|  ○───●───○───○                                                  |
|                                                                  |
|  +----------------------------------------------------------+   |
|  |  Title *                                                  |   |
|  |  [ Your article title                                   ] |   |
|  +----------------------------------------------------------+   |
|                                                                  |
|  +----------------------------------------------------------+   |
|  |  Category *                           Target Audience     |   |
|  |  [ Select category ▼ ]               [ ] Families         |   |
|  |                                       [ ] Investors        |   |
|  |                                       [ ] Olim             |   |
|  +----------------------------------------------------------+   |
|                                                                  |
|  +----------------------------------------------------------+   |
|  |  Related City (optional)                                  |   |
|  |  [ Select city ▼ ]                                       |   |
|  +----------------------------------------------------------+   |
|                                                                  |
|                                           [ Previous ] [ Next ] |
+------------------------------------------------------------------+
```

Content Step will use a rich text editor component for formatting.

---

## Verification Flow

```text
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│                 │      │                  │      │                 │
│   Draft         │─────▶│  Pending Review  │─────▶│   Approved      │
│   (saveable)    │      │  (awaiting admin)│      │   (published)   │
│                 │      │                  │      │                 │
└─────────────────┘      └────────┬─────────┘      └─────────────────┘
                                  │
                                  │ Admin requests changes
                                  ▼
                         ┌──────────────────┐
                         │                  │
                         │ Changes Requested│
                         │ (with feedback)  │
                         │                  │
                         └──────────────────┘
```

**Submission Requirements:**
- Professional must be verified (status = 'active')
- Title, content, category are required
- Cover image encouraged but optional

---

## Admin Integration

### Enhanced Admin Blog Page

Add features:
- Filter by author type (Agent, Agency, Developer, Admin)
- Filter by verification status
- Approve/Reject actions with feedback modal
- Author attribution display (name + profile link)

Status badge colors (following brand standards — blue tints only):
- Draft: `bg-muted text-muted-foreground`
- Pending Review: `bg-primary/10 text-primary`
- Changes Requested: `bg-primary/10 text-primary`
- Approved: `bg-primary/10 text-primary`

---

## Public Blog Display Updates

### Blog Card Updates

Show author attribution:
```text
+------------------------------------------------+
|  [Cover Image]                                 |
|                                                |
|  Market Insights        5 min read             |
|                                                |
|  Why Raanana is Perfect for Families           |
|  The suburbs north of Tel Aviv offer...        |
|                                                |
|  By Sarah Cohen, RE/MAX Israel                 |  ← NEW
|  ────────────────────────────────────          |
|  Read article →                    [Bookmark]  |
+------------------------------------------------+
```

### BlogPost Detail

Add author card in sidebar:
- Avatar/logo
- Name and title
- Link to agent/agency/developer profile
- "View all articles by this author"

---

## File Structure

New files to create:

```text
src/
├── pages/
│   ├── agent/
│   │   ├── AgentBlog.tsx              # List view
│   │   └── AgentBlogWizard.tsx        # Create/edit wizard
│   ├── agency/
│   │   └── (modify AgencyDashboard.tsx to add Blog tab)
│   └── developer/
│       ├── DeveloperBlog.tsx          # List view
│       └── DeveloperBlogWizard.tsx    # Create/edit wizard
│
├── components/
│   ├── blog/
│   │   ├── BlogAuthorCard.tsx         # Author attribution card
│   │   └── BlogArticleTable.tsx       # Reusable article list table
│   ├── agent/
│   │   └── wizard/
│   │       └── blog/                  # Blog wizard steps
│   │           ├── BlogWizardContext.tsx
│   │           ├── StepBasics.tsx
│   │           ├── StepContent.tsx
│   │           ├── StepCoverImage.tsx
│   │           └── StepReview.tsx
│   └── shared/
│       └── RichTextEditor.tsx         # Content editor component
│
└── hooks/
    └── useProfessionalBlog.tsx        # CRUD operations for professional blog
```

---

## Routes to Add

| Route                          | Component              | Access               |
|--------------------------------|------------------------|----------------------|
| `/agent/blog`                  | AgentBlog              | Agent role required  |
| `/agent/blog/new`              | AgentBlogWizard        | Agent role required  |
| `/agent/blog/:id/edit`         | AgentBlogWizard        | Agent (own posts)    |
| `/developer/blog`              | DeveloperBlog          | Developer role req.  |
| `/developer/blog/new`          | DeveloperBlogWizard    | Developer role req.  |
| `/developer/blog/:id/edit`     | DeveloperBlogWizard    | Developer (own)      |

Agency blog will be a tab within the existing Agency Dashboard.

---

## Technical Details

### Database Migration

```sql
-- Add professional blog fields to blog_posts
ALTER TABLE public.blog_posts
ADD COLUMN author_type TEXT CHECK (author_type IN ('agent', 'agency', 'developer', 'admin')),
ADD COLUMN author_profile_id UUID,
ADD COLUMN verification_status TEXT DEFAULT 'draft' 
  CHECK (verification_status IN ('draft', 'pending_review', 'approved', 'changes_requested', 'rejected')),
ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN rejection_reason TEXT;

-- Update RLS policies for professional authors
CREATE POLICY "Verified agents can submit posts for review"
ON public.blog_posts FOR UPDATE
USING (
  author_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.agents 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);
```

### Key Hook: `useProfessionalBlog`

```typescript
// Provides:
- useMyBlogPosts(authorType, profileId)
- useCreateBlogPost()
- useUpdateBlogPost()
- useSubmitForReview(postId)
- useBlogPostDraft(postId) // For editing
```

---

## Implementation Order

1. **Database Migration** — Add new columns and RLS policies
2. **Hook Layer** — Create `useProfessionalBlog` for CRUD operations
3. **Shared Components** — RichTextEditor, BlogArticleTable, BlogAuthorCard
4. **Agent Blog Pages** — AgentBlog list + AgentBlogWizard
5. **Developer Blog Pages** — DeveloperBlog list + DeveloperBlogWizard
6. **Agency Blog Tab** — Add to AgencyDashboard
7. **Admin Enhancements** — Author filters, approval workflow
8. **Public Display** — Author attribution on BlogCard and BlogPost
9. **Dashboard Integration** — Quick actions and badges

---

## Security Considerations

- Only verified professionals can submit for review (draft saving always allowed)
- Posts require `is_published = true` AND `verification_status = 'approved'` to appear publicly
- Authors can only edit their own posts
- Admins have full control over all posts
- Content is sanitized with DOMPurify before display (already in place)

This implementation follows existing patterns (property/project wizards, verification workflows) and maintains the clean, professional BuyWise Israel aesthetic while empowering professionals to build credibility through content.
