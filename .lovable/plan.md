
# Add Monthly Costs Section to Project Cost Breakdown

## Overview
Restructure the Project Cost Breakdown to have two clear sections:
1. **"Due at Contract Signing"** - All upfront costs (10% payment + fees)
2. **"Monthly Costs (After Key Delivery)"** - Ongoing costs that start once you move in

This mirrors the Buy/Rent page pattern and gives buyers a complete picture of their financial commitment.

## Visual Design

```text
💰 Cost Breakdown

Calculating for: First-Time Buyer · Paid in Full  [Edit ▾]

Unit Type: [ 3-Room ][ 4-Room ][ Penthouse ]
           ₪1.85M · 3-Room Apartment

┌─────────────────────────────────────────────────────────────┐
│ 📋 DUE AT CONTRACT SIGNING           ₪227k–257k            │
│    10% down + fees · ~14–16% of price                      │
│    ▾ View breakdown                                        │
│                                                             │
│    [Collapsible details with dotted-underline tooltips]    │
│    First Payment (10%)                    ₪185,000          │
│    Purchase Tax                           ₪12,890           │
│    Your Lawyer (0.5–1% + VAT)             ₪10.9k–21.8k     │
│    Developer Lawyer (1–2% + VAT)          ₪18.5k–37k       │
│    Registration & Other                   ₪400–600          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🏠 MONTHLY COSTS (AFTER KEY DELIVERY)    ₪1.5k–3.5k/mo     │
│    Starts when building is complete                         │
│    ▾ View breakdown                                        │
│                                                             │
│    [Collapsible details with dotted-underline tooltips]    │
│    Mortgage*                              ₪5.2k–7.8k/mo    │
│    Arnona (Municipal Tax)                 ₪450–650/mo      │
│    Va'ad Bayit (Maintenance)              ₪300–600/mo      │
│    Home Insurance                         ₪100–200/mo      │
│                                                             │
│    * Only shown if "Include Mortgage" is ON                │
│    (Mortgage typically disbursed at key delivery)           │
└─────────────────────────────────────────────────────────────┘

🛡️ Buyer Protections
   ✓ Bank Guarantee  ✓ 1-Year Warranty  ✓ Staged Payments
```

## Technical Changes

### File: `src/components/project/ProjectCostBreakdown.tsx`

#### 1. Add New Imports
```tsx
import { Home } from 'lucide-react';
import { ARNONA_RATES } from '@/lib/calculations/purchaseCosts'; // or inline
```

#### 2. Add Monthly Cost Calculations
Calculate estimated monthly costs based on unit size (estimate from price) and city context:
```tsx
// Estimate apartment size from price (rough: ₪25-35k per sqm in new construction)
const estimatedSizeSqm = Math.round(price / 30000); // ~₪30k/sqm average

// Monthly cost ranges
const arnonaRange = {
  low: Math.round(estimatedSizeSqm * 70 / 12),   // Lower rate cities
  high: Math.round(estimatedSizeSqm * 120 / 12), // Tel Aviv level
};

const vaadBayitRange = {
  low: 300,   // New buildings typically have higher fees
  high: 600,  // Premium new construction
};

const insuranceRange = {
  low: 100,
  high: 200,
};

// Total monthly ownership (without mortgage)
const monthlyOwnershipRange = {
  low: arnonaRange.low + vaadBayitRange.low + insuranceRange.low,
  high: arnonaRange.high + vaadBayitRange.high + insuranceRange.high,
};

// Total monthly (with mortgage if enabled)
const totalMonthlyRange = includeMortgage ? {
  low: monthlyOwnershipRange.low + mortgageEstimate.monthlyPaymentLow,
  high: monthlyOwnershipRange.high + mortgageEstimate.monthlyPaymentHigh,
} : monthlyOwnershipRange;
```

