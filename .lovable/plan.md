
## Add 2,500 Mock Properties - 50 Resale + 50 Rental Per City

### Current Situation
- 25 cities in your database
- Currently ~16 properties per city (608 total)
- 100 active agents linked to 10 agencies
- Need to add 50 resale + 50 rental per city = 2,500 new properties

### Implementation: New Edge Function

I'll create a new edge function `seed-additional-properties` that:

1. **Fetches existing agents** from the database (to assign properties realistically)
2. **Uses official cities** from the `cities` table (no hardcoding)
3. **Generates 100 properties per city** (50 for_sale + 50 for_rent)
4. **Scatters listing dates** across 0-90 days ago (not all "just listed")
5. **Varies property attributes realistically:**
   - Property types: apartments, penthouses, garden apartments, duplexes, houses, cottages
   - Bedrooms: 2-6 rooms based on property type
   - Sizes: 50-300 sqm based on type
   - Prices: City-specific multipliers with ±30% variance
   - Floors: Ground to 30th based on type
   - Conditions: new, renovated, good
   - Features: Random selection from balcony, storage, parking, elevator, sea_view, etc.

### Technical Details

**New File: `supabase/functions/seed-additional-properties/index.ts`**

```typescript
// Key features:
- Fetches all agent IDs from database
- Fetches all cities from database  
- For each city: generates 50 sale + 50 rent properties
- created_at is set randomly 0-90 days in the past
- Prices use city-specific multipliers (Tel Aviv 1.8x, Beer Sheva 0.55x, etc.)
- Rental prices: 4,000-25,000 NIS based on city and size
- Sale prices: 1.5M-15M NIS based on city and size
- Batch inserts of 100 at a time for performance
```

**Listing Age Distribution:**
- 15% Hot (0-3 days): "Just Listed"
- 25% Fresh (4-7 days)
- 40% Standard (8-30 days)
- 20% Older (31-90 days)

**Property Mix (per 50):**
- ~30 apartments (60%)
- ~8 garden apartments (16%)
- ~5 penthouses (10%)
- ~4 duplexes (8%)
- ~3 houses/cottages (6%)

**Rental-Specific Fields:**
- `lease_term`: 6_months, 12_months, 24_months, flexible
- `furnished_status`: fully, semi, unfurnished
- `pets_policy`: allowed, case_by_case, not_allowed
- `agent_fee_required`, `bank_guarantee_required`, `checks_required`

### After Implementation

To seed the new properties, you'll call the edge function:
```
POST /seed-additional-properties
```

This will add:
- 1,250 for_sale properties (50 × 25 cities)
- 1,250 for_rent properties (50 × 25 cities)
- **Total: 2,500 new properties**

### Files to Create
1. `supabase/functions/seed-additional-properties/index.ts` - New edge function for bulk property seeding

### Result
- Every city will have 66 resale + 66 rental properties (existing 16 + new 50)
- Properties will show realistic variety in listing age, price, size, features
- All properties linked to real agents in the database
- Map will display fuller, more realistic marketplace
