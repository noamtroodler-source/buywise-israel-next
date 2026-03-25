

## Plan: Add "Change Anytime" Reassurance + Polish Wizard to Brand Standards

### What's Changing

Two refinements to the onboarding wizard:

1. **Add clear "change anytime" messaging** to the intro step and ensure consistency across all optional steps
2. **Minor brand polish** to ensure the wizard matches BuyWise Israel's trusted-friend voice and elevated design system

---

### File Changes

**File: `src/components/onboarding/BuyerOnboarding.tsx`**

#### 1. Intro Step — Add "change anytime" reassurance
In the intro step (around line 508-518), update the trust footer to include a third item:
- Current: "Just 2 minutes" + "Your info stays private"
- New: "Just 2 minutes" + "Your info stays private" + "Change anytime in your profile"
- Uses `Pencil` or `Settings` icon for consistency with the profile settings tab icon

#### 2. Standardize helper text across optional steps
- **Step 6** (Financing): No helper text currently — add "You can update your financing preferences anytime in your profile settings" at the bottom
- **Step 7** (Budget): Already has privacy note — add "You can adjust this anytime in your profile" alongside or replacing the duplicate privacy line
- **Step 8** (Target Cities, line 1089-1092): Already says "You can change these anytime in your profile" — keep as-is
- **Step 9** (Locations, line 1209-1212): Already says "You can always add more locations later in your profile settings" — keep as-is

#### 3. Dialog description update
Update the `DialogDescription` (line 439) from:
> "Step X of Y — This helps us show you accurate cost estimates"

To:
> "Step X of Y — You can change any of this later in your profile"

This is the single most visible place to communicate the "change anytime" message since it appears on every step.

---

### Design Notes
- All changes use existing component patterns (muted text, small icons, flex layouts)
- No new components or dependencies needed
- Matches the trusted-friend voice: reassuring, low-pressure

