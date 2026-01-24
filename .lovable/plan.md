
# Align Project Cost Breakdown with Buy/Rent Design Pattern

## Overview
Modernize the `ProjectCostBreakdown` component to match the visual language and UX patterns of `PropertyCostBreakdown`, while preserving project-specific features like the payment schedule and buyer protections.

## Design Goals

1. **Remove Card wrapper** - Use the same clean header style as property pages
2. **Add PersonalizationHeader** - Enable inline editing of buyer type + mortgage assumptions  
3. **Modernize unit type selector** - Replace dropdown with a more elegant ToggleGroup or inline selector
4. **Implement honest ranges** - Replace fixed values with transparent ranges using existing utilities
5. **Add progressive disclosure** - Use Collapsible components for upfront costs
6. **Improve tooltips** - Use dotted underline triggers instead of HelpCircle icons
7. **Preserve unique sections** - Keep Payment Schedule and Buyer Protections

## Visual Comparison

**Before (Current):**
```text
┌─────────────────────────────────────┐
│ 💰 Cost Breakdown           [Card]  │
│─────────────────────────────────────│
│ Select Unit Type                    │
│ ┌─────────────────────────────┐     │
│ │ 3-Room (from ₪1,800,000) ▼  │     │
│ └─────────────────────────────┘     │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ Unit Price      ₪1,850,000  │     │
│ └─────────────────────────────┘     │
│                                     │
│ [Profile Banner]                    │
│                                     │
│ 📄 Upfront Costs                    │
│   Purchase Tax         ₪12,890      │
│   Your Lawyer          ₪10,915      │
│   Developer Lawyer     ₪32,745      │
│   Registration         ₪500         │
│                                     │
│ 📅 Payment Schedule                 │
│   [Timeline Cards]                  │
│                                     │
│ 🛡️ Buyer Protections                │
│   ✓ Bank Guarantee                  │
└─────────────────────────────────────┘
```

**After (Proposed):**
```text
💰 Cost Breakdown

Calculating for: First-Time Buyer · Paid in Full  [Edit ▾]
┌ PersonalizationHeader panel (collapsed by default) ─────┐
│ Buyer Type: First-Time Buyer    [Change in Profile →]   │
│ Financing Method: [Include Mortgage toggle]              │
│ (Mortgage settings if enabled)                           │
│ [Reset] [Cancel] [Save]                                  │
└──────────────────────────────────────────────────────────┘

Unit Type: [ 3-Room ][ 4-Room ][ Penthouse ]  ← ToggleGroup
           ₪1.85M · 3-Room Apartment

📄 Upfront Costs                     ₪82k–115k
   ~5.2–6.8% of price
   ▾ View breakdown

   [Collapsible content with dotted-underline tooltips]
   Purchase Tax (First-Time badge)    ₪12,890
   Your Lawyer (0.5–1% + VAT)         ₪10.9k–21.8k
   Developer Lawyer (New Build badge)  ₪18.5k–37k
   Other Fees                          ₪1.9k–3.6k

📅 Typical Payment Schedule (New Construction)
   [Keep existing timeline cards - they work well]

🛡️ Buyer Protections
   [Keep existing section - it works well]
```

## Technical Changes

### File: `src/components/project/ProjectCostBreakdown.tsx`

#### 1. Update Imports
Add imports for:
- `PersonalizationHeader` from `@/components/property/PersonalizationHeader`
- `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger` from UI
- `formatPriceRange`, `FEE_RANGES` from `@/lib/utils/formatRange`
- `ToggleGroup`, `ToggleGroupItem` from UI
- Additional hooks: `useMortgagePreferences`, `useMortgageEstimate`, `profileToDimensions`, `deriveEffectiveBuyerType`
- `cn` utility for className merging

#### 2. Remove Card Wrapper
Replace the Card/CardHeader/CardContent structure with a simple div structure matching PropertyCostBreakdown:
```tsx
<div className="space-y-4">
  <div className="flex items-center gap-2">
    <Calculator className="h-5 w-5 text-primary" />
    <h3 className="text-lg font-semibold text-foreground">Cost Breakdown</h3>
  </div>
  ...
</div>
```

#### 3. Replace Select Dropdown with ToggleGroup
Transform the unit type selector into a more elegant pill-style selector:
```tsx
<div className="space-y-2">
  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
    Unit Type
  </Label>
  <ToggleGroup
    type="single"
    value={selectedType}
    onValueChange={setSelectedType}
    className="flex flex-wrap gap-2"
  >
    {unitOptions.map((option) => (
      <ToggleGroupItem 
        key={option.type}
        value={option.type}
        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-4 py-2 rounded-full border"
      >
        {option.type}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
  <p className="text-sm text-muted-foreground">
    {formatPrice(price, currency)} · {selectedOption?.type}
  </p>
</div>
```

#### 4. Add PersonalizationHeader
Insert after the unit selector, before upfront costs:
```tsx
{!isLoading && (
  <PersonalizationHeader
    buyerCategoryLabel={getBuyerCategoryLabel(buyerCategory)}
    hasProfile={hasProfile}
    downPaymentPercent={mortgageEstimate.downPaymentPercent}
    termYears={mortgageEstimate.termYears}
    propertyPrice={price}
    ltvLimit={ltvLimit}
    savedProfileDimensions={savedProfileDimensions}
  />
)}
```

