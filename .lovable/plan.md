

# Mobile Fixes Plan

## Issues Found in Audit

1. **Sticky contact bar overlaps MobileBottomNav** — On property and project detail pages, the fixed-bottom contact bar sits at `bottom-0` with `z-50`, same z-index as MobileBottomNav. They stack on top of each other, cutting off content.

2. **Header logo truncation** — "BuyWise Israel" text at `text-[1.3rem]` can clip on narrow screens (320–360px).

3. **Map marker label truncation** — Minor: cluster labels like "Ash…" truncate at low zoom. Low priority cosmetic issue.

---

## Fixes

### 1. Fix contact bar / bottom nav overlap (High Priority)

**Problem**: `ProjectMobileContactBar` and `MobileContactBar` both use `fixed bottom-0 z-50` — same position as `MobileBottomNav` (also `fixed bottom-0 z-50`). They overlap.

**Fix**: Add `bottom-16` (64px = nav height) to both mobile contact bars so they sit above the nav, and add `pb-safe` for notch devices.

**Files**:
- `src/components/project/ProjectStickyCard.tsx` — line 304: change `bottom-0` → `bottom-16` and add `pb-safe`
- `src/components/property/StickyContactCard.tsx` — line 299: change `bottom-0` → `bottom-16` (already has `pb-safe`)
- `src/pages/ProjectDetail.tsx` — line 107: increase `pb-24` → `pb-36` to account for combined bar height
- `src/pages/PropertyDetail.tsx` — line 165: same `pb-24` → `pb-36`

### 2. Fix header logo truncation on small screens (Medium Priority)

**Problem**: Two `text-[1.3rem]` spans for "BuyWise" and "Israel" can overflow on 320px devices.

**Fix**: Scale down text on small screens using responsive sizing: `text-[1.1rem] sm:text-[1.3rem]`.

**File**: `src/components/layout/Header.tsx` — lines 116-117

### 3. Map marker truncation (Low Priority — cosmetic)

This is a Google Maps rendering limitation at low zoom when clusters overlap. No code fix needed — the existing compact marker logic already handles this at zoom ≤ 13. Noting as "won't fix" since it resolves itself as users zoom in.

---

## Summary

| Fix | Severity | Files Changed |
|-----|----------|---------------|
| Contact bar overlap | High | 4 files |
| Logo truncation | Medium | 1 file |
| Map marker labels | Low | No change |

