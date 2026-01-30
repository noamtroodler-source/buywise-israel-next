

## Swap Mobile Order: Show Inputs First, Results Second

### Current Behavior
On mobile view, the tools currently show:
1. **Results** (right column) - appears first
2. **Inputs** (left column) - appears second

### Requested Change
Swap the mobile order so it shows:
1. **Inputs** (left column) - appears first
2. **Results** (right column) - appears second

This makes more sense for user flow on mobile - users should see and interact with inputs before seeing results.

---

## Technical Implementation

### File to Modify
- `src/components/tools/shared/ToolLayout.tsx`

### Change Required (Lines 98-105)
Swap the `order` classes for mobile view:

**Current:**
```tsx
{/* Left Column - Inputs */}
<div className="flex flex-col order-2 lg:order-1">
  {leftColumn}
</div>

{/* Right Column - Results */}
<div className="flex flex-col order-1 lg:order-2 lg:sticky lg:top-6 lg:self-start">
  {rightColumn}
</div>
```

**Updated:**
```tsx
{/* Left Column - Inputs */}
<div className="flex flex-col order-1 lg:order-1">
  {leftColumn}
</div>

{/* Right Column - Results */}
<div className="flex flex-col order-2 lg:order-2 lg:sticky lg:top-6 lg:self-start">
  {rightColumn}
</div>
```

Since `order-1` and `lg:order-1` are the same (and `order-2` / `lg:order-2`), we can simplify:

```tsx
{/* Left Column - Inputs */}
<div className="flex flex-col">
  {leftColumn}
</div>

{/* Right Column - Results */}
<div className="flex flex-col lg:sticky lg:top-6 lg:self-start">
  {rightColumn}
</div>
```

### Scope
This single change in `ToolLayout.tsx` will automatically apply to **all 7 tools** that use this shared layout:
- Mortgage Calculator
- Total Cost Calculator
- Affordability Calculator
- Investment Return Calculator
- Rent vs Buy Calculator
- Renovation Cost Estimator
- Document Checklist Tool

