
# Blog Quota Hard-Block — Complete Implementation Plan

## Current State Analysis

The blog quota system is **partially implemented** with a critical inconsistency:

**What exists:**
- `useBlogQuotaCheck` hook — correctly returns `canSubmit: false` when `used >= limit`
- `useSubmitForReview` in `useProfessionalBlog.tsx` — has a server-side quota check that throws an error when quota is exceeded (lines 255-258)
- `BlogArticleTable` — receives `canSubmitQuota` prop and hides the Submit button when `false` — this IS a hard-block on existing posts
- `UsageMeters` — shows the blog meter but with no overage cost (correct — blog posts don't have overage pricing, they're hard-capped)

**The 3 gaps that let quota be bypassed:**

1. **"Write Article" buttons are not quota-aware** — On the list pages (`AgentBlog`, `DeveloperBlog`, `AgencyDashboard`) the "Write Article" button links freely to `/*/blog/new` even when `canSubmit` is `false`. A user at quota can still enter the wizard, write their full article, reach the final step, and only then get a server-side error. This is a terrible UX surprise.

2. **The wizard "Submit for Review" button has no quota check** — `AgentBlogWizard.tsx`, `DeveloperBlogWizard.tsx`, and `AgencyBlogWizard.tsx` all call `handleSubmit` with no front-end quota gate. The only protection is the server-side throw inside `useSubmitForReview`, which surfaces as a caught error with no clear UI feedback.

3. **No quota banner in the wizard itself** — If a user somehow reaches the wizard while at quota (e.g. navigated directly), there is no warning until they click Submit.

**Blog posts do NOT get overages** — unlike listings and seats, blog posts are hard-capped at the plan limit per month. No ₪X/post overage model. The `UsageMeters` blog row correctly shows no overage rate. This is a true hard-block.

---

## What We're Building

### Fix 1 — Quota-Aware "Write Article" Button (3 pages)

On the list pages and dashboards, the "Write Article" button must check `canSubmitQuota`:
- If `canSubmit === false`: button is **disabled** with a tooltip: "Monthly blog limit reached (X/X). Resets on the 1st."
- If loading: button shows normal (optimistic)

**Pages to modify:**
- `src/pages/agent/AgentBlog.tsx` — the primary "Write Article" button
- `src/pages/developer/DeveloperBlog.tsx` — same
- `src/pages/agency/AgencyDashboard.tsx` — two blog CTAs (header quick-action + Articles card header)
- `src/pages/agent/AgentDashboard.tsx` — "Add Blog" button
- `src/pages/developer/DeveloperDashboard.tsx` — "Add Blog" button

### Fix 2 — Quota Gate in the Blog Wizards (3 wizards)

In `AgentBlogWizard`, `DeveloperBlogWizard`, and `AgencyBlogWizard`, at the final step (when `isLastStep` is true), the Submit button must:
- Be **disabled** when `canSubmit === false` (quota exceeded)
- Show a clear inline banner above the navigation row explaining why

Each wizard already has access to the profile ID needed for the check:
- Agent wizard: uses `agentProfile` from `useAgentProfile()`
- Developer wizard: uses `developerProfile` from `useDeveloperProfile()`
- Agency wizard: uses `agency` from `useMyAgency()`

We pass those IDs into `useBlogQuotaCheck()` inside the wizard.

### Fix 3 — BlogQuotaBlock Banner Component (new)

A small new component: `src/components/blog/BlogQuotaBanner.tsx`

Used in two contexts:
1. **List pages** — shown above the article table when `canSubmit === false`, replacing the current tiny "Limit reached" badge
2. **Wizards** — shown above the navigation buttons on the final step when at quota

Content:
```
⛔ Monthly blog limit reached — X of X posts used
Your quota resets on [1st of next month]. Upgrade your plan to publish more articles this month.
[Upgrade Plan →]  (links to /pricing)
```

Design: red-tinted card matching the `OverageConsentBanner` style, but without a checkbox (no overage acceptance needed — it's a true block).

### Fix 4 — UsageMeters Blog Row Enhancement

Currently the blog meter row shows `X/Y this month` with no reset date hint and no "limit reached" visual state. When `used >= limit`:
- Progress bar turns red (already handled by `getColor()` since `isOver` uses `current > max`, but at exactly `max` it's `percent === 100` which returns `bg-destructive` via the `>= 100` check — actually already correct)
- Add a line: "Limit reached — resets [Month 1]"

This is a minor enhancement to `UsageMeters` — one extra line when `blog.used >= blog.limit`.

---

## Files to Modify/Create

| File | Type | Change |
|---|---|---|
| `src/components/blog/BlogQuotaBanner.tsx` | New | Reusable hard-block banner with reset date and upgrade CTA |
| `src/pages/agent/AgentBlog.tsx` | Edit | Disable "Write Article" button + show `BlogQuotaBanner` when at quota |
| `src/pages/developer/DeveloperBlog.tsx` | Edit | Same |
| `src/pages/agency/AgencyDashboard.tsx` | Edit | Disable 2 blog CTAs + show `BlogQuotaBanner` in Articles card |
| `src/pages/agent/AgentDashboard.tsx` | Edit | Disable "Add Blog" button when at quota |
| `src/pages/developer/DeveloperDashboard.tsx` | Edit | Same |
| `src/pages/agent/AgentBlogWizard.tsx` | Edit | Add `useBlogQuotaCheck`, disable Submit on final step, show banner |
| `src/pages/developer/DeveloperBlogWizard.tsx` | Edit | Same |
| `src/pages/agency/AgencyBlogWizard.tsx` | Edit | Same |
| `src/components/billing/UsageMeters.tsx` | Edit | Add "Limit reached — resets [date]" line when blog at quota |

---

## Technical Notes

- `useBlogQuotaCheck` takes `authorType` and `profileId` — wizards already have the profile data loaded, so the hook can be called there without an extra fetch
- The reset date is always the 1st of the following month — computed client-side: `new Date(year, month + 1, 1)` formatted as "March 1"
- `isEditMode` wizards (editing an existing draft) are NOT blocked — quota only applies to new submissions; `canSubmit` from the hook correctly excludes the current post being re-submitted (the server-side check uses `.neq('id', postId)`)
- Dashboard "Add Blog" buttons for agents and developers fire before the profile is loaded — we use `isLoading` from the quota check to keep them enabled while loading (optimistic), disabling only when definitively `canSubmit === false && !isLoading`
- No database changes required — the quota check already reads from `blog_posts` and `subscriptions`
- No new secrets or edge functions needed
