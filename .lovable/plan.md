
# Buy vs Rent Category Toggle for Agent & Agency Pages

## Summary
Add a **Buy | Rent** toggle to agent and agency profile pages. When toggled, all stats, tab labels, and listing grids update to show only sales or rentals data. The design stays clean by reusing existing toggle patterns from the map page.

---

## Current Issues

| Problem | Impact |
|---------|--------|
| Stats mix sales + rentals | "Median Price" shows $500K sales mixed with ₪3K rentals |
| "Active Listings" combines all types | Can't see sales vs rental track record |
| "Past Listings" says "No past sales" | Confusing when agent has rented units |
| Tab labels are static | "For Sale" tab doesn't exist for rental-focused agents |

---

## Solution: Category-Aware Pages

### Design Concept

```text
┌─────────────────────────────────────────────────────────────┐
│  [Agent Hero Card]                                          │
│                                                              │
│  ╔═══════════════╗  ╔═══════════════╗  ╔═══════════════╗   │
│  ║  Active: 12   ║  ║ Median: ₪2.1M ║  ║ Days: 45      ║   │
│  ╚═══════════════╝  ╚═══════════════╝  ╚═══════════════╝   │
│                                                              │
│  ┌──────────────────┐                                        │
│  │ [Buy] [Rent]     │  ← Category Toggle                    │
│  └──────────────────┘                                        │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ For Sale (5)  |  Sold (8)  |  Blog (3)                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  [Property Cards Grid...]                                   │
└─────────────────────────────────────────────────────────────┘
```

**Toggle "Rent":**
- Stats recalculate for rentals only
- Tabs change to: **For Rent (7) | Rented (2) | Blog (3)**
- Grid shows only rental properties

---

## Part 1: Update Hooks to Accept Category Parameter

### useAgentListings (src/hooks/useAgent.tsx)

Add category filter to the listings query:

```typescript
export function useAgentListings(
  agentId: string, 
  status: 'active' | 'past',
  category: 'buy' | 'rent' = 'buy'  // NEW PARAM
) {
  return useQuery({
    queryKey: ['agent-listings', agentId, status, category],
    queryFn: async () => {
      // Map category + status to listing_status values
      const statusFilter = category === 'buy'
        ? (status === 'active' ? ['for_sale'] : ['sold'])
        : (status === 'active' ? ['for_rent'] : ['rented']);
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('agent_id', agentId)
        .in('listing_status', statusFilter)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!agentId,
  });
}
```

### useAgentStats (src/hooks/useAgent.tsx)

Add category filter to stats calculation:

```typescript
export function useAgentStats(agentId: string, category: 'buy' | 'rent' = 'buy') {
  return useQuery({
    queryKey: ['agent-stats', agentId, category],
    queryFn: async () => {
      const activeStatus = category === 'buy' ? 'for_sale' : 'for_rent';
      const pastStatus = category === 'buy' ? 'sold' : 'rented';
      
      const { data: properties, error } = await supabase
        .from('properties')
        .select('price, listing_status, created_at')
        .eq('agent_id', agentId)
        .eq('is_published', true)
        .in('listing_status', [activeStatus, pastStatus]);
      
      // ... rest of median/days calculation (unchanged logic)
      
      return {
        activeListingsCount: activeListings.length,
        pastListingsCount: pastListings.length,
        medianPrice,
        avgDaysOnMarket,
      };
    },
    enabled: !!agentId,
  });
}
```

### useAgencyListings & useAgencyStats (src/hooks/useAgency.tsx)

Same pattern - add `category` parameter:

```typescript
export function useAgencyListings(
  agencyId: string | undefined, 
  status: 'active' | 'past',
  category: 'buy' | 'rent' = 'buy'
) {
  // Filter by for_sale/sold or for_rent/rented based on category
}

export function useAgencyStats(agencyId: string | undefined, category: 'buy' | 'rent' = 'buy') {
  // Calculate stats for selected category only
}
```

---

## Part 2: Create Reusable Category Toggle Component

Create a shared component that can be reused on both agent and agency pages:

