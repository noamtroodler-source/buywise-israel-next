
# Context-Aware Authentication Messaging

## Overview

Implement dynamic, context-aware messaging on the sign-in/sign-up page (`/auth`) that adapts based on what action the user was trying to perform. Instead of the generic "Sign in to access your saved properties," users will see specific messaging like "Sign up to create search alerts" or "Sign in to save your calculations."

---

## How It Works

### URL-Based Context Passing

When redirecting to `/auth`, pass an `intent` parameter that describes the action:

```text
/auth?tab=signup&intent=create_alert
/auth?tab=signup&intent=save_calculation
/auth?tab=signup&intent=enable_price_alerts
/auth?redirect=/profile&intent=view_profile
```

### Auth Page Reads Intent

The Auth page reads the `intent` parameter and displays appropriate messaging:

| Intent | Sign Up Description | Sign In Description |
|--------|---------------------|---------------------|
| `create_alert` | "Create an account to set up search alerts and get notified when new listings match your criteria" | "Sign in to create search alerts" |
| `save_calculation` | "Create an account to save your calculations and access them on any device" | "Sign in to access your saved calculations" |
| `enable_price_alerts` | "Create an account to enable price alerts and get notified when prices drop" | "Sign in to manage your price alerts" |
| `save_favorite` | "Create an account to save your favorites and sync them across devices" | "Sign in to access your saved properties" |
| `view_profile` | "Create your account to set up your buyer profile and get personalized estimates" | "Sign in to access your profile" |
| `compare_properties` | "Create an account to save and compare properties side by side" | "Sign in to compare your saved properties" |
| (default) | "Create your account to start your property journey" | "Sign in to access your saved properties" |

---

## Implementation Details

### 1. Create Intent Configuration Object

Add to `Auth.tsx`:

```typescript
const intentConfig: Record<string, { signupDesc: string; signinDesc: string; icon?: LucideIcon }> = {
  create_alert: {
    signupDesc: "Create an account to set up search alerts and get notified when new listings match your criteria",
    signinDesc: "Sign in to create search alerts",
    icon: Bell,
  },
  save_calculation: {
    signupDesc: "Create an account to save your calculations and access them on any device",
    signinDesc: "Sign in to access your saved calculations",
    icon: Calculator,
  },
  enable_price_alerts: {
    signupDesc: "Create an account to enable price alerts and get notified when prices drop",
    signinDesc: "Sign in to manage your price alerts",
    icon: Bell,
  },
  save_favorite: {
    signupDesc: "Create an account to save your favorites and sync them across devices",
    signinDesc: "Sign in to access your saved properties",
    icon: Heart,
  },
  view_profile: {
    signupDesc: "Create your account to set up your buyer profile and get personalized estimates",
    signinDesc: "Sign in to access your profile",
    icon: User,
  },
  compare_properties: {
    signupDesc: "Create an account to save and compare properties side by side",
    signinDesc: "Sign in to compare your saved properties",
    icon: Scale,
  },
  set_profile: {
    signupDesc: "Create an account to personalize your cost estimates based on your buyer status",
    signinDesc: "Sign in to update your profile",
    icon: User,
  },
};
```

### 2. Read Intent Parameter

```typescript
const intentParam = searchParams.get('intent');
const intentInfo = intentParam ? intentConfig[intentParam] : null;
```

### 3. Update Description Logic

Replace the current hardcoded description with:

```typescript
<CardDescription className="text-muted-foreground">
  {activeTab === 'signup' 
    ? (intentInfo?.signupDesc || config.description)
    : isProfessionalSignup 
      ? 'Sign in to continue your registration'
      : (intentInfo?.signinDesc || 'Sign in to access your saved properties')}
</CardDescription>
```

### 4. Optional: Dynamic Icon

If intent provides an icon and user is NOT a professional signup, use that icon instead of the default Shield icon.

---

## Files to Update

### Updates to Redirect Sources

Each location that redirects to `/auth` needs to include the `intent` parameter:

