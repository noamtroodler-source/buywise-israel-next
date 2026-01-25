
# Admin Account Management System

## Overview

This plan implements comprehensive account management capabilities for admins to delete, temporarily ban, and manage all user types (users, agents, agencies, developers) from the admin dashboard.

## Current State Analysis

| Entity | Current Actions | Missing Actions |
|--------|----------------|-----------------|
| **Agents** | Approve, Suspend, Reinstate | Delete |
| **Agencies** | Verify, Suspend, Delete | - |
| **Developers** | Approve, Suspend, Reinstate | Delete |
| **Users** | View only | Ban, Unban, Delete |

## Implementation Plan

### Phase 1: Database Schema Updates

Add status tracking to the `profiles` table for user bans:

```sql
-- Add ban tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at timestamptz,
ADD COLUMN IF NOT EXISTS banned_until timestamptz,
ADD COLUMN IF NOT EXISTS ban_reason text,
ADD COLUMN IF NOT EXISTS banned_by uuid REFERENCES auth.users(id);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned) WHERE is_banned = true;
```

---

### Phase 2: Edge Function for Admin-Initiated Account Management

Create a new edge function `admin-manage-account` that handles:
- **Delete user**: Cascades through all related tables, removes auth record
- **Ban user**: Sets temporary or permanent ban with expiration
- **Unban user**: Removes ban status

**File:** `supabase/functions/admin-manage-account/index.ts`

Key logic:
1. Verify admin role using JWT claims
2. Accept `action` (delete/ban/unban), `userId`, and optional `banDuration`
3. For deletions: Handle professional account cleanup (agents, developers, agencies)
4. For bans: Update profile with ban status and optional expiry
5. Return success/error with details

---

### Phase 3: Admin Hooks

**File:** `src/hooks/useAdminUsers.tsx`

Create hooks for admin user management:

```typescript
// useAdminUsers - Fetch users with ban status
export function useAdminUsers(filter?: 'all' | 'banned' | 'active')

// useBanUser - Temporarily ban a user
export function useBanUser()

// useUnbanUser - Remove ban from user  
export function useUnbanUser()

// useDeleteUser - Permanently delete user account
export function useDeleteUser()

// useDeleteAgent - Delete agent profile and user
export function useDeleteAgent()

// useDeleteDeveloper - Delete developer profile and user
export function useDeleteDeveloper()
```

---

### Phase 4: Admin Users Page Enhancement

**File:** `src/pages/admin/AdminUsers.tsx`

Transform from read-only table to full management interface:

**UI Changes:**
1. Add stats cards: Total Users, Active, Banned
2. Add filter tabs: All, Active, Banned
3. Add action buttons per user row:
   - **Ban** (with duration picker: 1 day, 1 week, 1 month, permanent)
   - **Unban** (for banned users)
   - **Delete** (with confirmation dialog)
4. Show ban status badge + expiry date for banned users
5. Confirmation dialogs for destructive actions

**Visual Layout:**
```text
┌─────────────────────────────────────────────────────────────────┐
│  Users Management                                                │
│  ───────────────                                                 │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │ Total    │ │ Active   │ │ Banned   │                         │
│  │   247    │ │   243    │ │    4     │                         │
│  └──────────┘ └──────────┘ └──────────┘                         │
│                                                                  │
│  [All] [Active] [Banned]                                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ User          │ Email       │ Roles    │ Status │ Actions  │ │
│  ├───────────────┼─────────────┼──────────┼────────┼──────────┤ │
│  │ John Doe      │ john@...    │ user     │ Active │ [Ban][×] │ │
│  │ Jane Smith    │ jane@...    │ agent    │ Banned │ [Unban]  │ │
│  │               │             │          │ 3d left│          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

### Phase 5: Add Delete Actions to Professional Pages

**Files to update:**
- `src/pages/admin/AdminAgents.tsx` - Add Delete button
- `src/pages/admin/AdminDevelopers.tsx` - Add Delete button
- `src/hooks/useAdminAgents.tsx` - Add `useDeleteAgent` hook
- `src/hooks/useAdminDevelopers.tsx` - Add `useDeleteDeveloper` hook

**Delete flow for professionals:**
1. Show warning about cascade effects (listings, projects, leads)
2. Require confirmation dialog with entity name
3. Delete professional profile first (agents/developers table)
4. Delete associated auth user via edge function

---

### Phase 6: Ban Duration Modal Component

**File:** `src/components/admin/BanDurationModal.tsx`

A reusable modal for selecting ban duration:
- Preset options: 1 day, 1 week, 1 month, Permanent
- Optional reason field
- Shows clear messaging about consequences

---

## Technical Details

### Edge Function: admin-manage-account

```typescript
// Accepts POST with body:
{
  action: 'delete' | 'ban' | 'unban',
  userId: string,
  banDuration?: '1d' | '1w' | '1m' | 'permanent',
  reason?: string
}

// Admin verification via has_role() or checking user_roles table
// Returns: { success: boolean, message: string }
```

### Deletion Order (respecting FK constraints)

For full user deletion:
1. `price_drop_notifications`
2. `favorites`
3. `search_alerts`
4. `inquiries` (user_id)
5. `property_views`
6. `project_views`
7. `buyer_profiles`
8. `agents` (if exists)
9. `developers` (if exists)
10. `user_roles`
11. `profiles`
12. `auth.users`

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/admin-manage-account/index.ts` | **Create** | Edge function for admin actions |
| `src/hooks/useAdminUsers.tsx` | **Create** | Hooks for user ban/delete |
| `src/components/admin/BanDurationModal.tsx` | **Create** | Ban duration picker UI |
| `src/pages/admin/AdminUsers.tsx` | **Modify** | Add full management UI |
| `src/pages/admin/AdminAgents.tsx` | **Modify** | Add delete action |
| `src/pages/admin/AdminDevelopers.tsx` | **Modify** | Add delete action |
| `src/hooks/useAdminAgents.tsx` | **Modify** | Add useDeleteAgent |
| `src/hooks/useAdminDevelopers.tsx` | **Modify** | Add useDeleteDeveloper |

---

## Database Migration

```sql
-- Add ban fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at timestamptz,
ADD COLUMN IF NOT EXISTS banned_until timestamptz,
ADD COLUMN IF NOT EXISTS ban_reason text,
ADD COLUMN IF NOT EXISTS banned_by uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_profiles_is_banned 
ON public.profiles(is_banned) WHERE is_banned = true;
```

---

## Security Considerations

1. **Admin verification**: Edge function validates caller is admin via `has_role()`
2. **Self-protection**: Prevent admin from deleting/banning themselves
3. **Audit trail**: Log who banned/deleted and when
4. **Cascade safety**: Professional accounts check for active content before deletion
5. **RLS policies**: Ensure ban status is only modifiable by admins

---

## Summary

This implementation provides:
- Full user lifecycle management for admins
- Temporary and permanent ban capabilities
- Safe deletion with cascade handling
- Consistent UI patterns across all admin pages
- Proper confirmation dialogs for destructive actions
- Audit tracking for admin actions
