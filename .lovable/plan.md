

# Comprehensive Signed-In vs Guest User Experience Strategy

## Executive Summary

This plan establishes a clear differentiation between **logged-in users** (who get personalized, streamlined experiences) and **guests** (who get useful defaults with strategic upsell moments). The core philosophy:

**For Guests**: "Show the value, but make them feel the friction of not being personalized"
**For Signed-In Users**: "Everything knows who they are - calculations, maps, recommendations all just work"

---

## Current State Analysis

### What Already Works Well

| Feature | Guest Experience | Signed-In Experience |
|---------|------------------|---------------------|
| Cost Breakdowns | Cash-first baseline (localStorage) | Profile-based buyer type + mortgage prefs |
| Favorites | Redirects to auth | Full save/alert functionality |
| Location Module | No saved locations | Work/School/Family on map |
| Personalized Recs | Blurred teaser + CTA | Tailored property suggestions |
| Mortgage Settings | LocalStorage (device-only) | Synced to profile (cross-device) |

### Current Gaps

1. **Cost Breakdown Defaults**: Non-logged-in users see generic "First-Time Buyer" rates with no context about why
2. **No Progressive Value Reveal**: Users don't see what they're missing until they hit a hard gate (favorites)
3. **Location Module**: Completely hidden value for guests - no "Add Work Location" teaser
4. **Inline Personalization**: The PersonalizationHeader says "Set up your profile" but doesn't show the *difference* it would make
5. **No "Sample Profile" Demo**: Guests can't see what a personalized experience looks like

---

## Strategic Framework: The Personalization Spectrum

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY                                     │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  GUEST (No Account)                    SIGNED-UP (With Profile)           │
│  ┌─────────────────┐                   ┌─────────────────────────────┐    │
│  │ • Cash baseline │                   │ • Buyer type locked in      │    │
│  │ • Generic rates │  ───Sign Up───►   │ • Mortgage prefs synced     │    │
│  │ • No saved locs │  ───Onboard───►   │ • Saved locations on map    │    │
│  │ • localStorage  │                   │ • Cross-device persistence  │    │
│  │ • "What-if" only│                   │ • "This is YOUR cost"       │    │
│  └─────────────────┘                   └─────────────────────────────┘    │
│                                                                           │
│  FRICTION POINTS                       DELIGHT MOMENTS                    │
│  • "Sign up to save"                   • "Personalized for Oleh Hadash"   │
│  • Limited to 3 searches               • Price drop alerts on favorites  │
│  • No commute times                    • "Based on your budget" filters   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Cost Breakdown Strategy

### Current Defaults

**Guests (No Account)**:
- `include_mortgage: false` (Cash-First)
- `buyer_type: first_time` (assumed)
- No arnona discounts applied

**Signed-In Users**:
- Whatever they set in profile
- Falls back to cash-first if no mortgage prefs set

### Recommended Changes

#### 1.1 Make Guest Baseline Explicit

**Problem**: Guests see numbers but don't know what assumptions are baked in.

**Solution**: Add a subtle "Assumptions" callout for guests:

```
┌────────────────────────────────────────────────────────────────┐
│ 📊 Cost Breakdown                                              │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ ℹ️ Showing estimates for: First-Time Buyer, Paying in Full │   │
│ │    Your situation different? → Set up profile (free)      │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ Due at Signing: ₪185k–220k                                     │
│ Monthly Costs:  ₪1,200–1,800/mo                                │
└────────────────────────────────────────────────────────────────┘
```

#### 1.2 Show "What You'd Save" Teaser

For users who might be Oleh Hadash or upgraders, show the potential difference:

```
┌────────────────────────────────────────────────────────────────┐
│ 💡 Are you a new immigrant (Oleh Hadash)?                      │
│    You could save ₪45,000+ in purchase tax                     │
│    → Create profile to see your real costs                     │
└────────────────────────────────────────────────────────────────┘
```

#### 1.3 Signed-In: "This is YOUR Number" Confidence

For logged-in users with complete profiles, emphasize certainty:

