
# Add Projects as Separate Navigation Menu

## Summary
Add "Projects" back as its own dropdown menu in the navigation, separate from "Buy" (which will be for resale properties). The `projects` config already exists in `navigationConfig.ts` with appropriate content.

## Changes Required

### 1. Desktop Navigation (Header.tsx)
Add the Projects MegaMenu between Buy and Rent:
```
Buy | Projects | Rent | Learn | More
```

**Current (line 70-75):**
```tsx
<nav className="hidden md:flex items-center justify-center gap-6">
  <MegaMenu config={NAV_CONFIG.buy} />
  <MegaMenu config={NAV_CONFIG.rent} />
  <LearnNav />
  <MoreNav />
</nav>
```

**After:**
```tsx
<nav className="hidden md:flex items-center justify-center gap-6">
  <MegaMenu config={NAV_CONFIG.buy} />
  <MegaMenu config={NAV_CONFIG.projects} />
  <MegaMenu config={NAV_CONFIG.rent} />
  <LearnNav />
  <MoreNav />
</nav>
```

### 2. Mobile Navigation (Header.tsx)
Add a Projects accordion section after Buy, before Rent (around line 319):

```tsx
{/* Projects Accordion */}
<AccordionItem value="projects" className="border-b-0">
  <AccordionTrigger className="...">
    Projects
  </AccordionTrigger>
  <AccordionContent>
    {/* Same structure as Buy/Rent accordions */}
    {NAV_CONFIG.projects.columns.map(...)}
  </AccordionContent>
</AccordionItem>
```

### 3. Update Buy Menu Content (navigationConfig.ts)
Remove the "New Projects" link from the Buy menu since Projects now has its own section:

**Current Browse items in Buy:**
- All Properties for Sale
- New Projects (remove this)
- Understand Markets

**After:**
- All Properties for Sale
- Understand Markets

## Files to Modify

| File | Change |
|------|--------|
| `src/components/layout/Header.tsx` | Add Projects MegaMenu to desktop nav and Projects accordion to mobile nav |
| `src/lib/navigationConfig.ts` | Remove "New Projects" from Buy menu since it's now in Projects |

## Final Navigation Order
**Desktop:** Buy | Projects | Rent | Learn | More

**Projects dropdown will include:**
- Browse: All New Projects, Browse Developers, Understand Markets
- Calculators: True Cost, Investment Returns, Mortgage Calculator
- Guides: New vs Resale, Complete Buying Guide, Talking to Professionals
- CTA: "Explore Projects"
