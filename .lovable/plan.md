

## Split Email into Subject + Body

**What changes:** For the **email** channel, replace the single "Message" textarea with:
1. A **Subject** text input (one line, pre-filled with `Inquiry about [Property Title]`)
2. A **Body** textarea (pre-filled with the `Dear.../Best,...` template)

For **WhatsApp**, keep the single "Message" textarea as-is.

### Changes in `src/components/shared/InquiryModal.tsx`

1. **Add `subject` state** initialized to `Inquiry about the ${propertyTitle}`
2. **Split `buildDefaultMessage`** — for email, only return the body (Dear.../Best,...), no subject mixed in
3. **Replace the Message section** with conditional rendering:
   - If `channel === 'email'`: render Subject input + Body textarea
   - If `channel === 'whatsapp'`: render single Message textarea (unchanged)
4. **Update `onSubmit` call** — combine subject + body into the `message` field (e.g. `Subject: ...\n\n...body`) so downstream tracking hooks don't need changes
5. **Update `InquiryFormData`** interface — optionally add `subject` field, or keep it merged into `message`

### Labels
- Subject input label: **"Subject"**
- Textarea label: **"Body"** (for email) / **"Message"** (for WhatsApp)

No database or hook changes needed — the subject and body get concatenated into the existing `message` field before submission.

