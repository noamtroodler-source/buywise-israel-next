

## Current State

The auth page (`src/pages/Auth.tsx`) **already implements** context-aware messaging. It reads `?role=agent|agency|developer` from the URL and displays role-specific titles, descriptions, icons, and button text via the `roleConfig` object (lines 71-100). The `ProtectedRoute` component (lines 33-41) already appends the `role` param when redirecting unauthenticated users.

### What's already working:
- **Agent context**: Title "Join as a Real Estate Agent", description about listing properties
- **Agency context**: Title "Register Your Agency", admin-specific name label
- **Developer context**: Title "Join as a Property Developer"
- **Buyer/default**: "Welcome to BuyWise Israel"
- Intent-based messaging for actions like save_favorite, create_alert, etc.
- Google OAuth preserves role params
- Post-auth redirects to the correct registration page

### Summary

**No code changes are needed.** The context-aware auth flow you described is already fully implemented. When a user hits a protected agent/agency/developer route, `ProtectedRoute` redirects to `/auth?role=agent` (or agency/developer), and the auth page renders the appropriate title, description, and icon. After signup/signin, the user is redirected to the correct registration page.

Would you like me to refine any of the existing copy, adjust the visual design of the role-specific auth pages, or add any additional context signals?

