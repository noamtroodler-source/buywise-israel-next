

## Email System Implementation Plan

### Domain Configuration ✅
Your domain `buywiseisrael.com` is verified and ready to use with `hello@buywiseisrael.com` as the sender.

---

### Step 1: Update All Existing Edge Functions

Update the sender address from `@resend.dev` to your verified domain in 4 files:

| File | Current | Updated |
|------|---------|---------|
| `send-notification/index.ts` | `notifications@resend.dev` | `hello@buywiseisrael.com` |
| `send-verification-email/index.ts` | `onboarding@resend.dev` | `hello@buywiseisrael.com` |
| `send-price-drop-alert/index.ts` | `notifications@resend.dev` | `hello@buywiseisrael.com` |
| `process-search-alerts/index.ts` | `notifications@resend.dev` | `hello@buywiseisrael.com` |

**Change details:**
```typescript
// Before
from: "BuyWise Israel <notifications@resend.dev>"

// After  
from: "BuyWise Israel <hello@buywiseisrael.com>"
```

---

### Step 2: Create Phase 2 Email Functions

Build 4 new edge functions (all using the verified domain from the start):

1. **`send-developer-notification/index.ts`**
   - Notification types: `project_approved`, `project_rejected`, `changes_requested`, `new_inquiry`, `project_expiring`
   - Fetches developer from `developers` table
   - Checks notification preferences before sending

2. **`send-agency-notification/index.ts`**
   - Notification types: `agent_joined`, `agent_left`, `new_lead`, `weekly_summary`
   - Sends to agency admin email

3. **`send-welcome-email/index.ts`**
   - Personalized onboarding emails based on user type (Buyer, Agent, Developer, Agency)
   - Called after signup completion

4. **`send-digest-email/index.ts`**
   - Weekly performance reports for agents and developers
   - Includes views, inquiries, active listings

**Update config.toml** to register new functions:
```toml
[functions.send-developer-notification]
verify_jwt = false

[functions.send-agency-notification]
verify_jwt = false

[functions.send-welcome-email]
verify_jwt = false

[functions.send-digest-email]
verify_jwt = false
```

---

### Step 3: Enable Scheduled Jobs

After the functions are ready, enable `pg_cron` and `pg_net` extensions for automated email processing:

| Job | Schedule | Purpose |
|-----|----------|---------|
| Instant Alerts | Every 5 min | Process search alerts (instant frequency) |
| Daily Alerts | 8:00 AM | Process daily search digests |
| Weekly Alerts | Monday 8 AM | Process weekly search digests |
| Price Drops | Every 10 min | Send price drop notifications |
| Weekly Digest | Sunday 9 AM | Agent/Developer performance reports |

---

### Summary of All Emails When Complete

| Email Type | Recipient | When Sent |
|------------|-----------|-----------|
| Verification Code | Professionals | During registration |
| Listing Approved/Rejected | Agents | After admin review |
| New Inquiry | Agents | When buyer contacts |
| Listing Expiring | Agents | 7 days before expiry |
| Price Drop Alert | Buyers | When favorited property drops price |
| Search Matches | Buyers | New listings match saved alert |
| Welcome Email | All users | After signup |
| Project Status | Developers | After admin review |
| Agent Joined | Agencies | When agent uses invite |
| Weekly Digest | Professionals | Sunday morning |

---

### Files to Modify
- `supabase/functions/send-notification/index.ts`
- `supabase/functions/send-verification-email/index.ts`
- `supabase/functions/send-price-drop-alert/index.ts`
- `supabase/functions/process-search-alerts/index.ts`
- `supabase/config.toml`

### Files to Create
- `supabase/functions/send-developer-notification/index.ts`
- `supabase/functions/send-agency-notification/index.ts`
- `supabase/functions/send-welcome-email/index.ts`
- `supabase/functions/send-digest-email/index.ts`

