
# Sold Transactions Data Integration Plan

## Overview

This plan implements a comprehensive sold real estate transaction data system for BuyWise Israel, pulling data from Nadlan.gov.il and Israel Tax Authority sources. The system will enable "Recent Nearby Sales" on listing pages, validate existing market data, and geocode all transactions for proximity-based matching.

---

## Phase 1: Database Schema

### 1.1 Create `sold_transactions` Table

A new table to store official government transaction data:

```sql
CREATE TABLE public.sold_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core transaction data
  sold_price NUMERIC NOT NULL,
  sold_date DATE NOT NULL,
  
  -- Property details
  property_type TEXT, -- apartment, house, duplex, etc.
  rooms NUMERIC,
  size_sqm NUMERIC,
  floor INTEGER,
  year_built INTEGER,
  asset_condition TEXT, -- new, renovated, old
  is_new_construction BOOLEAN DEFAULT FALSE,
  
  -- Location
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  gush_helka TEXT, -- Israeli parcel ID
  
  -- Calculated fields
  price_per_sqm NUMERIC GENERATED ALWAYS AS (
    CASE WHEN size_sqm > 0 THEN sold_price / size_sqm ELSE NULL END
  ) STORED,
  
  -- Metadata
  source TEXT NOT NULL, -- 'nadlan_gov_il' | 'israel_tax_authority'
  raw_data JSONB, -- Original record for audit trail
  geocoded_at TIMESTAMP WITH TIME ZONE,
  geocode_source TEXT, -- 'google_maps' | 'nominatim' | 'manual'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Prevent duplicates
  CONSTRAINT unique_transaction UNIQUE (address, city, sold_date, sold_price)
);

-- Indexes for efficient querying
CREATE INDEX idx_sold_transactions_city ON sold_transactions(city);
CREATE INDEX idx_sold_transactions_sold_date ON sold_transactions(sold_date DESC);
CREATE INDEX idx_sold_transactions_location ON sold_transactions(latitude, longitude);
CREATE INDEX idx_sold_transactions_rooms ON sold_transactions(rooms);
CREATE INDEX idx_sold_transactions_property_type ON sold_transactions(property_type);
CREATE INDEX idx_sold_transactions_price_sqm ON sold_transactions(price_per_sqm);

-- For geospatial queries (nearby sales)
CREATE INDEX idx_sold_transactions_geo ON sold_transactions 
  USING gist (point(longitude, latitude));
```

### 1.2 Create `sold_data_imports` Table (Import Audit Trail)

Track batch imports for data quality management:

```sql
CREATE TABLE public.sold_data_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  source TEXT NOT NULL,
  records_imported INTEGER DEFAULT 0,
  records_geocoded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  date_range_start DATE,
  date_range_end DATE,
  imported_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 1.3 RLS Policies

```sql
-- Public read access (transaction data is public information)
ALTER TABLE sold_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sold transactions" 
  ON sold_transactions FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage sold transactions" 
  ON sold_transactions FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- Same for import logs
ALTER TABLE sold_data_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view import logs" 
  ON sold_data_imports FOR SELECT USING (true);

CREATE POLICY "Admins can manage import logs" 
  ON sold_data_imports FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));
```

---

## Phase 2: Geocoding Infrastructure

### 2.1 New Edge Function: `geocode-sold-transaction`

Enhance the existing geocoding approach for batch processing sold transactions:

**File:** `supabase/functions/geocode-sold-transaction/index.ts`

Key features:
- Batch geocoding support (process multiple addresses)
- Google Maps API primary (for accuracy), Nominatim fallback
- Rate limiting to respect API quotas
- Save geocoding results back to database
- Track geocoding source and timestamp

```typescript
// Pseudocode structure
interface TransactionToGeocode {
  id: string;
  address: string;
  city: string;
  neighborhood?: string;
}

// Try Google Maps first, then Nominatim
async function geocodeTransaction(txn: TransactionToGeocode) {
  // 1. Try Google Maps Geocoding API (requires GOOGLE_MAPS_API_KEY secret)
  // 2. Fallback to Nominatim (free, already implemented)
  // 3. Update sold_transactions with lat/lng
}
```

### 2.2 Add GOOGLE_MAPS_API_KEY Secret

The geocoding edge function will need the Google Maps API key for server-side geocoding. This provides better accuracy for Israeli addresses than Nominatim.

---

## Phase 3: Data Import Edge Function

### 3.1 New Edge Function: `import-sold-transactions`

**File:** `supabase/functions/import-sold-transactions/index.ts`

Admin-only function to import sold transaction data in batches:

```typescript
interface ImportRequest {
  city: string;
  transactions: SoldTransaction[];
  source: 'nadlan_gov_il' | 'israel_tax_authority';
  autoGeocode?: boolean;
}

