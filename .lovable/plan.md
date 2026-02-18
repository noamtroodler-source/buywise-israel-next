
# Enterprise Inquiry — Gaps & Fixes

## What Already Exists (No Work Needed)
- Enterprise plan rows in DB for both agency and developer tabs
- `EnterpriseSalesDialog` component built, wired to `PlanCard` "Contact Sales" button
- `enterprise_inquiries` table with all required columns
- Admin dashboard at `/admin/enterprise-inquiries` with expand rows, status, notes, badge count
- Admin email notification via `enterprise-inquiry-notify` edge function using Resend

The core system is complete. These are the 5 polish/UX gaps being fixed.

---

## Gap 1 — No Standalone Enterprise CTA Section on the Pricing Page

**Problem:** The only way to reach the dialog is by clicking the Enterprise plan card. Users who scroll past the cards, or who aren't sure which tab to use, have no second chance to express interest.

**Fix:** Add a dedicated "Need More?" / Enterprise callout section on the pricing page — positioned between the Feature Comparison table and the Founding Program section. It will have two buttons side by side: "Contact Agency Sales" and "Contact Developer Sales" — opening the dialog with the correct `entityType` pre-set.

---

## Gap 2 — Prospect Gets No Confirmation Email After Submitting

**Problem:** After submitting, the user sees a toast. That's it. No email receipt. For an enterprise sale (significant deal size), not sending a confirmation email feels unprofessional and creates doubt about whether the form was received.

**Fix:** Update the `enterprise-inquiry-notify` edge function to send **two emails** in parallel:
1. Existing admin notification (unchanged)
2. New prospect confirmation email — a clean, warm email thanking them, naming a response time expectation ("We'll be in touch within 1 business day"), and signing off as the BuyWise team

---

## Gap 3 — Phone Placeholder is American Format

**Problem:** The placeholder reads `+1 555 000 0000` — an American number format. This is an Israeli product with Israeli business users. Small detail, big signal.

**Fix:** Change placeholder to `+972 50 000 0000` (standard Israeli mobile format).

---

## Gap 4 — No Login Nudge for Unauthenticated Users

**Problem:** If a user is not logged in, the email field starts blank. The form works (it can insert with `user_id: null`), but a logged-in submission is better data and attaches the inquiry to an account if they later sign up. Currently there's no nudge.

**Fix:** Add a small info note at the top of the dialog when no user is authenticated: "Already have an account? Sign in to auto-fill your details." — a text link that navigates to `/auth?redirect=/pricing`. This doesn't block submission; it's an optional nudge.

---

## Gap 5 — Redundant "Type" Read-Only Field in the Dialog

**Problem:** The form has a disabled `<Input>` showing "Agency" or "Developer" that the user cannot interact with. It takes up space and creates confusion ("why is this here and I can't change it?"). The entity type is already communicated visually by which plan card they clicked.

**Fix:** Remove the static "Type" input. The `entityType` prop is still passed to the insert — it just doesn't need to be surfaced as a form field. Instead, show it as a small badge in the dialog header (e.g., a "Agency Plan" chip next to the title).

---

## Files to Change

| File | Change |
|---|---|
| `src/pages/Pricing.tsx` | Add standalone Enterprise CTA section between FeatureComparisonTable and FoundingProgramSection |
| `src/components/billing/EnterpriseSalesDialog.tsx` | Remove redundant Type field, add entity type badge to header, fix phone placeholder, add login nudge for unauthenticated users |
| `supabase/functions/enterprise-inquiry-notify/index.ts` | Add prospect confirmation email sent in parallel to admin email; fix hardcoded preview URL |

---

## Technical Notes

- The standalone CTA section on the pricing page holds its own `salesDialogOpen` state and `entityType` state (defaulting to whichever tab is active) — two buttons let users self-select Agency or Developer
- The prospect confirmation email uses the same Resend API key already configured; no new secrets needed
- Both emails (admin + prospect) are sent with `Promise.all` inside the edge function so neither delays the other
- Removing the Type field does not change the DB insert — `entityType` is still passed in the body
- The entity type badge in the header uses a `Badge` component already used elsewhere in billing components
