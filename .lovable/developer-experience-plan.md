# Developer Experience Enhancement Plan

> Complete roadmap for improving the developer portal, project management, leads, analytics, and public-facing pages.

---

## 📊 Current State Summary

### ✅ What Exists & Works Well
- **Registration**: 3-step wizard with email verification, logo upload, company details
- **Project Creation**: 7-step wizard (Basics, Details, Amenities, Unit Types, Photos, Description, Review)
- **Dashboard**: Stats cards, onboarding progress, quick actions, recent projects list
- **Analytics**: Views, saves, clicks, WhatsApp/email tracking, hourly activity, project engagement table
- **Leads**: Inquiry list with read/unread status, contact info display
- **Blog**: Full CRUD with review workflow, category support
- **Settings**: Profile editing, notifications, social links, specialties
- **Public Profile**: SEO-optimized with projects/blog tabs, social links, verification badge

---

## 🔧 PHASE 1: Quick Wins (1-2 hours each)

### 1.1 Auto-Save Project Wizard Drafts
**Problem**: Developers lose progress if browser closes during 7-step wizard  
**Solution**: Persist wizard state to sessionStorage (like property wizard does)

**Files to modify**:
- `src/components/developer/wizard/ProjectWizardContext.tsx`
- `src/pages/developer/NewProjectWizard.tsx`

**Implementation**:
```typescript
// In ProjectWizardContext.tsx
const STORAGE_KEY = 'project-wizard-draft';

// Load from storage on mount
useEffect(() => {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      setData(parsed.data);
      setCurrentStep(parsed.step);
    } catch (e) {}
  }
}, []);

// Save to storage on changes
useEffect(() => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ data, step: currentStep }));
}, [data, currentStep]);

// Clear on successful submit
const clearDraft = () => sessionStorage.removeItem(STORAGE_KEY);
```

---

### 1.2 WhatsApp Quick-Reply on Leads
**Problem**: Developers must manually compose WhatsApp messages for each lead  
**Solution**: Add one-click WhatsApp button with pre-filled context

**Files to modify**:
- `src/pages/developer/DeveloperLeads.tsx`

**Implementation**:
```tsx
// Add WhatsApp button next to email button
const whatsappMessage = `Hi ${inquiry.name}, thank you for your interest in ${inquiry.project.name}. I'd be happy to discuss the project with you.`;
const whatsappUrl = buildWhatsAppUrl(inquiry.phone, whatsappMessage);

<Button variant="default" size="sm" onClick={() => openWhatsApp(whatsappUrl)}>
  <MessageCircle className="h-4 w-4 mr-2" />
  Reply via WhatsApp
</Button>
```

---

### 1.3 Lead Filters by Project & Date
**Problem**: Developers with many leads can't find specific ones quickly  
**Solution**: Add filter dropdowns for project and date range

**Files to modify**:
- `src/pages/developer/DeveloperLeads.tsx`

**Implementation**:
```tsx
const [projectFilter, setProjectFilter] = useState<string>('all');
const [dateFilter, setDateFilter] = useState<'7d' | '30d' | '90d' | 'all'>('all');

