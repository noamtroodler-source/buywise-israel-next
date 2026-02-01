

# Psychological Safety Layer: Improvements & Polish Plan

## Overview

This plan addresses all identified gaps and enhancements to complete the implementation of the three core features: Questions to Ask, Alternative CTAs, and Readiness Check Tool.

---

## 1. Project Detail Page - Add Questions to Ask

**Problem:** `ProjectDetail.tsx` is missing the `PropertyQuestionsToAsk` component despite being referenced in the original plan.

**Solution:** Create a dedicated `ProjectQuestionsToAsk.tsx` component that uses the existing `useProjectQuestions` hook with construction-specific context.

### Files to Modify

**src/components/project/ProjectQuestionsToAsk.tsx** (Create)

```typescript
interface ProjectQuestionsToAskProps {
  hasPaymentSchedule: boolean;
  hasBankGuarantee: boolean;
  deliveryYear?: number;
}

// Uses useProjectQuestions hook
// Same card design as PropertyQuestionsToAsk but with project-specific framing
// "Questions to Ask the Developer" title
```

**src/pages/ProjectDetail.tsx** (Modify)

- Import `ProjectQuestionsToAsk`
- Add after `ProjectDescription` component (around line 106)
- Pass project context: delivery year, payment schedule info

---

## 2. Buyer Profile - Display Readiness Snapshot

**Problem:** The `readiness_snapshot` is saved to the database but never displayed in the user's profile.

**Solution:** Add a "Journey Status" display in `BuyerProfileSection.tsx` showing their last readiness check results.

### Files to Modify

**src/hooks/useBuyerProfile.tsx** (Modify)

- Add `readiness_snapshot` to the `BuyerProfile` interface
- Create interface for the snapshot structure:

```typescript
interface ReadinessSnapshot {
  stage: 'curious' | 'learning' | 'searching' | 'ready';
  completed_at: string;
  confidence_checks: Record<string, boolean>;
  gaps_identified: string[];
}
```

**src/components/profile/sections/BuyerProfileSection.tsx** (Modify)

- Display readiness snapshot if available
- Show: stage label, completion date, number of gaps
- Add "Retake" button linking to `/tools?tool=readiness`
- Design: subtle card below existing profile data

```text
┌─────────────────────────────────────────────────────────┐
│ Your Journey Status                                      │
│ ─────────────────────────────────────────────────────── │
│ 🌱 Starting to get serious                              │
│ Last checked: 2 days ago                                │
│                                                          │
│ 2 areas to explore                                      │
│                                                          │
│ [Retake Readiness Check]                                │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Fix Mobile Touch Accessibility for Questions

**Problem:** The individual question copy button uses `group-hover:opacity-100` which doesn't work on touch devices.

**Solution:** Make copy buttons always visible on mobile, using hover behavior only on desktop.

### Files to Modify

**src/components/property/PropertyQuestionsToAsk.tsx** (Modify)

- Change copy button class from `opacity-0 group-hover:opacity-100` to `opacity-100 sm:opacity-0 sm:group-hover:opacity-100`
- This makes buttons always visible on mobile (<640px) and hover-reveal on desktop

```tsx
// Line 114-120 - Update the Button className
className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
```

---

## 4. Project Agent Card - Add Permission Statement

**Problem:** `ProjectAgentCard.tsx` has contact buttons but lacks the "Not ready?" alternative that exists in other contact components.

**Solution:** Add the `PermissionStatement` component after the contact buttons.

### Files to Modify

**src/components/project/ProjectAgentCard.tsx** (Modify)

- Import `PermissionStatement` from `@/components/shared/PermissionStatement`
- Add after the "View Agent Profile" link (after line 165)
- Use `variant="inline"` with project-specific guide link

```tsx
<PermissionStatement 
  variant="inline"
  showSaveButton={false}
  guideLink="/guides/new-vs-resale"
  guideLinkText="Read the guide first"
