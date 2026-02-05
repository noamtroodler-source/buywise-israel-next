

# Hebrew Real Estate Glossary Flashcards

## Overview

Creating an interactive flashcard study mode for the Hebrew Real Estate Glossary. This feature transforms the existing term data into an engaging learning experience with:

- **Card flip animations** showing Hebrew on front, English + explanation on back
- **Progress tracking** persisted to localStorage
- **Study modes** (all terms, saved terms, by journey stage, by category)  
- **Gamification** with streaks, completion celebration, and "mastered" tracking
- **Mobile-optimized** swipe gestures following the Embla carousel patterns already in use

---

## Why This Matters

For English speakers buying property in Israel, recognizing Hebrew terms is critical:
- Reading contracts with Hebrew legal terminology
- Understanding listings on Yad2/Madlan
- Communicating with Israeli lawyers, agents, notaries
- Feeling confident rather than lost in meetings

Flashcards are proven to accelerate vocabulary retention through active recall.

---

## User Experience Flow

```text
Glossary Page
     │
     ├── [New] "Study Mode" button in hero section
     │
     └──► Flashcard Modal (fullscreen on mobile, dialog on desktop)
          │
          ├── Deck Selection
          │   ├── All Terms (47)
          │   ├── Saved Terms (12)
          │   ├── By Journey Stage
          │   │   ├── Before You Start (8)
          │   │   ├── During Research (15)
          │   │   ├── Making an Offer (12)
          │   │   └── Closing & After (12)
          │   └── By Category
          │       ├── Legal (10)
          │       ├── Tax & Finance (8)
          │       └── ... etc
          │
          └── Study Session
              │
              ├── Progress bar (3/20 cards)
              │
              ├── Flashcard (tap/click to flip)
              │   │
              │   ├── FRONT: Hebrew term (large)
              │   │          + Transliteration
              │   │          + Category badge
              │   │
              │   └── BACK: English term
              │            + Simple explanation
              │            + "When you'll see this"
              │
              ├── Self-rating buttons
              │   ├── "Still Learning" (redo later)
              │   └── "Got It!" (mark mastered)
              │
              ├── Navigation
              │   ├── Swipe left/right (mobile)
              │   ├── Arrow buttons (desktop)
              │   └── Keyboard arrows (desktop)
              │
              └── Session Complete
                  ├── Stats (X mastered, Y to review)
                  ├── Confetti celebration
                  └── Continue / Exit options
```

---

## Technical Architecture

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/glossary/FlashcardStudyModal.tsx` | Main modal container with deck selection and session management |
| `src/components/glossary/Flashcard.tsx` | Individual flip card with front/back states |
| `src/components/glossary/FlashcardProgress.tsx` | Progress bar and session stats |
| `src/components/glossary/FlashcardDeckSelector.tsx` | Grid of deck options with term counts |
| `src/hooks/useFlashcardProgress.ts` | LocalStorage hook for tracking mastered terms and session stats |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Glossary.tsx` | Add "Study Mode" button in hero, import modal |
| `src/components/glossary/GlossaryHero.tsx` | Add Study Mode CTA button |
| `src/components/glossary/index.ts` | Export new components |

---

## Component Details

### 1. FlashcardStudyModal

Container that handles:
- Fullscreen on mobile (`fixed inset-0`), centered dialog on desktop
- State machine: `deck_selection` → `studying` → `complete`
- Keyboard navigation (left/right arrows, space to flip)
- Exit confirmation if session in progress

```typescript
interface FlashcardStudyModalProps {
  open: boolean;
  onClose: () => void;
  terms: GlossaryTerm[];
  savedTerms: Set<string>;
}
```

### 2. Flashcard

Individual card with 3D flip animation using Framer Motion:

```typescript
interface FlashcardProps {
  term: GlossaryTerm;
  isFlipped: boolean;
  onFlip: () => void;
}
```

Card design:
- **Front**: Large Hebrew text (centered), transliteration below, category badge at bottom
- **Back**: English term (large), simple explanation, "When you'll see this" context

Flip animation using CSS perspective + Framer Motion:
```css
.card-inner {
  transform-style: preserve-3d;
  transition: transform 0.6s;
}
.card-inner.flipped {
  transform: rotateY(180deg);
}
```

### 3. FlashcardProgress

Shows:
- Current position (3 of 20)
- Progress bar (using existing `Progress` component)
- "Still Learning" vs "Mastered" counts for session
- Streak indicator (consecutive "Got It" cards)

### 4. FlashcardDeckSelector

