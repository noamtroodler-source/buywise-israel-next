

## Agency-Only Registration with Agent Invite Flow

### What Changes

**1. Gate agent registration behind invite codes (required)**

Modify `AgentRegisterWizard.tsx`:
- Remove the "independent" agency choice option — agents MUST have a valid invite code
- If someone lands on `/agent/register` without a `?code=` param, show a friendly message: "Agents join through their agency. Ask your agency manager for an invite link."
- Keep the existing invite code validation logic (it already works well)
- Remove the "Agency" step from the wizard since agency association is now mandatory via code

**2. Remove all standalone agent registration CTAs**

- **`AdvertiseCTA.tsx`**: Remove the "Register as Agent" button, keep only "Register Agency"
- **`ProfessionalTypeChooser.tsx`**: Remove the "Individual Agent" card and "Property Developer" card. Keep only "Agency / Team". Update the section header copy (no longer "Choose Your Path" with 3 options)
- **`Auth.tsx` roleConfig**: Keep the `agent` config (still needed for invite-link flows) but it will only be reachable via invite links

**3. Add invite link step to AgencySubmittedDialog**

After agency registration succeeds, add a new card in the success dialog showing:
- The agency's default invite link (already generated during registration)
- A copy button so the agency owner can immediately share it with their agents
- Copy: "Share this link with your agents so they can join your team"

This requires passing the invite code/link to `AgencySubmittedDialog` from `AgencyRegister.tsx`.

**4. Update Auth.tsx role config copy**

Update the `agent` role config description to mention they're joining via their agency's invitation, e.g.: "Create your account to join your agency's team on BuyWise"

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/agent/AgentRegisterWizard.tsx` | Require invite code; show blocker message if none provided |
| `src/components/advertise/AdvertiseCTA.tsx` | Remove "Register as Agent" button |
| `src/components/advertise/ProfessionalTypeChooser.tsx` | Remove Agent and Developer cards; keep Agency only |
| `src/components/agency/AgencySubmittedDialog.tsx` | Add invite link section with copy button |
| `src/pages/agency/AgencyRegister.tsx` | Pass invite code to success dialog |
| `src/pages/Auth.tsx` | Update agent roleConfig description |

