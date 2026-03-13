

## Plan: Upgrade Agent Onboarding Checklist to Match Agency Style

### Problem
The agent dashboard has a "Getting Started" checklist (`OnboardingChecklist.tsx`) that uses a different design pattern than the agency's "Complete Your Profile" checklist (`AgencyOnboardingProgress.tsx`). The agency version is non-dismissible, uses `rounded-2xl` cards, chevron toggle, and the "Complete Your Profile" title with step count — matching the screenshot the user shared.

### Changes — `src/components/agent/OnboardingChecklist.tsx`

**1. Rename title**: "Getting Started" → "Complete Your Profile" with `{completedCount}/{total} steps` inline

**2. Match agency visual pattern**:
- Use `rounded-2xl border-primary/20` card styling
- Replace "Collapse/Expand" text button + X dismiss with a single chevron toggle (ChevronDown/ChevronUp)
- Remove the dismiss (X) button — make it non-dismissible like the agency version, auto-hides at 100%

**3. Match row styling**:
- Use `rounded-xl` rows with `bg-primary/5` for completed, `bg-muted/30 hover:bg-muted/50` for incomplete
- Show the item's icon on the right for incomplete+linkable items (agency pattern)
- Remove the "next step" highlight border — keep it simpler like the agency version

**4. Keep agent-specific checklist items** (profile enhancement, social links, first listing, submit, approved, first view) — these are already appropriate for agents

**5. Update `AgentDashboard.tsx`**:
- Remove the dismiss handler and `localStorage` logic for onboarding since it's now non-dismissible
- Always render the checklist (it self-hides at 100%)

### Files to Edit
1. `src/components/agent/OnboardingChecklist.tsx` — restyle to match agency pattern
2. `src/pages/agent/AgentDashboard.tsx` — remove dismiss logic, simplify rendering

