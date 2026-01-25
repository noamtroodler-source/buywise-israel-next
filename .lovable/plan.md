

# Compare Feature Audit & Enhancements

After reviewing the entire compare system across resale, rentals, and projects, I've identified several gaps and improvements that would make the comparison experience more complete and useful.

---

## Current State Summary

| Category | Page | Current Features | Gaps |
|----------|------|------------------|------|
| **Buy (Resale)** | `/compare` | Core details, location, character, investor metrics toggle | Missing: Entry date, Days on Market, A/C type, Va'ad Bayit |
| **Rent** | `/compare` (shared) | Same as Buy | Missing: Lease Reality section (lease term, pets, agent fee, etc.), entry/availability date, monthly costs breakdown |
| **Projects** | `/compare-projects` | Basic table comparison | Missing: Quick Insights cards, Winner Summary, construction progress %, available units, price/sqm |

---

## Proposed Enhancements

### 1. Compare.tsx - Add Rental-Specific Section

When `compareCategory === 'rent'`, show a dedicated "Lease Terms" section with rental-specific fields from the database:

| Row | Field | Notes |
|-----|-------|-------|
| Monthly Rent | `price` | Already shown, but relabel as "Monthly Rent" for rentals |
| Available | `entry_date` | "Immediate", "Feb 2026", etc. |
| Lease Term | `lease_term` | "12 months", "Flexible", etc. |
| Furnished | `furnished_status` | "Fully", "Semi", "Unfurnished" |
| Pets Policy | `pets_policy` | "Allowed", "Case-by-case", "Not Allowed" |
| Agent Fee | `agent_fee_required` | "Yes" / "No" |
| Bank Guarantee | `bank_guarantee_required` | "Yes" / "No" |
| Va'ad Bayit | `vaad_bayit_monthly` | Monthly fee amount |

### 2. Compare.tsx - Hide Investment Metrics for Rentals

The "Investor View" toggle and investment metrics (rental yield, price vs city avg) don't make sense for rental comparisons. Hide this toggle when `compareCategory === 'rent'`.

### 3. Compare.tsx - Add Israeli-Specific Fields for Sales

Add to the "Core Details" or "Property Character" section:

| Row | Field | Notes |
|-----|-------|-------|
| Entry Date | `entry_date` | "Immediate Entry" or specific date |
| A/C Type | `ac_type` | "Split", "Central", "Mini-Central" |
| Va'ad Bayit | `vaad_bayit_monthly` | Monthly building fee |
| Days Listed | `created_at` | Calculate days on market |

### 4. CompareProjects.tsx - Add Missing Components

Bring consistency with the property compare page:

| Addition | Description |
|----------|-------------|
| **Quick Insights** | Lowest price, largest units, soonest completion |
| **Winner Summary** | Track which project "wins" in the most categories |
| **Additional Rows** | Construction progress %, available units, price/sqm range, neighborhood |
| **Currency Formatting** | Use `useFormatPrice` from PreferencesContext instead of hardcoded ILS |

### 5. CompareHero.tsx - Category-Aware Labels

Update the hero section to be context-aware:

| Category | Title | Subtitle |
|----------|-------|----------|
| Buy | "Compare Properties" | "See what matters most — side by side" |
| Rent | "Compare Rentals" | "Find the best deal for your needs" |

### 6. CompareEmptyState.tsx - Category-Aware Suggestions

The empty state currently suggests only "for_sale" properties. Make it context-aware based on what category the user was last browsing.

### 7. CompareQuickInsights.tsx - Rental Adaptations

For rentals, change insights from:
- "Lowest Price" → "Lowest Rent"  
- "Best Value" → "Best Rent/sqm"

Add rental-specific insight:
- "Soonest Available" — property with earliest entry date

---

## Technical Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Compare.tsx` | Add rental section, hide investor toggle for rent, add entry date/A/C/Va'ad rows |
| `src/pages/CompareProjects.tsx` | Add Quick Insights, Winner Summary, use format hooks, add more comparison rows |
| `src/components/compare/CompareHero.tsx` | Accept `category` prop, show category-specific title |
| `src/components/compare/CompareQuickInsights.tsx` | Add `isRental` prop, adjust labels for rentals |
| `src/components/compare/CompareEmptyState.tsx` | Show relevant suggestions based on category |

### New Comparison Rows for Rentals

```tsx
const leaseTermsRows: ComparisonRow[] = useMemo(() => [
  {
    label: 'Available',
    getValue: (p) => p.entry_date 
      ? (p.entry_date === 'immediate' ? 'Immediate' : new Date(p.entry_date).toLocaleDateString())
      : '—',
    icon: Calendar,
  },
  {
    label: 'Lease Term',
    getValue: (p) => formatLeaseTermLabel(p.lease_term),
    icon: FileText,
  },
  {
    label: 'Furnished',
    getValue: (p) => formatFurnishedLabel(p.furnished_status),
    icon: Sofa,
  },
  {
    label: 'Pets',
    getValue: (p) => formatPetsLabel(p.pets_policy),
    icon: PawPrint,
  },
  {
    label: 'Agent Fee',
    getValue: (p) => p.agent_fee_required ? 'Yes (tenant pays)' : 'No',
  },
  {
    label: 'Bank Guarantee',
    getValue: (p) => p.bank_guarantee_required ? 'Required' : 'No',
  },
  {
    label: 'Va\'ad Bayit',
    getValue: (p) => p.vaad_bayit_monthly 
      ? formatPrice(p.vaad_bayit_monthly, 'ILS') + '/mo' 
      : '—',
  },
], [formatPrice]);
```

### New Rows for Projects Comparison

```tsx
// Add to the comparison table
{ label: 'Available Units', getValue: (p) => `${p.available_units || '—'} / ${p.total_units || '—'}` },
{ label: 'Construction', getValue: (p) => p.construction_progress_percent ? `${p.construction_progress_percent}%` : '—' },
{ label: 'Neighborhood', getValue: (p) => p.neighborhood || '—' },
{ label: 'Price/m²', getValue: (p) => /* calculate from unit data */ },
```

---

## Summary of Changes

1. **Rentals**: Add dedicated "Lease Terms" comparison section with all structured rental data
2. **Rentals**: Hide "Investor View" toggle (not applicable)
3. **Sales**: Add entry date, A/C type, Va'ad Bayit, days listed rows
4. **Projects**: Add Quick Insights component + Winner Summary
5. **Projects**: Add construction progress, available units, price/sqm rows
6. **Projects**: Use currency formatting from PreferencesContext
7. **Hero**: Show category-aware titles ("Compare Rentals" vs "Compare Properties")
8. **Empty State**: Show category-appropriate suggestions
9. **Quick Insights**: Adapt labels for rental context ("Lowest Rent")

This will create a more complete and context-aware comparison experience across all property types.

