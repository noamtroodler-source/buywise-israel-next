
# Add Agency Dashboard Access for noam.troodler@gmail.com

## What's Missing

Your account currently has these roles: `user`, `admin`, `agent`, `developer` — but no **agency** record exists with you as the admin. The agency dashboard checks for a row in the `agencies` table where `admin_user_id = your_user_id`. Since that row doesn't exist, it shows "No Agency Found."

Additionally, your existing agent record (`cea52906`) has no `agency_id`, so the agent dashboard shows as a solo agent with no agency connection.

## What Will Be Done

### Step 1 — Create a test agency record
Insert a row into the `agencies` table with:
- `name`: "Noam Troodler Real Estate" (or similar — you can rename later in Settings)
- `admin_user_id`: your user ID
- `slug`: `noam-troodler-agency`
- `status`: `active`
- `is_verified`: `true`
- `verification_status`: `approved`

This is pure data — no code changes. The agency dashboard reads this row and renders everything from it.

### Step 2 — Link your agent record to the agency
Update your existing agent record to set `agency_id` to the new agency's ID. This means:
- Your agent view will show as an agency-affiliated agent
- The agency dashboard "Team Members" tab will show your agent profile as a member
- The `StepAssignAgent` wizard step will show you as an available agent to assign listings to

### Step 3 — No code changes needed
All the dashboard UI, hooks (`useMyAgency`, `useAgencyTeam`), and routing are already in place. This is entirely a database-side setup — inserting one row and updating one row.

## After This

You'll be able to:
- Visit `/agency` and see the full agency dashboard with your agency
- Visit `/agent` and see the agent dashboard showing you as part of your own agency
- Go to `/agency/listings` and use the "Add Listing" wizard with the agent assignment step (which will list you as an assignable team member)
- See the Team Members tab in the agency dashboard showing your agent profile

## Technical Details

Two database operations:

```sql
-- 1. Insert agency record
INSERT INTO public.agencies (
  name, slug, email, status, is_verified, 
  verification_status, admin_user_id, is_accepting_agents
) VALUES (
  'Noam Troodler Real Estate',
  'noam-troodler-agency',
  'noam.troodler@gmail.com',
  'active', true, 'approved',
  '7e7d2499-f0ff-4f46-920c-f565bde6e532',
  true
);

-- 2. Link agent record to the new agency
UPDATE public.agents 
SET agency_id = (SELECT id FROM agencies WHERE slug = 'noam-troodler-agency')
WHERE user_id = '7e7d2499-f0ff-4f46-920c-f565bde6e532';
```

No migrations or schema changes — this is purely seed/setup data for your test account.