const filteredInquiries = useMemo(() => {
  return inquiries.filter(i => {
    if (projectFilter !== 'all' && i.project.id !== projectFilter) return false;
    if (dateFilter !== 'all') {
      const days = { '7d': 7, '30d': 30, '90d': 90 }[dateFilter];
      const cutoff = subDays(new Date(), days);
      if (new Date(i.created_at) < cutoff) return false;
    }
    return true;
  });
}, [inquiries, projectFilter, dateFilter]);
```

---

### 1.4 Lead Export to CSV
**Problem**: Developers can't export leads for external CRM or reporting  
**Solution**: Add "Export" button that downloads CSV

**Files to modify**:
- `src/pages/developer/DeveloperLeads.tsx`

**Implementation**:
```tsx
const exportToCSV = () => {
  const headers = ['Name', 'Email', 'Phone', 'Project', 'Unit Type', 'Budget', 'Message', 'Date'];
  const rows = filteredInquiries.map(i => [
    i.name, i.email, i.phone || '', i.project.name,
    i.preferred_unit_type || '', i.budget_range || '',
    i.message.replace(/,/g, ';'), format(new Date(i.created_at), 'yyyy-MM-dd')
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
};
```

---

## 🚀 PHASE 2: High Impact Features

### 2.1 Unit Status Tracking (Available/Reserved/Sold)
**Problem**: No way to track which units are sold vs available  
**Solution**: Add status field to unit types with visual indicators

**Database migration**:
```sql
-- Add status tracking to project_units
ALTER TABLE project_units 
ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available' 
CHECK (availability_status IN ('available', 'reserved', 'sold'));

ALTER TABLE project_units 
ADD COLUMN IF NOT EXISTS reserved_at timestamp with time zone;

ALTER TABLE project_units 
ADD COLUMN IF NOT EXISTS sold_at timestamp with time zone;

ALTER TABLE project_units 
ADD COLUMN IF NOT EXISTS buyer_name text;

ALTER TABLE project_units 
ADD COLUMN IF NOT EXISTS buyer_contact text;
```

**Files to modify**:
- `src/components/developer/wizard/ProjectWizardContext.tsx` - Add status to UnitTypeData
- `src/components/developer/wizard/steps/StepUnitTypes.tsx` - Add status selector
- `src/pages/developer/DeveloperProjects.tsx` - Show unit availability summary
- `src/pages/ProjectDetail.tsx` - Show availability badges on units

---

### 2.2 Lead Status Pipeline
**Problem**: All leads look the same regardless of progress  
**Solution**: Add pipeline stages: New → Contacted → Qualified → Converted → Lost

**Database migration**:
```sql
ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS lead_status text DEFAULT 'new'
CHECK (lead_status IN ('new', 'contacted', 'qualified', 'converted', 'lost'));

ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS status_updated_at timestamp with time zone;

ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS internal_notes text;

ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS follow_up_date date;
```

**Files to modify**:
- `src/pages/developer/DeveloperLeads.tsx` - Add kanban-style view or status badges

---

### 2.3 Response Time Tracking
**Problem**: No visibility into how quickly developers respond  
**Solution**: Track first response time, show on public profile as trust signal

**Database migration**:
```sql
ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS first_response_at timestamp with time zone;

-- Create function to calculate average response time
CREATE OR REPLACE FUNCTION get_developer_avg_response_time(dev_id uuid)
RETURNS interval
LANGUAGE sql
STABLE
AS $$
  SELECT AVG(first_response_at - created_at)
  FROM project_inquiries
  WHERE developer_id = dev_id 
    AND first_response_at IS NOT NULL
    AND first_response_at > created_at;
$$;
```

**Files to modify**:
- `src/pages/developer/DeveloperLeads.tsx` - Add "Mark as Responded" action
- `src/pages/DeveloperDetail.tsx` - Show "Typically responds within X hours"

---

### 2.4 Conversion Funnel Chart
**Problem**: Analytics show raw numbers but not conversion rates  
**Solution**: Add funnel visualization: Views → Saves → Inquiries → Conversions

**Files to modify**:
- `src/components/developer/analytics/ConversionFunnel.tsx` (exists but may need enhancement)
- `src/pages/developer/DeveloperAnalytics.tsx`

---

## 📈 PHASE 3: Polish & Advanced Features

### 3.1 Clone Project Action
**Problem**: Creating similar projects requires re-entering all data  
**Solution**: Add "Duplicate" action that copies project as new draft

**Files to modify**:
- `src/pages/developer/DeveloperProjects.tsx`
- `src/hooks/useDeveloperProjects.tsx` - Add `useCloneProject` mutation

**Implementation**:
```typescript
export function useCloneProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      // Fetch original project
      const { data: original } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      // Create copy with modified name and new slug
      const { data: clone } = await supabase
        .from('projects')
        .insert({
          ...original,
          id: undefined,
          name: `${original.name} (Copy)`,
          slug: `${original.slug}-copy-${Date.now().toString(36)}`,
          verification_status: 'draft',
          is_published: false,
          created_at: undefined,
          updated_at: undefined,
        })
        .select()
        .single();

      return clone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerProjects'] });
      toast.success('Project duplicated as draft');
    },
  });
}
```

---

### 3.2 Comparative Analytics
**Problem**: Developers don't know how their projects compare to market  
**Solution**: Show project performance vs city/neighborhood averages

**Files to modify**:
- `src/hooks/useDeveloperAnalytics.tsx` - Fetch city benchmark data
- `src/pages/developer/DeveloperAnalytics.tsx` - Add comparison card

---

### 3.3 Weekly Email Digest
**Problem**: Developers must log in to see performance  
**Solution**: Automated weekly email with key metrics

**New edge function**:
- `supabase/functions/send-developer-weekly-digest/index.ts`

**Content**:
- Total views this week (vs last week)
- New inquiries received
- Response rate
- Top performing project
- Actionable recommendations

---

### 3.4 Developer Reviews/Testimonials
**Problem**: No social proof from past buyers  
**Solution**: Allow verified buyers to leave reviews post-delivery

**Database migration**:
```sql
CREATE TABLE developer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid REFERENCES developers(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text,
  is_verified_buyer boolean DEFAULT false,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE developer_reviews ENABLE ROW LEVEL SECURITY;
```

---

## 🔔 PHASE 4: Notifications & Automation

### 4.1 Enhanced Notification Types
**Current**: Basic notification bell exists  
**Add**: More notification types with actionable links

| Event | Notification Title | Action URL |
|-------|-------------------|------------|
| New inquiry | "New inquiry for {project}" | `/developer/leads` |
| Project approved | "Your project is now live!" | `/projects/{slug}` |
| Changes requested | "Action needed: {project}" | `/developer/projects/{id}/edit` |
| View milestone | "{project} reached 1000 views!" | `/developer/analytics` |
| Lead unanswered 24h | "Don't forget to respond to {name}" | `/developer/leads` |

---

### 4.2 Real-Time Lead Notifications
**Problem**: Developers don't know immediately when leads come in  
**Solution**: Enable Supabase Realtime for instant updates

**Database migration**:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE project_inquiries;
```

**Files to modify**:
- `src/pages/developer/DeveloperLeads.tsx` - Subscribe to realtime changes

---

## 🎨 PHASE 5: UI/UX Improvements

### 5.1 Mobile-Optimized Dashboard
**Current state**: Works but not optimized  
**Improvements**:
- Collapsible stat cards
- Bottom navigation for key actions
- Swipe gestures on lead cards
- Floating action button for quick add

### 5.2 Bulk Image Management
**Problem**: Tedious to reorder or delete multiple images  
**Solution**: Drag-and-drop with multi-select

**Files to modify**:
- `src/components/developer/wizard/steps/StepPhotos.tsx`

### 5.3 Project Preview Modal
**Problem**: Developers can't see how project will look before submitting  
**Solution**: Add "Preview" button on review step

**Files to modify**:
- `src/components/developer/wizard/steps/StepReview.tsx`
- `src/components/developer/wizard/steps/ProjectPreviewDialog.tsx` (exists, may need updates)

---

## 📁 Files to Create

| File Path | Purpose |
|-----------|---------|
| `src/components/developer/leads/LeadFilters.tsx` | Filter controls for leads page |
| `src/components/developer/leads/LeadExportButton.tsx` | CSV export functionality |
| `src/components/developer/leads/LeadPipeline.tsx` | Kanban-style lead view |
| `src/components/developer/units/UnitStatusBadge.tsx` | Visual status indicator |
| `src/components/developer/units/UnitReservationModal.tsx` | Mark unit as reserved |
| `src/components/developer/analytics/ComparisonCard.tsx` | Market comparison |
| `src/hooks/useDeveloperLeadFilters.tsx` | Lead filtering logic |
| `src/hooks/useCloneProject.tsx` | Project duplication |
| `supabase/functions/send-developer-weekly-digest/index.ts` | Weekly email automation |

---

## 📁 Files to Modify

| File Path | Changes |
|-----------|---------|
| `src/components/developer/wizard/ProjectWizardContext.tsx` | Add sessionStorage persistence |
| `src/pages/developer/DeveloperLeads.tsx` | Add WhatsApp reply, filters, export, pipeline |
| `src/pages/developer/DeveloperProjects.tsx` | Add clone action, unit status summary |
| `src/pages/developer/DeveloperAnalytics.tsx` | Add funnel, comparison, export |
| `src/pages/developer/DeveloperSettings.tsx` | Add response time display option |
| `src/pages/DeveloperDetail.tsx` | Add response time badge, reviews section |
| `src/hooks/useDeveloperProjects.tsx` | Add clone mutation |
| `src/hooks/useDeveloperAnalytics.tsx` | Add comparison data fetching |

---

## 🗄️ Database Migrations Required

### Migration 1: Unit Status Tracking
```sql
ALTER TABLE project_units 
ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available' 
CHECK (availability_status IN ('available', 'reserved', 'sold'));

ALTER TABLE project_units 
ADD COLUMN IF NOT EXISTS reserved_at timestamp with time zone;
ALTER TABLE project_units 
ADD COLUMN IF NOT EXISTS sold_at timestamp with time zone;
```

### Migration 2: Lead Pipeline
```sql
ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS lead_status text DEFAULT 'new'
CHECK (lead_status IN ('new', 'contacted', 'qualified', 'converted', 'lost'));

ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS first_response_at timestamp with time zone;
ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS internal_notes text;
ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS follow_up_date date;
```

### Migration 3: Developer Reviews
```sql
CREATE TABLE developer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid REFERENCES developers(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text,
  is_verified_buyer boolean DEFAULT false,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE developer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published reviews"
ON developer_reviews FOR SELECT
USING (is_published = true);

CREATE POLICY "Users can create reviews"
ON developer_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 📊 Success Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Wizard completion rate | Unknown | 80%+ | Track step abandonment |
| Lead response time | Unknown | <4 hours | `first_response_at` field |
| Lead conversion rate | Unknown | 15%+ | `lead_status = 'converted'` count |
| Dashboard engagement | Unknown | Daily login | `last_active_at` tracking |
| Project draft to submit | Unknown | 70%+ | `verification_status` transitions |

---

## 🎯 Implementation Priority Matrix

| Effort | High Impact | Low Impact |
|--------|-------------|------------|
| **Low** | Auto-save wizard, WhatsApp reply, Lead filters | Export CSV |
| **Medium** | Unit status tracking, Lead pipeline | Clone project |
| **High** | Weekly digest, Reviews system | Comparative analytics |

---

## Next Steps

1. ✅ Review and approve this plan
2. Run database migrations (Phase 2+)
3. Implement Phase 1 quick wins
4. Test each feature
5. Gather developer feedback
6. Iterate on Phase 2-5
