

## Plan: Simplify New Construction Section

**Goal:** Reduce visual clutter in the New Construction area by collapsing two alert boxes into one subtle line and inlining the construction period.

### Changes (single file: `src/components/tools/TrueCostCalculator.tsx`)

**1. Replace the expanded new-construction sub-section (lines 532–561)**

Current: border-left panel with full input field + blue VAT alert + amber Madad alert (30 lines of UI).

New: Compact inline layout:
- Construction period as a small inline input (e.g., `60px wide number input`) on the same row or just below the toggle
- One single `text-xs text-muted-foreground` line: *"Prices include 18% VAT. Final cost may rise 3–8% due to building index (מדד)."*

```
{isNewConstruction && (
  <div className="space-y-2 pl-4 border-l-2 border-primary/20">
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground">Construction period</Label>
      <Input type="number" value={constructionMonths} onChange={...} className="h-8 w-20 text-sm" min={6} max={60} />
      <span className="text-xs text-muted-foreground">months</span>
    </div>
    <p className="text-xs text-muted-foreground">
      Prices include 18% VAT. Final cost may rise 3–8% due to building index (מדד).
    </p>
  </div>
)}
```

**2. Add tooltip to "Index Linkage (Madad)" row in breakdown (line 776)**

Add an `InfoTooltip` to the existing Madad line in the breakdown section explaining: *"New construction prices are linked to the building cost index. Typical increase is 3–8% over 2–3 years of construction."*

Two edits, one file, net reduction of ~15 lines of UI.

