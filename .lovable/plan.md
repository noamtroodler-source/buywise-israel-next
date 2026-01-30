

## Simplify Mobile Filters: City + Filters Only

### Current Issue
The mobile view shows three elements on the first row:
- Active/Sold toggle
- City dropdown  
- Filters button

This takes up significant horizontal space and the Active/Sold toggle isn't used as frequently.

### Proposed Solution
Streamline mobile to show only **City** and **Filters** buttons:
- Hide the Active/Sold toggle on mobile
- Default to "Active" listings
- Add the Active/Sold toggle **inside** the Mobile Filter Sheet so users can switch to Sold from there

```text
Current Mobile:
┌──────────────────────────────────────────┐
│ [Active|Sold] [📍 City ▾] [⚙ Filters]   │
│ [↕ Newest Listings ▾]              [🔔]  │
└──────────────────────────────────────────┘

Proposed Mobile:
┌──────────────────────────────────────────┐
│       [📍 City ▾]    [⚙ Filters]        │
│ [↕ Newest Listings ▾]              [🔔]  │
└──────────────────────────────────────────┘
```

---

## Technical Implementation

### Files to Modify

1. **`src/components/filters/PropertyFilters.tsx`**
2. **`src/components/filters/MobileFilterSheet.tsx`**

---

### Change 1: Hide Active/Sold Toggle on Mobile

**File:** `src/components/filters/PropertyFilters.tsx`

**Location:** Lines 277-302

Add `!isMobile` condition to the Active/Sold toggle render:

```tsx
{/* Active/Sold Toggle - Only shown on for_sale listings, DESKTOP ONLY */}
{showSoldToggle && !isMobile && (
  <div className="flex items-center rounded-full border border-border/60 ...">
    {/* Active and Sold buttons */}
  </div>
)}
```

---

### Change 2: Add Active/Sold Toggle to MobileFilterSheet

**File:** `src/components/filters/MobileFilterSheet.tsx`

**Props Update:** Add new props to receive sold toggle state and callback:

```tsx
interface MobileFilterSheetProps {
  // ... existing props
  showSoldToggle?: boolean;
  isSoldView?: boolean;
  onSoldToggle?: (sold: boolean) => void;
}
```

**UI Update:** Add a new "Listing Status" section at the top of the filter sheet (before Location):

```tsx
{/* Listing Status Section - Only for for_sale */}
{showSoldToggle && (
  <section className="space-y-3">
    <h3 className="font-semibold flex items-center gap-2">
      <Building2 className="h-4 w-4 text-primary" />
      Listing Status
    </h3>
    <div className="flex gap-2">
      <button
        className={cn(
          "flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
          !isSoldView 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted hover:bg-muted/80"
        )}
        onClick={() => onSoldToggle?.(false)}
      >
        Active Listings
      </button>
      <button
        className={cn(
          "flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
          isSoldView 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted hover:bg-muted/80"
        )}
        onClick={() => onSoldToggle?.(true)}
      >
        Sold Properties
      </button>
    </div>
  </section>
)}
```

---

### Change 3: Pass Props to MobileFilterSheet

**File:** `src/components/filters/PropertyFilters.tsx`

**Location:** Lines 1050-1061

Add the new props when rendering MobileFilterSheet:

```tsx
<MobileFilterSheet
  open={mobileFiltersOpen}
  onOpenChange={setMobileFiltersOpen}
  filters={filters}
  onFiltersChange={onFiltersChange}
  listingType={listingType}
  cities={cities || []}
  previewCount={previewCount}
  isCountLoading={isCountLoading}
  currency={currency}
  exchangeRate={exchangeRate}
  showSoldToggle={showSoldToggle}
  isSoldView={isSoldView}
  onSoldToggle={onSoldToggle}
/>
```

---

### Visual Result

**Mobile Row 1:**
```text
┌─────────────────────────────────────┐
│    [📍 City ▾]    [⚙ Filters (2)]  │
└─────────────────────────────────────┘
```

**Inside Filter Sheet (new section at top):**
```text
┌─────────────────────────────────────┐
│ 🏢 Listing Status                   │
│ ┌───────────────┐ ┌───────────────┐ │
│ │ Active ●      │ │ Sold          │ │
│ └───────────────┘ └───────────────┘ │
│                                     │
│ 📍 Location                         │
│ ...                                 │
└─────────────────────────────────────┘
```

This keeps the mobile interface clean while still giving users full access to switch between Active/Sold views when they need it.

