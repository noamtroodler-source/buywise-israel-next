
# Add Areas Link to Projects Dropdown

## Summary
Add an "Understand Markets" link to the Projects dropdown menu, matching the pattern used in Buy and Rent sections.

---

## Change

**File:** `src/lib/navigationConfig.ts`

**Location:** Lines 102-105 (Projects → Browse column)

**Current:**
```tsx
{
  title: 'Browse',
  items: [
    { label: 'All New Projects', href: '/projects', phase: 'explore' },
    { label: 'Browse Developers', href: '/developers', phase: 'explore' },
  ]
},
```

**Updated:**
```tsx
{
  title: 'Browse',
  items: [
    { label: 'All New Projects', href: '/projects', phase: 'explore' },
    { label: 'Browse Developers', href: '/developers', phase: 'explore' },
    { label: 'Understand Markets', href: '/areas', description: 'Prices & trends by city', phase: 'understand' },
  ]
},
```

---

## Why This Wording

- **"Understand Markets"** - matches the Buy section for consistency
- **Description:** "Prices & trends by city" - slightly different from Buy's "Price & trend context" to feel natural, conveys the same meaning
- **Phase:** `understand` - aligns with the journey framework

---

## Result

All three dropdowns (Buy, Rent, Projects) now have access to the Areas page with clear, expectation-setting labels:

| Menu | Label | Description |
|------|-------|-------------|
| Buy | Understand Markets | Price & trend context |
| Rent | Market Overview | Rental prices by city |
| Projects | Understand Markets | Prices & trends by city |