### New: src/components/shared/CategoryToggle.tsx

```typescript
import { cn } from '@/lib/utils';
import { Home, Key } from 'lucide-react';

interface CategoryToggleProps {
  value: 'buy' | 'rent';
  onChange: (value: 'buy' | 'rent') => void;
  buyCount?: number;
  rentCount?: number;
  className?: string;
}

export function CategoryToggle({ 
  value, 
  onChange, 
  buyCount, 
  rentCount,
  className 
}: CategoryToggleProps) {
  return (
    <div className={cn(
      "inline-flex items-center rounded-full border border-border/50 bg-muted/30 overflow-hidden",
      className
    )}>
      <button
        className={cn(
          "px-4 py-2 text-sm font-medium transition-all flex items-center gap-2",
          value === 'buy' 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onChange('buy')}
      >
        <Home className="h-4 w-4" />
        Buy
        {buyCount !== undefined && (
          <span className="text-xs opacity-80">({buyCount})</span>
        )}
      </button>
      <button
        className={cn(
          "px-4 py-2 text-sm font-medium transition-all flex items-center gap-2",
          value === 'rent' 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onChange('rent')}
      >
        <Key className="h-4 w-4" />
        Rent
        {rentCount !== undefined && (
          <span className="text-xs opacity-80">({rentCount})</span>
        )}
      </button>
    </div>
  );
}
```

---

## Part 3: Update AgentDetail.tsx

### Add State and Pass Category to Hooks

```typescript
export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<'buy' | 'rent'>('buy');
  
  const { data: agent, isLoading: agentLoading } = useAgent(id || '');
  
  // Pass category to all data hooks
  const { data: activeListings, isLoading: activeLoading } = useAgentListings(id || '', 'active', category);
  const { data: pastListings, isLoading: pastLoading } = useAgentListings(id || '', 'past', category);
  const { data: stats } = useAgentStats(id || '', category);
  
  // Also get total counts for toggle badges
  const { data: buyStats } = useAgentStats(id || '', 'buy');
  const { data: rentStats } = useAgentStats(id || '', 'rent');
  
  // ... rest of component
}
```

### Add Toggle Between Stats and Tabs

```tsx
{/* Stats Bar */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {/* ... existing stat cards ... */}
</div>

{/* Category Toggle */}
<div className="flex justify-center">
  <CategoryToggle
    value={category}
    onChange={setCategory}
    buyCount={(buyStats?.activeListingsCount ?? 0) + (buyStats?.pastListingsCount ?? 0)}
    rentCount={(rentStats?.activeListingsCount ?? 0) + (rentStats?.pastListingsCount ?? 0)}
  />
</div>

{/* Tabs - Now with dynamic labels */}
<Tabs defaultValue="active" className="space-y-6">
  <TabsList>
    <TabsTrigger value="active">
      {category === 'buy' ? 'For Sale' : 'For Rent'}
      <span className="ml-1.5 ...">{stats?.activeListingsCount ?? 0}</span>
    </TabsTrigger>
    <TabsTrigger value="past">
      {category === 'buy' ? 'Sold' : 'Rented'}
      <span className="ml-1.5 ...">{stats?.pastListingsCount ?? 0}</span>
    </TabsTrigger>
    <TabsTrigger value="blog">Blog</TabsTrigger>
  </TabsList>
  {/* ... tab content unchanged ... */}
</Tabs>
```

### Update Empty State Messages

```tsx
{/* Active tab empty state */}
<p className="text-muted-foreground">
  {category === 'buy' 
    ? 'No properties for sale at this time.'
    : 'No rentals available at this time.'
  }
</p>

{/* Past tab empty state */}
<p className="text-muted-foreground">
  {category === 'buy'
    ? 'No past sales recorded yet.'
    : 'No past rentals recorded yet.'
  }
</p>
```

---

## Part 4: Update AgencyDetail.tsx

Same pattern as AgentDetail:

