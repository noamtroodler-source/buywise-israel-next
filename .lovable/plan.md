

## Opt-In Agent Profile During Agency Registration + Onboarding Text Update

### What Changes

**1. New optional step in the agency registration wizard**

After the existing "Coverage & Focus" step (step 2) and before "Review" (step 3), add a new step called **"Your Agent Profile"** that appears conditionally:

- At the end of Step 2 (Coverage & Focus), show a toggle/checkbox: **"I'm also an active agent"** with a brief explanation like "List properties and receive inquiries under your own name, within your agency."
- If they opt in, a new Step 3 appears: **"Your Agent Profile"** -- collecting agent-specific fields:
  - Real Estate License Number (required if opted in)
  - Years of Experience (dropdown)
  - Languages spoken (chip selector, pre-filled with Hebrew/English)
  - Specializations (chip selector, max 3)
  - Short bio (optional textarea)
- The "Review" step shifts to Step 4 (or stays Step 3 if they skip)
- The step indicator dynamically shows 3 or 4 steps based on the opt-in choice

**2. Submit logic creates agent profile when opted in**

In `handleSubmit`, after creating the agency, if the user opted in:
- Insert into the `agents` table with `agency_id`, `joined_via: 'agency_admin'`, `status: 'active'`
- Insert the `agent` role into `user_roles` (ignore duplicates)
- The agent is automatically linked to the agency they just created

**3. Onboarding checklist text update**

In `AgencyOnboardingProgress.tsx`:
- Change label from `"Add first team member"` to `"Add additional team member"`
- Change description from `"Build your team"` to `"Invite someone to join your agency"`
- Change completion threshold from `teamCount >= 1` to `teamCount >= 2` (since the admin may count as the first agent)

**4. Review step shows agent info when opted in**

The Review step will show a section for agent profile details if the user opted in, so they can confirm before submitting.

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/agency/AgencyRegister.tsx` | Add opt-in checkbox on Step 2, conditional agent profile step, dynamic step array, agent creation in handleSubmit, agent fields in review |
| `src/components/agency/AgencyOnboardingProgress.tsx` | Update team label/description/threshold |

### Edge Cases

- If user already has an agent profile (rare but possible), the agent insert fails gracefully -- non-blocking
- If user already has agent role, the role insert is non-blocking
- Draft saving will include the new agent opt-in state and agent form fields
- The opt-in is completely optional -- if unchecked, the wizard behaves exactly as it does today (3 steps)
