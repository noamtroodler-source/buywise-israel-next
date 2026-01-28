

# Elevate Blog & Rename "More" to "Company"

## Summary
Move Blog to top-level navigation and convert the "More" dropdown into a focused "Company" dropdown with just About and Contact.

---

## Changes Overview

### Desktop Navigation (Header.tsx lines 69-86)

**Current order:**
```
Buy | Rent | Projects | Areas | Advertise | More (Blog, About, Contact)
```

**New order:**
```
Buy | Rent | Projects | Areas | Blog | Advertise | Company (About, Contact)
```

**Changes:**
- Add a new top-level `<Link to="/blog">` between Areas and Advertise
- Keep `<MoreNav />` but it will now be called "Company"

---

### MoreNav Component Refactor

**File:** `src/components/layout/MoreNav.tsx`

1. Change trigger text from "More" to "Company"
2. Remove the "Company" section header (since the dropdown IS the company section)
3. Remove Blog from the list - keep only About and Contact
4. Simplify width from 200px to 180px (fewer items need less space)

**Updated structure:**
```tsx
<NavigationMenuTrigger>
  Company
</NavigationMenuTrigger>
<NavigationMenuContent>
  <div className="rounded-xl border bg-popover shadow-xl w-[180px]">
    <div className="p-3">
      <ul className="space-y-1">
        <li>About - Our story</li>
        <li>Contact - Get in touch</li>
      </ul>
    </div>
  </div>
</NavigationMenuContent>
```

---

### Mobile Menu (Header.tsx lines 391-426)

The mobile menu already has Blog, About, and Contact as separate links - no changes needed there. The structure already supports this layout.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/Header.tsx` | Add Blog link between Areas and Advertise in desktop nav (line 78-79) |
| `src/components/layout/MoreNav.tsx` | Rename to "Company", remove Blog, remove section header |

---

## Final Desktop Nav Structure

```
Buy | Rent | Projects | Areas | Blog | Advertise | Company
 ^      ^       ^        ^       ^        ^           ^
mega  mega    mega    simple  simple   primary    dropdown
menu  menu    menu    link    link     link      (About, Contact)
```

---

## Result
- Blog is now a prominent top-level link (more visibility for content)
- "Company" is an accurate label for About and Contact
- Cleaner semantic grouping
- No confusing category mismatch

