
# Add a Free Tier to the Pricing Section

## What We're Doing

Adding a "Free" plan as the leftmost card for both Agency and Developer entity types. The free tier acts as the zero-friction entry point — you can list a few properties and get a feel for the platform before committing to a paid plan.

## The 5-Tier Question: Is It Too Many?

With 5 tiers (Free, Starter, Growth, Pro, Enterprise), the key risk is the grid getting cramped. Here's how we solve it:

**Layout Strategy — Enterprise gets visually de-emphasized:**
- The 4 paid cards (Free, Starter, Growth, Pro) form the main grid: `grid-cols-2 lg:grid-cols-4`
- Enterprise sits below as a slim, full-width "contact us" banner — not a 5th equal card
- This way the grid always shows 4 items, which works cleanly at all breakpoints
- No decision paralysis: Free → Starter → Growth → Pro is a clean progression

This is the same pattern used by Linear, Vercel, Loom — the enterprise tier is always treated differently.

## Free Tier Limits (both entity types)

| Limit | Agency Free | Developer Free |
|---|---|---|
| Listings | 3 | 1 project |
| Team seats | 1 | 1 |
| Blog posts/mo | 1 | 1 |
| Price | ₪0 | ₪0 |

## Steps

### 1. Insert Free Tier Rows into the Database

Two new rows via the data insert tool (no schema migration needed — the `tier` column is just `text`):

- `agency` entity, `tier = "free"`, `sort_order = 0`, `price_monthly_ils = 0`, `price_annual_ils = 0`, `max_listings = 3`, `max_seats = 1`, `max_blogs_per_month = 1`
- `developer` entity, `tier = "free"`, `sort_order = 0`, `price_monthly_ils = 0`, `price_annual_ils = 0`, `max_listings = 1`, `max_seats = 1`, `max_blogs_per_month = 1`

### 2. Update `AdvertisePricingSection.tsx`

**Card component changes:**
- Add `isFree` prop to `PricingPlanCard`
- Free tier price display: `"₪0 / mo"` with subtitle `"Forever free, no credit card"`
- Free tier button label: `"Start for Free"` (distinct from paid plan's `"Get Started — it's free"`)
- Free tier has no "Most Popular" badge
- Free tier description: `"Try BuyWise with no commitment"`

**Plan descriptions map — add `free`:**
```
free: "Try BuyWise with no commitment"
```

**buildFeatures — add free tier features:**
- Free shows the same feature list logic (listings, seats, blogs) but we add a note: `"Basic analytics"` for free, no priority placement

**Grid layout change:**
- The main grid becomes `grid-cols-2 lg:grid-cols-4` with `max-w-6xl` — same as now, showing Free/Starter/Growth/Pro
- Enterprise moves out of the grid entirely and becomes a slim banner below the 4 cards

**Enterprise banner (replaces the 5th card):**
```
┌─────────────────────────────────────────────────────────────────┐
│  🏢 Need more? Enterprise plans are fully custom-quoted.        │
│     Talk to us about volume, custom SLAs, and dedicated support │
│                                          [ Contact Sales → ]    │
└─────────────────────────────────────────────────────────────────┘
```
This is a single horizontal `rounded-2xl border` card with text on the left and a button on the right — clean, takes no vertical space, doesn't add to cognitive load.

**Filter logic update:**
- `filteredPlans` currently filters by `entity_type === entityTab`
- Split into: `mainPlans` = non-enterprise filtered plans (ordered by sort_order), `enterprisePlan` = the enterprise plan for this entity type
- Pass only `mainPlans` to the grid, render `enterprisePlan` as the slim banner below

**Skeleton loading:**
- Update skeleton count from `4` to `4` (still 4 — enterprise is handled separately)

**Annual toggle on Free:**
- Free plan ignores billing cycle (price is always ₪0)
- No "Billed annually" note shown for free tier

### 3. `buildFeatures` Updates

Add free tier logic to `buildFeatures`:
```ts
if (plan.tier === "growth" || plan.tier === "pro") features.push("Priority search placement");
if (plan.tier === "pro" || plan.tier === "enterprise") features.push("Priority support");
// New:
if (plan.tier === "starter" || plan.tier === "growth" || plan.tier === "pro") features.push("Analytics dashboard");
```
Free tier gets: listings, 1 seat, 1 blog post/mo — nothing else. Clean and simple.

## Files Changed

| File | Change |
|---|---|
| Database | Insert 2 new free tier rows (agency + developer) |
| `src/components/advertise/AdvertisePricingSection.tsx` | Add free tier card, split enterprise out into a banner, update grid |

No other files need changes — the free tier flows through the existing `handleGetStarted` → sessionStorage → `/auth?tab=signup` path naturally.
