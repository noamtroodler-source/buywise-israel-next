
# Personalized "Questions to Ask" System

## Overview

This plan implements a comprehensive personalization system for the "Questions to Ask" feature that tailors questions based on:

1. **Buyer/Renter Profile** - first-time buyer, oleh hadash, investor, upgrader, renter, etc.
2. **Property Context** - listing type, property conditions, age, price movements
3. **User Authentication State** - signed-in vs. guest users

The implementation follows existing design patterns (PersonalizationHeader, GuestAssumptionsBanner, deriveEffectiveBuyerType) to ensure visual and architectural consistency.

---

## Current State Analysis

### What Exists Today
- `property_questions` table with `applies_to` JSONB for property-based filtering
- `usePropertyQuestions` hook filters by listing_status, property_type, and conditions
- `PropertyQuestionsToAsk` and `ProjectQuestionsToAsk` components display questions
- `buyer_profiles` table with full buyer dimensions (residency_status, is_first_property, buyer_entity, is_upgrading, etc.)
- `deriveEffectiveBuyerType()` function that maps profile to buyer types (first_time, oleh, investor, upgrader, foreign, company)
- `useBuyerProfile()` hook for fetching authenticated user's profile
- `GuestSignupNudge` and `GuestAssumptionsBanner` patterns for guest/authenticated differentiation

### What's Missing
- No `buyer_relevance` metadata on questions
- No buyer-specific questions in the database
- No buyer profile integration in the questions hook
- No differentiated UI for authenticated vs. guest users in Questions components

---

## Database Changes

### 1. Add `buyer_relevance` Column to `property_questions`

```sql
ALTER TABLE property_questions 
ADD COLUMN buyer_relevance JSONB DEFAULT NULL;

COMMENT ON COLUMN property_questions.buyer_relevance IS 
'Buyer type targeting: buyer_types (array), residency_status (array), purchase_purpose (array), is_universal (bool)';
```

**Schema for `buyer_relevance` JSONB:**
```json
{
  "buyer_types": ["first_time", "oleh", "upgrader", "investor", "foreign", "company"],
  "residency_status": ["israeli_resident", "oleh_hadash", "non_resident"],
  "purchase_purpose": ["primary_residence", "investment", "vacation_home"],
  "is_universal": false
}
```

### 2. Seed Buyer-Specific Questions

New questions will be inserted for different buyer personas:

| Question | Buyer Types | Category |
|----------|-------------|----------|
| "What purchase tax (mas rechisha) will I owe on this property?" | first_time, upgrader | pricing |
| "Am I eligible for the reduced oleh tax rate, and what documentation is needed?" | oleh | pricing |
| "Will purchasing this property affect my first-apartment tax exemption?" | upgrader | legal |
| "What's the expected rental yield for this property?" | investor | pricing |
| "Can I rent this property out while living abroad?" | investor, foreign | legal |
| "What are the capital gains tax implications if I sell within 4 years?" | investor, upgrader | legal |
| "What's the landlord's policy on lease renewal and rent increases?" | renter | rental |
| "Is the landlord open to a longer lease term for stability?" | renter | rental |
| "What happens to my deposit if the landlord sells the property?" | renter | rental |

Existing universal questions will be updated with `"is_universal": true`.

---

## Hook Enhancements

### File: `src/hooks/usePropertyQuestions.ts`

**New Types:**
```typescript
// Extended question interface with buyer relevance
interface PropertyQuestion {
  id: string;
  question_text: string;
  why_it_matters: string;
  category: string;
  applies_to: {...} | null;
  priority: number;
  buyer_relevance: {
    buyer_types?: string[];
    residency_status?: string[];
    purchase_purpose?: string[];
    is_universal?: boolean;
  } | null;
}

// Extended context with buyer info
export interface PropertyContext {
  // Existing property fields
  listingStatus: ListingStatus;
  propertyType?: PropertyType | string;
  yearBuilt?: number;
  hasVaadBayit: boolean;
  hasParking: boolean;
  daysOnMarket: number;
  priceReduced: boolean;
  missingFields: string[];
  
  // NEW: Buyer context
  buyerType?: BuyerType; // from deriveEffectiveBuyerType
  residencyStatus?: 'israeli_resident' | 'oleh_hadash' | 'non_resident';
  purchasePurpose?: 'primary_residence' | 'investment' | 'vacation_home';
  isAuthenticated: boolean;
}
```

