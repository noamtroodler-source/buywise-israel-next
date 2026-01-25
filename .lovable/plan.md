
# Add Blog Buttons to All Professional Dashboards

## Overview

The blog feature infrastructure (pages, hooks, routes) was created, but the **dashboard integration was missed** — the buttons to access the blog feature were never added. This plan adds:

1. **"Add Blog" button** next to existing action buttons in all three portals
2. **Blog quick action cards** in the dashboard grids
3. **Agency Blog tab** for agency-level blog management

---

## Changes by Portal

### 1. Developer Portal (`DeveloperDashboard.tsx`)

**Header Action Row (line ~133)**
Add "Add Blog" button right next to "Add Project":

```
Before: [Leads] [Settings] [Analytics] [Add Project]
After:  [Leads] [Settings] [Analytics] [Add Project] [Add Blog]
```

**Quick Actions Grid (line ~297)**
Change from 3 columns to 4 columns and add a "Write Blog" card:
- Icon: `PenLine` (from lucide-react)
- Title: "Write Blog"
- Description: "Share development insights"
- Links to: `/developer/blog/new`

---

### 2. Agent Portal (`AgentDashboard.tsx`)

**Header Action Row (line ~175)**
Add "Add Blog" button next to "Add Property":

```
Before: [Settings] [Analytics] [Add Property]
After:  [Settings] [Analytics] [Add Property] [Add Blog]
```

**Quick Actions Array (line ~139)**
Add a blog quick action card to the existing `quickActions` array:

| Title | Description | Icon | Link |
|-------|-------------|------|------|
| Write Blog | Share your market insights | PenLine | /agent/blog/new |

---

### 3. Agency Portal (`AgencyDashboard.tsx`)

**Header Action Row (line ~131)**
Add "Blog" button in the action buttons:

```
Before: [Listings] [Analytics] [Settings] [View Public Page]
After:  [Listings] [Blog] [Analytics] [Settings] [View Public Page]
```

**New Blog Tab in TabsList (line ~231)**
Add a "Blog" tab alongside Team, Invites, and Announcements:

| Tab | Icon | Badge |
|-----|------|-------|
| Blog | PenLine | (article count) |

**Blog Tab Content**
- Display agency's blog posts using `BlogArticleTable` component
- "Write Article" button to create agency-level content
- Links to `/agency/blog/new` for the wizard

---

## New Routes Required

Add these routes to `App.tsx`:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/agency/blog` | AgencyBlog | Agency blog list page (standalone, if needed) |
| `/agency/blog/new` | AgencyBlogWizard | Create agency blog post |
| `/agency/blog/:id/edit` | AgencyBlogWizard | Edit agency blog post |

---

## New Files to Create

### 1. `src/pages/agency/AgencyBlogWizard.tsx`
Wizard for creating/editing agency blog posts. Reuses the same step components as agent/developer wizards, with `author_type: 'agency'`.

### 2. Update `src/pages/agency/AgencyDashboard.tsx`
Add the Blog tab content inline (no separate page needed for the list view since it's embedded in the dashboard tabs).

---

## Implementation Details

### Button Styling (matching existing patterns)
```tsx
<Button variant="outline" asChild className="rounded-xl">
  <Link to="/developer/blog">
    <PenLine className="h-4 w-4 mr-2" />
    Blog
  </Link>
</Button>

<Button asChild className="rounded-xl shadow-md">
  <Link to="/developer/blog/new">
    <Plus className="h-4 w-4 mr-2" />
    Add Blog
  </Link>
</Button>
```

### Quick Action Card (Developer)
```tsx
<Link to="/developer/blog" className="group">
  <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300 h-full">
    <CardContent className="flex items-center gap-4 p-6">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <PenLine className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Write Blog</h3>
        <p className="text-sm text-muted-foreground">Share development insights</p>
      </div>
    </CardContent>
  </Card>
</Link>
```

### Agency Blog Tab Content
```tsx
<TabsTrigger value="blog" className="gap-2 rounded-lg">
  <PenLine className="h-4 w-4" />
  Blog
</TabsTrigger>

<TabsContent value="blog" className="space-y-4 mt-4">
  <Card className="rounded-2xl border-primary/10">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Agency Articles</CardTitle>
      <Button asChild className="rounded-xl">
        <Link to="/agency/blog/new">
          <Plus className="h-4 w-4 mr-2" />
          Write Article
        </Link>
      </Button>
    </CardHeader>
    <CardContent>
      <BlogArticleTable 
        posts={agencyPosts} 
        isLoading={postsLoading}
        basePath="/agency/blog"
        emptyMessage="Share your agency's expertise"
      />
    </CardContent>
  </Card>
</TabsContent>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/developer/DeveloperDashboard.tsx` | Add Blog button in header, add Blog quick action card |
| `src/pages/agent/AgentDashboard.tsx` | Add Blog button in header, add Blog to quickActions array |
| `src/pages/agency/AgencyDashboard.tsx` | Add Blog button in header, add Blog tab with content |
| `src/App.tsx` | Add agency blog routes |

## New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/agency/AgencyBlogWizard.tsx` | Blog wizard for agencies |

---

## Visual Summary

### Developer Dashboard Header (After)
```
┌─────────────────────────────────────────────────────────────────────────┐
│  [←] [Icon] Welcome, Developer Name                                     │
│             Manage your development projects...                         │
│                                                                         │
│           [Leads] [Settings] [Analytics] [Add Project] [Add Blog]       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Developer Quick Actions (After)
```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Manage Projects  │ │ View Analytics   │ │ Add New Project  │ │ Write Blog       │
│ View, edit...    │ │ Track performance│ │ Create a new...  │ │ Share insights   │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

### Agency Dashboard Tabs (After)
```
┌──────────────────────────────────────────────────────────┐
│ [Team 5] [Invites 2] [Announcements 1] [Blog]           │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Order

1. Update `DeveloperDashboard.tsx` — Add header button + quick action card
2. Update `AgentDashboard.tsx` — Add header button + quick action
3. Create `AgencyBlogWizard.tsx` — Blog wizard for agencies
4. Update `AgencyDashboard.tsx` — Add header button + Blog tab
5. Update `App.tsx` — Add agency blog routes

This completes the blog feature integration across all three professional portals.
