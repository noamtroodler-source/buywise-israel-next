

## Hybrid Contact Modal — Implementation Plan

### What We're Building
A lightweight inquiry modal that appears when users click WhatsApp or Email on any property or project page. It captures contact info + buyer context, logs the inquiry, then opens WhatsApp/Email as before. Agents see enriched leads in their dashboard.

### Phased Approach

---

### Phase 1: Core Modal Component + Database Changes

**Database migration:**
- Add `buyer_context_snapshot` (JSONB, nullable) column to `property_inquiries`
- Add `buyer_context_snapshot` (JSONB, nullable) column to `project_inquiries`
- Add dedupe constraint: a function or check to prevent same user + same property + same channel within 24hrs

**New component: `src/components/shared/InquiryModal.tsx`**
- Reusable dialog/sheet (dialog on desktop, bottom sheet on mobile via `useMediaQuery`)
- Props: `agentName`, `propertyTitle`, `channel` (whatsapp/email), `isOpen`, `onSubmit`, `onClose`
- **Logged-in user with buyer profile:** Pre-fills name/email from profile, shows message textarea (pre-filled with property context), checkbox "Include my buyer profile" (default on)
- **Logged-in user without buyer profile:** Same but checkbox says "Complete your buyer profile for personalized service" with link
- **Guest user:** Shows name (required), email (required for email, optional for whatsapp), message textarea
- Submit button text matches channel: "Send via WhatsApp" / "Send via Email"
- Uses `useBuyerProfile` hook to fetch buyer context when logged in
- Validates inputs with basic checks (name non-empty, email format)

**Wire into existing contact components:**
- `StickyContactCard.tsx` — WhatsApp/Email buttons open the modal instead of directly navigating
- `MobileContactBar` — Same change
- `ProjectStickyCard.tsx` — Same for both agent and developer contacts
- `ProjectAgentCard.tsx` — Same

**On submit:**
1. Insert into `property_inquiries` / `project_inquiries` with `buyer_context_snapshot` (frozen buyer profile JSONB)
2. Dedupe check: if same user+property+channel in last 24hrs, skip insert
3. Open WhatsApp URL or mailto: link
4. Existing notification triggers fire automatically

---

### Phase 2: Enhanced Inquiry Tracking Hooks

**Update `useInquiryTracking.tsx`:**
- Accept `buyerContext` (JSONB) parameter
- Pass to insert
- Add dedupe logic (query before insert)

**Update `useProjectInquiryTracking.tsx`:**
- Same changes

**WhatsApp message enrichment:**
- Pre-fill WhatsApp text with property name + city + buyer's custom message (keep under 500 chars)
- Email: pre-fill subject with property name, body with buyer's message

---

### Phase 3: Guest Rate Limiting + Polish

- Add simple client-side rate limiting for guests (sessionStorage counter, max 5/hour)
- Handle edge cases: agent has no phone (hide WhatsApp option in modal), agent has no email (hide email option)
- Ensure modal is accessible (focus trap, escape to close, aria labels)

---

### What stays the same
- Existing notification triggers (`notify_agent_on_inquiry`, `notify_developer_on_inquiry`) fire automatically on insert — no changes needed
- Agent/agency Leads dashboard reads from the same tables — buyer context snapshot will be available there once we render it (future enhancement)
- No new edge functions needed — all client-side + existing DB triggers

### Files to create/edit
- **New:** `src/components/shared/InquiryModal.tsx`
- **Edit:** `src/components/property/StickyContactCard.tsx` (both desktop + mobile)
- **Edit:** `src/components/project/ProjectStickyCard.tsx` (both desktop + mobile)
- **Edit:** `src/components/project/ProjectAgentCard.tsx`
- **Edit:** `src/hooks/useInquiryTracking.tsx`
- **Edit:** `src/hooks/useProjectInquiryTracking.tsx`
- **DB migration:** Add `buyer_context_snapshot` JSONB column to both inquiry tables

