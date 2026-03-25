

## Plan: Add Country, Referral Source, Budget & Target Cities to Onboarding Wizard

### What We're Building

Adding 4 new data points to the buyer onboarding wizard, inserted after the financing step (step 6) in the agreed "second order":

**Current flow:** Intro → 1(Residency) → 2(Aliyah) → 3(Ownership) → 4(Purpose) → 5(Entity) → 6(Financing) → 7(Locations)

**New flow:** Intro → 1(Residency) → 2(Aliyah) → 3(Ownership) → 4(Purpose) → 5(Entity) → 6(Financing) → **7(Budget, optional)** → **8(Target Cities, optional)** → 9(Locations)

Country + Referral Source go on the **signup form** (Auth.tsx), not the wizard.

---

### Database Changes

**Migration: Add 3 new columns to `buyer_profiles`:**
- `country` (text, nullable) — country where user currently lives
- `city_of_residence` (text, nullable) — city where user currently lives  
- `referral_source` (text, nullable) — how they heard about BuyWise

`budget_min`, `budget_max`, and `target_cities` already exist in the table — no migration needed for those.

**Migration: Add 2 new columns to `profiles`:**
- `country` (text, nullable) — synced from signup form
- `referral_source` (text, nullable)

---

### File Changes

#### 1. `src/pages/Auth.tsx` — Add Country + Referral to Signup Form
- Add a "Where do you live?" country dropdown (curated list of top source countries: USA, UK, Canada, Australia, France, South Africa, Germany, Argentina, Israel, Other)
- Add a "How did you hear about us?" dropdown (Google, Social Media, Friend/Family, Real Estate Agent, News/Blog, Other)
- Both fields appear only on the **signup** tab, below Full Name
- Save to `profiles` table on account creation via the existing profile trigger or an update after signup
- Trusted-friend copy: labels are conversational, not formal

#### 2. `src/components/onboarding/BuyerOnboarding.tsx` — Add Budget + Target Cities Steps

**New Step 7: Budget Range (optional, skippable)**
- Heading: *"What's your budget range?"*
- Subtext: *"We'll highlight properties in your range and flag great deals — never shared with anyone without your permission."*
- Two `FormattedNumberInput` fields: "From" and "Up to" with ₪/$ currency toggle (reusing existing pattern from step 6)
- Skip button: "Skip for now"
- Matches existing card/radio styling with `border border-border hover:border-primary/50` pattern

**New Step 8: Target Cities (optional, skippable)**
- Heading: *"Which areas are you considering?"*
- Subtext: *"We'll prioritize these in your search and alert you to new listings and price drops."*
- Multi-select toggle grid of Israeli cities (pulled from `CITY_TO_DISTRICT` keys — same 25 cities already in platform)
- Grouped by region for easy scanning
- Each city is a toggle chip (pressed = selected, using existing `Toggle` component pattern)
- Skip button: "Skip for now"

**Navigation updates:**
- `Step` type changes from `'intro' | 1 | 2 | 3 | 4 | 5 | 6 | 7` to include `8 | 9`
- `getNextStep`, `getPrevStep`, `getStepNumber`, `getTotalSteps` updated
- `canProceed` returns `true` for steps 7 and 8 (optional)
- `handleSkipStep` extended to handle steps 7 and 8
- `handleComplete` updated to include `budget_min`, `budget_max`, `target_cities` in the saved profile data
- `saveStepProgress` extended with step data for 7 and 8
- Step counter updates: total steps becomes 9 (oleh) or 8 (non-oleh)

#### 3. `src/hooks/useBuyerProfile.tsx` — No changes needed
Already has `budget_min`, `budget_max`, `target_cities` in the `BuyerProfile` interface.

#### 4. Auth signup handler — Save country + referral
After successful signup, update the `profiles` row with `country` and `referral_source` from the form fields.

---

### Design Details

- All new steps follow the exact same motion animation pattern (`initial={{ opacity: 0, x: 20 }}`)
- Same card styling with rounded-lg borders, hover states, and primary color accents
- Currency toggle for budget reuses the exact `Toggle` component pattern from step 6's down payment section
- City chips use a grid layout with `Toggle` pressed states
- "Skip for now" button uses existing `variant="outline"` pattern
- Privacy reassurance line uses `Shield` icon + muted text, matching existing trust footer pattern
- Step progress counter in dialog header updates automatically

