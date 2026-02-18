
# Blog Credit Reward Visibility — Full Fix Plan

## Confirmed Diagnosis

The credit reward actually **does fire** at the database level — the `grant_blog_approval_credits` trigger correctly inserts a `blog_reward` +10 credit transaction when a post is approved. The `CreditHistoryTable` also has a "Blog Rewards" filter that will show it — so the money lands, but silently.

The three-layer failure:

### Layer 1 — `sendBlogNotification` is a console.log stub
`src/hooks/useBlogReview.tsx` has a `sendBlogNotification` function that:
- Fetches the author's email
- Then just does `console.log(...)` — the comment literally says "For now, we'll create an in-app notification"
- **No row is ever inserted** into `agency_notifications`, `agent_notifications`, or `developer_notifications`

### Layer 2 — `BlogArticleTable` approved row has no credit callout
When a post transitions to `approved`, the card shows a green "Published" badge — but nothing says "+10 credits earned". A user returning to their blog list after approval has no way to know credits landed without digging into the credit history table.

### Layer 3 — Notification bells have no `blog_approved` type
The `AgencyNotificationBell` icon map only handles `lead`, `join_request`, `team`, `system`. Even if a `blog_approved` notification row were inserted, it would fall back to `AlertCircle` with no special styling.

---

## What We're Building

### Fix 1 — Wire `sendBlogNotification` to actually insert rows

Replace the `console.log` stub with real DB inserts into the appropriate notification table based on `authorType`:

- `author_type = 'agent'` → insert into `agent_notifications` (keyed to `agent_id`, looked up from `agents` table via `author_profile_id`)
- `author_type = 'agency'` → insert into `agency_notifications` (keyed to `agency_id = author_profile_id`)
- `author_type = 'developer'` → insert into `developer_notifications` (keyed to `developer_id = author_profile_id`)

The notification for `blog_approved` will read:
- **title**: "Article Approved — +10 Credits Earned 🎉"
- **message**: `"'${postTitle}' is now live. 10 visibility credits have been added to your balance."`
- **type**: `'blog_reward'` (new type value, consistent with the `blog_reward` transaction type already used in `CreditHistoryTable`)
- **action_url**: `/agency/billing` or `/developer/billing` (links to credit history)

This inserts during the admin `useApproveBlogPost` mutation — no schema change needed, just inserting into existing notification tables.

### Fix 2 — Add `blog_reward` type to notification bell icon maps

Update `AgencyNotificationBell` and the equivalent agent/developer notification bell components to handle the `blog_reward` type with a `Coins` icon (already imported in other files) and an amber color class (`text-amber-500`) to visually distinguish credit events from operational alerts.

### Fix 3 — Surface "+10 credits" on the approved card in `BlogArticleTable`

On post cards where `verification_status === 'approved'`, add a small inline chip below the title reading:
- `✦ +10 credits earned` in amber styling (matching the credit reward theme from `CreditHistoryTable`)

This is persistent and visible every time the user views their blog list, not just on the day of approval. It acknowledges the incentive was delivered.

---

## Files to Change

| File | Type | Change |
|---|---|---|
| `src/hooks/useBlogReview.tsx` | Edit | Replace `sendBlogNotification` stub with real DB inserts into `agent_notifications` / `agency_notifications` / `developer_notifications` for `blog_approved` type with credit message |
| `src/components/agency/AgencyNotificationBell.tsx` | Edit | Add `blog_reward` type to icon map (`Coins`) and color map (`text-amber-500`) |
| `src/hooks/useAgentNotifications.tsx` | Edit | Add `'blog_reward'` to the `AgentNotification` type union (TypeScript type only) |
| `src/hooks/useAgencyNotifications.tsx` | Edit | Add `'blog_reward'` to the `AgencyNotification` type union (TypeScript type only) |
| `src/hooks/useDeveloperNotifications.tsx` | Edit | Add `'blog_reward'` to the `DeveloperNotification` type union (TypeScript type only) |
| `src/components/blog/BlogArticleTable.tsx` | Edit | Add amber "+10 credits earned" chip to approved post cards |

**No DB migration needed** — existing notification tables already accept arbitrary `type` string values. The credit itself already lands via the DB trigger.

---

## Technical Notes

- **Credit transaction already fires correctly.** The `grant_blog_approval_credits` trigger is confirmed in the DB functions list and was verified against live data (5 approved posts exist). The fix is purely about surfacing what already happens.
- **`sendBlogNotification` is called from `useApproveBlogPost` only** (the admin approval mutation). It also exists in `useRequestBlogChanges` and `useRejectBlogPost` — those currently also do nothing. This plan only wires the `blog_approved` path since that's the credit reward trigger. The other two can be wired in the same pass for completeness (they would send "Changes Requested" and "Rejected" notifications with action links back to the draft).
- **Agent routing**: agents belong to agencies. The `grant_blog_approval_credits` trigger credits the *agency's* balance when `author_type = 'agent'`. The notification for an agent should go to `agent_notifications` (the agent sees it in their bell), and the credit landing in the agency balance is the correct behavior already in the DB.
- **The `BlogArticleTable` chip is unconditional** — it shows on every approved post regardless of when it was approved, because the credit always lands. It's a permanent indicator of the reward, not a transient toast.
- **No changes to `CreditHistoryTable`** — it already handles `blog_reward` filter correctly.
- **No changes to `grant_blog_approval_credits` DB trigger** — it is already correct.
