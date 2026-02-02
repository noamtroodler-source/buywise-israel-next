# Developer Experience Improvements - Detailed Specifications

> Complete specifications for all 40+ developer portal improvements

---

# 📦 PHASE 1: Quick Wins (4 improvements)

---

## 1.1 Auto-Save Project Wizard Drafts

**Priority**: 🔴 Critical  
**Effort**: Low (1-2 hours)  
**Impact**: High - Prevents data loss, improves completion rates

### Problem
Developers lose all progress if:
- Browser crashes during 7-step wizard
- Accidentally close tab
- Session timeout occurs
- Navigate away by mistake

### Solution
Persist wizard state to `sessionStorage` automatically, restore on return.

### Technical Implementation

**File**: `src/components/developer/wizard/ProjectWizardContext.tsx`

```typescript
// Add storage key constant
const WIZARD_STORAGE_KEY = 'project-wizard-draft';

// In ProjectWizardProvider:
// 1. Load saved state on mount
useEffect(() => {
  const saved = sessionStorage.getItem(WIZARD_STORAGE_KEY);
  if (saved) {
    try {
      const { data: savedData, step: savedStep } = JSON.parse(saved);
      setData(savedData);
      setCurrentStep(savedStep);
    } catch (e) {
      console.error('Failed to restore wizard draft:', e);
    }
  }
}, []);

// 2. Save on every change
useEffect(() => {
  sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({
    data,
    step: currentStep,
    savedAt: new Date().toISOString()
  }));
}, [data, currentStep]);

// 3. Add clear function
const clearDraft = useCallback(() => {
  sessionStorage.removeItem(WIZARD_STORAGE_KEY);
}, []);

// 4. Expose in context
return (
  <ProjectWizardContext.Provider value={{
    ...existingValues,
    clearDraft,
    hasSavedDraft: !!sessionStorage.getItem(WIZARD_STORAGE_KEY)
  }}>
```

**File**: `src/pages/developer/NewProjectWizard.tsx`

```typescript
// Show "Resume Draft" banner if draft exists
{hasSavedDraft && (
  <Alert className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Draft Restored</AlertTitle>
    <AlertDescription className="flex items-center justify-between">
      <span>Your previous progress has been restored.</span>
      <Button variant="ghost" size="sm" onClick={() => {
        resetWizard();
        clearDraft();
      }}>
        Start Fresh
      </Button>
    </AlertDescription>
  </Alert>
)}

// Clear draft on successful submit
const handleSubmit = async () => {
  await createProject.mutateAsync(data);
  clearDraft();
  navigate('/developer/projects');
};
```

### UI/UX Details
- Auto-save indicator: Show "Draft saved" toast every 30 seconds
- Last saved timestamp in footer
- "Start Fresh" option to discard draft
- Restore confirmation if draft is older than 7 days

### Acceptance Criteria
- [ ] Draft persists across browser refresh
- [ ] Draft restores correct step position
- [ ] "Start Fresh" clears all data
- [ ] Draft clears after successful submission
- [ ] Works with all 7 wizard steps

---

## 1.2 WhatsApp Quick-Reply on Leads

**Priority**: 🔴 Critical  
**Effort**: Low (1 hour)  
**Impact**: High - Faster response time, better lead conversion

### Problem
Current lead response workflow:
1. View lead details
2. Copy phone number
3. Open WhatsApp
4. Paste number
5. Type message manually

### Solution
One-click WhatsApp button with pre-filled contextual message.

### Technical Implementation

**File**: `src/pages/developer/DeveloperLeads.tsx`

```typescript
import { buildWhatsAppUrl, openWhatsApp } from '@/lib/whatsapp';

// Inside inquiry card component
const handleWhatsAppReply = (inquiry: ProjectInquiry) => {
  const message = `Hi ${inquiry.name}! 👋

Thank you for your interest in ${inquiry.project.name} in ${inquiry.project.city}.

I'd be happy to answer any questions and arrange a viewing at your convenience.

What would be a good time to connect?`;

  const url = buildWhatsAppUrl(inquiry.phone, message);
  openWhatsApp(url);
  
  // Mark as contacted
  markAsReadMutation.mutate(inquiry.id);
};

// Add button to UI
{inquiry.phone && (
  <Button 
    onClick={() => handleWhatsAppReply(inquiry)}
    className="bg-[#25D366] hover:bg-[#128C7E] text-white"
  >
    <MessageCircle className="h-4 w-4 mr-2" />
    Reply via WhatsApp
  </Button>
)}
```

### Message Templates
Offer 3 quick templates:

1. **Standard Reply**:
   > Hi {name}! Thank you for your interest in {project}. I'd be happy to discuss details and arrange a viewing. When works for you?

2. **Pricing Inquiry**:
   > Hi {name}! Great question about pricing at {project}. Units start from ₪{price_from}. Would you like to schedule a call to discuss options?

3. **Availability Check**:
   > Hi {name}! Thanks for reaching out about {project}. We currently have {available_units} units available. Want me to send you the floor plans?

