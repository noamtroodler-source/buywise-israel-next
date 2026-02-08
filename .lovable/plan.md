
# Footer Link Updates & ForDevelopers Page Removal

## Overview
This plan addresses three changes to the footer navigation and removes the ForDevelopers page from the application.

---

## Changes Summary

### 1. Remove Property Type Links from Footer
**Current state:** The "Quick Links" section includes:
- Apartments
- Houses
- Penthouses

**Action:** Remove these three links from the footer (lines 33-41 in Footer.tsx)

---

### 2. Rename "Our Principles" to "About Us"
**Current state:** Link text says "Our Principles" (line 49 in Footer.tsx)

**Action:** Change the text from "Our Principles" to "About Us"

---

### 3. Change "For Developers" to "Register As Developer" & Remove Page
**Current state:** 
- Footer has a link "For Developers" pointing to `/for-developers` 
- There's also a separate "Register as Developer" link pointing to `/developer/register`

**Action:** 
- Remove the "For Developers" link entirely (it's redundant since "Register as Developer" already exists)
- Remove the ForDevelopers page and its route

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/Footer.tsx` | Remove Apartments/Houses/Penthouses links, rename "Our Principles" to "About Us", remove "For Developers" link |
| `src/App.tsx` | Remove the ForDevelopers import and route |
| `supabase/functions/generate-sitemap/index.ts` | Remove `/for-developers` from sitemap |

## File to Delete

| File | Reason |
|------|--------|
| `src/pages/ForDevelopers.tsx` | Page no longer needed |

---

## Technical Details

### Footer.tsx Changes
```text
Quick Links section will become:
- Buy Property
- Rent Property
- Tools & Calculators
- Explore Areas
- About Us (previously "Our Principles")

For Professionals section will become:
- Advertise with Us
- For Agents & Agencies
- Register as Agent
- Register as Developer
```

### App.tsx Changes
- Remove line 44: `const ForDevelopers = lazy(() => import("./pages/ForDevelopers"));`
- Remove line 216: `<Route path="/for-developers" element={<ForDevelopers />} />`

### Sitemap Changes
- Remove the `/for-developers` entry from the static pages array

---

## Impact Assessment
- **SEO:** Any existing links to `/for-developers` will result in 404. Consider adding a redirect to `/developer/register` if external links exist.
- **User flow:** Users can still access developer registration via the "Register as Developer" link which remains in the footer.
