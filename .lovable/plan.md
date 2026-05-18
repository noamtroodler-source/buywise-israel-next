I found the issue: the kickstart extractor is relying on one big vision-to-JSON call, so it can “see” facts in screenshots but still omit them from the final structured object. The UI also only previews a limited set of fields, so some extracted facts may not be visible even when they exist.

Plan:

1. Make extraction two-stage instead of one-shot
- Stage A: run a dedicated OCR/facts pass over every uploaded screenshot and force it to transcribe visible listing facts per image: price, sqm, rooms, floor, neighborhood, condition, entry date, balcony/porch size, total floors, furnished status, parking/elevator/storage/AC/accessibility, agent details, and raw description text.
- Stage B: feed that facts transcript plus pasted notes into the structured listing extractor.

2. Add deterministic cleanup after AI
- Parse obvious values from the transcript as a safety net: `3,250,000 ₪`, `45 מ״ר / Mr 45`, `Rooms 1`, `floor ground`, `5 floors`, `Nahalat Binyamin`, `porch 9 sq m`, `without furniture`, `new/renovated`.
- Reconcile features into wizard fields: `porch/balcony` → `has_balcony`, `elevator` → `has_elevator`, `warehouse/storage` → `has_storage`, `air conditioning/central AC` → `ac_type`, plus parking counts.
- Preserve source notes so you can see exactly where each value came from.

3. Expand the returned schema and preview
- Add fields the screenshots clearly contain but the current preview ignores or underrepresents: original room count, entry date, balcony size, furnished status, total floors, boolean amenities, and extracted description source text.
- Update the “Extracted draft” preview to show these fields so it no longer looks like AI missed data that is actually present.

4. Improve error visibility
- If OCR finds a fact but structured output drops it, the post-processor will restore it and add a note like “Recovered price from OCR transcript.”
- If a field is still missing, it will show as genuinely missing instead of silently failing.

Files to update after approval:
- `supabase/functions/ai-extract-listing/index.ts`
- `src/components/admin/agency-provisioning/AiListingKickstartDialog.tsx`