
## Fix: Agency Users Seeing Buyer Profile Instead of Agency Dashboard

### The Problem

After completing the agency registration wizard, the success dialog's "Got it" button navigates to `/` (home page). When the user later clicks the profile icon, they go to `/profile` -- which is the **buyer profile page**. There is no detection that this user is an agency admin, so they see buyer-focused content (Buyer Profile, Financing Method, etc.) instead of their agency dashboard.

The same gap exists for **developers**: after registration, there is nothing routing them to their dashboard either. Agents are partially covered because `useUserRole` checks for the `agent` role, but agencies and developers have no `app_role` entry -- they are identified by having records in the `agencies`/`developers` tables.

### Root Causes

1. **AgencySubmittedDialog** navigates to `/` on close -- should navigate to `/agency` (the agency dashboard)
2. **Profile page** has no awareness of agency admin status -- it shows the buyer hub even if the user owns an agency
3. **ProfileWelcomeHeader** only shows dashboard links for `isAgent` and `isAdmin` roles -- it has no `isAgencyAdmin` case
4. The **header profile icon** always links to `/profile` -- there is no role-aware redirect

### Changes

#### 1. AgencySubmittedDialog -- navigate to `/agency` instead of `/`
- File: `src/components/agency/AgencySubmittedDialog.tsx`
- Change `navigate('/')` to `navigate('/agency')` in `handleClose`
- This way, after submitting the agency application, the user lands on their agency dashboard (even if pending review)

#### 2. Profile page -- detect agency admin and show dashboard link
- File: `src/pages/Profile.tsx`
- Import and call `useMyAgency()` from `useAgencyManagement`
- If the user has an agency record, show a prominent banner at the top: "You're managing [Agency Name]" with a button to go to `/agency`
- This prevents confusion when an agency admin accidentally lands on `/profile`

#### 3. ProfileWelcomeHeader -- add agency admin awareness
- File: `src/components/profile/ProfileWelcomeHeader.tsx`
- Add an `isAgencyAdmin` prop (boolean) and optional `agencyName` prop
- When `isAgencyAdmin` is true, show an "Agency Admin" banner with a dashboard link (similar to existing agent/admin banners)
- Update the parent `Profile.tsx` to pass these props based on `useMyAgency()` result

#### 4. Apply the same pattern for developers
- File: `src/pages/Profile.tsx`
- Also check for an existing developer profile (if there is a `useDeveloperProfile` or similar hook)
- Show a "Developer Account" banner linking to `/developer` dashboard
- This ensures developers are not confused by the buyer profile page either

#### 5. Developer success dialog -- navigate to `/developer` instead of `/`
- Check if a similar success dialog exists for developers and update its navigation target

### Files to modify
- `src/components/agency/AgencySubmittedDialog.tsx` -- change post-submit navigation from `/` to `/agency`
- `src/pages/Profile.tsx` -- add `useMyAgency()` check and agency banner
- `src/components/profile/ProfileWelcomeHeader.tsx` -- add `isAgencyAdmin` banner alongside existing agent/admin banners
- Developer equivalents (success dialog, profile detection) -- same pattern

### What this fixes
- Agency admin who just registered sees their agency dashboard, not the buyer profile
- Agency admin who visits `/profile` sees a clear "You're managing [Agency Name] -- Go to Dashboard" banner
- Same safeguard for developer accounts
- No database changes needed -- detection uses existing `agencies.admin_user_id` and developer profile lookups
