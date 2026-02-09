

## Comprehensive Yellow-to-Blue Cleanup

After a deep audit of 51 files, here are the remaining non-semantic yellow/amber usages that should be converted to the primary blue palette. All admin warning states, pending review indicators, tax caution boxes, and alert severity levels will remain yellow as they are semantic.

### Files to Change

**1. `src/components/agency/AgentLeaderboard.tsx` (line 37)**
- Rank 3 medal badge uses amber (decorative, not a warning)
- Change: `text-amber-600 bg-amber-50 border-amber-200` to `text-orange-600 bg-orange-50 border-orange-200` -- or more consistently, a bronze-like neutral. Since the goal is removing yellow: change to `text-stone-500 bg-stone-50 border-stone-200` (neutral bronze tone)

**2. `src/components/city/PriceTrendChart.tsx` (line 21)**
- Second chart line color is amber -- purely decorative
- Change: `hsl(38 92% 50%)` to a teal like `hsl(175 70% 40%)` (uses the existing `--project` color for differentiation)

**3. `src/components/map-search/MapPropertyCard.tsx` (line 86)**
- "Hot" badge on map cards uses amber
- Change: `bg-amber-100 text-amber-700` to `bg-primary/10 text-primary`

**4. `src/components/property/PropertyCard.tsx` (lines 281, 349)**
- "Hot" / "Just Listed" badge and freshness text use amber
- Change badge: `bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300` to `bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary`
- Change freshness text: `text-amber-600 dark:text-amber-400` to `text-primary`

**5. `src/components/admin/AdminNavSection.tsx` (lines 115, 163)**
- Navigation badge counts (e.g., "3 pending") use yellow when inactive -- these are UI elements, not warnings
- Change: `bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500` to `bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary`

### What Stays Yellow (Confirmed Semantic)
These are all correct warning/caution uses and remain unchanged:
- Admin pending review status badges (AdminListingReview, AdminBlogReview, EditProperty, AdminAgents, AdminAgencies)
- Warning announcement type (AdminAnnouncements)
- Tax calculator upgrader timeline and payment caution boxes (PurchaseTaxCalculator)
- Performance monitor "needs improvement" rating (PerformanceMonitorTab)
- Alert severity levels (AdminAlertsPanel)
- Feature flag caution text (AdminFeatureFlags)
- Expiring featured slot warnings (FeaturedProjectSlot)
- Agent verification warnings (EditProperty)
- Sample size warnings (SampleSizeWarning)
- Data staleness indicator (AdminSettings)
- Chapter signal "watch" status (ChapterHeader)
- Blog review "pending" status (BlogReviewCard)
- Agency pending verification badge (AgencyDetailSheet)
- Missing data warnings (ImportNeighborhoods)
- Pending geocode count (SoldTransactionsAdmin)
- System notification type color (NotificationBell) -- represents system alerts
- "Above average" price comparison (RecentNearbySales) -- contextual indicator

### Summary
5 files, approximately 8 lines of changes. All decorative/interactive yellow becomes blue or a neutral tone. All semantic warning yellow stays.

