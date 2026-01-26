
# Revamp Developer Profile Page

## Overview

Transform the developer profile page to match the polished design of agent and agency pages while showcasing all information collected during signup.

---

## Current Issues

1. **Missing Data Display**: The page doesn't show specializations, company size, company type, or office location
2. **Outdated Type Definition**: The `Developer` interface lacks new database fields
3. **Basic Layout**: No tabbed interface, simpler stats, no social links
4. **Branding Gaps**: Uses some off-brand colors (green for completed status)

---

## Files to Modify

### 1. `src/types/projects.ts` - Update Developer Interface

Add missing fields to match database schema:

```typescript
export interface Developer {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  founded_year: number | null;
  total_projects: number;
  is_verified: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  // New fields
  status: string | null;
  verification_status: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  office_address: string | null;
  office_city: string | null;
  company_size: string | null;
  company_type: string | null;
  specialties: string[] | null;
}
```

---

### 2. `src/pages/DeveloperDetail.tsx` - Complete Redesign

**New Structure:**

```text
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Developers                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HERO CARD (overflow-hidden, matches Agency style)             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Logo]    Gindi Holdings  ✓ Verified Developer         │   │
│  │  96x96     Est. 1976 · Private · 51-200 employees       │   │
│  │                                                          │   │
│  │  "Innovative developer bringing modern living..."        │   │
│  │                                                          │   │
│  │  📍 Herzliya (Office)                                   │   │
│  │                                                          │   │
│  │  [Residential] [Luxury] [Affordable Housing]  ← specialties │
│  │                                                          │   │
│  │  [WhatsApp] [Call] [Email] [Website] [Share]            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  STATS BAR (4 columns, matching Agent/Agency)                  │
│  ┌──────────┬──────────┬──────────┬──────────┐                 │
│  │ Total    │ Active   │ Completed│ Total    │                 │
│  │ Projects │ Projects │ Projects │ Units    │                 │
│  │   19     │    12    │    7     │  2,450   │                 │
│  └──────────┴──────────┴──────────┴──────────┘                 │
│                                                                 │
│  TABBED INTERFACE (matches Agency design)                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Active Projects (12)] [Completed (7)] [Blog (3)]       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │   Project Cards Grid (3 columns)                         │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Changes

### Hero Card Enhancements

**Add Company Metadata Row:**
```tsx
<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
  {developer.founded_year && <span>Est. {developer.founded_year}</span>}
  {developer.company_type && (
    <>
      <span>·</span>
      <span className="capitalize">{developer.company_type}</span>
    </>
  )}
  {developer.company_size && (
    <>
      <span>·</span>
      <span>{developer.company_size}</span>
    </>
  )}
</div>
```

**Add Office Location Badge:**
```tsx
{developer.office_city && (
  <div className="flex items-center gap-2 text-muted-foreground">
    <MapPin className="h-4 w-4" />
    <span>{developer.office_city} Office</span>
  </div>
)}
```

**Add Specializations Badges:**
```tsx
{developer.specialties && developer.specialties.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {developer.specialties.map((spec) => (
      <Badge key={spec} variant="secondary" className="capitalize">
        {spec}
      </Badge>
    ))}
  </div>
)}
```

**Social Links (inline with contact buttons):**
```tsx
{developer.linkedin_url && (
  <Button variant="ghost" size="sm" asChild>
    <a href={developer.linkedin_url} target="_blank">
      <Linkedin className="h-4 w-4" />
    </a>
  </Button>
)}
```

### Stats Bar Updates

- Change icon backgrounds from green/accent to primary blue tints (brand compliance)
- Keep metrics: Total Projects, Active Projects, Completed, Total Units

### Tabbed Interface

Replace the current flat sections with a professional tabbed UI:

```tsx
<Tabs defaultValue="active" className="space-y-6">
  <TabsList className="h-12 p-1 bg-muted/50 rounded-xl">
    <TabsTrigger value="active">
      Active Projects
      <span className="...bg-primary/10 text-primary">{activeProjects}</span>
    </TabsTrigger>
    <TabsTrigger value="completed">
      Completed
      <span className="...">{completedProjects}</span>
    </TabsTrigger>
    <TabsTrigger value="blog">
      Blog
      <span className="...">{blogPosts.length}</span>
    </TabsTrigger>
  </TabsList>

  <TabsContent value="active">
    {/* Active projects grid */}
  </TabsContent>

  <TabsContent value="completed">
    {/* Completed projects grid */}
  </TabsContent>

  <TabsContent value="blog">
    {/* Blog posts grid */}
  </TabsContent>
</Tabs>
```

### Color Standardization

Replace off-brand colors:
- `bg-green-100 text-green-700` becomes `bg-primary/10 text-primary`
- `bg-accent` becomes `bg-primary/10`
- All stat icons use `text-primary` consistently

---

## New Imports Required

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Linkedin, Share2 } from 'lucide-react';
```

---

## Project Card Status Colors

Update to brand-compliant palette:

| Status | Current | Updated |
|--------|---------|---------|
| planning | bg-muted | bg-muted (keep) |
| pre_sale | bg-accent | bg-primary/20 text-primary |
| under_construction | bg-primary | bg-primary (keep) |
| completed | bg-green-100 text-green-700 | bg-primary/10 text-primary |

---

## Empty States

Use Lucide icons matching the content type:
- **No active projects**: `Building2` icon
- **No completed projects**: `CheckCircle` icon
- **No blog posts**: `FileText` icon

Each with muted styling and helpful text.

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/types/projects.ts` | Add 9 new fields to Developer interface |
| `src/pages/DeveloperDetail.tsx` | Complete redesign with hero card, tabbed interface, new data display |

This brings the developer profile to feature parity with agent/agency pages while showcasing all wizard-collected data.
