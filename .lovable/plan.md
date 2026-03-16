

# Import Analytics Dashboard

## What We're Building
An admin page at `/admin/import-analytics` that shows import pipeline health metrics across all agencies, with targets from the blueprint: 90%+ discovery rate, 85%+ extraction accuracy, 95%+ import success rate.

## Data Available
All metrics can be derived from existing `import_jobs` and `import_job_items` tables:
- **Discovery rate**: `total_urls` vs URLs on source page (approximated by discovered_urls array length)
- **Extraction accuracy**: items with `status='done'` and `confidence_score >= 70` vs total processed
- **Import success rate**: `status='done'` items vs total non-skipped items
- **Per-source breakdown**: `source_type` column on `import_jobs` (website vs yad2)
- **Error analysis**: `error_type` and `error_message` on failed items
- **Per-agency stats**: join through `agency_id` on `import_jobs`

## Files to Create

### 1. `src/hooks/useImportAnalytics.ts`
A hook that queries aggregated import stats using the Supabase client:
- Fetch all `import_jobs` (no agency filter — admin sees all)
- Fetch item-level stats grouped by status, error_type, confidence_score ranges
- Compute: discovery rate, extraction accuracy (confidence >= 70), success rate
- Group by `source_type` and by agency
- Time-series: jobs per week for trend charts

### 2. `src/pages/admin/AdminImportAnalytics.tsx`
Admin page with:
- **3 KPI cards** at top: Discovery Rate, Extraction Accuracy, Import Success Rate — each with a color-coded gauge vs target (green >= target, amber within 5%, red below)
- **Summary stats row**: Total jobs, total items processed, total agencies importing
- **Source breakdown table**: Per source_type (website, yad2) showing counts and rates
- **Agency leaderboard**: Top agencies by import volume with success rates
- **Error breakdown**: Bar chart or table of error_types with counts
- **Confidence distribution**: Histogram of confidence_score buckets (0-40, 40-60, 60-80, 80-100)
- **Recent jobs table**: Last 20 jobs with status, counts, source, agency name

### 3. Wire into admin layout and routes

**`src/App.tsx`**: Add lazy import and route `<Route path="import-analytics" element={<AdminImportAnalytics />} />`

**`src/pages/admin/AdminLayout.tsx`**: Add nav item under the "System" or "Overview" section:
```
{ href: '/admin/import-analytics', label: 'Import Health', icon: BarChart3 }
```

## No Database Changes Needed
All data already exists in `import_jobs` and `import_job_items`. RLS policies already grant admin access via service role and agency admin policies. We'll query client-side with the admin user's session (admin has `user_roles` entry). We need to add an RLS policy allowing admins to read all import data across agencies.

## Database Migration
Add RLS policy so admins can read all import jobs/items:
```sql
CREATE POLICY "Admin can read all import jobs"
  ON public.import_jobs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can read all import job items"
  ON public.import_job_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

## UI Pattern
Follows existing admin page patterns (Card-based layout, Recharts for charts, Tabs for sections). Will use the same widget-level resilience pattern with loading skeletons.