```
┌────────────────────────────────────────────────────────────────┐
│ ✓ Personalized for You                                         │
│                                                                │
│ Purchase Tax:     ₪0                                           │
│ (Oleh Hadash exemption applied)                                │
│                                                                │
│ Monthly Mortgage: ₪8,200–9,400/mo                              │
│ (Based on 30% down, 25-year term)                              │
│                                                                │
│ [Edit mortgage assumptions ▼]                                  │
└────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Location Module Strategy

### Current State

- **Guests**: See map, city anchors, can search custom locations
- **Signed-In**: See saved Work/School/Family locations with commute times

### Recommended Changes

#### 2.1 Guest Location Teaser

When a guest searches for a location (e.g., types in "Google Tel Aviv" for work):

```
┌────────────────────────────────────────────────────────────────┐
│ 📍 Google Tel Aviv - 35 min drive                              │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Want to see this location on every property?              │   │
│ │ Sign up to save "Work" location → See commutes instantly │   │
│ └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

#### 2.2 Show Empty State Value

Even before guests search, show what they could have:

```
┌────────────────────────────────────────────────────────────────┐
│ Your Important Places                                          │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 🏢 Work        Not set     │ 🏫 School      Not set      │   │
│ │ 👨‍👩‍👧 Family      Not set     │                            │   │
│ │                                                          │   │
│ │ Add your key locations to see commute times on every     │   │
│ │ property automatically. [Set up locations →]             │   │
│ └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## Part 3: Global Personalization Indicators

### 3.1 Header Badge for Signed-In Users

Show personalization status in the site header:

```
┌────────────────────────────────────────────────────────────────┐
│ [Logo]                              [Profile: Oleh Hadash ✓]   │
│                                     [Budget: ₪2.5-3.5M]        │
└────────────────────────────────────────────────────────────────┘
```

This reminds users that the entire site is personalized for them.

### 3.2 Floating Context Bar on Listings

On listings pages, show a subtle reminder:

**For Guests**:
```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🔍 Browsing as: First-Time Buyer (assumed)  │  [Personalize →]          │
└──────────────────────────────────────────────────────────────────────────┘
```

**For Signed-In**:
```
┌──────────────────────────────────────────────────────────────────────────┐
│ ✓ Viewing as: Oleh Hadash  │  Budget: ₪2.5-3.5M  │  [Edit in Profile]   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Mortgage vs Cash Baseline Strategy

### Philosophy

**Current**: `include_mortgage: false` by default (Cash-First)
**Recommended**: Keep cash-first for guests, but make mortgage more discoverable

### Reasoning

1. **Cash-first is cleaner**: Shows true "what you need to buy this property" without financing complexity
2. **Most serious buyers need mortgage**: But don't assume it - let them opt in
3. **Mortgage complexity is a signup trigger**: "Want accurate monthly payments? Complete your profile"

### Implementation

#### 4.1 Guest: Cash with Mortgage Preview

