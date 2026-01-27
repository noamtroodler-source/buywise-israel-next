
# Simplify Profile Icon in Header

## Current Situation

The profile icon dropdown currently shows:
- User name & email
- My Profile
- Saved Properties ← **redundant** (heart icon already in header)
- Agent Dashboard (if agent)
- Agency Portal (if agency admin)
- Developer Portal (if developer)
- Admin Panel (if admin)
- Sign Out

The Profile page **already has a Sign Out button** in the `ProfileWelcomeHeader` component, so Sign Out in the dropdown is also somewhat redundant.

---

## Recommendation

**For regular users (non-agents/developers/admins)**: Remove the dropdown entirely and make the profile icon a direct link to `/profile`. This is cleaner and faster.

**For professional users (agents, developers, admins)**: Keep a simplified dropdown that provides quick access to their professional dashboards, since navigating to profile first to access the dashboard adds friction.

---

## Solution

### `src/components/layout/Header.tsx`

**Logic:**

```text
If user is regular buyer (no special roles):
  → Profile icon is direct <Link> to /profile (no dropdown)
  
If user is agent/developer/admin:
  → Keep dropdown with:
    - User name & email (header)
    - My Profile
    - [Agent Dashboard] (if agent)
    - [Agency Portal] (if agency admin)
    - [Developer Portal] (if developer)
    - [Admin Panel] (if admin)
    - Sign Out
```

**Changes:**

1. Create a condition to check if user has any professional role:
   ```tsx
   const hasProfessionalRole = isAgent || isAgencyAdmin || hasDeveloperProfile || isDeveloper || isAdmin;
   ```

2. **If no professional role**: Replace `DropdownMenu` with a simple `Button` that links to `/profile`

3. **If has professional role**: Keep dropdown but remove "Saved Properties" since it's redundant

---

## Visual Result

**Regular Users (buyers):**
```text
Before:                           After:
┌────────────────────┐           ┌──────┐
│ Noam Troodler      │           │  👤  │ ← Click goes directly
│ you4@gmail.com     │     →     └──────┘   to /profile
├────────────────────┤
│ 👤 My Profile      │
│ ♥ Saved Properties │
├────────────────────┤
│ → Sign Out         │
└────────────────────┘
```

**Professional Users (agents, developers, admins):**
```text
Before:                           After:
┌────────────────────┐           ┌────────────────────┐
│ Noam Troodler      │           │ Noam Troodler      │
│ you4@gmail.com     │           │ you4@gmail.com     │
├────────────────────┤     →     ├────────────────────┤
│ 👤 My Profile      │           │ 👤 My Profile      │
│ ♥ Saved Properties │ (removed) │ 🏢 Agent Dashboard │
│ 🏢 Agent Dashboard │           │ → Sign Out         │
│ → Sign Out         │           └────────────────────┘
└────────────────────┘
```

---

## Code Changes

### Lines 140-207 in `src/components/layout/Header.tsx`

Replace the existing `{user ? ( ... )}` block with:

```tsx
{user ? (
  hasProfessionalRole ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/50 shadow-lg p-1.5">
        {/* User Info Header */}
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-foreground truncate">
            {profile?.full_name || 'Welcome'}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <DropdownMenuSeparator className="bg-border/50 mb-1" />
        
        <DropdownMenuItem asChild className="rounded-lg px-3 py-2">
          <Link to="/profile">
            <User className="h-4 w-4 text-muted-foreground" />
            My Profile
          </Link>
        </DropdownMenuItem>
        
        {/* Professional dashboard links - kept as-is */}
        {isAgent && ...}
        {isAgencyAdmin && ...}
        {(isDeveloper || hasDeveloperProfile) && ...}
        {isAdmin && ...}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    /* Regular user - direct link to profile */
    <Button variant="ghost" size="icon" className="rounded-full" asChild>
      <Link to="/profile">
        <User className="h-5 w-5" />
      </Link>
    </Button>
  )
) : (
  /* Not logged in - show Sign In / Sign Up buttons */
  ...
)}
```

---

## Summary

| Change | Description |
|--------|-------------|
| Add `hasProfessionalRole` variable | Check if user is agent/agency admin/developer/admin |
| Regular users | Profile icon links directly to `/profile` (no dropdown) |
| Professional users | Keep dropdown but remove "Saved Properties" |
| Sign Out for regular users | Already available on Profile page |

This creates a cleaner, faster experience for regular buyers while maintaining quick dashboard access for professionals who need it.
