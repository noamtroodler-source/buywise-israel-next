
# Replace Calculator CTA with Author Contact Card on Blog Posts

## Overview

Replace the "Run the Numbers" calculator CTA card in the blog post sidebar with an author contact card. This card will display the blog post author's photo, name, professional type, and WhatsApp/Email contact buttons - encouraging readers to reach out to the author for real estate services.

## Current State vs Desired State

| Current | Desired |
|---------|---------|
| Calculator icon + "Run the Numbers" | Author avatar + Author name |
| "Use our calculators..." text | Author type badge (Agent/Developer/Agency) |
| "Explore Tools" button | WhatsApp + Email buttons |
| Links to /tools | Links to author profile page |

## Implementation Steps

### Step 1: Create BlogAuthorContactCard Component

Create a new reusable component at `src/components/blog/BlogAuthorContactCard.tsx` that:

- Displays author avatar/logo
- Shows author name with link to their profile
- Shows a badge indicating author type (Agent, Developer, Agency)
- Shows organization name if available (e.g., agency name for agents)
- Includes WhatsApp and Email contact buttons
- Uses the existing centralized WhatsApp system (`buildWhatsAppUrl`, `openWhatsApp`)

### Step 2: Create Hook to Fetch Blog Post Author

Create a hook `useBlogPostAuthor` in `src/hooks/useBlogPostAuthor.tsx` that:

- Takes `author_type` and `author_profile_id` as parameters
- Fetches the author's full profile from the appropriate table (agents, agencies, or developers)
- Returns author info including: name, email, phone, avatar/logo, and organization details
- Uses existing patterns from `useBlogReview.tsx` as reference

### Step 3: Update BlogPost.tsx

Modify the sidebar in `src/pages/BlogPost.tsx` to:

- Import and use the new `useBlogPostAuthor` hook
- Replace the Calculator CTA card with the new `BlogAuthorContactCard` component
- Pass the fetched author data to the contact card
- Handle the case where author info is not available (fallback to a simple card or hide)

## Component Design

```
┌─────────────────────────────────────────┐
│ ┌──────┐                                │
│ │Avatar│  Author Name           [Badge] │
│ └──────┘  Organization Name             │
├─────────────────────────────────────────┤
│  [ WhatsApp ]        [ Email ]          │
├─────────────────────────────────────────┤
│          View Agent Profile →           │
└─────────────────────────────────────────┘
```

## Profile Link Routing

Based on author type, link to the correct profile page:

| Author Type | Profile URL |
|-------------|-------------|
| agent | `/agents/{id}` |
| agency | `/agencies/{slug}` |
| developer | `/developers/{slug}` |

## Technical Details

### Author Data Required

```typescript
interface BlogAuthorContact {
  id: string;
  type: 'agent' | 'agency' | 'developer';
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  organization_name: string | null; // agency_name for agents
  slug?: string; // for agencies/developers
}
```

### WhatsApp Message Format

```
Hi [Author Name], I read your article "[Post Title]" on BuyWise and would like to learn more about your services.
```

### Files to Create

1. `src/components/blog/BlogAuthorContactCard.tsx` - The contact card UI component
2. `src/hooks/useBlogPostAuthor.tsx` - Hook to fetch author details

### Files to Modify

1. `src/pages/BlogPost.tsx` - Replace Calculator CTA with Author Contact Card
2. `src/types/content.ts` - Add `author_type` and `author_profile_id` to BlogPost type if not already present
