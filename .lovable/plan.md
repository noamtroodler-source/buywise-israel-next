
# Progressive Onboarding with Step-by-Step Persistence

## Summary
Save user progress after each wizard step so they never lose data if they exit early. When they return to Profile, show a friendly "Resume Setup" prompt that takes them back to where they left off.

---

## Key Concept: `onboarding_step` Field

Add a new field to `buyer_profiles` to track progress:
- `onboarding_step`: `null` (not started), `1-7` (in progress), or `'complete'` (finished)
- Each wizard step saves its data + updates `onboarding_step`
- `onboarding_completed` becomes `true` only when all steps are done

---

## Implementation

### Part 1: Database Change

Add `onboarding_step` column to `buyer_profiles`:

```sql
ALTER TABLE public.buyer_profiles 
ADD COLUMN IF NOT EXISTS onboarding_step text DEFAULT NULL;

COMMENT ON COLUMN public.buyer_profiles.onboarding_step IS 
  'Tracks wizard progress: null=not started, 1-7=current step, complete=finished';
```

---

### Part 2: Create Profile Early (After Step 1)

Currently, profile is created only when the entire wizard completes. Change this to create/update after each step.

**New approach in `BuyerOnboarding.tsx`:**

```typescript
// Save progress after each step
const saveStepProgress = async (stepNumber: number) => {
  const partialData = {
    ...getCurrentStepData(stepNumber),
    onboarding_step: stepNumber.toString(),
    onboarding_completed: false,
  };
  
  if (existingProfile) {
    await updateProfile.mutateAsync(partialData);
  } else {
    await createProfile.mutateAsync(partialData);
  }
};

// Modify handleNext to save before advancing
const handleNext = async () => {
  const currentStepNumber = getStepNumber();
  
  // Save current step's data
  if (typeof step === 'number') {
    await saveStepProgress(currentStepNumber);
  }
  
  // Then advance to next step
  const nextStep = getNextStep(step);
  setStep(nextStep);
};
```

**Data saved per step:**

| Step | Data Saved |
|------|------------|
| 1 | `residency_status` |
| 2 | `aliyah_year` (if Oleh) |
| 3 | `is_first_property`, `is_upgrading` |
| 4 | `purchase_purpose` |
| 5 | `buyer_entity` |
| 6 | `mortgage_preferences` (optional) |
| 7 | `saved_locations` (optional) |

---

### Part 3: Resume from Saved Step

When opening the wizard with an existing profile that has `onboarding_step` set (but not 'complete'), start from that step.

```typescript
// In BuyerOnboarding.tsx useEffect
useEffect(() => {
  if (open) {
    setAnswers(getInitialAnswers(existingProfile));
    
    // Resume from saved step if incomplete
    if (existingProfile?.onboarding_step && 
        existingProfile.onboarding_step !== 'complete') {
      const savedStep = parseInt(existingProfile.onboarding_step);
      setStep(savedStep as Step);
    } else {
      setStep('intro');
    }
  }
}, [open, existingProfile]);
```

---

### Part 4: Profile Page "Resume Setup" Card

When profile exists but `onboarding_completed === false`, show a special card in `ProfileWelcomeHeader.tsx`:

```tsx
// New component: ResumeSetupPrompt
{!profile?.onboarding_completed && profile?.onboarding_step && (
  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mt-4">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Play className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-foreground">Pick up where you left off</p>
        <p className="text-sm text-muted-foreground">
          You're on step {profile.onboarding_step} of 7 — just a few more to unlock personalized insights
        </p>
      </div>
      <Button size="sm" onClick={() => setShowOnboarding(true)}>
        Resume
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  </div>
)}
```

---

### Part 5: Update Completion Logic

Mark complete when finishing final step:

```typescript
const handleComplete = async () => {
  const profileData = {
    ...answers,
    onboarding_completed: true,
    onboarding_step: 'complete',
    mortgage_preferences: mortgagePreferences,
    ...(savedLocations.length > 0 && { saved_locations: savedLocations }),
  };

  // Update or create final profile
  if (existingProfile) {
    await updateProfile.mutateAsync(profileData);
  } else {
    await createProfile.mutateAsync(profileData);
  }
  onComplete();
};
```

---

### Part 6: Update Profile Completion Hook

Adjust `useProfileCompletion.tsx` to handle partial profiles:

```typescript
// Buyer profile is "complete" only if onboarding_completed is true
{
  key: 'buyer-profile',
  label: 'Buyer Profile',
  isComplete: buyerProfile?.onboarding_completed === true,
  description: buyerProfile?.onboarding_step && !buyerProfile.onboarding_completed
    ? 'Resume setup to finish'
    : 'Tax status and property ownership',
}
```

---

## User Experience Flow

**User exits mid-wizard:**
1. Completes Step 3 (property ownership) → Data saved
2. Clicks X to close → Toast: "Progress saved — pick up anytime from your profile"
3. Navigates elsewhere or closes browser

**User returns later:**
1. Goes to Profile page
2. Sees "Pick up where you left off" card showing Step 4
3. Clicks "Resume" → Wizard opens at Step 4
4. Completes remaining steps → Full profile activated

---

## Visual: Profile Header States

**State A: Never started**
```
┌────────────────────────────────────────────────┐
│  ○ 0%   Profile Setup                          │
│         Next step: Set up buyer profile        │
└────────────────────────────────────────────────┘
```

**State B: Partially complete (new!)**
```
┌────────────────────────────────────────────────┐
│  🎯 Pick up where you left off                 │
│     Step 4 of 7 — almost there!     [Resume →] │
└────────────────────────────────────────────────┘
│  ○ 25%  Profile Setup                          │
│         Resume setup to finish                 │
└────────────────────────────────────────────────┘
```

**State C: Complete**
```
┌────────────────────────────────────────────────┐
│  ✓ 100%  Profile Setup                         │
│          All set! Your profile is complete.   │
└────────────────────────────────────────────────┘
```

---

## Files Changed

| File | Changes |
|------|---------|
| **Database Migration** | Add `onboarding_step` column to `buyer_profiles` |
| `src/components/onboarding/BuyerOnboarding.tsx` | Save after each step, resume from saved step |
| `src/components/profile/ProfileWelcomeHeader.tsx` | Add "Resume Setup" prompt card |
| `src/hooks/useProfileCompletion.tsx` | Update completion logic for partial profiles |
| `src/hooks/useBuyerProfile.tsx` | Add `onboarding_step` to type interface |
| `src/pages/Auth.tsx` | Update close handler toast message |
| **Total** | **5 code files + 1 migration** |

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| User clears browser data | Profile persisted in DB, loads on next login |
| User returns after days/weeks | Resume prompt still shows saved step |
| User wants to start over | "Edit Profile" restarts from intro |
| Multiple devices | Profile syncs via Supabase |
| User skips optional steps | Skip still saves current progress |
