

# Fix: Create Missing Agent & Developer Profiles for Your Account

## The Problem
Your account has the `agent` and `developer` roles assigned, but no matching records in the `agents` or `developers` tables. The property creation wizard requires an agent profile to exist -- without it, saving or submitting a listing silently fails.

This is a data issue specific to your account, not a systemic bug. The registration flows (`useAgentRegistration`, `useDeveloperRegistration`) correctly create both the role and the profile record together.

## The Fix

### Step 1: Insert missing agent profile
Run a database migration to create the agent record for your user ID, linking it to your existing account info.

### Step 2: Insert missing developer profile  
Similarly create the developer record.

Both will use your existing profile data (name, email) and be set to `active` status so you can immediately use the agent dashboard and create listings.

## Technical Details

**Database migration (new):**

```sql
-- Create missing agent profile
INSERT INTO agents (user_id, name, email, status)
SELECT 
  '7e7d2499-f0ff-4f46-920c-f565bde6e532',
  COALESCE(p.full_name, 'Noam Troodler'),
  'noam.troodler@gmail.com',
  'active'
FROM profiles p
WHERE p.id = '7e7d2499-f0ff-4f46-920c-f565bde6e532'
ON CONFLICT DO NOTHING;

-- Create missing developer profile
INSERT INTO developers (user_id, name, slug, email, status, verification_status, is_verified, total_projects)
VALUES (
  '7e7d2499-f0ff-4f46-920c-f565bde6e532',
  'Noam Troodler',
  'noam-troodler',
  'noam.troodler@gmail.com',
  'approved',
  'approved',
  true,
  0
)
ON CONFLICT DO NOTHING;
```

No code changes needed. After this migration, the agent dashboard and property creation wizard will work immediately.

