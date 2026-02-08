
# Move Category Toggle Above Stats Cards

## Summary
Reposition the Buy/Rent category toggle to appear immediately after the hero section but **before** the stats cards on both agent and agency pages. This creates a clearer visual hierarchy where the control precedes all the content it affects.

---

## Current Layout (Both Pages)

```text
┌─────────────────────────────────┐
│  Hero Card                      │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  Stats Cards (affected by mode) │
│  [13 For Sale] [Median Price]...│
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  [Buy] [Rent] ← Toggle here     │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  Tabs + Property Grid           │
└─────────────────────────────────┘
```

---

## New Layout (Both Pages)

```text
┌─────────────────────────────────┐
│  Hero Card                      │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  [Buy] [Rent] ← Toggle moved up │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  Stats Cards (now below toggle) │
│  [13 For Sale] [Median Price]...│
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  Tabs + Property Grid           │
└─────────────────────────────────┘
```

---

## Changes Required

### AgentDetail.tsx (lines 298-342)

Move the Category Toggle section (lines 334-342) to appear **before** the Stats Bar (line 298):

**Before:**
```tsx
{/* Stats Bar */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  ...stats cards...
</div>

{/* Category Toggle */}
<div className="flex justify-center">
  <CategoryToggle ... />
</div>
```

**After:**
```tsx
{/* Category Toggle */}
<div className="flex justify-center">
  <CategoryToggle ... />
</div>

{/* Stats Bar */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  ...stats cards...
</div>
```

---

### AgencyDetail.tsx (lines 251-299)

Same change - move the Category Toggle section (lines 291-299) to appear **before** the Stats section (line 251):

**Before:**
```tsx
{/* Stats */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  ...stats cards...
</div>

{/* Category Toggle */}
<div className="flex justify-center">
  <CategoryToggle ... />
</div>
```

**After:**
```tsx
{/* Category Toggle */}
<div className="flex justify-center">
  <CategoryToggle ... />
</div>

{/* Stats */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  ...stats cards...
</div>
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/AgentDetail.tsx` | Move CategoryToggle div above Stats Bar div |
| `src/pages/AgencyDetail.tsx` | Move CategoryToggle div above Stats div |

---

## Visual Result

**Agent Page:**
1. Hero (name, agency, contact buttons)
2. **[Buy (20)] [Rent (9)]** ← Toggle now here
3. Stats (13 For Sale, Median Price, Days, Experience)
4. Tabs + Grid

**Agency Page:**
1. Hero (logo, name, description, contact)
2. **[Buy (135)] [Rent (42)]** ← Toggle now here  
3. Stats (9 Agents, 135 For Sale, Median Price, Days)
4. Our Team section
5. Tabs + Grid

This ensures the toggle is visually positioned as a "mode selector" that controls everything below it.
