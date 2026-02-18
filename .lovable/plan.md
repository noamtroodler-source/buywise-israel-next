
# Slot Inventory Enforcement — Complete Fix

## The Three Gaps

### Gap 1 — No database-level hard cap (critical)
The edge function checks slots with `get_active_boost_count` then inserts — but these two operations are **not atomic**. Two concurrent purchases (e.g., both agency A and agency B buy the last slot simultaneously) could both pass the count check, then both insert, pushing active boosts to `max_slots + 1`. There is no DB constraint, trigger, or unique index to prevent this. The `active_boosts` table has zero constraints beyond the primary key.

**Fix:** Add a `BEFORE INSERT` trigger on `active_boosts` that re-checks the count inside the same transaction, with a row-level advisory lock on the product ID. This makes the slot cap atomic and race-condition proof.

### Gap 2 — `BoostDialog` (listing-row shortcut) has no slot awareness
The `BoostDialog` component used from listing/project rows fetches `useVisibilityProducts` and `useActiveBoosts` but **never calls `useSlotAvailability`**. A sold-out product (e.g., Homepage Sale with all 6 slots taken) appears as a normal selectable card with no visual distinction. Users can select it and attempt to activate — only getting the error after clicking "Activate" and hitting the edge function.

**Fix:** Integrate `useSlotAvailability` into `BoostDialog`. Show a "Sold Out" badge on full products and make them unselectable, matching the `BoostMarketplace` behavior.

### Gap 3 — No "duplicate entity" prevention
An agency can currently activate the same listing-level product for the same listing twice (paying credits both times), which creates two rows in `active_boosts` for the same `(entity_id, product_id, target_id)`. The edge function doesn't check for an existing active boost on that specific combination before inserting.

**Fix:** Add a partial unique index on `active_boosts(entity_id, product_id, target_id)` where `is_active = true` and `ends_at > now()` — enforced at DB level. Also add a pre-check in the edge function to return a clear error ("You already have this boost active for this listing") before attempting to deduct credits.

---

## What's Already Working (Do Not Touch)

- `BoostMarketplace` correctly shows slot availability bars, "Sold Out" badges, and disables CTA on full products ✅
- `useSlotAvailability` hook is correctly implemented — queries `get_active_boost_count` per product ✅
- Edge function slot count check (lines 134–142) works in the non-concurrent case ✅
- `get_active_boost_count` DB function correctly counts `is_active = true AND ends_at > now()` ✅

---

## Implementation

### Fix 1 — DB: Atomic slot enforcement trigger + duplicate prevention index

Two schema changes via migration:

**A. Partial unique index** — prevents double-booking the same listing:
```sql
CREATE UNIQUE INDEX uq_active_boosts_entity_product_target
ON public.active_boosts (entity_id, product_id, target_id)
WHERE is_active = true;
```

**B. Slot cap trigger** — re-checks count atomically inside the transaction:
```sql
CREATE OR REPLACE FUNCTION public.enforce_boost_slot_cap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_max_slots int;
  v_current_count int;
BEGIN
  -- Lock on product to serialize concurrent inserts
  PERFORM pg_advisory_xact_lock(hashtext('boost_slot_' || NEW.product_id::text));

  SELECT max_slots INTO v_max_slots
  FROM public.visibility_products
  WHERE id = NEW.product_id;

  IF v_max_slots IS NOT NULL THEN
    SELECT COUNT(*) INTO v_current_count
    FROM public.active_boosts
    WHERE product_id = NEW.product_id
      AND is_active = true
      AND ends_at > now();

    IF v_current_count >= v_max_slots THEN
      RAISE EXCEPTION 'SLOT_FULL: No slots available for this boost product (max: %)', v_max_slots;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_boost_slot_cap
  BEFORE INSERT ON public.active_boosts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_boost_slot_cap();
```

This means even if the edge function's own slot check somehow misses a race, the DB will reject the insert with a clear error.

### Fix 2 — `activate-boost` edge function: add duplicate-active-boost check

Before the slot cap check (line 134), add a check for an existing active boost on the same `(entity_id, product_id, target_id)`:

```typescript
// Check for existing active boost on same target
const { data: existing } = await admin
  .from("active_boosts")
  .select("id, ends_at")
  .eq("entity_id", entityId)
  .eq("product_id", product.id)
  .eq("target_id", target_id)
  .eq("is_active", true)
  .gt("ends_at", new Date().toISOString())
  .maybeSingle();

if (existing) {
  return new Response(JSON.stringify({
    error: "This boost is already active for this listing.",
    ends_at: existing.ends_at,
  }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
```

Also improve the error parsing when the DB trigger fires (the `SLOT_FULL:` prefix in the trigger message makes it parseable):

```typescript
if (boostErr) {
  const isSoldOut = boostErr.message?.includes('SLOT_FULL');
  return new Response(JSON.stringify({
    error: isSoldOut ? "No boost slots available. All slots are taken." : "Failed to create boost",
  }), { status: isSoldOut ? 409 : 500, ... });
}
```

### Fix 3 — `BoostDialog.tsx`: add slot awareness

The `BoostDialog` currently shows all products with no slot data. Changes:

1. Import `useSlotAvailability` from `useBoosts`.
2. Call `useSlotAvailability(products)` to get the `slotMap`.
3. For each product card, check `slotMap[product.id]?.isFull`:
   - If full: show "Sold Out" badge (amber/secondary variant), disable selection (`cursor-not-allowed`), add visual opacity.
   - Otherwise: existing behavior unchanged.

This makes `BoostDialog` slot-aware, matching `BoostMarketplace`.

---

## Files Summary

| File | Type | Change |
|---|---|---|
| DB migration | New | Partial unique index `uq_active_boosts_entity_product_target`; `enforce_boost_slot_cap()` function + `trg_enforce_boost_slot_cap` trigger |
| `supabase/functions/activate-boost/index.ts` | Edit | Add duplicate-active-boost pre-check; improve DB trigger error parsing |
| `src/components/billing/BoostDialog.tsx` | Edit | Import and call `useSlotAvailability`; render "Sold Out" badge and disable selection for full products |

---

## Technical Notes

- **Advisory lock key format:** `hashtext('boost_slot_' || product_id::text)` — scoped to the product ID so concurrent purchases of *different* products don't block each other; only concurrent purchases of the *same* product serialize.
- **Trigger vs. application check:** The trigger is the safety net. The edge function's pre-checks (duplicate boost, slot count) remain as the first line of defense for good UX (clean error messages before credit deduction is attempted). The trigger fires after the `spend_credits` deduction — if the trigger rejects the insert, the transaction rolls back, so credits are never lost. This is safe because `spend_credits` and `active_boosts` insert happen in separate Supabase calls (not a DB transaction). To prevent credit loss on trigger rejection, the edge function's own slot check must remain — the trigger is the **backstop**, not the primary gate.
- **The `slot_position` column** already exists in `active_boosts` but is never set. It can be populated by the trigger (`NEW.slot_position := v_current_count + 1`) for future admin slot assignment features — added as a bonus in the trigger.
- **`BoostMarketplace`** already handles slot display correctly — no changes needed there.
- **No changes to `useSlotAvailability` hook** — it's already correct.
- **Actual DB slot counts** differ from the original spec: Homepage Sale/Rent = 6 (not 8), City Spotlight = 3, Email Digest = 2, Directory = 5 each. The enforcement works against whatever is in `max_slots` — no need to change these values now.
