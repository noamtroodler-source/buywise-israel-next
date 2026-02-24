

## Data Validation Before Insert

### Problem
The AI extraction can return incomplete or invalid data (e.g. price = 0, empty city, invalid property_type). Currently these get inserted with fallback defaults or cause database errors with cryptic messages. There's no clear per-item validation feedback.

### Solution
Add a `validatePropertyData` and `validateProjectData` function in the edge function that runs after AI extraction but before the database insert. Items that fail validation are marked as `failed` with a specific, human-readable error message listing exactly what's wrong (visible per-item in the existing UI).

### Changes

**File: `supabase/functions/import-agency-listings/index.ts`**

Add two validation functions and integrate them into the processing flow:

**1. `validatePropertyData(listing)` function**

Checks the extracted property data and returns an array of validation error strings. If the array is empty, the data is valid.

Validations:
- `price` must be a positive number (> 0)
- `city` must be a non-empty string
- `property_type` must be one of the valid enum values (apartment, garden_apartment, penthouse, mini_penthouse, duplex, house, cottage, land, commercial) -- defaults gracefully if missing
- `listing_status` must be `for_sale` or `for_rent`
- `bedrooms` must be a non-negative integer (Math.floor applied)
- `bathrooms` must be a non-negative integer
- `size_sqm`, if present, must be a positive number
- `floor`, if present, must be a reasonable integer (-2 to 200)
- `year_built`, if present, must be between 1800 and current year + 5
- `price` sanity: warn if price < 1000 (likely extraction error for ILS)

**2. `validateProjectData(listing)` function**

Checks project data:
- `project_name` or `title` must be non-empty
- `city` must be non-empty
- `price_from`, if present, must be positive
- `construction_status`, if present, must be a valid enum value

**3. Integration into `handleProcessBatch`**

For properties (after line ~614, before duplicate detection):
```text
const errors = validatePropertyData(listing);
if (errors.length > 0) {
  await sb.from("import_job_items").update({
    status: "failed",
    error_message: `Validation failed: ${errors.join("; ")}`
  }).eq("id", item.id);
  failed++;
  continue;
}
```

For projects (after line ~486, before duplicate detection):
```text
const errors = validateProjectData(listing);
if (errors.length > 0) {
  // same pattern
}
```

### What the user sees

In the existing job items UI, failed items already show their `error_message`. After this change, validation failures will show messages like:

- "Validation failed: price must be greater than 0; city is required"
- "Validation failed: invalid property type 'studio'"
- "Validation failed: year_built 1750 is out of range"

These items can then be retried after the source data is fixed, using the existing "Retry Failed" button.

### Technical Details

```text
Valid property_type values:
  apartment, garden_apartment, penthouse, mini_penthouse,
  duplex, house, cottage, land, commercial

Valid listing_status values:
  for_sale, for_rent

Valid construction_status values:
  planning, pre_sale, foundation, structure, finishing, delivery, completed

Validation runs AFTER:
  - sold/rented check (line ~332)
  - AI extraction (line ~470)
  - extracted_data is saved (line ~473)

Validation runs BEFORE:
  - duplicate detection
  - image download
  - geocoding
  - database insert

This ordering is intentional: we save the raw extracted_data first
(so it can be inspected even if validation fails), but skip all the
expensive operations (image downloads, geocoding) if the data is invalid.
```

### No UI changes needed
The existing UI already displays `error_message` for failed/skipped items. The validation messages will appear there automatically with clear, actionable text.
