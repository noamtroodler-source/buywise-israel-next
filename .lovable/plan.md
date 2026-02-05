
# Implementation Plan: Pre-Launch Fixes

This plan covers all the items you want implemented. I'll handle them in a logical order.

---

## Phase 1: Quick Code Fixes (5 minutes)

### 1.1 Remove Console.log in useBlogReview
**File:** `src/hooks/useBlogReview.tsx`

Remove line 253:
```typescript
console.log(`Blog notification: ${payload.type} for ${email} - ${payload.postTitle}`);
```

### 1.2 Add Google Maps DNS Prefetch  
**File:** `index.html`

Add after line 16 (after Supabase prefetch):
```html
<link rel="dns-prefetch" href="https://maps.googleapis.com">
```

---

## Phase 2: Security Fixes (20 minutes)

### 2.1 Enable Leaked Password Protection
Use Supabase auth config tool to enable HIBP (Have I Been Pwned) password checking.

### 2.2 Fix 3 Overly Permissive RLS Policies

The tables with `WITH CHECK (true)` on INSERT/UPDATE/DELETE:

| Table | Current Policy | Fix |
|-------|---------------|-----|
| `listing_question_cache` | `ALL: true` | Restrict to service role only (internal cache) |
| `listing_reports` | `INSERT: true` | Require valid session_id (min 10 chars) |
| `user_journeys` | `ALL: true` | Restrict to authenticated users only |

SQL migrations to apply:
```sql
-- Fix listing_question_cache: drop overly permissive policy
DROP POLICY IF EXISTS "Service role can manage cache" ON public.listing_question_cache;
CREATE POLICY "Only internal service can manage cache" 
  ON public.listing_question_cache FOR ALL 
  USING (false) WITH CHECK (false);

-- Fix listing_reports: require valid session
DROP POLICY IF EXISTS "Anyone can create reports" ON public.listing_reports;
CREATE POLICY "Anyone with valid session can create reports" 
  ON public.listing_reports FOR INSERT 
  WITH CHECK (length(session_id) >= 10);

-- Fix user_journeys: require authentication
DROP POLICY IF EXISTS "Service can manage journeys" ON public.user_journeys;
CREATE POLICY "Authenticated users can manage their journey" 
  ON public.user_journeys FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);
```

---

## Phase 3: Legal Page Date Alignment (2 minutes)

### 3.1 Verify Terms of Service Date
**File:** `src/pages/legal/TermsOfService.tsx`

Current status: ✅ Already matches Privacy Policy
- Line 26: `const lastUpdated = 'January 30, 2026';`
- Line 27: `const effectiveDate = 'January 30, 2026';`

**No changes needed** - dates already align with Privacy Policy.

---

## Phase 4: Client Errors Monitoring (30 minutes)

### 4.1 Create Admin Client Errors Page

**New file:** `src/pages/admin/AdminClientErrors.tsx`

This page will:
- Display recent client-side errors from `client_errors` table
- Show error type, page path, browser info, stack trace
- Allow filtering by error type and date range
- Enable marking errors as resolved

### 4.2 Add Route
**File:** `src/App.tsx` or routing config

Add `/admin/errors` route pointing to new component.

### 4.3 Add Sidebar Link
**File:** `src/pages/admin/AdminLayout.tsx` (or sidebar component)

Add "Client Errors" link in admin navigation.

---

## Phase 5: Edge Functions Test & Deploy (15 minutes)

Deploy and verify all 26 edge functions work:
- admin-manage-account
- backfill-coordinates
- bulk-update-neighborhoods
- check-description
- delete-account
- fetch-neighborhood-boundaries
- format-blog-content
- generate-comparison-summary
- generate-hero-image
- generate-listing-questions
- generate-sitemap
- geocode-address
- geocode-sold-transaction
- import-sold-transactions
- process-search-alerts
- seed-additional-properties
- seed-demo-data
- seed-sold-transactions
- send-agency-notification
- send-developer-notification
- send-digest-email
- send-notification
- send-price-drop-alert
- send-verification-email
- send-welcome-email
- verify-email-code

---

## Phase 6: PWA Icons (15 minutes)

### 6.1 Generate Proper Icon Sizes
Create two properly sized icons:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

### 6.2 Update Manifest
**File:** `public/manifest.json`

```json
{
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

## Summary: What Gets Done

| Item | Action | Time |
|------|--------|------|
| Remove console.log in useBlogReview | Code fix | 2 min |
| Add Google Maps DNS prefetch | Code fix | 2 min |
| Enable leaked password protection | Auth config | 2 min |
| Fix 3 permissive RLS policies | DB migration | 10 min |
| Verify legal page dates | Check only | 1 min |
| Create admin client errors page | New page + route | 30 min |
| Test/deploy all edge functions | Deploy | 15 min |
| Create proper PWA icons | Assets + config | 15 min |

**Total estimated time:** ~75 minutes

---

## Items NOT Included (Need Your Action)

1. **Google Analytics ID** - Need your GA4 ID to add
2. **Email DNS Setup** - External to Lovable (do in your domain registrar)
3. **Calculator constants audit** - Requires manual verification of tax rates
4. **Rate limiting** - Nice to have, 1-2 hours, can do post-launch
5. **Favicon verification** - Need to check your existing assets

---

## Files to be Created/Modified

| File | Action |
|------|--------|
| `src/hooks/useBlogReview.tsx` | Remove console.log (line 253) |
| `index.html` | Add Google Maps DNS prefetch |
| `src/pages/admin/AdminClientErrors.tsx` | **NEW** - Error monitoring page |
| `src/App.tsx` | Add admin errors route |
| `src/pages/admin/AdminLayout.tsx` | Add sidebar link |
| `public/manifest.json` | Update icon references |
| `public/icon-192.png` | **NEW** - PWA icon |
| `public/icon-512.png` | **NEW** - PWA icon |
| Database | 3 RLS policy migrations |
| Auth config | Enable leaked password protection |
