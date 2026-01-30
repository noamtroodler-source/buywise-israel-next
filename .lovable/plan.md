
## Complete Mobile Redesign of Compare Pages

### Current Problems (Visible in Screenshots)

1. **Overlapping Text in Comparison Tables** - The CSS Grid layout with fixed `minmax(120px, 160px)` label column causes values to overlap when comparing 3 properties on mobile
2. **Price values running together** - "₪5,400,000₪2,083,742₪..." are overlapping
3. **Cramped layout** - The table tries to fit all 3 properties side-by-side on a 375px screen
4. **No mobile-optimized design** - Same desktop table layout used on all devices

---

### Solution: Mobile-First Comparison Layout

**On Mobile (<768px):** Switch from side-by-side table to a **stacked card approach** where each metric shows all properties vertically. This is a proven pattern used by major comparison tools (Google Shopping, etc.)

**Desktop (>=768px):** Keep the existing side-by-side table layout

---

### Visual Design (Mobile)

```text
┌─────────────────────────────────────┐
│ 🏠 Core Details                     │
├─────────────────────────────────────┤
│                                     │
│ Price                               │
│ ┌─────────────────────────────────┐ │
│ │ 🏆 Property 1        ₪2,083,742 │ │
│ │    Property 2        ₪5,400,000 │ │
│ │    Property 3        ₪4,500,000 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Size                                │
│ ┌─────────────────────────────────┐ │
│ │ 🏆 Property 3             236m² │ │
│ │    Property 2             106m² │ │
│ │    Property 1              81m² │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Bedrooms                            │
│ ┌─────────────────────────────────┐ │
│ │ 🏆 Property 3                 6 │ │
│ │    Property 2                 4 │ │
│ │    Property 1                 3 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Key Features:**
- Each metric is a full-width row
- Properties are listed vertically under each metric
- Winner is highlighted with a badge/accent
- Clear, readable spacing with no overlap

---

## Technical Implementation

### File 1: `src/components/compare/CompareSection.tsx`

**Changes:**
1. Add `useIsMobile` hook
2. Create two render paths:
   - **Mobile**: Stacked vertical cards per metric
   - **Desktop**: Keep existing CSS Grid table

**Mobile Layout Structure:**
```tsx
{isMobile ? (
  <div className="divide-y divide-border">
    {rows.map((row) => (
      <div className="py-4 px-4 space-y-2">
        {/* Metric Label */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {row.icon && <row.icon className="h-4 w-4" />}
          <span>{row.label}</span>
          {row.tooltip && <HelpCircle />}
        </div>
        
        {/* Property Values - Stacked */}
        <div className="space-y-2">
          {properties.map((property) => (
            <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
              <span className="text-sm font-medium truncate max-w-[50%]">
                {property.title || property.name}
              </span>
              <span className={cn(
                "text-sm font-semibold",
                isBest && "text-primary"
              )}>
                {row.getValue(property)}
              </span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
) : (
  // Existing desktop grid layout
)}
```

---

### File 2: `src/components/compare/CompareQuickInsights.tsx`

**Changes:**
- Make grid responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Each insight card takes full width on mobile

---

### File 3: `src/components/compare/ComparePropertyCard.tsx` & `CompareProjectCard.tsx`

**Mobile Optimizations:**
- Cards are already responsive with `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- No major changes needed, just ensure proper spacing

---

### File 4: `src/components/compare/CompareHero.tsx`

**Changes:**
- Stack action buttons vertically on mobile
- Reduce padding
- Keep title and subtitle readable

---

### File 5: `src/components/compare/CompareWinnerSummary.tsx`

**Changes:**
- Ensure winner pills wrap properly on mobile
- Stack CTA buttons vertically on mobile (already done with `flex-col sm:flex-row`)

---

### File 6: `src/pages/Compare.tsx` & `CompareProjects.tsx`

**Changes:**
- Reduce container padding on mobile (`py-4 md:py-8`)
- Reduce gap between sections (`space-y-4 md:space-y-8`)

---

## Summary of Key Changes

| Component | Mobile Change |
|-----------|---------------|
| `CompareSection` | Switch from horizontal grid to vertical stacked cards per metric |
| `CompareQuickInsights` | Single column layout |
| `CompareHero` | Stack actions, reduce padding |
| `CompareWinnerSummary` | Already responsive, minor spacing tweaks |
| `Compare.tsx` | Reduce spacing on mobile |
| `CompareProjects.tsx` | Reduce spacing on mobile |

---

## Files to Modify

1. `src/components/compare/CompareSection.tsx` - Main layout transformation
2. `src/components/compare/CompareQuickInsights.tsx` - Grid responsiveness
3. `src/components/compare/CompareHero.tsx` - Hero spacing
4. `src/pages/Compare.tsx` - Page spacing
5. `src/pages/CompareProjects.tsx` - Page spacing (same treatment)
