
# Hero Trust Indicators: Category Breakdown

## Summary

Replace the generic trust indicators with a category-specific breakdown showing active inventory across Rentals, Homes for Sale, and New Projects. This gives users immediate visibility into what's available on BuyWise.

---

## Current vs New

| Current | New |
|---------|-----|
| 25 Cities | 65+ For Sale |
| 102+ Listings | 20+ Rentals |
| 9 Free Tools | 15 Projects |

---

## Design

```text
┌─────────────────────────────────────────────────────────┐
│  🏠 65+ For Sale   🔑 20+ Rentals   🏗️ 15 Projects     │
└─────────────────────────────────────────────────────────┘
```

**Styling:**
- Small icons (14px) in accent color for visual interest
- Text in `text-white/70` for readability on hero background
- Rounded numbers with "+" suffix for flexibility (65+, 20+, 15)
- Same horizontal layout, same animation

---

## Implementation

### 1. Update usePlatformStats Hook

**File:** `src/hooks/usePlatformStats.tsx`

Replace the current queries with category-specific counts:

```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const [forSaleRes, rentalsRes, projectsRes] = await Promise.all([
        supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true)
          .eq('listing_status', 'for_sale'),
        supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true)
          .eq('listing_status', 'for_rent'),
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true)
      ]);
      
      return {
        forSaleCount: forSaleRes.count || 0,
        rentalsCount: rentalsRes.count || 0,
        projectsCount: projectsRes.count || 0
      };
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}
```

### 2. Update HeroSplit Component

**File:** `src/components/home/HeroSplit.tsx`

Update the trust indicators section (around lines 127-145):

```tsx
import { Home, Key, Building2 } from 'lucide-react';

// Helper to round down to nearest 5 for cleaner display
const roundToFive = (n: number) => Math.floor(n / 5) * 5;

// In the component:
{/* Trust Indicators */}
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.6, delay: 0.5 }}
  className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-white/70"
>
  <span className="flex items-center gap-2">
    <Home className="w-3.5 h-3.5 text-accent" />
    {stats?.forSaleCount ? `${roundToFive(stats.forSaleCount)}+` : '65+'} For Sale
  </span>
  <span className="flex items-center gap-2">
    <Key className="w-3.5 h-3.5 text-accent" />
    {stats?.rentalsCount ? `${roundToFive(stats.rentalsCount)}+` : '20+'} Rentals
  </span>
  <span className="flex items-center gap-2">
    <Building2 className="w-3.5 h-3.5 text-accent" />
    {stats?.projectsCount ?? 15} Projects
  </span>
</motion.div>
```

### 3. Update TrustStrip Component (Optional)

**File:** `src/components/home/TrustStrip.tsx`

If you want consistency, update this component to also show the category breakdown. However, this section currently shows different stats (Cities, Tools, Independent, Built by Internationals), so it may make sense to keep it as differentiated content.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/usePlatformStats.tsx` | Query for sale, rental, and project counts instead of total properties/cities |
| `src/components/home/HeroSplit.tsx` | Update trust indicators to show category breakdown with icons |

---

## Current Database Counts

| Category | Count |
|----------|-------|
| For Sale | 68 |
| Rentals | 21 |
| Projects | 15 |

**Display as:** `65+ For Sale`, `20+ Rentals`, `15 Projects`

---

## Result

Users landing on the homepage will immediately see what inventory is available in each category, setting clear expectations and inviting them to explore the search they're interested in.
