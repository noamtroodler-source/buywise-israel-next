
# Clean Up Unauthorized City Listings

## The Problem
The mock data generator created listings for 6 cities that are NOT part of your official 25 market areas. These need to be removed to maintain data integrity.

## Cities to Remove (Not in Your 25)

| City | Properties | Projects | Total Listings |
|------|------------|----------|----------------|
| Bat Yam | 32 | 4 | 36 |
| Givatayim | 32 | 4 | 36 |
| Holon | 32 | 4 | 36 |
| Nahariya | 32 | 4 | 36 |
| Rehovot | 32 | 4 | 36 |
| Rishon LeZion | 32 | 4 | 36 |
| **TOTAL** | **192** | **24** | **216** |

## Action Plan

### Step 1: Delete Unauthorized Properties
```sql
DELETE FROM properties 
WHERE city IN ('Bat Yam', 'Givatayim', 'Holon', 'Nahariya', 'Rehovot', 'Rishon LeZion');
```

### Step 2: Delete Unauthorized Projects
```sql
DELETE FROM projects 
WHERE city IN ('Bat Yam', 'Givatayim', 'Holon', 'Nahariya', 'Rehovot', 'Rishon LeZion');
```

### Step 3: Update Seed Script for Future Prevention
Modify `supabase/functions/seed-demo-data/index.ts` to ONLY use cities from the official 25-city roster fetched from the database, preventing this from happening again.

## Technical Details

### Current Seed Script Issue
The seed script likely has a hardcoded city array that doesn't match the `cities` table. Will update it to:

```typescript
// Fetch official cities from database
const { data: officialCities } = await supabase
  .from('cities')
  .select('name');

const CITIES = officialCities.map(c => c.name);
```

### Result After Cleanup
- 192 unauthorized properties removed
- 24 unauthorized projects removed  
- Seed script updated to only use your official 25 cities
- Future mock data will always match your Areas pages
- AI Value Snapshot will work for all remaining properties (since they're all in cities with data)