/>
```

---

## 5. Improve useProjectQuestions Hook

**Problem:** The `useProjectQuestions` hook is too restrictive, only filtering by `category === 'construction'`. It doesn't use the `ProjectContext` parameters.

**Solution:** Enhance the filtering logic to actually use the context parameters for smarter question selection.

### Files to Modify

**src/hooks/usePropertyQuestions.ts** (Modify)

Update `useProjectQuestions` to:
1. Include `pricing` and `legal` categories (already does)
2. Add logic to prioritize payment schedule questions if `hasPaymentSchedule` is true
3. Add logic to include bank guarantee questions if `hasBankGuarantee` is relevant
4. Consider delivery year for timeline-related questions

```typescript
export function useProjectQuestions(context: ProjectContext) {
  const query = useQuery({...});

  const filteredQuestions = (query.data || [])
    .filter(q => {
      // Include construction, pricing, legal categories
      const isRelevantCategory = ['construction', 'pricing', 'legal'].includes(q.category);
      if (!isRelevantCategory) return false;
      
      // Boost relevance based on context
      // Questions about payment schedules when hasPaymentSchedule
      // Questions about guarantees when hasBankGuarantee
      return true;
    })
    .slice(0, 8);

  return {...};
}
```

---

## 6. Add Readiness Check Entry Point on Homepage

**Problem:** The Readiness Check tool is valuable but not discoverable from the homepage.

**Solution:** Add a subtle entry point in the `ToolsSpotlight` section or create a dedicated "Not sure where to start?" CTA.

### Options (Choose One)

**Option A: Add to ToolsSpotlight** (Recommended)

- Modify `src/components/home/ToolsSpotlight.tsx`
- Add Readiness Check as the first tool in the spotlight
- Give it special visual treatment (e.g., "Start here" badge)

**Option B: Add to FinalCTA**

- Already has permission-based language
- Add a third button: "Take the Readiness Check" linking to `/tools?tool=readiness`

### Files to Modify

**src/components/home/ToolsSpotlight.tsx** (Modify)

- Add Readiness Check to the highlighted tools
- Position it prominently with "Start here if you're not sure" hint

---

## 7. Seed More Property Questions

**Problem:** The `property_questions` table needs more diverse questions for different property types and conditions.

**Solution:** Add additional questions to cover more scenarios.

### New Questions to Seed

| Category | Question | Trigger |
|----------|----------|---------|
| pricing | "Has the price been negotiated before?" | `days_on_market > 60` |
| building | "When was the building last renovated?" | `year_built < 1980` |
| rental | "What's the minimum lease term?" | `listing_status = for_rent` |
| rental | "Are utilities included in the rent?" | `listing_status = for_rent` |
| legal | "Is there a signed Tabu registration?" | All sales |
| construction | "What penalties apply for delivery delays?" | Projects only |
| construction | "Can I visit the construction site?" | Projects only |

### Files to Modify

**Database migration** - INSERT additional questions with proper `applies_to` JSON

---

## 8. Add "Email to Self" Feature for Questions

**Problem:** The plan mentioned "Email to myself" feature for questions but it wasn't implemented.

**Solution:** Add functionality to email questions to the user (requires auth check).

### Files to Modify

**src/components/property/PropertyQuestionsToAsk.tsx** (Modify)

- Add "Email" button next to "Copy all"
- Opens mailto: with pre-filled subject and body if user is logged in
- Shows sign-in prompt if not authenticated

```tsx
const handleEmailToSelf = () => {
  if (!user) {
    toast.info('Sign in to email questions to yourself');
    return;
  }
  const subject = `Questions to ask about ${propertyTitle}`;
  const body = questions.map((q, i) => `${i + 1}. ${q.question_text}`).join('\n\n');
  window.location.href = `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
```

---

## Implementation Priority

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 1 | Fix mobile touch accessibility (#3) | Low | High |
| 2 | Add Questions to Projects (#1) | Medium | High |
| 3 | Display readiness snapshot in profile (#2) | Medium | Medium |
| 4 | Add permission statement to ProjectAgentCard (#4) | Low | Medium |
| 5 | Improve useProjectQuestions hook (#5) | Low | Medium |
| 6 | Add homepage entry point (#6) | Low | Medium |
| 7 | Seed more questions (#7) | Medium | Medium |
| 8 | Email to self feature (#8) | Low | Low |

---

## Summary of Changes

### New Files
- `src/components/project/ProjectQuestionsToAsk.tsx`

### Modified Files
- `src/pages/ProjectDetail.tsx` - Add ProjectQuestionsToAsk
- `src/components/property/PropertyQuestionsToAsk.tsx` - Fix mobile touch, add email feature
- `src/hooks/useBuyerProfile.tsx` - Add ReadinessSnapshot interface
- `src/components/profile/sections/BuyerProfileSection.tsx` - Display journey status
- `src/components/project/ProjectAgentCard.tsx` - Add PermissionStatement
- `src/hooks/usePropertyQuestions.ts` - Improve useProjectQuestions
- `src/components/home/ToolsSpotlight.tsx` - Add Readiness Check entry point
- `src/components/project/index.ts` - Export ProjectQuestionsToAsk

### Database Changes
- Add more seed data to `property_questions` table

---

## Design Consistency

All new components will follow existing patterns:
- Card styling: `Card` + `CardContent` from shadcn
- Icons: Lucide React
- Animation: Framer Motion with consistent delays
- Typography: Existing Tailwind classes
- Colors: Primary blue for positive states, muted for secondary
- Mobile-first responsive design

