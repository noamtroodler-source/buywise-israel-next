

# Neighborhood Highlights Section for Market Environment Pages

## Overview

This feature adds a new section between the Quick Stats strip and Market Overview that showcases the key neighborhoods/communities within each city. The content will be curated to help Anglo buyers quickly understand the distinct areas within each city - focusing on what makes each area unique (community vibe, price tier, lifestyle) rather than technical boundary data.

## Design Concept

The section will use a horizontal scrollable chip/pill layout for cities with 2-3 neighborhoods, or a compact card grid for cities with 4-5 neighborhoods. This keeps the section lightweight and informative without overwhelming the page.

### Visual Layout (Desktop)

```text
+------------------------------------------------------------------+
| [map-pin icon] Neighborhoods in Ra'anana                         |
|------------------------------------------------------------------|
| +------------------+  +------------------+  +------------------+  |
| | KLR (Kikar       |  | Ramat Amidar     |  | Northern Ra'anana|  |
| | London)          |  +------------------+  +------------------+  |
| +------------------+  South African hub,    New developments,    |
| Anglo hub with         strong community     family-oriented,     |
| British/SA roots,      centered around      premium pricing      |
| high walkability       the park                                  |
+------------------------------------------------------------------+
```

### Mobile Layout

Horizontally scrollable cards that snap into place, allowing users to swipe through neighborhoods.

---

## Data Structure

### New Database Column

Add a new JSONB column `featured_neighborhoods` to the `cities` table to store curated neighborhood data separate from the tessellating boundary data:

```sql
ALTER TABLE cities ADD COLUMN featured_neighborhoods JSONB DEFAULT '[]'::jsonb;
```

### JSON Structure per Neighborhood

```json
{
  "name": "KLR (Kikar London)",
  "name_he": "ככר לונדון",
  "vibe": "Anglo hub",
  "description": "British and South African roots, high walkability, established community",
  "price_tier": "premium",
  "sort_order": 1
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name in English (can include local nickname) |
| `name_he` | string | Hebrew name |
| `vibe` | string | 2-4 word tagline (e.g., "Beachfront luxury", "Family-friendly Anglo hub") |
| `description` | string | 1-2 sentences explaining the character |
| `price_tier` | enum | "budget" | "mid-range" | "premium" | "ultra-premium" |
| `sort_order` | number | Display order (1 = first) |

---

## Neighborhood Content for 25 Cities

Based on the Anglo-focused platform strategy, here's the curated content:

### Cities with Clear Anglo Divisions

| City | Neighborhoods | Notes |
|------|---------------|-------|
| **Ra'anana** | 2-3 | KLR (Anglo hub), Northern Ra'anana (new builds), Merkaz |
| **Ramat Gan** | 2 | KLR (SA community), OLR (American community) |
| **Herzliya** | 2-3 | Herzliya Pituach (ultra-premium beachfront), Herzliya Merkaz, Nof Yam |
| **Netanya** | 3-4 | Ir Yamim (premium Anglo), Merkaz, Kiryat Nordau, South Netanya |
| **Jerusalem** | 4-5 | German Colony, Baka, Katamon, Rehavia, Old Katamon |
| **Modiin** | 3 | Buchman/Avnei HaChoshen (Anglo families), Merkaz, Modi'in Illit border |
| **Beit Shemesh** | 3-4 | RBS Alef (Anglo hub), RBS Bet, Old Beit Shemesh, Sheinfeld |

### Major Cities

| City | Neighborhoods | Notes |
|------|---------------|-------|
| **Tel Aviv** | 4-5 | Old North, Neve Tzedek, Florentin, Ramat Aviv, Kerem HaTeimanim |
| **Haifa** | 3 | Carmel Center, German Colony, Ahuza |
| **Beer Sheva** | 2-3 | Old City, Ramot, Neve Ze'ev |

### Smaller/Focused Cities

| City | Neighborhoods | Notes |
|------|---------------|-------|
| **Kfar Saba** | 2 | Green Kfar Saba, Merkaz |
| **Hod HaSharon** | 2 | Magdiel, Neve Neeman |
| **Givatayim** | 2 | Borochov, Ramat Givatayim |
| **Petah Tikva** | 2-3 | Em HaMoshavot, Kfar Ganim, Neve Oz |
| **Ashdod** | 2-3 | City Center, Tet-Zayin (17), Alef-Bet areas |
| **Ashkelon** | 2 | Afridar, Barnea |

### Smaller Towns (2 neighborhoods max)

| City | Approach |
|------|----------|
| **Caesarea** | Caesarea Park (luxury), Ohr Akiva adjacent |
| **Shoham** | Unified character - may skip or show 1 entry |
| **Givat Shmuel** | Small city - 1-2 entries max |
| **Efrat, Ma'ale Adumim, Givat Ze'ev** | Settlement context - 2 neighborhoods each |

---

## Component Architecture

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/city/CityNeighborhoodHighlights.tsx` | Main display component |
| `src/hooks/useCityNeighborhoods.tsx` | Hook to fetch featured_neighborhoods |

