

## Behavioral Retention Emails

Two automated email triggers based on user activity data you already collect.

### Trigger 1: "New matches in your area" (dormant saver)

**Who:** Registered users who have saved at least 1 property AND have `buyer_profiles.target_cities` set AND haven't had a `content_visits` or `property_views` entry in the last 14-21 days.

**What:** A single email showing 2-3 new listings in their target city that match their saved property types/budget. Subject line like "3 new listings in Netanya this week." Warm, not creepy.

**Cadence:** Check daily, but only send once per user per 30-day window.

### Trigger 2: "Continue your research" (guide reader who stalled)

**Who:** Registered users who have 2+ `content_visits` rows with `content_type = 'guide'` AND most recent guide visit was 10-21 days ago AND haven't received a retention email in the last 30 days.

**What:** A short email suggesting the next logical guide based on what they read. E.g., if they read the mortgage guide, suggest the true cost guide. Subject: "People who read our mortgage guide found this useful."

### Technical Implementation

#### 1. Database: `retention_emails_log` table + `last_active_at` on profiles

**New table `retention_emails_log`:**
- `id` UUID PK
- `user_id` UUID references auth.users
- `trigger_type` TEXT ('dormant_saver' | 'guide_stalled')
- `email_sent_to` TEXT
- `metadata` JSONB (store which properties/guides were included)
- `created_at` TIMESTAMPTZ

RLS: no client access needed, service-role only.

**Add `last_active_at` to `profiles`:**
- New column, updated via a lightweight DB trigger on `property_views` and `content_visits` inserts.

#### 2. Edge Function: `process-retention-emails`

Single edge function that handles both triggers:

1. **Dormant saver logic:**
   - Query users with favorites + `buyer_profiles.target_cities` where `profiles.last_active_at < now() - 14 days`
   - Check `retention_emails_log` to ensure no email sent to this user in the last 30 days
   - Fetch 2-3 recent published properties in their target city matching their budget range
   - If matches exist, send via Resend and log

2. **Guide stalled logic:**
   - Query users with 2+ guide `content_visits` where max `last_visited_at < now() - 10 days`
   - Check `retention_emails_log` for 30-day cooldown
   - Map their last guide read to a "next best" guide (hardcoded mapping)
   - Send via Resend and log

Both use the existing brand footer and "trusted friend" voice.

#### 3. Cron Job

Schedule `process-retention-emails` to run daily at 8 AM Israel time (5 AM UTC):
```text
0 5 * * *  →  process-retention-emails
```

#### 4. DB trigger to keep `last_active_at` fresh

A trigger on `property_views` INSERT and `content_visits` INSERT/UPDATE that does:
```sql
UPDATE profiles SET last_active_at = now() WHERE id = NEW.user_id;
```

This is lightweight and gives us a single column to query against instead of joining multiple tables.

### Guide Progression Map (hardcoded in edge function)

```text
buying-in-israel  →  purchase-tax
purchase-tax      →  true-cost
true-cost         →  talking-to-professionals
talking-to-pros   →  mortgages
mortgages         →  new-vs-resale
new-vs-resale     →  rent-vs-buy
rent-vs-buy       →  buying-in-israel (full circle)
```

### Email Design

Both emails follow existing brand patterns:
- White body background, max-width 600px
- Primary blue (#2563eb) for CTAs
- Standard brand footer
- Unsubscribe via profile `notify_recommendations` toggle
- Short, warm, no-pressure copy

### Files to create/modify

1. **Migration:** Add `last_active_at` to profiles, create `retention_emails_log` table, create trigger for activity tracking
2. **`supabase/functions/process-retention-emails/index.ts`:** New edge function
3. **`supabase/config.toml`:** Add function config
4. **Cron job:** Via SQL insert (daily at 5 AM UTC)