// Process flow:
// 1. Validate incoming data
// 2. Normalize addresses and property types
// 3. Insert into sold_transactions (upsert to handle duplicates)
// 4. Optionally trigger geocoding for new records
// 5. Log import to sold_data_imports
// 6. Return summary (inserted, updated, failed counts)
```

### 3.2 Data Normalization

- Map Hebrew property types to English enum values
- Standardize city names (match against `cities` table)
- Clean addresses for consistent geocoding
- Calculate derived fields (price_per_sqm is automatic via GENERATED column)

---

## Phase 4: Nearby Sales Component

### 4.1 New Hook: `useNearbySoldComps`

**File:** `src/hooks/useNearbySoldComps.ts`

```typescript
interface NearbySoldComp {
  id: string;
  sold_price: number;
  sold_date: string;
  rooms: number;
  size_sqm: number;
  property_type: string;
  distance_meters: number;
  price_per_sqm: number;
  is_same_building: boolean; // distance < 20m
}

export function useNearbySoldComps(
  latitude: number | null,
  longitude: number | null,
  city: string,
  options?: {
    radiusMeters?: number; // default 500m
    minRooms?: number;
    maxRooms?: number;
    monthsBack?: number; // default 24
    limit?: number; // default 5
  }
) {
  // Query sold_transactions using PostGIS-style distance calculation
  // Order by distance, filter by date range
  // Return closest matching comps
}
```

### 4.2 Database Function for Distance Calculation

```sql
CREATE OR REPLACE FUNCTION get_nearby_sold_comps(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_city TEXT,
  p_radius_km NUMERIC DEFAULT 0.5,
  p_months_back INTEGER DEFAULT 24,
  p_limit INTEGER DEFAULT 5,
  p_min_rooms INTEGER DEFAULT NULL,
  p_max_rooms INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  sold_price NUMERIC,
  sold_date DATE,
  rooms NUMERIC,
  size_sqm NUMERIC,
  property_type TEXT,
  price_per_sqm NUMERIC,
  distance_meters NUMERIC,
  is_same_building BOOLEAN
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    st.id,
    st.sold_price,
    st.sold_date,
    st.rooms,
    st.size_sqm,
    st.property_type,
    st.price_per_sqm,
    -- Haversine formula for distance in meters
    (6371000 * acos(
      cos(radians(p_lat)) * cos(radians(st.latitude)) *
      cos(radians(st.longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(st.latitude))
    )) as distance_meters,
    -- Same building = within 20 meters
    (6371000 * acos(
      cos(radians(p_lat)) * cos(radians(st.latitude)) *
      cos(radians(st.longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(st.latitude))
    )) < 20 as is_same_building
  FROM sold_transactions st
  WHERE 
    st.city = p_city
    AND st.latitude IS NOT NULL
    AND st.longitude IS NOT NULL
    AND st.sold_date >= (CURRENT_DATE - (p_months_back || ' months')::interval)
    AND (p_min_rooms IS NULL OR st.rooms >= p_min_rooms)
    AND (p_max_rooms IS NULL OR st.rooms <= p_max_rooms)
    -- Pre-filter by bounding box for performance
    AND st.latitude BETWEEN (p_lat - p_radius_km/111) AND (p_lat + p_radius_km/111)
    AND st.longitude BETWEEN (p_lng - p_radius_km/85) AND (p_lng + p_radius_km/85)
  ORDER BY distance_meters ASC
  LIMIT p_limit;
$$;
```

### 4.3 New Component: `RecentNearbySales`

**File:** `src/components/property/RecentNearbySales.tsx`

```text
┌─────────────────────────────────────────────────┐
│ 📍 Recent Nearby Sales                          │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ 🏠 3BR, 90m² sold for ₪2,480,000           │ │
│ │    120m away • Jun 2024                     │ │
│ │    ₪27,556/m²                              │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🏠 3BR, 85m² sold for ₪2,390,000           │ │
│ │    Same building • Apr 2024                 │ │
│ │    ₪28,118/m²                              │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [View all sales in area →]                      │
└─────────────────────────────────────────────────┘
```

Features:
- Displays 3-5 closest sold comps
- Highlights "Same building" matches
- Shows distance, sold date, price/m²
- Empty state if no data available
- Loading skeleton while fetching

---

## Phase 5: PropertyDetail Integration

### 5.1 Update PropertyDetail.tsx

Add the new `RecentNearbySales` component between Value Snapshot and Cost Breakdown:

```tsx
{/* After PropertyValueSnapshot */}
{property.latitude && property.longitude && (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.15 }}
    className="py-6 border-b border-border"
  >
    <RecentNearbySales
      latitude={property.latitude}
      longitude={property.longitude}
      city={property.city}
      propertyRooms={property.bedrooms}
      propertyPrice={property.price}
      propertySizeSqm={property.size_sqm}
    />
  </motion.div>
)}
```

---

## Phase 6: Market Data Validation

### 6.1 New Hook: `useSoldDataAggregates`

Calculate aggregates from sold transactions for comparison with existing market data:

```typescript
export function useSoldDataAggregates(city: string, year?: number) {
  // Query sold_transactions
  // Calculate: avg price/sqm, median price, transaction count
  // Compare with city_canonical_metrics and market_data
  // Return discrepancy flags if data differs significantly
}
```

### 6.2 Admin Dashboard Widget

**File:** `src/components/admin/SoldDataHealthWidget.tsx`

Display comparison between sold transaction aggregates and existing market data:

```text
┌──────────────────────────────────────────────────┐
│ Sold Data vs Market Data - Tel Aviv             │
├──────────────────────────────────────────────────┤
│ Metric          Sold Data    Market Data   Diff │
│ Avg ₪/m²       68,450       68,297        +0.2% │
│ Transactions   1,247         -             -     │
│ Coverage       Jun 2023 - Jan 2025              │
├──────────────────────────────────────────────────┤
│ ⚠️ 3 cities need market data update             │
│    [View Details]                                │
└──────────────────────────────────────────────────┘
```

---

## Phase 7: Admin Import Interface

### 7.1 New Admin Page: `SoldTransactionsAdmin`

**File:** `src/pages/admin/SoldTransactionsAdmin.tsx`

Features:
- Upload CSV/JSON file with sold transactions
- Select city and source
- Preview data before import
- Trigger batch geocoding
- View import history
- Browse/search existing transactions

---

## Implementation Files Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/geocode-sold-transaction/index.ts` | Batch geocoding for sold transactions |
| `supabase/functions/import-sold-transactions/index.ts` | Data import endpoint |
| `src/hooks/useNearbySoldComps.ts` | Fetch nearby sold comps |
| `src/hooks/useSoldDataAggregates.ts` | Market data validation |
| `src/components/property/RecentNearbySales.tsx` | Display nearby sales on listings |
| `src/components/admin/SoldDataHealthWidget.tsx` | Admin validation widget |
| `src/pages/admin/SoldTransactionsAdmin.tsx` | Admin import/management page |
| `src/types/soldTransactions.ts` | TypeScript types |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/PropertyDetail.tsx` | Add RecentNearbySales component |
| `src/pages/admin/AdminDashboard.tsx` | Add link to sold transactions admin |
| Database | New tables, functions, and RLS policies |

---

## Database Migration Summary

1. Create `sold_transactions` table with indexes
2. Create `sold_data_imports` table
3. Add RLS policies for both tables
4. Create `get_nearby_sold_comps` database function

---

## Secrets Required

- **GOOGLE_MAPS_API_KEY**: For accurate server-side geocoding (recommended for Israeli addresses)
  - Alternatively, can use Nominatim (already implemented, free but less accurate)

---

## Data Flow

```text
┌─────────────────┐     ┌──────────────────────┐
│ Nadlan.gov.il   │────▶│ Admin Import Page    │
│ Tax Authority   │     │ (CSV/JSON upload)    │
└─────────────────┘     └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ import-sold-         │
                        │ transactions         │
                        │ (Edge Function)      │
                        └──────────┬───────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
         ┌────────────────┐ ┌───────────┐ ┌─────────────┐
         │ sold_          │ │ geocode-  │ │ sold_data_  │
         │ transactions   │ │ sold-     │ │ imports     │
         │ (Table)        │ │ transaction│ │ (Audit)     │
         └────────────────┘ └───────────┘ └─────────────┘
                    │
                    ▼
         ┌────────────────────────────┐
         │ get_nearby_sold_comps()   │
         │ (Database Function)        │
         └──────────────┬─────────────┘
                        │
                        ▼
         ┌────────────────────────────┐
         │ useNearbySoldComps Hook   │
         └──────────────┬─────────────┘
                        │
                        ▼
         ┌────────────────────────────┐
         │ RecentNearbySales         │
         │ Component                  │
         └────────────────────────────┘
```

---

## Testing Checklist

1. **Database**
   - Verify table creation and indexes
   - Test RLS policies (public read, admin write)
   - Test `get_nearby_sold_comps` function

2. **Edge Functions**
   - Test import with sample data (5 cities)
   - Test geocoding success rate
   - Verify error handling for invalid data

3. **Frontend**
   - RecentNearbySales displays correctly
   - Empty state when no comps available
   - Loading states work properly
   - Mobile responsive layout

4. **Integration**
   - PropertyDetail shows nearby sales
   - Admin can import and manage data
   - Market data validation flags discrepancies

---

## Success Metrics

- 90%+ geocoding success rate for transactions with street addresses
- "Recent Nearby Sales" visible on 80%+ of listings with coordinates
- Import processing under 5 seconds for batches of 100 transactions
- Zero console errors in production
