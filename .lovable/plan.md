

## Comprehensive Email Notification System Plan

### Current State Analysis

**What's Already Built:**
- **Resend Integration**: API key configured (`RESEND_API_KEY` in secrets)
- **Edge Functions**: Two email functions exist:
  - `send-notification` - Handles agent notifications (listing approved/rejected, inquiries, expiring listings)
  - `send-verification-email` - Sends 6-digit verification codes for professional registration
- **Database Infrastructure**:
  - `price_drop_notifications` table with trigger on `properties.price` changes
  - `agent_notifications` table for in-app notifications
  - `developer_notifications` table for in-app notifications
  - `search_alerts` table with frequency preferences (instant/daily/weekly)
  - Notification preference columns on `agents`, `developers`, `agencies` tables
- **UI Settings**: Agent settings page has toggle switches for email preferences

**What's Missing:**
- No scheduled jobs (pg_cron extension not enabled)
- No email sending for price drop alerts (trigger creates DB record only)
- No search alert emails (system saves alerts but doesn't process them)
- No welcome/onboarding emails
- No weekly digest emails
- No buyer notification preferences in profiles table
- No email for agency team notifications
- No developer email notifications (only in-app)
- Currently sending from `@resend.dev` domain (needs custom domain for production)

---

### Email Categories & Implementation Plan

#### Phase 1: Critical User-Facing Emails

**1. Price Drop Alert Emails**
- **Trigger**: Database trigger already creates records in `price_drop_notifications`
- **Gap**: No email is actually sent
- **Solution**: Create `send-price-drop-alert` edge function that gets called by the trigger or via a scheduled job

**2. Search Alert Emails (New Listings Matching Criteria)**
- **Frequency**: Instant, Daily, or Weekly based on user preference
- **Solution**: Create `process-search-alerts` edge function
- **Requires**: Enable pg_cron extension for scheduled processing

**3. Welcome Emails**
- For new users after signup/onboarding
- Create `send-welcome-email` edge function

---

#### Phase 2: Professional Notifications

**4. Agent Emails** (Partially exists in `send-notification`)
- Listing approved ✅ (exists)
- Listing rejected ✅ (exists)
- Changes requested ✅ (exists)
- New inquiry ✅ (exists)
- Listing expiring ✅ (exists)
- Weekly performance digest ❌ (needs creation)

**5. Developer Emails**
- Project approved/rejected
- New project inquiry
- Project expiring soon

**6. Agency Emails**
- New agent join request
- Team performance digest

---

#### Phase 3: Buyer Profile & Preferences

**7. Add Buyer Email Preferences to Database**
- Add columns to `profiles` or create dedicated table
- Preferences: price drops, search alerts, weekly recommendations

---

### Database Changes Required

```sql
-- Enable pg_cron extension for scheduled emails
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add buyer email preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notify_email boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_price_drops boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_search_alerts boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_recommendations boolean DEFAULT false;

-- Track when alerts were last processed
ALTER TABLE public.search_alerts
ADD COLUMN IF NOT EXISTS last_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;

-- Track when price drop emails were sent
ALTER TABLE public.price_drop_notifications
ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;
```

---

### New Edge Functions to Create

**1. `send-price-drop-alert/index.ts`**
- Fetches unprocessed price drop notifications
- Checks user's email preferences
- Sends personalized email with property details
- Marks notification as email_sent

**2. `process-search-alerts/index.ts`**
- Called by cron job (hourly for instant, daily at 8am, weekly on Mondays)
- Queries new listings matching each alert's filters
- Groups by user to send single digest email
- Updates `last_sent_at` timestamp

**3. `send-welcome-email/index.ts`**
- Called after signup/onboarding completion
- Personalized based on user type (buyer vs professional)

**4. `send-developer-notification/index.ts`**
- Mirror of agent notifications for developer users

**5. `send-digest-email/index.ts`**
- Weekly agent/developer performance summary
- Includes views, inquiries, listing health

---

### Scheduled Jobs (via pg_cron)

| Job | Schedule | Function |
|-----|----------|----------|
| Process instant alerts | Every 5 min | `process-search-alerts?frequency=instant` |
| Process daily alerts | 8:00 AM daily | `process-search-alerts?frequency=daily` |
| Process weekly alerts | Monday 8:00 AM | `process-search-alerts?frequency=weekly` |
| Send price drop emails | Every 10 min | `send-price-drop-alert` |
| Agent weekly digest | Sunday 9:00 AM | `send-digest-email?type=agent` |
| Developer weekly digest | Sunday 9:00 AM | `send-digest-email?type=developer` |

---

### Email Templates Summary

| Email Type | Recipient | Trigger |
|------------|-----------|---------|
| Verification Code | Agents/Developers/Agencies | Registration |
| Welcome | All users | Signup complete |
| Listing Approved | Agents | Admin approval |
| Listing Rejected | Agents | Admin rejection |
| Changes Requested | Agents | Admin feedback |
| New Inquiry | Agents/Developers | Buyer contact |
| Listing Expiring | Agents/Developers | 7 days before expiry |
| Price Drop Alert | Buyers | Price decreases |
| New Matches | Buyers | New listings match alert |
| Weekly Digest | Professionals | Scheduled |
| Project Approved | Developers | Admin approval |
| Agent Joined | Agencies | Agent uses invite |

---

### Custom Domain Setup (Production)

Before going live, you'll need to verify a custom domain in Resend:
1. Add domain in Resend dashboard (resend.com/domains)
2. Add DNS records (SPF, DKIM, DMARC)
3. Update edge functions from `notifications@resend.dev` to `notifications@buywise.co.il`

---

### Implementation Order

**Immediate (High Impact):**
1. Enable pg_cron and pg_net extensions
2. Create `send-price-drop-alert` function
3. Create `process-search-alerts` function
4. Add buyer notification preferences to profiles

**Short-term:**
5. Create welcome email function
6. Create developer notification function
7. Set up cron jobs

**Medium-term:**
8. Weekly digest emails for professionals
9. Agency team notifications
10. Custom domain verification

---

### Technical Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                      TRIGGER EVENTS                         │
├─────────────────────────────────────────────────────────────┤
│ Property Price Update ─────► notify_price_drop() trigger    │
│                              │                              │
│                              ▼                              │
│                   price_drop_notifications                  │
│                              │                              │
│ ┌────────────────────────────┼────────────────────────────┐ │
│ │                     CRON JOBS                           │ │
│ │ Every 10 min ──────────────┼──► send-price-drop-alert   │ │
│ │ Every 5 min  ──────────────┼──► process-search-alerts   │ │
│ │ Daily 8am    ──────────────┼──► process-search-alerts   │ │
│ │ Weekly Mon   ──────────────┼──► process-search-alerts   │ │
│ │ Weekly Sun   ──────────────┼──► send-digest-email       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                              │                              │
│                              ▼                              │
│                    RESEND API (emails)                      │
└─────────────────────────────────────────────────────────────┘
```

---

### What You'll Need To Do

1. **Verify custom domain** in Resend for production emails
2. **Approve database migrations** when I create them
3. **Test email delivery** in preview before publishing

Would you like me to start implementing this system? I recommend beginning with Phase 1 (Price Drop Alerts + Search Alerts) as these directly impact buyer engagement.