Grid of selectable decks:
- Uses the journey stage icons from `JourneySelector`
- Uses category icons from `CategoryNav`
- Shows term count for each deck
- Highlights "Saved Terms" if user has saved items

### 5. useFlashcardProgress Hook

LocalStorage persistence for:
- `masteredTerms: Set<string>` - IDs of terms user marked as "Got It"
- `lastStudyDate: string` - For potential daily streaks
- `totalSessionsCompleted: number` - Achievement tracking

```typescript
interface FlashcardProgress {
  masteredTermIds: string[];
  lastStudyDate: string | null;
  sessionsCompleted: number;
  streakDays: number;
}

function useFlashcardProgress() {
  // Read/write to localStorage
  // Returns: { progress, markMastered, resetProgress, ... }
}
```

---

## Design Specifications

### Card Styling (matches existing design language)

```text
┌─────────────────────────────────────────┐
│                                         │
│              ⚖️                         │  <- Category icon
│                                         │
│           נסח טאבו                       │  <- Hebrew (text-3xl font-bold)
│         (Nesach Tabu)                   │  <- Transliteration (italic)
│                                         │
│                                         │
│         [ Tap to flip ]                 │  <- Hint text
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Legal                           │    │  <- Category badge
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘

             ↓ Flip ↓

┌─────────────────────────────────────────┐
│                                         │
│      Land Registry Extract              │  <- English (text-2xl font-semibold)
│                                         │
│   "The official document showing        │
│    property ownership history"          │  <- Simple explanation
│                                         │
│   When You'll See This:                 │
│   "Before making an offer, you'll       │
│    want to verify ownership"            │  <- Usage context
│                                         │
└─────────────────────────────────────────┘
```

### Color Palette (using existing design tokens)
- Card background: `bg-card`
- Hebrew text: `text-primary` (brand blue)
- English text: `text-foreground`
- Explanations: `text-muted-foreground`
- Progress bar: Primary color (existing `Progress` component)
- Celebration: Blue-tinted confetti (matching existing celebration patterns)

### Mobile Gestures
- **Tap card**: Flip
- **Swipe left**: "Still Learning" + next card
- **Swipe right**: "Got It!" + next card (with haptic if available)
- Uses Embla carousel for consistent swipe feel

### Responsive Behavior
- Mobile: Fullscreen modal with gesture controls
- Desktop: Centered dialog (max-w-lg), keyboard shortcuts enabled

---

## Gamification Elements

### Streak Counter
- Consecutive "Got It" answers in a session
- Displayed as 🔥 with count
- Resets on "Still Learning"

### Session Completion
- Confetti celebration (using existing `canvas-confetti` pattern)
- Summary stats: "You mastered 15/20 terms!"
- Encouragement: "Great progress! 8 terms left to review."

### Progress Persistence
- "Mastered" terms are remembered across sessions
- Filter option: "Review terms I'm still learning"
- Total mastery progress shown on glossary page

---

## Accessibility

- `aria-label` on flip cards
- Keyboard navigation: Space to flip, Left/Right arrows
- Focus trapping within modal
- Screen reader announcements for card flips

---

## Entry Points

### Primary: Hero Section
Add a prominent "Study Mode" button next to the search:

```text
┌─────────────────────────────────────────┐
│         📚 Hebrew Real Estate           │
│              Glossary                   │
│                                         │
│  Master the terms you'll encounter...   │
│                                         │
│  [ 🔍 Search terms...              ]    │
│                                         │
│  [ 🎴 Study with Flashcards ]           │  <- NEW
│                                         │
└─────────────────────────────────────────┘
```

### Secondary: Category Nav
Add "Practice" as a category option alongside "All Terms" and "Saved".

---

## Implementation Summary

| Component | Lines (estimate) | Complexity |
|-----------|-----------------|------------|
| FlashcardStudyModal.tsx | ~250 | Medium |
| Flashcard.tsx | ~120 | Medium (animation) |
| FlashcardProgress.tsx | ~50 | Low |
| FlashcardDeckSelector.tsx | ~100 | Low |
| useFlashcardProgress.ts | ~60 | Low |
| GlossaryHero.tsx changes | +10 | Low |
| Glossary.tsx changes | +20 | Low |

Total: ~610 lines of new/modified code

---

## Future Enhancements (Not in Initial Scope)

- Spaced repetition algorithm (show "Still Learning" cards more frequently)
- Audio pronunciation for Hebrew terms
- Daily study reminders
- Leaderboard for logged-in users
- "Term of the Day" widget on homepage