### UI/UX Details
- WhatsApp green button (#25D366)
- Dropdown for template selection (optional)
- Auto-marks lead as "contacted" after click
- Works on mobile and desktop

### Acceptance Criteria
- [ ] Button appears only when phone exists
- [ ] Opens WhatsApp with pre-filled message
- [ ] Message includes lead name and project name
- [ ] Works with centralized WhatsApp system
- [ ] Tracks click for analytics

---

## 1.3 Lead Filters by Project & Date

**Priority**: 🟡 High  
**Effort**: Low (2 hours)  
**Impact**: Medium - Better lead management for active developers

### Problem
Developers with 50+ leads can't quickly find:
- Leads for a specific project
- Recent leads (last 7 days)
- Unread leads only

### Solution
Add filter bar with project dropdown, date range, and read status.

### Technical Implementation

**File**: `src/pages/developer/DeveloperLeads.tsx`

```typescript
import { subDays, isAfter } from 'date-fns';

// Filter state
const [filters, setFilters] = useState({
  projectId: 'all',
  dateRange: 'all' as 'all' | '7d' | '30d' | '90d',
  readStatus: 'all' as 'all' | 'unread' | 'read'
});

// Get unique projects for filter dropdown
const uniqueProjects = useMemo(() => {
  const projects = new Map();
  inquiries.forEach(i => {
    if (!projects.has(i.project.id)) {
      projects.set(i.project.id, { id: i.project.id, name: i.project.name });
    }
  });
  return Array.from(projects.values());
}, [inquiries]);

// Filter logic
const filteredInquiries = useMemo(() => {
  return inquiries.filter(inquiry => {
    // Project filter
    if (filters.projectId !== 'all' && inquiry.project.id !== filters.projectId) {
      return false;
    }
    
    // Date filter
    if (filters.dateRange !== 'all') {
      const days = { '7d': 7, '30d': 30, '90d': 90 }[filters.dateRange];
      const cutoffDate = subDays(new Date(), days);
      if (!isAfter(new Date(inquiry.created_at), cutoffDate)) {
        return false;
      }
    }
    
    // Read status filter
    if (filters.readStatus === 'unread' && inquiry.is_read) return false;
    if (filters.readStatus === 'read' && !inquiry.is_read) return false;
    
    return true;
  });
}, [inquiries, filters]);
```

**Filter UI Component**:

```tsx
<div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-xl mb-6">
  {/* Project Filter */}
  <Select 
    value={filters.projectId} 
    onValueChange={(v) => setFilters(f => ({ ...f, projectId: v }))}
  >
    <SelectTrigger className="w-[200px]">
      <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
      <SelectValue placeholder="All Projects" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Projects</SelectItem>
      {uniqueProjects.map(p => (
        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>

  {/* Date Filter */}
  <Select 
    value={filters.dateRange}
    onValueChange={(v) => setFilters(f => ({ ...f, dateRange: v as any }))}
  >
    <SelectTrigger className="w-[150px]">
      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Time</SelectItem>
      <SelectItem value="7d">Last 7 Days</SelectItem>
      <SelectItem value="30d">Last 30 Days</SelectItem>
      <SelectItem value="90d">Last 90 Days</SelectItem>
    </SelectContent>
  </Select>

  {/* Read Status */}
  <div className="flex gap-1 bg-background rounded-lg p-1">
    {['all', 'unread', 'read'].map((status) => (
      <Button
        key={status}
        variant={filters.readStatus === status ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setFilters(f => ({ ...f, readStatus: status as any }))}
      >
        {status === 'all' ? 'All' : status === 'unread' ? 'Unread' : 'Read'}
        {status === 'unread' && unreadCount > 0 && (
          <Badge variant="secondary" className="ml-1">{unreadCount}</Badge>
        )}
      </Button>
    ))}
  </div>

  {/* Clear Filters */}
  {(filters.projectId !== 'all' || filters.dateRange !== 'all' || filters.readStatus !== 'all') && (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={() => setFilters({ projectId: 'all', dateRange: 'all', readStatus: 'all' })}
    >
      <X className="h-4 w-4 mr-1" />
      Clear
    </Button>
  )}
</div>

{/* Results count */}
<p className="text-sm text-muted-foreground mb-4">
  Showing {filteredInquiries.length} of {inquiries.length} leads
</p>
```

### Acceptance Criteria
- [ ] Filter by project shows only leads for that project
- [ ] Date range filter works correctly
- [ ] Read/unread toggle works
- [ ] Filters persist during session
- [ ] "Clear Filters" resets all
- [ ] Shows result count

---

## 1.4 Lead Export to CSV

**Priority**: 🟡 High  
**Effort**: Low (1 hour)  
**Impact**: Medium - External CRM integration, reporting

### Problem
Developers want to:
- Import leads to external CRM (HubSpot, Salesforce)
- Create reports in Excel
- Share lead data with sales team
- Backup lead information

### Solution
"Export" button that downloads filtered leads as CSV file.

### Technical Implementation

**File**: `src/pages/developer/DeveloperLeads.tsx`

```typescript
import { format } from 'date-fns';

const exportToCSV = () => {
  // Define headers
  const headers = [
    'Name',
    'Email', 
    'Phone',
    'Project',
    'City',
    'Preferred Unit',
    'Budget Range',
    'Message',
    'Status',
    'Date Received',
    'Days Since Inquiry'
  ];
  
  // Map data to rows
  const rows = filteredInquiries.map(inquiry => {
    const daysSince = Math.floor(
      (Date.now() - new Date(inquiry.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return [
      inquiry.name,
      inquiry.email,
      inquiry.phone || '',
      inquiry.project.name,
      inquiry.project.city,
      inquiry.preferred_unit_type || '',
      inquiry.budget_range || '',
      // Escape commas and quotes in message
      `"${(inquiry.message || '').replace(/"/g, '""')}"`,
      inquiry.is_read ? 'Read' : 'Unread',
      format(new Date(inquiry.created_at), 'yyyy-MM-dd HH:mm'),
      daysSince.toString()
    ];
  });
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `leads-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  toast.success(`Exported ${filteredInquiries.length} leads`);
};
```

**UI Button**:

```tsx
<Button 
  variant="outline" 
  onClick={exportToCSV}
  disabled={filteredInquiries.length === 0}
>
  <Download className="h-4 w-4 mr-2" />
  Export CSV
  {filteredInquiries.length > 0 && (
    <Badge variant="secondary" className="ml-2">
      {filteredInquiries.length}
    </Badge>
  )}
</Button>
```

### CSV Output Format
```csv
Name,Email,Phone,Project,City,Preferred Unit,Budget Range,Message,Status,Date Received,Days Since Inquiry
John Doe,john@email.com,+972501234567,Park Heights,Tel Aviv,3-Room,2-3M NIS,"I'm interested in...",Unread,2024-01-15 10:30,5
```

### Acceptance Criteria
- [ ] Exports all filtered leads
- [ ] Respects current filters
- [ ] Properly escapes special characters
- [ ] Includes all relevant fields
- [ ] Shows toast confirmation
- [ ] Disabled when no leads to export

---

# 📦 PHASE 2: High Impact Features (4 improvements)

---

## 2.1 Unit Status Tracking (Available/Reserved/Sold)

**Priority**: 🔴 Critical  
**Effort**: Medium (4-6 hours)  
**Impact**: High - Core business functionality

### Problem
Currently no way to track:
- Which units are still available
- Reserved units pending payment
- Sold units
- Availability changes over time

### Solution
Add `availability_status` field to units with visual tracking.

### Database Migration

```sql
-- Add availability tracking to project_units
ALTER TABLE project_units 
ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available' 
CHECK (availability_status IN ('available', 'reserved', 'sold', 'unavailable'));

ALTER TABLE project_units 
ADD COLUMN IF NOT EXISTS status_changed_at timestamp with time zone;

ALTER TABLE project_units 
ADD COLUMN IF NOT EXISTS reserved_by_name text;

ALTER TABLE project_units 
ADD COLUMN IF NOT EXISTS reserved_by_contact text;

ALTER TABLE project_units 
ADD COLUMN IF NOT EXISTS reservation_notes text;

ALTER TABLE project_units 
ADD COLUMN IF NOT EXISTS reservation_expires_at timestamp with time zone;

-- Create history table for tracking changes
CREATE TABLE IF NOT EXISTS unit_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES project_units(id) ON DELETE CASCADE,
  old_status text,
  new_status text,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamp with time zone DEFAULT now(),
  notes text
);

ALTER TABLE unit_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers can view their unit history"
ON unit_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_units pu
    JOIN projects p ON p.id = pu.project_id
    JOIN developers d ON d.id = p.developer_id
    WHERE pu.id = unit_status_history.unit_id
    AND d.user_id = auth.uid()
  )
);
```

### Type Updates

**File**: `src/types/projects.ts`

```typescript
export type UnitAvailabilityStatus = 'available' | 'reserved' | 'sold' | 'unavailable';

export interface ProjectUnit {
  id: string;
  project_id: string;
  unit_type: string;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number | null;
  floor: number | null;
  price: number | null;
  currency: string;
  status: string;
  floor_plan_url: string | null;
  created_at: string;
  // New fields
  availability_status: UnitAvailabilityStatus;
  status_changed_at: string | null;
  reserved_by_name: string | null;
  reserved_by_contact: string | null;
  reservation_notes: string | null;
  reservation_expires_at: string | null;
}
```

### UI Component: UnitStatusBadge

**File**: `src/components/developer/units/UnitStatusBadge.tsx`

```tsx
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, MinusCircle } from 'lucide-react';

const statusConfig = {
  available: {
    label: 'Available',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700 border-green-200'
  },
  reserved: {
    label: 'Reserved',
    icon: Clock,
    className: 'bg-amber-100 text-amber-700 border-amber-200'
  },
  sold: {
    label: 'Sold',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 border-red-200'
  },
  unavailable: {
    label: 'Unavailable',
    icon: MinusCircle,
    className: 'bg-gray-100 text-gray-700 border-gray-200'
  }
};

export function UnitStatusBadge({ status }: { status: UnitAvailabilityStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
```

