

## Profile Page Redesign: "Command Center"

A complete visual and structural overhaul of the Profile page, transforming it from a cluttered settings-style layout into a polished, modern dashboard that matches the design quality of the rest of BuyWise Israel.

---

### Problems with Current Design

1. **Bloated header** -- The welcome header has too many stacked elements (banners, avatar, resume prompt, progress card) creating 250+ pixels of chrome before any content.
2. **Collapsible accordion fatigue** -- Every profile section (Buyer, Mortgage, Locations, Account) is hidden behind identical collapsible cards. Users must click to discover their own data.
3. **Column imbalance** -- The left "Profile Setup" column is heavy with 5 sections + footer; the right "Activity" column is lighter and ends with empty space.
4. **No visual hierarchy** -- Everything has the same card style, same border, same padding. Nothing stands out.
5. **Section headers are wasted space** -- "Profile Setup" and "Activity" are plain text labels that add no value.

---

### New Design: Tab-Based Dashboard

Replace the two-column layout with a **horizontal tab navigation** below a compact header. Three tabs organize all content logically:

```text
[Header: Avatar + Name + Progress Bar + Sign Out]

[Overview]  [My Profile]  [Saved & Alerts]

--- Tab Content ---
```

#### Tab 1: Overview (Default)
The landing tab. Shows activity and research progress at a glance.

- **Quick Stats Row** -- 4 horizontal stat cards (Properties Viewed, Cities Explored, Top City, Saved Properties count) in a single row using primary-tinted backgrounds
- **Recently Viewed Carousel** -- Horizontal scroll of property thumbnails (existing component, slightly wider cards)
- **Research Journey Card** -- Compact motivational summary (existing component)
- **Support Footer** at the bottom

#### Tab 2: My Profile
All profile configuration in one scrollable view. No collapsible sections -- everything is visible.

- **Buyer Profile** -- Inline display with "Edit" button that opens the existing onboarding dialog. Shows tax category, residency, purchase purpose, and journey status as a clean grid. No accordion.
- **Financing Method** -- Mortgage/cash display as an inline card with edit toggle. No accordion.
- **Core Locations** -- Location list with add/delete inline. No accordion.
- **Account Settings** -- Name, phone, email, member since in a grid. Edit inline. Delete account link at bottom.

#### Tab 3: Saved & Alerts
All saved content and notifications.

- **Search Alerts** -- Full list with toggle switches (existing component)
- **Saved Properties** -- Thumbnail grid with link to full favorites page (existing component)
- **Saved Calculations** -- List of saved calculator results (existing component)

---

### Header Redesign

The new header is a single compact strip:

```text
[Avatar] [Welcome, Name (pencil icon)]     [60% ====----] Profile Setup     [Sign Out]
         [email@example.com]
```

- Avatar + name + email on the left
- Linear progress bar (replaces the ring) with percentage label, inline on the right
- Sign Out button far right
- Role banners (Agent/Admin/Agency/Developer) stay above as-is, but are thinner
- "Resume onboarding" prompt stays below header if applicable, unchanged

The progress bar is a simple colored bar (`bg-primary` fill inside `bg-muted` track), much lighter than the SVG ring.

---

### Desktop vs. Mobile

- **Desktop**: Tabs render as horizontal pill tabs below the header. Tab content is single-column, max-w-4xl centered (narrower than current 6xl for better readability).
- **Mobile**: Same tab structure. Tabs are full-width, evenly spaced. Content stacks naturally. Touch-friendly 44px tab height.

---

### Technical Details

**Files modified:**

1. **`src/pages/Profile.tsx`** -- Complete rewrite of the layout. Replace two-column grid with Radix Tabs component. Import all existing section components. Wire tab state.

2. **`src/components/profile/ProfileWelcomeHeader.tsx`** -- Simplify to compact strip. Replace `ProfileCompletionRing` SVG with a linear `Progress` bar. Remove the separate "Progress Card" block (merge into the header row). Keep role banners and resume prompt.

3. **`src/components/profile/sections/BuyerProfileSection.tsx`** -- Remove `ProfileSection` wrapper (no more collapsible). Render content directly in a card with visible data grid + Edit button.

4. **`src/components/profile/sections/MortgageSection.tsx`** -- Same: remove `ProfileSection` wrapper. Show financing data directly in a visible card.

5. **`src/components/profile/sections/LocationsSection.tsx`** -- Same: remove collapsible wrapper. Show locations list directly.

6. **`src/components/profile/sections/AccountSection.tsx`** -- Same: remove collapsible wrapper. Show account info directly.

**New file:**

7. **`src/components/profile/ProfileQuickStats.tsx`** -- A horizontal row of 4 stat cards for the Overview tab. Pulls data from `useRecentlyViewed`, `useFavorites`, and `useSearchAlerts` to show: Properties Viewed, Cities Explored, Saved Properties, Active Alerts. Each is a small card with icon, number, and label.

**Files unchanged (reused as-is):**
- `ResearchJourneyCard.tsx` -- used in Overview tab
- `RecentlyViewedRow.tsx` -- used in Overview tab  
- `AlertsCompact.tsx` -- used in Saved & Alerts tab
- `SavedPropertiesPreview.tsx` -- used in Saved & Alerts tab
- `SavedCalculationsCompact.tsx` -- used in Saved & Alerts tab
- `SupportFooter.tsx` -- used in Overview tab
- `ProfileCompletionRing.tsx` -- kept for potential future use but no longer imported by header

**No database changes. No new dependencies (Radix Tabs already installed).**

---

### Visual Polish

- Cards use `rounded-2xl` instead of `rounded-xl` for a more modern feel
- Stat cards in the Quick Stats row use subtle `bg-gradient-to-br from-primary/5 to-primary/10` backgrounds
- Section cards in My Profile tab have light headers with icon + title visible at all times
- Tab bar uses the existing shadcn/ui Tabs component with custom styling: `bg-muted rounded-lg p-1` pill style
- Consistent `space-y-6` between sections for breathing room
- Max width tightened to `max-w-4xl` for better content density on wide screens