```typescript
export default function AgencyDetail() {
  const [category, setCategory] = useState<'buy' | 'rent'>('buy');
  
  // Pass category to hooks
  const { data: activeListings } = useAgencyListings(agency?.id, 'active', category);
  const { data: pastListings } = useAgencyListings(agency?.id, 'past', category);
  const { data: stats } = useAgencyStats(agency?.id, category);
  
  // Get both stats for toggle badges
  const { data: buyStats } = useAgencyStats(agency?.id, 'buy');
  const { data: rentStats } = useAgencyStats(agency?.id, 'rent');
  
  // ... add CategoryToggle before Tabs
  // ... update tab labels dynamically
}
```

### Update "Our Team" Section (Optional Enhancement)

Show agents' listing counts filtered by category:

```tsx
<Badge variant="secondary" className="text-xs">
  {agent.activeListingsCount} {category === 'buy' ? 'for sale' : 'for rent'}
</Badge>
```

This would require updating `useAgencyAgents` to accept category param.

---

## Part 5: Update Stats Label for Rentals

The "Median Price" label doesn't make sense for rentals. Update dynamically:

```tsx
{/* Median Price Card */}
<Card>
  <CardContent className="p-4 text-center">
    <p className="text-2xl font-bold text-primary">
      {stats?.medianPrice ? formatPrice(stats.medianPrice, 'ILS') : '—'}
    </p>
    <p className="text-sm text-muted-foreground">
      {category === 'buy' ? 'Median Price' : 'Median Rent'}
    </p>
  </CardContent>
</Card>
```

---

## Summary of Files Changed

| File | Changes |
|------|---------|
| **src/components/shared/CategoryToggle.tsx** | NEW - Reusable Buy/Rent toggle component |
| **src/hooks/useAgent.tsx** | Add `category` param to `useAgentListings` and `useAgentStats` |
| **src/hooks/useAgency.tsx** | Add `category` param to `useAgencyListings`, `useAgencyStats`, optionally `useAgencyAgents` |
| **src/pages/AgentDetail.tsx** | Add state, CategoryToggle, dynamic tab labels, dynamic empty states |
| **src/pages/AgencyDetail.tsx** | Same changes as AgentDetail |

---

## User Experience Flow

**Visitor lands on agent page:**
1. Sees "Buy" selected by default
2. Stats show sales-only: "Median Price ₪2.1M", "12 Active" (for sale)
3. Tabs show: "For Sale (5) | Sold (8) | Blog"
4. Clicks "Rent" toggle
5. Stats update: "Median Rent ₪8,500", "7 Active" (for rent)
6. Tabs change: "For Rent (7) | Rented (2) | Blog"
7. Grid refreshes with only rental properties

**Agency page works identically**, with additional "Our Team" section showing filtered counts per agent.

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Agent has only sales, no rentals | Rent toggle shows (0), tabs show empty state |
| Agent has only rentals, no sales | Buy toggle shows (0), default could switch to rent if detected |
| Mixed agent with both | Both toggles show counts, user can switch freely |
| Stats calculation | Only calculates for selected category, no mixing |
| URL sharing | Could add `?category=rent` param for shareable links (optional enhancement) |

---

## Visual: Before vs After

**Before (current):**
```text
┌─────────────────────────────────────────────────┐
│  Active: 19  │  Median: ₪485K  │  Days: 67    │
│  (mixed!)    │  (mixed!)       │  (mixed!)    │
├─────────────────────────────────────────────────┤
│  Active Listings (19)  │  Past Listings (10)   │
│  [Mix of sales + rentals in same grid]         │
└─────────────────────────────────────────────────┘
```

**After (with toggle):**
```text
┌─────────────────────────────────────────────────┐
│  Active: 12  │  Median: ₪2.1M  │  Days: 45    │
│  (sales only)│  (sales only)   │  (sales only)│
├─────────────────────────────────────────────────┤
│           [Buy (20)] [Rent (9)]                 │
├─────────────────────────────────────────────────┤
│  For Sale (12)  │  Sold (8)  │  Blog (3)       │
│  [Only sales properties in grid]               │
└─────────────────────────────────────────────────┘
```
