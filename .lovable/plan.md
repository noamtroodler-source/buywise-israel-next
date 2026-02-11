

# Semantic Color Token Migration for Calculator Tools

## Overview
Migrate 5 calculator tools from raw Tailwind color classes (e.g., `bg-amber-50`, `text-green-600`, `bg-destructive/10`) to the project's semantic color tokens (`bg-semantic-amber`, `bg-semantic-green`, `bg-semantic-red`). This ensures visual consistency across all tools and aligns with the existing semantic color system used in AffordabilityBadge, ResultCard, and LTVIndicator.

## Strategy
- **Warnings/caution alerts** (payment deadlines, index linkage, budget warnings): `semantic-amber`
- **Positive signals** (tax savings, below-median price): `semantic-green`
- **Negative/cost signals** (estimated linked price increase): `semantic-red`
- **Informational banners** (blue): remain unchanged (already brand-compliant)
- **Investment grades**: map A+/A to `semantic-green`, B+/B to neutral, C/D to muted (keeping it "honest but not alarming")

## Changes by File

### 1. Affordability Calculator (`AffordabilityCalculator.tsx`)
**Affordability Score indicator** (line ~404): Replace the current `text-primary` / `text-muted-foreground` pattern with semantic colors for the score label and progress bar.

| Score | Current | New |
|-------|---------|-----|
| Comfortable (>=80) | `text-primary`, `bg-primary` bar | `text-semantic-green-foreground`, `bg-semantic-green` bar |
| Stretched (>=60) | `text-muted-foreground`, `bg-primary/60` bar | `text-semantic-amber-foreground`, `bg-semantic-amber` bar |
| At Limit (<60) | `text-foreground`, `bg-muted-foreground` bar | `text-semantic-red-foreground`, `bg-semantic-red` bar |

### 2. Investment Return Calculator (`InvestmentReturnCalculator.tsx`)
**Investment grade badge** (lines 56-68 and line ~753): Replace the current primary/muted color classes with semantic tokens.

| Grade | Current | New |
|-------|---------|-----|
| A+/A (Excellent/Strong) | `text-primary bg-primary/10 border-primary/20` | `text-semantic-green-foreground bg-semantic-green border-semantic-green` |
| B+/B (Good/Solid) | `text-foreground bg-muted border-border` | No change (neutral is appropriate) |
| C+/C/D (Moderate/Fair/Weak) | `text-muted-foreground bg-muted border-border` | No change (neutral is appropriate) |

### 3. Purchase Tax Calculator (`PurchaseTaxCalculator.tsx`)
3 token swaps:

- **Payment warning alert** (line ~345): `bg-amber-50 border-amber-200` + `text-amber-600/800` replaced with `bg-semantic-amber border-semantic-amber` + `text-semantic-amber-foreground`
- **Savings alert** (line ~355): `bg-green-50 border-green-200` + `text-green-600/800` replaced with `bg-semantic-green border-semantic-green` + `text-semantic-green-foreground`
- **Upgrader timeline section** (line ~280): `bg-amber-50 border-amber-200` + `text-amber-600/700/800` replaced with `bg-semantic-amber border-semantic-amber` + `text-semantic-amber-foreground`

### 4. New Construction Cost Calculator (`NewConstructionCostCalculator.tsx`)
3 token swaps:

- **Index warning alert** (line ~289): `bg-amber-50 border-amber-200` + `text-amber-600/800` replaced with `bg-semantic-amber border-semantic-amber` + `text-semantic-amber-foreground`
- **Estimated linked price card** (line ~304): `bg-destructive/10` + `text-destructive` replaced with `bg-semantic-red` + `text-semantic-red-foreground`
- **Linkage cost line items** (lines ~339, ~363): `text-amber-600` replaced with `text-semantic-amber-foreground`

### 5. True Cost Calculator (`TrueCostCalculator.tsx`)
3 token swaps:

- **Price comparison text** (line ~475): `text-amber-600` (above median) stays as `text-semantic-amber-foreground`
- **New construction alert** (line ~607): `bg-amber-500/10 border-amber-500/30` + `text-amber-600/700` replaced with `bg-semantic-amber border-semantic-amber` + `text-semantic-amber-foreground`
- **New construction costs section** (line ~825): `bg-amber-500/5 border-amber-500/20` + `text-amber-700` replaced with `bg-semantic-amber/10 border-semantic-amber` + `text-semantic-amber-foreground`

## What is NOT changing
- Blue info banners (these are branding, not status)
- Primary-colored hero numbers (property price, net yield headline)
- The Oleh benefits info panel (blue = informational, not a warning)
- `text-destructive` for the "benefits expired" message (that is a genuine error state, and destructive is appropriate for inline error text in forms)

## Total
5 files, ~15 color swaps, no logic changes.