#### 5. Implement Honest Ranges for Fees
Replace fixed calculations with range-based ones:
```tsx
// Lawyer fees: 0.5-1.0% + VAT
const lawyerFeesRange = {
  low: Math.round(price * FEE_RANGES.lawyer.min * (1 + VAT_RATE)),
  high: Math.round(price * FEE_RANGES.lawyer.max * (1 + VAT_RATE)),
};

// Developer lawyer: 1-2% + VAT (new construction standard)
const developerLawyerFeesRange = {
  low: Math.round(price * FEE_RANGES.developerLawyer.min * (1 + VAT_RATE)),
  high: Math.round(price * FEE_RANGES.developerLawyer.max * (1 + VAT_RATE)),
};

// Other fees (registration, mortgage if applicable)
const otherFeesRange = includeMortgage ? {
  low: FEE_RANGES.registration.min + FEE_RANGES.appraisal.min + FEE_RANGES.mortgageOrigination.min,
  high: FEE_RANGES.registration.max + FEE_RANGES.appraisal.max + FEE_RANGES.mortgageOrigination.max,
} : {
  low: FEE_RANGES.registration.min,
  high: FEE_RANGES.registration.max,
};

// Total upfront range
const totalUpfrontRange = {
  low: purchaseTax + lawyerFeesRange.low + developerLawyerFeesRange.low + otherFeesRange.low,
  high: purchaseTax + lawyerFeesRange.high + developerLawyerFeesRange.high + otherFeesRange.high,
};
```

#### 6. Add Collapsible for Upfront Costs
Wrap the cost breakdown in a Collapsible with the same pattern as PropertyCostBreakdown:
```tsx
const [upfrontOpen, setUpfrontOpen] = useState(false);
const upfrontPercentLow = ((totalUpfrontRange.low / price) * 100).toFixed(1);
const upfrontPercentHigh = ((totalUpfrontRange.high / price) * 100).toFixed(1);

<Collapsible open={upfrontOpen} onOpenChange={setUpfrontOpen}>
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-primary" />
        <h4 className="font-medium text-foreground">Upfront Costs</h4>
      </div>
      <div className="text-right">
        <div className="font-bold text-primary">
          {formatPriceRange(totalUpfrontRange.low, totalUpfrontRange.high, 'ILS')}
        </div>
        <div className="text-xs text-muted-foreground">
          ~{upfrontPercentLow}–{upfrontPercentHigh}% of price
        </div>
      </div>
    </div>
    
    <CollapsibleTrigger asChild>
      <button className="flex items-center gap-1 text-xs text-primary hover:underline">
        <ChevronDown className={cn("h-3 w-3 transition-transform", upfrontOpen && "rotate-180")} />
        {upfrontOpen ? 'Hide breakdown' : 'View breakdown'}
      </button>
    </CollapsibleTrigger>
    
    <CollapsibleContent className="space-y-2 text-sm pt-2">
      {/* Cost line items with dotted-underline tooltips */}
    </CollapsibleContent>
  </div>
</Collapsible>
```

#### 7. Update Tooltip Style
Change from HelpCircle icons to dotted-underline triggers:
```tsx
// Before:
<span className="flex items-center gap-1.5 text-muted-foreground cursor-help">
  Purchase Tax (Mas Rechisha)
  <HelpCircle className="h-3.5 w-3.5" />
</span>

// After:
<span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
  Purchase Tax
</span>
{effectiveTaxType === 'first_time' && (
  <Badge variant="secondary" className="ml-2 text-xs bg-primary/10 text-primary">First-Time</Badge>
)}
```

#### 8. Keep Payment Schedule and Buyer Protections
These sections work well and are unique to project pages - just clean up minor styling to match:
- Keep the circular percentage badges
- Keep the checkmark list for protections
- Ensure consistent spacing (use `space-y-5` between major sections)

## State Management Updates

Add the following hooks and state:
```tsx
const { includeMortgage, ltvLimit } = useMortgagePreferences();
const mortgageEstimate = useMortgageEstimate(price);
const savedProfileDimensions = useMemo(() => profileToDimensions(buyerProfile), [buyerProfile]);

// State for unit selection (fix the current broken state pattern)
const [selectedType, setSelectedType] = useState<string>('');

// Initialize selected type when options load
useEffect(() => {
  if (unitOptions.length > 0 && !selectedType) {
    setSelectedType(unitOptions[0].type);
  }
}, [unitOptions, selectedType]);

// Collapsible state
const [upfrontOpen, setUpfrontOpen] = useState(false);
```

## Files to Modify

1. **`src/components/project/ProjectCostBreakdown.tsx`** - Complete rewrite following the pattern above

## What's Preserved (Unique to Projects)

- Unit type selection (redesigned as ToggleGroup)
- Payment schedule timeline with milestone cards
- Buyer protections checklist
- New construction-specific fees (developer lawyer)

## What's Aligned with Buy/Rent

- No Card wrapper - clean header style
- PersonalizationHeader for inline mortgage/buyer type editing
- Collapsible progressive disclosure for upfront costs
- Honest ranges with formatPriceRange utility
- Dotted-underline tooltip triggers
- Consistent spacing and typography
- Badge styling for buyer type indicators
