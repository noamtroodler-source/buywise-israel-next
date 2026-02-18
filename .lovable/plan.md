
# Boost Marketplace — Self-Serve Visibility Store

## What Exists vs. What's Missing

**What's already built (the infrastructure):**
- `visibility_products` table — all 12 products seeded with correct slugs, credit costs, `max_slots`, `applies_to`, `duration_days`
- `active_boosts` table — stores activated boosts with `entity_type/entity_id`, `target_type/target_id`, expiry
- `activate-boost` edge function — deducts credits and creates boost records, but **only accepts `target_type = 'property' | 'project'`** (hard-coded ownership check)
- `BoostDialog` — a compact product picker shown from a listing/project row context; works for the two existing target types
- `ActiveBoostBadge` — shown on listing rows and project cards
- `BoostAnalyticsPanel` — ROI stats in the Billing hub
- `useVisibilityProducts`, `useActiveBoosts`, `useActivateBoost` hooks

**The 3-layer gap:**

1. **No self-serve marketplace** — there is no standalone page or dedicated hub where agencies/developers can browse all available boost products, see available slot counts, and purchase visibility. Credits can be bought but the only place to spend them is via `BoostDialog` which opens from individual listing rows. Entity-level products (Directory, Email Digest, Budget Tool) have no purchase UI whatsoever.

2. **Entity-level products are blocked at the edge function** — `agency_directory_featured`, `developer_directory_featured`, and `email_digest_sponsored` are entity-level boosts (they promote the agency/developer itself, not a specific property/project). The current edge function rejects any `target_type` that isn't `property` or `project`, making these 3 products entirely unpurchasable even if a UI existed.

3. **No slot availability signal** — users can't see how many of the 8 Homepage slots are taken before spending 70 credits. The admin view shows slot counts but the professional-facing UI never does.

---

## Architecture of the 9 Products

The 9 products split cleanly into two activation patterns:

**Listing-level** (target = a specific property or project ID):
- Homepage Sale Featured (agency, property target)
- Homepage Rent Featured (agency, property target)
- Homepage Project Hero (developer, project target)
- Homepage Project Secondary (developer, project target)
- Projects Boost (developer, project target)
- Search Priority Boost (all, property target)
- City Spotlight (all, property target)
- Similar Listings Priority (all, property target)

**Entity-level** (target = the agency or developer itself — `target_type = 'agency'|'developer'`, `target_id = entityId`):
- Agency Directory Featured (agency, entity target)
- Developer Directory Featured (developer, entity target)
- Email Digest Sponsored (all, entity target)
- Budget Tool Sponsor (all, entity target — promotes the entity in the tool)

---

## What We're Building

### Part 1 — Edge Function: Support Entity-Level Target Types

Update `supabase/functions/activate-boost/index.ts` to accept two new `target_type` values: `'agency'` and `'developer'`.

For these types, ownership is trivially verified: `target_id === entityId && target_type === entityType`. No additional DB query needed.

This unlocks the 4 entity-level products immediately.

**File:** `supabase/functions/activate-boost/index.ts`

---

### Part 2 — New Hook: `useSlotAvailability`

Extend `src/hooks/useBoosts.ts` with a new `useSlotAvailability` hook that fetches remaining slot counts for products with `max_slots`:

```ts
// Returns: { productId -> { maxSlots, usedSlots, availableSlots, isFull } }
useSlotAvailability(productIds: string[])
```

Uses the existing `get_active_boost_count` DB function per product. Returns a map so the Marketplace can show "6 of 8 slots remaining" inline.

**File:** `src/hooks/useBoosts.ts`

---

### Part 3 — New Page: Boost Marketplace (`/agency/boost` and `/developer/boost`)

A full-page self-serve marketplace that is the primary home for spending credits. A single shared component `BoostMarketplace` is rendered in two route-specific wrapper pages.

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  ⚡ Boost Marketplace          [Balance: 340 credits]│
│  Spend credits to promote your listings & profile   │
└─────────────────────────────────────────────────────┘

Tab: Listings & Profiles | Tab: Your Active Boosts