| File | Current | Updated |
|------|---------|---------|
| `PropertyFilters.tsx` | `/auth?redirect=/listings` | `/auth?redirect=/listings&intent=create_alert` |
| `Projects.tsx` | `/auth?redirect=/projects` | `/auth?redirect=/projects&intent=create_alert` |
| `SaveResultsPrompt.tsx` | `/auth?tab=signup` | `/auth?tab=signup&intent=save_calculation` |
| `usePriceDropAlerts.tsx` | `/auth?tab=signup` | `/auth?tab=signup&intent=enable_price_alerts` |
| `MortgageAssumptionsPanel.tsx` | `/auth?tab=signup` | `/auth?tab=signup&intent=save_calculation` |
| `InlineSignupCard.tsx` | `/auth?tab=signup` | `/auth?tab=signup&intent=save_calculation` |
| `GuestSignupNudge.tsx` | `/auth?tab=signup` | Accept `intent` prop, append to URL |
| `GuestAssumptionsBanner.tsx` | `/auth?tab=signup` | `/auth?tab=signup&intent=set_profile` |
| `PersonalizationHeader.tsx` | `/auth?tab=signup` | `/auth?tab=signup&intent=set_profile` |
| `PropertyCostBreakdown.tsx` | `/auth?tab=signup` | `/auth?tab=signup&intent=set_profile` |
| `ProtectedRoute.tsx` | `/auth?redirect=...` | `/auth?redirect=...&intent=view_profile` |

### Core Auth Page Update

| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Add `intentConfig` object, read `intent` param, update description rendering logic, optionally update icon |

---

## GuestSignupNudge Enhancement

Update component to accept an optional `intent` prop:

```typescript
interface GuestSignupNudgeProps {
  icon?: LucideIcon;
  message: string;
  ctaText?: string;
  variant?: 'inline' | 'banner' | 'card';
  intent?: string; // NEW: context for auth page messaging
  className?: string;
}

// Usage in link:
<Link to={`/auth?tab=signup${intent ? `&intent=${intent}` : ''}`}>
```

---

## Examples

### Before (Generic)

User clicks "Create Alert" on listings page → Redirected to `/auth`:

```text
┌─────────────────────────────────────────┐
│         🛡️ Welcome to BuyWise Israel   │
│                                         │
│   Sign in to access your saved          │
│   properties                            │
└─────────────────────────────────────────┘
```

### After (Context-Aware)

User clicks "Create Alert" on listings page → Redirected to `/auth?intent=create_alert`:

```text
┌─────────────────────────────────────────┐
│         🔔 Welcome to BuyWise Israel    │
│                                         │
│   Create an account to set up search    │
│   alerts and get notified when new      │
│   listings match your criteria          │
└─────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Add intentConfig, read intent param, update CardDescription logic |
| `src/components/filters/PropertyFilters.tsx` | Add `&intent=create_alert` to navigate |
| `src/pages/Projects.tsx` | Add `&intent=create_alert` to navigate |
| `src/components/tools/shared/SaveResultsPrompt.tsx` | Add `&intent=save_calculation` |
| `src/components/tools/shared/InlineSignupCard.tsx` | Add `&intent=save_calculation` |
| `src/hooks/usePriceDropAlerts.tsx` | Add `&intent=enable_price_alerts` |
| `src/components/property/MortgageAssumptionsPanel.tsx` | Add `&intent=save_calculation` |
| `src/components/shared/GuestSignupNudge.tsx` | Add optional `intent` prop, update Link URLs |
| `src/components/shared/GuestAssumptionsBanner.tsx` | Add `&intent=set_profile` |
| `src/components/property/PersonalizationHeader.tsx` | Add `&intent=set_profile` |
| `src/components/property/PropertyCostBreakdown.tsx` | Add `&intent=set_profile` |
| `src/components/shared/ProtectedRoute.tsx` | Add `&intent=view_profile` |
| `src/pages/Tools.tsx` | Pass `intent="save_calculation"` to GuestSignupNudge |
| `src/pages/Favorites.tsx` | Pass `intent="save_favorite"` to GuestSignupNudge |

---

## Intent Reference Table

| Intent Key | Triggered From | Messaging Focus |
|------------|----------------|-----------------|
| `create_alert` | Listings/Projects filter "Create Alert" button | Search alerts |
| `save_calculation` | Tools/Calculator save prompts | Saving calculations |
| `enable_price_alerts` | Favorites page price alert toggle | Price drop notifications |
| `save_favorite` | Favorites page guest banner | Syncing favorites |
| `set_profile` | Profile banners, cost breakdowns | Personalized estimates |
| `view_profile` | Protected routes (profile, dashboard) | Account access |
| `compare_properties` | Compare feature (if gated) | Property comparison |