**New Scoring Algorithm:**
```typescript
function calculateRelevanceScore(
  question: PropertyQuestion, 
  context: PropertyContext
): number {
  let score = question.priority || 50;
  
  // PROPERTY MATCH BONUS (+20 max)
  if (matchesPropertyConditions(question, context)) {
    score += 20;
  }
  
  // BUYER TYPE MATCH BONUS (+25 max) - only for authenticated users
  if (context.isAuthenticated && context.buyerType) {
    const buyerRelevance = question.buyer_relevance;
    
    if (buyerRelevance?.is_universal) {
      score += 10; // Universal questions get moderate boost
    } else if (buyerRelevance?.buyer_types?.includes(context.buyerType)) {
      score += 25; // Direct buyer type match
    }
    
    // Residency match
    if (context.residencyStatus && 
        buyerRelevance?.residency_status?.includes(context.residencyStatus)) {
      score += 10;
    }
  } else {
    // Guest users: prioritize universal and first-time questions
    if (question.buyer_relevance?.is_universal) {
      score += 15;
    }
    if (question.buyer_relevance?.buyer_types?.includes('first_time')) {
      score += 10;
    }
  }
  
  return score;
}
```

**Updated Hook Return:**
```typescript
export function usePropertyQuestions(context: PropertyContext) {
  const query = useQuery({...});

  const filteredQuestions = useMemo(() => {
    return (query.data || [])
      .filter(q => matchesConditions(q, context))
      .map(q => ({
        ...q,
        relevanceScore: calculateRelevanceScore(q, context),
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8);
  }, [query.data, context]);

  return {
    questions: filteredQuestions,
    isLoading: query.isLoading,
    error: query.error,
    isPersonalized: context.isAuthenticated && !!context.buyerType,
  };
}
```

---

## Component Updates

### File: `src/components/property/PropertyQuestionsToAsk.tsx`

**New Props Interface:**
```typescript
interface PropertyQuestionsToAskProps {
  context: PropertyContext;
  className?: string;
}
```

**UI Changes:**

1. **Header Personalization Badge** (for authenticated users with profile):
```tsx
// After the title, show personalization indicator
{isPersonalized && (
  <div className="flex items-center gap-1.5 text-xs">
    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
    <span className="text-muted-foreground">
      Personalized for{' '}
      <span className="font-medium text-foreground">{buyerTypeLabel}</span>
    </span>
  </div>
)}
```

2. **Guest Nudge Footer** (for non-authenticated users):
```tsx
{!user && (
  <div className="pt-3 border-t border-border/50">
    <GuestSignupNudge
      variant="inline"
      icon={Sparkles}
      message="Get questions tailored to your buyer type —"
      ctaText="Sign up free"
      intent="questions_personalization"
    />
  </div>
)}
```

3. **Renter-Specific Messaging** (when listing is for_rent):
```tsx
// Replace footer message for rentals
<p className="text-xs text-muted-foreground text-center italic">
  {context.listingStatus === 'for_rent' 
    ? "Renting is a big commitment — take time to understand the terms."
    : "Take your time — there's no rush to ask everything at once."}
</p>
```

### File: `src/components/project/ProjectQuestionsToAsk.tsx`

Similar updates with project-specific messaging and context.

---

## Page Integration Updates

### File: `src/pages/PropertyDetail.tsx`

**Pass buyer context to PropertyQuestionsToAsk:**
```tsx
import { useBuyerProfile, profileToDimensions, getEffectiveBuyerType } from '@/hooks/useBuyerProfile';
import { useAuth } from '@/hooks/useAuth';

// Inside component:
const { user } = useAuth();
const { data: buyerProfile } = useBuyerProfile();
const derivedBuyerType = buyerProfile ? getEffectiveBuyerType(buyerProfile) : null;

// In JSX:
<PropertyQuestionsToAsk 
  context={{
    listingStatus: property.listing_status,
    propertyType: property.property_type,
    yearBuilt: property.year_built || undefined,
    hasVaadBayit: !!property.vaad_bayit_monthly,
    hasParking: !!(property as any).parking_spots,
    daysOnMarket,
    priceReduced: !!(property as any).original_price,
    missingFields: [...],
    // NEW buyer context
    buyerType: derivedBuyerType?.taxType,
    residencyStatus: buyerProfile?.residency_status,
    purchasePurpose: buyerProfile?.purchase_purpose,
    isAuthenticated: !!user,
  }}
/>
```

### File: `src/pages/ProjectDetail.tsx`

Similar integration for projects.

---

## Visual Design

### Authenticated User with Profile
```text
┌────────────────────────────────────────────────────────────────┐
│ 💬 Questions to Ask                                [Copy all]   │
│ ─────────────────────────────────────────────────────────────── │
│ ✓ Personalized for Oleh Hadash                                  │
│                                                                 │
│ 1. "Am I eligible for the reduced oleh tax rate?"              │
│    💡 Olim get 0.5% tax rate up to ₪6M for 7 years             │
│                                                                 │
│ 2. "Has the price been reduced since listing?"                 │
│    💡 Price history reveals seller motivation                   │
│                                                                 │
│ [Show 3 more questions]                                        │
│ ─────────────────────────────────────────────────────────────── │
│ Take your time — there's no rush to ask everything at once.    │
└────────────────────────────────────────────────────────────────┘
```

