## AI Kickstart v2 — Enhancements

Add four improvements to the existing `AiListingKickstartDialog` + `ai-extract-listing` edge function flow.

### 1. Agent auto-assignment from roster

**Backend (`ai-extract-listing`):**
- Add `agencyId` to the request payload.
- Before extraction, fetch the agency's agents: `select id, full_name, phone, license_number from agents where agency_id = ?`.
- Extend the Gemini schema with `detected_agent: { name, phone, license_number, confidence }`.
- After extraction, fuzzy-match detected agent against roster:
  - Exact license_number match → confident assignment
  - Normalized phone match (strip +972/0) → confident
  - Full-name token Jaccard ≥ 0.7 → confident
  - Otherwise → leave null, surface in `low_confidence_fields`
- Return `assigned_agent_id` (or null) + the raw `detected_agent` for UI display.

**Frontend:** Preview panel shows "Assigned to: David Cohen ✓" (green) or "Agent: not matched — pick in wizard" (amber). Pre-fill `metadata.assignedAgentId` in the wizard draft.

### 2. Duplicate detection before commit

**Frontend:** After extraction returns, before showing "Open wizard", call `supabase.functions.invoke('detect-duplicates', { address, city, price, bedrooms, size_sqm })`.

**If matches found:** Show an amber warning block in the preview:
> "⚠ Possible duplicate: [Property title] at [address] — listed [date]. [View listing] [Continue anyway]"

Two CTAs: **View existing** (opens `/property/:id` in new tab) and **Continue anyway** (proceeds to wizard with a flag in draft metadata: `duplicateAcknowledged: true`).

If `detect-duplicates` doesn't currently accept this shape, add a thin wrapper or extend it minimally — confirm signature before wiring.

### 3. Photo curation hint (auto-pick cover)

**Backend:** When ≥8 photos uploaded, add a second Gemini call inside `ai-extract-listing` (or a chained step) using the curb-appeal sort prompt from the AI Vision Cover Selection memory. Returns `cover_photo_index: number` and `photo_ranking: number[]`.

**Frontend:** Preview shows the chosen cover with a "AI-picked cover" badge and a small "Change" link that opens a photo grid to override. Store `metadata.coverPhotoIndex` in the draft so Step 4 of the wizard reflects it.

If <8 photos: skip the call, default cover = first photo (current behavior).

### 4. Rental vs resale forced choice

**Backend:** Include `listing_status_confidence: 'high' | 'low'` in the extraction output. Mark low when Hebrew/English cues are absent or contradictory (e.g., price stated without "להשכרה" or "למכירה" keywords).

**Frontend:** In the preview panel:
- If `listing_status_confidence === 'high'` → show as a regular field.
- If `'low'` → render a required radio group ("Is this for sale or for rent?") with **Sale** / **Rent** options. The "Open wizard with these values" button stays disabled until a choice is made.

### Files to touch

- `supabase/functions/ai-extract-listing/index.ts` — add agencyId param, roster fetch + fuzzy match, cover-selection chained call, listing_status confidence flag, expanded response shape.
- `src/components/admin/agency-provisioning/AiListingKickstartDialog.tsx` — pass agencyId, render agent match badge, duplicate warning block, AI-picked cover badge, conditional sale/rent radio, gate the CTA on resolved choices.
- (No DB migrations — purely additive to existing function output and existing draft localStorage shape.)

### Technical notes

- Keep the Gemini extraction schema under 20 top-level properties (per `ai-extraction-schema-branching` memory) — nest the new fields (`detected_agent`, `cover_photo_index`, `listing_status_confidence`) inside existing groups where possible.
- Cover-selection prompt: pass photo URLs (already uploaded to property-images bucket) directly to Gemini 2.5 Flash; ask it to rank by "exterior curb appeal, then bright interior, then amenity" per the existing memory.
- Duplicate detection call must be debounced — only run once per extraction result, not on every preview re-render.
- All new UI strings follow "Trusted Friend" voice.

### Out of scope (v2)

- Editing the matched agent inline (handled in wizard Step 1).
- Merging into the duplicate listing (only warn + link out).
- Re-running extraction after photo reorder.