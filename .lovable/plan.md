

# Build Out Missing Email Notifications

## Current State

Your email system uses Resend via `hello@buywiseisrael.com` with edge functions. Here's what exists vs. what's missing:

**Already working:**
- Agent inquiry notifications (`send-notification` with `new_inquiry`)
- Agency inquiry notifications (`send-agency-notification` with `new_lead`)
- Developer inquiry notifications (`send-developer-notification` with `new_inquiry`)
- Listing approved/rejected/changes-requested emails (via `send-notification` -- already triggered from `useListingReview.tsx`)
- Developer project approved/rejected emails (via `send-developer-notification`)
- Welcome emails for all roles
- Agency join notifications (`agent_joined`, `join_request`)
- Enterprise inquiry notifications
- Search alerts, price drops, digest emails, retention emails

**Gaps to fill (7 items):**

1. **Auth emails** -- password reset, email confirmation, magic link all use generic system sender
2. **Agency join request email to agency admin** -- `send-agency-notification` has `join_request` template but it's never invoked from the join request flow
3. **Agent approval/rejection email** -- when agency approves/rejects a join request, agent gets no email
4. **Contact form admin notification** -- `contact_submissions` inserts happen but no email to admin
5. **Buyer inquiry confirmation** -- buyer sends inquiry but gets no receipt email
6. **Subscription/billing emails** -- payment failed, trial expiring, subscription canceled -- no emails sent
7. **Listing review email trigger gap** -- listing approval emails exist in `send-notification` and ARE triggered, so this one is actually covered

So **6 real gaps** to close.

---

## Plan

### Step 1: Branded Auth Emails
Set up custom auth email templates so password resets, email confirmations, and magic links come from `buywiseisrael.com` with your brand styling instead of the generic system sender.
- Scaffold auth email templates using the email infrastructure tools
- Apply BuyWise brand colors (primary blue #2563eb) and "trusted friend" tone
- Deploy the auth-email-hook function

### Step 2: Agency Join Request -- Wire Up Email Trigger
The `send-agency-notification` function already has the `join_request` template built. It's just never called.
- In the agency join request submission flow (wherever an agent submits a join request to `agency_join_requests`), add a call to `send-agency-notification` with type `join_request`

### Step 3: Agent Approval/Rejection Emails
When an agency approves or rejects a join request, email the agent.
- Add two new notification types to `send-notification`: `join_approved` and `join_rejected`
- Templates: "You're in -- [Agency Name] has approved your request" / "Your request to join [Agency Name] wasn't approved"
- Trigger from `useApproveJoinRequest` and `useRejectJoinRequest` in `useAgencyManagement.tsx`

### Step 4: Contact Form Admin Notification
When someone submits the contact form, email `hello@buywiseisrael.com`.
- Create new edge function `contact-form-notify` (similar pattern to `enterprise-inquiry-notify`)
- Sends admin email with submitter details + category + message
- Sends confirmation receipt to submitter ("We got your message")
- Trigger from `Contact.tsx` after successful insert

### Step 5: Buyer Inquiry Confirmation Email
After a buyer submits an inquiry, send them a confirmation.
- Add buyer confirmation email to the existing inquiry flow
- In `useInquiryTracking.tsx` and `useProjectInquiryTracking.tsx`, after the agent notification call, invoke a new function or extend `send-notification` to also email the buyer
- Template: "We've forwarded your inquiry to [Agent Name] about [Property Title]"
- Create a new edge function `send-inquiry-confirmation` that takes buyer email, name, property title, agent name

### Step 6: Subscription/Billing Emails
Add email notifications for key Stripe events.
- In `stripe-webhook/index.ts`, add Resend email sends for:
  - `invoice.payment_failed` -- "Your payment didn't go through"
  - `customer.subscription.deleted` -- "Your subscription has been canceled"
- In `check-trial-expirations/index.ts`, fill in the TODO to email when trial expires
- Look up the entity's email (agency/developer) from DB before sending
- Use same brand template style

---

## Technical Details

**Files to create:**
- `supabase/functions/contact-form-notify/index.ts`
- `supabase/functions/send-inquiry-confirmation/index.ts`
- Auth email template files (via scaffold tool)

**Files to modify:**
- `src/hooks/useAgencyManagement.tsx` -- add email triggers on approve/reject
- `src/pages/Contact.tsx` -- invoke `contact-form-notify` after insert
- `src/hooks/useInquiryTracking.tsx` -- invoke buyer confirmation after inquiry
- `src/hooks/useProjectInquiryTracking.tsx` -- same for project inquiries
- `supabase/functions/send-notification/index.ts` -- add `join_approved` and `join_rejected` types
- `supabase/functions/stripe-webhook/index.ts` -- add email sends on payment events
- `supabase/functions/check-trial-expirations/index.ts` -- add email on trial expiry
- Agency join request submission code -- wire up `send-agency-notification` call

**All emails use:**
- Resend via `RESEND_API_KEY` (already configured)
- Sender: `BuyWise Israel <hello@buywiseisrael.com>`
- Brand footer: "Questions? Just reply -- we read every email."
- Primary blue #2563eb for CTAs
- "Trusted friend" tone