[Category pills: All | Homepage | Search | Directory | Email]

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Homepage     │ │ Search      │ │ City        │
│ Sale         │ │ Priority    │ │ Spotlight   │
│ Featured     │ │ Boost       │ │             │
│ 70 credits/wk│ │ 15 credits/7d│ │25 credits/7d│
│ 6/8 slots ✓ │ │ Unlimited   │ │ 2/3 slots ✓ │
│ [Activate →] │ │ [Activate →]│ │ [Activate →]│
└─────────────┘ └─────────────┘ └─────────────┘
```

**Product Card contents:**
- Icon (mapped per product slug)
- Name and description
- Credit cost + duration ("70 credits · 7 days")
- Approximate ILS equivalent ("≈ ₪1,400")
- Slot availability bar: "6 of 8 slots remaining" (hidden if `max_slots = null`)
- Slot full badge: "Sold Out" when `availableSlots = 0` — greyed out
- Can't afford badge: when balance < credit_cost
- For listing-level products: "Select a listing →" CTA that opens a listing/project picker
- For entity-level products: "Activate for [Agency Name]" — no picker needed
- Active state: if entity already has this boost running, shows "Active — Expires in X days" with a green ring and no buy CTA

**Category pills:** All | Homepage | Search | Directory | Email — filters the product grid.

**Listing/Project Picker (for listing-level products):**
When a user clicks "Activate" on a listing-level product, a sheet slides in showing their approved listings/projects with search. They pick one, then confirm credit spend. This replaces the current `BoostDialog` approach of picking a product from a specific listing's context — the flow is inverted to be marketplace-first.

**Active Boosts tab:**
Shows all currently running boosts for the entity — same data as `BoostAnalyticsPanel` but simplified (just the active ones, no chart). Links to the full ROI panel in Billing.

**Files:**
- New: `src/components/billing/BoostMarketplace.tsx` — shared marketplace component
- New: `src/components/billing/BoostProductCard.tsx` — individual product card
- New: `src/components/billing/ListingPickerSheet.tsx` — listing/project selector sheet
- New: `src/pages/agency/AgencyBoost.tsx` — route wrapper for `/agency/boost`
- New: `src/pages/developer/DeveloperBoost.tsx` — route wrapper for `/developer/boost`

---

### Part 4 — Route Registration

Add two protected routes in `src/App.tsx`:
- `/agency/boost` → `AgencyBoost`
- `/developer/boost` → `DeveloperBoost`

---

### Part 5 — Navigation Entry Points

The Marketplace needs to be reachable. Add "Boost Marketplace" entries in:

1. **`AgencyBilling.tsx`** — Add a 4th tab "Marketplace" (with a Rocket/Zap icon) alongside Overview, Invoices, Boost ROI. Or use a standalone CTA button linking to `/agency/boost`.

2. **`DeveloperBilling.tsx`** — Same pattern.

3. **`AgencyDashboard.tsx`** — Add a "Boost Listings" quick-action button in the header action strip (alongside "Add Listing", "Write Article").

4. **`DeveloperDashboard.tsx`** — Same, "Boost Projects" quick-action button.

5. **`BoostAnalyticsPanel.tsx`** — Update the empty-state CTA ("Boost a Listing") and the bottom of the panel to link to `/agency/boost` or `/developer/boost` (resolved from `entityType`).

6. **Credit balance display in `BillingSection` / `SubscriptionStatusCard`** — Add a "Spend Credits →" link next to the balance figure that routes to the marketplace.

---

### Part 6 — Extend `useActivateBoost` for Entity-Level Products

The frontend `useActivateBoost` mutation currently only accepts `target_type: 'property' | 'project'`. Extend it to also accept `'agency' | 'developer'` so entity-level products can be submitted from the Marketplace.

**File:** `src/hooks/useBoosts.ts`

---

## Files Summary

| File | Type | Change |
|---|---|---|
| `supabase/functions/activate-boost/index.ts` | Edit | Accept `target_type = 'agency'|'developer'`; verify `target_id === entityId` |
| `src/hooks/useBoosts.ts` | Edit | Add `useSlotAvailability` hook; extend `useActivateBoost` to accept entity target types |
| `src/components/billing/BoostProductCard.tsx` | New | Product card with slot bar, affordability state, active state, CTA |
| `src/components/billing/ListingPickerSheet.tsx` | New | Radix Sheet with searchable listing/project list for listing-level products |
| `src/components/billing/BoostMarketplace.tsx` | New | Full marketplace: category tabs, product grid, active boosts tab |
| `src/pages/agency/AgencyBoost.tsx` | New | Route wrapper: `/agency/boost` |
| `src/pages/developer/DeveloperBoost.tsx` | New | Route wrapper: `/developer/boost` |
| `src/App.tsx` | Edit | Register two new protected routes |
| `src/pages/agency/AgencyBilling.tsx` | Edit | Add "Marketplace" tab / CTA linking to `/agency/boost` |
| `src/pages/developer/DeveloperBilling.tsx` | Edit | Same for developer |
| `src/pages/agency/AgencyDashboard.tsx` | Edit | Add "Boost Listings" quick-action button |
| `src/pages/developer/DeveloperDashboard.tsx` | Edit | Add "Boost Projects" quick-action button |
| `src/components/billing/BoostAnalyticsPanel.tsx` | Edit | Fix empty-state CTA to link to marketplace; add "See Marketplace →" footer link |

---

## Technical Notes

- **ILS approximation on product cards** is computed client-side: `creditCost × 20` (₪20/credit). No DB query needed.
- **`get_active_boost_count` DB function** already exists and is used in the edge function for slot cap checks. `useSlotAvailability` calls this RPC once per product with a `max_slots` value — batched with `Promise.all`.
- **Entity-level boost activation:** `target_type = entityType` (e.g. `'agency'`), `target_id = entityId`. The edge function ownership check becomes: `target_id === entityId && target_type === entityType` — trivially safe.
- **`ListingPickerSheet`** only shows listings/projects with `verification_status = 'approved'` — only live content can be boosted. Uses existing `useAgencyListingsManagement` and `useDeveloperProjects` hooks already in the codebase.
- **No DB migration needed** — `active_boosts.target_type` is already `text` (not an enum), so new values `'agency'` and `'developer'` can be inserted without schema changes.
- **Slot "sold out" state:** when `availableSlots === 0`, the product card is greyed out with a "Sold Out" badge and the CTA is disabled. This prevents the frustration of spending credits on a product that then gets rejected server-side.
- **The existing `BoostDialog`** (property/project row context) is kept — it still works for direct "boost this listing" shortcuts from the Listings table and project rows. The Marketplace is the primary path; `BoostDialog` is the shortcut path. Both ultimately call the same `activate-boost` edge function.
- **Category pill filter mapping** (by product slug):
  - Homepage: `homepage_sale_featured`, `homepage_rent_featured`, `homepage_project_hero`, `homepage_project_secondary`
  - Search: `search_priority`, `city_spotlight`, `similar_listings_priority`
  - Directory: `agency_directory_featured`, `developer_directory_featured`
  - Projects: `projects_boost`
  - Email: `email_digest_sponsored`, `budget_tool_sponsor`