```
┌────────────────────────────────────────────────────────────────┐
│ Upfront Costs (Cash Purchase): ₪2,150,000                      │
│ Monthly Ownership: ₪1,800–2,400/mo                             │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 💳 Planning to take a mortgage?                           │   │
│ │ Add down payment + loan term to see monthly payments     │   │
│ │ [Add Mortgage Estimate ▼]                                 │   │
│ │                                                          │   │
│ │ With 25% down, 25-year loan:                             │   │
│ │ Monthly Payment: ~₪8,200–9,400/mo                        │   │
│ │                                                          │   │
│ │ [Save these settings →] (requires free account)          │   │
│ └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

#### 4.2 Signed-In: Respect Their Choice

If user has explicitly set `include_mortgage: true`:
- Show mortgage section expanded by default
- Include monthly payment in the summary

If user has `include_mortgage: false` (cash buyer):
- Don't show mortgage at all
- Label as "Paid in Full" clearly

---

## Part 5: Strategic Signup Triggers

### Current Triggers

| Trigger Point | Current Behavior |
|---------------|------------------|
| Favorite property | Hard gate → auth redirect |
| Save search | Hard gate → auth redirect |
| Mortgage settings | Soft prompt ("Sign up to save") |
| Personalized recs | Blurred teaser |

### Recommended Additional Triggers

#### 5.1 "See Your Price" Trigger

On property cards, show a teaser:

```
┌───────────────────────────┐
│ [Property Image]          │
│                           │
│ ₪2,500,000                │
│ 4 rooms • 110 sqm         │
│                           │
│ Your Cost: ~₪2.6M         │
│ (First-Time Buyer)        │
│ ┌───────────────────────┐ │
│ │ Different? Set profile│ │
│ └───────────────────────┘ │
└───────────────────────────┘
```

#### 5.2 "Third Property Viewed" Nudge

After viewing 3 properties, show:

```
┌────────────────────────────────────────────────────────────────┐
│ You're comparing properties! Want to save them for later?      │
│ [Create Free Account] to save favorites and track price drops │
└────────────────────────────────────────────────────────────────┘
```

#### 5.3 "Calculator Value" Trigger

After using any calculator (mortgage, purchase tax, etc.):

```
┌────────────────────────────────────────────────────────────────┐
│ Great calculation! Want to save this?                          │
│ Sign up to save calculations and apply to properties you view │
└────────────────────────────────────────────────────────────────┘
```

---

## Part 6: Profile Completion Gamification

### Current

Profile.tsx shows `ProfileCompletionRing` tracking completion.

### Recommended Enhancement

Show completion benefits explicitly:

```
┌────────────────────────────────────────────────────────────────┐
│ Profile Completion: 60%                                        │
│ [████████░░░░░░░░░░░░]                                        │
│                                                                │
│ ✓ Buyer type set                                               │
│ ✓ Mortgage preferences saved                                   │
│ ○ Add work location (+15%)                                     │
│   → See commute times on all properties                        │
│ ○ Set budget range (+10%)                                      │
│   → Get "within budget" badges on listings                     │
│ ○ Add school location (+15%)                                   │
│   → Find family-friendly properties faster                     │
└────────────────────────────────────────────────────────────────┘
```

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)

1. Add "Showing estimates for: First-Time Buyer" banner for guests
2. Add "Personalized for You" badge for signed-in users with profile
3. Show "Different buyer type?" link in PersonalizationHeader

### Phase 2: Value Teasers (3-5 days)

1. Location module empty state for guests
2. "Save this location" prompt after guest search
3. Mortgage preview toggle for guests (without saving)

### Phase 3: Strategic Nudges (1 week)

1. Third-property-viewed signup prompt
2. Calculator save prompt
3. Profile completion gamification with specific benefits

### Phase 4: Polish (ongoing)

1. A/B test signup trigger placement
2. Track conversion rates by trigger
3. Refine copy based on user feedback

---

## Files to Modify

### Cost Breakdown Enhancements

| File | Changes |
|------|---------|
| `src/components/property/PropertyCostBreakdown.tsx` | Add guest vs signed-in messaging |
| `src/components/project/ProjectCostBreakdown.tsx` | Add guest vs signed-in messaging |
| `src/components/property/PersonalizationHeader.tsx` | Add "Personalized for [buyer type]" badge |

### Location Module Enhancements

| File | Changes |
|------|---------|
| `src/components/property/PropertyLocation.tsx` | Add empty state for saved locations |
| `src/components/property/SavedLocationsSection.tsx` | Add guest teaser variant |
| `src/components/property/LocationSearchInput.tsx` | Add "Save this location" prompt |

### New Components

| File | Purpose |
|------|---------|
| `src/components/shared/PersonalizationBanner.tsx` | Reusable guest/signed-in context bar |
| `src/components/shared/SignupNudge.tsx` | Configurable signup prompt |
| `src/components/profile/ProfileBenefitsChecklist.tsx` | Completion benefits display |

### Signup Flow

| File | Changes |
|------|---------|
| `src/hooks/usePropertyViewTracking.tsx` | Track view count for third-property nudge |
| `src/components/tools/ToolLayout.tsx` | Add calculator save prompt |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Guest → Signup conversion | +15% |
| Profile completion rate | +25% |
| Return visitor rate (signed-in) | +20% |
| Mortgage calculator → profile save | +30% |
| Location saves per user | +1.5 average |

---

## Summary

The key insight is that **guests should feel the gap** between their generic experience and the personalized one, while **signed-in users should feel the delight** of everything just knowing who they are.

Every cost breakdown, every map, every recommendation should subtly communicate: "This would be better if we knew you."

And for signed-in users: "This is exactly right for YOU."

