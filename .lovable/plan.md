
# Email Digest Sponsored Slot — Complete Implementation Plan

## What "No Email Digest System Exists Yet" Means

There are actually two separate digest email systems:

1. **Weekly Professional Digest** (`send-digest-email`) — sent to agents and developers every Sunday, showing their stats (views, inquiries). Already built. No sponsored slot.
2. **Search Alert Emails** (`process-search-alerts`) — sent to buyers when new properties match their saved searches. These go out with `instant`, `daily`, and `weekly` frequencies. Already built. No sponsored slot.

The `email_digest_sponsored` visibility product exists in `visibility_products` (80 credits, 7 days, max 2 slots), the `active_boosts` infrastructure supports it, and the Boost Marketplace UI can already sell it. But when those emails actually send, they look at zero sponsored boost data — they never query `active_boosts` for `email_digest_sponsored` and never inject a sponsor block into the email body.

**The gap is entirely in the two edge functions** — no code outside of them needs to change.

---

## The Email in Which the Sponsor Block Appears

The decision of *which* digest to inject the sponsor into matters:

- **Weekly Professional Digest**: Recipients are agents/developers — not buyers. Showing a competing agency or developer to an agent makes little sense.
- **Search Alert Emails**: Recipients are **buyers** actively searching for properties. This is where a sponsored agency or developer card is commercially valuable. A buyer looking for a 3-bed apartment in Tel Aviv sees properties + one "Featured Agency" card = qualified impression at the exact moment of intent.

**The sponsor block goes into `process-search-alerts`** (buyer-facing search alert emails). The 7-day `duration_days` on the product matches perfectly — these emails go out continuously.

---

## Architecture of the Sponsored Block

When `process-search-alerts` runs for any frequency (instant / daily / weekly):

1. **Before sending any email**, query `active_boosts` once for all `email_digest_sponsored` boosts that are currently active (`is_active = true`, `ends_at > now()`).
2. For each active boost, the `entity_type` is `agency` or `developer` and `target_id` is the entity's own ID (entity-level boost).
3. Fetch the agency/developer name, logo, and slug for each active sponsor.
4. Pick up to 2 sponsors (matching `max_slots: 2`). For rotation fairness, shuffle or round-robin by `created_at`.
5. Inject a "Featured Partner" section into **each** search alert email sent in that run, after the property listings and before the footer.

This means buying the product gives the sponsor placement in every search alert email sent during the 7-day window — potentially thousands of qualified buyer impressions.

---

## What the Sponsor Block Looks Like in the Email

```
┌─────────────────────────────────────────────────────┐
│  ✦ Featured Partner                                 │
│  ┌────────────────────────────────────────────────┐ │
│  │  [LOGO]  Agency Name                           │ │
│  │          "Looking for expert guidance in       │ │
│  │           Tel Aviv? We're here to help."       │ │
│  │          [View Profile →]                      │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

Specifically:
- Amber/gold tinted background (`#fffbeb`) to visually distinguish from organic property cards.
- Small "✦ Featured Partner" label in 11px muted text above the card — honest labelling.
- Logo (img tag with fallback initials) + entity name.
- "Looking for expert guidance? Contact us today." — generic fallback copy (entity description not always present).
- CTA button: "View Agency Profile →" linking to `buywiseisrael.com/agency/[slug]` or `buywiseisrael.com/developer/[slug]`.
- When 2 sponsors are active, show both cards stacked.
- When 0 sponsors are active, the section is omitted entirely — no empty placeholder.

---

## Files to Change

Only **one file** needs to be edited: `supabase/functions/process-search-alerts/index.ts`

No frontend changes, no DB migrations, no new edge functions, no new hooks.

---

## Implementation Detail for `process-search-alerts`

**Step 1 — Fetch active sponsors once before the loop:**

```typescript
const { data: activeDigestBoosts } = await supabase
  .from('active_boosts')
  .select('entity_type, target_id, target_type')
  .eq('is_active', true)
  .gt('ends_at', new Date().toISOString())
  .in('product_id', [/* email_digest_sponsored product id */]);
```

To get the product ID, query `visibility_products` for `slug = 'email_digest_sponsored'` once at startup.

**Step 2 — Resolve entity details for each boost:**

For each active boost (up to 2), query `agencies` or `developers` to get `name`, `logo_url`, `slug`, `description`. These are entity-level boosts, so `target_type = entity_type` and `target_id = entity_id`.

Use `Promise.all` to batch the lookups.

**Step 3 — Build `generateSponsorBlockHtml(sponsors)`:**

A pure function returning an HTML string. When `sponsors.length === 0`, returns `''`. When 1 or 2, returns the amber-tinted sponsor card section. This string is injected into every outgoing email body via template interpolation, replacing the `${brandFooter}` placement (inserted between the property list and the footer).

**Step 4 — Inject into every email:**

The current email template in the function is a template literal. Add `${sponsorBlock}` just above `${brandFooter}` in the HTML string. Since `sponsorBlock` is computed once before the per-alert loop and injected into every email, all recipients in a given run see the same sponsor(s). This is correct and consistent.

---

## Files Summary

| File | Type | Change |
|---|---|---|
| `supabase/functions/process-search-alerts/index.ts` | Edit | Before the alert loop: query `email_digest_sponsored` product ID, fetch active boosts, resolve agency/developer sponsor details. Build `generateSponsorBlockHtml()`. Inject sponsor block into the email template. |

---

## Technical Notes

- **No schema change needed.** `active_boosts.target_type` and `target_id` already support entity-level boosts. The `email_digest_sponsored` product is already in `visibility_products` with `max_slots: 2`.
- **Fair rotation with 2 slots:** Both active sponsors are shown if 2 are purchased. If only 1, only 1 appears. The edge function queries by `ends_at` descending so the most recently purchased appears first — a natural FIFO that is easy to reason about.
- **Zero-sponsor case is invisible:** No "Sponsor this slot" placeholder appears in buyer emails. The section simply does not render when no paid boost is active.
- **The Professional Digest (`send-digest-email`) is NOT changed.** That function sends to agents/developers about their own stats — not the right audience for competitor ads.
- **Honest labelling:** "Featured Partner" language is standard email advertising practice and avoids misleading buyers. It is visually distinct (amber tint) from organic property cards (white background).
- **Performance:** The sponsor lookup is O(1) queries before the loop (one product ID lookup + one `active_boosts` query + up to 2 entity detail lookups). This adds ~3 DB reads per run regardless of how many emails are sent in that run.
- **The product already has `duration_days: 7`**, so each credit spend gives 7 days of placement in all search alert emails sent during that window. Buying the product via the Boost Marketplace (already built) already works for entity-level activation — no change to `activate-boost` needed.
