
# Founding Program — Prominent First-Visit Experience

## The Problem

The current Founding Program promotion has two weak touchpoints:
1. A small `FoundingBannerCard` inside the hero section — easily skimmed past because it sits between the headline and the promo code input, competing with other content
2. `FoundingProgramSection` at the very bottom of a long page — only reached by scrollers

First-time visitors price-shopping on `/pricing` have a high chance of missing the promo entirely, or only noticing it after already forming a negative price impression.

## What We're Building

Two complementary surfaces that together ensure the offer is impossible to miss for first-time visitors, without annoying returning visitors:

### 1. First-Visit Modal (appears once, auto-dismissed)
A full Radix `Dialog` that pops up 1.2 seconds after the page loads — only on the very first visit (persisted via `localStorage` key `founding_modal_seen`). This mirrors the exact UX pattern already used by `CookieConsentBanner`.

**Modal content:**
- Large Sparkles icon in a primary-tinted circle
- `"Founding Program — Limited Time"` headline
- 4 benefit rows with icons (60-day trial, 25% discount, 800 credits, case study)
- Prominent `FOUNDING2026` code chip with one-click copy
- Two CTAs: `"Activate Now" → scrolls to #founding` and `"View Plans" → closes modal`
- X close button — dismissing also sets the localStorage key so it won't reappear

**On mobile:** uses a bottom sheet `Vaul` drawer instead of a center dialog, matching the pattern already used elsewhere in the app.

### 2. Sticky Promo Ribbon (replaces the flat FoundingBannerCard)
The existing `FoundingBannerCard` inline card (which sits inside the hero and gets lost) is replaced with a sticky bar at the very top of the page — above the `<Header>` but inside the page context, not in `Layout`. 

The ribbon is:
- Full-width, `bg-primary text-primary-foreground`, 48px tall
- Contains: `✦ Founding Program · 60-day free trial + 25% off + ₪16,000 in credits — Code: FOUNDING2026 [Copy] · [See details ↓]`  
- Sticky: `position: sticky; top: 0; z-index: 40` — stays visible as user scrolls through the plan cards
- Has an X button that dismisses it for the session (sessionStorage so it comes back on next fresh visit)
- Nudges the promo code input to auto-populate `FOUNDING2026` when the user clicks "Activate Now"

The old `FoundingBannerCard` component inside `Pricing.tsx` is removed.

## Files to Change

| File | Type | Change |
|---|---|---|
| `src/components/billing/FoundingProgramModal.tsx` | **New** | First-visit modal + mobile drawer with full benefit breakdown and code copy |
| `src/components/billing/FoundingPromoRibbon.tsx` | **New** | Sticky top ribbon with code, copy button, and session-dismiss |
| `src/pages/Pricing.tsx` | **Edit** | Remove `FoundingBannerCard`, add `<FoundingPromoRibbon>` above the hero, add `<FoundingProgramModal>`, wire auto-populate to promo code input |

## Technical Details

**localStorage key**: `founding_modal_seen` — set to `"1"` on first dismiss/CTA click. Checked on mount; if present, modal never shows.

**sessionStorage key**: `founding_ribbon_dismissed` — set to `"1"` when X is clicked on the ribbon. Resets every browser session so the ribbon returns on the next fresh visit (intentional — the offer is time-limited and the ribbon is lightweight).

**Auto-populate promo code**: The `FoundingProgramModal` receives `onActivate: (code: string) => void` prop. When user clicks "Activate Now", it calls `onActivate('FOUNDING2026')`, which sets `promoCode` state in `Pricing.tsx`, closes the modal, and scrolls to `#founding`. The promo code input then shows as pre-filled with the founding code and the user just needs to click a plan.

**Timing**: Modal opens after 1,200ms (same as CookieConsentBanner's 1,500ms but slightly faster since it's the primary CTA on this page). The ribbon is visible immediately on render.

**No conflict with CookieConsentBanner**: The modal is z-index 50, same as the dialog system. The cookie banner is z-index 50 at the bottom. They don't overlap visually.

**Mobile**: The modal uses a conditional — on screens `< 640px`, renders `<Drawer>` from Vaul instead of `<Dialog>`, sliding up from the bottom. This is the same pattern used in `BoostDialog.tsx`.

## Visual Design

```text
┌─────────────────────────────────────────────────────┐
│ ✦ Founding Program · 60-day trial · Code: FOUNDING2026 [Copy]  [See details ↓]  ✕ │  ← Sticky ribbon (primary bg)
├─────────────────────────────────────────────────────┤
│                    <Header />                        │
│                    <Hero>                            │
│                      Plans & Pricing                 │
│                      [Promo code: FOUNDING2026 ✓]   │ ← auto-filled
│                    </Hero>                           │
│                    ...plan cards...                  │
└─────────────────────────────────────────────────────┘

Modal (first visit, 1.2s delay):
┌─────────────────────────────────────────┐
│  ✕                                      │
│       ✦  Founding Program               │
│       Limited Time — Early Access       │
│                                         │
│  ✓ 60-day free trial, any plan          │
│  ✓ 25% off for 10 months                │
│  ✓ 800 visibility credits (~₪16,000)    │
│  ✓ Featured case study on launch        │
│                                         │
│  Your promo code:                       │
│  ┌─────────────────────┐               │
│  │  FOUNDING2026  [⎘]  │               │
│  └─────────────────────┘               │
│                                         │
│  [Activate Now →]  [View Plans]         │
└─────────────────────────────────────────┘
```

No DB changes. No new hooks. No new routes.
