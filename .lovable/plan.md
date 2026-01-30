
## Mobile-First Profile Page Redesign

### Current Issues

Based on the code analysis, the Profile page has several mobile UX problems:

1. **Two-column layout stays stacked but with awkward spacing** - Uses `lg:grid-cols-[1fr,380px]` which stacks on mobile, but the Activity column appears below all Profile Setup sections, creating a very long scroll
2. **Large container padding** - `py-6` and `container` add extra margin that wastes mobile screen space
3. **Welcome header is cramped** - The avatar, name, and sign-out button can feel tight on small screens
4. **Progress card not optimized** - Horizontal layout on mobile can overflow
5. **Section headers redundant** - "Profile Setup" and "Activity" headings add visual noise on mobile
6. **Recently Viewed carousel** - Scroll buttons are hover-based, invisible on touch devices

---

### Solution: Mobile-Optimized Single-Column Layout

**On Mobile (<768px):**
- Reduce page padding for edge-to-edge feel
- Interleave Activity cards between Profile sections for better content distribution
- Make the progress card more compact
- Hide section headers on mobile (content is self-explanatory)
- Always show carousel navigation arrows on mobile

---

### Visual Design (Mobile)

```text
┌─────────────────────────────────────┐
│ [Avatar] Welcome back, John     [↪] │
│          john@email.com             │
├─────────────────────────────────────┤
│ ○ 60%  Profile Setup                │
│        Next: Add your mortgage      │
└─────────────────────────────────────┘

┌─ Buyer Profile ─────────── ✓ ──────┐
│ First-time Buyer                    │
│ [▼ Expand]                          │
└─────────────────────────────────────┘

┌─ Search Alerts ────────────────────┐
│ 🔔  2 active                        │
│     Tel Aviv · Jerusalem            │
└─────────────────────────────────────┘

┌─ Mortgage Pre-Approval ──── ○ ─────┐
│ Not set up yet                      │
│ [▼ Expand]                          │
└─────────────────────────────────────┘

┌─ Saved Properties ─────────────────┐
│ [img] [img] [img]   3 saved         │
└─────────────────────────────────────┘

┌─ Core Locations ──────────── ✓ ────┐
│ 2 saved                             │
│ [▼ Expand]                          │
└─────────────────────────────────────┘

┌─ Recently Viewed ──────────────────┐
│ ◀ [img] [img] [img] [img] ▶         │
└─────────────────────────────────────┘

┌─ Account Settings ─────────────────┐
│ John Doe                            │
│ [▼ Expand]                          │
└─────────────────────────────────────┘

┌─ Saved Calculations ───────────────┐
│ Mortgage · ₪8,500/mo                │
│ Affordability · ₪2.5M               │
└─────────────────────────────────────┘
```

---

## Technical Implementation

### File 1: `src/pages/Profile.tsx`

**Changes:**
1. Import `useIsMobile` hook
2. Reduce container padding on mobile: `py-4 md:py-6` 
3. On mobile, interleave Activity components between Profile sections for better scroll distribution
4. Hide section headers on mobile (redundant with card titles)

**Mobile Layout Structure:**
```tsx
{isMobile ? (
  <div className="space-y-3">
    {/* Buyer Profile */}
    <BuyerProfileSection />
    
    {/* Alerts - surfaced early */}
    <AlertsCompact />
    
    {/* Mortgage */}
    <MortgageSection />
    
    {/* Saved Properties */}
    <SavedPropertiesPreview />
    
    {/* Locations */}
    <LocationsSection />
    
    {/* Recently Viewed */}
    <RecentlyViewedRow />
    
    {/* Account */}
    <AccountSection />
    
    {/* Saved Calculations */}
    <SavedCalculationsCompact />
    
    {/* Support Footer */}
    <SupportFooter ... />
  </div>
) : (
  // Keep existing two-column desktop layout
)}
```

---

### File 2: `src/components/profile/ProfileWelcomeHeader.tsx`

**Changes:**
1. Make avatar smaller on mobile: `h-12 w-12 md:h-14 md:w-14`
2. Reduce welcome text size on mobile: `text-xl md:text-2xl`
3. Compact progress card: tighter padding on mobile `p-3 md:p-4`
4. Progress ring uses `sm` size on mobile

---

### File 3: `src/components/profile/RecentlyViewedRow.tsx`

**Changes:**
1. Always show scroll arrows on mobile (not just on hover)
2. Smaller arrow buttons on mobile
3. Add touch-friendly tap targets

---

### File 4: `src/components/profile/ProfileSection.tsx`

**Changes:**
1. Slightly reduce padding on mobile: `p-3 md:p-4`
2. Smaller icon container on mobile: `h-8 w-8 md:h-9 md:w-9`

---

### File 5: Activity Cards (Minor Tweaks)

**Files:** `AlertsCompact.tsx`, `SavedPropertiesPreview.tsx`, `SavedCalculationsCompact.tsx`

**Changes:**
- Reduce padding on mobile: `p-3 md:p-4`
- Consistent with edge-to-edge mobile design pattern

---

## Summary of Key Changes

| Component | Mobile Change |
|-----------|---------------|
| `Profile.tsx` | Single-column interleaved layout, reduced padding, hide section headers |
| `ProfileWelcomeHeader.tsx` | Smaller avatar, compact text, tighter progress card |
| `RecentlyViewedRow.tsx` | Always-visible carousel arrows |
| `ProfileSection.tsx` | Tighter padding and smaller icons |
| Activity Cards | Consistent reduced padding |

---

## Files to Modify

1. `src/pages/Profile.tsx` - Main layout restructure for mobile
2. `src/components/profile/ProfileWelcomeHeader.tsx` - Header compacting
3. `src/components/profile/RecentlyViewedRow.tsx` - Touch-friendly carousel
4. `src/components/profile/ProfileSection.tsx` - Tighter mobile padding
5. `src/components/profile/AlertsCompact.tsx` - Mobile padding
6. `src/components/profile/SavedPropertiesPreview.tsx` - Mobile padding
7. `src/components/profile/SavedCalculationsCompact.tsx` - Mobile padding
