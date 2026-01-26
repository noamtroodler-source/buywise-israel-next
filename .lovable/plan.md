

# Improved Trust Indicator Graphics

## Current Issue

The current icons (`Home`, `Key`, `Building2`) are basic and don't feel premium enough against the hero background. The yellow accent color also makes them look a bit flat.

---

## Design Options

### Option A: Better Icon Choices (Recommended)

Replace with more descriptive, visually appealing icons:

| Current | New Icon | Why Better |
|---------|----------|------------|
| `Home` (house outline) | `House` or `MapPin` | More refined shape |
| `Key` (key shape) | `DoorOpen` or `KeyRound` | More modern feel |
| `Building2` (office block) | `Landmark` or `Building` | Cleaner silhouette |

**Recommended set:**
- **For Sale**: `House` - cleaner house icon
- **Rentals**: `KeyRound` - rounder, more modern key
- **Projects**: `Crane` or `HardHat` - conveys "new construction" better

### Option B: Pill/Badge Style

Wrap each stat in a subtle glass-morphism pill for more visual weight:

```text
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 🏠 65+ For Sale │  │ 🔑 20+ Rentals  │  │ 🏗️ 15 Projects │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Styling:**
- `bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5`
- Icons in white instead of yellow for cleaner look
- Subtle border: `border border-white/20`

### Option C: Text-Only with Accent Numbers (Minimal)

Remove icons entirely, make the numbers pop:

```text
65+ For Sale  •  20+ Rentals  •  15 Projects
```

With the numbers in accent color: `<span className="text-accent font-semibold">65+</span> For Sale`

---

## Recommended Approach: Option B (Pill Badges)

This gives the most visual improvement while keeping the icons. The glass-morphism style adds depth and feels more premium.

---

## Implementation

**File:** `src/components/home/HeroSplit.tsx` (lines 126-145)

### Icon Changes
Replace current icons with better alternatives:
- `Home` → `House` (cleaner residential feel)
- `Key` → `KeyRound` (more modern)
- `Building2` → `Crane` (conveys "new construction" better than office building)

### Style Changes
Wrap each stat in a pill badge with glass effect:

```tsx
{/* Trust Indicators */}
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.6, delay: 0.5 }}
  className="flex flex-wrap items-center gap-3 pt-2"
>
  <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 text-sm text-white">
    <House className="w-3.5 h-3.5" />
    <span className="font-medium">{stats?.forSaleCount ? `${Math.floor(stats.forSaleCount / 5) * 5}+` : '65+'}</span>
    <span className="text-white/70">For Sale</span>
  </span>
  <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 text-sm text-white">
    <KeyRound className="w-3.5 h-3.5" />
    <span className="font-medium">{stats?.rentalsCount ? `${Math.floor(stats.rentalsCount / 5) * 5}+` : '20+'}</span>
    <span className="text-white/70">Rentals</span>
  </span>
  <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 text-sm text-white">
    <Crane className="w-3.5 h-3.5" />
    <span className="font-medium">{stats?.projectsCount ?? 15}</span>
    <span className="text-white/70">Projects</span>
  </span>
</motion.div>
```

### Import Update
```tsx
import { Search, Building2, Home, Key, House, KeyRound, Crane } from 'lucide-react';
```

---

## Visual Comparison

**Before:**
```text
🏠 65+ For Sale   🔑 20+ Rentals   🏗️ 15 Projects
(yellow icons, plain text, flat appearance)
```

**After:**
```text
┌──────────────────┐ ┌─────────────────┐ ┌────────────────┐
│ 🏠 65+ For Sale  │ │ 🔑 20+ Rentals  │ │ 🏗️ 15 Projects │
└──────────────────┘ └─────────────────┘ └────────────────┘
(white icons, glass pills, premium feel)
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/home/HeroSplit.tsx` | Update icons (`House`, `KeyRound`, `Crane`) and add pill/badge styling with glass-morphism effect |

---

## Result

The trust indicators will have a more polished, premium appearance with:
- Better icon choices that more clearly represent each category
- Glass-morphism pill badges that add visual depth
- White icons instead of yellow for a cleaner look against the hero image
- Numbers emphasized with bold/medium weight

