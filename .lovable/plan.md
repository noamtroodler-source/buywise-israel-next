
# BuyWise Israel Pre-Launch Implementation Plan

## Overview

This plan addresses all critical and high-priority items identified in the pre-launch audit. I'll implement these changes systematically to ensure the platform is launch-ready.

---

## Phase 1: Critical Fixes (Must Complete Before Launch)

### 1.1 Create OG Image for Social Sharing

**Problem:** The `index.html` references `og-image.png` at `https://buywiseisrael.com/og-image.png`, but no such file exists in the `/public` folder. When users share links on WhatsApp, LinkedIn, or Twitter, they'll see a broken or missing image.

**Solution:**
- Create a professional 1200×630px OG image using the generate-hero-image edge function
- Add the image to the `/public` folder
- Ensure both OG and Twitter meta tags reference the correct local path

**Files to create/modify:**
- `public/og-image.png` (new)
- `index.html` (update meta tags to use relative path)

---

### 1.2 Add PWA Manifest & App Icons

**Problem:** No `manifest.json` exists, which means:
- Users can't "install" the site as an app on their phones
- No Apple touch icons for iOS home screen
- Missing theme colors for browser UI

**Solution:**
- Create `public/manifest.json` with BuyWise branding
- Add Apple touch icons (180×180)
- Link manifest in `index.html`
- Add theme-color meta tag

**Files to create/modify:**
- `public/manifest.json` (new)
- `public/apple-touch-icon.png` (new - generated)
- `index.html` (add manifest link and theme-color)

---

### 1.3 Fix Rental Questions Targeting

**Problem:** From the database analysis:
- Rental category has 28 questions but **0** have `is_resale` or `is_new_construction` flags
- This means rental questions could appear on ANY page type

**Solution:**
- Update rental questions to properly target `listing_status: ["for_rent"]` 
- Ensure rental-specific questions like "Is subletting allowed?" and "How is rent indexed?" only show on rental listings
- Add buyer_relevance targeting for renter personas

**Database updates:**
- Update `applies_to` JSONB for all 28 rental questions to include proper listing_status targeting

---

## Phase 2: High Priority Improvements

### 2.1 Google Analytics Integration

**Problem:** No analytics tracking is set up. You have internal tracking (performance_metrics, user_events) but no external analytics for:
- Marketing attribution
- Conversion tracking
- Traffic source analysis

**Solution:**
- Add Google Analytics 4 (GA4) script to `index.html`
- Create a reusable analytics hook for page views and events
- Track key conversions (signups, inquiries, property views)

**Files to create/modify:**
- `index.html` (add GA4 script)
- `src/lib/analytics.ts` (new - analytics helper functions)
- `src/hooks/usePageTracking.ts` (new - route change tracking)

**Note:** This requires you to provide a Google Analytics Measurement ID (G-XXXXXXXXXX). I'll set up the infrastructure, and you can add your ID later.

---

### 2.2 Enhanced Error Boundary with Reporting

**Current State:** The ErrorBoundary exists and looks good, but it:
- Only logs to console
- Doesn't report errors to your `client_errors` table
- Doesn't capture stack traces

**Solution:**
- Enhance ErrorBoundary to report errors to Supabase `client_errors` table
- Add session context for debugging
- Include user-friendly error messages

**Files to modify:**
- `src/components/shared/ErrorBoundary.tsx`

---

### 2.3 Email Function Verification

**Current State:** All 8 email functions exist:
- send-welcome-email ✅
- send-verification-email ✅
- send-price-drop-alert ✅
- send-digest-email ✅
- process-search-alerts ✅
- send-agency-notification ✅
- send-developer-notification ✅
- send-notification ✅

**Verification Plan:**
- Test each function with the curl_edge_functions tool
- Verify RESEND_API_KEY is configured (it is ✅)
- Confirm email templates match brand guidelines

---

## Phase 3: Polish & Optimization

### 3.1 Security Hardening

**Linter Findings:**
1. **Leaked Password Protection Disabled** - Recommend enabling in Cloud settings
2. **One Permissive RLS Policy** - Already resolved per security scan (price_drop_notifications)

**Action:** Document these for you to enable via Cloud settings (cannot be done via code)

---

### 3.2 Questions Data Quality

**Current Distribution:**
```text
Category        | Total | New Construction | Resale Only
construction    | 19    | 17               | 2
pricing         | 22    | 0                | 7  
building        | 20    | 0                | 5  
rental          | 28    | 0                | 0   ← NEEDS FIXING
legal           | 26    | 3                | 3
neighborhood    | 4     | 0                | 1
```

**Fix:** Update rental questions to have proper targeting so they ONLY appear on for_rent listings.

---

## Technical Implementation Details

### Database Updates

```sql
-- Fix rental questions targeting
UPDATE property_questions 
SET applies_to = jsonb_set(
  COALESCE(applies_to, '{}'::jsonb),
  '{listing_status}',
  '["for_rent"]'::jsonb
)
WHERE category = 'rental' 
AND is_active = true;
```

### PWA Manifest Structure

```json
{
  "name": "BuyWise Israel",
  "short_name": "BuyWise",
  "description": "Navigate Israeli real estate with clarity",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [...]
}
```

### Google Analytics Setup

```html
<!-- GA4 Script -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## Implementation Order

1. **OG Image** - Create and add to public folder
2. **PWA Manifest** - Create manifest.json with icons
3. **Update index.html** - Add manifest link, theme-color, fix OG paths
4. **Fix Rental Questions** - Database update for targeting
5. **Google Analytics** - Add tracking infrastructure (placeholder ID)
6. **Enhance ErrorBoundary** - Add Supabase error reporting
7. **Test Email Functions** - Verify all 8 functions work

---

## Post-Implementation Checklist

After I implement these changes:

- [ ] You provide Google Analytics Measurement ID (G-XXXXXXXXXX)
- [ ] Enable leaked password protection in Cloud settings
- [ ] Test complete user journey: browse → signup → save → inquire
- [ ] Share a link on WhatsApp to verify OG image appears
- [ ] Test "Add to Home Screen" on iOS/Android
- [ ] Run Lighthouse audit (target: 90+ scores)

---

## Files Summary

**New Files:**
- `public/manifest.json`
- `public/apple-touch-icon.png` (placeholder/generated)
- `public/og-image.png` (placeholder/generated)
- `src/lib/analytics.ts`
- `src/hooks/usePageTracking.ts`

**Modified Files:**
- `index.html`
- `src/components/shared/ErrorBoundary.tsx`
- `src/App.tsx` (add page tracking)

**Database Updates:**
- Update 28 rental questions with proper targeting flags
