

# Add Personalization Intro Step to Buyer Onboarding

## Overview
Add a welcoming introduction step ("Step 0") before the personalization wizard begins. This sets the tone, explains the value of providing information, and makes users feel excited rather than interrogated.

## User Experience Goal

Transform the feeling from:
> "Oh no, why do they want all this stuff from me?"

To:
> "This will help me get exactly what I need!"

---

## Design

### Intro Card Layout

```text
┌──────────────────────────────────────────────────────┐
│                                                      │
│        [Sparkles Icon in Primary Blue]              │
│                                                      │
│     Your personalized buying experience             │
│              starts here                            │
│                                                      │
│  The more we know about you, the more we can        │
│  tailor your experience — from accurate cost        │
│  estimates to tax savings you might be eligible     │
│  for.                                                │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ ✓  See costs personalized to your situation   │ │
│  │ ✓  Discover tax benefits you qualify for      │ │
│  │ ✓  Get accurate mortgage calculations         │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Takes about 2 minutes                              │
│                                                      │
│                              [Get Started →]        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Content Strategy
- **Headline**: Warm and inviting, not corporate
- **Body**: Short, benefit-focused (2-3 sentences max)
- **Benefits List**: 3 quick checkmarks showing what they'll gain
- **Time Estimate**: "Takes about 2 minutes" to reduce friction
- **Single CTA**: "Get Started" button to proceed

---

## Technical Implementation

### File: `src/components/onboarding/BuyerOnboarding.tsx`

**1. Add "intro" as Step 0**

Update the Step type to include an intro step:
```typescript
type Step = 'intro' | 1 | 2 | 3 | 4 | 5 | 6 | 7;
```

**2. Initialize at 'intro' step**
```typescript
const [step, setStep] = useState<Step>('intro');
```

**3. Add navigation logic**

Update `getNextStep`:
- From `'intro'` → go to step `1`

Update `handleBack`:
- From step `1` → go to `'intro'`

**4. Update step numbering display**

The intro step doesn't count in "Step X of Y" — it's a welcome screen, not a question. When on intro, show nothing or a different header like "Welcome".

**5. Add intro step render block**

Add a new motion.div block for step `'intro'` within the AnimatePresence:

```tsx
{step === 'intro' && (
  <motion.div
    key="intro"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6 text-center py-4"
  >
    <div className="flex justify-center">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
    </div>
    
    <div className="space-y-2">
      <h3 className="text-xl font-semibold text-foreground">
        Your personalized buying experience starts here
      </h3>
      <p className="text-muted-foreground">
        The more we know about you, the more we can tailor your experience — 
        from accurate cost estimates to tax savings you might qualify for.
      </p>
    </div>
    
    <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <Check className="h-4 w-4 text-primary flex-shrink-0" />
        <span>See costs personalized to your situation</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Check className="h-4 w-4 text-primary flex-shrink-0" />
        <span>Discover tax benefits you qualify for</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Check className="h-4 w-4 text-primary flex-shrink-0" />
        <span>Get accurate mortgage calculations</span>
      </div>
    </div>
    
    <p className="text-xs text-muted-foreground">Takes about 2 minutes</p>
  </motion.div>
)}
```

**6. Update navigation buttons**

For the intro step:
- No "Back" button (it's the first screen)
- Button says "Get Started" instead of "Continue"

**7. Update DialogHeader for intro**

When on intro step, hide the "Step X of Y" text or show a different header:
```tsx
<DialogDescription>
  {step === 'intro' 
    ? null  // Or show nothing for intro
    : `Step ${getStepNumber()} of ${getTotalSteps()} — This helps us show you accurate cost estimates`
  }
</DialogDescription>
```

**8. Add Sparkles icon import**
```typescript
import { ..., Sparkles } from 'lucide-react';
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/onboarding/BuyerOnboarding.tsx` | Add 'intro' step type, render intro card, update navigation logic, import Sparkles icon |

---

## Result

Users will see a warm, welcoming intro screen that:
1. Explains why we're asking questions (benefit-focused)
2. Lists 3 specific benefits they'll get
3. Sets expectations with a time estimate
4. Uses the brand's primary blue color palette
5. Feels inviting, not invasive

