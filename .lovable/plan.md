

## Add "Last Email Sent" + WhatsApp Link to Warm Leads

Two quick enhancements to make the Warm Users table more actionable for outreach.

### 1. "Last Email Sent" column

Cross-reference each warm user against `retention_emails_log` to show when they last received an automated email (and which trigger). Displays as "dormant saver — 5d ago" or "—" if never emailed.

**Changes in `useWarmLeads.ts`:**
- Add `last_email_at` and `last_email_trigger` fields to the `WarmUser` interface
- In `useWarmLeads` queryFn, fetch `retention_emails_log` (user_id, trigger_type, created_at), group by user_id keeping only the most recent, and merge into the warm users list

**Changes in `AdminWarmLeads.tsx`:**
- Add a "Last Email" column header between "Last Active" and "Score"
- Render trigger type badge + relative time, or "—" if no email sent

### 2. WhatsApp deep link button

The `profiles` table already has a `phone` column. If the user has a phone number, show a WhatsApp icon button next to the Copy Email button. Uses the existing `buildWhatsAppUrl` and `openWhatsApp` utilities from `src/lib/whatsapp.ts`.

**Changes in `useWarmLeads.ts`:**
- Add `phone` to the `WarmUser` interface
- Include `phone` in the profiles select query and pass it through

**Changes in `AdminWarmLeads.tsx`:**
- Import `MessageCircle` icon from lucide and `buildWhatsAppUrl`/`openWhatsApp` from `@/lib/whatsapp`
- Add a `WhatsAppButton` component that renders a green ghost button with the MessageCircle icon, only when phone is present
- Place it in the actions cell alongside the existing CopyEmailButton

### Files modified
- `src/hooks/useWarmLeads.ts` — add phone, last_email_at, last_email_trigger to data
- `src/pages/admin/AdminWarmLeads.tsx` — add Last Email column + WhatsApp button

