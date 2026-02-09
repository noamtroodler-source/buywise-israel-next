
Goal
- Make the Agency sign-up wizard behave predictably and prevent the “I got logged out / became a normal user / lost my place” experience.
- Fix the wizard navigation so “Next” and “Back” always land at the top of the step (not halfway down).
- Ensure that if a user is forced back to /auth (session refresh, tab closed, etc.), they return to the agency flow after signing in.

What’s happening now (root causes)
1) Step navigation does not scroll to top
- /agency/register is a single route and steps are just React state (currentStep).
- You already have a global ScrollToTop component that only triggers on pathname changes. Since the pathname stays “/agency/register”, it never runs when you go Next/Back.
- Result: if the user is scrolled down, switching steps keeps the same scroll position, so the next step can appear “starting at the bottom”.

2) “Logged out midway” breaks the professional context
- When a protected page detects no session, ProtectedRoute sends the user to:
  /auth?redirect=/agency/register&intent=view_profile
- Auth.tsx currently does not use the redirect param at all, and also relies on role=agency to show professional messaging and to route to /agency/register.
- So if the user gets bounced to /auth due to session loss/refresh and the URL lacks role=agency, they will sign in and end up at “/” (buyer flow), which looks like a “normal user” account.

3) Agency accounts are not represented in user_roles
- The database enum app_role includes: admin, agent, user, developer (no agency).
- That’s fine; your app already treats “agency admin” as “user who has an agency record” via useMyAgency().
- So the fix is not “add an agency role”; the fix is “keep the user in the agency registration flow and restore them correctly”.

Plan (code changes)

A) Fix wizard step scroll-to-top (AgencyRegister.tsx)
1. Add a “scroll to top of wizard” helper that accounts for header offset
   - Implement a function like scrollToWizardTop() that:
     - scrolls to the top of the page OR
     - scrolls to the card container heading (recommended) using a ref + scrollIntoView
   - Include an offset (around 80–120px) so the heading isn’t hidden under the global header.

2. Trigger scroll reset on step changes
   - Add a useEffect that runs whenever currentStep changes:
     - setTimeout(..., 0) or requestAnimationFrame to ensure the new step content has mounted, then scroll.
   - This fixes both Next and Back, and also fixes clicking the progress indicator if you ever add step jumping later.

3. Also call scroll reset inside goNext/goBack
   - Redundant but safe: call scrollToWizardTop() after updating step.
   - This covers any edge cases where the effect might not fire due to same-step calls or animation timing.

Acceptance checks
- From step 0, scroll down, click Next: step 1 content starts at the top.
- From step 1, scroll down, click Back: step 0 starts at the top.
- Works on mobile and desktop.

B) Make Auth respect the redirect parameter (Auth.tsx)
1. Parse redirect from the URL
   - Read: const redirectTo = searchParams.get('redirect')
   - If present, we should prefer navigating there after successful sign-in or when a user is already authenticated.

2. Update “already logged-in” effect
   - Today: if user && isProfessionalSignup => navigate(config.redirectTo)
   - Change to: if user && redirectTo exists => navigate(redirectTo)
   - Then fall back to current logic (professional role redirect, buyer onboarding, etc.)

3. Update sign-in success navigation
   - Today: if professional role => navigate(config.redirectTo) else navigate('/')
   - Change to:
     - if redirectTo exists => navigate(redirectTo)
     - else keep existing role-based logic

4. Update sign-up success handling (important for email-confirm signups)
   - If email confirmation is enabled, signUp may not immediately produce a session.
   - Keep your current success toast, but also:
     - persist the intended redirect in localStorage so when they come back after confirming / signing in, we can return them to the right place.
     - Example key: post_auth_redirect = redirectTo || (isProfessionalSignup ? config.redirectTo : '/')
   - Then in Auth.tsx, on mount (or when user becomes available), if post_auth_redirect exists, navigate there and clear it.

Acceptance checks
- If user is on /agency/register and gets redirected to /auth (session expired), after signing in they return to /agency/register automatically.
- If user signs up (email confirmation flow) and later signs in, they still return to /agency/register.

C) Preserve agency signup context when ProtectedRoute redirects (ProtectedRoute.tsx)
1. Improve the redirect URL for professional pages
   - When redirecting unauthenticated users, include role context when the pathname indicates a professional flow:
     - If location.pathname starts with “/agency”, append &role=agency
     - If starts with “/agent”, append &role=agent
     - If starts with “/developer”, append &role=developer
   - Keep intent param, but do not overwrite a provided role.

Why do this if we also implement redirect support?
- Redirect support is the real fix.
- Adding role improves the messaging/labels on the Auth screen (so the user sees “Register Agency” context), and it maintains consistency.

Acceptance checks
- Going directly to /agency/register while logged out shows the Auth page in agency context (admin name copy etc.) and after sign-in returns to /agency/register.

D) Add “resume agency registration” safety net (optional but strongly recommended)
This prevents “I lost everything” if they refresh or accidentally close.
1. Save draft form data + currentStep to localStorage
   - Keyed by user id if available, otherwise by email (as they type).
   - Save on every relevant state change (debounced to avoid excessive writes).

2. Restore draft on mount
   - If there is a saved draft and the user has no existing agency (useMyAgency() is null), prompt:
     - “Resume where you left off?” (Yes/No)
   - If Yes, restore currentStep/formData/logo preview reference (logo file cannot be restored; show “please re-upload logo”).
   - If No, clear draft.

Acceptance checks
- Refreshing mid-wizard restores to the same step and values.
- If agency already exists, do not offer resume (clear any draft).

Files to inspect/change
- src/pages/agency/AgencyRegister.tsx
  - Add scroll-to-top behavior on step change and navigation.
  - (Optional) add draft persistence/resume.
- src/pages/Auth.tsx
  - Respect redirect= param on sign-in and on existing session.
  - Store/consume post_auth_redirect localStorage to survive email-confirm flows.
- src/components/shared/ProtectedRoute.tsx
  - Append role context based on pathname when redirecting to /auth.

Risks / edge cases
- Animated transitions (framer-motion) can cause scroll calls to run before content mounts; we’ll use requestAnimationFrame or a small timeout to ensure stable scroll behavior.
- “role” and “redirect” both present: redirect should win for navigation; role should only affect copy and intent messaging.
- Do not add “agency” into app_role enum unless you explicitly want agency to be a formal role; current architecture uses “has agency record” which is fine and safer to keep consistent.

Test checklist (end-to-end)
- Logged out:
  - Visit /agency/register directly -> sent to /auth with agency context -> sign in -> returned to /agency/register.
- Wizard scroll:
  - On each step, scroll down, press Next/Back; confirm it always lands at the top.
- Mid-flow refresh:
  - (If we do optional draft) refresh on step 1 and confirm resume works.
- Accidental logout/session refresh:
  - Simulate by signing out in another tab, then clicking Next in wizard; confirm after sign-in you return to wizard, not home.
