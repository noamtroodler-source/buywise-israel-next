
## Email System Integration - What's Left To Do

Your email functions are built and ready, but some aren't connected to your app yet. Here's exactly what needs to happen:

---

### Current Status

| Email Type | Function Built | Connected to App | Automated |
|------------|---------------|------------------|-----------|
| Verification Code | Yes | Yes | - |
| Listing Approved/Rejected | Yes | Yes | - |
| New Inquiry (Property) | Yes | Yes | - |
| Price Drop Alert | Yes | - | Yes (every 10 min) |
| Search Matches | Yes | - | Yes (5 min/daily/weekly) |
| Welcome Email | Yes | **No** | - |
| Developer Notifications | Yes | **No** | - |
| Agency Notifications | Yes | **No** | - |
| Weekly Digest | Yes | - | Yes (Sundays 9 AM) |

---

### What Needs To Be Connected

#### 1. Welcome Emails (after registration)

**Where**: Agent, Developer, and Agency registration success handlers

**Action**: After successful registration, call the welcome email function

**Files to modify**:
- `src/pages/agent/AgentRegisterWizard.tsx` - after `agentRegistration.mutateAsync()` succeeds
- `src/pages/developer/DeveloperRegister.tsx` - after developer registration succeeds
- `src/pages/agency/AgencyRegister.tsx` (if exists) - after agency registration succeeds

---

#### 2. Developer Notifications (project approvals)

**Where**: Admin project review hooks

**Action**: When admin approves/rejects/requests changes on a project, send notification to developer

**File to modify**:
- `src/hooks/useAdminProjects.tsx` - add calls to `send-developer-notification` in:
  - `useApproveProject` mutation
  - `useRequestProjectChanges` mutation
  - `useRejectProject` mutation

---

#### 3. Agency Notifications (agent joins)

**Where**: Agent registration flow when using invite code

**Action**: When an agent successfully joins via invite code, notify the agency

**Files to modify**:
- `src/pages/agent/AgentRegisterWizard.tsx` - after agent joins agency via invite code
- Could also add to `src/pages/agency/AgencyDashboard.tsx` for when agents leave

---

#### 4. Re-enable Email Verification (Optional)

**Where**: Email verification component

**Action**: Your domain is verified now - you can turn real verification back on

**File to modify**:
- `src/components/auth/EmailVerificationStep.tsx` - change `SKIP_VERIFICATION = false`

---

### Implementation Summary

| Task | Priority | Complexity |
|------|----------|------------|
| Connect welcome emails | High | Low |
| Connect developer notifications | High | Low |
| Connect agency notifications | Medium | Low |
| Re-enable email verification | Low | Trivial |

---

### Technical Details

**How to call an edge function from the frontend:**
```typescript
await supabase.functions.invoke('send-welcome-email', {
  body: {
    email: 'user@example.com',
    name: 'User Name',
    userType: 'agent' // or 'developer', 'agency', 'buyer'
  }
});
```

**Developer notification payload:**
```typescript
await supabase.functions.invoke('send-developer-notification', {
  body: {
    type: 'project_approved', // or 'project_rejected', 'changes_requested'
    developerId: 'uuid-here',
    projectId: 'uuid-here',
    projectName: 'Project Name',
    message: 'Optional feedback'
  }
});
```

**Agency notification payload:**
```typescript
await supabase.functions.invoke('send-agency-notification', {
  body: {
    type: 'agent_joined',
    agencyId: 'uuid-here',
    agentName: 'Agent Name',
    agentEmail: 'agent@email.com'
  }
});
```

---

### Files To Create/Modify

**Modify (add edge function calls):**
- `src/pages/agent/AgentRegisterWizard.tsx`
- `src/pages/developer/DeveloperRegister.tsx`
- `src/hooks/useAdminProjects.tsx`

**Optional:**
- `src/components/auth/EmailVerificationStep.tsx` (re-enable verification)

All the edge functions, templates, and automation are already done. This is just connecting the wires.
