
# Subtle Account Deletion Feature

## Overview
Add a subtle but accessible way for users to permanently delete their account from the My Profile page, following best practices for destructive actions.

## User Experience Design

### Placement (Subtle but Accessible)
- Add a small text link at the **bottom of the Account Settings section**, below the "Edit Account" button
- Use muted styling: `text-xs text-muted-foreground hover:text-destructive`
- Label: "Delete my account" (understated, not alarming)

### Confirmation Flow (Multi-Step)
1. **First Click**: Opens an AlertDialog with clear warnings
2. **Confirmation Text**: User must type "DELETE" to enable the final button
3. **Final Action**: Red destructive button to confirm

### Warning Content
- Clear explanation of what will be deleted
- Mention that this action is **permanent and irreversible**
- List affected data: profile, saved properties, alerts, preferences

---

## Technical Implementation

### 1. Edge Function: `delete-account`
**Purpose**: Securely delete user account server-side with proper auth validation

**Location**: `supabase/functions/delete-account/index.ts`

**Security Measures**:
- Validate JWT token using `getClaims()`
- Verify the user is deleting their OWN account (not someone else's)
- Use service role key for admin-level deletion
- Log deletion for audit purposes

**Deletion Order** (to respect foreign key constraints):
```text
1. favorites (user's saved properties)
2. search_alerts (user's alerts)
3. inquiries (user's property inquiries)
4. property_views (user's view history)
5. user_roles (role assignments)
6. profiles (user profile data)
7. auth.users (the actual auth record - via admin API)
```

**Response**: Success confirmation or error with user-friendly message

### 2. Frontend: `DeleteAccountDialog` Component
**Location**: `src/components/profile/DeleteAccountDialog.tsx`

**Features**:
- AlertDialog with proper accessibility
- Text input requiring "DELETE" to proceed
- Loading state during deletion
- Error handling with toast notifications

### 3. Update: `AccountSection.tsx`
**Changes**:
- Import and render `DeleteAccountDialog`
- Add subtle trigger link at bottom of section
- Pass necessary handlers (sign out after deletion)

### 4. Update: `useAuth.tsx`
**Changes**:
- Add `deleteAccount` method that:
  - Calls the edge function
  - Signs out the user on success
  - Returns success/error status

---

## Data Cascade

Tables with user references that need cleanup:

| Table | Column | Action |
|-------|--------|--------|
| `profiles` | `id` | Delete row |
| `user_roles` | `user_id` | Delete rows |
| `favorites` | `user_id` | Delete rows |
| `search_alerts` | `user_id` | Delete rows |
| `inquiries` | `user_id` | Delete rows |
| `property_views` | `user_id` | Delete rows |
| `project_views` | `user_id` | Delete rows |
| `price_drop_notifications` | `user_id` | Delete rows |

**Note**: Professional accounts (agents, developers) should show a different message explaining they need to contact support, as their accounts have additional dependencies.

---

## Edge Cases

### Professional Accounts
- If user has agent/developer role, show a warning that they should:
  - Transfer or close their professional listings first
  - Contact support for account closure
- This prevents orphaned listings

### Pending Operations
- Check for active inquiries that need follow-up
- Warn users about any saved data they'll lose

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/delete-account/index.ts` | **Create** - Edge function |
| `src/components/profile/DeleteAccountDialog.tsx` | **Create** - Confirmation dialog |
| `src/hooks/useAuth.tsx` | **Modify** - Add deleteAccount method |
| `src/components/profile/sections/AccountSection.tsx` | **Modify** - Add delete trigger |
| `supabase/config.toml` | **Modify** - Add function config |

---

## Security Checklist

- Server-side JWT validation (not client-side checks)
- User can only delete their own account
- Service role used only for admin deletion API
- Audit logging of deletion events
- Rate limiting on the endpoint
- Proper CORS headers