### UI Component: UnitStatusEditor

**File**: `src/components/developer/units/UnitStatusEditor.tsx`

```tsx
export function UnitStatusEditor({ 
  unit, 
  onUpdate 
}: { 
  unit: ProjectUnit; 
  onUpdate: (status: UnitAvailabilityStatus, notes?: string) => void;
}) {
  const [showReservationForm, setShowReservationForm] = useState(false);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <UnitStatusBadge status={unit.availability_status} />
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onUpdate('available')}>
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          Mark Available
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setShowReservationForm(true)}>
          <Clock className="h-4 w-4 mr-2 text-amber-600" />
          Mark Reserved...
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpdate('sold')}>
          <XCircle className="h-4 w-4 mr-2 text-red-600" />
          Mark Sold
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onUpdate('unavailable')}>
          <MinusCircle className="h-4 w-4 mr-2 text-gray-600" />
          Mark Unavailable
        </DropdownMenuItem>
      </DropdownMenuContent>
      
      {/* Reservation Form Dialog */}
      <Dialog open={showReservationForm} onOpenChange={setShowReservationForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve Unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Buyer Name</Label>
              <Input placeholder="John Doe" />
            </div>
            <div>
              <Label>Contact Info</Label>
              <Input placeholder="Phone or email" />
            </div>
            <div>
              <Label>Reservation Expires</Label>
              <Input type="date" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Any additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReservationForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleReserve}>
              Confirm Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}
```

### Dashboard Summary

Show on `DeveloperProjects.tsx`:

```tsx
// Calculate unit summary per project
const unitSummary = {
  available: units.filter(u => u.availability_status === 'available').length,
  reserved: units.filter(u => u.availability_status === 'reserved').length,
  sold: units.filter(u => u.availability_status === 'sold').length,
  total: units.length
};

// Display
<div className="flex gap-2 text-sm">
  <span className="text-green-600">{unitSummary.available} available</span>
  <span className="text-amber-600">{unitSummary.reserved} reserved</span>
  <span className="text-red-600">{unitSummary.sold} sold</span>
</div>
```

### Acceptance Criteria
- [ ] Can change unit status from project edit page
- [ ] Status badge shows on project cards
- [ ] Reservation form captures buyer info
- [ ] Status history is tracked
- [ ] Summary shows on dashboard
- [ ] Public project page shows availability

---

## 2.2 Lead Status Pipeline

**Priority**: 🔴 Critical  
**Effort**: Medium (4-6 hours)  
**Impact**: High - Proper CRM functionality

### Problem
All leads appear the same regardless of:
- Whether developer has contacted them
- If they're qualified or not
- Conversion outcome

### Solution
Add pipeline stages: New → Contacted → Qualified → Converted → Lost

### Database Migration

```sql
-- Add pipeline fields to project_inquiries
ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS lead_status text DEFAULT 'new'
CHECK (lead_status IN ('new', 'contacted', 'qualified', 'negotiating', 'converted', 'lost'));

ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS lead_status_updated_at timestamp with time zone;

ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS internal_notes text;

ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS follow_up_date date;

ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS lost_reason text;

ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS conversion_value numeric;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_inquiries_lead_status 
ON project_inquiries(developer_id, lead_status);
```

### Lead Status Configuration

```typescript
export const leadStatusConfig = {
  new: {
    label: 'New',
    color: 'bg-blue-100 text-blue-700',
    icon: Sparkles,
    description: 'Just received'
  },
  contacted: {
    label: 'Contacted',
    color: 'bg-purple-100 text-purple-700',
    icon: MessageCircle,
    description: 'Initial contact made'
  },
  qualified: {
    label: 'Qualified',
    color: 'bg-amber-100 text-amber-700',
    icon: Target,
    description: 'Serious buyer confirmed'
  },
  negotiating: {
    label: 'Negotiating',
    color: 'bg-orange-100 text-orange-700',
    icon: Handshake,
    description: 'In discussions'
  },
  converted: {
    label: 'Converted',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
    description: 'Deal closed!'
  },
  lost: {
    label: 'Lost',
    color: 'bg-gray-100 text-gray-500',
    icon: XCircle,
    description: 'Did not proceed'
  }
};
```

### Kanban Board View (Optional)

```tsx
export function LeadPipelineBoard({ inquiries }: { inquiries: ProjectInquiry[] }) {
  const stages = ['new', 'contacted', 'qualified', 'negotiating', 'converted'];
  
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map(stage => {
        const stageLeads = inquiries.filter(i => i.lead_status === stage);
        const config = leadStatusConfig[stage];
        
        return (
          <div key={stage} className="flex-shrink-0 w-72">
            <div className="flex items-center gap-2 mb-3 px-2">
              <config.icon className="h-4 w-4" />
              <span className="font-medium">{config.label}</span>
              <Badge variant="secondary">{stageLeads.length}</Badge>
            </div>
            <div className="space-y-2">
              {stageLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Lead Status Update Hook

```typescript
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      inquiryId, 
      status, 
      notes,
      lostReason,
      conversionValue
    }: {
      inquiryId: string;
      status: LeadStatus;
      notes?: string;
      lostReason?: string;
      conversionValue?: number;
    }) => {
      const { error } = await supabase
        .from('project_inquiries')
        .update({
          lead_status: status,
          lead_status_updated_at: new Date().toISOString(),
          internal_notes: notes,
          lost_reason: status === 'lost' ? lostReason : null,
          conversion_value: status === 'converted' ? conversionValue : null,
        })
        .eq('id', inquiryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developer-inquiries'] });
      toast.success('Lead status updated');
    }
  });
}
```

### Acceptance Criteria
- [ ] Can change lead status via dropdown
- [ ] Status badge shows current stage
- [ ] Can add internal notes
- [ ] "Lost" prompts for reason
- [ ] "Converted" prompts for value
- [ ] Filter by status works
- [ ] Analytics shows conversion funnel

---

## 2.3 Response Time Tracking

**Priority**: 🟡 High  
**Effort**: Medium (3-4 hours)  
**Impact**: High - Trust signal for buyers

### Problem
No visibility into:
- How quickly developers respond
- Performance benchmarks
- Trust indicator for public profile

### Solution
Track first response time, display as "Typically responds within X hours"

### Database Migration

```sql
-- Add response tracking
ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS first_response_at timestamp with time zone;

ALTER TABLE project_inquiries 
ADD COLUMN IF NOT EXISTS response_method text
CHECK (response_method IN ('whatsapp', 'email', 'phone', 'in_person', 'other'));