### Guest User
```text
┌────────────────────────────────────────────────────────────────┐
│ 💬 Questions to Ask                                [Copy all]   │
│ ─────────────────────────────────────────────────────────────── │
│ Questions for first-time buyers                                 │
│                                                                 │
│ 1. "Has the price been reduced since listing?"                 │
│    💡 Price history reveals seller motivation                   │
│                                                                 │
│ 2. "Are there any issues with the Tabu registration?"          │
│    💡 Registration issues can delay closing                     │
│                                                                 │
│ [Show 3 more questions]                                        │
│ ─────────────────────────────────────────────────────────────── │
│ ✨ Get questions tailored to your buyer type — Sign up free →  │
└────────────────────────────────────────────────────────────────┘
```

### Renter (For Rent Listings)
```text
┌────────────────────────────────────────────────────────────────┐
│ 💬 Questions to Ask the Landlord                   [Copy all]   │
│ ─────────────────────────────────────────────────────────────── │
│ Before signing a lease, consider asking:                        │
│                                                                 │
│ 1. "How is the rent indexed? (Madad / CPI linkage)"            │
│    💡 Indexed rent can increase significantly over time         │
│                                                                 │
│ 2. "What's the landlord's policy on lease renewal?"            │
│    💡 Knowing renewal terms helps plan your stay                │
│                                                                 │
│ ─────────────────────────────────────────────────────────────── │
│ Renting is a big commitment — take time to understand terms.   │
└────────────────────────────────────────────────────────────────┘
```

---

## Implementation Files Summary

| File | Action | Purpose |
|------|--------|---------|
| **Database Migration** | CREATE | Add `buyer_relevance` column + seed buyer-specific questions |
| `src/hooks/usePropertyQuestions.ts` | MODIFY | Add buyer context, scoring algorithm, `isPersonalized` flag |
| `src/components/property/PropertyQuestionsToAsk.tsx` | MODIFY | Add personalization badge, guest nudge, renter messaging |
| `src/components/project/ProjectQuestionsToAsk.tsx` | MODIFY | Same treatment for projects |
| `src/pages/PropertyDetail.tsx` | MODIFY | Pass buyer context from useBuyerProfile |
| `src/pages/ProjectDetail.tsx` | MODIFY | Pass buyer context for projects |

---

## Question Data (To Be Seeded)

### Buyer-Type Specific Questions

**First-Time Buyers:**
- "What purchase tax (mas rechisha) will I owe on this property?" → first-time, upgrader
- "Is the building's reserve fund sufficient for upcoming maintenance?" → first-time (they're new to this)

**Oleh Hadash:**
- "Am I eligible for the reduced oleh tax rate, and what documentation is needed?" → oleh only
- "Can I complete the purchase with an Israeli lawyer who speaks English?" → oleh

**Investors:**
- "What's the expected rental yield for this property?" → investor
- "Are there any rental restrictions or HOA rules about short-term rentals?" → investor
- "What are the capital gains tax implications if I sell within 4 years?" → investor

**Foreign Buyers:**
- "Can I complete the purchase remotely, or do I need to be in Israel?" → foreign
- "Will I need to open an Israeli bank account?" → foreign

**Upgraders:**
- "Will purchasing this property affect my first-apartment tax exemption?" → upgrader
- "What's the timeline if I need to sell my current property first?" → upgrader

**Renters:**
- "How is the rent indexed? (Madad / CPI linkage)" → renter (already exists, update buyer_relevance)
- "Is the landlord open to a longer lease term for stability?" → renter
- "What happens to my deposit if the landlord sells the property?" → renter
- "Can I make minor modifications to the apartment (painting, shelving)?" → renter

### Universal Questions (Apply to Everyone)
All existing questions without specific buyer_relevance will be marked as `"is_universal": true`.

---

## Technical Considerations

1. **Backwards Compatibility**: Existing questions without `buyer_relevance` continue to work (treated as universal)
2. **Performance**: Questions are cached for 1 hour, scoring happens client-side
3. **Mobile UX**: Copy buttons remain always visible on mobile per existing pattern
4. **Guest Experience**: Defaults to "first-time buyer" logic for questions, with explicit nudge to personalize
5. **Design Consistency**: Uses existing `GuestSignupNudge`, `Badge`, and color tokens (primary/10, muted, etc.)

---

## Summary

This implementation adds comprehensive buyer personalization to the Questions to Ask feature:

- **Database**: New `buyer_relevance` column + 15+ buyer-specific questions
- **Logic**: Scoring algorithm that prioritizes buyer-type matches for authenticated users
- **UI**: Personalization badges for logged-in users, signup nudges for guests
- **Context**: Full buyer profile integration via existing `useBuyerProfile` hook
- **Design**: Follows established patterns (PersonalizationHeader, GuestAssumptionsBanner)

All changes maintain visual consistency with the existing brand and provide meaningful value differentiation between guest and authenticated experiences.
