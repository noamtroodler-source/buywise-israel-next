

## Plan: Import & Clean GovMap Transaction Data

### What We Have
- **CSV**: ~27,850 rows from govmap.gov.il covering 25 cities, March 2023 – Feb 2026
- **Existing table**: `sold_transactions` with 11,304 rows already loaded
- **Existing infra**: `import-sold-transactions` edge function + admin page at `/admin/sold-transactions`

### Approach
Build a new **`import-govmap-data`** edge function + **admin UI page** that handles CSV parsing, cleaning, validation, and batch insertion — all server-side. The frontend parses the CSV, applies client-side filters, then sends cleaned batches to the edge function.

### Step 1: Edge Function — `import-govmap-data`

Admin-only function that receives pre-cleaned transaction batches and upserts them.

**Key logic:**
- Accepts `{ transactions: [...], source: "govmap_gov_il" }`
- Upserts into `sold_transactions` using `ON CONFLICT (address, city, sold_date, sold_price)` to deduplicate against existing 11,304 rows
- Logs import to `sold_data_imports`
- Uses service role client for writes

### Step 2: Admin Page — `/admin/import-govmap`

CSV upload page with client-side cleaning pipeline before sending to edge function.

**Column mapping** (CSV → DB):
| CSV Column | DB Column | Transform |
|---|---|---|
| `cityNameEng` | `city` | Cross-reference against `cities` table; skip rows with unknown cities |
| `streetNameEng` + `houseNum` | `address` | Concatenate, e.g. "HaDekel 15" |
| `dealDateClean` | `sold_date` | Direct (already YYYY-MM-DD) |
| `dealAmount` | `sold_price` | Parse as number |
| `assetArea` | `size_sqm` | Parse as number |
| `assetRoomNum` | `rooms` | Parse as number |
| `floorNo` | `floor` | Parse Hebrew ordinals (ראשונה→1, שניה→2, etc.) |
| `gushNum` + `parcelNum` | `gush_helka` | Concatenate as "GUSH-PARCEL" |
| `dealNatureDescription` | — | Used for filtering only |
| `propertyTypeDescription` | `property_type` | Normalize Hebrew→English |
| `neighborhood` | `neighborhood` | Direct |
| `dealId` | stored in `raw_data` | Used for dedup within CSV |

**Cleaning rules (client-side before upload):**

1. **Exclude non-residential**: Filter out rows where `dealNatureDescription` contains: `חניה` (parking), `מחסן` (storage), `קרקע` (land), `ללא תיכנון`, `משרד` (office), `חנות` (shop)
2. **Exclude new construction**: Filter out `dealNatureDescription` containing `מכירה ראשונה`, `קבלן`, or where it signals first-sale/developer deals — but since the data doesn't cleanly separate these, we'll flag `is_new_construction = false` for all (resale assumption) and rely on the `dealNatureDescription` filter
3. **Price outliers**: Drop rows where `dealAmount < 100000` (likely parking/storage that slipped through)
4. **Size outliers**: Drop rows where `assetArea < 15` or `assetArea > 500`
5. **City validation**: Only keep rows where `cityNameEng` matches a name in the `cities` table
6. **Deduplicate by `dealId`**: Keep first occurrence only
7. **Missing address**: If `streetNameEng` is empty, use `gushNum-parcelNum` as address fallback

**Known data quality handling (per Tax Authority flaws):**
- `year_built = 1900` → set to `null`
- `floor = 0` where rows = 0 → set floor to `null`
- Size discrepancies can't be detected in a single import, but the `unique_transaction` constraint prevents true duplicates

**Progress UI**: Show real-time counts — total rows, filtered out (with breakdown), valid rows, upload progress by batch (500/batch).

### Step 3: Geocoding

After import, trigger the existing `geocode-sold-transaction` edge function in batches. The admin page will show a "Geocode All" button that processes city-by-city using the existing function (which already handles Google Maps → Nominatim fallback).

No new geocoding infrastructure needed — reuse existing.

### Step 4: DB Migration

Add a `deal_id` column to `sold_transactions` for GovMap deduplication:
```sql
ALTER TABLE sold_transactions ADD COLUMN IF NOT EXISTS deal_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sold_transactions_deal_id ON sold_transactions(deal_id) WHERE deal_id IS NOT NULL;
```

This prevents re-importing the same GovMap transaction even if address formatting varies slightly.

### Files

| File | Action |
|---|---|
| `supabase/functions/import-govmap-data/index.ts` | New edge function |
| `src/pages/admin/ImportGovMapData.tsx` | New admin page |
| `src/App.tsx` | Add route `/admin/import-govmap` |
| DB migration | Add `deal_id` column + unique index |

### What Gets Excluded (estimated ~5-8k rows)
- Parking (`חניה`), storage (`מחסן`), land (`קרקע`), offices, shops
- Transactions under ₪100k
- Units under 15 sqm or over 500 sqm
- Cities not in the 25-city whitelist (shouldn't be any based on CSV)

**Expected clean rows**: ~20-22k residential transactions to add.

