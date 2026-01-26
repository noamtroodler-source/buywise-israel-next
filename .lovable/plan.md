
# Rename "Pardes Hanna-Karkur" to "Pardes Hanna"

## Summary

The city is currently named "Pardes Hanna-Karkur" in multiple locations. You want to simplify it to just "Pardes Hanna" everywhere.

---

## Changes Required

### 1. Database Update
Update the city name in the `cities` table:

| Field | Current | New |
|-------|---------|-----|
| `name` | Pardes Hanna-Karkur | Pardes Hanna |
| `slug` | pardes-hanna | pardes-hanna *(no change)* |

### 2. Frontend Files

**File: `src/pages/Areas.tsx` (Line 100)**
- Change display name from "Pardes Hanna-Karkur" to "Pardes Hanna"
- Update description text from "Pardes Hanna-Karkur offers..." to "Pardes Hanna offers..."

**File: `src/lib/utils/cityMatcher.ts` (Line 41)**
- Change the main key from "Pardes Hanna-Karkur" to "Pardes Hanna"
- Keep aliases for backward compatibility (already includes "pardes hanna")

---

## What Stays the Same

- Slug remains `pardes-hanna` (already correct)
- Asset filenames remain `pardes-hanna.jpg` and `pardes-hanna-hero.jpg`
- All import statements remain unchanged
- District mapping already uses "Pardes Hanna"
- NeighborhoodMatch tool already uses "Pardes Hanna"

---

## Implementation Steps

1. Run database migration to update city name
2. Update `src/pages/Areas.tsx` - change display name and description
3. Update `src/lib/utils/cityMatcher.ts` - change the primary key

---

## Technical Details

```sql
-- Database migration
UPDATE cities SET name = 'Pardes Hanna' WHERE slug = 'pardes-hanna';
```

```typescript
// Areas.tsx line 100
{ name: 'Pardes Hanna', slug: 'pardes-hanna', image: pardesHannaImg, 
  description: 'Pardes Hanna offers quiet, affordable living in the north...', 
  tags: ['Quiet living', 'Value north'] },

// cityMatcher.ts line 41
"Pardes Hanna": ["pardes hanna", "pardes-hanna", "pardeshanna", "pardes hana", 
                 "pardeshana", "pardes hanna-karkur", "pardes hanna karkur"],
```

Note: Adding "pardes hanna-karkur" as an alias ensures anyone searching the old name still finds the city.