-- Create function to calculate average response time
CREATE OR REPLACE FUNCTION get_developer_avg_response_time(dev_id uuid)
RETURNS TABLE(
  avg_hours numeric,
  response_count integer,
  total_inquiries integer
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    ROUND(EXTRACT(EPOCH FROM AVG(first_response_at - created_at)) / 3600, 1) as avg_hours,
    COUNT(first_response_at)::integer as response_count,
    COUNT(*)::integer as total_inquiries
  FROM project_inquiries
  WHERE developer_id = dev_id 
    AND first_response_at IS NOT NULL
    AND first_response_at > created_at;
$$;
```

### Mark as Responded Action

```typescript
const markAsResponded = useMutation({
  mutationFn: async ({ inquiryId, method }: { inquiryId: string; method: string }) => {
    const { error } = await supabase
      .from('project_inquiries')
      .update({
        first_response_at: new Date().toISOString(),
        response_method: method,
        is_read: true,
      })
      .eq('id', inquiryId)
      .is('first_response_at', null); // Only if not already responded
    
    if (error) throw error;
  }
});

// Auto-mark when using WhatsApp quick-reply
const handleWhatsAppReply = (inquiry: ProjectInquiry) => {
  openWhatsApp(buildWhatsAppUrl(inquiry.phone, message));
  markAsResponded.mutate({ inquiryId: inquiry.id, method: 'whatsapp' });
};
```

### Display on Public Profile

**File**: `src/pages/DeveloperDetail.tsx`

```tsx
// Fetch response time stats
const { data: responseStats } = useQuery({
  queryKey: ['developer-response-time', developer?.id],
  queryFn: async () => {
    const { data } = await supabase
      .rpc('get_developer_avg_response_time', { dev_id: developer.id });
    return data?.[0];
  },
  enabled: !!developer?.id
});

// Display badge
{responseStats?.avg_hours && (
  <div className="flex items-center gap-2 text-sm">
    <Clock className="h-4 w-4 text-primary" />
    <span>
      Typically responds within{' '}
      <strong>
        {responseStats.avg_hours < 1 
          ? 'an hour' 
          : responseStats.avg_hours < 24 
            ? `${Math.round(responseStats.avg_hours)} hours`
            : `${Math.round(responseStats.avg_hours / 24)} days`
        }
      </strong>
    </span>
    {responseStats.avg_hours < 4 && (
      <Badge variant="secondary" className="bg-green-100 text-green-700">
        Fast Responder
      </Badge>
    )}
  </div>
)}
```

### Response Time Benchmarks

| Response Time | Badge | Description |
|--------------|-------|-------------|
| < 1 hour | ⚡ Lightning Fast | Exceptional responsiveness |
| 1-4 hours | 🏆 Fast Responder | Above average |
| 4-24 hours | ✓ Responsive | Normal response time |
| 1-3 days | - | No badge |
| > 3 days | ⚠️ Slow | May need attention |

### Acceptance Criteria
- [ ] First response time auto-recorded
- [ ] Multiple response methods supported
- [ ] Average calculated correctly
- [ ] Badge shows on public profile
- [ ] "Fast Responder" badge for <4 hours
- [ ] Metric shown in developer analytics

---

## 2.4 Conversion Funnel Chart

**Priority**: 🟡 High  
**Effort**: Medium (3-4 hours)  
**Impact**: Medium - Better analytics insights

### Problem
Analytics show raw numbers but not:
- Conversion rates between stages
- Funnel drop-off points
- Performance trends

### Solution
Visual funnel chart: Views → Saves → Inquiries → Contacted → Converted

### Technical Implementation

**File**: `src/components/developer/analytics/ConversionFunnel.tsx`

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FunnelData {
  stage: string;
  value: number;
  conversionRate: number;
}

export function ConversionFunnel({ data }: { data: FunnelData[] }) {
  const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#22c55e'];
  
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Conversion Funnel
        </CardTitle>
        <CardDescription>
          How visitors convert to buyers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={data} 
            layout="vertical"
            margin={{ left: 100 }}
          >
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="stage" 
              tick={{ fontSize: 14 }}
            />
            <Tooltip 
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const item = payload[0].payload as FunnelData;
                return (
                  <div className="bg-popover border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold">{item.stage}</p>
                    <p>{item.value.toLocaleString()} users</p>
                    <p className="text-sm text-muted-foreground">
                      {item.conversionRate}% of previous stage
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={colors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Conversion rate summary */}
        <div className="mt-4 pt-4 border-t flex justify-between text-sm">
          <div>
            <p className="text-muted-foreground">Views to Inquiry</p>
            <p className="text-lg font-bold">{((data[2]?.value / data[0]?.value) * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Inquiry to Contact</p>
            <p className="text-lg font-bold">{((data[3]?.value / data[2]?.value) * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Overall Conversion</p>
            <p className="text-lg font-bold text-primary">
              {((data[4]?.value / data[0]?.value) * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Data Fetching

```typescript
// In useDeveloperAnalytics.tsx
const funnelData = useMemo(() => {
  const views = analytics?.totalViews || 0;
  const saves = analytics?.totalSaves || 0;
  const inquiries = analytics?.totalInquiries || 0;
  const contacted = inquiries.filter(i => i.lead_status !== 'new').length;
  const converted = inquiries.filter(i => i.lead_status === 'converted').length;
  
  return [
    { stage: 'Project Views', value: views, conversionRate: 100 },
    { stage: 'Saved to Favorites', value: saves, conversionRate: views ? Math.round((saves/views)*100) : 0 },
    { stage: 'Sent Inquiry', value: inquiries, conversionRate: saves ? Math.round((inquiries/saves)*100) : 0 },
    { stage: 'Developer Contacted', value: contacted, conversionRate: inquiries ? Math.round((contacted/inquiries)*100) : 0 },
    { stage: 'Converted to Sale', value: converted, conversionRate: contacted ? Math.round((converted/contacted)*100) : 0 },
  ];
}, [analytics]);
```

### Acceptance Criteria
- [ ] Funnel shows 5 stages
- [ ] Conversion rates calculated correctly
- [ ] Visual bar chart renders
- [ ] Tooltips show details
- [ ] Summary metrics at bottom
- [ ] Empty state when no data

---

# 📦 PHASE 3: Polish & Advanced (4 improvements)

---

## 3.1 Clone Project Action

**Priority**: 🟢 Medium  
**Effort**: Low (2 hours)  
**Impact**: Medium - Time savings for developers

### Problem
Creating multiple similar projects (phases of same development) requires:
- Re-entering all common data
- Re-uploading images
- Re-selecting amenities

### Solution
"Duplicate" action that copies project as new draft.

### Technical Implementation

**File**: `src/hooks/useDeveloperProjects.tsx`

```typescript
export function useCloneProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      // 1. Fetch original project
      const { data: original, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError || !original) throw new Error('Project not found');

      // 2. Create new slug
      const newSlug = `${original.slug}-copy-${Date.now().toString(36)}`;

      // 3. Insert copy
      const { data: clone, error: insertError } = await supabase
        .from('projects')
        .insert({
          ...original,
          id: undefined, // Let DB generate new ID
          name: `${original.name} (Copy)`,
          slug: newSlug,
          verification_status: 'draft',
          is_published: false,
          views_count: 0,
          submitted_at: null,
          created_at: undefined,
          updated_at: undefined,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Clone unit types
      const { data: units } = await supabase
        .from('project_units')
        .select('*')
        .eq('project_id', projectId);

      if (units?.length) {
        const clonedUnits = units.map(u => ({
          ...u,
          id: undefined,
          project_id: clone.id,
          availability_status: 'available',
          created_at: undefined,
        }));

        await supabase.from('project_units').insert(clonedUnits);
      }

      return clone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerProjects'] });
      toast.success('Project duplicated as draft');
    },
    onError: (error) => {
      toast.error('Failed to duplicate: ' + error.message);
    }
  });
}
```

**File**: `src/pages/developer/DeveloperProjects.tsx`

Add to dropdown menu:

```tsx
const cloneProject = useCloneProject();

<DropdownMenuItem 
  onClick={() => cloneProject.mutate(project.id)}
  disabled={cloneProject.isPending}
>
  <Copy className="h-4 w-4 mr-2" />
  Duplicate Project
