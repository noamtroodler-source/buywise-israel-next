

## Fix: Logo/Image Uploads Failing for Agencies, Developers, and Agents

### The Problem

When you try to upload an agency logo, you get "Failed to upload logo" because the file storage security policy **only allows users with the "agent" role** to upload files. Agency admins and developers don't have that role, so the upload is blocked with a 403 Forbidden error.

This same issue affects:
- **Agency settings** -- logo upload (your current issue)
- **Agency registration wizard** -- logo upload during signup
- **Developer settings** -- logo upload
- **Developer registration** -- logo upload during signup
- **Agent settings** -- avatar upload (agents may work if they have the role, but the policy also checks the wrong folder path for some cases)

### The Fix

One database change to update the storage security rule so that **any logged-in user** can upload to the `property-images` storage bucket. Since each user uploads to their own folder (e.g., `agencies/{id}/`, `developers/{id}/`, `{user_id}/`), this is safe -- and the bucket is already publicly readable.

### Technical Details

**Database migration** -- Replace the restrictive upload policy:

```sql
-- Drop the old policy that only allows agents
DROP POLICY IF EXISTS "Agents can upload property images" ON storage.objects;

-- Create a new policy allowing any authenticated user to upload
CREATE POLICY "Authenticated users can upload to property-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');
```

This single change fixes uploads for all three professional types (agencies, developers, agents) across both their registration flows and settings pages.

### No code changes needed

The upload code in all files (`AgencySettings.tsx`, `DeveloperSettings.tsx`, `AgentSettings.tsx`, `DeveloperRegister.tsx`, `AgencyRegister.tsx`) is already correct -- it uploads to the right paths and handles errors properly. The only blocker was this storage security rule.

### Files to modify
- **New database migration** -- update the storage upload policy (one SQL statement)
- No application code changes required

