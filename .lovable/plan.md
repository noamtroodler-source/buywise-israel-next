

## Plan: Change Free Plan from 3 Listings to 1 Listing (Agency)

### Current State
- **DB**: Agency free plan has `max_listings: 3`, Developer free plan already has `max_listings: 1`
- **`useSubscription`**: When no subscription row exists, returns `status: 'none'` with `maxListings: null` — free plan limits from DB are never applied
- **`useListingLimitCheck`**: Treats `status: 'none'` as `needsSubscription = true` → blocks creation entirely. The `NEXT_TIER` map also lacks a `free → Starter` entry
- Multiple FAQ/copy references say "free to list" or imply unlimited free access

### Changes

**1. DB Migration — Update agency free plan limit**
- `UPDATE membership_plans SET max_listings = 1 WHERE tier = 'free' AND entity_type = 'agency';`

**2. `useSubscription` — Apply free plan limits for unsubscribed users**
- When no subscription row found, query `membership_plans` for the matching free tier to get actual `max_listings`, `max_seats`, `max_blogs_per_month` instead of returning `null` for all

**3. `useListingLimitCheck` — Allow free users to create within limit**
- Change `needsSubscription` to only be true when there's genuinely no entity (not just no paid subscription)
- Free users with `tier: 'free'` should be allowed to create up to their limit (1 for agency, 1 for developer)
- Add `free: 'Starter'` to the `NEXT_TIER` map
- For free tier, `canCreate` should be `false` when at/over limit (no overage allowed — must upgrade)

**4. `ListingLimitBanner` — Handle free tier messaging**
- When free tier is at limit, show "Upgrade to Starter to list more properties" instead of "Subscription Required"

**5. Copy updates across 4 files:**
- `AgentFAQ.tsx` — Change "listing properties is completely free" to mention the 1 free listing with upgrade path
- `AdvertiseFAQ.tsx` — Update "Is BuyWise Israel free to join?" answer to mention the 1 listing included free
- `AdvertisePricingSection.tsx` — Already dynamic via `buildFeatures()`, will auto-update from DB. No change needed
- `Pricing.tsx` — Already dynamic via `buildFeatures()`. No change needed

**6. `UpgradePromptCard` — Show for free users approaching limit**
- Currently works off `usagePercent >= 80%`. With max=1, at 1/1 = 100% it will trigger. This already works correctly.

### Files touched
1. **DB migration** — 1 UPDATE statement
2. `src/hooks/useSubscription.ts` — Fetch free plan limits for unsubscribed users
3. `src/hooks/useListingLimitCheck.ts` — Free tier logic + NEXT_TIER map
4. `src/components/billing/ListingLimitBanner.tsx` — Free tier copy
5. `src/components/forAgents/AgentFAQ.tsx` — Update copy
6. `src/components/advertise/AdvertiseFAQ.tsx` — Update copy

