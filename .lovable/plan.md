

# Phase B: Credit System Fixes

## Overview
Three fixes to make the credit economy work correctly:
1. **Bonus credits** included when purchasing credit packages (currently only base credits are sent to Stripe metadata)
2. **Blog approval reward** (+10 credits, Engine 2 only, expire end-of-month)
3. **Blog quota enforcement** (block submission when monthly limit reached)

---

## Change 1: Fix Bonus Credit Calculation in Checkout

**Problem**: `stripe-credit-checkout` sends `credits: pkg.credits_included` to Stripe metadata, but `credits_included` is only the base amount (e.g., 150). The `bonus_percent` column (e.g., 10%) is never applied, so the webhook grants only base credits.

**Fix**: In `supabase/functions/stripe-credit-checkout/index.ts`, compute total credits as `credits_included + floor(credits_included * bonus_percent / 100)` and pass that as the metadata `credits` value.

```
Line 121 change:
credits: pkg.credits_included.toString()
  ->
credits: Math.floor(pkg.credits_included * (1 + (pkg.bonus_percent || 0) / 100)).toString()
```

Also update the description in the webhook to reflect total credits granted (already uses the metadata credits value, so no webhook change needed).

---

## Change 2: Blog Approval Credit Reward (DB Trigger)

**What**: When an admin approves a blog post (sets `verification_status = 'approved'`), automatically grant +10 credits to the author's entity. Credits expire at the end of the current calendar month.

**How**: A database trigger on `blog_posts` that fires on UPDATE, checks if `verification_status` changed to `'approved'`, resolves the author's entity (agency or developer), and calls `record_credit_purchase` with:
- `p_amount: 10`
- `p_transaction_type: 'blog_reward'`
- `p_credit_type: 'visibility'` (Engine 2 only designation)
- `p_expires_at: end of current calendar month`

This is a database trigger + function -- no application code changes needed for the grant itself.

**Migration SQL**:
- Create function `grant_blog_approval_credits()`
- Create trigger `on_blog_approval` on `blog_posts` AFTER UPDATE

The function will:
1. Check `NEW.verification_status = 'approved' AND (OLD.verification_status IS DISTINCT FROM 'approved')`
2. Look up the author's entity: if `author_type = 'agent'`, find the agent's `agency_id` and use `entity_type = 'agency'`; if `author_type = 'agency'`, use `author_profile_id` directly; if `author_type = 'developer'`, use `entity_type = 'developer'` with `author_profile_id`
3. Call `record_credit_purchase` with the resolved entity and `expires_at = date_trunc('month', now()) + interval '1 month' - interval '1 second'`

---

## Change 3: Blog Quota Enforcement

**What**: Before an author can submit a blog post for review, check if they've already used their monthly blog quota.

**Where**: In `src/hooks/useProfessionalBlog.tsx` -- the `useSubmitForReview` mutation.

**How**:
1. Create a new hook `useBlogQuotaCheck(authorType, profileId)` that:
   - Queries `blog_posts` counting posts this calendar month where `author_profile_id = profileId` AND `verification_status IN ('pending_review', 'approved')` (submitted or approved, not drafts)
   - Queries the user's subscription to get `max_blogs_per_month` from their plan
   - Returns `{ used, limit, canSubmit, isLoading }`

2. Update `useSubmitForReview` to accept the quota check result and throw an error if at limit before calling the Supabase update.

3. In the blog editor UI, show a small usage indicator: "2/4 blog posts used this month" and disable the "Submit for Review" button with a tooltip when at limit.

**Files modified**:
- `src/hooks/useProfessionalBlog.tsx` -- add `useBlogQuotaCheck` hook, update `useSubmitForReview`

**Files to find and update** (blog editor component -- wherever the submit button lives):
- Show quota usage indicator near the submit button
- Disable submit when quota exhausted with upgrade CTA

---

## Change 4: Credit Expiration Display

**What**: Show expiring credits in the dashboard so users know about time-limited credits.

**How**: Add a small query in `useSubscription.ts` (or a new `useCreditDetails` hook) that fetches credit transactions with `expires_at IS NOT NULL AND expires_at > now()` grouped to show "X credits expiring on [date]".

**Where displayed**: Wherever the credit balance is shown (billing area, dashboard).

---

## Technical Summary

| Item | Type | File(s) |
|------|------|---------|
| Bonus credit calc | Edge function fix | `supabase/functions/stripe-credit-checkout/index.ts` |
| Blog reward trigger | DB migration | New migration SQL |
| Blog quota hook | New hook | `src/hooks/useProfessionalBlog.tsx` |
| Submit button gating | UI update | Blog editor component (to be identified) |
| Credit expiration display | New hook + UI | `src/hooks/useSubscription.ts` or new hook |

## Execution Order
1. Fix bonus credit calculation in edge function (quick, critical)
2. Create blog reward trigger via migration
3. Add blog quota check hook and wire into submit flow
4. Add expiring credits display
