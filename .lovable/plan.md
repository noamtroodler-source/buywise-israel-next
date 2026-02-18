
# Phase C: Enterprise & Sales Flow

## Assessment: What Already Exists

The core infrastructure is in place from previous phases:
- `enterprise_inquiries` table with correct schema and RLS policies (INSERT for all, SELECT/UPDATE for admins only)
- `EnterpriseSalesDialog` form with name, email, company, message fields
- `PlanCard` shows "Contact Sales" for enterprise tier and opens the dialog
- Admin page at `/admin/enterprise-inquiries` with status management (new/contacted/closed)
- Route and sidebar nav entry already wired up

Phase C work is therefore focused on **closing the remaining gaps** rather than building from scratch.

## Gaps to Close

### Gap 1 — Message & Admin Notes in the Admin Table
The admin table shows name, email, company, type, status, date — but NOT the prospect's message. Admins have to guess what the lead actually asked. Also, there's no way for admins to record internal notes (e.g. "Called on Feb 20, interested in 10 seats").

**Fix**: Add an expandable row in the admin table that shows the message, plus an "Add Note" inline field that saves to a new `admin_notes` column on the table.

### Gap 2 — Phone Number Field in the Inquiry Form
Sales teams universally want a phone number to follow up. The current form only captures email.

**Fix**: Add an optional phone number field to `EnterpriseSalesDialog` and store it in a new `phone` column on `enterprise_inquiries`.

### Gap 3 — Admin Email Notification on New Inquiry
When a prospect submits an enterprise inquiry, nothing notifies the admin team. A lead could sit unseen for days.

**Fix**: Create a database trigger + edge function that fires on INSERT to `enterprise_inquiries` and sends an email notification via Resend to a configured admin email address.

### Gap 4 — Admin Badge Counter for New Inquiries
The sidebar shows badge counts for pending listings, agents, etc. Enterprise inquiries with status "new" should also show a count badge so admins notice them immediately.

**Fix**: Add a query to count `enterprise_inquiries` where `status = 'new'` and display it as a badge on the "Enterprise Leads" nav item in `AdminLayout`.

## Implementation Details

### Database Migration
One migration adds two nullable columns to `enterprise_inquiries`:
- `phone text` — prospect's phone number (optional)
- `admin_notes text` — internal admin follow-up notes

### Files to Modify

**`src/components/billing/EnterpriseSalesDialog.tsx`**
- Add optional `phone` field (validated as phone-like string, max 30 chars)
- Submit phone to the database

**`src/pages/admin/AdminEnterpriseInquiries.tsx`**
- Add expandable row: clicking a row expands to show full message and admin notes textarea
- Admin notes auto-save on blur (debounced UPDATE mutation)
- Add "Message" column indicator (paperclip icon if message exists)

**`src/pages/admin/AdminLayout.tsx`**
- Add a `useQuery` for new enterprise inquiry count
- Show badge on "Enterprise Leads" nav item when count > 0

**`supabase/functions/enterprise-inquiry-notify/index.ts`** (new edge function)
- Triggered by the DB insert (via calling it from the dialog after successful insert, not a DB webhook since those aren't available)
- Sends email to admin via Resend with inquiry details
- Uses existing `RESEND_API_KEY` secret

**Alternative to DB trigger for notification**: Since we cannot create DB webhook triggers directly, the notification email will be sent from the client-side after a successful form submission by calling the edge function. This is the same pattern used elsewhere in the app.

### Query Invalidation
When admin notes are saved, invalidate `['enterprise-inquiries']` to keep data fresh.

## Files Summary

| File | Action |
|---|---|
| `supabase/migrations/...` | Add `phone`, `admin_notes` columns to `enterprise_inquiries` |
| `src/components/billing/EnterpriseSalesDialog.tsx` | Add phone field, call notify edge function on success |
| `src/pages/admin/AdminEnterpriseInquiries.tsx` | Expandable rows with message + admin notes |
| `src/pages/admin/AdminLayout.tsx` | Badge count for new enterprise inquiries |
| `supabase/functions/enterprise-inquiry-notify/index.ts` | New edge function to send admin email via Resend |

## No Schema Risks
- All new columns are nullable, so existing rows and code are unaffected
- RLS policies already correct (admins can UPDATE, so admin_notes saves will work)
- Resend secret already configured
