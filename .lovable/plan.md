

## Improved Deduplication Against Existing Listings

### Current State
There is already duplicate detection at lines 716-735 for properties (address + city + price within 5%) and lines 578-592 for projects (name + city). However, the property check has gaps:

1. **Requires price** -- if price changes between imports, duplicates slip through
2. **Requires all 3 fields** -- if address or city is missing, no dedup check runs at all
3. **No normalization** -- address strings like "Herzl 5" vs "herzl 5" only match via `ilike` (case-insensitive), but "5 Herzl St" vs "Herzl 5" would not match
4. **No agent scoping** -- checks the entire properties table, not just the agency's listings

### Solution
Replace the existing property duplicate detection with a two-tier approach:

**Tier 1: Exact match (address + city)**
- If a property exists with the same address and city (case-insensitive via `ilike`), it's a duplicate regardless of price
- Scoped to the same agent (via `agent_id`) to avoid cross-agency false positives

**Tier 2: Fuzzy match (city + bedrooms + size + similar price)**
- If address is missing or empty, fall back to matching on city + bedrooms + size_sqm + price within 5%
- This catches cases where the address wasn't extracted but it's clearly the same unit

Both tiers mark the item as `skipped` with a clear message including the existing property ID for reference.

### Changes

**File: `supabase/functions/import-agency-listings/index.ts`**

Replace the existing property duplicate detection block (lines 716-735) with improved logic:

```text
// ── Duplicate detection (two-tier) ──

// Tier 1: Same address + city (strongest signal)
if (listing.address && listing.city) {
  const trimmedAddr = listing.address.trim();
  if (trimmedAddr.length > 0) {
    const { data: dupes } = await sb
      .from("properties")
      .select("id")
      .eq("agent_id", agentId)
      .ilike("address", trimmedAddr)
      .ilike("city", listing.city.trim())
      .limit(1);

    if (dupes && dupes.length > 0) {
      await sb.from("import_job_items").update({
        status: "skipped",
        error_message: `Duplicate: matches existing property ${dupes[0].id} (same address + city)`
      }).eq("id", item.id);
      failed++;
      continue;
    }
  }
}

// Tier 2: Fuzzy match when address is weak — city + rooms + size + ~price
if (listing.city && listing.bedrooms != null && listing.size_sqm && listing.price) {
  const priceLow = listing.price * 0.95;
  const priceHigh = listing.price * 1.05;

  const { data: fuzzyDupes } = await sb
    .from("properties")
    .select("id")
    .eq("agent_id", agentId)
    .ilike("city", listing.city.trim())
    .eq("bedrooms", Math.floor(listing.bedrooms))
    .eq("size_sqm", listing.size_sqm)
    .gte("price", priceLow)
    .lte("price", priceHigh)
    .limit(1);

  if (fuzzyDupes && fuzzyDupes.length > 0) {
    await sb.from("import_job_items").update({
      status: "skipped",
      error_message: `Duplicate: matches existing property ${fuzzyDupes[0].id} (same city, rooms, size, ~price)`
    }).eq("id", item.id);
    failed++;
    continue;
  }
}
```

**Also improve the project duplicate detection** (lines 578-592) to include the existing project ID in the skip message for easier debugging:

```text
if (dupeProjects && dupeProjects.length > 0) {
  await sb.from("import_job_items").update({
    status: "skipped",
    error_message: `Duplicate: matches existing project ${dupeProjects[0].id} (same name + city)`
  }).eq("id", item.id);
  failed++;
  continue;
}
```

### Key Design Decisions

- **Agent-scoped**: Duplicates are checked within the same agent's listings only. Two different agents can legitimately list the same property (co-exclusives, etc.)
- **Tier 1 doesn't need price**: If the same agent has a property at "Herzl 5, Tel Aviv", it's the same listing even if the price changed
- **Tier 2 requires exact size_sqm match**: This is intentional -- size is a strong identifier for a specific unit, and unlike price it rarely changes between imports
- **Existing property ID in message**: The skip message now includes the matching property ID so agents can easily verify it's truly a duplicate

### What the User Sees

In the import job items UI, duplicates will show clear messages like:
- "Duplicate: matches existing property abc-123 (same address + city)"
- "Duplicate: matches existing property def-456 (same city, rooms, size, ~price)"
- "Duplicate: matches existing project ghi-789 (same name + city)"

### No UI Changes Needed
The existing UI already displays `error_message` for skipped items. The improved messages will appear there automatically.

