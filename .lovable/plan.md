
# Phase A: Enterprise Contact Sales Flow

## Overview
Replace the Enterprise tier's "Subscribe" button with a "Contact Sales" form. Enterprise plans show "Custom" pricing instead of a fixed price. Submissions are stored in the database and visible to admins.

## Changes

### 1. Database: `enterprise_inquiries` Table
Create a new table to store enterprise sales leads, separate from generic contact submissions.

Columns:
- `id` (uuid, PK)
- `user_id` (uuid, nullable -- if they're logged in)
- `name` (text, required)
- `email` (text, required)
- `company_name` (text, required)
- `entity_type` (text -- 'agency' or 'developer')
- `message` (text, nullable)
- `status` (text, default 'new' -- new/contacted/closed)
- `created_at`, `updated_at` (timestamps)

RLS: Insert allowed for authenticated and anonymous users. Select/update restricted to admins via `has_role(uid, 'admin')`.

### 2. `EnterpriseSalesDialog` Component
A new dialog component (`src/components/billing/EnterpriseSalesDialog.tsx`):
- Triggered by clicking "Contact Sales" on the Enterprise plan card
- Form fields: Name, Email, Company Name, Entity Type (pre-filled from current tab), Message (optional)
- Validates with zod, submits to `enterprise_inquiries` table
- Shows success toast on submission

### 3. `PlanCard` Modifications
- Accept a new `isEnterprise?: boolean` prop
- When `isEnterprise = true`:
  - Show "Custom" instead of a price
  - Show "Contact Sales" button instead of "Subscribe"
  - Button opens the `EnterpriseSalesDialog` instead of calling `onSubscribe`

### 4. `Pricing.tsx` Modifications
- Pass `isEnterprise={plan.tier === 'enterprise'}` and `entityTab` to PlanCard
- Enterprise cards open the dialog instead of triggering Stripe checkout

### 5. Admin: Enterprise Inquiries Page
A new admin page (`src/pages/admin/AdminEnterpriseInquiries.tsx`):
- Table showing all enterprise inquiries (name, email, company, entity type, status, date)
- Status update dropdown (new -> contacted -> closed)
- Search/filter by status
- Added to admin sidebar under System section

### 6. Route Registration
- Add lazy import and route for `/admin/enterprise-inquiries` in `App.tsx`
- Add nav item in `AdminLayout.tsx` under System section

## Technical Details

### Files Created
- `src/components/billing/EnterpriseSalesDialog.tsx`
- `src/pages/admin/AdminEnterpriseInquiries.tsx`

### Files Modified
- `src/components/billing/PlanCard.tsx` -- add `isEnterprise` prop, conditional rendering
- `src/pages/Pricing.tsx` -- pass enterprise flag and entity tab to PlanCard
- `src/pages/admin/AdminLayout.tsx` -- add Enterprise Inquiries nav item
- `src/App.tsx` -- add admin route

### Database Migration
- CREATE TABLE `enterprise_inquiries` with RLS policies
