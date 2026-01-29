

## Set Up Google Sign-In for All User Types

### Overview
You want to add Google OAuth as a sign-in/sign-up option for all user types: buyers, agents, agencies, and developers. Lovable Cloud provides a managed Google OAuth solution that requires no configuration on your part.

### What Will Be Added
1. **Google Sign-In Button** - A "Continue with Google" button on the auth page
2. **Smart Role Routing** - After Google login, users will be routed based on their intended role:
   - Buyers → Onboarding flow
   - Agents → `/agent/register` 
   - Agencies → `/agency/register`
   - Developers → `/developer/register`

### Implementation Steps

**Step 1: Configure Google OAuth**
Use Lovable Cloud's built-in tool to enable Google authentication. This generates the required `@lovable.dev/cloud-auth-js` integration automatically.

**Step 2: Update Auth Page (`src/pages/Auth.tsx`)**
- Import the lovable auth module
- Add a "Continue with Google" button with a divider ("or")
- Handle the OAuth redirect with role context preserved via the `redirect_uri` parameter
- Style the button consistently with the existing design

**Step 3: Handle Post-OAuth Routing**
After Google authentication:
- Check for `role` parameter in URL
- Professional roles → redirect to their registration wizard
- Regular users → proceed to buyer onboarding if no profile exists

### Visual Design
```
┌─────────────────────────────────────────┐
│         Welcome to BuyWise Israel       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   🔵 Continue with Google       │   │
│  └─────────────────────────────────┘   │
│                                         │
│           ─────── or ───────           │
│                                         │
│  [    Email                        ]   │
│  [    Password                     ]   │
│                                         │
│  [         Sign In / Sign Up       ]   │
│                                         │
└─────────────────────────────────────────┘
```

### Technical Details
- Uses `lovable.auth.signInWithOAuth("google", { redirect_uri })` from `@lovable.dev/cloud-auth-js`
- The `redirect_uri` preserves role and invite code parameters for professional signups
- No API keys needed - Lovable Cloud manages the OAuth credentials automatically

