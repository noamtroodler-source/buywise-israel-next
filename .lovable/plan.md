

## Improve Mobile Layout for Trust Indicator Pills

### Current Issue
The three trust indicator pills ("For Sale", "Rentals", "Projects") currently use `flex-wrap` which creates an awkward 2+1 layout on mobile where two pills are on the first row and one is left-aligned on the second row.

### Proposed Solution: Inverted Triangle Layout

Create a visually balanced **inverted triangle/pyramid layout** for mobile where:
- Row 1: "For Sale" and "Rentals" pills (side by side, centered)
- Row 2: "Projects" pill (centered below)

This creates a pleasing visual hierarchy and uses the available space more efficiently.

### Design Preview

```text
Mobile View:
    ┌──────────────┐ ┌──────────────┐
    │ 300+ For Sale│ │ 300+ Rentals │
    └──────────────┘ └──────────────┘
           ┌──────────────┐
           │ 76+ Projects │
           └──────────────┘

Desktop View (unchanged):
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 300+ For Sale│ │ 300+ Rentals │ │ 76+ Projects │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## Technical Implementation

### File to Modify
- `src/components/home/HeroSplit.tsx`

### Changes Required

**1. Restructure the trust indicators container (Lines 126-148)**

Replace the current `flex flex-wrap` layout with a responsive grid approach:

- **Mobile (default)**: Use a 2-column grid with the third item spanning both columns and centered
- **Desktop (sm+)**: Keep the original horizontal flex layout

**2. Updated Layout Structure**

```tsx
{/* Trust Indicators - Pyramid layout on mobile */}
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.6, delay: 0.5 }}
  className="pt-1 md:pt-2"
>
  {/* Mobile: 2-column grid with centered third item */}
  {/* Desktop: Horizontal flex row */}
  <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
    {/* Top row on mobile / inline on desktop */}
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {/* For Sale pill */}
      {/* Rentals pill */}
    </div>
    {/* Bottom centered on mobile / inline on desktop */}
    {/* Projects pill */}
  </div>
</motion.div>
```

**3. Keep all existing pill styling**
- Glass-morphism effect (`bg-white/10 backdrop-blur-sm border border-white/20`)
- Rounded pill shape (`rounded-full`)
- White text with icons
- Dynamic count display

### Visual Result
- On mobile: Clean pyramid/inverted triangle with "Projects" centered below the other two
- On desktop/tablet: No change - all three pills remain in a single horizontal row