### Component Props

```tsx
interface NeighborhoodHighlight {
  name: string;
  name_he?: string;
  vibe: string;
  description: string;
  price_tier: 'budget' | 'mid-range' | 'premium' | 'ultra-premium';
  sort_order: number;
}

interface CityNeighborhoodHighlightsProps {
  cityName: string;
  neighborhoods: NeighborhoodHighlight[];
}
```

### Design Specifications

**Container:**
- Full-width section with `py-10 bg-muted/30` for subtle visual separation
- Section header with MapPin icon and "Neighborhoods in {cityName}"

**Cards:**
- Horizontal layout for 2-3 items, grid for 4-5
- Each card shows:
  - Name (bold)
  - Vibe tagline (small, primary color)
  - Description (muted text)
  - Price tier badge (subtle pill)

**Price Tier Badges:**
- Budget: Green pill
- Mid-range: Blue pill  
- Premium: Gold/amber pill
- Ultra-premium: Purple pill

**Responsive Behavior:**
- Mobile: Horizontal scroll with snap-to-center
- Desktop: Flex wrap or CSS grid based on count

---

## Integration into AreaDetail.tsx

Add the new section between Quick Stats and Market Overview:

```tsx
{/* 2. Quick Stats Strip */}
{!marketLoading && (
  <CityQuickStats ... />
)}

{/* NEW: 2.5. Neighborhood Highlights */}
{cityNeighborhoods.length > 0 && (
  <CityNeighborhoodHighlights 
    cityName={city.name}
    neighborhoods={cityNeighborhoods}
  />
)}

{/* 3. Market Overview */}
<section id="market">
  <MarketOverviewCards ... />
</section>
```

---

## Database Migration

```sql
-- Add featured_neighborhoods column for curated neighborhood content
ALTER TABLE cities 
ADD COLUMN featured_neighborhoods JSONB DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN cities.featured_neighborhoods IS 
  'Curated neighborhood highlights for Market Environment pages. Separate from boundary tessellation data.';
```

---

## Data Population Strategy

### Option 1: Manual SQL Insert (Recommended for initial launch)

Prepare SQL statements for each city with accurate, well-researched content:

```sql
UPDATE cities 
SET featured_neighborhoods = '[
  {"name": "KLR (Kikar London)", "name_he": "ככר לונדון", "vibe": "Anglo hub", "description": "British and South African roots with high walkability. The heart of the English-speaking community.", "price_tier": "premium", "sort_order": 1},
  {"name": "Northern Ra''anana", "name_he": "צפון רעננה", "vibe": "New developments", "description": "Modern construction with larger apartments. Popular with young families seeking newer builds.", "price_tier": "premium", "sort_order": 2}
]'::jsonb
WHERE slug = 'raanana';
```

### Option 2: Admin Interface (Future Enhancement)

Add a simple admin form at `/admin/city-neighborhoods` to manage this content through the UI.

---

## Summary of Changes

| Action | File/Table |
|--------|------------|
| Create component | `src/components/city/CityNeighborhoodHighlights.tsx` |
| Create hook | `src/hooks/useCityNeighborhoods.tsx` |
| Update type | `src/types/content.ts` (add `FeaturedNeighborhood` interface) |
| Integrate | `src/pages/AreaDetail.tsx` |
| Add column | `cities.featured_neighborhoods` (JSONB) |
| Populate data | SQL updates for all 25 cities |

### Implementation Order

1. Database migration (add column)
2. Create TypeScript types
3. Create data hook
4. Build display component
5. Integrate into AreaDetail page
6. Populate initial data for 3-5 pilot cities (Ra'anana, Herzliya, Jerusalem, Netanya, Ramat Gan)
7. Iterate on design based on feedback
8. Complete data for remaining 20 cities

---

## Content Research Notes

For the actual neighborhood descriptions, the content will be researched to include:
- **Anglo relevance**: Which areas have established English-speaking communities
- **Price positioning**: Relative affordability within the city
- **Lifestyle fit**: Family-friendly vs. young professionals, religious vs. secular, etc.
- **Notable landmarks**: Key streets, parks, or community centers that define the area

This creates valuable, differentiated content that helps Anglo buyers understand where they might want to focus their search within each city.

