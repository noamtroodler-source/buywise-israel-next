
# Redesign Developer Analytics to Match Agent Analytics

## Overview

The current Developer Analytics page has a different structure from the Agent Analytics page. We'll align them to have the same layout and metrics:

**Current Developer Analytics:**
- 3 stat cards: Total Views, Inquiries, Conversion Rate
- Conversion Funnel chart
- Project Performance table

**Target (Agent Analytics style):**
- 5 stat cards: Total Views, Total Saves, Total Clicks, WhatsApp, Emails
- 2 charts: Inquiry Sources (pie), Activity by Hour (bar)
- Project Engagement table

---

## Files to Modify

### 1. `src/hooks/useDeveloperAnalytics.tsx`

**Add new data fields to the interface and query:**

```typescript
interface DeveloperAnalyticsData {
  totalViews: number;
  totalInquiries: number;
  totalSaves: number;           // NEW
  whatsappClicks: number;        // NEW
  emailClicks: number;           // NEW
  formClicks: number;            // NEW
  conversionRate: number;
  projectAnalytics: ProjectAnalytics[];
  hourlyDistribution: { hour: number; count: number }[];  // NEW
  projectEngagement: ProjectEngagement[];  // NEW
}
```

**New queries to add:**
1. Fetch `project_favorites` to count total saves
2. Fetch `inquiry_type` from `project_inquiries` to count WhatsApp/Email/Form
3. Build hourly distribution from inquiry timestamps
4. Build project engagement data with views, saves, and clicks

### 2. `src/pages/developer/DeveloperAnalytics.tsx`

**Complete rewrite to match AgentLeads.tsx structure:**

```text
Layout:
┌─────────────────────────────────────────────────┐
│  ← Back    [Analytics Header]     [Date Range] │
└─────────────────────────────────────────────────┘

┌─────────┬─────────┬─────────┬─────────┬─────────┐
│  Views  │  Saves  │  Clicks │WhatsApp │  Emails │
└─────────┴─────────┴─────────┴─────────┴─────────┘

┌─────────────────────┬───────────────────────────┐
│  Inquiry Sources    │    Activity by Hour       │
│    (Pie Chart)      │      (Bar Chart)          │
└─────────────────────┴───────────────────────────┘

┌─────────────────────────────────────────────────┐
│              Project Engagement                  │
│   (Table with views, saves, clicks per project) │
└─────────────────────────────────────────────────┘
```

**Changes:**
- Replace 3-card stats grid with 5-card grid (Views, Saves, Clicks, WhatsApp, Emails)
- Remove ConversionFunnel component
- Add InquiryPieChart (reuse agent component)
- Add HourlyActivityChart (reuse agent component)
- Create new ProjectEngagementTable (similar to PropertyEngagementTable)

### 3. New Component: `src/components/developer/analytics/ProjectEngagementTable.tsx`

Create a component similar to `PropertyEngagementTable.tsx` but for projects:

```typescript
interface ProjectEngagement {
  projectId: string;
  name: string;
  city: string;
  image: string | null;
  views: number;
  saves: number;
  clicks: number;
}
```

---

## Data Flow

```text
project_inquiries table
       │
       ├── Count by inquiry_type → whatsappClicks, emailClicks, formClicks
       ├── Group by hour → hourlyDistribution
       └── Group by project_id → clicks per project

project_favorites table
       │
       ├── Total count → totalSaves
       └── Group by project_id → saves per project

projects table
       │
       └── views_count per project → views
```

---

## Reusable Components

These agent components can be reused directly for developers:
- `InquiryPieChart` - Shows WhatsApp/Email/Form breakdown
- `HourlyActivityChart` - Shows activity by hour of day

---

## Implementation Details

### Updated Hook Interface

```typescript
interface ProjectAnalytics {
  projectId: string;
  views: number;
  inquiries: number;
}

interface ProjectEngagement {
  projectId: string;
  name: string;
  city: string;
  image: string | null;
  views: number;
  saves: number;
  clicks: number;
}

interface DeveloperAnalyticsData {
  totalViews: number;
  totalInquiries: number;
  totalSaves: number;
  whatsappClicks: number;
  emailClicks: number;
  formClicks: number;
  conversionRate: number;
  projectAnalytics: ProjectAnalytics[];
  hourlyDistribution: { hour: number; count: number }[];
  projectEngagement: ProjectEngagement[];
}
```

### Stats Cards (5 cards)

| Card | Icon | Data Source |
|------|------|-------------|
| Total Views | Eye | Sum of project views_count |
| Total Saves | Heart | Count from project_favorites |
| Total Clicks | MousePointerClick | Count from project_inquiries |
| WhatsApp | MessageSquare | inquiry_type = 'whatsapp' |
| Emails | Mail | inquiry_type = 'email' |

### Charts Row (2 charts)

1. **Inquiry Sources (Pie)**: Shows distribution of WhatsApp, Email, Form
2. **Activity by Hour (Bar)**: Shows when inquiries come in during the day

### Project Engagement Table

Shows each project with:
- Project image/name/city
- Views count
- Saves count
- Clicks count (total inquiries)

---

## Summary

| File | Change |
|------|--------|
| `useDeveloperAnalytics.tsx` | Add saves, clicks breakdown, hourly distribution, project engagement data |
| `DeveloperAnalytics.tsx` | Complete UI rewrite to match agent analytics layout |
| `ProjectEngagementTable.tsx` | New component for project-level engagement stats |
| `index.ts` | Export new component |

This will give developers the same analytics experience as agents, with consistent UI patterns and metrics that matter: views, saves, contact clicks by type, and activity timing.
