
# Complete Glossary Page Redesign

## Current Issues
- Generic, overwhelming layout that doesn't match site's premium feel
- No visual hierarchy - all terms look the same
- No contextual guidance for users (no "Warm Professional" brand voice)
- Poor search UX - users have to scroll through everything
- Missing the educational dotted-tooltip pattern used elsewhere
- No journey context - doesn't help users find terms they actually need
- Misses the mobile carousel patterns used on Tools/Guides/Areas pages

## Design Philosophy

Following the established patterns from Tools, Guides, Areas, and Principles pages:
1. **Gradient hero header** with centered title and supportive subtitle
2. **Journey-based organization** (like Tools page) - group terms by when users encounter them
3. **Category quick-nav** (like Areas page) - sticky icon buttons to jump to sections
4. **Mobile carousels** (like Guides/Tools) - horizontal swipe instead of infinite scroll
5. **Warm Professional voice** - contextual hints and guidance
6. **Educational tooltips** - dotted underlines that teach on hover
7. **Clean card design** - matching the ToolCard and GuideCard patterns

## Proposed Structure

### 1. Hero Section
```text
+--------------------------------------------------+
|  bg-gradient-to-b from-primary/5 to-background   |
|                                                   |
|      [Book icon]  Hebrew Real Estate Glossary     |
|                                                   |
|   "Master the terms you'll encounter — so you    |
|   feel confident in every conversation."          |
|                                                   |
|   [4 terms] · [Legal, Tax, Mortgage, Property]   |
|                                                   |
|          [=== Search Input ===]                  |
+--------------------------------------------------+
```

### 2. Journey Context Selector (Like Tools Page)
Quick-access buttons showing WHEN users need these terms:
- **Before You Start**: Basic terms everyone should know
- **During Research**: Terms you'll see in listings
- **Making an Offer**: Contract and negotiation terms  
- **Closing & After**: Registration and ownership terms

### 3. Category Quick-Nav (Like Areas Page)
Horizontal scrollable category buttons with icons:
- All Terms | Saved | Legal | Tax | Mortgage | Property

### 4. Term Cards - Complete Redesign
Each term displayed in a premium card format matching site's design:

```text
+-----------------------------------------------+
| [Icon]  קבלן                          [Save]  |
|         (Kablan)                              |
|                                               |
| Developer / Contractor                        |
|                                               |
| Company building new residential projects     |
|                                               |
| [Legal tag]              [Expand ▼]          |
+-----------------------------------------------+
```

Expanded state:
```text
+-----------------------------------------------+
| [Icon]  קבלן                          [★]     |
|         (Kablan)                              |
|                                               |
| Developer / Contractor                        |
|------------------------------------------------
| When You'll See This                          |
| New construction purchase discussions         |
|                                               |
| What It Means                                 |
| When buying from developer: check their       |
| track record, financial stability...          |
|                                               |
| [💡 Pro Tip card with primary/5 background]   |
| Research the Kablan online - check for...     |
+-----------------------------------------------+
```

### 5. Mobile Experience
- Term cards in horizontal carousels per category (like Guides page)
- CarouselDots navigation
- Sticky search bar
- Category tabs as horizontal scrollable pills

### 6. Supporting Elements
- **GuestSignupNudge**: "Create a free account to save terms and build your personal vocabulary list"
- **SupportFooter**: "Still confused about a term? [Ask us] — we'll explain it in plain English"
- **Contextual hints**: "Most buyers learn these first" badges on essential terms

## File Changes

| File | Change |
|------|--------|
| `src/pages/Glossary.tsx` | Complete rewrite with new structure |

## Technical Implementation

### New Component Structure in Glossary.tsx:

1. **GlossaryHero**: Gradient header with search
2. **JourneyContextSelector**: 4 buttons like Tools page
3. **CategoryQuickNav**: Horizontal icon nav like Areas page
4. **GlossaryTermCard**: Premium card matching site design language
5. **GlossaryCarousel**: Mobile carousel wrapper using embla-carousel-react

### Key Patterns to Match:
- Use `motion.div` with `initial/animate` for stagger animations
- Match gradient: `bg-gradient-to-b from-primary/5 to-background`
- Match card hover: `hover:shadow-lg hover:border-primary/30`
- Match icon containers: `p-3 rounded-xl bg-primary/10`
- Match section headers: `text-xl font-semibold`
- Match badges: `bg-primary/10 text-primary`

### Journey Mapping for Terms:
Create a mapping of which terms appear at which stage (derived from usage_context field):
- **Before You Start**: Tabu, Nesach Tabu, Orech Din
- **During Research**: Arnona, property types, measurements
- **Making an Offer**: Hearat Azhara, contract terms
- **Closing & After**: Hiyun, registration terms

### Enhanced Search:
- Debounced search with 300ms delay
- Search across hebrew_term, english_term, transliteration, simple_explanation
- Show search results in a clean dropdown or inline filtered view

## Mobile Considerations
- Use `useIsMobile()` hook
- Categories as horizontal scrollable TabsList
- Term cards in carousels per category (like Guides page)
- Sticky search bar at top
- Bottom padding for mobile nav (`mb-bottom-nav`)