</DropdownMenuItem>
```

### What Gets Cloned
- ✅ Project name (with " (Copy)" suffix)
- ✅ Description
- ✅ Location info
- ✅ Status/progress
- ✅ Pricing
- ✅ Amenities
- ✅ Images array
- ✅ Unit types (all reset to "available")
- ❌ Views count (reset to 0)
- ❌ Verification status (set to "draft")
- ❌ Submission date

### Acceptance Criteria
- [ ] Clone creates new draft project
- [ ] Original name + " (Copy)"
- [ ] All images preserved
- [ ] All unit types cloned
- [ ] New project in draft status
- [ ] User redirected to edit cloned project

---

## 3.2 Comparative Analytics

**Priority**: 🟢 Medium  
**Effort**: Medium (4-6 hours)  
**Impact**: Medium - Competitive insights

### Problem
Developers don't know:
- How their project performs vs city average
- If their pricing is competitive
- Where they rank among peers

### Solution
Show comparison cards with city/market benchmarks.

### Technical Implementation

**New Hook**: `src/hooks/useDeveloperBenchmarks.tsx`

```typescript
export function useDeveloperBenchmarks(developerId: string | undefined) {
  return useQuery({
    queryKey: ['developer-benchmarks', developerId],
    queryFn: async () => {
      if (!developerId) return null;

      // Get developer's projects
      const { data: projects } = await supabase
        .from('projects')
        .select('city, views_count, price_from')
        .eq('developer_id', developerId)
        .eq('verification_status', 'approved');

      if (!projects?.length) return null;

      // Get city averages
      const cities = [...new Set(projects.map(p => p.city))];
      const { data: cityProjects } = await supabase
        .from('projects')
        .select('city, views_count, price_from')
        .in('city', cities)
        .eq('is_published', true);

      // Calculate benchmarks
      const cityAverages: Record<string, { avgViews: number; avgPrice: number }> = {};
      cities.forEach(city => {
        const cityData = cityProjects?.filter(p => p.city === city) || [];
        cityAverages[city] = {
          avgViews: cityData.reduce((sum, p) => sum + (p.views_count || 0), 0) / cityData.length,
          avgPrice: cityData.reduce((sum, p) => sum + (p.price_from || 0), 0) / cityData.length,
        };
      });

      // Developer averages
      const devAvgViews = projects.reduce((sum, p) => sum + (p.views_count || 0), 0) / projects.length;
      const devAvgPrice = projects.reduce((sum, p) => sum + (p.price_from || 0), 0) / projects.length;

      return {
        developerAverages: { views: devAvgViews, price: devAvgPrice },
        cityAverages,
        comparison: {
          viewsVsMarket: devAvgViews / (Object.values(cityAverages)[0]?.avgViews || 1),
          priceVsMarket: devAvgPrice / (Object.values(cityAverages)[0]?.avgPrice || 1),
        }
      };
    },
    enabled: !!developerId
  });
}
```

### Comparison Card UI

```tsx
<Card className="rounded-2xl">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <BarChart3 className="h-5 w-5 text-primary" />
      Market Comparison
    </CardTitle>
  </CardHeader>
  <CardContent className="grid gap-4 md:grid-cols-2">
    {/* Views Comparison */}
    <div className="p-4 bg-muted/30 rounded-xl">
      <p className="text-sm text-muted-foreground">Your Views vs Market</p>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-2xl font-bold">
          {benchmarks?.comparison.viewsVsMarket > 1 ? '+' : ''}
          {Math.round((benchmarks?.comparison.viewsVsMarket - 1) * 100)}%
        </p>
        {benchmarks?.comparison.viewsVsMarket > 1 ? (
          <TrendingUp className="h-5 w-5 text-green-500" />
        ) : (
          <TrendingDown className="h-5 w-5 text-red-500" />
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {benchmarks?.comparison.viewsVsMarket > 1 
          ? 'Above market average' 
          : 'Below market average'}
      </p>
    </div>
    
    {/* Price Comparison */}
    <div className="p-4 bg-muted/30 rounded-xl">
      <p className="text-sm text-muted-foreground">Your Pricing vs Market</p>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-2xl font-bold">
          {benchmarks?.comparison.priceVsMarket > 1 ? '+' : ''}
          {Math.round((benchmarks?.comparison.priceVsMarket - 1) * 100)}%
        </p>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {benchmarks?.comparison.priceVsMarket > 1 
          ? 'Premium pricing' 
          : 'Competitive pricing'}
      </p>
    </div>
  </CardContent>
</Card>
```

### Acceptance Criteria
- [ ] Compare views to city average
- [ ] Compare pricing to market
- [ ] Show above/below indicators
- [ ] Handle multiple cities
- [ ] Empty state when no data

---

## 3.3 Weekly Email Digest

**Priority**: 🟢 Medium  
**Effort**: High (6-8 hours)  
**Impact**: Medium - Engagement without login

### Problem
Developers must log in to check performance.

### Solution
Automated weekly email with key metrics every Sunday at 9 AM.

### Edge Function

**File**: `supabase/functions/send-developer-weekly-digest/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get all developers with email notifications enabled
  const { data: developers } = await supabase
    .from('developers')
    .select('id, name, email, user_id')
    .eq('notify_email', true)
    .eq('status', 'active');

  if (!developers?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let sentCount = 0;

  for (const developer of developers) {
    // Get this week's stats
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, views_count')
      .eq('developer_id', developer.id);

    const { data: inquiries } = await supabase
      .from('project_inquiries')
      .select('id, project_id, created_at')
      .eq('developer_id', developer.id)
      .gte('created_at', oneWeekAgo);

    const totalViews = projects?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;
    const newInquiries = inquiries?.length || 0;
    const topProject = projects?.sort((a, b) => (b.views_count || 0) - (a.views_count || 0))[0];

    // Send email
    await resend.emails.send({
      from: 'BuyWise Israel <hello@buywiseisrael.com>',
      to: developer.email,
      subject: `📊 Your Weekly Performance Summary`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Hi ${developer.name}! 👋</h1>
          <p>Here's how your projects performed this week:</p>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin-top: 0;">This Week's Highlights</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <p style="color: #64748b; margin: 0;">Total Views</p>
                <p style="font-size: 32px; font-weight: bold; margin: 4px 0;">${totalViews.toLocaleString()}</p>
              </div>
              <div>
                <p style="color: #64748b; margin: 0;">New Inquiries</p>
                <p style="font-size: 32px; font-weight: bold; margin: 4px 0; color: #2563eb;">${newInquiries}</p>
              </div>
            </div>
          </div>
          
          ${topProject ? `
            <div style="background: #eff6ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h3 style="margin-top: 0;">🏆 Top Performing Project</h3>
              <p style="font-size: 18px; font-weight: 600;">${topProject.name}</p>
              <p style="color: #64748b;">${topProject.views_count || 0} views</p>
            </div>
          ` : ''}
          
          ${newInquiries > 0 ? `
            <p>You have <strong>${newInquiries} new inquiries</strong> waiting for your response!</p>
            <a href="https://buywiseisrael.com/developer/leads" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              View Inquiries →
            </a>
          ` : ''}
          
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px;">
            Questions? Just reply — we read every email.<br>
            — Your friends at BuyWise Israel
          </p>
        </div>
      `
    });

    sentCount++;
  }

  return new Response(JSON.stringify({ sent: sentCount }), { status: 200 });
});
```

### Cron Schedule

```sql
SELECT cron.schedule(
  'developer-weekly-digest',
  '0 9 * * 0', -- Every Sunday at 9 AM
  $$
  SELECT net.http_post(
    url := 'https://eveqhyqxdibjayliazxm.supabase.co/functions/v1/send-developer-weekly-digest',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2ZXFoeXF4ZGliamF5bGlhenhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyODAwNDMsImV4cCI6MjA4MTg1NjA0M30.Jj193wal4FT9oyYZpHa04VitNjnGb0Nt0eq34XDOJSQ"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

### Email Content
- Total views this week
- New inquiries count
- Top performing project
- Response rate (if available)
- CTA to view inquiries

### Acceptance Criteria
- [ ] Email sent every Sunday 9 AM
- [ ] Only to developers with `notify_email = true`
- [ ] Correct stats for past 7 days
- [ ] Professional branded template
- [ ] Unsubscribe link (via settings)

---

## 3.4 Developer Reviews/Testimonials

**Priority**: 🟢 Medium  
**Effort**: High (8-10 hours)  
**Impact**: Medium - Trust and social proof

### Problem
No social proof from past buyers to build trust.

### Solution
Allow verified buyers to leave reviews after project completion.

### Database Migration

```sql
-- Create reviews table
CREATE TABLE IF NOT EXISTS developer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid REFERENCES developers(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text NOT NULL,
  is_verified_buyer boolean DEFAULT false,
  is_published boolean DEFAULT false,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for querying
CREATE INDEX idx_developer_reviews_developer ON developer_reviews(developer_id, is_published);
CREATE INDEX idx_developer_reviews_project ON developer_reviews(project_id);

-- Enable RLS
ALTER TABLE developer_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view published reviews"
ON developer_reviews FOR SELECT
USING (is_published = true);

CREATE POLICY "Users can create reviews"
ON developer_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
ON developer_reviews FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Calculate average rating function
CREATE OR REPLACE FUNCTION get_developer_rating(dev_id uuid)
RETURNS TABLE(avg_rating numeric, review_count integer)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    ROUND(AVG(rating)::numeric, 1) as avg_rating,
    COUNT(*)::integer as review_count
  FROM developer_reviews
  WHERE developer_id = dev_id AND is_published = true;
$$;
```

### Review Card Component

```tsx
interface DeveloperReview {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  is_verified_buyer: boolean;
  created_at: string;
  project?: { name: string } | null;
}

export function ReviewCard({ review }: { review: DeveloperReview }) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          {review.is_verified_buyer && (
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified Buyer
            </Badge>
          )}
        </div>
        
        {review.title && (
          <h4 className="font-medium mt-2">{review.title}</h4>
        )}
        
        <p className="text-sm text-muted-foreground mt-2">{review.content}</p>
        
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          {review.project && <span>Purchased at {review.project.name}</span>}
          <span>•</span>
          <span>{formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Display on Developer Profile

```tsx
// In DeveloperDetail.tsx
const { data: reviews } = useQuery({
  queryKey: ['developer-reviews', developer?.id],
  queryFn: async () => {
    const { data } = await supabase
      .from('developer_reviews')
      .select('*, project:projects(name)')
      .eq('developer_id', developer.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(10);
    return data;
  },
  enabled: !!developer?.id
});

const { data: ratingStats } = useQuery({
  queryKey: ['developer-rating', developer?.id],
  queryFn: async () => {
    const { data } = await supabase
      .rpc('get_developer_rating', { dev_id: developer.id });
    return data?.[0];
  },
  enabled: !!developer?.id
});

// Add to hero card
{ratingStats?.avg_rating && (
  <div className="flex items-center gap-2">
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < Math.round(ratingStats.avg_rating) 
              ? 'text-yellow-400 fill-yellow-400' 
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
    <span className="font-semibold">{ratingStats.avg_rating}</span>
    <span className="text-muted-foreground">({ratingStats.review_count} reviews)</span>
  </div>
)}

// Add reviews tab
<TabsTrigger value="reviews">
  Reviews
  <Badge variant="secondary" className="ml-1">{reviews?.length || 0}</Badge>
</TabsTrigger>

<TabsContent value="reviews">
  <div className="space-y-4">
    {reviews?.map(review => (
      <ReviewCard key={review.id} review={review} />
    ))}
  </div>
</TabsContent>
```

### Acceptance Criteria
- [ ] Users can submit reviews
- [ ] 1-5 star rating required
- [ ] Verified buyer badge for confirmed purchases
- [ ] Reviews require admin approval
- [ ] Average rating on profile
- [ ] Reviews tab on profile page
- [ ] Admin can moderate reviews

---

# 📦 PHASE 4: Notifications & Automation (4 improvements)

---

## 4.1 Enhanced Notification Types

**Priority**: 🟡 High  
**Effort**: Medium (3-4 hours)  
**Impact**: Medium - Better engagement

### Current State
Basic notification bell exists with limited types.

### Enhancement
Add more actionable notification types:

| Event | Title | Message | Action |
|-------|-------|---------|--------|
| New Inquiry | "New inquiry for {project}" | "{name} is interested" | `/developer/leads` |
| Project Approved | "Your project is live! 🎉" | "{project} is now visible" | `/projects/{slug}` |
| Changes Requested | "Action needed" | "Please review feedback" | `/developer/projects/{id}/edit` |
| View Milestone | "Milestone reached! 📈" | "{project} hit 1000 views" | `/developer/analytics` |
| Lead Unanswered (24h) | "Don't forget!" | "Respond to {name}" | `/developer/leads` |
| Weekly Summary | "Your weekly stats" | "X views, Y inquiries" | `/developer/analytics` |

### Implementation

Update notification creation in edge functions and triggers:

```typescript
// In notify_developer_on_inquiry trigger
INSERT INTO developer_notifications (developer_id, type, title, message, action_url)
VALUES (
  NEW.developer_id,
  'inquiry',
  'New inquiry for ' || project_name,
  NEW.name || ' is interested in your project',
  '/developer/leads'
);
```

### Acceptance Criteria
- [ ] 6+ notification types
- [ ] Each has clear action URL
- [ ] Icons per type
- [ ] Grouped by date
- [ ] Mark all as read option

---

## 4.2 Real-Time Lead Notifications

**Priority**: 🟡 High  
**Effort**: Medium (3-4 hours)  
**Impact**: High - Instant awareness

### Problem
Developers don't know immediately when leads come in.

### Solution
Use Supabase Realtime for instant push updates.

### Database Setup

```sql
-- Enable realtime for inquiries table
ALTER PUBLICATION supabase_realtime ADD TABLE project_inquiries;
```

### React Implementation

```typescript
// In DeveloperLeads.tsx or a global hook
useEffect(() => {
  if (!developer?.id) return;

  const channel = supabase
    .channel('developer-inquiries')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'project_inquiries',
        filter: `developer_id=eq.${developer.id}`
      },
      (payload) => {
        // New inquiry received
        const inquiry = payload.new as ProjectInquiry;
        
        // Show toast notification
        toast.success(
          `New inquiry from ${inquiry.name}!`,
          {
            action: {
              label: 'View',
              onClick: () => navigate('/developer/leads')
            }
          }
        );
        
        // Play notification sound (optional)
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});
        
        // Invalidate queries to refresh list
        queryClient.invalidateQueries({ queryKey: ['developer-inquiries'] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [developer?.id]);
```

### Browser Push Notifications (Optional Enhancement)

```typescript
// Request permission on dashboard load
useEffect(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, []);

// In realtime handler
if (Notification.permission === 'granted') {
  new Notification('New Lead!', {
    body: `${inquiry.name} is interested in ${inquiry.project.name}`,
    icon: '/logo.png'
  });
}
```

### Acceptance Criteria
- [ ] Real-time updates without refresh
- [ ] Toast notification on new lead
- [ ] Sound notification (optional toggle)
- [ ] Query automatically refreshes
- [ ] Works across browser tabs

---

## 4.3 View Spike Alerts

**Priority**: 🟢 Medium  
**Effort**: Medium (4 hours)  
**Impact**: Low - Nice to have

### Problem
Developers don't notice when projects suddenly get attention (viral, featured, etc).

### Solution
Alert when views increase significantly above normal.

### Edge Function

```typescript
// supabase/functions/check-view-spikes/index.ts
serve(async () => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get projects with significant view increases
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, developer_id, views_count')
    .eq('is_published', true);
  
  for (const project of projects || []) {
    // Get yesterday's view count from tracking
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: yesterdayViews } = await supabase
      .from('property_views')
      .select('id', { count: 'exact' })
      .eq('project_id', project.id)
      .gte('created_at', yesterday);
    
    // If views are 3x normal, send alert
    const normalDailyViews = 10; // Could be calculated from historical
    if ((yesterdayViews?.length || 0) > normalDailyViews * 3) {
      await supabase.from('developer_notifications').insert({
        developer_id: project.developer_id,
        type: 'view_spike',
        title: '📈 Your project is trending!',
        message: `${project.name} received ${yesterdayViews?.length} views yesterday`,
        action_url: '/developer/analytics'
      });
    }
  }
  
  return new Response(JSON.stringify({ checked: projects?.length }), { status: 200 });
});
```

### Acceptance Criteria
- [ ] Detect 3x+ normal views
- [ ] Send notification
- [ ] Runs daily
- [ ] Doesn't spam (once per spike)

---

## 4.4 Lead Response Reminder

**Priority**: 🟡 High  
**Effort**: Medium (3-4 hours)  
**Impact**: High - Improves response rates

### Problem
Leads go unanswered for days, reducing conversion.

### Solution
Send reminder if lead unanswered after 24 hours.

### Edge Function

```typescript
// supabase/functions/send-lead-reminders/index.ts
serve(async () => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  // Find unanswered leads
  const { data: unansweredLeads } = await supabase
    .from('project_inquiries')
    .select(`
      id, name, developer_id, project:projects(name),
      developer:developers(name, email, notify_on_inquiry)
    `)
    .lt('created_at', twentyFourHoursAgo)
    .is('first_response_at', null)
    .eq('is_read', false);
  
  for (const lead of unansweredLeads || []) {
    if (!lead.developer?.notify_on_inquiry) continue;
    
    // Check if reminder already sent
    const { data: existingReminder } = await supabase
      .from('developer_notifications')
      .select('id')
      .eq('developer_id', lead.developer_id)
      .eq('type', 'lead_reminder')
      .ilike('message', `%${lead.id}%`)
      .maybeSingle();
    
    if (existingReminder) continue;
    
    // Send reminder notification
    await supabase.from('developer_notifications').insert({
      developer_id: lead.developer_id,
      type: 'lead_reminder',
      title: '⏰ Don\'t forget to respond!',
      message: `${lead.name} has been waiting for a response about ${lead.project?.name}`,
      action_url: '/developer/leads'
    });
    
    // Also send email reminder
    await resend.emails.send({
      from: 'BuyWise Israel <hello@buywiseisrael.com>',
      to: lead.developer?.email,
      subject: `Reminder: ${lead.name} is waiting for your response`,
      html: `
        <p>Hi ${lead.developer?.name},</p>
        <p><strong>${lead.name}</strong> sent an inquiry about <strong>${lead.project?.name}</strong> over 24 hours ago and hasn't heard back yet.</p>
        <p>Quick responses lead to 5x higher conversion rates! ⚡</p>
        <a href="https://buywiseisrael.com/developer/leads" style="...">
          Respond Now →
        </a>
      `
    });
  }
  
  return new Response(JSON.stringify({ reminded: unansweredLeads?.length }), { status: 200 });
});
```

### Cron Schedule

```sql
SELECT cron.schedule(
  'lead-response-reminders',
  '0 * * * *', -- Every hour
  $$
  SELECT net.http_post(
    url := 'https://eveqhyqxdibjayliazxm.supabase.co/functions/v1/send-lead-reminders',
    headers := '{"Authorization": "Bearer ..."}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

### Acceptance Criteria
- [ ] Reminder after 24 hours no response
- [ ] Only one reminder per lead
- [ ] Both in-app and email
- [ ] Respects notification preferences
- [ ] CTA to respond

---

# 📦 PHASE 5: UI/UX Improvements (4 improvements)

---

## 5.1 Mobile-Optimized Dashboard

**Priority**: 🟢 Medium  
**Effort**: Medium (4-6 hours)  
**Impact**: Medium - Better mobile experience

### Current Issues
- Cards too wide on mobile
- Touch targets too small
- No bottom navigation

### Solutions

1. **Responsive Stats Grid**:
```tsx
// Change from 6 columns to responsive
<div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
```

2. **Larger Touch Targets**:
```tsx
// Minimum 44x44px for mobile buttons
<Button className="min-h-[44px] min-w-[44px]">
```

3. **Bottom Navigation (Mobile)**:
```tsx
// Fixed bottom nav for key actions
<div className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t p-2 z-50">
  <div className="flex justify-around">
    <Link to="/developer" className="flex flex-col items-center p-2">
      <Home className="h-5 w-5" />
      <span className="text-xs">Home</span>
    </Link>
    <Link to="/developer/projects" className="flex flex-col items-center p-2">
      <FolderKanban className="h-5 w-5" />
      <span className="text-xs">Projects</span>
    </Link>
    <Link to="/developer/leads" className="flex flex-col items-center p-2 relative">
      <MessageSquare className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
          {unreadCount}
        </Badge>
      )}
      <span className="text-xs">Leads</span>
    </Link>
    <Link to="/developer/analytics" className="flex flex-col items-center p-2">
      <BarChart3 className="h-5 w-5" />
      <span className="text-xs">Stats</span>
    </Link>
  </div>
</div>
```

4. **Floating Action Button**:
```tsx
// FAB for quick actions on mobile
<div className="fixed bottom-20 right-4 md:hidden">
  <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
    <Plus className="h-6 w-6" />
  </Button>
</div>
```

### Acceptance Criteria
- [ ] 2-column grid on mobile
- [ ] 44px minimum touch targets
- [ ] Bottom navigation on mobile
- [ ] FAB for quick actions
- [ ] Proper spacing/padding

---

## 5.2 Bulk Image Management

**Priority**: 🟢 Medium  
**Effort**: Medium (4-6 hours)  
**Impact**: Medium - Improved editing UX

### Current Issues
- Can only delete images one by one
- Can't reorder images
- No multi-select

### Solution
Enhanced image grid with drag-drop and multi-select.

### Implementation

```tsx
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';

export function ImageManager({ 
  images, 
  onChange 
}: { 
  images: string[]; 
  onChange: (images: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = images.indexOf(active.id as string);
      const newIndex = images.indexOf(over?.id as string);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };
  
  const handleDeleteSelected = () => {
    onChange(images.filter(img => !selected.has(img)));
    setSelected(new Set());
  };
  
  const toggleSelect = (img: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(img)) {
      newSelected.delete(img);
    } else {
      newSelected.add(img);
    }
    setSelected(newSelected);
  };
  
  return (
    <div>
      {/* Toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-lg">
          <span className="text-sm">{selected.size} selected</span>
          <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Selected
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Clear Selection
          </Button>
        </div>
      )}
      
      {/* Drag-drop grid */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images}>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, index) => (
              <SortableImage
                key={img}
                url={img}
                index={index}
                isSelected={selected.has(img)}
                onSelect={() => toggleSelect(img)}
                onDelete={() => onChange(images.filter(i => i !== img))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableImage({ url, index, isSelected, onSelect, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: url });
  
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative group rounded-lg overflow-hidden border-2 ${
        isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
      }`}
    >
      <img src={url} alt="" className="aspect-square object-cover" />
      
      {/* Drag handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-2 left-2 p-1 bg-black/50 rounded cursor-grab"
      >
        <GripVertical className="h-4 w-4 text-white" />
      </div>
      
      {/* Index badge */}
      {index === 0 && (
        <Badge className="absolute top-2 right-2">Cover</Badge>
      )}
      
      {/* Select checkbox */}
      <button
        onClick={onSelect}
        className="absolute bottom-2 left-2 p-1.5 bg-black/50 rounded"
      >
        {isSelected ? (
          <CheckSquare className="h-4 w-4 text-primary" />
        ) : (
          <Square className="h-4 w-4 text-white" />
        )}
      </button>
      
      {/* Delete button */}
      <button
        onClick={onDelete}
        className="absolute bottom-2 right-2 p-1.5 bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4 text-white" />
      </button>
    </div>
  );
}
```

### Acceptance Criteria
- [ ] Drag to reorder images
- [ ] Multi-select with checkboxes
- [ ] Bulk delete selected
- [ ] First image marked as "Cover"
- [ ] Touch-friendly on mobile

---

## 5.3 Project Preview Modal

**Priority**: 🟢 Medium  
**Effort**: Low (2-3 hours)  
**Impact**: Medium - Better review experience

### Problem
Developers can't see how project will look before submitting.

### Solution
"Preview" button on Review step that opens full project view.

### Implementation

**File**: `src/components/developer/wizard/steps/ProjectPreviewDialog.tsx`

```tsx
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ProjectDetailContent } from '@/pages/ProjectDetail'; // Extract shared content

export function ProjectPreviewDialog({ data }: { data: ProjectWizardData }) {
  // Transform wizard data to project format
  const previewProject = {
    id: 'preview',
    name: data.name,
    city: data.city,
    neighborhood: data.neighborhood,
    address: data.address,
    description: data.description,
    status: data.status,
    total_units: data.total_units,
    available_units: data.available_units,
    price_from: data.price_from,
    price_to: data.price_to,
    completion_date: data.completion_date,
    construction_start: data.construction_start,
    construction_progress_percent: data.construction_progress_percent,
    amenities: data.amenities,
    images: data.images,
    latitude: data.latitude,
    longitude: data.longitude,
    // Mock developer info
    developer: {
      name: 'Your Company',
      logo_url: null,
      is_verified: true,
    }
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Eye className="h-4 w-4" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-4 bg-amber-50 border-b border-amber-200">
          <p className="text-sm text-amber-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            This is a preview. The project is not yet published.
          </p>
        </div>
        <div className="p-6">
          <ProjectDetailContent project={previewProject} isPreview={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### StepReview Integration

```tsx
// In StepReview.tsx
<div className="flex gap-2 justify-end mt-6">
  <ProjectPreviewDialog data={data} />
  <Button onClick={handleSubmit}>
    Submit for Review
  </Button>
</div>
```

### Acceptance Criteria
- [ ] Preview button on review step
- [ ] Opens in large modal
- [ ] Shows full project layout
- [ ] Clear "Preview" indicator
- [ ] Images gallery works
- [ ] Map shows if coordinates exist

---

## 5.4 Swipe Gestures for Leads (Mobile)

**Priority**: 🟢 Low  
**Effort**: Medium (3-4 hours)  
**Impact**: Low - Nice mobile UX

### Problem
Managing leads on mobile requires multiple taps.

### Solution
Swipe gestures for quick actions.

### Implementation

```tsx
import { useSwipeable } from 'react-swipeable';

function SwipeableLeadCard({ inquiry, onMarkRead, onReply, onArchive }) {
  const [offset, setOffset] = useState(0);
  const [showActions, setShowActions] = useState<'left' | 'right' | null>(null);
  
  const handlers = useSwipeable({
    onSwiping: (e) => {
      setOffset(e.deltaX);
      if (e.deltaX > 50) setShowActions('right');
      else if (e.deltaX < -50) setShowActions('left');
      else setShowActions(null);
    },
    onSwipedRight: () => {
      if (offset > 100) {
        onMarkRead();
      }
      setOffset(0);
      setShowActions(null);
    },
    onSwipedLeft: () => {
      if (offset < -100) {
        onReply();
      }
      setOffset(0);
      setShowActions(null);
    },
    onSwiped: () => {
      setOffset(0);
      setShowActions(null);
    },
    trackMouse: false,
    preventScrollOnSwipe: true,
  });
  
  return (
    <div className="relative overflow-hidden" {...handlers}>
      {/* Left action (revealed on swipe right) */}
      <div className={`absolute inset-y-0 left-0 w-24 bg-green-500 flex items-center justify-center transition-opacity ${showActions === 'right' ? 'opacity-100' : 'opacity-0'}`}>
        <CheckCircle className="h-8 w-8 text-white" />
      </div>
      
      {/* Right action (revealed on swipe left) */}
      <div className={`absolute inset-y-0 right-0 w-24 bg-primary flex items-center justify-center transition-opacity ${showActions === 'left' ? 'opacity-100' : 'opacity-0'}`}>
        <MessageCircle className="h-8 w-8 text-white" />
      </div>
      
      {/* Card content */}
      <div 
        style={{ transform: `translateX(${offset}px)` }}
        className="bg-background relative z-10 transition-transform"
      >
        <LeadCard inquiry={inquiry} />
      </div>
    </div>
  );
}
```

### Gestures
- **Swipe Right** → Mark as Read (green)
- **Swipe Left** → Reply via WhatsApp (blue)
- **Long Press** → Show more options

### Acceptance Criteria
- [ ] Smooth swipe animations
- [ ] Clear action indicators
- [ ] Haptic feedback (if available)
- [ ] Works only on mobile
- [ ] Can still tap to expand

---

# 📋 Summary

## Total Improvements: 40+

| Phase | Improvements | Effort | Priority |
|-------|-------------|--------|----------|
| Phase 1 | 4 quick wins | 4-6 hours | 🔴 Do First |
| Phase 2 | 4 high impact | 16-20 hours | 🔴 Critical |
| Phase 3 | 4 polish features | 20-28 hours | 🟡 Important |
| Phase 4 | 4 notifications | 12-16 hours | 🟡 Important |
| Phase 5 | 4 UX improvements | 14-20 hours | 🟢 Nice to have |

## Database Migrations Required
1. Unit status tracking (Phase 2.1)
2. Lead pipeline fields (Phase 2.2)
3. Response time tracking (Phase 2.3)
4. Developer reviews table (Phase 3.4)

## New Edge Functions Required
1. `send-developer-weekly-digest` (Phase 3.3)
2. `check-view-spikes` (Phase 4.3)
3. `send-lead-reminders` (Phase 4.4)

## New Components Required
- `UnitStatusBadge.tsx`
- `UnitStatusEditor.tsx`
- `LeadPipelineBoard.tsx`
- `LeadFilters.tsx`
- `ConversionFunnel.tsx`
- `ReviewCard.tsx`
- `ProjectPreviewDialog.tsx`
- `MobileBottomNav.tsx`
- `ImageManager.tsx`
- `SwipeableLeadCard.tsx`

---

*Document generated: 2026-02-02*
*Ready for implementation*