#### 3. Add Monthly Costs Collapsible Section
After the "Due at Contract Signing" section, add:
```tsx
const [monthlyOpen, setMonthlyOpen] = useState(false);

{/* Monthly Costs Section */}
<Collapsible open={monthlyOpen} onOpenChange={setMonthlyOpen}>
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Home className="h-4 w-4 text-primary" />
        <h4 className="font-medium text-foreground">Monthly Costs</h4>
        <Badge variant="outline" className="text-xs">After Key Delivery</Badge>
      </div>
      <div className="text-right">
        <div className="font-bold text-primary">
          {formatPriceRange(totalMonthlyRange.low, totalMonthlyRange.high, 'ILS')}/mo
        </div>
        <div className="text-xs text-muted-foreground">
          Starts when building completes
        </div>
      </div>
    </div>
    
    <CollapsibleTrigger asChild>
      <button className="flex items-center gap-1 text-xs text-primary hover:underline">
        <ChevronDown className={cn("h-3 w-3 transition-transform", monthlyOpen && "rotate-180")} />
        {monthlyOpen ? 'Hide breakdown' : 'View breakdown'}
      </button>
    </CollapsibleTrigger>
    
    <CollapsibleContent className="space-y-2 text-sm pt-2">
      {/* Mortgage (if enabled) */}
      {includeMortgage && (
        <div className="py-2 border-b border-border/50">
          <div className="flex justify-between items-start">
            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-medium text-foreground cursor-help border-b border-dotted border-muted-foreground/50">
                    Mortgage
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Monthly Payment Estimate</p>
                  <p className="text-xs">
                    Based on {mortgageEstimate.downPaymentPercent}% down payment, 
                    {mortgageEstimate.termYears}-year term, and typical rates of 4.5%–6.0%. 
                    Mortgage is typically disbursed at key delivery stage in new construction.
                  </p>
                </TooltipContent>
              </Tooltip>
              <p className="text-xs text-muted-foreground">
                {mortgageEstimate.downPaymentPercent}% down · {mortgageEstimate.termYears}yr
              </p>
            </div>
            <span className="font-medium">
              {formatPriceRange(mortgageEstimate.monthlyPaymentLow, mortgageEstimate.monthlyPaymentHigh, 'ILS')}/mo
            </span>
          </div>
        </div>
      )}
      
      {/* Arnona */}
      <div className="flex justify-between py-2 border-b border-border/50">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
              Arnona
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium mb-1">Municipal Property Tax</p>
            <p className="text-xs">
              Monthly tax paid to the city. Rate varies by city and property size. 
              Estimate based on ~{estimatedSizeSqm} sqm at typical rates.
            </p>
          </TooltipContent>
        </Tooltip>
        <span className="font-medium">
          {formatPriceRange(arnonaRange.low, arnonaRange.high, 'ILS')}/mo
        </span>
      </div>
      
      {/* Va'ad Bayit */}
      <div className="flex justify-between py-2 border-b border-border/50">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
              Va'ad Bayit
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium mb-1">Building Maintenance Fee</p>
            <p className="text-xs">
              Monthly fee for building maintenance, cleaning, elevator, lobby, etc. 
              New construction typically has higher fees due to premium amenities.
            </p>
          </TooltipContent>
        </Tooltip>
        <span className="font-medium">
          {formatPriceRange(vaadBayitRange.low, vaadBayitRange.high, 'ILS')}/mo
        </span>
      </div>
      
      {/* Insurance */}
      <div className="flex justify-between py-2 border-b border-border/50">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
              Home Insurance
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium mb-1">Structure & Contents Insurance</p>
            <p className="text-xs">
              Recommended coverage for your home and belongings. 
              Required if you have a mortgage.
            </p>
          </TooltipContent>
        </Tooltip>
        <span className="font-medium">
          {formatPriceRange(insuranceRange.low, insuranceRange.high, 'ILS')}/mo
        </span>
      </div>
    </CollapsibleContent>
  </div>
</Collapsible>
```

#### 4. Update the Summary Banner
Restructure the top summary to show both at a glance:
```tsx
{/* Summary Banner - Both Key Numbers */}
<div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
  <div className="grid grid-cols-2 gap-4">
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">At Signing</p>
      <p className="text-lg font-bold text-primary">
        {formatPriceRange(dueAtSigningRange.low, dueAtSigningRange.high, 'ILS')}
      </p>
      <p className="text-xs text-muted-foreground">
        10% + fees
      </p>
    </div>
    <div className="text-right">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly</p>
      <p className="text-lg font-bold text-primary">
        {formatPriceRange(totalMonthlyRange.low, totalMonthlyRange.high, 'ILS')}/mo
      </p>
      <p className="text-xs text-muted-foreground">
        After delivery
      </p>
    </div>
  </div>
</div>
```

#### 5. Restructure Breakdown Section Titles
Update the "Breakdown" section to be clearer:
- Change "Breakdown" header to "Due at Contract Signing"
- Keep all existing fee line items

## State Changes

Add new state for the monthly section:
```tsx
const [monthlyOpen, setMonthlyOpen] = useState(false);
```

## What This Achieves

- **Complete financial picture**: Buyers see both upfront AND ongoing costs
- **New construction context**: "After Key Delivery" badge clarifies when monthly costs begin
- **Mortgage clarity**: Shows mortgage payment only when financing is enabled, with tooltip explaining it's disbursed at key delivery
- **Consistent UX**: Matches the Buy/Rent page collapsible breakdown pattern
- **Honest ranges**: All monthly costs use ranges, not fake-precision single values
- **Educational tooltips**: Each cost item has a dotted-underline tooltip explaining what it is

## Files to Modify

1. **`src/components/project/ProjectCostBreakdown.tsx`** - Add monthly costs section with calculations and UI
