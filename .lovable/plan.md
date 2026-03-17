

## Plan: Confirmation Toast + "Similar Properties" Checkbox

### 1. Add confirmation toast inside `InquiryModal`

Instead of modifying every caller's `handleInquirySubmit`, add a toast **inside the `InquiryForm` component** right before calling `onSubmit`. This centralizes the behavior.

- Import `toast` from `sonner`
- After successful validation and before/after calling `onSubmit()`, fire:
  ```
  toast.success("Inquiry sent!", { description: "Most agents reply within 24 hours." })
  ```
- This works regardless of which parent component renders the modal

### 2. Add "Open to similar listings" checkbox

- Add `openToSimilar` boolean state (default `false`)
- Render a checkbox below the buyer profile section: *"I'm also open to similar listings in this area"*
- Add `openToSimilar` to `InquiryFormData` interface
- When true, append a line to the message: `"\n\nI'm also open to similar listings in this area."`

### Files to edit

- **`src/components/shared/InquiryModal.tsx`** — Add toast call, new checkbox, update interface, append line to message

No backend or database changes needed — the extra text is included in the existing message field.

